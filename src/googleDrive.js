const { google } = require('googleapis');
const fs = require('fs-extra');
const path = require('path');
const config = require('./configLoader');

class GoogleDriveUploader {
    constructor() {
        this.drive = null;
        this.folderId = null;
        this.photosFolderId = null;
        this.videosFolderId = null;
        this.initializeDrive();
    }

    async initializeDrive() {
        try {
            // Initialize Google Drive API
            const auth = new google.auth.GoogleAuth({
                keyFile: path.join(__dirname, '../config/google-credentials.json'),
                scopes: ['https://www.googleapis.com/auth/drive.file']
            });

            this.drive = google.drive({ version: 'v3', auth });
            
            // Try to load existing folder IDs first
            await this.loadExistingFolderIds();
            
            // Create wedding folders structure (will use existing if found)
            await this.createWeddingFolders();
            
            console.log('✅ Google Drive integration initialized');
        } catch (error) {
            console.error('❌ Google Drive initialization error:', error.message);
            console.log('📝 Make sure to setup Google Drive credentials (see README)');
        }
    }

    async loadExistingFolderIds() {
        try {
            const folderIdsPath = path.join(__dirname, '../config/drive-folders.json');
            
            if (await fs.pathExists(folderIdsPath)) {
                const folderData = await fs.readJson(folderIdsPath);
                
                // Verify the folders still exist in Google Drive
                if (await this.verifyFolderExists(folderData.mainFolderId)) {
                    this.folderId = folderData.mainFolderId;
                    this.photosFolderId = folderData.photosFolderId;
                    this.videosFolderId = folderData.videosFolderId;
                    console.log('📁 Loaded existing folder IDs from cache');
                    return true;
                } else {
                    console.log('⚠️  Cached folder IDs are invalid, will search for existing folders');
                    // Remove invalid cache
                    await fs.remove(folderIdsPath);
                }
            }
        } catch (error) {
            console.log('📁 No cached folder IDs found, will search for existing folders');
        }
        return false;
    }

    async verifyFolderExists(folderId) {
        if (!folderId) return false;
        
        try {
            await this.drive.files.get({
                fileId: folderId,
                fields: 'id'
            });
            return true;
        } catch (error) {
            return false;
        }
    }

    async createWeddingFolders() {
        try {
            // If we already have valid folder IDs from cache, just verify and return
            if (this.folderId && this.photosFolderId && this.videosFolderId) {
                console.log('📁 Using cached wedding folder IDs');
                const folderLink = await this.getFolderLink();
                if (folderLink) {
                    console.log(`🔗 Folder link: ${folderLink}`);
                }
                return;
            }

            const weddingFolderName = `Wedding Photos & Videos - ${new Date().getFullYear()}`;
            
            // First, check if wedding folder already exists
            const existingFolder = await this.findExistingWeddingFolder(weddingFolderName);
            
            if (existingFolder) {
                console.log(`📁 Found existing wedding folder: ${weddingFolderName}`);
                this.folderId = existingFolder.id;
                
                // Find existing subfolders
                const subfolders = await this.findSubfolders(this.folderId);
                this.photosFolderId = subfolders.photos;
                this.videosFolderId = subfolders.videos;
                
                // Make sure it's public (in case it wasn't before)
                await this.shareWithOwner(this.folderId);
                
            } else {
                console.log(`📁 Creating new wedding folder: ${weddingFolderName}`);
                // Create main wedding folder
                this.folderId = await this.createFolder(weddingFolderName);
                
                // Share the main folder with the owner
                await this.shareWithOwner(this.folderId);
            
            // Create subfolders
            this.photosFolderId = await this.createFolder('Photos', this.folderId);
            this.videosFolderId = await this.createFolder('Videos', this.folderId);
            
            console.log(`📁 Created wedding folders in Google Drive: ${weddingFolderName}`);
            }
            
            // Save folder IDs for future use
            await this.saveFolderIds();
            
            // Get and display the folder link
            const folderLink = await this.getFolderLink();
            if (folderLink) {
                console.log(`🔗 Folder shared with you: ${folderLink}`);
            }
        } catch (error) {
            console.error('Error creating wedding folders:', error);
        }
    }

