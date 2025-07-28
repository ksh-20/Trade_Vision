from flask import Flask, request, jsonify
from flask_cors import CORS
import mysql.connector
import pandas as pd
import json
from datetime import datetime, timedelta
from ml_model import TradingMLModel
import joblib
import os

app = Flask(__name__)
CORS(app)

# Database configuration
DB_CONFIG = {
    'host': '104.154.25.113',
    'user': 'kshitij',
    'password': 'Kshitij_17',
    'database': 'stocks'
}

# Initialize ML model
ml_model = None

def get_db_connection():
    """Create database connection"""
    return mysql.connector.connect(**DB_CONFIG)

def load_ml_model():
    """Load the trained ML model"""
    global ml_model
    if ml_model is None and os.path.exists('trading_model.pkl'):
        ml_model = TradingMLModel()
        ml_model.model = joblib.load('trading_model.pkl')
        ml_model.scaler = joblib.load('trading_scaler.pkl')
        ml_model.is_trained = True
    return ml_model

@app.route('/api/stocks', methods=['GET'])
def get_stocks():
    """Get list of all available stocks"""
    try:
        mydb = get_db_connection()
        cursor = mydb.cursor()
        
        cursor.execute('SELECT ticker, stock FROM stock_list')
        stocks = [{'ticker': row[0], 'name': row[1]} for row in cursor.fetchall()]
        
        cursor.close()
        mydb.close()
        
        return jsonify({'stocks': stocks})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/stock/<ticker>/data', methods=['GET'])
def get_stock_data(ticker):
    """Get stock data with technical indicators"""
    try:
        mydb = get_db_connection()
        
        # Get price data
        price_df = pd.read_sql(f"SELECT * FROM {ticker.lower()}_data ORDER BY timestamp DESC LIMIT 100", mydb)
        
        # Get technical indicators
        indicators_df = pd.read_sql(f"SELECT * FROM {ticker.lower()}_MA ORDER BY timestamp DESC LIMIT 100", mydb)
        
        mydb.close()
        
        # Combine data
        data = []
        for _, row in indicators_df.iterrows():
            data.append({
                'timestamp': row['timestamp'].isoformat() if row['timestamp'] else None,
                'close': float(row['close']) if row['close'] else None,
                'volume': int(row['volume']) if 'volume' in row and row['volume'] else None,
                'ma_5day': float(row['MA_5DAY']) if row['MA_5DAY'] else None,
                'ma_20day': float(row['MA_20DAY']) if row['MA_20DAY'] else None,
                'ma_50day': float(row['MA_50DAY']) if row['MA_50DAY'] else None,
                'ma_200day': float(row['MA_200DAY']) if row['MA_200DAY'] else None,
                'ema_12day': float(row['EMA_12DAY']) if row['EMA_12DAY'] else None,
                'ema_26day': float(row['EMA_26DAY']) if row['EMA_26DAY'] else None,
                'macd': float(row['MACD']) if row['MACD'] else None,
                'signal_line': float(row['SIGNAL_LINE']) if row['SIGNAL_LINE'] else None,
                'rsi': float(row['RSI']) if row['RSI'] else None,
                'fib_0': float(row['Fib_0']) if row['Fib_0'] else None,
                'fib_236': float(row['Fib_236']) if row['Fib_236'] else None,
                'fib_382': float(row['Fib_382']) if row['Fib_382'] else None,
                'fib_500': float(row['Fib_500']) if row['Fib_500'] else None,
                'fib_618': float(row['Fib_618']) if row['Fib_618'] else None,
                'fib_100': float(row['Fib_100']) if row['Fib_100'] else None
            })
        
        return jsonify({'data': data})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/screener', methods=['POST'])
