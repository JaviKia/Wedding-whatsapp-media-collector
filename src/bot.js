const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const QRCode = require('qrcode');
const fs = require('fs-extra');
const path = require('path');
const moment = require('moment');
const { execSync } = require('child_process');
const { GoogleDriveUploader } = require('./googleDrive');
const { generateWeddingQR } = require('./qrGenerator');
const config = require('./configLoader');

class WeddingMediaBot {
    constructor() {
        this.client = new Client({
            authStrategy: new LocalAuth(),
            puppeteer: {
                headless: true,
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            }
        });
        
        this.driveUploader = config.isGoogleDriveEnabled() ? new GoogleDriveUploader() : null;
        this.mediaFolder = path.join(__dirname, '../media');
        this.weddingDate = moment(config.get('WEDDING_DATE'));
        
        // Track guests who have already sent media to avoid spam notifications
        this.guestsWhoSentMedia = new Set();
        
        // Track when the bot started to filter old photos
        this.botStartTime = moment();
        console.log(`🕒 Bot started at: ${this.botStartTime.format('YYYY-MM-DD HH:mm:ss')}`);
        console.log('📸 Only photos/videos taken after this time will be synced to Google Drive');
        
        this.setupClient();
        this.ensureMediaFolder();
        
        // Validate configuration
        const validation = config.validate();
        if (!validation.isValid) {
            console.error('❌ Configuration errors:');
            validation.errors.forEach(error => console.error(`   - ${error}`));
            console.log('\n💡 Run "npm run setup" to fix configuration issues.\n');
        }
    }

    async ensureMediaFolder() {
        if (config.shouldSaveLocally()) {
            await fs.ensureDir(this.mediaFolder);
            await fs.ensureDir(path.join(this.mediaFolder, 'photos'));
            await fs.ensureDir(path.join(this.mediaFolder, 'videos'));
        }
    }

    async uploadQRToRootDrive(qrPath) {
        if (!config.isGoogleDriveEnabled() || !this.driveUploader) {
            return null;
        }

        try {
            // Create QR folder in root if it doesn't exist
            const qrFolderId = await this.driveUploader.createQRFolder();
            
            // Upload the QR file to the root QR folder
            const qrFileName = path.basename(qrPath);
            const uploadResult = await this.driveUploader.uploadQRFile(qrPath, qrFileName);
            
            console.log(`☁️ QR uploaded to Google Drive root: ${qrFileName}`);
            console.log(`🔗 QR folder: https://drive.google.com/drive/folders/${qrFolderId}`);
            
            return uploadResult;
        } catch (error) {
            console.error('❌ Error uploading QR to Google Drive root:', error.message);
            throw error;
        }
    }

    setupClient() {
        this.client.on('qr', async (qr) => {
            console.log('\n🎉 WEDDING MEDIA COLLECTOR BOT 🎉');
            console.log('Scan this QR code with WhatsApp Web to connect your bot:\n');
            qrcode.generate(qr, { small: true });
            
            // Save QR code as PNG file
            try {
                const qrFolder = path.join(__dirname, '../qr-codes');
                await fs.ensureDir(qrFolder);
                
                const timestamp = moment().format('YYYY-MM-DD_HH-mm-ss');
                const qrPath = path.join(qrFolder, `whatsapp-qr-${timestamp}.png`);
                
                await QRCode.toFile(qrPath, qr, {
                    width: 300,
                    margin: 2,
                    color: {
                        dark: '#000000',
                        light: '#FFFFFF'
                    }
                });
                
                console.log(`\n💾 QR code saved as: ${qrPath}`);
                console.log('📱 You can download this QR file to scan with WhatsApp');
                
                // Upload QR to Google Drive root folder
                if (config.isGoogleDriveEnabled() && this.driveUploader) {
                    try {
                        await this.uploadQRToRootDrive(qrPath);
                        console.log('🌐 Check the "qr-codes" folder in your Google Drive root');
                    } catch (driveError) {
                        console.error('❌ Error uploading QR to Google Drive:', driveError.message);
                        console.log('📱 QR is still available locally');
                    }
                } else {
                    console.log('📁 Google Drive disabled - QR saved locally only');
                }
                
            } catch (error) {
                console.error('❌ Error saving QR code:', error);
            }
            
            // Generate QR for sharing with guests
            this.generateGuestQR();
        });

        this.client.on('ready', () => {
            console.log('\n✅ WhatsApp Bot is ready!');
            console.log('🎊 Wedding Media Collector is now active!');
            console.log('📱 Guests can now send photos and videos');
            
            // Print configuration
            config.printConfig();
            
            // Send a test message to yourself
            this.sendWelcomeMessage();
        });

        // Single message listener to handle all messages (incoming and outgoing)
        this.client.on('message_create', async (message) => {
            console.log(`🔍 Message_create event triggered - fromMe: ${message.fromMe}, hasMedia: ${message.hasMedia}, timestamp: ${message.timestamp}`);
            await this.handleMessage(message);
        });
    }

