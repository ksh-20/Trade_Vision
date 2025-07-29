import mysql.connector
import pandas as pd
import numpy as np

try:
    mydb = mysql.connector.connect(
        host="104.154.25.113",
        user="kshitij",
        password="Kshitij_17",
        database="stocks"
    )
except mysql.connector.Error as err:
    print(f"Connection Error: {err}")
    exit()

cursor = mydb.cursor()

# Get stock tickers
try:
    cursor.execute('SELECT * FROM stock_list')
    tickers = [row[1].lower() for row in cursor.fetchall()]
except Exception as e:
    print(f"Error fetching stock list: {e}")
    mydb.close()
    exit()

for ticker in tickers:
    try:
        df = pd.read_sql(f"SELECT * FROM {ticker}_data", mydb)

        if df.empty or 'close' not in df.columns or 'timestamp' not in df.columns:
            print(f"Skipping {ticker} due to missing data.")
            continue

        # MA
        df['5_DAY_MA'] = df['close'].rolling(window=5).mean().round(2)
        df['20_DAY_MA'] = df['close'].rolling(window=20).mean().round(2)
        df['50_DAY_MA'] = df['close'].rolling(window=50).mean().round(2)
        df['200_DAY_MA'] = df['close'].rolling(window=200).mean().round(2)

        # EMA
        df['12_DAY_EMA'] = df['close'].ewm(span=12, adjust=True).mean().round(2)
        df['26_DAY_EMA'] = df['close'].ewm(span=26, adjust=True).mean().round(2)
        df.loc[:10, '12_DAY_EMA'] = None
        df.loc[:24, '26_DAY_EMA'] = None

        # MACD and Signal Line
        df['MACD'] = (df['12_DAY_EMA'] - df['26_DAY_EMA']).round(2)
        df['MACD'] = df.apply(lambda x: None if pd.isna(x['12_DAY_EMA']) or pd.isna(x['26_DAY_EMA']) else x['MACD'], axis=1)
        df['Signal_Line'] = df['MACD'].ewm(span=9, adjust=True).mean().round(2)
        df.loc[:33, 'Signal_Line'] = None  

        # RSI
        delta = df['close'].diff()
        gain = np.where(delta > 0, delta, 0)
        loss = np.where(delta < 0, -delta, 0)
        avg_gain = pd.Series(gain).rolling(window=14).mean()
        avg_loss = pd.Series(loss).rolling(window=14).mean()
        rs = avg_gain / avg_loss
        df['RSI'] = (100 - (100 / (1 + rs))).round(2)

        # Fibonacci
        df['60_day_high'] = df['close'].rolling(window=60).max()
        df['60_day_low'] = df['close'].rolling(window=60).min()
        df['Fib_0'] = df['60_day_low'].round(2)
        diff = df['60_day_high'] - df['60_day_low']
        df['Fib_236'] = (df['60_day_high'] - 0.236 * diff).round(2)
        df['Fib_382'] = (df['60_day_high'] - 0.382 * diff).round(2)
        df['Fib_500'] = (df['60_day_high'] - 0.5 * diff).round(2)
        df['Fib_618'] = (df['60_day_high'] - 0.618 * diff).round(2)
        df['Fib_100'] = df['60_day_high'].round(2)
        df.loc[:59, ['Fib_0', 'Fib_236', 'Fib_382', 'Fib_500', 'Fib_618', 'Fib_100']] = None

        df = df.replace({np.nan: None})

        # Create new table
        cursor.execute(f"DROP TABLE IF EXISTS {ticker}_MA")
        cursor.execute(f"""
            CREATE TABLE {ticker}_MA (
                id INT PRIMARY KEY AUTO_INCREMENT,
                timestamp TIMESTAMP,
                close DOUBLE,
                MA_5DAY DOUBLE,
                MA_20DAY DOUBLE,
                MA_50DAY DOUBLE,
                MA_200DAY DOUBLE,
                EMA_12DAY DOUBLE,
                EMA_26DAY DOUBLE,
                MACD DOUBLE,
                SIGNAL_LINE DOUBLE,
                RSI DOUBLE,
                Fib_0 DOUBLE,
                Fib_236 DOUBLE,
                Fib_382 DOUBLE,
                Fib_500 DOUBLE,
                Fib_618 DOUBLE,
                Fib_100 DOUBLE
            )
        """)

        insert_query = f"""
            INSERT INTO {ticker}_MA (
                timestamp, close, MA_5DAY, MA_20DAY, MA_50DAY, MA_200DAY,
                EMA_12DAY, EMA_26DAY, MACD, SIGNAL_LINE, RSI,
                Fib_0, Fib_236, Fib_382, Fib_500, Fib_618, Fib_100
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """

        data_to_insert = []
        for _, row in df.iterrows():
            if pd.isna(row['timestamp']) or pd.isna(row['close']):
                continue
            data_to_insert.append((
                row['timestamp'], row['close'],
                row['5_DAY_MA'], row['20_DAY_MA'], row['50_DAY_MA'], row['200_DAY_MA'],
                row['12_DAY_EMA'], row['26_DAY_EMA'], row['MACD'], row['Signal_Line'], row['RSI'],
                row['Fib_0'], row['Fib_236'], row['Fib_382'], row['Fib_500'], row['Fib_618'], row['Fib_100']
            ))

        if data_to_insert:
            cursor.executemany(insert_query, data_to_insert)
            mydb.commit()

        print(f"Processed: {ticker}")

    except Exception as e:
        print(f"Error processing {ticker}: {e}")

cursor.close()
mydb.close()