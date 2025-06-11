const QRCode = require('qrcode');
const fs = require('fs-extra');
const path = require('path');

// Mock dependencies
jest.mock('qrcode');
jest.mock('fs-extra');

const {
    generateWeddingQR,
    generateWeddingQRWithText,
    generateTextQR,
    generateSVGQR,
    regenerateAllFormats
} = require('../qrGenerator');

describe('QR Generator', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        
        // Mock fs operations to succeed by default
        fs.ensureDir.mockResolvedValue();
        fs.writeFile.mockResolvedValue();
        
        // Mock QRCode.toFile to succeed by default
        QRCode.toFile.mockResolvedValue();
    });

    describe('generateWeddingQR', () => {
        const testUrl = 'https://wa.me/34612345678?text=Hello';

        test('should generate all QR code formats successfully', async () => {
            const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

            const result = await generateWeddingQR(testUrl);

            // Verify directory creation
            expect(fs.ensureDir).toHaveBeenCalledWith(expect.stringContaining('qr-codes'));

            // Verify PNG files generation
            expect(QRCode.toFile).toHaveBeenCalledWith(
                expect.stringContaining('wedding-qr.png'),
                testUrl,
                expect.objectContaining({
                    type: 'png',
                    width: 400
                })
            );

            expect(QRCode.toFile).toHaveBeenCalledWith(
                expect.stringContaining('wedding-qr-print.png'),
                testUrl,
                expect.objectContaining({
                    type: 'png',
                    width: 800
                })
            );

            // Verify SVG files generation
            expect(QRCode.toFile).toHaveBeenCalledWith(
                expect.stringContaining('wedding-qr.svg'),
                testUrl,
                expect.objectContaining({
                    type: 'svg',
                    width: 400
                })
            );

            expect(QRCode.toFile).toHaveBeenCalledWith(
                expect.stringContaining('wedding-qr-print.svg'),
                testUrl,
                expect.objectContaining({
                    type: 'svg',
                    width: 1200
                })
            );

            // Verify console output
            expect(consoleSpy).toHaveBeenCalledWith('✅ QR codes generated successfully:');
            expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('📱 Standard QR (PNG):'));

            // Verify return object
            expect(result).toHaveProperty('standard');
            expect(result).toHaveProperty('print');
            expect(result).toHaveProperty('standardSvg');
            expect(result).toHaveProperty('printSvg');
            expect(result).toHaveProperty('wedding');

            consoleSpy.mockRestore();
        });

        test('should handle QR generation errors', async () => {
            const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
            QRCode.toFile.mockRejectedValue(new Error('QR generation failed'));

            await expect(generateWeddingQR(testUrl)).rejects.toThrow('QR generation failed');

            expect(consoleErrorSpy).toHaveBeenCalledWith('Error generating QR code:', expect.any(Error));

            consoleErrorSpy.mockRestore();
        });

        test('should handle directory creation errors', async () => {
            const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
            fs.ensureDir.mockRejectedValue(new Error('Directory creation failed'));

            await expect(generateWeddingQR(testUrl)).rejects.toThrow('Directory creation failed');

            expect(consoleErrorSpy).toHaveBeenCalledWith('Error generating QR code:', expect.any(Error));

            consoleErrorSpy.mockRestore();
        });

        test('should use correct QR code options for PNG files', async () => {
            await generateWeddingQR(testUrl);

            expect(QRCode.toFile).toHaveBeenCalledWith(
                expect.any(String),
                testUrl,
                expect.objectContaining({
                    type: 'png',
                    quality: 0.92,
                    margin: 2,
                    color: {
                        dark: '#000000',
                        light: '#FFFFFF'
                    },
                    width: expect.any(Number)
                })
            );
        });

        test('should use correct QR code options for SVG files', async () => {
            await generateWeddingQR(testUrl);

            expect(QRCode.toFile).toHaveBeenCalledWith(
                expect.any(String),
                testUrl,
                expect.objectContaining({
                    type: 'svg',
                    margin: 2,
                    color: {
                        dark: '#000000',
                        light: '#FFFFFF'
                    },
                    width: expect.any(Number)
                })
            );
        });
    });

    describe('generateSVGQR', () => {
        const testUrl = 'https://example.com/test';

        test('should generate SVG QR with default options', async () => {
            const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

            const result = await generateSVGQR(testUrl);

            expect(fs.ensureDir).toHaveBeenCalled();
            expect(QRCode.toFile).toHaveBeenCalledWith(
                expect.stringContaining('custom-qr.svg'),
                testUrl,
                expect.objectContaining({
                    type: 'svg',
                    margin: 2,
                    width: 400,
                    color: {
                        dark: '#000000',
                        light: '#FFFFFF'
                    }
                })
            );

            expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('📱 SVG QR generated:'));
            expect(result).toContain('custom-qr.svg');

            consoleSpy.mockRestore();
        });

        test('should generate SVG QR with custom options', async () => {
            const options = {
                filename: 'my-custom-qr.svg',
                width: 600,
                darkColor: '#FF0000',
                lightColor: '#00FF00'
            };

            await generateSVGQR(testUrl, options);

            expect(QRCode.toFile).toHaveBeenCalledWith(
                expect.stringContaining('my-custom-qr.svg'),
                testUrl,
                expect.objectContaining({
                    type: 'svg',
                    width: 600,
                    color: {
                        dark: '#FF0000',
                        light: '#00FF00'
                    }
                })
            );
        });

        test('should handle SVG generation errors', async () => {
            const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
            QRCode.toFile.mockRejectedValue(new Error('SVG generation failed'));

            await expect(generateSVGQR(testUrl)).rejects.toThrow('SVG generation failed');

            expect(consoleErrorSpy).toHaveBeenCalledWith('Error generating SVG QR:', expect.any(Error));

            consoleErrorSpy.mockRestore();
        });
    });

    describe('regenerateAllFormats', () => {
        const testUrl = 'https://example.com/regenerate';

        test('should regenerate all QR formats successfully', async () => {
            const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

            const result = await regenerateAllFormats(testUrl);

            // Verify PNG generations
            expect(QRCode.toFile).toHaveBeenCalledWith(
                expect.stringContaining('wedding-qr.png'),
                testUrl,
                expect.objectContaining({ type: 'png', width: 400 })
            );

            expect(QRCode.toFile).toHaveBeenCalledWith(
                expect.stringContaining('wedding-qr-print.png'),
                testUrl,
                expect.objectContaining({ type: 'png', width: 800 })
            );

            expect(QRCode.toFile).toHaveBeenCalledWith(
                expect.stringContaining('wedding-qr-large.png'),
                testUrl,
                expect.objectContaining({ type: 'png', width: 1600 })
            );

            // Verify SVG generations
            expect(QRCode.toFile).toHaveBeenCalledWith(
                expect.stringContaining('wedding-qr.svg'),
                testUrl,
                expect.objectContaining({ type: 'svg', width: 400 })
            );

            expect(QRCode.toFile).toHaveBeenCalledWith(
                expect.stringContaining('wedding-qr-print.svg'),
                testUrl,
                expect.objectContaining({ type: 'svg', width: 1200 })
            );

            expect(QRCode.toFile).toHaveBeenCalledWith(
                expect.stringContaining('wedding-qr-banner.svg'),
                testUrl,
                expect.objectContaining({ type: 'svg', width: 2400 })
            );

            // Verify console output
            expect(consoleSpy).toHaveBeenCalledWith('🎨 Regenerating QR codes in all formats...');
            expect(consoleSpy).toHaveBeenCalledWith('\n🎉 All QR code formats generated successfully!');
            expect(consoleSpy).toHaveBeenCalledWith('\n📋 Usage recommendations:');

            // Verify return object contains all files
            const resultKeys = Object.keys(result);
            expect(resultKeys).toContain('wedding-qr.png');
            expect(resultKeys).toContain('wedding-qr-print.png');
            expect(resultKeys).toContain('wedding-qr-large.png');
            expect(resultKeys).toContain('wedding-qr.svg');
            expect(resultKeys).toContain('wedding-qr-print.svg');
            expect(resultKeys).toContain('wedding-qr-banner.svg');

            consoleSpy.mockRestore();
        });

        test('should handle regeneration errors', async () => {
            const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
            QRCode.toFile.mockRejectedValue(new Error('Regeneration failed'));

            await expect(regenerateAllFormats(testUrl)).rejects.toThrow('Regeneration failed');

            expect(consoleErrorSpy).toHaveBeenCalledWith('Error regenerating QR formats:', expect.any(Error));

            consoleErrorSpy.mockRestore();
        });

        test('should generate correct number of files', async () => {
            const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

            await regenerateAllFormats(testUrl);

            // Should generate 3 PNG + 3 SVG = 6 files total
            expect(QRCode.toFile).toHaveBeenCalledTimes(6);

            // Verify progress messages for each file
            expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('✅ Generated: wedding-qr.png (400px)'));
            expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('✅ Generated: wedding-qr-print.png (800px)'));
            expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('✅ Generated: wedding-qr-large.png (1600px)'));
            expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('✅ Generated: wedding-qr.svg (SVG - scalable)'));
            expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('✅ Generated: wedding-qr-print.svg (SVG - scalable)'));
            expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('✅ Generated: wedding-qr-banner.svg (SVG - scalable)'));

            consoleSpy.mockRestore();
        });
    });

    describe('generateWeddingQRWithText', () => {
        const testUrl = 'https://wa.me/34612345678';
        const testQrDir = '/test/qr-codes';

        test('should generate instructions file successfully', async () => {
            const result = await generateWeddingQRWithText(testUrl, testQrDir);

            expect(fs.writeFile).toHaveBeenCalledWith(
                expect.stringContaining('qr-instructions.txt'),
                expect.stringContaining('🎉 WEDDING PHOTO & VIDEO SHARING 🎉')
            );

            // Verify the content includes the URL and current date
            const [filePath, content] = fs.writeFile.mock.calls[0];
            expect(content).toContain(testUrl);
            expect(content).toContain(new Date().toLocaleDateString());

            expect(result).toContain('qr-instructions.txt');
        });

        test('should include bilingual instructions', async () => {
            await generateWeddingQRWithText(testUrl, testQrDir);

            const [, content] = fs.writeFile.mock.calls[0];
            expect(content).toContain('INSTRUCCIONES / INSTRUCTIONS');
            expect(content).toContain('Escanea el código QR');
            expect(content).toContain('Scan the QR code');
            expect(content).toContain('Se abrirá WhatsApp');
            expect(content).toContain('WhatsApp will open');
        });

        test('should handle file writing errors', async () => {
            const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
            fs.writeFile.mockRejectedValue(new Error('File write failed'));

            await expect(generateWeddingQRWithText(testUrl, testQrDir)).rejects.toThrow('File write failed');

            expect(consoleErrorSpy).toHaveBeenCalledWith('Error generating wedding QR with text:', expect.any(Error));

            consoleErrorSpy.mockRestore();
        });
    });

    describe('generateTextQR', () => {
        const testText = 'Hello World';

        test('should generate text QR with default filename', async () => {
            const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

            const result = await generateTextQR(testText);

            expect(fs.ensureDir).toHaveBeenCalled();
            expect(QRCode.toFile).toHaveBeenCalledWith(
                expect.stringContaining('test-qr.png'),
                testText
            );

            expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('📱 Text QR generated:'));
            expect(result).toContain('test-qr.png');

            consoleSpy.mockRestore();
        });

        test('should generate text QR with custom filename', async () => {
            const customFilename = 'my-text-qr.png';

            await generateTextQR(testText, customFilename);

            expect(QRCode.toFile).toHaveBeenCalledWith(
                expect.stringContaining(customFilename),
                testText
            );
        });

        test('should handle text QR generation errors', async () => {
            const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
            QRCode.toFile.mockRejectedValue(new Error('Text QR generation failed'));

            await expect(generateTextQR(testText)).rejects.toThrow('Text QR generation failed');

            expect(consoleErrorSpy).toHaveBeenCalledWith('Error generating text QR:', expect.any(Error));

            consoleErrorSpy.mockRestore();
        });
    });

    describe('File System Operations', () => {
        test('should ensure qr-codes directory exists for all functions', async () => {
            const testUrl = 'https://example.com';

            await generateWeddingQR(testUrl);
            await generateSVGQR(testUrl);
            await regenerateAllFormats(testUrl);
            await generateTextQR('test');

            // Directory should be created for each function call
            expect(fs.ensureDir).toHaveBeenCalledTimes(4);
            expect(fs.ensureDir).toHaveBeenCalledWith(expect.stringContaining('qr-codes'));
        });

        test('should handle directory creation failures gracefully', async () => {
            fs.ensureDir.mockRejectedValue(new Error('Directory creation failed'));

            await expect(generateWeddingQR('test')).rejects.toThrow('Directory creation failed');
            await expect(generateSVGQR('test')).rejects.toThrow('Directory creation failed');
            await expect(regenerateAllFormats('test')).rejects.toThrow('Directory creation failed');
            await expect(generateTextQR('test')).rejects.toThrow('Directory creation failed');
        });
    });

    describe('QR Code Options Validation', () => {
        test('should use consistent color scheme across all formats', async () => {
            await generateWeddingQR('test');

            const calls = QRCode.toFile.mock.calls;
            calls.forEach(([, , options]) => {
                if (options.color) {
                    expect(options.color.dark).toBe('#000000');
                    expect(options.color.light).toBe('#FFFFFF');
                }
            });
        });

        test('should use appropriate margins for all formats', async () => {
            await generateWeddingQR('test');

            const calls = QRCode.toFile.mock.calls;
            calls.forEach(([, , options]) => {
                expect(options.margin).toBe(2);
            });
        });

        test('should use different widths for different purposes', async () => {
            await regenerateAllFormats('test');

            const pngCalls = QRCode.toFile.mock.calls.filter(([, , options]) => options.type === 'png');
            const svgCalls = QRCode.toFile.mock.calls.filter(([, , options]) => options.type === 'svg');

            // PNG widths: 400, 800, 1600
            expect(pngCalls).toHaveLength(3);
            expect(pngCalls.some(([, , options]) => options.width === 400)).toBe(true);
            expect(pngCalls.some(([, , options]) => options.width === 800)).toBe(true);
            expect(pngCalls.some(([, , options]) => options.width === 1600)).toBe(true);

            // SVG widths: 400, 1200, 2400
            expect(svgCalls).toHaveLength(3);
            expect(svgCalls.some(([, , options]) => options.width === 400)).toBe(true);
            expect(svgCalls.some(([, , options]) => options.width === 1200)).toBe(true);
            expect(svgCalls.some(([, , options]) => options.width === 2400)).toBe(true);
        });
    });

    describe('Module Exports', () => {
        test('should export all required functions', () => {
            expect(typeof generateWeddingQR).toBe('function');
            expect(typeof generateWeddingQRWithText).toBe('function');
            expect(typeof generateTextQR).toBe('function');
            expect(typeof generateSVGQR).toBe('function');
            expect(typeof regenerateAllFormats).toBe('function');
        });
    });

    describe('Integration Scenarios', () => {
        test('should handle multiple simultaneous QR generations', async () => {
            const urls = [
                'https://example1.com',
                'https://example2.com',
                'https://example3.com'
            ];

            const promises = urls.map(url => generateWeddingQR(url));
            const results = await Promise.all(promises);

            expect(results).toHaveLength(3);
            results.forEach(result => {
                expect(result).toHaveProperty('standard');
                expect(result).toHaveProperty('print');
                expect(result).toHaveProperty('standardSvg');
                expect(result).toHaveProperty('printSvg');
                expect(result).toHaveProperty('wedding');
            });
        });

        test('should handle long URLs correctly', async () => {
            const longUrl = 'https://wa.me/34612345678?text=' + 'a'.repeat(1000);

            await expect(generateWeddingQR(longUrl)).resolves.toBeDefined();
            expect(QRCode.toFile).toHaveBeenCalledWith(
                expect.any(String),
                longUrl,
                expect.any(Object)
            );
        });

        test('should handle special characters in URLs', async () => {
            const urlWithSpecialChars = 'https://wa.me/34612345678?text=¡Hola%20María%20y%20José!%20💒';

            await expect(generateWeddingQR(urlWithSpecialChars)).resolves.toBeDefined();
            expect(QRCode.toFile).toHaveBeenCalledWith(
                expect.any(String),
                urlWithSpecialChars,
                expect.any(Object)
            );
        });
    });
}); 