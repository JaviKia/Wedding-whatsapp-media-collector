const fs = require('fs-extra');
const path = require('path');
const readline = require('readline');

class WeddingSetup {
    constructor() {
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
    }

    async question(query) {
        return new Promise(resolve => this.rl.question(query, resolve));
    }

    async setup() {
        console.log('\n🎉 WEDDING MEDIA COLLECTOR SETUP 🎉\n');
        console.log('Let\'s configure your wedding photo/video collection system!\n');

        try {
            // Get wedding details
            const coupleNames = await this.question('👫 Enter the couple\'s names (e.g., "María & José"): ');
            const weddingDate = await this.question('📅 Enter wedding date (YYYY-MM-DD): ');
            const phoneNumber = await this.question('📱 Enter your WhatsApp number (with country code, e.g., +34612345678): ');

            // Create environment configuration
            await this.createEnvConfig(coupleNames, weddingDate, phoneNumber);

            // Create directories
            await this.createDirectories();

            // Show Google Drive setup instructions
            await this.showGoogleDriveInstructions();

            // Create a test QR code
            await this.createTestQR(phoneNumber, coupleNames);

            console.log('\n✅ Setup completed successfully!');
            console.log('\n📋 NEXT STEPS:');
            console.log('1. Set up Google Drive credentials (see instructions above)');
            console.log('2. Install dependencies: npm install');
            console.log('3. Start the bot: npm start');
            console.log('4. Scan QR with WhatsApp Web to connect your bot');
            console.log('5. Share the wedding QR code with your guests!');
            console.log('\n🎊 ¡Felicidades por tu boda!');

        } catch (error) {
            console.error('Setup error:', error);
        } finally {
            this.rl.close();
        }
    }

    async createEnvConfig(coupleNames, weddingDate, phoneNumber) {
        const envContent = `# Wedding Media Collector Configuration
# Generated on ${new Date().toISOString()}

# Wedding Details
COUPLE_NAMES="${coupleNames}"
WEDDING_DATE="${weddingDate}"
WEDDING_WHATSAPP_NUMBER="${phoneNumber}"

# Google Drive Configuration
# Place your google-credentials.json file in the config/ directory
GOOGLE_DRIVE_ENABLED=true

# Bot Configuration
BOT_NAME="Wedding Media Bot"
WELCOME_MESSAGE="🎉 ¡Hola! Soy parte de la boda de ${coupleNames}. Comparte tus fotos y videos de la celebración aquí. 📸📹 ¡Muchas gracias por acompañarnos!"

# Media Settings
SAVE_LOCALLY=true
DELETE_AFTER_UPLOAD=false
MAX_FILE_SIZE_MB=25

# Optional: Webhook for notifications
# WEBHOOK_URL=https://your-webhook-url.com/wedding-media
`;

        await fs.writeFile('wedding.env', envContent);
        console.log('✅ Configuration saved to wedding.env');
    }

    async createDirectories() {
        const dirs = [
            'media',
            'media/photos',
            'media/videos',
            'qr-codes',
            'config',
            'logs'
        ];

        for (const dir of dirs) {
            await fs.ensureDir(dir);
        }

        console.log('✅ Created directory structure');
    }

    async showGoogleDriveInstructions() {
        console.log('\n📋 GOOGLE DRIVE SETUP INSTRUCTIONS:');
        console.log('1. Go to: https://console.cloud.google.com/');
        console.log('2. Create a new project or select existing one');
        console.log('3. Enable Google Drive API');
        console.log('4. Create credentials (Service Account)');
        console.log('5. Download the JSON key file');
        console.log('6. Rename it to "google-credentials.json"');
        console.log('7. Move it to the config/ directory');
        console.log('\nDetailed guide: https://developers.google.com/drive/api/quickstart/nodejs');
    }

    async createTestQR(phoneNumber, coupleNames) {
        try {
            const { generateWeddingQR } = require('./qrGenerator');
            
            const weddingMessage = encodeURIComponent(
                `🎉 ¡Hola! Soy parte de la boda de ${coupleNames}. ` +
                'Comparte tus fotos y videos de la celebración aquí. ' +
                '📸📹 ¡Muchas gracias por acompañarnos!'
            );
            
            const whatsappUrl = `https://wa.me/${phoneNumber}?text=${weddingMessage}`;
            
            await generateWeddingQR(whatsappUrl);
            console.log('✅ Test QR code generated in qr-codes/ directory');
            
        } catch (error) {
            console.log('⚠️  Could not generate test QR code:', error.message);
        }
    }
}

// Run setup if called directly
if (require.main === module) {
    const setup = new WeddingSetup();
    setup.setup().catch(console.error);
}

module.exports = WeddingSetup; 