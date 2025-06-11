# 🎉 Wedding WhatsApp Media Collector - Complete Guide

A complete guide for your wedding photo and video collection bot system.

## 📋 Table of Contents

- [Quick Reference](#quick-reference)
- [Initial Setup](#initial-setup)
- [Available Commands](#available-commands)
- [Wedding Day Workflow](#wedding-day-workflow)
- [File Management](#file-management)
- [Troubleshooting](#troubleshooting)
- [Technical Details](#technical-details)
- [🚨 Error Handling & Rate Limits](#error-handling-rate-limits)

---

## 🚀 Quick Reference

| Command | Purpose | When to Use |
|---------|---------|-------------|
| `npm run qr` | Generate permanent guest QR codes | **Print for wedding** |
| `npm start` | Start the bot | **Wedding day setup** |
| `npm run delete` | Manage/delete uploaded files | **File cleanup** |
| `node testGoogleDrive.js` | Test Google Drive connection | **Troubleshooting** |

---

## ⚙️ Initial Setup

### 1. Installation
```bash
# Install dependencies
npm install

# Run setup wizard (if not done already)
npm run setup
```

### 2. Configure Your Wedding Details
Edit `wedding.env`:
```env
COUPLE_NAMES="Laura y Javi"
WEDDING_DATE="2025-08-02"
WEDDING_WHATSAPP_NUMBER="+34646514356"
OWNER_EMAIL="javier.angel.mnez.rnez@gmail.com"

# WhatsApp Group Configuration (Optional)
# If provided, QR codes will point to this group instead of individual chat
# Example: https://chat.whatsapp.com/ABC123DEF456
# WEDDING_GROUP_INVITE_URL=

# Google Drive Settings
GOOGLE_DRIVE_ENABLED=true

# Storage Settings
SAVE_LOCALLY=true
DELETE_AFTER_UPLOAD=false
MAX_FILE_SIZE_MB=25

# Notification Settings
GUEST_NOTIFICATIONS_ENABLED=true  # Set to 'false' to disable guest notifications
```

### 3. Choose Collection Mode

**📱 Individual Chat Mode (Default)**
- Guests message your personal WhatsApp
- Private one-on-one conversations
- Only you see the photos initially
- Simple setup, no group management

**👥 Group Chat Mode (Recommended)**
- Create a dedicated wedding WhatsApp group
- Guests join the group to share photos
- Everyone can see each other's photos
- More social and interactive experience

#### Setting up Group Mode:
1. **Create WhatsApp Group**:
   - Name: "Laura y Javi - Wedding Photos 💒"
   - Add yourself and your partner as admins
   - Set description: "Share your photos and videos from our special day!"

2. **Get Group Invite Link**:
   - Group Info → Invite via Link → Copy Link

3. **Add to Configuration**:
   ```env
   WEDDING_GROUP_INVITE_URL=https://chat.whatsapp.com/YOUR_GROUP_CODE_HERE
   ```

4. **Configure Group Settings**:
   - **Send messages**: All participants
   - **Edit group info**: Only admins
   - **Add participants**: Only admins (recommended)

### 4. Google Drive Setup
- Place `google-credentials.json` in the `config/` folder
- Test connection: `node testGoogleDrive.js`

---

## 📱 Available Commands

### 🎯 Generate Wedding QR Codes
```bash
npm run qr
```
**Purpose**: Creates permanent QR codes for guests to scan
**Output**: 
- `qr-codes/wedding-qr.png` - Standard size
- `qr-codes/wedding-qr-print.png` - High resolution for printing
- `qr-codes/qr-instructions.txt` - Instructions for guests

**Important**: These QR codes are **PERMANENT** and safe to print months in advance!

---

### 🤖 Start the Wedding Bot
```bash
npm start
```
**Purpose**: Activates the bot for automatic photo collection
**What happens**:
1. Shows a QR code in terminal (for you to scan with WhatsApp Web)
2. Creates/connects to wedding Google Drive folders
3. Starts listening for guest photos
4. Automatically uploads photos to Google Drive

**When to use**: On your wedding day or when testing

---

### 🗑️ Manage Wedding Files
```bash
npm run delete
```
**Purpose**: List and delete files from your wedding folders
**Features**:
- View all photos and videos
- Delete specific files
- Delete all files (with confirmation)
- Shows file sizes and dates

**File Deletion Limitations**:
- Files are owned by the service account
- You have "writer" permissions 
- Some files may require manual deletion in Google Drive
- The script will try to delete and show results

---

### 🧪 Test Google Drive
```bash
node testGoogleDrive.js
```
**Purpose**: Verify Google Drive integration is working
**What it does**:
- Checks credentials
- Tests folder creation
- Uploads a test image
- Verifies permissions

---

## 💒 Wedding Day Workflow

### Before the Wedding (Weeks/Months Ahead)
1. **Generate QR codes for printing**:
   ```bash
   npm run qr
   ```
2. **Print the QR codes** - Use `wedding-qr-print.png`
3. **Test everything**:
   ```bash
   node testGoogleDrive.js
   npm start  # Test briefly, then stop
   ```

### Wedding Day Setup (30 minutes before guests arrive)
1. **Start the bot**:
   ```bash
   npm start
   ```
2. **Scan the terminal QR code** with your WhatsApp (WhatsApp Web)
3. **Verify bot is connected** - Look for "WhatsApp Bot is ready!"
4. **Place printed QR codes** around the venue

### During the Wedding
- **Guests scan QR codes** → WhatsApp opens with pre-written message
- **Guests send photos/videos** → Bot receives and uploads to Google Drive
- **Bot sends ONE welcome confirmation** → Only for first upload per guest (avoids spam)
- **Monitor the terminal** for upload confirmations

### After the Wedding
1. **Let the bot run** until reception ends
2. **Check Google Drive** for all collected media
3. **Clean up files** if needed:
   ```bash
   npm run delete
   ```

---

## 📁 File Management Guide

### Understanding File Ownership
- **Files are owned by**: `wedding-media-collector-123@neon-journal-462214-s2.iam.gserviceaccount.com`
- **You have access as**: Writer (can view, download, but deletion is limited)
- **Files appear in**: "Shared with me" section of your Google Drive

### How to Delete Files

#### Option 1: Use the File Manager (Recommended)
```bash
npm run delete
```
Follow the interactive prompts:
- View all files with dates and sizes
- Choose specific files to delete (e.g., "1,3,5")
- Or delete all files with confirmation

#### Option 2: Manual Deletion in Google Drive
1. Go to Google Drive → "Shared with me"
2. Find "Wedding Photos & Videos - 2025" folder
3. Try right-click → "Move to trash"
4. If blocked, use the file manager script instead

#### Option 3: Bulk Download then Delete
```bash
# List files first
npm run delete
# Choose option 3 to exit, then manually download from Google Drive
```

### File Organization
```
Google Drive/
└── Wedding Photos & Videos - 2025/
    ├── Photos/
    │   ├── 2025-08-02_14-30-25_Maria-Lopez.jpg
    │   └── 2025-08-02_15-45-12_Jose-Garcia.png
    └── Videos/
        ├── 2025-08-02_16-20-33_Ana-Rodriguez.mp4
        └── 2025-08-02_17-10-45_Carlos-Martinez.mov
```

---

## 🔧 Troubleshooting

### Bot Won't Start
```bash
# Check credentials
ls config/google-credentials.json

# Test Google Drive
node testGoogleDrive.js

# Check configuration
cat wedding.env
```

### QR Code Issues
- **QR changes every time**: That's normal for the bot QR (WhatsApp Web)
- **Guest QR codes are permanent**: Generated with `npm run qr`
- **Test the guest QR**: Scan with your phone to verify it opens WhatsApp

### **QR Code Not Showing (Bidi Code Missing)**
**Problem**: Bot starts but doesn't display the WhatsApp Web QR code
**Cause**: Multiple bot instances running simultaneously

**Solution**:
```bash
# 1. Stop all running bot instances
pkill -f "node src/bot.js"

# 2. Wait a few seconds for processes to terminate
sleep 3

# 3. Start bot fresh
npm start
```

**How to identify this issue**:
- Bot shows "Google Drive integration initialized" ✅
- Bot shows folder links
- But **no QR code appears** in terminal
- Multiple node processes visible in `ps aux | grep node`

**Prevention**: Always check for running instances before starting:
```bash
# Check for running bots
ps aux | grep "node src/bot.js"

# If any found, kill them first
pkill -f "node src/bot.js"
```

### Google Drive Problems
```bash
# Test connection
node testGoogleDrive.js

# Check folder permissions
npm run delete  # Will show if folders exist
```

### File Deletion Issues
- **"Remove is disabled"**: Files owned by service account
- **Solution**: Use `npm run delete` script
- **Alternative**: Download files, then delete manually

### Guest Issues
- **QR doesn't work**: Check phone camera can scan QR codes
- **WhatsApp doesn't open**: Ensure WhatsApp is installed
- **Message doesn't appear**: QR code might be damaged, regenerate with `npm run qr`

---

## 🔍 Technical Details

### File Permissions
- **Service Account**: Owns all uploaded files
- **Your Account**: Has "writer" access to files and folders
- **Public Access**: Files are publicly viewable with direct links
- **Deletion**: Limited due to service account ownership

### QR Code Types
1. **WhatsApp Web QR** (temporary):
   - Changes every bot restart
   - Only for connecting your WhatsApp to the bot
   - Appears in terminal when running `npm start`

2. **Guest QR Codes** (permanent):
   - Never change
   - Safe to print months in advance
   - Generated with `npm run qr`
   - Point to: `https://wa.me/+34646514356?text=...`

### Folder Structure
- **Main folder**: `Wedding Photos & Videos - 2025`
- **Subfolders**: `Photos/` and `Videos/`
- **Caching**: Folder IDs saved in `config/drive-folders.json`
- **Reuse**: Same folders used across bot restarts

### Network Requirements
- **Internet connection**: Required for Google Drive uploads
- **WhatsApp Web access**: Required for bot functionality
- **Phone connectivity**: Your phone must stay connected to internet

### Guest Notification System
- **First upload**: Guests receive a welcome confirmation explaining the system
- **Subsequent uploads**: Silent processing to avoid notification spam
- **Error cases**: Guests always receive error messages (file too large, etc.)
- **Text messages**: Guests receive guidance to send photos instead

### Time-Based Photo Filtering
- **Recent photos**: Only photos/videos taken after bot startup are synced to Google Drive
- **Old photos**: Saved locally but not uploaded to cloud (prevents random old photos)
- **Wedding focus**: Ensures only actual wedding moments are collected in the cloud
- **Local backup**: All photos (old and new) are saved locally if configured

---

## 🎊 Tips for Success

### Before Wedding
- ✅ Test everything with friends/family
- ✅ Print multiple QR code copies
- ✅ Have backup photo collection method
- ✅ Check internet connectivity at venue

### During Wedding
- ✅ Monitor bot terminal for errors
- ✅ Have QR codes at multiple locations
- ✅ Ask photo booth operator to announce QR codes
- ✅ Keep your phone connected to internet

### After Wedding
- ✅ Let bot run until end of reception
- ✅ Download important photos as backup
- ✅ Share Google Drive folder link with family
- ✅ Clean up test files: `npm run delete`

---

## 📞 Support

### Configuration File Locations
- **Wedding config**: `wedding.env`
- **Google credentials**: `config/google-credentials.json`
- **Folder cache**: `config/drive-folders.json`
- **QR codes**: `qr-codes/`

### Log Files
- **Terminal output**: Real-time status and errors
- **Google Drive links**: Shown in terminal when files are uploaded
- **Guest confirmations**: Sent via WhatsApp automatically

### Emergency Procedures
1. **Bot crashes**: Restart with `npm start`
2. **QR codes lost**: Regenerate with `npm run qr`
3. **Google Drive full**: Check storage quota
4. **Phone disconnected**: Reconnect via WhatsApp Web

---

## 🎉 ¡Felicidades por tu boda!

Your wedding media collection system is ready! Remember:
- **Generate QR codes**: `npm run qr`
- **Wedding day**: `npm start`
- **Manage files**: `npm run delete`

¡Que disfrutes mucho tu día especial! 💒✨ 

## 🚨 Error Handling & Rate Limits

The bot includes robust error handling with exponential backoff strategies:

### ⏳ **Exponential Backoff for Rate Limits**

**Sharing Rate Limits:**
- **Max retries**: 3 attempts
- **Base delay**: 1 second  
- **Max delay**: 30 seconds
- **Jitter**: Random 0-1 seconds added to prevent thundering herd

**General API Rate Limits:**
- **Max retries**: 3 attempts
- **Base delay**: 1 second
- **Max delay**: 32 seconds  
- **Jitter**: Random 0-1 seconds

**Public File Access:**
- **Max retries**: 2 attempts
- **Base delay**: 0.5 seconds
- **Max delay**: 5 seconds

### 📊 **What You'll See During Rate Limits:**

```
⏳ Sharing rate limit hit - retrying in 2.3s (attempt 1/4)
⏳ API rate limit hit - retrying upload in 4.7s (attempt 2/4)
⚠️  Sharing quota exceeded after 4 attempts - file uploaded but not shared with owner
📊 File is publicly accessible via Drive link
```

### 🔧 **Rate Limit Recovery:**

- **Photos still upload successfully** even if sharing fails
- **Files remain publicly accessible** via generated links
- **Bot continues processing** new photos normally
- **Quotas reset at midnight Pacific Time** 

## ⚙️ Configuration Options

Edit `wedding.env` for your specific wedding:

```bash
# Wedding Information
COUPLE_NAMES=Laura y Javi
WEDDING_DATE=2025-08-02
WEDDING_WHATSAPP_NUMBER=+34646514356
OWNER_EMAIL=your-email@gmail.com

# Google Drive Settings
GOOGLE_DRIVE_ENABLED=true

# Storage Settings
SAVE_LOCALLY=true
DELETE_AFTER_UPLOAD=false
MAX_FILE_SIZE_MB=25

# Notification Settings
GUEST_NOTIFICATIONS_ENABLED=true  # Set to 'false' to disable guest notifications
```

### 🔔 **Guest Notifications Control**

**Quick Toggle:** Change `GUEST_NOTIFICATIONS_ENABLED` in `wedding.env`:

```bash
# Enable guest notifications (default)
GUEST_NOTIFICATIONS_ENABLED=true

# Disable guest notifications (silent mode)
GUEST_NOTIFICATIONS_ENABLED=false
```

**When notifications are DISABLED:**
- ❌ No welcome confirmations sent to guests
- ❌ No file size error messages sent to guests  
- ❌ No text message guidance sent to guests
- ❌ No error messages sent to guests
- ✅ Photos/videos still saved and uploaded normally
- ✅ All logging continues as normal (you see everything)

**Use cases for disabling notifications:**
- 🧪 Testing the bot without spamming guests
- 🔇 Running bot silently during setup
- 📊 Bulk processing old photos without notifications
- 🛠️ Debugging without guest interruption 

## 🚀 **Opciones de Despliegue en GCP**

### **Opción 1: Google Compute Engine (Recomendado) 🏆**
**Mejor para WhatsApp bots** porque mantiene conexiones persistentes.

### **Opción 2: Cloud Run**
**No recomendado** para WhatsApp Web porque es serverless y puede desconectar la sesión.

---

## 📋 **Guía de Despliegue en Compute Engine**

### **Paso 1: Crear VM en GCP**

```bash
# Crear una instancia pequeña y económica
gcloud compute instances create wedding-bot \
    --zone=europe-west1-b \
    --machine-type=e2-micro \
    --image-family=ubuntu-2004-lts \
    --image-project=ubuntu-os-cloud \
    --boot-disk-size=20GB \
    --boot-disk-type=pd-standard \
    --tags=wedding-bot
```

### **Paso 2: Configurar Firewall (Opcional)**
```bash
# Solo si necesitas acceso web (no necesario para este bot)
gcloud compute firewall-rules create allow-wedding-bot \
    --allow tcp:3000 \
    --source-ranges 0.0.0.0/0 \
    --target-tags wedding-bot
```

### **Paso 3: Conectar a la VM**
```bash
gcloud compute ssh wedding-bot --zone=europe-west1-b
```

### **Paso 4: Configurar el Entorno en la VM**

```bash
# Actualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Instalar dependencias del sistema para Puppeteer
sudo apt-get install -y \
    gconf-service libasound2 libatk1.0-0 libc6 libcairo2 libcups2 \
    libdbus-1-3 libexpat1 libfontconfig1 libgcc1 libgconf-2-4 \
    libgdk-pixbuf2.0-0 libglib2.0-0 libgtk-3-0 libnspr4 \
    libpango-1.0-0 libpangocairo-1.0-0 libstdc++6 libx11-6 \
    libx11-xcb1 libxcb1 libxcomposite1 libxcursor1 libxdamage1 \
    libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 libxss1 \
    libxtst6 ca-certificates fonts-liberation libappindicator1 \
    libnss3 lsb-release xdg-utils wget

# Instalar Git
sudo apt install -y git
```

### **Paso 5: Transferir tu Código**

**Opción A: Subir tu código a GitHub (Recomendado)**
```bash
# En tu laptop, sube el código a GitHub
cd ~/git-javi/bidi_code
git init
git add .
git commit -m "Wedding bot initial commit"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/wedding-bot.git
git push -u origin main

# En la VM, clonar el repositorio
git clone https://github.com/TU_USUARIO/wedding-bot.git
cd wedding-bot
```

**Opción B: Transferir directamente con gcloud**
```bash
# En tu laptop
gcloud compute scp --recurse ~/git-javi/bidi_code wedding-bot:~/wedding-bot --zone=europe-west1-b
```

### **Paso 6: Configurar el Proyecto en la VM**

```bash
# Navegar al directorio del proyecto
cd ~/wedding-bot

# Instalar dependencias
npm install

# Crear directorio de configuración
mkdir -p config

# Subir tu archivo de credenciales de Google
# En tu laptop:
gcloud compute scp config/google-credentials.json wedding-bot:~/wedding-bot/config/ --zone=europe-west1-b
```

### **Paso 7: Crear Servicio Systemd para Auto-inicio**

```bash
# Crear archivo de servicio
sudo nano /etc/systemd/system/wedding-bot.service
```

**Contenido del archivo:**
```ini
[Unit]
Description=Wedding WhatsApp Media Collector Bot
After=network.target

[Service]
Type=simple
User=tu_usuario
WorkingDirectory=/home/tu_usuario/wedding-bot
ExecStart=/usr/bin/node src/bot.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production

# Variables de entorno opcionales
Environment=DISPLAY=:99

[Install]
WantedBy=multi-user.target
```

```bash
# Reemplazar 'tu_usuario' con tu usuario actual
sudo sed -i "s/tu_usuario/$(whoami)/g" /etc/systemd/system/wedding-bot.service

# Recargar systemd y habilitar el servicio
sudo systemctl daemon-reload
sudo systemctl enable wedding-bot.service
```

### **Paso 8: Configurar Display Virtual (Para Puppeteer)**

```bash
# Instalar Xvfb (X Virtual Framebuffer)
sudo apt install -y xvfb

# Crear servicio para Xvfb
sudo nano /etc/systemd/system/xvfb.service
```

**Contenido del xvfb.service:**
```ini
[Unit]
Description=X Virtual Frame Buffer Service
After=network.target

[Service]
ExecStart=/usr/bin/Xvfb :99 -screen 0 1024x768x24
Restart=on-failure
RestartSec=2

[Install]
WantedBy=multi-user.target
```

```bash
# Habilitar Xvfb
sudo systemctl enable xvfb.service
sudo systemctl start xvfb.service
```

---

## 🎮 **Comandos de Gestión**

### **Iniciar el Bot**
```bash
sudo systemctl start wedding-bot
```

### **Ver Logs en Tiempo Real**
```bash
sudo journalctl -u wedding-bot -f
```

### **Parar el Bot**
```bash
sudo systemctl stop wedding-bot
```

### **Reiniciar el Bot**
```bash
sudo systemctl restart wedding-bot
```

### **Ver Estado**
```bash
sudo systemctl status wedding-bot
```

---

## 💰 **Optimización de Costos**

### **Instancia e2-micro (Gratis)**
- **Costo**: $0/mes (dentro del free tier)
- **Specs**: 1 vCPU, 1GB RAM
- **Suficiente** para el bot de boda

### **Programar Apagado Automático**
```bash
# Crear script para apagar después de la boda
echo '#!/bin/bash
sudo shutdown -h now' | sudo tee /usr/local/bin/shutdown-after-wedding.sh
sudo chmod +x /usr/local/bin/shutdown-after-wedding.sh

# Programar apagado para el día después de la boda
echo "0 6 3 8 * /usr/local/bin/shutdown-after-wedding.sh" | sudo crontab -
```

---

## 🔒 **Seguridad**

### **Configurar Firewall**
```bash
# Permitir solo SSH
sudo ufw enable
sudo ufw allow ssh
sudo ufw default deny incoming
```

### **Actualizar Automáticamente**
```bash
sudo apt install unattended-upgrades
sudo dpkg-reconfigure -plow unattended-upgrades
```

---

## 🧪 **Proceso de Despliegue Completo**

1. **Crear VM** en GCP
2. **Configurar entorno** (Node.js, dependencias)
3. **Subir código** y credenciales
4. **Configurar servicios** systemd
5. **Iniciar bot** y escanear QR
6. **Verificar logs** que todo funcione

**¿Te ayudo con algún paso específico o prefieres que creemos un script automatizado para el despliegue?** 🚀 