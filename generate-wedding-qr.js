const { generateWeddingQR } = require('./src/qrGenerator');
const config = require('./src/configLoader');
const fs = require('fs-extra');
const path = require('path');

class PermanentWeddingQR {
    constructor() {
        console.log('\n🎉 PERMANENT WEDDING QR CODE GENERATOR 🎉\n');
    }

    async generateQRCodes() {
        try {
            // Load configuration
            const validation = config.validate();
            if (!validation.isValid) {
                console.error('❌ Configuration errors:');
                validation.errors.forEach(error => console.error(`   - ${error}`));
                console.log('\n💡 Run "npm run setup" to fix configuration issues.\n');
                return false;
            }

            // Display wedding information
            console.log('📋 Wedding Information:');
            console.log(`👫 Couple: ${config.get('COUPLE_NAMES')}`);
            console.log(`📅 Date: ${config.get('WEDDING_DATE')}`);
            console.log(`📱 WhatsApp: ${config.get('WEDDING_WHATSAPP_NUMBER')}`);
            console.log(`💬 Mode: ${config.isUsingGroupChat() ? 'Group Chat' : 'Individual Chat'}`);
            console.log('');

            // Generate permanent WhatsApp URL
            const whatsappUrl = config.getWhatsAppUrl();
            console.log(`🔗 Permanent ${config.isUsingGroupChat() ? 'Group Invite' : 'WhatsApp'} URL: ${whatsappUrl}`);
            console.log('');

            // Generate QR codes
            console.log('🎨 Generating QR codes...');
            const qrPaths = await generateWeddingQR(whatsappUrl);

            // Create additional information file
            await this.createWeddingInfo(whatsappUrl);

            console.log('\n✅ PERMANENT QR CODES GENERATED! ✅');
            console.log('=====================================');
            console.log('');
            console.log('📁 Generated files:');
            console.log(`📱 Standard QR: ${qrPaths.standard}`);
            console.log(`🖨️  Print QR: ${qrPaths.print}`);
            console.log(`💒 Instructions: ${qrPaths.wedding}`);
            console.log('📄 Wedding info: qr-codes/wedding-information.txt');
            console.log('');
            console.log('🎯 IMPORTANT: These QR codes are PERMANENT!');
            console.log('   ✅ They will work even if the bot is not running');
            console.log('   ✅ Safe to print for your wedding');
            console.log('   ✅ Guests can scan them anytime');
            console.log('');
            console.log('💡 When guests scan the QR:');
            if (config.isUsingGroupChat()) {
                console.log('   1. WhatsApp opens and joins the wedding group');
                console.log('   2. They can see other guests\' photos and send their own');
                console.log('   3. All photos are visible to everyone in the group');
                console.log('   4. Bot automatically saves photos to Google Drive');
            } else {
                console.log('   1. WhatsApp opens automatically');
                console.log('   2. A pre-written message appears');
                console.log('   3. They can send photos/videos directly');
                console.log('   4. You receive them on your phone');
            }
            console.log('');
            console.log('📱 To collect photos automatically with Google Drive:');
            console.log('   - Run "npm start" on your wedding day');
            console.log('   - The bot will upload photos to Google Drive automatically');
            console.log('');
            console.log('🎊 ¡Felicidades por tu boda!');

            return true;

        } catch (error) {
            console.error('❌ Error generating QR codes:', error.message);
            return false;
        }
    }

    async createWeddingInfo(whatsappUrl) {
        try {
            const coupleNames = config.get('COUPLE_NAMES');
            const weddingDate = config.get('WEDDING_DATE');
            const phoneNumber = config.get('WEDDING_WHATSAPP_NUMBER');

            const weddingInfo = `
🎉 ${coupleNames} - WEDDING MEDIA COLLECTION 🎉
=====================================================

📅 Wedding Date: ${weddingDate}
📱 WhatsApp Number: ${phoneNumber}

🔗 Permanent QR Code URL:
${whatsappUrl}

📋 QR CODE INFORMATION:
• This QR code is PERMANENT and will never expire
• It works whether the bot is running or not
• Guests can scan it anytime to send photos/videos
• Photos are sent directly to your WhatsApp

📱 GUEST INSTRUCTIONS:
1. Scan the QR code with your phone camera
2. WhatsApp will open automatically
3. Send your wedding photos and videos
4. That's it! No apps to download, no accounts to create

🤖 AUTOMATED COLLECTION:
• Run "npm start" to activate the bot on your wedding day
• The bot will automatically save all photos to Google Drive
• Guests will receive confirmation messages
• All media is organized by date and sender

🎯 PRINTING RECOMMENDATIONS:
• Use the high-resolution version (wedding-qr-print.png)
• Print at least A5 size for easy scanning
• Place QR codes on tables, photo booth, welcome area
• Include instructions in your wedding language

🎊 TECHNICAL DETAILS:
Generated: ${new Date().toLocaleString()}
Version: Wedding Media Collector v1.0.0
Contact: ${phoneNumber}

¡Felicidades por tu boda! 💒
            `;

            const infoPath = path.join(__dirname, 'qr-codes', 'wedding-information.txt');
            await fs.writeFile(infoPath, weddingInfo);

        } catch (error) {
            console.error('Error creating wedding info:', error);
        }
    }
}

// Run if called directly
if (require.main === module) {
    const generator = new PermanentWeddingQR();
    generator.generateQRCodes()
        .then(success => {
            process.exit(success ? 0 : 1);
        })
        .catch(error => {
            console.error('Generator failed:', error);
            process.exit(1);
        });
}

module.exports = PermanentWeddingQR; 