    async generateGuestQR() {
        try {
            const whatsappUrl = config.getWhatsAppUrl();
            await generateWeddingQR(whatsappUrl);
            console.log('\n🎯 Guest QR code generated! Check qr-codes/wedding-qr.png');
            
        } catch (error) {
            console.error('Error generating guest QR:', error);
        }
    }

    async sendWelcomeMessage() {
        try {
            const myNumber = this.client.info.wid.user;
            const coupleNames = config.get('COUPLE_NAMES');
            await this.client.sendMessage(`${myNumber}@c.us`, 
                `🎊 *Wedding Media Collector Bot Activated!* 🎊\n\n` +
                `💒 Wedding: ${coupleNames}\n` +
                `📅 Date: ${config.get('WEDDING_DATE')}\n\n` +
                `✅ Bot is ready to receive photos and videos\n` +
                `📱 Share the QR code with your guests\n` +
                `${config.isGoogleDriveEnabled() ? '☁️ All media will be automatically saved to Google Drive' : '💾 Media will be saved locally'}\n\n` +
                `¡Felicidades por tu boda! 💒`
            );
        } catch (error) {
            console.log('Could not send welcome message:', error.message);
        }
    }

    async handleMessage(message) {
        let contact;
        let chat;
        
        try {
            console.log(`\n🚀 === PROCESSING MESSAGE ===`);
            console.log(`📱 From me: ${message.fromMe}`);
            console.log(`📷 Has media: ${message.hasMedia}`);
            console.log(`🕒 Timestamp: ${message.timestamp} (${moment.unix(message.timestamp).format('YYYY-MM-DD HH:mm:ss')})`);
            
            contact = await message.getContact();
            chat = await message.getChat();
            
            console.log(`👤 Contact: ${contact.name || contact.number}`);
            console.log(`💬 Chat is group: ${chat.isGroup}`);
            
            // Apply group filtering
            if (config.shouldProcessGroupsOnly() && !chat.isGroup) {
                console.log('⏭️ Skipping individual chat (GROUPS_ONLY=true)');
                return;
            }
            
            // Apply wedding group filtering
            if (config.shouldProcessWeddingGroupOnly() && chat.isGroup) {
                const weddingGroupId = config.getWeddingGroupId();
                if (weddingGroupId) {
                    // Extract group ID from chat
                    const chatGroupId = chat.id._serialized.split('@')[0];
                    console.log(`🔍 Chat Group ID: ${chatGroupId}`);
                    console.log(`🔍 Wedding Group ID: ${weddingGroupId}`);
                    
                    if (!chatGroupId.includes(weddingGroupId)) {
                        console.log('⏭️ Skipping non-wedding group (WEDDING_GROUP_ONLY=true)');
                        return;
                    } else {
                        console.log('✅ Processing message from wedding group');
                    }
                } else {
                    console.log('⚠️ WEDDING_GROUP_ONLY=true but no group URL configured');
                }
            }
            
            if (message.fromMe) {
                console.log(`🤖 Processing message from bot owner: ${contact.name || contact.number}`);
            }
            
            // Only process messages with media
            if (!message.hasMedia) {
                console.log('📝 Message has no media - handling as text message');
                // Send friendly response for text messages
                if (!message.fromMe && config.areGuestNotificationsEnabled()) {
                    const coupleNames = config.get('COUPLE_NAMES');
                    if (chat.isGroup) {
                        // In groups, only respond to @mentions to avoid spam
                        const mentionedIds = await message.getMentions();
                        const botNumber = this.client.info.wid.user;
                        const isMentioned = mentionedIds.some(contact => contact.id.user === botNumber);
                        
                        if (isMentioned) {
                            await message.reply(
                                `📸 ¡Hola! Envía tus *fotos* 📷 y *videos* 🎥 de la boda de ${coupleNames}.\n` +
                                'Se guardarán automáticamente. ¡Muchas gracias! 💕'
                            );
                            console.log('📤 Sent guidance message for group mention');
                        }
                    } else {
                        // Individual chat - respond normally
                        await message.reply(
                            `📸 ¡Hola! Gracias por participar en la boda de ${coupleNames}.\n\n` +
                            'Envía tus *fotos* 📷 y *videos* 🎥 de la celebración.\n' +
                            'Se guardarán automáticamente. ¡Muchas gracias! 💕'
                        );
                        console.log('📤 Sent guidance message for text');
                    }
                }
                return;
            }

            console.log(`\n📨 New media from: ${contact.name || contact.number}`);
            
            // Check if this is a recent photo (taken after bot started) FIRST
            const messageTimestamp = moment.unix(message.timestamp);
            const isRecentPhoto = messageTimestamp.isAfter(this.botStartTime);
            
            console.log(`⏰ Message time: ${messageTimestamp.format('YYYY-MM-DD HH:mm:ss')}`);
            console.log(`⏰ Bot started: ${this.botStartTime.format('YYYY-MM-DD HH:mm:ss')}`);
            console.log(`📅 Is recent photo: ${isRecentPhoto ? 'YES' : 'NO (skipping completely)'}`);

            // Skip old photos completely - don't process or send confirmations
            if (!isRecentPhoto) {
                console.log(`⏭️ Skipped processing: Old photo/video from ${contact.name || contact.number} (taken before bot started)`);
                return;
            }
            
            console.log('📥 Downloading media...');
            const media = await message.downloadMedia();
            if (!media) {
                console.log('❌ Failed to download media');
                return;
            }
            
            console.log(`📊 Media type: ${media.mimetype}`);

            // Check file size
            const fileSizeKB = Buffer.from(media.data, 'base64').length / 1024;
            const fileSizeMB = fileSizeKB / 1024;
            const maxSizeMB = config.getMaxFileSizeMB();
            
            console.log(`📏 File size: ${fileSizeMB.toFixed(2)}MB (max: ${maxSizeMB}MB)`);
            
            if (fileSizeMB > maxSizeMB) {
                if (config.areGuestNotificationsEnabled()) {
                    // Send file size error directly to guest's individual chat
                    const guestChatId = `${contact.number || contact.id.user}@c.us`;
                    await this.client.sendMessage(guestChatId,
                        `❌ El archivo es demasiado grande (${fileSizeMB.toFixed(1)}MB).\n` +
                        `Máximo permitido: ${maxSizeMB}MB.\n` +
                        'Por favor, envía un archivo más pequeño. 🙏'
                    );
                }
                console.log(`❌ File too large - rejected (${fileSizeMB.toFixed(1)}MB > ${maxSizeMB}MB)`);
                return;
            }

            console.log('💾 Proceeding to save media...');
            // Save media locally and upload to Drive (only for recent photos now)
            await this.saveMedia(media, contact, message);
            
            // Only send confirmation for first media from this guest (and only for recent photos)
            const guestId = contact.number || contact.id.user;
            console.log(`🆔 Guest ID: ${guestId}`);
            console.log(`🎯 Already welcomed: ${this.guestsWhoSentMedia.has(guestId)}`);
            
            if (!this.guestsWhoSentMedia.has(guestId)) {
                this.guestsWhoSentMedia.add(guestId);
                
                // Only send notification if guest notifications are enabled AND it's not from bot owner
                if (config.areGuestNotificationsEnabled() && !message.fromMe) {
                    // Send welcome message directly to guest's individual chat, not as reply to group
                    const guestChatId = `${contact.number || contact.id.user}@c.us`;
                    await this.client.sendMessage(guestChatId,
                        '✅ ¡Recibido! Tus fotos y videos se guardan automáticamente.\n' +
                        `${config.isGoogleDriveEnabled() ? '☁️ Las fotos tomadas desde que empezó la boda se sincronizan en la nube.' : '💾 Se guardan localmente.'}\n` +
                        '¡Gracias por compartir estos momentos especiales! 💕\n\n' +
                        '📸 Puedes seguir enviando más fotos sin preocuparte.'
                    );
                    
                    console.log(`📱 Sent welcome confirmation directly to ${contact.name || contact.number}`);
                } else if (message.fromMe) {
                    console.log(`🤖 Photo from bot owner processed - no notification sent to self`);
                } else {
                    console.log(`🔕 Guest notifications disabled - skipped welcome confirmation for ${contact.name || contact.number}`);
                }
            } else {
                if (message.fromMe) {
                    console.log(`🤖 Additional photo from bot owner processed (${contact.name || contact.number})`);
                } else {
                    console.log(`📸 Media received from ${contact.name || contact.number} (no notification - already welcomed)`);
                }
            }
            
            console.log(`✅ === MESSAGE PROCESSING COMPLETE ===\n`);

        } catch (error) {
            console.error('❌ Error handling message:', error);
            try {
                if (config.areGuestNotificationsEnabled() && !message.fromMe) {
                    // Send error message directly to guest's individual chat
                    const guestChatId = `${contact.number || contact.id.user}@c.us`;
                    await this.client.sendMessage(guestChatId,
                        '❌ Hubo un problema al procesar tu archivo.\n' +
                        'Por favor, inténtalo de nuevo. ¡Gracias! 🙏'
                    );
                }
            } catch (replyError) {
                console.error('Error sending error message:', replyError);
            }
        }
    }

