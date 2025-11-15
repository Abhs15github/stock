# BBTfinance Setup Guide

This guide will help you set up the BBTfinance trading platform with cross-device synchronization.

## Overview

The platform consists of two parts:
1. **Frontend** (Next.js app) - User interface
2. **Backend** (Express API) - Data storage and synchronization

## Quick Start

### 1. Install MongoDB

MongoDB is required for cross-device data synchronization.

**macOS (using Homebrew):**
```bash
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community
```

**Ubuntu/Debian:**
```bash
sudo apt-get update
sudo apt-get install -y mongodb
sudo systemctl start mongodb
sudo systemctl enable mongodb
```

**Windows:**
1. Download from [MongoDB Download Center](https://www.mongodb.com/try/download/community)
2. Run the installer
3. Start MongoDB service from Services app

Verify MongoDB is running:
```bash
mongo --eval 'db.runCommand({ connectionStatus: 1 })'
```

### 2. Start the Backend Server

```bash
# Navigate to server directory
cd server

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Start the server
npm run dev
```

You should see:
```
✅ Connected to MongoDB
🚀 Server running on port 5000
```

### 3. Start the Frontend App

In a new terminal:

```bash
# Navigate to project root
cd /Users/abhishekgautam/Documents/stock

# Create frontend environment file
cp .env.local.example .env.local

# Install dependencies (if not already done)
npm install

# Start the Next.js dev server
npm run dev
```

The app will be available at `http://localhost:3000`

## User Accounts

The platform has three hardcoded user accounts:

| Username | Password | Display Name |
|----------|----------|--------------|
| hemant | Hemant@122 | Hemant |
| akshay | Akshay@99 | Akshay |
| abhs | Abhs@123 | Abhs |

## Testing Cross-Device Sync

To test cross-device synchronization:

1. **Same Computer, Different Browsers:**
   - Open `http://localhost:3000` in Chrome
   - Login as Hemant and create a session
   - Open `http://localhost:3000` in Firefox (or incognito)
   - Login as Hemant again
   - You should see the same sessions!

2. **Different Devices (Same Network):**
   - Find your computer's IP address:
     ```bash
     # macOS/Linux
     ifconfig | grep "inet "

     # Windows
     ipconfig
     ```
   - On another device, navigate to `http://YOUR_IP:3000`
   - Login with the same credentials
   - All data will be synced!

## Architecture

### Data Flow

1. User logs in through frontend
2. Frontend sends credentials to backend API
3. Backend validates and returns user info
4. All subsequent operations (create/update/delete sessions and trades) go through the API
5. Data is stored in MongoDB and accessible from any device

### Storage Locations

- **With API (Cross-Device):** MongoDB database
  - Database name: `bbtfinance`
  - Collections: `sessions`, `trades`, `calculations`

- **Without API (Single Device):** Browser localStorage
  - Keys: `bbt_trades_sessions`, `bbt_trades_trades`, etc.

## Switching Between Modes

You can switch between API mode and localStorage mode:

**Use API (Cross-Device):**
Edit `.env.local`:
```env
NEXT_PUBLIC_USE_API=true
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

**Use localStorage (Single Device):**
Edit `.env.local`:
```env
NEXT_PUBLIC_USE_API=false
```

After changing, restart the Next.js server:
```bash
npm run dev
```

## Troubleshooting

### Backend Server Won't Start

**Problem:** MongoDB connection error
```
❌ MongoDB connection error
```

**Solution:**
1. Check if MongoDB is running:
   ```bash
   # macOS
   brew services list | grep mongodb

   # Linux
   sudo systemctl status mongodb
   ```

2. Start MongoDB if needed:
   ```bash
   # macOS
   brew services start mongodb-community

   # Linux
   sudo systemctl start mongodb
   ```

### Cannot Access from Another Device

**Problem:** Connection refused when accessing from another device

**Solution:**
1. Make sure both devices are on the same network
2. Check your firewall allows incoming connections on ports 3000 and 5000
3. Use your actual IP address, not `localhost`

### Data Not Syncing

**Problem:** Changes on one device don't appear on another

**Solution:**
1. Check that `.env.local` has `NEXT_PUBLIC_USE_API=true`
2. Verify backend server is running (`http://localhost:5000/api/health`)
3. Check browser console for API errors
4. Try logging out and back in

### Port Already in Use

**Problem:** `Error: listen EADDRINUSE: address already in use :::5000`

**Solution:**
1. Change the port in `server/.env`:
   ```env
   PORT=5001
   ```
2. Update frontend `.env.local`:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:5001/api
   ```
3. Restart both servers

## Production Deployment

For production deployment, see:
- Frontend: [Next.js Deployment Docs](https://nextjs.org/docs/deployment)
- Backend: `server/README.md`

Recommended:
- Frontend: Deploy to Vercel
- Backend: Deploy to Railway, Heroku, or DigitalOcean
- Database: Use MongoDB Atlas (free tier available)

## Getting Help

If you encounter any issues:

1. Check the console logs in your browser (F12)
2. Check the backend server terminal for errors
3. Verify MongoDB is running and accessible
4. Make sure all dependencies are installed

## Next Steps

Now that your setup is complete:

1. Login with any of the hardcoded user accounts
2. Create a trading session
3. Add some trades
4. Test accessing from another device or browser
5. Verify all data is synchronized correctly

Enjoy using BBTfinance! 🚀
