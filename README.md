# BBT Trades - Advanced Trading Performance Tracker & Analytics Platform

A modern, responsive web application for crypto and finance professionals to track trading performance, manage trading sessions, and access advanced BBT analytics with real-time market insights.

## ✨ Features

### 🔐 Authentication & Security
- **Local Authentication**: Secure registration and login with robust password validation
- **Session Management**: 30-minute session expiry with automatic logout
- **Password Requirements**: 8+ characters with uppercase, lowercase, numbers, and special characters

### 📊 Enhanced Dashboard
- **User Insights**: Welcome greeting with personalized trading metrics
- **BBT Analytics**: Recent BBT calculations with position size, risk-reward, and compound interest tools
- **Market Charts**: Interactive crypto price charts with 7-day trend data for BBT, BTC, ETH, and more
- **Real-time Statistics**: Total trades, profit/loss percentage, active investment, and session metrics
- **Quick Actions**: Fast access to trade tracking and session creation

### 💹 Advanced Trade Tracking
- **Complete CRUD Operations**: Add, edit, view, and delete trading records
- **Auto-calculation**: Automatic profit/loss calculation for buy/sell trades
- **Interactive Trade History**: Sortable and filterable table with pagination
- **Search & Filter**: Find trades by pair name, filter by profit/loss status
- **Color-coded Results**: Green for profits, red for losses with percentage indicators
- **Trade Analytics**: Comprehensive statistics with profit percentages and investment tracking

### 🎯 Trading Sessions
- **Session Management**: Create and manage trading sessions with detailed metrics
- **Performance Tracking**: Monitor capital, trades, accuracy, and risk-reward ratios
- **Status Control**: Toggle between active and completed sessions
- **Session Analytics**: View total, active, and completed session statistics

### 📈 Market Insights (Mock Data Ready for API Integration)
- **Multi-asset Charts**: BBT, Bitcoin, Ethereum, and other major cryptocurrencies
- **Price Trends**: 7-day price movement with interactive line charts
- **Market Data**: Real-time price updates with 24h change indicators
- **Analytics Dashboard**: Market insights and trend analysis

### 🎨 Modern UI/UX
- **Responsive Design**: Mobile-first design with Tailwind CSS
- **Smooth Animations**: Framer Motion animations for enhanced user experience
- **Interactive Components**: Hover effects, loading states, and smooth transitions
- **Professional Layout**: Clean, organized interface with intuitive navigation

## 🛠️ Tech Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **Charts**: Recharts
- **Icons**: Lucide React
- **State Management**: React Context API
- **Storage**: Local Storage (development) / MongoDB (production ready)
- **Date Handling**: date-fns

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

## 🚀 Usage Guide

### 🔐 Authentication
1. **Register**: Create account with name, email, and secure password
2. **Login**: Access your personalized dashboard
3. **Session Security**: Auto-logout after 30 minutes of inactivity

### 📊 Enhanced Dashboard
- **Overview**: View total trades, profit/loss %, active investment, and sessions
- **BBT Calculations**: Access recent calculations (position size, risk-reward, compound interest)
- **Market Charts**: Analyze 7-day price trends for BBT, BTC, ETH, and other cryptocurrencies
- **Quick Actions**: Fast access to add trades and create sessions

### 💹 Trade Tracking System
1. **Add New Trade**:
   - Click "Add Trade" from dashboard or trades page
   - Enter trading pair (e.g., BTC/USDT)
   - Select trade type (Buy/Long or Sell/Short)
   - Input entry price, exit price, and investment amount
   - Set trade date
   - View real-time profit/loss preview

2. **Manage Trades**:
   - **View All Trades**: Navigate to trades page for complete history
   - **Search & Filter**: Find trades by pair name or filter by profit/loss
   - **Sort**: Order by date, pair name, or profit amount
   - **Edit**: Update trade details with recalculated P&L
   - **Delete**: Remove trades with confirmation

