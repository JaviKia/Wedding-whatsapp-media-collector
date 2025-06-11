const moment = require('moment');
const fs = require('fs-extra');
const path = require('path');

// Mock external dependencies
jest.mock('whatsapp-web.js');
jest.mock('fs-extra');
jest.mock('../googleDrive');
jest.mock('../configLoader');
jest.mock('../qrGenerator');
jest.mock('qrcode-terminal');
jest.mock('qrcode');

const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const WeddingMediaBot = require('../bot');
const { GoogleDriveUploader } = require('../googleDrive');
const config = require('../configLoader');
const { generateWeddingQR } = require('../qrGenerator');
const qrcode = require('qrcode-terminal');
const QRCode = require('qrcode');

describe('WeddingMediaBot', () => {
    let bot;
    let mockClient;
    let mockMessage;
    let mockContact;
    let mockChat;
    let mockDriveUploader;

    beforeEach(() => {
        // Reset all mocks
        jest.clearAllMocks();

        // Mock config
        config.isGoogleDriveEnabled.mockReturnValue(true);
        config.shouldSaveLocally.mockReturnValue(true);
        config.shouldDeleteAfterUpload.mockReturnValue(false);
        config.getMaxFileSizeMB.mockReturnValue(25);
        config.get.mockImplementation((key) => {
            if (key === 'COUPLE_NAMES') return 'Laura y Javi';
            if (key === 'WEDDING_DATE') return '2025-06-15';
            return 'test-value';
        });
        config.areGuestNotificationsEnabled.mockReturnValue(true);
        config.validate.mockReturnValue({ isValid: true, errors: [] });
        config.printConfig.mockImplementation(() => {});
        config.shouldProcessGroupsOnly.mockReturnValue(false);
        config.shouldProcessWeddingGroupOnly.mockReturnValue(false);
        config.getWeddingGroupId.mockReturnValue(null);
        config.getWhatsAppUrl.mockReturnValue('https://wa.me/1234567890');

        // Mock WhatsApp client
        mockClient = {
            on: jest.fn(),
            initialize: jest.fn().mockResolvedValue(),
            sendMessage: jest.fn().mockResolvedValue(),
            info: { wid: { user: '1234567890' } }
        };
        Client.mockImplementation(() => mockClient);

        // Mock Google Drive uploader
        mockDriveUploader = {
            uploadFile: jest.fn().mockResolvedValue(),
            createQRFolder: jest.fn().mockResolvedValue('qr-folder-id'),
            uploadQRFile: jest.fn().mockResolvedValue({ id: 'file-id' })
        };
        GoogleDriveUploader.mockImplementation(() => mockDriveUploader);

        // Mock QR code generation
        qrcode.generate.mockImplementation(() => {});
        QRCode.toFile.mockResolvedValue();
        generateWeddingQR.mockResolvedValue();

        // Mock contact
        mockContact = {
            name: 'Test User',
            number: '34123456789',
            id: { user: '34123456789' }
        };

        // Mock chat
        mockChat = {
            isGroup: false,
            id: { _serialized: '34123456789@c.us' }
        };

        // Mock message
        mockMessage = {
            hasMedia: true,
            fromMe: false,
            timestamp: moment().unix(),
            getContact: jest.fn().mockResolvedValue(mockContact),
            getChat: jest.fn().mockResolvedValue(mockChat),
            getMentions: jest.fn().mockResolvedValue([]),
            downloadMedia: jest.fn().mockResolvedValue({
                mimetype: 'image/jpeg',
                data: 'base64data'
            }),
            reply: jest.fn().mockResolvedValue()
        };

        // Mock fs operations
        fs.ensureDir.mockResolvedValue();
        fs.writeFile.mockResolvedValue();
        fs.remove.mockResolvedValue();

        // Create bot instance
        bot = new WeddingMediaBot();
        bot.driveUploader = mockDriveUploader;
    });

    describe('Initialization and Setup', () => {
        test('should initialize bot with correct settings', () => {
            expect(bot.guestsWhoSentMedia).toBeInstanceOf(Set);
            expect(bot.guestsWhoSentMedia.size).toBe(0);
            expect(bot.botStartTime).toBeDefined();
            expect(moment.isMoment(bot.botStartTime)).toBe(true);
        });

        test('should setup WhatsApp client with event listeners', () => {
            expect(mockClient.on).toHaveBeenCalledWith('qr', expect.any(Function));
            expect(mockClient.on).toHaveBeenCalledWith('ready', expect.any(Function));
            expect(mockClient.on).toHaveBeenCalledWith('message_create', expect.any(Function));
        });

        test('should validate configuration on startup', () => {
            expect(config.validate).toHaveBeenCalled();
        });

        test('should handle invalid configuration', () => {
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
            config.validate.mockReturnValue({
                isValid: false,
                errors: ['Invalid wedding date', 'Missing couple names']
            });

            new WeddingMediaBot();

            expect(consoleSpy).toHaveBeenCalledWith('❌ Configuration errors:');
            consoleSpy.mockRestore();
        });
    });

    describe('QR Code Generation', () => {
        test('should handle QR event and generate QR codes', async () => {
            const qrHandler = mockClient.on.mock.calls.find(call => call[0] === 'qr')[1];
            const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

            await qrHandler('test-qr-string');

            expect(qrcode.generate).toHaveBeenCalledWith('test-qr-string', { small: true });
            expect(QRCode.toFile).toHaveBeenCalled();
            expect(generateWeddingQR).toHaveBeenCalledWith('https://wa.me/1234567890');
            expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('QR code saved as:'));

            consoleSpy.mockRestore();
        });

        test('should upload QR to Google Drive when enabled', async () => {
            const qrHandler = mockClient.on.mock.calls.find(call => call[0] === 'qr')[1];
            
            await qrHandler('test-qr-string');

            expect(mockDriveUploader.createQRFolder).toHaveBeenCalled();
            expect(mockDriveUploader.uploadQRFile).toHaveBeenCalled();
        });

        test('should handle QR upload errors gracefully', async () => {
            const qrHandler = mockClient.on.mock.calls.find(call => call[0] === 'qr')[1];
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
            
            mockDriveUploader.uploadQRFile.mockRejectedValue(new Error('Upload failed'));

            await qrHandler('test-qr-string');

            expect(consoleSpy).toHaveBeenCalledWith('❌ Error uploading QR to Google Drive:', 'Upload failed');
            consoleSpy.mockRestore();
        });

        test('should skip Google Drive upload when disabled', async () => {
            config.isGoogleDriveEnabled.mockReturnValue(false);
            bot.driveUploader = null;
            
            const qrHandler = mockClient.on.mock.calls.find(call => call[0] === 'qr')[1];
            const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

            await qrHandler('test-qr-string');

            expect(consoleSpy).toHaveBeenCalledWith('📁 Google Drive disabled - QR saved locally only');
            consoleSpy.mockRestore();
        });

        test('should generate guest QR code', async () => {
            await bot.generateGuestQR();

            expect(generateWeddingQR).toHaveBeenCalledWith('https://wa.me/1234567890');
        });

        test('should handle guest QR generation errors', async () => {
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
            generateWeddingQR.mockRejectedValue(new Error('QR generation failed'));

            await bot.generateGuestQR();

            expect(consoleSpy).toHaveBeenCalledWith('Error generating guest QR:', expect.any(Error));
            consoleSpy.mockRestore();
        });
    });

    describe('WhatsApp Client Event Handlers', () => {
        test('should handle ready event', async () => {
            const readyHandler = mockClient.on.mock.calls.find(call => call[0] === 'ready')[1];
            const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

            await readyHandler();

            expect(consoleSpy).toHaveBeenCalledWith('\n✅ WhatsApp Bot is ready!');
            expect(config.printConfig).toHaveBeenCalled();
            expect(mockClient.sendMessage).toHaveBeenCalled(); // Welcome message

            consoleSpy.mockRestore();
        });

        test('should send welcome message on ready', async () => {
            const readyHandler = mockClient.on.mock.calls.find(call => call[0] === 'ready')[1];

            await readyHandler();

            expect(mockClient.sendMessage).toHaveBeenCalledWith(
                '1234567890@c.us',
                expect.stringContaining('🎊 *Wedding Media Collector Bot Activated!* 🎊')
            );
        });

        test('should handle welcome message sending errors', async () => {
            const readyHandler = mockClient.on.mock.calls.find(call => call[0] === 'ready')[1];
            const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
            
            mockClient.sendMessage.mockRejectedValue(new Error('Send failed'));

            await readyHandler();

            expect(consoleSpy).toHaveBeenCalledWith('Could not send welcome message:', 'Send failed');
            consoleSpy.mockRestore();
        });
    });

    describe('Group Filtering Logic', () => {
        beforeEach(() => {
            bot.botStartTime = moment().subtract(1, 'hour');
            mockMessage.timestamp = moment().unix();
        });

        test('should skip individual chats when GROUPS_ONLY is enabled', async () => {
            config.shouldProcessGroupsOnly.mockReturnValue(true);
            mockChat.isGroup = false;

            const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

            await bot.handleMessage(mockMessage);

            expect(consoleSpy).toHaveBeenCalledWith('⏭️ Skipping individual chat (GROUPS_ONLY=true)');
            expect(mockMessage.downloadMedia).not.toHaveBeenCalled();

            consoleSpy.mockRestore();
        });

        test('should process group chats when GROUPS_ONLY is enabled', async () => {
            config.shouldProcessGroupsOnly.mockReturnValue(true);
            mockChat.isGroup = true;

            await bot.handleMessage(mockMessage);

            expect(mockMessage.downloadMedia).toHaveBeenCalled();
        });

        test('should skip non-wedding groups when WEDDING_GROUP_ONLY is enabled', async () => {
            config.shouldProcessWeddingGroupOnly.mockReturnValue(true);
            config.getWeddingGroupId.mockReturnValue('120363418316332442');
            mockChat.isGroup = true;
            mockChat.id._serialized = '999999999999999999@g.us';

            const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

            await bot.handleMessage(mockMessage);

            expect(consoleSpy).toHaveBeenCalledWith('⏭️ Skipping non-wedding group (WEDDING_GROUP_ONLY=true)');
            expect(mockMessage.downloadMedia).not.toHaveBeenCalled();

            consoleSpy.mockRestore();
        });

        test('should process wedding group when WEDDING_GROUP_ONLY is enabled', async () => {
            config.shouldProcessWeddingGroupOnly.mockReturnValue(true);
            config.getWeddingGroupId.mockReturnValue('120363418316332442');
            mockChat.isGroup = true;
            mockChat.id._serialized = '120363418316332442@g.us';

            const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

            await bot.handleMessage(mockMessage);

            expect(consoleSpy).toHaveBeenCalledWith('✅ Processing message from wedding group');
            expect(mockMessage.downloadMedia).toHaveBeenCalled();

            consoleSpy.mockRestore();
        });

        test('should warn when WEDDING_GROUP_ONLY is enabled but no group URL configured', async () => {
            config.shouldProcessWeddingGroupOnly.mockReturnValue(true);
            config.getWeddingGroupId.mockReturnValue(null);
            mockChat.isGroup = true;

            const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

            await bot.handleMessage(mockMessage);

            expect(consoleSpy).toHaveBeenCalledWith('⚠️ WEDDING_GROUP_ONLY=true but no group URL configured');

            consoleSpy.mockRestore();
        });
    });

    describe('Text Message Handling and Mention Detection', () => {
        beforeEach(() => {
            mockMessage.hasMedia = false;
            mockMessage.fromMe = false;
        });

        test('should respond to individual chat text messages', async () => {
            mockChat.isGroup = false;

            await bot.handleMessage(mockMessage);

            expect(mockMessage.reply).toHaveBeenCalledWith(
                expect.stringContaining('📸 ¡Hola! Gracias por participar en la boda de Laura y Javi')
            );
        });

        test('should not respond to group messages without mentions', async () => {
            mockChat.isGroup = true;
            mockMessage.getMentions.mockResolvedValue([]);

            await bot.handleMessage(mockMessage);

            expect(mockMessage.reply).not.toHaveBeenCalled();
        });

        test('should respond to group messages with bot mentions', async () => {
            mockChat.isGroup = true;
            const botMention = { id: { user: '1234567890' } };
            mockMessage.getMentions.mockResolvedValue([botMention]);

            const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

            await bot.handleMessage(mockMessage);

            expect(mockMessage.reply).toHaveBeenCalledWith(
                expect.stringContaining('📸 ¡Hola! Envía tus *fotos* 📷 y *videos* 🎥')
            );
            expect(consoleSpy).toHaveBeenCalledWith('📤 Sent guidance message for group mention');

            consoleSpy.mockRestore();
        });

        test('should not respond to group messages with other user mentions', async () => {
            mockChat.isGroup = true;
            const otherMention = { id: { user: '9876543210' } };
            mockMessage.getMentions.mockResolvedValue([otherMention]);

            await bot.handleMessage(mockMessage);

            expect(mockMessage.reply).not.toHaveBeenCalled();
        });

        test('should not respond to own text messages', async () => {
            mockMessage.fromMe = true;
            mockChat.isGroup = false;

            await bot.handleMessage(mockMessage);

            expect(mockMessage.reply).not.toHaveBeenCalled();
        });

        test('should handle mentions detection errors gracefully', async () => {
            mockChat.isGroup = true;
            mockMessage.getMentions.mockRejectedValue(new Error('Mention detection failed'));

            const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

            await bot.handleMessage(mockMessage);

            expect(consoleErrorSpy).toHaveBeenCalledWith('❌ Error handling message:', expect.any(Error));

            consoleErrorSpy.mockRestore();
        });

        test('should skip text message guidance when notifications disabled', async () => {
            config.areGuestNotificationsEnabled.mockReturnValue(false);
            mockChat.isGroup = false;

            await bot.handleMessage(mockMessage);

            expect(mockMessage.reply).not.toHaveBeenCalled();
        });
    });

    describe('Bot Owner Messages', () => {
        beforeEach(() => {
            bot.botStartTime = moment().subtract(1, 'hour');
            mockMessage.timestamp = moment().unix();
            mockMessage.fromMe = true;
        });

        test('should process media from bot owner without notifications', async () => {
            const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

            await bot.handleMessage(mockMessage);

            expect(consoleSpy).toHaveBeenCalledWith('🤖 Processing message from bot owner: Test User');
            expect(mockMessage.downloadMedia).toHaveBeenCalled();
            expect(mockClient.sendMessage).not.toHaveBeenCalled(); // No notification to self

            consoleSpy.mockRestore();
        });

        test('should track additional photos from bot owner', async () => {
            const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

            // First photo
            await bot.handleMessage(mockMessage);
            
            // Second photo from same owner
            await bot.handleMessage(mockMessage);

            expect(consoleSpy).toHaveBeenCalledWith('🤖 Additional photo from bot owner processed (Test User)');

            consoleSpy.mockRestore();
        });
    });

    describe('Start Method and Initialization Flows', () => {
        test('should start the bot and initialize client', async () => {
            const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

            await bot.start();

            expect(consoleSpy).toHaveBeenCalledWith('🚀 Starting Wedding Media Collector Bot...');
            expect(mockClient.initialize).toHaveBeenCalled();

            consoleSpy.mockRestore();
        });

        test('should handle initialization errors', async () => {
            const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
            mockClient.initialize.mockRejectedValue(new Error('Initialization failed'));

            await expect(bot.start()).rejects.toThrow('Initialization failed');

            consoleErrorSpy.mockRestore();
        });

        test('should ensure media folders are created', async () => {
            await bot.ensureMediaFolder();

            expect(fs.ensureDir).toHaveBeenCalledWith(expect.stringContaining('media'));
            expect(fs.ensureDir).toHaveBeenCalledWith(expect.stringContaining('photos'));
            expect(fs.ensureDir).toHaveBeenCalledWith(expect.stringContaining('videos'));
        });

        test('should skip folder creation when local save is disabled', async () => {
            // Reset mocks and configure for local save disabled
            jest.clearAllMocks();
            config.shouldSaveLocally.mockReturnValue(false);
            config.isGoogleDriveEnabled.mockReturnValue(true);
            config.shouldDeleteAfterUpload.mockReturnValue(false);
            config.getMaxFileSizeMB.mockReturnValue(25);
            config.get.mockImplementation((key) => {
                if (key === 'COUPLE_NAMES') return 'Laura y Javi';
                if (key === 'WEDDING_DATE') return '2025-06-15';
                return 'test-value';
            });
            config.areGuestNotificationsEnabled.mockReturnValue(true);
            config.validate.mockReturnValue({ isValid: true, errors: [] });
            
            const newBot = new WeddingMediaBot(); // Create new instance with disabled setting
            
            await newBot.ensureMediaFolder();

            expect(fs.ensureDir).not.toHaveBeenCalled();
        });
    });

    describe('Timestamp-based filtering', () => {
        test('should skip old photos completely', async () => {
            // Set bot start time to "now"
            bot.botStartTime = moment();
            
            // Set message timestamp to 1 hour ago (old photo)
            const oldTimestamp = moment().subtract(1, 'hour').unix();
            mockMessage.timestamp = oldTimestamp;

            // Spy on console.log to verify logging
            const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

            await bot.handleMessage(mockMessage);

            // Verify old photo was skipped completely
            expect(mockMessage.downloadMedia).not.toHaveBeenCalled();
            expect(fs.writeFile).not.toHaveBeenCalled();
            expect(mockDriveUploader.uploadFile).not.toHaveBeenCalled();
            expect(mockMessage.reply).not.toHaveBeenCalled();
            
            // Verify correct logging
            expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Is recent photo: NO (skipping completely)'));
            expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Skipped processing: Old photo/video from Test User'));

            consoleSpy.mockRestore();
        });

        test('should process recent photos normally', async () => {
            // Set bot start time to 1 hour ago
            bot.botStartTime = moment().subtract(1, 'hour');
            
            // Set message timestamp to "now" (recent photo)
            mockMessage.timestamp = moment().unix();

            await bot.handleMessage(mockMessage);

            // Verify recent photo was processed
            expect(mockMessage.downloadMedia).toHaveBeenCalled();
            expect(fs.writeFile).toHaveBeenCalled();
            expect(mockDriveUploader.uploadFile).toHaveBeenCalled();
            // Should send direct message to guest for welcome notification
            expect(mockClient.sendMessage).toHaveBeenCalledWith(
                '34123456789@c.us',
                expect.stringContaining('✅ ¡Recibido! Tus fotos y videos se guardan automáticamente.')
            );
        });

        test('should process photos taken exactly at bot start time', async () => {
            const startTime = moment();
            bot.botStartTime = startTime;
            
            // Photo taken at exact same moment as bot start
            mockMessage.timestamp = startTime.unix();

            await bot.handleMessage(mockMessage);

            // Photos taken exactly at bot start time are NOT considered recent
            // (moment().isAfter() returns false for equal times)
            expect(mockMessage.downloadMedia).not.toHaveBeenCalled();
            expect(fs.writeFile).not.toHaveBeenCalled();
            expect(mockDriveUploader.uploadFile).not.toHaveBeenCalled();
            expect(mockMessage.reply).not.toHaveBeenCalled();
        });

        test('should process photos taken 1 second after bot start', async () => {
            bot.botStartTime = moment();
            
            // Photo taken 1 second after bot start
            mockMessage.timestamp = moment().add(1, 'second').unix();

            await bot.handleMessage(mockMessage);

            // Should be processed
            expect(mockMessage.downloadMedia).toHaveBeenCalled();
            expect(fs.writeFile).toHaveBeenCalled();
        });

        test('should handle boundary conditions correctly', async () => {
            // Test with clearly old photo (1 hour ago)
            bot.botStartTime = moment();
            mockMessage.timestamp = moment().subtract(1, 'hour').unix();
            
            await bot.handleMessage(mockMessage);
            expect(mockMessage.downloadMedia).not.toHaveBeenCalled();
            
            // Create a new bot instance and mock message for clean test
            const bot2 = new WeddingMediaBot();
            bot2.driveUploader = mockDriveUploader;
            bot2.botStartTime = moment().subtract(1, 'hour');
            
            const recentMessage = {
                hasMedia: true,
                fromMe: false,
                timestamp: moment().unix(), // Now (1 hour after bot2 started)
                getContact: jest.fn().mockResolvedValue(mockContact),
                getChat: jest.fn().mockResolvedValue(mockChat),
                downloadMedia: jest.fn().mockResolvedValue({
                    mimetype: 'image/jpeg',
                    data: 'base64data'
                }),
                reply: jest.fn().mockResolvedValue()
            };
            
            await bot2.handleMessage(recentMessage);
            expect(recentMessage.downloadMedia).toHaveBeenCalled();
        });
    });

    describe('Guest notification system', () => {
        beforeEach(() => {
            // Setup for recent photos
            bot.botStartTime = moment().subtract(1, 'hour');
            mockMessage.timestamp = moment().unix();
        });

        test('should send welcome confirmation for first upload from guest', async () => {
            await bot.handleMessage(mockMessage);

            // Should send direct message to guest, not reply in group
            expect(mockClient.sendMessage).toHaveBeenCalledWith(
                '34123456789@c.us',
                expect.stringContaining('✅ ¡Recibido! Tus fotos y videos se guardan automáticamente.')
            );
            expect(mockMessage.reply).not.toHaveBeenCalled();
        });

        test('should not send confirmation for subsequent uploads from same guest', async () => {
            // First upload
            await bot.handleMessage(mockMessage);
            
            // Clear mock calls
            jest.clearAllMocks();
            
            // Second upload from same guest
            await bot.handleMessage(mockMessage);

            expect(mockClient.sendMessage).not.toHaveBeenCalled();
            expect(mockMessage.reply).not.toHaveBeenCalled();
        });

        test('should track guests by phone number', async () => {
            const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

            // First upload
            await bot.handleMessage(mockMessage);
            
            // Second upload - should not send confirmation
            await bot.handleMessage(mockMessage);

            expect(consoleSpy).toHaveBeenCalledWith(
                expect.stringContaining('Media received from Test User (no notification - already welcomed)')
            );

            consoleSpy.mockRestore();
        });
    });

    describe('Guest notification control', () => {
        test('should skip all guest notifications when disabled', async () => {
            // Disable guest notifications for this test
            config.areGuestNotificationsEnabled.mockReturnValue(false);
            
            const bot = new WeddingMediaBot();
            bot.driveUploader = mockDriveUploader;
            bot.botStartTime = moment().subtract(1, 'hour');

            mockMessage.timestamp = moment().unix(); // Recent photo

            await bot.handleMessage(mockMessage);

            // Should not send any direct message or reply
            expect(mockClient.sendMessage).not.toHaveBeenCalled();
            expect(mockMessage.reply).not.toHaveBeenCalled();
            
            // But should still process the media
            expect(mockMessage.downloadMedia).toHaveBeenCalled();
            expect(fs.writeFile).toHaveBeenCalled();
        });

        test('should skip text message guidance when notifications disabled', async () => {
            // Disable guest notifications for this test
            config.areGuestNotificationsEnabled.mockReturnValue(false);
            
            const bot = new WeddingMediaBot();
            
            const textMessage = {
                hasMedia: false,
                fromMe: false,
                timestamp: moment().unix(),
                getContact: jest.fn().mockResolvedValue(mockContact),
                getChat: jest.fn().mockResolvedValue(mockChat),
                reply: jest.fn()
            };

            await bot.handleMessage(textMessage);

            // Should not send guidance message
            expect(textMessage.reply).not.toHaveBeenCalled();
        });

        test('should skip error messages when notifications disabled', async () => {
            // Disable guest notifications for this test
            config.areGuestNotificationsEnabled.mockReturnValue(false);
            
            const bot = new WeddingMediaBot();
            bot.driveUploader = mockDriveUploader;
            bot.botStartTime = moment().subtract(1, 'hour');

            // Mock file save to throw error
            fs.writeFile.mockRejectedValue(new Error('File save failed'));
            mockMessage.timestamp = moment().unix(); // Recent photo

            await bot.handleMessage(mockMessage);

            // Should not send error message to guest
            expect(mockClient.sendMessage).not.toHaveBeenCalled();
            expect(mockMessage.reply).not.toHaveBeenCalled();
        });

        test('should skip file size error messages when notifications disabled', async () => {
            // Disable guest notifications for this test
            config.areGuestNotificationsEnabled.mockReturnValue(false);
            
            const bot = new WeddingMediaBot();
            bot.botStartTime = moment().subtract(1, 'hour');

            // Create large file (>25MB)
            const largeData = 'x'.repeat(26 * 1024 * 1024); // 26MB
            mockMessage.timestamp = moment().unix(); // Recent photo
            mockMessage.downloadMedia.mockResolvedValue({
                mimetype: 'image/jpeg',
                data: Buffer.from(largeData).toString('base64')
            });

            await bot.handleMessage(mockMessage);

            // Should not send file size error message
            expect(mockClient.sendMessage).not.toHaveBeenCalled();
            expect(mockMessage.reply).not.toHaveBeenCalled();
            // Should not process large file
            expect(fs.writeFile).not.toHaveBeenCalled();
        });
    });

    describe('Media type handling', () => {
        beforeEach(() => {
            bot.botStartTime = moment().subtract(1, 'hour');
            mockMessage.timestamp = moment().unix();
        });

        test('should handle image files correctly', async () => {
            mockMessage.downloadMedia.mockResolvedValue({
                mimetype: 'image/jpeg',
                data: 'base64imagedata'
            });

            await bot.handleMessage(mockMessage);

            expect(fs.writeFile).toHaveBeenCalledWith(
                expect.stringContaining('photos'),
                'base64imagedata',
                'base64'
            );
            expect(mockDriveUploader.uploadFile).toHaveBeenCalledWith(
                expect.stringContaining('photos'),
                expect.stringContaining('.jpeg'),
                'photos'
            );
        });

        test('should handle video files correctly', async () => {
            mockMessage.downloadMedia.mockResolvedValue({
                mimetype: 'video/mp4',
                data: 'base64videodata'
            });

            await bot.handleMessage(mockMessage);

            expect(fs.writeFile).toHaveBeenCalledWith(
                expect.stringContaining('videos'),
                'base64videodata',
                'base64'
            );
            expect(mockDriveUploader.uploadFile).toHaveBeenCalledWith(
                expect.stringContaining('videos'),
                expect.stringContaining('.mp4'),
                'videos'
            );
        });

        test('should reject unsupported media types', async () => {
            mockMessage.downloadMedia.mockResolvedValue({
                mimetype: 'application/pdf',
                data: 'base64pdfdata'
            });

            const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
            
            await bot.handleMessage(mockMessage);

            expect(consoleSpy).toHaveBeenCalledWith('❌ Unsupported media type:', 'application/pdf');
            expect(fs.writeFile).not.toHaveBeenCalled();
            expect(mockDriveUploader.uploadFile).not.toHaveBeenCalled();

            consoleSpy.mockRestore();
        });
    });

    describe('File size validation', () => {
        beforeEach(() => {
            bot.botStartTime = moment().subtract(1, 'hour');
            mockMessage.timestamp = moment().unix();
        });

        test('should reject files that are too large', async () => {
            // Create large file data (>25MB when base64 decoded)
            const largeData = 'a'.repeat(30 * 1024 * 1024); // 30MB of 'a' characters
            mockMessage.downloadMedia.mockResolvedValue({
                mimetype: 'image/jpeg',
                data: Buffer.from(largeData).toString('base64')
            });

            await bot.handleMessage(mockMessage);

            // Should send direct message to guest about file size error
            expect(mockClient.sendMessage).toHaveBeenCalledWith(
                '34123456789@c.us',
                expect.stringContaining('❌ El archivo es demasiado grande')
            );
            expect(mockMessage.reply).not.toHaveBeenCalled();
            expect(fs.writeFile).not.toHaveBeenCalled();
            expect(mockDriveUploader.uploadFile).not.toHaveBeenCalled();
        });

        test('should accept files within size limit', async () => {
            // Create small file data
            const smallData = 'small file content';
            mockMessage.downloadMedia.mockResolvedValue({
                mimetype: 'image/jpeg',
                data: Buffer.from(smallData).toString('base64')
            });

            await bot.handleMessage(mockMessage);

            // Should not send file size error message
            expect(mockClient.sendMessage).not.toHaveBeenCalledWith(
                expect.any(String),
                expect.stringContaining('❌ El archivo es demasiado grande')
            );
            expect(fs.writeFile).toHaveBeenCalled();
        });
    });

    describe('Text message handling', () => {
        test('should respond to text messages with guidance', async () => {
            mockMessage.hasMedia = false;

            await bot.handleMessage(mockMessage);

            expect(mockMessage.reply).toHaveBeenCalledWith(
                expect.stringContaining('📸 ¡Hola! Gracias por participar en la boda de Laura y Javi')
            );
        });

        test('should not respond to text messages in groups', async () => {
            mockMessage.hasMedia = false;
            mockChat.isGroup = true;

            await bot.handleMessage(mockMessage);

            expect(mockMessage.reply).not.toHaveBeenCalled();
        });

        test('should not respond to own text messages', async () => {
            mockMessage.hasMedia = false;
            mockMessage.fromMe = true;

            await bot.handleMessage(mockMessage);

            expect(mockMessage.reply).not.toHaveBeenCalled();
        });
    });

    describe('Error handling', () => {
        beforeEach(() => {
            bot.botStartTime = moment().subtract(1, 'hour');
            mockMessage.timestamp = moment().unix();
        });

        test('should handle media download failures', async () => {
            mockMessage.downloadMedia.mockResolvedValue(null);

            const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
            
            await bot.handleMessage(mockMessage);

            expect(consoleSpy).toHaveBeenCalledWith('❌ Failed to download media');
            expect(fs.writeFile).not.toHaveBeenCalled();

            consoleSpy.mockRestore();
        });

        test('should handle file save errors gracefully', async () => {
            fs.writeFile.mockRejectedValue(new Error('File save failed'));

            await bot.handleMessage(mockMessage);

            // Should send direct message to guest about the error
            expect(mockClient.sendMessage).toHaveBeenCalledWith(
                '34123456789@c.us',
                expect.stringContaining('❌ Hubo un problema al procesar tu archivo')
            );
            expect(mockMessage.reply).not.toHaveBeenCalled();
        });

        test('should handle Google Drive upload errors', async () => {
            mockDriveUploader.uploadFile.mockRejectedValue(new Error('Drive upload failed'));

            await bot.handleMessage(mockMessage);

            // Should send direct message to guest about the error
            expect(mockClient.sendMessage).toHaveBeenCalledWith(
                '34123456789@c.us',
                expect.stringContaining('❌ Hubo un problema al procesar tu archivo')
            );
            expect(mockMessage.reply).not.toHaveBeenCalled();
        });
    });

    describe('Configuration handling', () => {
        test('should work with Google Drive disabled', async () => {
            config.isGoogleDriveEnabled.mockReturnValue(false);
            bot.driveUploader = null;
            
            bot.botStartTime = moment().subtract(1, 'hour');
            mockMessage.timestamp = moment().unix();

            await bot.handleMessage(mockMessage);

            expect(fs.writeFile).toHaveBeenCalled();
            expect(mockDriveUploader.uploadFile).not.toHaveBeenCalled();
        });

        test('should work with local save disabled', async () => {
            config.shouldSaveLocally.mockReturnValue(false);
            
            bot.botStartTime = moment().subtract(1, 'hour');
            mockMessage.timestamp = moment().unix();

            await bot.handleMessage(mockMessage);

            expect(fs.writeFile).not.toHaveBeenCalledWith(
                expect.stringContaining('media/'),
                expect.any(String),
                'base64'
            );
            expect(mockDriveUploader.uploadFile).toHaveBeenCalled();
        });
    });

    describe('Advanced Media Saving Scenarios', () => {
        beforeEach(() => {
            bot.botStartTime = moment().subtract(1, 'hour');
            mockMessage.timestamp = moment().unix();
        });

        test('should handle temporary file creation for Drive-only uploads', async () => {
            config.shouldSaveLocally.mockReturnValue(false);
            config.isGoogleDriveEnabled.mockReturnValue(true);

            await bot.handleMessage(mockMessage);

            expect(fs.writeFile).toHaveBeenCalledWith(
                expect.stringContaining('temp'),
                'base64data',
                'base64'
            );
            expect(fs.remove).toHaveBeenCalledWith(expect.stringContaining('temp'));
            expect(mockDriveUploader.uploadFile).toHaveBeenCalled();
        });

        test('should delete local files after upload when configured', async () => {
            config.shouldDeleteAfterUpload.mockReturnValue(true);
            config.isGoogleDriveEnabled.mockReturnValue(true);

            await bot.handleMessage(mockMessage);

            expect(fs.remove).toHaveBeenCalledWith(expect.stringContaining('media/photos'));
        });

        test('should save videos to correct subfolder', async () => {
            mockMessage.downloadMedia.mockResolvedValue({
                mimetype: 'video/mp4',
                data: 'base64videodata'
            });

            await bot.handleMessage(mockMessage);

            expect(fs.writeFile).toHaveBeenCalledWith(
                expect.stringContaining('videos'),
                'base64videodata',
                'base64'
            );
        });
    });

    describe('QR Upload Functionality', () => {
        test('should upload QR to root drive with correct parameters', async () => {
            const qrPath = '/test/path/qr.png';
            
            await bot.uploadQRToRootDrive(qrPath);

            expect(mockDriveUploader.createQRFolder).toHaveBeenCalled();
            expect(mockDriveUploader.uploadQRFile).toHaveBeenCalledWith(qrPath, 'qr.png');
        });

        test('should handle QR upload failure and throw error', async () => {
            mockDriveUploader.uploadQRFile.mockRejectedValue(new Error('Upload failed'));
            const qrPath = '/test/path/qr.png';

            await expect(bot.uploadQRToRootDrive(qrPath)).rejects.toThrow('Upload failed');
        });

        test('should return null when Google Drive is disabled for QR upload', async () => {
            config.isGoogleDriveEnabled.mockReturnValue(false);
            bot.driveUploader = null;
            const qrPath = '/test/path/qr.png';

            const result = await bot.uploadQRToRootDrive(qrPath);

            expect(result).toBeNull();
            expect(mockDriveUploader.createQRFolder).not.toHaveBeenCalled();
        });
    });

    describe('Module Export and Direct Execution', () => {
        test('should export WeddingMediaBot class', () => {
            expect(WeddingMediaBot).toBeDefined();
            expect(typeof WeddingMediaBot).toBe('function');
        });

        test('should handle file type edge cases', async () => {
            bot.botStartTime = moment().subtract(1, 'hour');
            mockMessage.timestamp = moment().unix();

            // Test with unusual MIME type
            mockMessage.downloadMedia.mockResolvedValue({
                mimetype: 'image/webp',
                data: 'base64data'
            });

            await bot.handleMessage(mockMessage);

            expect(fs.writeFile).toHaveBeenCalledWith(
                expect.stringContaining('.webp'),
                'base64data',
                'base64'
            );
        });

        test('should handle contact without name gracefully', async () => {
            bot.botStartTime = moment().subtract(1, 'hour');
            mockMessage.timestamp = moment().unix();
            
            mockContact.name = null;
            
            await bot.handleMessage(mockMessage);

            expect(fs.writeFile).toHaveBeenCalledWith(
                expect.stringContaining('34123456789'),
                'base64data',
                'base64'
            );
        });

        test('should handle contact with special characters in name', async () => {
            bot.botStartTime = moment().subtract(1, 'hour');
            mockMessage.timestamp = moment().unix();
            
            mockContact.name = 'María José & José-Luis 123!@#';
            
            await bot.handleMessage(mockMessage);

            expect(fs.writeFile).toHaveBeenCalledWith(
                expect.stringContaining('Mar-a-Jos----Jos--Luis-123---'),
                'base64data',
                'base64'
            );
        });
    });

    describe('Configuration Integration', () => {
        test('should handle wedding date in configuration', () => {
            expect(bot.weddingDate).toBeDefined();
            expect(moment.isMoment(bot.weddingDate)).toBe(true);
        });

        test('should initialize with Google Drive when enabled', () => {
            config.isGoogleDriveEnabled.mockReturnValue(true);
            const newBot = new WeddingMediaBot();
            
            expect(newBot.driveUploader).toBeDefined();
        });

        test('should initialize without Google Drive when disabled', () => {
            config.isGoogleDriveEnabled.mockReturnValue(false);
            const newBot = new WeddingMediaBot();
            
            expect(newBot.driveUploader).toBeNull();
        });
    });

    describe('Error Recovery and Edge Cases', () => {
        beforeEach(() => {
            bot.botStartTime = moment().subtract(1, 'hour');
            mockMessage.timestamp = moment().unix();
        });

        test('should handle contact retrieval failure', async () => {
            mockMessage.getContact.mockRejectedValue(new Error('Contact fetch failed'));
            const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

            await bot.handleMessage(mockMessage);

            expect(consoleErrorSpy).toHaveBeenCalledWith('❌ Error handling message:', expect.any(Error));
            consoleErrorSpy.mockRestore();
        });

        test('should handle chat retrieval failure', async () => {
            mockMessage.getChat.mockRejectedValue(new Error('Chat fetch failed'));
            const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

            await bot.handleMessage(mockMessage);

            expect(consoleErrorSpy).toHaveBeenCalledWith('❌ Error handling message:', expect.any(Error));
            consoleErrorSpy.mockRestore();
        });

        test('should handle QR file saving errors', async () => {
            const qrHandler = mockClient.on.mock.calls.find(call => call[0] === 'qr')[1];
            QRCode.toFile.mockRejectedValue(new Error('File save failed'));
            const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

            await qrHandler('test-qr-string');

            expect(consoleErrorSpy).toHaveBeenCalledWith('❌ Error saving QR code:', expect.any(Error));
            consoleErrorSpy.mockRestore();
        });
    });
}); 