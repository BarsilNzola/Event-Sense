EventSense: DeAI for Markets
============================

EventSense is an AI-powered decentralized application that provides real-time insights on prediction markets, cryptocurrency prices, and market news. The platform combines AI analysis with blockchain technology to deliver verified, on-chain stored market intelligence.

🚀 Features
-----------

### Core Functionality

-   **AI-Powered Market Analysis**: Automated insights combining crypto prices, prediction markets, and news data

-   **Real-Time Price Feeds**: Live cryptocurrency prices powered by Pyth Network

-   **Prediction Market Integration**: Real-time data from Polymarket prediction markets

-   **News Aggregation**: Curated crypto and business news from multiple sources

-   **Blockchain Storage**: All AI insights are permanently stored on IPFS and BNB Smart Chain

-   **Interactive AI Assistant**: Chat-based interface for market queries and analysis

### Technical Features

-   **Decentralized Architecture**: Combines multiple data sources with blockchain storage

-   **Auto-Refresh System**: Real-time data updates every 15-30 minutes

-   **Responsive Design**: Mobile-friendly interface with consistent theming

-   **Wallet Integration**: Web3 wallet connectivity for blockchain interactions

🛠 Tech Stack
-------------

### Frontend

-   **React** - UI framework

-   **Tailwind CSS** - Styling and responsive design

-   **wagmi** - Web3 wallet integration

-   **Axios** - HTTP client for API calls

### Backend

-   **Node.js** - Runtime environment

-   **Express.js** - Web framework

-   **Google Gemini AI** - AI analysis and insights

-   **Pyth Network** - Real-time price feeds

-   **Polymarket API** - Prediction market data

### Blockchain & Storage

-   **BNB Smart Chain** - Blockchain storage for insights

-   **Lighthouse IPFS** - Decentralized file storage

-   **Ethers.js** - Blockchain interactions

📦 Installation
---------------

### Prerequisites

-   Node.js (v16 or higher)

-   npm or yarn

-   Web3 wallet (MetaMask, Coinbase Wallet, etc.)

### Backend Setup

1.  Clone the repository:

```bash

git clone <repository-url>
cd eventsense/backend

```

1.  Install dependencies:

```bash

npm install

```

1.  Set up environment variables:\
    Create a `.env` file in the backend root directory:

```env

GEMINI_API_KEY=your_gemini_api_key
LIGHTHOUSE_API_KEY=your_lighthouse_api_key
BNB_TESTNET_RPC=your_bnb_testnet_rpc_url
PRIVATE_KEY=your_wallet_private_key
CONTRACT_ADDRESS=your_smart_contract_address

```

1.  Start the backend server:

```bash

npm start

```

Server runs on `http://localhost:5000`

### Frontend Setup

1.  Navigate to the frontend directory:

```bash

cd ../frontend

```

1.  Install dependencies:

```bash

npm install

```

1.  Start the development server:

```bash

npm start

```

Application runs on `http://localhost:3000`

🏗 Project Structure
--------------------

```text

eventsense/
├── backend/
│   ├── routes/
│   │   ├── ai.js          # AI insights and query endpoints
│   │   ├── news.js        # News aggregation endpoints
│   │   ├── polymarket.js  # Prediction market data
│   │   └── prices.js      # Pyth price feed endpoints
│   ├── services/
│   │   ├── ai/            # AI service and analysis
│   │   ├── chain/         # Blockchain interactions
│   │   ├── lighthouse/    # IPFS storage
│   │   ├── news/          # News service
│   │   ├── polymarket/    # Market data service
│   │   └── pyth/          # Price feed service
│   └── server.js          # Main server file
└── frontend/
    ├── src/
    │   ├── components/    # React components
    │   ├── pages/         # Application pages
    │   ├── services/      # Frontend API services
    │   └── App.js         # Main app component
    └── public/            # Static assets

```

🔌 API Endpoints
----------------

### AI & Insights

-   `GET /api/ai/insights/auto` - Get latest AI insights

-   `GET /api/ai/insights/history` - Get insights history

-   `POST /api/ai/query` - Submit AI query

-   `GET /api/ai/insights/status` - Get insights service status

### Markets & Prices

-   `GET /api/polymarket/analyze` - Get prediction market data

-   `GET /api/prices/feeds` - Get cryptocurrency prices

-   `GET /api/prices/feeds-with-changes` - Get prices with trends

### News

-   `GET /api/news` - Get latest news articles

-   `GET /api/news/refresh` - Force news refresh

### Blockchain

-   `GET /api/chain/info` - Get contract information

-   `POST /api/chain/store` - Store CID on blockchain

-   `GET /api/chain/summaries` - Get stored summaries

🎨 UI Components
----------------

### Main Components

-   **Dashboard** - Main application interface with all features

-   **MarketCard** - Individual prediction market display

-   **PriceFeed** - Real-time cryptocurrency prices

-   **AIAssistant** - Interactive chat and insights interface

-   **NewsFeed** - News article aggregation

-   **WalletConnect** - Web3 wallet integration

### Design Theme

-   **Primary Color**: `#0F9E99` (Teal)

-   **Background**: `#EFE9E0` (Light beige)

-   **Text Primary**: `#4A2B1C` (Dark brown)

-   **Text Secondary**: `#98521F` (Medium brown)

-   **Cards**: White with `#E0F2F1` borders

🔄 Data Flow
------------

1.  **Data Collection**: Services fetch data from Pyth Network, Polymarket, and news RSS feeds

2.  **AI Analysis**: Gemini AI processes combined data to generate insights

3.  **Storage**: Insights are stored on IPFS and transaction hashes recorded on blockchain

4.  **Frontend Display**: Real-time updates via auto-refresh intervals

5.  **User Interaction**: Chat interface for custom queries and analysis

🚀 Deployment
-------------

### Backend Deployment

The backend can be deployed to services like:

-   Railway

-   Heroku

-   AWS EC2

-   DigitalOcean Droplets

### Frontend Deployment

The React frontend can be deployed to:

-   Vercel

-   Netlify

-   AWS S3 + CloudFront

-   GitHub Pages

### Environment Variables for Production

Ensure all environment variables are properly set for production deployment, including:

-   API keys

-   RPC endpoints

-   Contract addresses

-   CORS configurations

🤝 Contributing
---------------

1.  Fork the repository

2.  Create a feature branch (`git checkout -b feature/amazing-feature`)

3.  Commit your changes (`git commit -m 'Add amazing feature'`)

4.  Push to the branch (`git push origin feature/amazing-feature`)

5.  Open a Pull Request

📄 License
----------

This project is licensed under the MIT License - see the LICENSE file for details.

🔗 Links
--------

-   Live Demo - Add your live demo link here

-   Documentation - Add documentation link here

-   Smart Contracts - Add smart contract repository link here

🙏 Acknowledgments
------------------

-   Pyth Network for real-time price feeds

-   Polymarket for prediction market data

-   Google Gemini for AI capabilities

-   Lighthouse for IPFS storage

-   BNB Smart Chain for blockchain infrastructure