# 📋 Google Drive Setup Guide

## Step-by-Step Instructions

### 1. Go to Google Cloud Console
Visit: https://console.cloud.google.com/

### 2. Create or Select Project
- **If creating new:** Click "New Project"
  - **Project Name:** `Wedding-Media-Bot` (or any name you like)
  - **Organization:** Leave default or select your organization
  - Click **"Create"**

### 3. Enable Google Drive API
- In the left sidebar, go to **"APIs & Services"** → **"Enabled APIs & services"**
- Click **"+ ENABLE APIS AND SERVICES"**
- Search for **"Google Drive API"**
- Click on it and press **"Enable"**

### 4. Create Service Account (This is the important part!)

#### Go to Credentials:
- Left sidebar → **"APIs & Services"** → **"Credentials"**
- Click **"+ CREATE CREDENTIALS"** → **"Service Account"**

#### Fill the Service Account Details:
```
Service account name: wedding-media-collector
(This can be anything descriptive)

Service account ID: wedding-media-collector-123
(This will be auto-generated based on the name - don't worry about it)

Service account description: Bot for collecting wedding photos and videos
(Optional but helpful)
```

#### Set Permissions (IMPORTANT):
- **Step 2 - Grant service account access:** 
  - **Role:** Select **"Editor"** or **"Owner"**
  - This gives the bot permission to create folders and upload files
- Click **"Continue"**

#### Skip Step 3:
- **Step 3 - Grant users access:** Just click **"Done"** (skip this step)

### 5. Download Credentials Key

#### After creating the service account:
- You'll see your new service account in the list
- Click on the **service account email** (looks like: `wedding-media-collector-123@your-project.iam.gserviceaccount.com`)
- Go to the **"Keys"** tab
- Click **"Add Key"** → **"Create new key"**
- Select **"JSON"** format
- Click **"Create"**

#### The JSON file will download automatically:
- **Rename it to:** `google-credentials.json`
- **Move it to:** `config/google-credentials.json` in your project folder

## 🎯 Example of what you should enter:

When creating the service account, use these examples:

```
Service account name: wedding-media-bot
Service account ID: wedding-media-bot-534 (auto-generated)
Description: WhatsApp bot for wedding photo collection
```

**Don't worry about the exact ID number** - Google generates it automatically!

## ✅ Verification

Your `config/google-credentials.json` file should look like this:

```json
{
  "type": "service_account",
  "project_id": "your-project-name",
  "private_key_id": "...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...",
  "client_email": "wedding-media-bot-534@your-project.iam.gserviceaccount.com",
  "client_id": "...",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  ...
}
```

## 🔧 Common Issues & Solutions

### ❌ "Permission denied" error
**Solution:** Make sure the service account has **"Editor"** role

### ❌ "API not enabled" error  
**Solution:** Go back and enable the Google Drive API

### ❌ "File not found" error
**Solution:** Check that `google-credentials.json` is in the `config/` folder

### ❌ "Invalid credentials" error
**Solution:** Re-download the JSON key file

## 🎉 Test Your Setup

After setting up, run:
```bash
npm start
```

You should see:
```
✅ Google Drive integration initialized
📁 Created wedding folders in Google Drive: Wedding Photos & Videos - 2024
```

If you see this, you're all set! 🎊

## 📱 Alternative: Use Your Personal Google Account

If you want to use your personal Google account instead:

1. Create a new Google Cloud project with your personal Gmail
2. Follow the same steps above
3. The wedding photos will go to YOUR Google Drive
4. You can share the folder with your partner later

---

**💡 Tip:** The service account name is just a label - choose something that makes sense to you like "wedding-bot" or "photo-collector"! 