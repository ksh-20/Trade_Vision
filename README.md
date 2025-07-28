# Trade Vision - Stock Trading Screener

A comprehensive stock trading screener application with machine learning predictions, built with Python, React, and Highcharts.

## Features

- **Real-time Stock Data**: Integrated with Polygon.io API for up-to-date market information
- **Advanced Stock Screener**: Filter stocks based on price, volume, technical indicators, and more
- **Machine Learning Predictions**: ML model trained on technical indicators to provide trading signals
- **Interactive Charts**: Beautiful visualizations using Highcharts
- **Responsive UI**: Modern React frontend with Bootstrap styling
- **Technical Indicators**: MA, EMA, MACD, RSI, Fibonacci levels, and more

## Tech Stack

### Backend
- **Python/Flask**: RESTful API backend
- **MySQL**: Database for storing stock data and indicators
- **Scikit-learn**: Machine learning model for trading predictions
- **Polygon.io API**: Real-time stock data
- **Pandas/Numpy**: Data processing and analysis

### Frontend
- **React**: Modern UI framework
- **Highcharts**: Interactive stock charts
- **Bootstrap**: Responsive styling
- **Axios**: HTTP client for API calls

### Deployment
- **Google Cloud Platform (GCP)**: Cloud hosting
- **Apache**: Web server
- **MariaDB**: Database management

## Project Structure

```
Stock Project/
├── fetch.py              # Data fetching from Polygon.io
├── indicators.py         # Technical indicators calculation
├── ml_model.py          # Machine learning model
├── app.py               # Flask API backend
├── requirements.txt     # Python dependencies
├── frontend/            # React frontend
│   ├── package.json
│   ├── public/
│   └── src/
│       ├── components/
│       │   ├── Navigation.js
│       │   ├── Dashboard.js
│       │   ├── StockScreener.js
│       │   ├── StockDetail.js
│       │   └── MLPredictions.js
│       ├── App.js
│       └── index.js
└── README.md
```

## Setup Instructions

### Prerequisites
- Python 3.8+
- Node.js 16+
- MySQL/MariaDB database
- Polygon.io API key

### Backend Setup

1. **Install Python dependencies**:
   pip install -r requirements.txt
   ```

2. **Configure database**:
   - Update database connection details in `fetch.py`, `indicators.py`, `ml_model.py`, and `app.py`
   - Create the required tables (see database schema below)

3. **Set up Polygon.io API**:
   - Get your API key from [Polygon.io](https://polygon.io/)
   - Update the API key in `fetch.py`

4. **Run data collection**:
   # Fetch stock data
   python fetch.py
   
   # Calculate technical indicators
   python indicators.py
   
   # Train ML model
   python ml_model.py
   ```

5. **Start Flask API**:
   python app.py
   ```

### Frontend Setup

1. **Navigate to frontend directory**:
   cd frontend
   ```

2. **Install dependencies**:
   npm install
   ```

3. **Start development server**:
   npm start
   ```

The application will be available at `http://localhost:3000`

## Database Schema

### Main Tables
- `stock_list`: List of available stocks
- `{ticker}_data`: Raw stock data for each ticker
- `{ticker}_MA`: Technical indicators for each ticker

### Technical Indicators Calculated
- Moving Averages (5, 20, 50, 200-day)
- Exponential Moving Averages (12, 26-day)
- MACD and Signal Line
- RSI (Relative Strength Index)
- Fibonacci Retracement Levels

## API Endpoints

### Stock Data
- `GET /api/stocks` - Get list of all stocks
- `GET /api/stock/{ticker}/data` - Get stock data with indicators
- `GET /api/market-summary` - Get market summary statistics

### Stock Screener
- `POST /api/screener` - Screen stocks based on criteria

### ML Predictions
- `GET /api/predict/{ticker}` - Get ML prediction for a stock

### Health Check
- `GET /api/health` - API health status

## Usage

### Stock Screener
1. Navigate to the "Stock Screener" page
2. Set your filtering criteria (price, volume, RSI, etc.)
3. Click "Screen Stocks" to get results
4. Click on any stock to view detailed analysis

### ML Predictions
1. Go to "ML Predictions" page
2. Select stocks you want to analyze
3. Click "Get Predictions" to receive trading signals
4. View confidence levels and probability distributions

### Stock Analysis
1. Click on any stock ticker to view detailed analysis
2. Explore interactive charts showing price, indicators, and ML predictions
3. Analyze technical patterns and trading signals

## Machine Learning Model

The ML model uses a Random Forest Classifier trained on:
- Price and volume changes
- Technical indicator ratios
- MACD and RSI values
- Fibonacci level positions
- Volatility measures

The model predicts three classes:
- **Buy**: Bullish signal with high confidence
- **Sell**: Bearish signal with high confidence  
- **Hold**: Neutral signal or low confidence

## Deployment

### GCP Deployment
1. Set up Google Cloud Platform project
2. Configure Cloud SQL for MySQL
3. Deploy Flask app using App Engine or Compute Engine
4. Set up Apache web server
5. Configure domain and SSL certificates

### Environment Variables
Create a `.env` file with:
```
DB_HOST=your_db_host
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_NAME=your_db_name
POLYGON_API_KEY=your_polygon_api_key
```

## Disclaimer

This application is for educational and research purposes only. The trading signals and predictions should not be considered as financial advice. Always conduct your own research and consider consulting with a financial advisor before making investment decisions. 