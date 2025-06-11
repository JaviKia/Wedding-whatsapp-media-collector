const fs = require('fs-extra');
const path = require('path');

class ConfigLoader {
    constructor() {
        this.config = {};
        this.loadConfig();
    }

    loadConfig() {
        // Load from wedding.env file if it exists
        const envPath = path.join(__dirname, '../wedding.env');
        
        if (fs.existsSync(envPath)) {
            this.loadFromFile(envPath);
        }

        // Override with process.env if available
        this.loadFromEnvironment();

        // Set defaults
        this.setDefaults();
    }

    loadFromFile(filePath) {
        try {
            const content = fs.readFileSync(filePath, 'utf8');
            const lines = content.split('\n');

            for (const line of lines) {
                // Skip comments and empty lines
                if (line.trim().startsWith('#') || !line.trim()) continue;
                
                const [key, ...valueParts] = line.split('=');
                if (key && valueParts.length > 0) {
                    const value = valueParts.join('=').replace(/^"|"$/g, ''); // Remove quotes
                    this.config[key.trim()] = value.trim();
                }
            }
        } catch (error) {
            console.warn('Could not load config file:', error.message);
        }
    }

    loadFromEnvironment() {
        const envVars = [
            'COUPLE_NAMES',
            'WEDDING_DATE',
            'WEDDING_WHATSAPP_NUMBER',
            'WEDDING_GROUP_INVITE_URL',
            'WEDDING_GROUP_ID',
            'OWNER_EMAIL',
            'GOOGLE_DRIVE_ENABLED',
            'BOT_NAME',
            'WELCOME_MESSAGE',
            'SAVE_LOCALLY',
            'DELETE_AFTER_UPLOAD',
            'MAX_FILE_SIZE_MB',
            'WEBHOOK_URL',
            'GUEST_NOTIFICATIONS_ENABLED',
            'SKIP_OWNER_SHARING',
            'GROUPS_ONLY',
            'WEDDING_GROUP_ONLY'
        ];

        for (const envVar of envVars) {
            if (process.env[envVar]) {
                this.config[envVar] = process.env[envVar];
            }
        }
    }

    setDefaults() {
        const defaults = {
            COUPLE_NAMES: 'Los Novios',
            WEDDING_DATE: new Date().toISOString().split('T')[0],
            WEDDING_WHATSAPP_NUMBER: '+1234567890',
            GOOGLE_DRIVE_ENABLED: 'true',
            BOT_NAME: 'Wedding Media Bot',
            WELCOME_MESSAGE: '🎉 ¡Hola! Comparte tus fotos y videos de la celebración aquí. 📸📹 ¡Muchas gracias!',
            SAVE_LOCALLY: 'true',
            DELETE_AFTER_UPLOAD: 'false',
            MAX_FILE_SIZE_MB: '25',
            GUEST_NOTIFICATIONS_ENABLED: 'true'
        };

        for (const [key, defaultValue] of Object.entries(defaults)) {
            if (!this.config[key]) {
                this.config[key] = defaultValue;
            }
        }
    }

    get(key, defaultValue = null) {
        return this.config[key] || defaultValue;
    }

    getBoolean(key, defaultValue = false) {
        const value = this.get(key);
        if (typeof value === 'string') {
            return value.toLowerCase() === 'true';
        }
        return value || defaultValue;
    }

    getNumber(key, defaultValue = 0) {
        const value = this.get(key);
        const parsed = parseInt(value, 10);
        return isNaN(parsed) ? defaultValue : parsed;
    }

    getWeddingMessage() {
        const coupleNames = this.get('COUPLE_NAMES');
        const customMessage = this.get('WELCOME_MESSAGE');
        
        return customMessage.replace('[NOMBRES]', coupleNames);
    }