    async findExistingWeddingFolder(weddingFolderName) {
        try {
            const response = await this.drive.files.list({
                q: `name='${weddingFolderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
                fields: 'files(id, name)',
                spaces: 'drive'
            });

            if (response.data.files && response.data.files.length > 0) {
                return response.data.files[0]; // Return the first match
            }
            return null;
        } catch (error) {
            console.error('Error searching for existing wedding folder:', error);
            return null;
        }
    }

    async findSubfolders(parentId) {
        try {
            const response = await this.drive.files.list({
                q: `parents in '${parentId}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
                fields: 'files(id, name)',
                spaces: 'drive'
            });

            const subfolders = { photos: null, videos: null };
            
            if (response.data.files) {
                response.data.files.forEach(folder => {
                    if (folder.name.toLowerCase() === 'photos') {
                        subfolders.photos = folder.id;
                    } else if (folder.name.toLowerCase() === 'videos') {
                        subfolders.videos = folder.id;
                    }
                });
            }

            // Create missing subfolders
            if (!subfolders.photos) {
                subfolders.photos = await this.createFolder('Photos', parentId);
                console.log('📸 Created Photos subfolder');
            }
            if (!subfolders.videos) {
                subfolders.videos = await this.createFolder('Videos', parentId);
                console.log('🎥 Created Videos subfolder');
            }

            return subfolders;
        } catch (error) {
            console.error('Error finding subfolders:', error);
            return { photos: null, videos: null };
        }
    }

    async saveFolderIds() {
        try {
            const folderData = {
                mainFolderId: this.folderId,
                photosFolderId: this.photosFolderId,
                videosFolderId: this.videosFolderId,
                createdAt: new Date().toISOString()
            };

            const folderIdsPath = path.join(__dirname, '../config/drive-folders.json');
            await fs.writeJson(folderIdsPath, folderData, { spaces: 2 });
            console.log('💾 Saved folder IDs for future use');
        } catch (error) {
            console.error('Error saving folder IDs:', error);
        }
    }

    async shareWithOwner(folderId) {
        try {
            // Make the folder publicly accessible with a link
            await this.drive.permissions.create({
                fileId: folderId,
                resource: {
                    role: 'reader',
                    type: 'anyone'
                }
            });

            console.log(`📖 Folder made publicly accessible (anyone with link can view)`);
        } catch (error) {
            console.error('Error making folder public:', error.message);
            // If sharing fails, that's OK - the bot will still work for uploads
        }
    }

    async createFolder(name, parentId = null) {
        try {
            const folderMetadata = {
                name: name,
                mimeType: 'application/vnd.google-apps.folder',
                parents: parentId ? [parentId] : undefined
            };

            const response = await this.drive.files.create({
                resource: folderMetadata,
                fields: 'id'
            });

            return response.data.id;
        } catch (error) {
            console.error(`Error creating folder ${name}:`, error);
            throw error;
        }
    }

