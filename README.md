# 🎉 Wedding WhatsApp Media Collector

A simple and elegant solution to collect photos and videos from your wedding guests using WhatsApp, with automatic synchronization to Google Drive.

## 🌟 Features

- ✅ **No app installation required** - Guests use WhatsApp they already have
- 📱 **QR Code sharing** - Guests scan and start sharing immediately  
- 🤖 **Automated WhatsApp bot** - Handles all media collection
- ☁️ **Google Drive sync** - All media automatically saved to your Drive
- 📸 **Photos & Videos support** - Handles all common formats
- 🇪🇸 **Bilingual support** - Spanish and English messages
- 🎊 **Wedding optimized** - Designed specifically for wedding celebrations
- ⏰ **Smart filtering** - Only recent photos (taken during wedding) sync to cloud

## 🚀 Quick Start

### 1. Installation

```bash
# Clone or download this project
cd wedding-whatsapp-media-collector

# Install dependencies
npm install

# Run setup wizard
npm run setup
```

### 2. Setup Google Drive (Required)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the **Google Drive API**
4. Create credentials:
   - Go to "Credentials" → "Create Credentials" → "Service Account"
   - Download the JSON key file
   - Rename it to `google-credentials.json`
   - Move it to the `config/` directory

### 3. Configure Your Wedding Details

Edit the `wedding.env` file created during setup:

```env
COUPLE_NAMES="María & José"
WEDDING_DATE="2024-08-15"
WEDDING_WHATSAPP_NUMBER="+34612345678"
```

### 4. Start the Bot

```bash
npm start
```

1. Scan the QR code with WhatsApp Web to connect your bot
2. The system will generate QR codes for guests in `qr-codes/` folder
3. Print or display the guest QR code at your wedding venue

## 📱 How It Works for Guests

1. **Scan the QR code** with their phone camera
2. **WhatsApp opens automatically** with a pre-written message
3. **Send photos/videos** directly in the chat
4. **Receive confirmation** that media was saved
5. **That's it!** No apps, no complicated steps

## 🎯 Guest Experience

When guests scan your QR code, they'll see:

```
🎉 ¡Hola! Soy parte de la boda de María & José. 
Comparte tus fotos y videos de la celebración aquí. 
📸📹 ¡Muchas gracias por acompañarnos!
```

After sending their **first** photo/video:
```
✅ ¡Recibido! Tus fotos y videos se guardan automáticamente.
☁️ Las fotos tomadas desde que empezó la boda se sincronizan en la nube.
¡Gracias por compartir estos momentos especiales! 💕

📸 Puedes seguir enviando más fotos sin preocuparte.
```

**Additional uploads**: Processed silently to avoid notification spam.

## 📁 File Organization

Your media will be automatically organized:

```
Google Drive/
└── Wedding Photos & Videos - 2024/
    ├── Photos/
    │   ├── 2024-08-15_14-30-25_Maria-Lopez.jpg
    │   └── 2024-08-15_15-45-12_Jose-Garcia.png
    └── Videos/
        ├── 2024-08-15_16-20-33_Ana-Rodriguez.mp4
        └── 2024-08-15_17-10-45_Carlos-Martinez.mov
```

## 🛠️ Configuration Options

### Environment Variables (`wedding.env`)

| Variable | Description | Example |
|----------|-------------|---------|
| `COUPLE_NAMES` | Names for the welcome message | `"María & José"` |
| `WEDDING_DATE` | Wedding date | `"2024-08-15"` |
| `WEDDING_WHATSAPP_NUMBER` | Your WhatsApp number with country code | `"+34612345678"` |
| `SAVE_LOCALLY` | Keep local copies | `true` |
| `DELETE_AFTER_UPLOAD` | Delete local files after Drive upload | `false` |
| `MAX_FILE_SIZE_MB` | Maximum file size limit | `25` |

### Supported Media Formats

**Photos:** JPG, JPEG, PNG, GIF, WebP  
**Videos:** MP4, MOV, AVI, MKV, WebM

## 📋 Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Start the bot |
| `npm run dev` | Start with auto-restart |
| `npm run setup` | Run setup wizard |

## 🎨 Customization

### Custom Welcome Message

Edit the welcome message in `src/bot.js`:

```javascript
const weddingMessage = encodeURIComponent(
    '🎉 ¡Hola! Soy parte de la boda de [NOMBRES]. ' +
    'Comparte tus fotos y videos de la celebración aquí. ' +
    '📸📹 ¡Muchas gracias por acompañarnos!'
);
```

### Custom Responses

Modify bot responses in the `handleMessage` method in `src/bot.js`.

## 🔧 Troubleshooting

### Bot won't start
- Check that all dependencies are installed: `npm install`
- Verify Google Drive credentials are in `config/google-credentials.json`
- Check that your phone has WhatsApp Web access

### Media not uploading to Drive
- Verify Google Drive API is enabled
- Check credentials file permissions
- Ensure the service account has Drive access

### QR code not working
- Verify your WhatsApp number format includes country code
- Test the generated URL manually
- Check that the phone number is active on WhatsApp

## 📱 Printing QR Codes

The system generates multiple QR code sizes:

- `wedding-qr.png` - Standard size (400px)
- `wedding-qr-print.png` - Print size (800px)
- `qr-instructions.txt` - Instructions to display

**Tip:** Create table cards with the QR code and instructions for easy guest access.

## 🔐 Privacy & Security

- Only you have access to the Google Drive folder
- Media is processed locally on your server
- No third-party services store your wedding photos
- Guest phone numbers are not stored permanently

## 💡 Wedding Day Tips

1. **Test everything beforehand** - Run a full test with friends/family
2. **Multiple QR codes** - Place QR codes at different tables/locations
3. **Instructions in multiple languages** if needed
4. **Backup plan** - Have a secondary collection method ready
5. **Monitor during event** - Keep an eye on the bot during the celebration

## 🆘 Support

For issues or questions:

1. Check the troubleshooting section above
2. Verify all setup steps were completed
3. Check console logs for error messages
4. Test with a simple photo first

## 📄 License

MIT License - Feel free to use for your special day!

---

## 🎊 ¡Felicidades por tu boda! 

**Enjoy your special day and let technology handle the photo collection!** 📸💕

---

*Made with ❤️ for couples who want to focus on celebrating, not managing photos.* 