    async saveMedia(media, contact, message) {
        try {
            const timestamp = moment().format('YYYY-MM-DD_HH-mm-ss');
            const contactName = (contact.name || contact.number).replace(/[^a-zA-Z0-9]/g, '-');
            
            let filename, subfolder;
            
            if (media.mimetype.startsWith('image/')) {
                const ext = media.mimetype.split('/')[1];
                filename = `${timestamp}_${contactName}.${ext}`;
                subfolder = 'photos';
            } else if (media.mimetype.startsWith('video/')) {
                const ext = media.mimetype.split('/')[1];
                filename = `${timestamp}_${contactName}.${ext}`;
                subfolder = 'videos';
            } else {
                console.log('❌ Unsupported media type:', media.mimetype);
                return;
            }

            let localPath = null;

            // Save locally if configured
            if (config.shouldSaveLocally()) {
                localPath = path.join(this.mediaFolder, subfolder, filename);
                await fs.writeFile(localPath, media.data, 'base64');
                console.log(`💾 Saved locally: ${localPath}`);
            }

            // Upload to Google Drive
            if (config.isGoogleDriveEnabled() && this.driveUploader) {
                if (localPath) {
                    await this.driveUploader.uploadFile(localPath, filename, subfolder);
                } else {
                    // If not saving locally, create temp file for upload
                    const tempPath = path.join(__dirname, '../temp', filename);
                    await fs.ensureDir(path.dirname(tempPath));
                    await fs.writeFile(tempPath, media.data, 'base64');
                    await this.driveUploader.uploadFile(tempPath, filename, subfolder);
                    await fs.remove(tempPath);
                }
                console.log(`☁️ Uploaded to Drive: ${filename}`);
            }

            // Delete local file after upload if configured
            if (localPath && config.shouldDeleteAfterUpload() && config.isGoogleDriveEnabled()) {
                await fs.remove(localPath);
                console.log(`🗑️ Deleted local file: ${filename}`);
            }

        } catch (error) {
            console.error('Error saving media:', error);
            throw error;
        }
    }

    async start() {
        console.log('🚀 Starting Wedding Media Collector Bot...');
        await this.client.initialize();
    }
}

// Start the bot
if (require.main === module) {
    const bot = new WeddingMediaBot();
    bot.start().catch(console.error);
}

module.exports = WeddingMediaBot; 