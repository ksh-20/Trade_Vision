import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Row, Col, Card, Spinner, Alert, Badge } from 'react-bootstrap';
import { FaChartLine, FaBrain, FaInfoCircle } from 'react-icons/fa';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import axios from 'axios';

const StockDetail = () => {
  const { ticker } = useParams();
  const [stockData, setStockData] = useState([]);
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStockData = async () => {
      try {
        setLoading(true);
        
        // Fetch stock data
        const dataResponse = await axios.get(`/api/stock/${ticker}/data`);
        setStockData(dataResponse.data.data);
        
        // Fetch ML prediction
        try {
          const predictionResponse = await axios.get(`/api/predict/${ticker}`);
          setPrediction(predictionResponse.data);
        } catch (predError) {
          console.log('ML prediction not available');
        }
        
        setLoading(false);
      } catch (error) {
        setError('Error fetching stock data. Please try again.');
        setLoading(false);
      }
    };

    fetchStockData();
  }, [ticker]);

  const getSignalClass = (signal) => {
    switch (signal) {
      case 'Buy': return 'signal-buy';
      case 'Sell': return 'signal-sell';
      case 'Hold': return 'signal-hold';
      default: return 'signal-hold';
    }
  };

  const createPriceChartOptions = () => {
    const data = stockData.slice().reverse(); // Reverse to show oldest to newest
    
    return {
      chart: {
        type: 'candlestick',
        backgroundColor: 'transparent'
      },
      title: {
        text: `${ticker.toUpperCase()} Price Chart`,
        style: { color: '#333' }
      },
      xAxis: {
        type: 'datetime',
        labels: { style: { color: '#666' } }
      },
      yAxis: {
        title: { text: 'Price ($)', style: { color: '#666' } },
        labels: { style: { color: '#666' } }
      },
      series: [{
        name: 'Price',
        data: data.map(item => [
          new Date(item.timestamp).getTime(),
          item.close
        ])
      }],
      tooltip: {
        formatter: function() {
          return `<b>${new Date(this.x).toLocaleDateString()}</b><br/>
                  Price: $${this.y.toFixed(2)}`;
        }
      },
      plotOptions: {
        candlestick: {
          color: '#dc3545',
          upColor: '#28a745',
          lineColor: '#dc3545',
          upLineColor: '#28a745'
        }
      }
    };
  };

  const createTechnicalChartOptions = () => {
    const data = stockData.slice().reverse();
    
    return {
      chart: {
        type: 'line',
        backgroundColor: 'transparent'
      },
      title: {
        text: `${ticker.toUpperCase()} Technical Indicators`,
        style: { color: '#333' }
      },
      xAxis: {
        type: 'datetime',
        labels: { style: { color: '#666' } }
      },
      yAxis: [{
        title: { text: 'Price ($)', style: { color: '#666' } },
        labels: { style: { color: '#666' } }
      }, {
        title: { text: 'RSI', style: { color: '#666' } },
        labels: { style: { color: '#666' } },
        opposite: true,
        min: 0,
        max: 100
      }],
      series: [{
        name: 'Close Price',
        data: data.map(item => [
          new Date(item.timestamp).getTime(),
          item.close
        ]),
        color: '#667eea'
      }, {
        name: '20-Day MA',
        data: data.map(item => [
          new Date(item.timestamp).getTime(),
          item.ma_20day
        ]),
        color: '#ffc107'
      }, {
        name: '50-Day MA',
        data: data.map(item => [
          new Date(item.timestamp).getTime(),
          item.ma_50day
        ]),
        color: '#fd7e14'
      }, {
        name: 'RSI',
        yAxis: 1,
        data: data.map(item => [
          new Date(item.timestamp).getTime(),
          item.rsi
        ]),
        color: '#e83e8c'
      }],
      tooltip: {
        shared: true,
        formatter: function() {
          let tooltip = `<b>${new Date(this.x).toLocaleDateString()}</b><br/>`;
          this.points.forEach(point => {
            tooltip += `${point.series.name}: ${point.y?.toFixed(2) || 'N/A'}<br/>`;
          });
          return tooltip;
        }
      }
    };
  };

  const createMACDChartOptions = () => {
    const data = stockData.slice().reverse();
    
    return {
      chart: {
        type: 'line',
        backgroundColor: 'transparent'
      },
      title: {
        text: `${ticker.toUpperCase()} MACD`,
        style: { color: '#333' }
      },
      xAxis: {
        type: 'datetime',
        labels: { style: { color: '#666' } }
      },
      yAxis: {
        title: { text: 'MACD', style: { color: '#666' } },
        labels: { style: { color: '#666' } }
      },
      series: [{
        name: 'MACD',
        data: data.map(item => [
          new Date(item.timestamp).getTime(),
          item.macd
        ]),
        color: '#667eea'
      }, {
        name: 'Signal Line',
        data: data.map(item => [
          new Date(item.timestamp).getTime(),
          item.signal_line
        ]),
        color: '#fd7e14'
      }],
      tooltip: {
        formatter: function() {
          return `<b>${new Date(this.x).toLocaleDateString()}</b><br/>
                  ${this.series.name}: ${this.y?.toFixed(3) || 'N/A'}`;
        }
      }
    };
  };

  if (loading) {
    return (
      <div className="loading-spinner">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="danger">
        {error}
      </Alert>
    );
  }

  const latestData = stockData[0];

  return (
    <div>
      <h2 className="text-white mb-4">
        <FaChartLine className="me-2" />
        {ticker.toUpperCase()} Analysis
      </h2>

      {/* Stock Summary */}
      <Row className="mb-4">
        <Col md={8}>
          <Card>
            <Card.Header>
              <FaInfoCircle className="me-2" />
              Stock Summary
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={3}>
                  <h5>Current Price</h5>
                  <h3 className="text-primary">${latestData?.close?.toFixed(2) || 'N/A'}</h3>
                </Col>
                <Col md={3}>
                  <h5>Volume</h5>
                  <h4>{latestData?.volume?.toLocaleString() || 'N/A'}</h4>
                </Col>
                <Col md={3}>
                  <h5>RSI</h5>
                  <h4 className={latestData?.rsi < 30 ? 'text-success' : latestData?.rsi > 70 ? 'text-danger' : 'text-warning'}>
                    {latestData?.rsi?.toFixed(1) || 'N/A'}
                  </h4>
                </Col>
                <Col md={3}>
                  <h5>MACD</h5>
                  <h4 className={latestData?.macd > 0 ? 'text-success' : 'text-danger'}>
                    {latestData?.macd?.toFixed(3) || 'N/A'}
                  </h4>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card>
            <Card.Header>
              <FaBrain className="me-2" />
              ML Prediction
            </Card.Header>
            <Card.Body className="text-center">
              {prediction ? (
                <>
                  <Badge className={`${getSignalClass(prediction.signal)} fs-5 mb-3`}>
                    {prediction.signal}
                  </Badge>
                  <p className="mb-2">Confidence: {prediction.confidence}%</p>
                  <div className="small">
                    <div>Buy: {prediction.probabilities.Buy}%</div>
                    <div>Sell: {prediction.probabilities.Sell}%</div>
                    <div>Hold: {prediction.probabilities.Hold}%</div>
                  </div>
                </>
              ) : (
                <p className="text-muted">ML prediction not available</p>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Charts */}
      <Row className="mb-4">
        <Col>
          <div className="chart-container">
            <HighchartsReact highcharts={Highcharts} options={createPriceChartOptions()} />
          </div>
        </Col>
      </Row>

      <Row className="mb-4">
        <Col md={6}>
          <div className="chart-container">
            <HighchartsReact highcharts={Highcharts} options={createTechnicalChartOptions()} />
          </div>
        </Col>
        <Col md={6}>
          <div className="chart-container">
            <HighchartsReact highcharts={Highcharts} options={createMACDChartOptions()} />
          </div>
        </Col>
      </Row>
    </div>
  );
};

export default StockDetail; 