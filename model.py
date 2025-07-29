import mysql.connector
import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import classification_report, accuracy_score
import joblib
import warnings
warnings.filterwarnings('ignore')

class TradingMLModel:
    def __init__(self):
        self.model = RandomForestClassifier(n_estimators=100, random_state=42)
        self.scaler = StandardScaler()
        self.is_trained = False
        
    def connect_db(self):
        return mysql.connector.connect(
            host='104.154.25.113',
            user='kshitij',
            password='Kshitij_17',
            database='stocks'
        )
    
    def prepare_features(self, df):
        features = []
        
        # Price-based features
        features.append(df['close'].pct_change())  # Price change
        features.append(df['volume'].pct_change())  # Volume change
        
        # Technical indicators
        features.append(df['MA_5DAY'] / df['close'] - 1)  # Price vs 5-day MA
        features.append(df['MA_20DAY'] / df['close'] - 1)  # Price vs 20-day MA
        features.append(df['MA_50DAY'] / df['close'] - 1)  # Price vs 50-day MA
        features.append(df['MA_200DAY'] / df['close'] - 1)  # Price vs 200-day MA
        
        # MACD features
        features.append(df['MACD'])
        features.append(df['SIGNAL_LINE'])
        features.append(df['MACD'] - df['SIGNAL_LINE'])  # MACD histogram
        
        # RSI features
        features.append(df['RSI'] / 100)  # Normalized RSI
        
        # Fibonacci features
        features.append((df['close'] - df['Fib_0']) / (df['Fib_100'] - df['Fib_0']))  # Price position in Fib range
        features.append(df['close'] / df['Fib_618'] - 1)  # Price vs 61.8% Fib
        features.append(df['close'] / df['Fib_382'] - 1)  # Price vs 38.2% Fib
        
        # Volatility features
        features.append(df['close'].rolling(20).std() / df['close'])  # 20-day volatility
        
        feature_df = pd.concat(features, axis=1)
        feature_df.columns = [
            'price_change', 'volume_change', 'ma5_ratio', 'ma20_ratio', 'ma50_ratio', 'ma200_ratio',
            'macd', 'signal_line', 'macd_histogram', 'rsi_norm', 'fib_position', 'fib618_ratio', 
            'fib382_ratio', 'volatility_20d'
        ]
        
        return feature_df
    
    def create_labels(self, df, lookforward_days=5, threshold=0.02):
        future_returns = df['close'].shift(-lookforward_days) / df['close'] - 1
        
        labels = []
        for ret in future_returns:
            if pd.isna(ret):
                labels.append('Hold')
            elif ret > threshold:
                labels.append('Buy')
            elif ret < -threshold:
                labels.append('Sell')
            else:
                labels.append('Hold')
        
        return labels
    
    def train_model(self):
        print("Training ML model...")
        
        mydb = self.connect_db()
        cursor = mydb.cursor()
        
        cursor.execute('SELECT ticker FROM stock_list')
        tickers = [row[0].lower() for row in cursor.fetchall()]
        
        all_features = []
        all_labels = []
        
        for ticker in tickers[:10]:  # Using first 10 stocks for training
            try:
                # Get technical indicator data
                df = pd.read_sql(f"SELECT * FROM {ticker}_MA ORDER BY timestamp", mydb)
                
                if len(df) < 100:  # Skipping stocks with insufficient data
                    continue
                
                feature_df = self.prepare_features(df)
                
                labels = self.create_labels(df)
                
                combined = pd.concat([feature_df, pd.Series(labels, name='label')], axis=1)
                combined = combined.dropna()
                
                if len(combined) > 50: 
                    all_features.append(combined.drop('label', axis=1))
                    all_labels.extend(combined['label'])
                
            except Exception as e:
                print(f"Error processing {ticker}: {e}")
                continue
        
        if len(all_features) == 0:
            print("No data available for training")
            return False
        
        X = pd.concat(all_features, axis=0)
        y = np.array(all_labels)
        
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
        
        X_train_scaled = self.scaler.fit_transform(X_train)
        X_test_scaled = self.scaler.transform(X_test)
        
        self.model.fit(X_train_scaled, y_train)
        
        y_pred = self.model.predict(X_test_scaled)
        accuracy = accuracy_score(y_test, y_pred)
        
        print(f"Model accuracy: {accuracy:.2f}")
        print("\nClassification Report:")
        print(classification_report(y_test, y_pred))
        
        self.is_trained = True
        
        # Save model
        joblib.dump(self.model, 'trading_model.pkl')
        joblib.dump(self.scaler, 'trading_scaler.pkl')
        
        cursor.close()
        mydb.close()
        
        return True
    
    def predict_trading_signal(self, ticker):
        if not self.is_trained:
            print("Model not trained. Please train the model first.")
            return None
        
        try:
            mydb = self.connect_db()
            
            # Get latest data
            df = pd.read_sql(f"SELECT * FROM {ticker}_MA ORDER BY timestamp DESC LIMIT 1", mydb)
            
            if len(df) == 0:
                return None
            
            # Prepare features
            feature_df = self.prepare_features(df)
            latest_features = feature_df.iloc[-1:].dropna()
            
            if len(latest_features) == 0:
                return None
            
            features_scaled = self.scaler.transform(latest_features)
            
            prediction = self.model.predict(features_scaled)[0]
            probabilities = self.model.predict_proba(features_scaled)[0]
            
            confidence = max(probabilities)
            
            mydb.close()
            
            return {
                'ticker': ticker.upper(),
                'signal': prediction,
                'confidence': round(confidence * 100, 2),
                'probabilities': {
                    'Buy': round(probabilities[0] * 100, 2),
                    'Sell': round(probabilities[1] * 100, 2),
                    'Hold': round(probabilities[2] * 100, 2)
                }
            }
            
        except Exception as e:
            print(f"Error predicting for {ticker}: {e}")
            return None

if __name__ == "__main__":
    ml_model = TradingMLModel()
    ml_model.train_model() 