3. **Trade Analytics**:
   - View total trades, profit, loss, and percentage returns
   - Color-coded profit (green) and loss (red) indicators
   - Pagination for large trade histories (10 trades per page)

### 🎯 Trading Sessions
1. **Create Sessions**: Set up trading periods with capital, trade count, accuracy, and R:R ratio
2. **Monitor Performance**: Track active vs completed sessions
3. **Session Management**: Toggle status and delete sessions as needed

### 📈 Market Insights
- **Real-time Charts**: Interactive price charts with 7-day historical data
- **Multi-asset Support**: BBT, Bitcoin, Ethereum, BNB, ADA, SOL, MATIC, DOT
- **Price Analytics**: 24h change indicators and trend analysis
- **Market Selector**: Switch between different cryptocurrencies

### 🔄 API Integration Points
The application is designed with clear separation for future API integration:
- **BBT Calculations**: Replace mock data with real BBT API endpoints
- **Market Data**: Connect to CoinGecko, Binance, or other crypto data providers
- **User Data**: Migration path to MongoDB or other databases
- **Real-time Updates**: WebSocket support for live market data

## Project Structure

```
app/
├── components/          # Reusable UI components
│   ├── BBTCalculationsWidget.tsx  # BBT calculations display
│   ├── Header.tsx              # Navigation header with routing
│   ├── LoadingSpinner.tsx      # Loading states
│   ├── MarketChart.tsx         # Interactive crypto price charts
│   ├── StatCard.tsx            # Enhanced statistics cards
│   └── Toast.tsx               # Notification system
├── context/            # React Context providers
│   ├── AuthContext.tsx         # Authentication with session expiry
│   ├── SessionContext.tsx      # Trading session management
│   └── TradeContext.tsx        # Trade tracking and analytics
├── dashboard/          # Enhanced dashboard with analytics
├── trades/            # Complete trade tracking system
├── login/             # Login page
├── register/          # Registration page
├── types/             # TypeScript type definitions
├── utils/             # Utility functions
│   ├── storage.ts     # Extended storage utilities
│   ├── validation.ts  # Form validation
│   └── mockData.ts    # Mock data generators for development
├── globals.css        # Global styles with animations
├── layout.tsx         # Root layout with providers
└── page.tsx          # Home page routing
```

## 💾 Data Storage

### Current Implementation (Development)
Browser localStorage with structured data management:
- **Users**: `bbt_trades_users` - User accounts and authentication
- **Sessions**: `bbt_trades_sessions` - Trading session data
- **Trades**: `bbt_trades_trades` - Individual trade records
- **BBT Calculations**: `bbt_trades_calculations` - Calculation history
- **Current User**: `bbt_trades_current_user` - Active user session
- **Session Expiry**: `bbt_trades_session_expiry` - Security timeout

### Production Ready Features
- **Session Security**: 30-minute auto-expiry with background monitoring
- **Data Validation**: Comprehensive input validation and error handling
- **State Management**: Centralized context providers for scalable state
- **API Hooks**: Pre-built integration points for backend services

## 🚀 Future Enhancements

### Immediate API Integration Points
```typescript
// TODO: Connect BBT API here
const bbtCalculations = await fetchBBTCalculations(userId);

// TODO: Connect crypto data streaming
const marketData = await fetchMarketData(symbol);

// TODO: Replace with real database
const trades = await api.getTrades(userId);
```

### Planned Features
- **Real Database**: MongoDB integration with user data migration
- **Live Market Data**: WebSocket connections for real-time crypto prices
- **External Auth**: OAuth integration (Google, GitHub, etc.)
- **Advanced Analytics**:
  - Portfolio performance tracking
  - Risk assessment tools
  - Custom indicators and signals
- **Additional Calculators**:
  - Advanced position sizing
  - Portfolio rebalancing
  - Tax calculation tools
- **Export Features**: CSV, PDF, and Excel export functionality
- **Mobile App**: React Native version for iOS/Android

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