# 🚀 eBay Moderation Assistant - Server Setup

## Running with Training Data Collection

### 📋 Quick Start

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Start the Server**:
   ```bash
   npm run server
   # or
   npm run dev
   ```

3. **Access the App**:
   - Open: `http://localhost:3001`
   - Training data will be automatically collected in `AI_assistant_training_data.json`

### 🎯 What the Server Does

#### **Training Data Collection**:
- ✅ **Automatic file creation** - Creates `AI_assistant_training_data.json` on first run
- ✅ **Global instance counter** - Increments across ALL users
- ✅ **Real-time updates** - Every AI action saves to file immediately
- ✅ **Session tracking** - Tracks which user made each decision
- ✅ **Persistent storage** - Data survives server restarts

#### **API Endpoints**:
- `POST /api/training-data` - Record new training instance
- `GET /api/training-data/status` - Get current stats
- `GET /api/training-data/export` - Download full dataset
- `DELETE /api/training-data/reset` - Reset data (admin only)
- `GET /api/health` - Server health check

### 📊 Training Data Structure

The server creates and maintains `AI_assistant_training_data.json`:

```json
{
  "instanceCount": 47,
  "trainingInstances": [
    {
      "index": 0,
      "postContent": "I'll beat you up if you outbid me again!",
      "priority": "P1",
      "userAction": "Ban",
      "timestamp": "2024-10-28T15:30:45.123Z",
      "sessionId": "session_1730123445123_abc123"
    }
  ],
  "createdDate": "2024-10-28T15:30:45.123Z",
  "lastUpdated": "2024-10-28T15:30:45.123Z",
  "version": "2.0.0"
}
```

### 🔧 Admin Features

#### **Server Console**:
- Real-time logging of all training data saves
- Instance counter updates
- Error monitoring

#### **Browser Console** (Ctrl+Shift+F12):
```javascript
// Check training data status
fetch('/api/training-data/status').then(r => r.json()).then(console.log)

// Export all data
window.adminTools.exportTrainingData()

// View local session ID
localStorage.getItem('ebay-mod-session-id')
```

### 🚨 Important Notes

- **File Location**: `AI_assistant_training_data.json` in repository root
- **Auto-Creation**: File created automatically on first training data
- **Persistence**: Data survives server restarts and crashes
- **Global Counter**: Increments across all users and sessions
- **Fallback**: Uses localStorage if server is unreachable

### 🎯 Production Deployment

For production, consider:
- Environment variables for configuration
- Database instead of JSON file for better performance
- Authentication for admin endpoints
- Rate limiting for API endpoints
- HTTPS certificates

### 📁 File Structure
```
├── server.js                          # Express server
├── AI_assistant_training_data.json    # Auto-generated training data
├── package.json                       # Updated with server dependencies
├── index.html                         # Static frontend
├── app.js                             # React frontend (for development)
└── README_SERVER.md                   # This file
```

**Ready to collect training data from all users! 🎉**

