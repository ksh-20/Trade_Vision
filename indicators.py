import mysql.connector
import pandas as pd
import numpy as np


mydb = mysql.connector.connect(
    host="104.154.25.113",
    user='kshitij',
    password='Kshitij_17',
    database='stocks'
)

cursor = mydb.cursor()


cursor.execute('SELECT * FROM stock_list')
data = [row[1].lower() for row in cursor.fetchall()]


for ticker in data:
    try:

        df = pd.read_sql(f"SELECT * FROM {ticker}_data", mydb)

        # MA
        df['5_DAY_MA'] = round(df['close'].rolling(window=5).mean(), 2)
        df['20_DAY_MA'] = round(df['close'].rolling(window=20).mean(), 2)
        df['50_DAY_MA'] = round(df['close'].rolling(window=50).mean(), 2)
        df['200_DAY_MA'] = round(df['close'].rolling(window=200).mean(), 2)

        # EMA
        df['12_DAY_EMA'] = round(df['close'].ewm(span=12, adjust=True).mean(),2)
        df['26_DAY_EMA'] = round(df['close'].ewm(span=26, adjust=True).mean(),2)

        df.loc[:10, '12_DAY_EMA'] = None
        df.loc[:24, '26_DAY_EMA'] = None

        # MACD
        df['MACD'] = round(df['12_DAY_EMA'] - df['26_DAY_EMA'],2)
        df.loc[df['12_DAY_EMA'].isnull() | df['26_DAY_EMA'].isnull(), 'MACD'] = None

        # Signal Line
        df['Signal_Line'] = round(df['MACD'].ewm(span=9, adjust=True).mean(),2)
        min_macd_idx = df['MACD'].first_valid_index()
        if min_macd_idx is not None:
            df.loc[:min_macd_idx + 8, 'Signal_Line'] = None 

        # RSI
        delta = df['close'].diff()
        gain = delta.where(delta > 0, 0)
        loss = -delta.where(delta < 0, 0)
        avg_gain = gain.rolling(window=14).mean()
        avg_loss = loss.rolling(window=14).mean()
        rs = avg_gain / avg_loss
        df['RSI'] = round(100 - (100 / (1 + rs)),2)

        # Fibonacci Levels

        # Calculating rolling 60-day high and low (60 is approx 3 business months)
        df['60_day_high'] = df['close'].rolling(window=60).max()
        df['60_day_low'] = df['close'].rolling(window=60).min()

        df['Fib_0'] = round(df['60_day_low'], 2)
        df['Fib_236'] = round(df['60_day_high'] - 0.236 * (df['60_day_high'] - df['60_day_low']), 2)
        df['Fib_382'] = round(df['60_day_high'] - 0.382 * (df['60_day_high'] - df['60_day_low']), 2)
        df['Fib_500'] = round(df['60_day_high'] - 0.5 * (df['60_day_high'] - df['60_day_low']), 2)
        df['Fib_618'] = round(df['60_day_high'] - 0.618 * (df['60_day_high'] - df['60_day_low']), 2)
        df['Fib_100'] = round(df['60_day_high'], 2)

        # Setting Fibonacci levels to None for first 59 rows
        df.loc[:59, ['Fib_0', 'Fib_236', 'Fib_382', 'Fib_500', 'Fib_618', 'Fib_100']] = None

        # Replacing NaN value with None
        df = df.replace({np.nan: None})

        # Droping and recreating table
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

        # Insert
        for _, row in df.iterrows():
            cursor.execute(f"""
            INSERT INTO {ticker}_MA (
                timestamp, close, MA_5DAY, MA_20DAY, MA_50DAY, MA_200DAY,
                EMA_12DAY, EMA_26DAY, MACD, SIGNAL_LINE, RSI,
                Fib_0, Fib_236, Fib_382, Fib_500, Fib_618, Fib_100
            )
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """, (
                row['timestamp'],
                row['close'],
                row['5_DAY_MA'],
                row['20_DAY_MA'],
                row['50_DAY_MA'],
                row['200_DAY_MA'],
                row['12_DAY_EMA'],
                row['26_DAY_EMA'],
                row['MACD'],
                row['Signal_Line'],
                row['RSI'],
                row['Fib_0'],
                row['Fib_236'],
                row['Fib_382'],
                row['Fib_500'],
                row['Fib_618'],
                row['Fib_100']
            ))

        mydb.commit()

    except Exception as e:
        print(f"Error processing {ticker}: {e}")


cursor.close()
mydb.close()

