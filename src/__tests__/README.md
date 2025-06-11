# 🧪 Unit Tests for Wedding WhatsApp Media Collector

This directory contains comprehensive unit tests for the timestamp-based filtering behavior and core functionality of the wedding bot.

## 🚀 Running Tests

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode (for development)
npm run test:watch
```

## 📋 Test Coverage

The tests cover the following key areas:

### 🕒 Timestamp-based Filtering
- **Old photo handling**: Photos taken before bot startup are completely skipped
- **Recent photo processing**: Photos taken after bot startup are processed normally
- **Boundary conditions**: Edge cases around bot startup time
- **Exact timestamp behavior**: Photos taken exactly at bot startup time

### 👥 Guest Notification System
- **First upload confirmation**: Welcome message sent for first photo/video from guest
- **Subsequent uploads**: Silent processing to avoid spam
- **Guest tracking**: Proper identification and tracking by phone number

### 📷 Media Type Handling
- **Image processing**: JPEG, PNG, etc. handled correctly
- **Video processing**: MP4, MOV, etc. handled correctly
- **Unsupported types**: PDF and other non-media files rejected

### 📏 File Size Validation
- **Large file rejection**: Files over size limit rejected with user feedback
- **Small file acceptance**: Files within limits processed normally

### 💬 Text Message Handling
- **Guidance responses**: Helpful replies to text-only messages
- **Group message filtering**: No responses in group chats
- **Own message filtering**: Bot doesn't respond to its own messages

### ❌ Error Handling
- **Download failures**: Graceful handling of media download errors
- **File save errors**: User notification when file operations fail
- **Drive upload errors**: Proper error messaging for cloud upload issues

### ⚙️ Configuration Handling
- **Google Drive disabled**: Bot works without cloud storage
- **Local save disabled**: Bot works with cloud-only storage

## 🎯 Key Test Features

### ✅ Comprehensive Mocking
- WhatsApp client fully mocked
- Google Drive uploader mocked
- File system operations mocked
- Configuration system mocked

### ⏱️ Timestamp Testing
- Uses `moment.js` for precise time manipulation
- Tests actual business logic of `moment().isAfter()`
- Validates the specific behavior where photos taken exactly at bot start time are NOT considered recent

### 📊 Coverage Targets
- **Global**: 50% statements, 50% lines, 50% branches, 40% functions
- **Bot file**: 75% statements, 75% lines, 70% branches, 75% functions

## 🔍 Test Examples

### Old Photo Skipping
```javascript
// Sets bot start time to "now"
bot.botStartTime = moment();

// Sets message timestamp to 1 hour ago (old photo)
mockMessage.timestamp = moment().subtract(1, 'hour').unix();

// Expects complete skip - no download, save, or upload
expect(mockMessage.downloadMedia).not.toHaveBeenCalled();
```

### Recent Photo Processing
```javascript
// Sets bot start time to 1 hour ago
bot.botStartTime = moment().subtract(1, 'hour');

// Sets message timestamp to "now" (recent photo)
mockMessage.timestamp = moment().unix();

// Expects full processing
expect(mockMessage.downloadMedia).toHaveBeenCalled();
expect(fs.writeFile).toHaveBeenCalled();
```

## 🎨 Test Structure

```
src/__tests__/
├── bot.test.js           # Main test file
└── README.md            # This file
```

All tests are organized into logical describe blocks:
- **Timestamp-based filtering**
- **Guest notification system**
- **Media type handling**
- **File size validation**
- **Text message handling**
- **Error handling**
- **Configuration handling**

## 🛠️ Development

When adding new features to the bot:

1. **Write tests first** (TDD approach recommended)
2. **Update existing tests** if behavior changes
3. **Maintain coverage** above the thresholds
4. **Test edge cases** especially around timestamp logic

The tests use Jest's mocking capabilities extensively to ensure:
- **Fast execution** (no real file operations)
- **Reliable results** (no external dependencies)
- **Isolated testing** (each test is independent)

Happy testing! 🧪✨ 