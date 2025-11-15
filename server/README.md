# BBTfinance Backend API Server

Backend API server for cross-device data synchronization in the BBTfinance trading platform.

## Features

- **Cross-device synchronization**: Access your sessions and trades from any device
- **MongoDB database**: Persistent storage for all user data
- **RESTful API**: Clean and simple API endpoints
- **User authentication**: Secure login with hardcoded users

## Prerequisites

Before running the server, make sure you have:

1. **Node.js** installed (v14 or higher)
2. **MongoDB** installed and running locally

### Installing MongoDB

**On macOS (using Homebrew):**
```bash
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community
```

**On Ubuntu/Debian:**
```bash
sudo apt-get install mongodb
sudo systemctl start mongodb
```

**On Windows:**
Download and install from [MongoDB Download Center](https://www.mongodb.com/try/download/community)

## Installation

1. Navigate to the server directory:
```bash
cd server
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file:
```bash
cp .env.example .env
```

4. Edit `.env` if needed (default settings work for local development):
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/bbtfinance
NODE_ENV=development
```

## Running the Server

**Development mode** (with auto-reload):
```bash
npm run dev
```

**Production mode**:
```bash
npm start
```

The server will start on `http://localhost:5000`

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login with username and password
- `GET /api/auth/verify` - Verify user session

### Sessions
- `GET /api/sessions` - Get all user sessions
- `POST /api/sessions` - Create a new session
- `PUT /api/sessions/:id` - Update a session
- `DELETE /api/sessions/:id` - Delete a session

### Trades
- `GET /api/trades` - Get all user trades
- `GET /api/trades/session/:sessionId` - Get trades for a specific session
- `POST /api/trades` - Create a new trade
- `POST /api/trades/bulk` - Create multiple trades
- `PUT /api/trades/:id` - Update a trade
- `DELETE /api/trades/:id` - Delete a trade

### Calculations
- `GET /api/calculations` - Get all user calculations
- `POST /api/calculations` - Save a new calculation
- `DELETE /api/calculations/:id` - Delete a calculation

### Health Check
- `GET /api/health` - Server health check

## Hardcoded Users

The system uses three hardcoded users:

1. **Hemant**
   - Username: `hemant`
   - Password: `Hemant@122`

2. **Akshay**
   - Username: `akshay`
   - Password: `Akshay@99`

3. **Abhs**
   - Username: `abhs`
   - Password: `Abhs@123`

## Testing the API

You can test the API using curl:

```bash
# Health check
curl http://localhost:5000/api/health

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"hemant","password":"Hemant@122"}'

# Get sessions (replace USER_ID with actual user ID from login response)
curl http://localhost:5000/api/sessions \
  -H "x-user-id: user-hemant"
```

## Database

The MongoDB database will be automatically created when you first run the server. The database name is `bbtfinance` and it contains the following collections:

- `users` - User accounts
- `sessions` - Trading sessions
- `trades` - Individual trades
- `calculations` - BBT calculator results

## Troubleshooting

### MongoDB Connection Error

If you get a MongoDB connection error:

1. Make sure MongoDB is running:
   ```bash
   # macOS
   brew services list | grep mongodb

   # Linux
   sudo systemctl status mongodb
   ```

2. Try connecting manually:
   ```bash
   mongo mongodb://localhost:27017/bbtfinance
   ```

3. Check your `.env` file has the correct `MONGODB_URI`

### Port Already in Use

If port 5000 is already in use, change the `PORT` in your `.env` file and update the frontend API URL accordingly.

## Production Deployment

For production deployment:

1. Set `NODE_ENV=production` in your `.env`
2. Use a production MongoDB instance (MongoDB Atlas recommended)
3. Add proper security measures (JWT tokens, rate limiting, etc.)
4. Use a process manager like PM2:
   ```bash
   npm install -g pm2
   pm2 start index.js --name bbtfinance-api
   ```
