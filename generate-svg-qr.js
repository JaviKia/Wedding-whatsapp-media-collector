const { regenerateAllFormats } = require('./src/qrGenerator');
const config = require('./src/configLoader');

class SVGQRGenerator {
    constructor() {
        console.log('\n🎨 SVG QR CODE GENERATOR FOR WEDDING 🎨\n');
    }

    async generateSVGQRCodes() {
        try {
            // Load wedding configuration
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
            console.log('');

            // Get the permanent WhatsApp URL
            const whatsappUrl = config.getWhatsAppUrl();
            console.log(`🔗 WhatsApp URL: ${whatsappUrl}`);
            console.log('');

            // Generate all QR code formats
            console.log('🎨 Generating QR codes in all formats (PNG + SVG)...');
            const results = await regenerateAllFormats(whatsappUrl);

            console.log('\n✅ SVG QR CODES GENERATED SUCCESSFULLY! ✅');
            console.log('==============================================');
            console.log('');
            console.log('📁 SVG Files Generated:');
            console.log('📱 wedding-qr.svg - Standard size, perfect for digital use');
            console.log('🖨️  wedding-qr-print.svg - High quality for A4/A5 prints');
            console.log('🏗️  wedding-qr-banner.svg - Extra large for banners and signs');
            console.log('');
            console.log('📁 PNG Files Also Updated:');
            console.log('📱 wedding-qr.png - 400px for social media');
            console.log('🖨️  wedding-qr-print.png - 800px for prints');
            console.log('🏗️  wedding-qr-large.png - 1600px for large displays');
            console.log('');
            console.log('✨ SVG ADVANTAGES:');
            console.log('   ✅ Infinite scalability - perfect for any size');
            console.log('   ✅ Crisp edges at any resolution');
            console.log('   ✅ Small file size');
            console.log('   ✅ Perfect for printing on large items');
            console.log('   ✅ Can be edited with design software');
            console.log('');
            console.log('📋 PRINTING RECOMMENDATIONS:');
            console.log('   📱 Small prints (business cards): Use wedding-qr.svg');
            console.log('   🖨️  Table cards, invitations: Use wedding-qr-print.svg');
            console.log('   🏗️  Banners, large signs: Use wedding-qr-banner.svg');
            console.log('   ✅ SVG files will be crisp at ANY size!');
            console.log('');
            console.log('🎯 WHERE TO USE EACH SIZE:');
            console.log('   • Table centerpieces: print.svg on A5/A4');
            console.log('   • Welcome sign: banner.svg for large format');
            console.log('   • Photo booth props: print.svg');
            console.log('   • Wedding website: Any SVG (will auto-scale)');
            console.log('   • T-shirts/merchandise: banner.svg for best quality');
            console.log('');
            console.log('💡 TIP: SVG files can be imported into design software');
            console.log('   (Canva, Photoshop, Illustrator) for custom designs!');
            console.log('');
            console.log('🎊 ¡Perfecto para tu boda! Your guests will love how easy it is!');

            return true;

        } catch (error) {
            console.error('❌ Error generating SVG QR codes:', error.message);
            return false;
        }
    }
}

// Run if called directly
if (require.main === module) {
    const generator = new SVGQRGenerator();
    generator.generateSVGQRCodes()
        .then(success => {
            process.exit(success ? 0 : 1);
        })
        .catch(error => {
            console.error('SVG Generator failed:', error);
            process.exit(1);
        });
}

module.exports = SVGQRGenerator; 