const { GoogleDriveUploader } = require('./src/googleDrive');
const fs = require('fs-extra');
const readline = require('readline');

class WeddingFileManager {
    constructor() {
        this.uploader = new GoogleDriveUploader();
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
    }

    async question(query) {
        return new Promise(resolve => this.rl.question(query, resolve));
    }

    async listFiles() {
        console.log('\n📁 WEDDING FILES MANAGER 📁\n');

        try {
            // Wait for initialization
            let attempts = 0;
            while ((!this.uploader.photosFolderId || !this.uploader.videosFolderId) && attempts < 10) {
                await new Promise(resolve => setTimeout(resolve, 1000));
                attempts++;
            }

            if (!this.uploader.photosFolderId || !this.uploader.videosFolderId) {
                console.log('❌ Wedding folders not found');
                return [];
            }

            console.log('📸 PHOTOS FOLDER:');
            const photos = await this.listFolderContents(this.uploader.photosFolderId);
            
            console.log('\n🎥 VIDEOS FOLDER:');
            const videos = await this.listFolderContents(this.uploader.videosFolderId);

            return [...photos, ...videos];
        } catch (error) {
            console.error('Error listing files:', error);
            return [];
        }
    }

    async listFolderContents(folderId) {
        try {
            const response = await this.uploader.drive.files.list({
                q: `parents in '${folderId}' and trashed=false`,
                fields: 'files(id, name, createdTime, size, webViewLink)',
                orderBy: 'createdTime desc'
            });

            const files = response.data.files || [];
            
            if (files.length === 0) {
                console.log('   📭 No files found');
                return [];
            }

            files.forEach((file, index) => {
                const size = file.size ? `${Math.round(file.size / 1024)}KB` : 'Unknown';
                const date = new Date(file.createdTime).toLocaleDateString();
                console.log(`   ${index + 1}. ${file.name} (${size}, ${date})`);
                console.log(`      🔗 ${file.webViewLink}`);
            });

            return files;
        } catch (error) {
            console.error(`Error listing folder contents:`, error);
            return [];
        }
    }

    async deleteFile(fileId, fileName) {
        try {
            await this.uploader.drive.files.delete({
                fileId: fileId
            });
            console.log(`✅ Deleted: ${fileName}`);
            return true;
        } catch (error) {
            console.error(`❌ Failed to delete ${fileName}:`, error.message);
            if (error.message.includes('403') || error.message.includes('permission')) {
                console.log('💡 This file can only be deleted by the service account owner');
                console.log('   You may need to delete it manually from Google Drive');
            }
            return false;
        }
    }

    async interactiveDelete() {
        const files = await this.listFiles();
        
        if (files.length === 0) {
            console.log('\n📭 No files to delete');
            this.rl.close();
            return;
        }

        console.log('\n🗑️  FILE DELETION OPTIONS:');
        console.log('1. Delete specific files');
        console.log('2. Delete all files');
        console.log('3. Exit');

        const choice = await this.question('\nChoose an option (1-3): ');

        switch (choice) {
            case '1':
                await this.deleteSpecificFiles(files);
                break;
            case '2':
                await this.deleteAllFiles(files);
                break;
            case '3':
                console.log('👋 Goodbye!');
                break;
            default:
                console.log('❌ Invalid choice');
        }

        this.rl.close();
    }

    async deleteSpecificFiles(files) {
        console.log('\nEnter file numbers to delete (comma-separated, e.g., 1,3,5):');
        const input = await this.question('File numbers: ');
        
        const indices = input.split(',').map(i => parseInt(i.trim()) - 1);
        
        for (const index of indices) {
            if (index >= 0 && index < files.length) {
                const file = files[index];
                await this.deleteFile(file.id, file.name);
            } else {
                console.log(`❌ Invalid file number: ${index + 1}`);
            }
        }
    }

    async deleteAllFiles(files) {
        const confirm = await this.question('⚠️  Delete ALL files? Type "YES" to confirm: ');
        
        if (confirm === 'YES') {
            console.log('\n🗑️  Deleting all files...');
            for (const file of files) {
                await this.deleteFile(file.id, file.name);
            }
            console.log('\n✅ Finished deleting files');
        } else {
            console.log('❌ Deletion cancelled');
        }
    }
}

// Run if called directly
if (require.main === module) {
    const manager = new WeddingFileManager();
    manager.interactiveDelete()
        .catch(error => {
            console.error('Error:', error);
            process.exit(1);
        });
}

module.exports = WeddingFileManager; 