    async uploadFile(localPath, filename, subfolder = 'photos') {
        if (!this.drive) {
            console.log('❌ Google Drive not initialized - skipping upload');
            return;
        }

        // Retry logic for general API rate limits
        const maxRetries = 3;
        const baseDelayMs = 1000;
        const maxDelayMs = 32000;

        for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            const fileMetadata = {
                name: filename,
                parents: [subfolder === 'videos' ? this.videosFolderId : this.photosFolderId]
            };

            const media = {
                mimeType: this.getMimeType(filename),
                body: fs.createReadStream(localPath)
            };

            const response = await this.drive.files.create({
                resource: fileMetadata,
                media: media,
                fields: 'id,name,webViewLink'
            });

                // Make the uploaded file publicly accessible
                await this.makePublic(response.data.id);
                
                // Share with owner so they can manage/delete the file (with its own backoff strategy)
                await this.shareWithOwnerAsEditor(response.data.id);

            console.log(`☁️ Uploaded to Google Drive: ${response.data.name}`);
            console.log(`🔗 View link: ${response.data.webViewLink}`);

            return response.data;
                
        } catch (error) {
                // Check if this is a rate limit error that should be retried
                const isRateLimit = (error.code === 403 || error.code === 429) && 
                    error.errors && 
                    error.errors.some(e => e.reason === 'rateLimitExceeded' || e.reason === 'userRateLimitExceeded');

                if (isRateLimit && attempt < maxRetries) {
                    // Calculate delay with exponential backoff + jitter
                    const exponentialDelay = Math.min(baseDelayMs * Math.pow(2, attempt), maxDelayMs);
                    const jitter = Math.random() * 1000;
                    const delayMs = exponentialDelay + jitter;
                    
                    console.log(`⏳ API rate limit hit - retrying upload in ${(delayMs/1000).toFixed(1)}s (attempt ${attempt + 1}/${maxRetries + 1})`);
                    
                    await new Promise(resolve => setTimeout(resolve, delayMs));
                    continue;
                }

                // For non-rate-limit errors or after all retries exhausted
            console.error('Error uploading to Google Drive:', error);
            throw error;
            }
        }
    }

    getMimeType(filename) {
        const ext = path.extname(filename).toLowerCase();
        const mimeTypes = {
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.png': 'image/png',
            '.gif': 'image/gif',
            '.webp': 'image/webp',
            '.svg': 'image/svg+xml',
            '.mp4': 'video/mp4',
            '.mov': 'video/quicktime',
            '.avi': 'video/x-msvideo',
            '.mkv': 'video/x-matroska',
            '.webm': 'video/webm'
        };
        return mimeTypes[ext] || 'application/octet-stream';
    }

    async getFolderLink() {
        if (!this.folderId) return null;
        
        try {
            const response = await this.drive.files.get({
                fileId: this.folderId,
                fields: 'webViewLink'
            });
            return response.data.webViewLink;
        } catch (error) {
            console.error('Error getting folder link:', error);
            return null;
        }
    }

    async makePublic(fileId) {
        const maxRetries = 2;
        const baseDelayMs = 500;
        const maxDelayMs = 5000;

        for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            await this.drive.permissions.create({
                fileId: fileId,
                resource: {
                    role: 'reader',
                    type: 'anyone'
                }
            });
            console.log('📖 Made file publicly viewable');
                return; // Success
                
            } catch (error) {
                // Check if this is a rate limit error
                const isRateLimit = (error.code === 403 || error.code === 429) && 
                    error.errors && 
                    error.errors.some(e => e.reason === 'rateLimitExceeded' || e.reason === 'userRateLimitExceeded');

                if (isRateLimit && attempt < maxRetries) {
                    const exponentialDelay = Math.min(baseDelayMs * Math.pow(2, attempt), maxDelayMs);
                    const jitter = Math.random() * 500;
                    const delayMs = exponentialDelay + jitter;
                    
                    console.log(`⏳ Rate limit hit making file public - retrying in ${(delayMs/1000).toFixed(1)}s`);
                    
                    await new Promise(resolve => setTimeout(resolve, delayMs));
                    continue;
                }

                console.error('Error making file public:', error);
                break; // Exit retry loop
            }
        }
    }

    async shareWithOwnerAsEditor(fileId) {
        const ownerEmail = config.getOwnerEmail();
        if (!ownerEmail) {
            console.log('⚠️  No owner email configured - file not shared with owner');
            return;
        }

        // Check if we should skip owner sharing due to rate limits
        if (config.shouldSkipOwnerSharing()) {
            console.log('⏭️ Skipping owner sharing (SKIP_OWNER_SHARING=true) - file is publicly accessible');
            return;
        }

        // Implement exponential backoff for sharing rate limits
        const maxRetries = 3;
        const baseDelayMs = 1000; // Start with 1 second
        const maxDelayMs = 30000; // Max 30 seconds

        for (let attempt = 0; attempt <= maxRetries; attempt++) {
            try {
                // Give writer permissions (ownership transfer requires manual consent)
                await this.drive.permissions.create({
                    fileId: fileId,
                    resource: {
                        role: 'writer',
                        type: 'user',
                        emailAddress: ownerEmail
                    }
                });
                console.log(`📝 Shared with ${ownerEmail} as writer (delete may be limited - see docs for full ownership)`);
                return; // Success - exit the retry loop
                
            } catch (error) {
                // Check if this is a sharing rate limit error
                const isSharingRateLimit = error.code === 403 && 
                    error.errors && 
                    error.errors.some(e => e.reason === 'sharingRateLimitExceeded');

                if (isSharingRateLimit && attempt < maxRetries) {
                    // Calculate delay with exponential backoff + jitter
                    const exponentialDelay = Math.min(baseDelayMs * Math.pow(2, attempt), maxDelayMs);
                    const jitter = Math.random() * 1000; // Add up to 1 second of jitter
                    const delayMs = exponentialDelay + jitter;
                    
                    console.log(`⏳ Sharing rate limit hit - retrying in ${(delayMs/1000).toFixed(1)}s (attempt ${attempt + 1}/${maxRetries + 1})`);
                    
                    // Wait before retrying
                    await new Promise(resolve => setTimeout(resolve, delayMs));
                    continue;
                }

                // For non-rate-limit errors or after all retries exhausted
                if (isSharingRateLimit) {
                    console.log(`⚠️  Sharing quota exceeded after ${maxRetries + 1} attempts - file uploaded but not shared with owner`);
                    console.log(`📊 File is publicly accessible via Drive link`);
                } else {
                    console.error('Error sharing file with owner:', error);
                }
                break; // Exit retry loop
            }
        }
    }

    async createQRFolder() {
        try {
            // Check if QR folder already exists in root
            const existingQRFolder = await this.findQRFolder();
            if (existingQRFolder) {
                console.log('📁 Found existing QR-Codes folder in root');
                return existingQRFolder.id;
            }

            // Create QR folder in root (no parent)
            const qrFolderId = await this.createFolder('qr-codes');
            
            // Make it publicly accessible
            await this.shareWithOwner(qrFolderId);
            
            // Share with owner specifically
            const ownerEmail = config.getOwnerEmail();
            if (ownerEmail) {
                try {
                    await this.drive.permissions.create({
                        fileId: qrFolderId,
                        resource: {
                            role: 'writer',
                            type: 'user',
                            emailAddress: ownerEmail
                        }
                    });
                    console.log(`📝 QR folder shared with ${ownerEmail}`);
                } catch (shareError) {
                    console.log('⚠️ Could not share QR folder with owner, but folder is publicly accessible');
                }
            }

            console.log('📁 Created QR-Codes folder in Google Drive root');
            return qrFolderId;
        } catch (error) {
            console.error('Error creating QR folder:', error);
            throw error;
        }
    }

    async findQRFolder() {
        try {
            const response = await this.drive.files.list({
                q: "name='qr-codes' and mimeType='application/vnd.google-apps.folder' and trashed=false and 'root' in parents",
                fields: 'files(id, name)',
                spaces: 'drive'
            });

            if (response.data.files && response.data.files.length > 0) {
                return response.data.files[0];
            }
            return null;
        } catch (error) {
            console.error('Error searching for QR folder:', error);
            return null;
        }
    }

    async uploadQRFile(qrPath, filename) {
        if (!this.drive) {
            console.log('❌ Google Drive not initialized - skipping QR upload');
            return null;
        }

        try {
            // Get QR folder ID
            const qrFolderId = await this.createQRFolder();

            const fileMetadata = {
                name: filename,
                parents: [qrFolderId]
            };

            const media = {
                mimeType: this.getMimeType(filename),
                body: fs.createReadStream(qrPath)
            };

            const response = await this.drive.files.create({
                resource: fileMetadata,
                media: media,
                fields: 'id,name,webViewLink'
            });

            // Make the QR file publicly accessible
            await this.makePublic(response.data.id);

            console.log(`☁️ Uploaded to Google Drive: ${response.data.name}`);
            console.log(`🔗 View link: ${response.data.webViewLink}`);

            return response.data;
        } catch (error) {
            console.error('Error uploading QR to Google Drive:', error);
            throw error;
        }
    }
}

module.exports = { GoogleDriveUploader }; 