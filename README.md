# BBT Trades - Trading Performance Tracker

A modern, responsive web application for crypto and finance professionals to track trading performance and manage trading sessions.

## Features

- **User Authentication**: Local registration and login with password validation
- **Trading Sessions**: Create and manage trading sessions with detailed metrics
- **Dashboard**: Real-time statistics showing total, active, and completed sessions
- **Session Management**: Update session status and delete sessions
- **Responsive Design**: Mobile-friendly interface built with Tailwind CSS
- **Error Handling**: Comprehensive error handling with user-friendly notifications

## Tech Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **State Management**: React Context API
- **Storage**: Local Storage (for development)

## Getting Started

### Prerequisites

- Node.js 18.0 or higher
- npm or yarn package manager

### Installation

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd stock
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Run the development server**:
   ```bash
   npm run dev
   ```

4. **Open your browser** and navigate to [http://localhost:3000](http://localhost:3000)

### Building for Production

```bash
npm run build
npm start
```

## Usage

### Authentication

1. **Register a new account**:
   - Navigate to the registration page
   - Enter your name, email, and password
   - Password must meet the following requirements:
     - At least 8 characters
     - One uppercase letter
     - One lowercase letter
     - One number
     - One special character

2. **Login**:
   - Use your registered email and password
   - You'll be redirected to the dashboard upon successful login

### Managing Trading Sessions

1. **Create a Session**:
   - Click "New Session" on the dashboard
   - Fill in the session details:
     - Session name
     - Starting capital
     - Total trades
     - Accuracy percentage
     - Risk-reward ratio
     - Status (Active or Completed)

2. **View Sessions**:
   - All sessions are displayed in a table format
   - View key metrics like capital, trades, accuracy, and R:R ratio

3. **Manage Sessions**:
   - Click the three-dot menu on any session to:
     - Toggle between Active and Completed status
     - Delete the session

### Dashboard Statistics

The dashboard displays three key metrics:
- **Total Sessions**: All sessions created
- **Active Sessions**: Currently running sessions
- **Completed Sessions**: Finished sessions

## Project Structure

```
app/
├── components/          # Reusable UI components
│   ├── Header.tsx      # Navigation header
│   ├── LoadingSpinner.tsx
│   ├── StatCard.tsx    # Statistics display cards
│   └── Toast.tsx       # Notification system
├── context/            # React Context providers
│   ├── AuthContext.tsx # Authentication state
│   └── SessionContext.tsx # Session management
├── dashboard/          # Dashboard page
├── login/             # Login page
├── register/          # Registration page
├── types/             # TypeScript type definitions
├── utils/             # Utility functions
│   ├── storage.ts     # Local storage utilities
│   └── validation.ts  # Form validation
├── globals.css        # Global styles
├── layout.tsx         # Root layout
└── page.tsx          # Home page (redirects)
```

## Data Storage

Currently, the application uses browser localStorage for data persistence:
- **Users**: Stored in `bbt_trades_users`
- **Sessions**: Stored in `bbt_trades_sessions`
- **Current User**: Stored in `bbt_trades_current_user`

## Future Enhancements

The application is designed to be easily extensible with:
- Real database integration (MongoDB)
- External authentication providers
- Live crypto data integration
- Additional calculators:
  - Profit/Loss calculator
  - Position size calculator
  - Compounding calculator
  - Risk management tools
- Advanced analytics and reporting
- Export functionality (CSV, PDF)

## Error Handling

The application includes comprehensive error handling:
- Form validation with user-friendly messages
- Network error handling
- Graceful fallbacks for missing data
- Toast notifications for user feedback

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support or questions, please create an issue in the repository.