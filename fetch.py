import datetime
import mysql.connector
import time
from polygon import RESTClient

client = RESTClient("c6PWzvot8L5IRGcyHUa95dzpQVFkCzAc")

mydb = mysql.connector.connect(
    host="104.154.25.113",
    user="kshitij",
    password="Kshitij_17",
    database="stocks"
)

cursor = mydb.cursor()
cursor.execute("USE stocks")

cursor.execute("SELECT ticker, stock FROM stock_list")
stock_list = cursor.fetchall()

for ticker, _ in stock_list:
    table_name = f"{ticker.lower()}_data"
    cursor.execute(f"""
        CREATE TABLE IF NOT EXISTS {table_name} (id INT AUTO_INCREMENT PRIMARY KEY, open DOUBLE, high DOUBLE, low DOUBLE, close DOUBLE, volume BIGINT, vwap DOUBLE, timestamp TIMESTAMP, transactions INT, otc TINYINT NULL);
    """)

    aggs = []
    for a in client.list_aggs(ticker, 1, "day", "2023-06-05", "2025-06-03", limit=50000):
        a.timestamp = datetime.datetime.fromtimestamp(a.timestamp / 1000, datetime.timezone.utc)
        aggs.append(a)

    print(f"Fetched {len(aggs)} records for {ticker}")

    if len(aggs) == 0:
        print(f"No data returned for {ticker}")
        continue

    data = [(a.open, a.high, a.low, a.close, a.volume, a.vwap, a.timestamp, a.transactions, None) for a in aggs]
    cursor.executemany(f"""
        INSERT INTO {table_name} (open, high, low, close, volume, vwap, timestamp, transactions, otc) 
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
    """, data)
    mydb.commit()
    
    time.sleep(15)


cursor.close()
mydb.close()