    getWhatsAppUrl() {
        const groupInviteUrl = this.get('WEDDING_GROUP_INVITE_URL');
        
        // If group invite URL is provided, use it instead of individual chat
        if (groupInviteUrl && groupInviteUrl.startsWith('https://chat.whatsapp.com/')) {
            return groupInviteUrl;
        }
        
        // Fallback to individual chat with pre-filled message
        const phoneNumber = this.get('WEDDING_WHATSAPP_NUMBER');
        const message = this.getWeddingMessage();
        
        return `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    }

    isUsingGroupChat() {
        const groupInviteUrl = this.get('WEDDING_GROUP_INVITE_URL');
        return groupInviteUrl && groupInviteUrl.startsWith('https://chat.whatsapp.com/');
    }

    isGoogleDriveEnabled() {
        return this.getBoolean('GOOGLE_DRIVE_ENABLED', true);
    }

    shouldSaveLocally() {
        return this.getBoolean('SAVE_LOCALLY', true);
    }

    shouldDeleteAfterUpload() {
        return this.getBoolean('DELETE_AFTER_UPLOAD', false);
    }

    areGuestNotificationsEnabled() {
        return this.getBoolean('GUEST_NOTIFICATIONS_ENABLED', true);
    }

    shouldSkipOwnerSharing() {
        return this.getBoolean('SKIP_OWNER_SHARING', false);
    }

    shouldProcessGroupsOnly() {
        return this.getBoolean('GROUPS_ONLY', false);
    }

    shouldProcessWeddingGroupOnly() {
        return this.getBoolean('WEDDING_GROUP_ONLY', false);
    }

    getWeddingGroupId() {
        return this.get('WEDDING_GROUP_ID');
    }

    getMaxFileSizeMB() {
        return this.getNumber('MAX_FILE_SIZE_MB', 25);
    }

    getOwnerEmail() {
        return this.get('OWNER_EMAIL');
    }

    // Validate configuration
    validate() {
        const errors = [];

        if (!this.get('WEDDING_WHATSAPP_NUMBER').startsWith('+')) {
            errors.push('WEDDING_WHATSAPP_NUMBER must include country code (e.g., +34612345678)');
        }

        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(this.get('WEDDING_DATE'))) {
            errors.push('WEDDING_DATE must be in YYYY-MM-DD format');
        }

        const groupUrl = this.get('WEDDING_GROUP_INVITE_URL');
        if (groupUrl && !groupUrl.startsWith('https://chat.whatsapp.com/')) {
            errors.push('WEDDING_GROUP_INVITE_URL must be a valid WhatsApp group invite link (https://chat.whatsapp.com/...)');
        }

        if (this.shouldProcessWeddingGroupOnly() && !this.getWeddingGroupId()) {
            errors.push('WEDDING_GROUP_ONLY=true requires WEDDING_GROUP_ID to be set');
        }

        const maxSize = this.getMaxFileSizeMB();
        if (maxSize < 1 || maxSize > 100) {
            errors.push('MAX_FILE_SIZE_MB must be between 1 and 100');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    // Print current configuration
    printConfig() {
        console.log('\n📋 Current Configuration:');
        console.log('========================');
        console.log(`👫 Couple: ${this.get('COUPLE_NAMES')}`);
        console.log(`📅 Wedding Date: ${this.get('WEDDING_DATE')}`);
        console.log(`📱 WhatsApp: ${this.get('WEDDING_WHATSAPP_NUMBER')}`);
        console.log(`💬 Using: ${this.isUsingGroupChat() ? 'Group Chat' : 'Individual Chat'}`);
        console.log(`🎯 Groups Only: ${this.shouldProcessGroupsOnly() ? 'Yes' : 'No'}`);
        console.log(`💒 Wedding Group Only: ${this.shouldProcessWeddingGroupOnly() ? 'Yes' : 'No'}`);
        console.log(`☁️  Google Drive: ${this.isGoogleDriveEnabled() ? 'Enabled' : 'Disabled'}`);
        console.log(`💾 Save Locally: ${this.shouldSaveLocally() ? 'Yes' : 'No'}`);
        console.log(`🗑️  Delete After Upload: ${this.shouldDeleteAfterUpload() ? 'Yes' : 'No'}`);
        console.log(`📏 Max File Size: ${this.getMaxFileSizeMB()}MB`);
        console.log(`🔔 Guest Notifications: ${this.areGuestNotificationsEnabled() ? 'Enabled' : 'Disabled'}`);
        console.log(`🔗 Skip Owner Sharing: ${this.shouldSkipOwnerSharing() ? 'Yes' : 'No'}`);
        console.log('========================\n');
    }
}

// Export singleton instance
module.exports = new ConfigLoader(); 