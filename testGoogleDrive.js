const { GoogleDriveUploader } = require('./src/googleDrive');
const fs = require('fs-extra');
const path = require('path');

class GoogleDriveTest {
    constructor() {
        this.uploader = new GoogleDriveUploader();
    }

    async testConnection() {
        console.log('\n🧪 TESTING GOOGLE DRIVE CONNECTION 🧪\n');

        try {
            // Check if credentials file exists
            const credentialsPath = path.join(__dirname, 'config/google-credentials.json');
            
            if (!fs.existsSync(credentialsPath)) {
                console.log('❌ Credentials file not found!');
                console.log('📁 Expected location: config/google-credentials.json');
                console.log('📋 Follow the setup guide: GOOGLE_DRIVE_SETUP.md');
                return false;
            }

            console.log('✅ Credentials file found');

            // Check credentials format
            try {
                const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
                
                if (!credentials.type || credentials.type !== 'service_account') {
                    console.log('❌ Invalid credentials file - not a service account');
                    return false;
                }

                console.log('✅ Credentials format is valid');
                console.log(`📧 Service account: ${credentials.client_email}`);
                console.log(`🏗️  Project: ${credentials.project_id}`);

            } catch (error) {
                console.log('❌ Invalid JSON in credentials file');
                console.log('💡 Re-download the credentials file from Google Cloud Console');
                return false;
            }

            // Wait for Google Drive initialization to complete
            console.log('\n⏳ Waiting for Google Drive initialization...');
            
            // Wait for the uploader to be fully initialized
            let attempts = 0;
            const maxAttempts = 10;
            
            while ((!this.uploader.photosFolderId || !this.uploader.videosFolderId) && attempts < maxAttempts) {
                await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
                attempts++;
                console.log(`⏳ Waiting for folder setup... (${attempts}/${maxAttempts})`);
            }
            
            if (!this.uploader.photosFolderId || !this.uploader.videosFolderId) {
                console.log('❌ Wedding folders not initialized properly');
                return false;
            }
            
            console.log('✅ Wedding folders initialized successfully');
            console.log(`📁 Photos folder ID: ${this.uploader.photosFolderId}`);
            console.log(`🎥 Videos folder ID: ${this.uploader.videosFolderId}`);

            // Test creating a test image file
            console.log('\n📤 Testing image upload to wedding Photos folder...');
            
            // Create a simple SVG image with test content
            const now = new Date();
            const dateStr = now.toISOString().slice(0, 19).replace(/[:.]/g, '-'); // 2025-06-09T06-30-15
            const displayDate = now.toLocaleString();
            
            const svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="#f0f8ff" stroke="#4169e1" stroke-width="2"/>
  <text x="200" y="50" text-anchor="middle" font-family="Arial, sans-serif" font-size="18" font-weight="bold" fill="#2e4a87">
    🎉 Wedding Media Collector Test 🎉
  </text>
  <text x="200" y="80" text-anchor="middle" font-family="Arial, sans-serif" font-size="14" fill="#333">
    Laura y Javi - Wedding Bot Test
  </text>
  <text x="200" y="120" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" fill="#666">
    Test image created on:
  </text>
  <text x="200" y="140" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" fill="#666">
    ${displayDate}
  </text>
  <text x="200" y="180" text-anchor="middle" font-family="Arial, sans-serif" font-size="14" fill="#4169e1">
    ✅ Uploaded to Wedding Photos Folder!
  </text>
  <text x="200" y="220" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" fill="#666">
    If you can see this image in the Photos subfolder,
  </text>
  <text x="200" y="240" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" fill="#666">
    the bot is working correctly! 🎊
  </text>
  <circle cx="50" cy="250" r="15" fill="#ff69b4"/>
  <circle cx="350" cy="250" r="15" fill="#ff69b4"/>
  <text x="200" y="280" text-anchor="middle" font-family="Arial, sans-serif" font-size="10" fill="#999">
    💒 ¡Felicidades por tu boda! 💒
  </text>
</svg>`;

            const imageFilename = `wedding-test-image-${dateStr}.svg`;
            const testPath = path.join(__dirname, 'temp', imageFilename);
            await fs.ensureDir(path.dirname(testPath));
            await fs.writeFile(testPath, svgContent);
            
            console.log(`📸 Created test image: ${imageFilename}`);

            // Try to upload it to the Photos subfolder
            await this.uploader.uploadFile(testPath, imageFilename, 'photos');
            
            // Clean up test file
            await fs.remove(testPath);

            console.log('✅ Google Drive connection successful!');
            console.log('🎊 Your wedding media collector is ready to use!');
            console.log('📁 Test image uploaded to Wedding Photos folder');
            
            return true;

        } catch (error) {
            console.log('❌ Google Drive connection failed:');
            console.log(`   ${error.message}`);
            
            if (error.message.includes('ENOENT')) {
                console.log('\n💡 Possible solutions:');
                console.log('   1. Make sure config/google-credentials.json exists');
                console.log('   2. Check the file path and permissions');
            } else if (error.message.includes('400')) {
                console.log('\n💡 Possible solutions:');
                console.log('   1. Re-download credentials from Google Cloud Console');
                console.log('   2. Make sure Google Drive API is enabled');
            } else if (error.message.includes('403')) {
                console.log('\n💡 Possible solutions:');
                console.log('   1. Check service account permissions (needs Editor role)');
                console.log('   2. Make sure Google Drive API is enabled in your project');
            }
            
            console.log('\n📋 Full setup guide: GOOGLE_DRIVE_SETUP.md');
            return false;
        }
    }

    async getFolderInfo() {
        try {
            const folderLink = await this.uploader.getFolderLink();
            if (folderLink) {
                console.log(`\n🔗 Your wedding folder: ${folderLink}`);
                console.log('💡 You can share this link with your partner or family');
            }
        } catch (error) {
            console.log('⚠️  Could not get folder link:', error.message);
        }
    }
}

// Run test if called directly
if (require.main === module) {
    const tester = new GoogleDriveTest();
    tester.testConnection()
        .then(success => {
            if (success) {
                tester.getFolderInfo();
            }
            process.exit(success ? 0 : 1);
        })
        .catch(error => {
            console.error('Test failed:', error);
            process.exit(1);
        });
}

module.exports = GoogleDriveTest; 