def screen_stocks():
    """Screen stocks based on criteria"""
    try:
        criteria = request.json
        
        mydb = get_db_connection()
        cursor = mydb.cursor()
        
        # Get list of stocks
        cursor.execute('SELECT ticker FROM stock_list')
        tickers = [row[0].lower() for row in cursor.fetchall()]
        
        results = []
        
        for ticker in tickers:
            try:
                # Get latest data
                df = pd.read_sql(f"SELECT * FROM {ticker}_MA ORDER BY timestamp DESC LIMIT 1", mydb)
                
                if len(df) == 0:
                    continue
                
                latest = df.iloc[0]
                
                # Apply filters
                passes_filters = True
                
                if 'min_price' in criteria and latest['close'] < criteria['min_price']:
                    passes_filters = False
                
                if 'max_price' in criteria and latest['close'] > criteria['max_price']:
                    passes_filters = False
                
                if 'min_volume' in criteria and latest['volume'] < criteria['min_volume']:
                    passes_filters = False
                
                if 'rsi_oversold' in criteria and latest['RSI'] > criteria['rsi_oversold']:
                    passes_filters = False
                
                if 'rsi_overbought' in criteria and latest['RSI'] < criteria['rsi_overbought']:
                    passes_filters = False
                
                if 'ma_crossover' in criteria and criteria['ma_crossover']:
                    # Check if price is above 20-day MA and 20-day MA is above 50-day MA
                    if latest['close'] < latest['MA_20DAY'] or latest['MA_20DAY'] < latest['MA_50DAY']:
                        passes_filters = False
                
                if 'macd_bullish' in criteria and criteria['macd_bullish']:
                    # Check if MACD is above signal line
                    if latest['MACD'] <= latest['SIGNAL_LINE']:
                        passes_filters = False
                
                if passes_filters:
                    results.append({
                        'ticker': ticker.upper(),
                        'close': float(latest['close']),
                        'volume': int(latest['volume']) if latest['volume'] else 0,
                        'rsi': float(latest['RSI']) if latest['RSI'] else None,
                        'macd': float(latest['MACD']) if latest['MACD'] else None,
                        'ma_20day': float(latest['MA_20DAY']) if latest['MA_20DAY'] else None,
                        'ma_50day': float(latest['MA_50DAY']) if latest['MA_50DAY'] else None
                    })
                    
            except Exception as e:
                continue
        
        cursor.close()
        mydb.close()
        
        return jsonify({'results': results})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/predict/<ticker>', methods=['GET'])
def predict_signal(ticker):
    """Get ML prediction for a stock"""
    try:
        model = load_ml_model()
        if model is None:
            return jsonify({'error': 'ML model not available'}), 500
        
        prediction = model.predict_trading_signal(ticker.lower())
        
        if prediction is None:
            return jsonify({'error': 'Unable to generate prediction'}), 500
        
        return jsonify(prediction)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/market-summary', methods=['GET'])
def get_market_summary():
    """Get market summary statistics"""
    try:
        mydb = get_db_connection()
        cursor = mydb.cursor()
        
        # Get total number of stocks
        cursor.execute('SELECT COUNT(*) FROM stock_list')
        total_stocks = cursor.fetchone()[0]
        
        # Get stocks with recent data
        cursor.execute('SELECT ticker FROM stock_list')
        tickers = [row[0].lower() for row in cursor.fetchall()]
        
        active_stocks = 0
        total_volume = 0
        
        for ticker in tickers[:50]:  # Sample first 50 stocks
            try:
                df = pd.read_sql(f"SELECT volume FROM {ticker}_data ORDER BY timestamp DESC LIMIT 1", mydb)
                if len(df) > 0 and df.iloc[0]['volume']:
                    active_stocks += 1
                    total_volume += df.iloc[0]['volume']
            except:
                continue
        
        cursor.close()
        mydb.close()
        
        return jsonify({
            'total_stocks': total_stocks,
            'active_stocks': active_stocks,
            'total_volume': total_volume,
            'last_updated': datetime.now().isoformat()
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({'status': 'healthy', 'timestamp': datetime.now().isoformat()})

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000) 