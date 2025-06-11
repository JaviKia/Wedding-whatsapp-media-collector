const QRCode = require('qrcode');
const fs = require('fs-extra');
const path = require('path');

async function generateWeddingQR(whatsappUrl) {
    try {
        // Ensure qr-codes directory exists
        const qrDir = path.join(__dirname, '../qr-codes');
        await fs.ensureDir(qrDir);

        // Generate QR code options for better readability
        const qrOptions = {
            type: 'png',
            quality: 0.92,
            margin: 2,
            color: {
                dark: '#000000',
                light: '#FFFFFF'
            },
            width: 400
        };

        // Generate the QR code (PNG)
        const qrPath = path.join(qrDir, 'wedding-qr.png');
        await QRCode.toFile(qrPath, whatsappUrl, qrOptions);

        // Also generate a larger version for printing (PNG)
        const printOptions = {
            ...qrOptions,
            width: 800
        };
        const printPath = path.join(qrDir, 'wedding-qr-print.png');
        await QRCode.toFile(printPath, whatsappUrl, printOptions);

        // Generate SVG versions for scalable printing
        const svgOptions = {
            type: 'svg',
            margin: 2,
            color: {
                dark: '#000000',
                light: '#FFFFFF'
            },
            width: 400
        };

        // Standard SVG version
        const svgPath = path.join(qrDir, 'wedding-qr.svg');
        await QRCode.toFile(svgPath, whatsappUrl, svgOptions);

        // High-quality SVG for large prints
        const svgPrintOptions = {
            ...svgOptions,
            width: 1200  // High resolution for large prints
        };
        const svgPrintPath = path.join(qrDir, 'wedding-qr-print.svg');
        await QRCode.toFile(svgPrintPath, whatsappUrl, svgPrintOptions);

        // Generate QR with custom wedding message
        const weddingQRWithText = await generateWeddingQRWithText(whatsappUrl, qrDir);

        console.log('✅ QR codes generated successfully:');
        console.log(`📱 Standard QR (PNG): ${qrPath}`);
        console.log(`🖨️  Print QR (PNG): ${printPath}`);
        console.log(`📱 Standard QR (SVG): ${svgPath}`);
        console.log(`🖨️  Print QR (SVG): ${svgPrintPath}`);
        console.log(`💒 Wedding QR with text: ${weddingQRWithText}`);

        return {
            standard: qrPath,
            print: printPath,
            standardSvg: svgPath,
            printSvg: svgPrintPath,
            wedding: weddingQRWithText
        };

    } catch (error) {
        console.error('Error generating QR code:', error);
        throw error;
    }
}

// New function specifically for generating SVG QR codes
async function generateSVGQR(url, options = {}) {
    try {
        const qrDir = path.join(__dirname, '../qr-codes');
        await fs.ensureDir(qrDir);

        const defaultOptions = {
            type: 'svg',
            margin: 2,
            color: {
                dark: options.darkColor || '#000000',
                light: options.lightColor || '#FFFFFF'
            },
            width: options.width || 400
        };

        const filename = options.filename || 'custom-qr.svg';
        const svgPath = path.join(qrDir, filename);
        
        await QRCode.toFile(svgPath, url, defaultOptions);
        
        console.log(`📱 SVG QR generated: ${svgPath}`);
        return svgPath;
    } catch (error) {
        console.error('Error generating SVG QR:', error);
        throw error;
    }
}

// Function to regenerate all QR formats for an existing URL
async function regenerateAllFormats(url) {
    try {
        console.log('🎨 Regenerating QR codes in all formats...');
        
        const qrDir = path.join(__dirname, '../qr-codes');
        await fs.ensureDir(qrDir);

        // PNG formats
        const pngOptions = [
            { filename: 'wedding-qr.png', width: 400 },
            { filename: 'wedding-qr-print.png', width: 800 },
            { filename: 'wedding-qr-large.png', width: 1600 }  // Extra large for banners
        ];

        // SVG formats
        const svgOptions = [
            { filename: 'wedding-qr.svg', width: 400 },
            { filename: 'wedding-qr-print.svg', width: 1200 },
            { filename: 'wedding-qr-banner.svg', width: 2400 }  // For large banners
        ];

        const results = {};

        // Generate PNG versions
        for (const opt of pngOptions) {
            const filePath = path.join(qrDir, opt.filename);
            await QRCode.toFile(filePath, url, {
                type: 'png',
                quality: 0.92,
                margin: 2,
                color: { dark: '#000000', light: '#FFFFFF' },
                width: opt.width
            });
            results[opt.filename] = filePath;
            console.log(`✅ Generated: ${opt.filename} (${opt.width}px)`);
        }

        // Generate SVG versions
        for (const opt of svgOptions) {
            const filePath = path.join(qrDir, opt.filename);
            await QRCode.toFile(filePath, url, {
                type: 'svg',
                margin: 2,
                color: { dark: '#000000', light: '#FFFFFF' },
                width: opt.width
            });
            results[opt.filename] = filePath;
            console.log(`✅ Generated: ${opt.filename} (SVG - scalable)`);
        }

        console.log('\n🎉 All QR code formats generated successfully!');
        console.log('\n📋 Usage recommendations:');
        console.log('📱 wedding-qr.png/svg - Social media, small prints');
        console.log('🖨️  wedding-qr-print.png/svg - A4/A5 prints, table cards');
        console.log('🏗️  wedding-qr-large.png/banner.svg - Large banners, wall displays');
        
        return results;

    } catch (error) {
        console.error('Error regenerating QR formats:', error);
        throw error;
    }
}

async function generateWeddingQRWithText(whatsappUrl, qrDir) {
    try {
        // This could be enhanced to add decorative text around the QR
        // For now, we'll create a simple version with instructions
        const instructionsPath = path.join(qrDir, 'qr-instructions.txt');
        
        const instructions = `
🎉 WEDDING PHOTO & VIDEO SHARING 🎉

📱 INSTRUCCIONES / INSTRUCTIONS:

1. Escanea el código QR con tu teléfono
   Scan the QR code with your phone

2. Se abrirá WhatsApp automáticamente
   WhatsApp will open automatically

3. Envía tus fotos y videos de la boda
   Send your wedding photos and videos

4. ¡Se guardarán automáticamente en la nube!
   They'll be automatically saved to the cloud!

📸 ¡Comparte tus mejores momentos! 📹
   Share your best moments!

💕 ¡Gracias por acompañarnos en este día especial!
   Thank you for joining us on this special day!

---
QR Code URL: ${whatsappUrl}
Generated: ${new Date().toLocaleDateString()}
        `;

        await fs.writeFile(instructionsPath, instructions);
        
        return instructionsPath;
    } catch (error) {
        console.error('Error generating wedding QR with text:', error);
        throw error;
    }
}

// Function to generate a simple text QR for testing
async function generateTextQR(text, filename = 'test-qr.png') {
    try {
        const qrDir = path.join(__dirname, '../qr-codes');
        await fs.ensureDir(qrDir);
        
        const qrPath = path.join(qrDir, filename);
        await QRCode.toFile(qrPath, text);
        
        console.log(`📱 Text QR generated: ${qrPath}`);
        return qrPath;
    } catch (error) {
        console.error('Error generating text QR:', error);
        throw error;
    }
}

module.exports = {
    generateWeddingQR,
    generateWeddingQRWithText,
    generateTextQR,
    generateSVGQR,
    regenerateAllFormats
}; 