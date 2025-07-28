import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Table, Spinner, Alert, Badge, Form, Button } from 'react-bootstrap';
import { FaBrain, FaSearch, FaChartLine } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const MLPredictions = () => {
  const [stocks, setStocks] = useState([]);
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedStocks, setSelectedStocks] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchStocks = async () => {
      try {
        const response = await axios.get('/api/stocks');
        setStocks(response.data.stocks);
      } catch (error) {
        console.error('Error fetching stocks:', error);
      }
    };

    fetchStocks();
  }, []);

  const handleStockSelection = (ticker) => {
    setSelectedStocks(prev => {
      if (prev.includes(ticker)) {
        return prev.filter(t => t !== ticker);
      } else {
        return [...prev, ticker];
      }
    });
  };

  const getPredictions = async () => {
    if (selectedStocks.length === 0) {
      setError('Please select at least one stock');
      return;
    }

    setLoading(true);
    setError('');
    setPredictions([]);

    try {
      const predictionPromises = selectedStocks.map(async (ticker) => {
        try {
          const response = await axios.get(`/api/predict/${ticker}`);
          return response.data;
        } catch (error) {
          return {
            ticker: ticker.toUpperCase(),
            signal: 'N/A',
            confidence: 0,
            error: 'Prediction not available'
          };
        }
      });

      const results = await Promise.all(predictionPromises);
      setPredictions(results);
    } catch (error) {
      setError('Error fetching predictions. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getSignalClass = (signal) => {
    switch (signal) {
      case 'Buy': return 'signal-buy';
      case 'Sell': return 'signal-sell';
      case 'Hold': return 'signal-hold';
      default: return 'signal-hold';
    }
  };

  const getConfidenceColor = (confidence) => {
    if (confidence >= 80) return 'text-success';
    if (confidence >= 60) return 'text-warning';
    return 'text-danger';
  };

  const handleStockClick = (ticker) => {
    navigate(`/stock/${ticker}`);
  };

  return (
    <div>
      <h2 className="text-white mb-4">
        <FaBrain className="me-2" />
        ML Trading Predictions
      </h2>

      {/* Stock Selection */}
      <Row className="mb-4">
        <Col>
          <Card>
            <Card.Header>
              <FaSearch className="me-2" />
              Select Stocks for ML Analysis
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={8}>
                  <Form.Group>
                    <Form.Label>Available Stocks</Form.Label>
                    <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid #dee2e6', borderRadius: '0.375rem', padding: '10px' }}>
                      {stocks.map((stock, index) => (
                        <Form.Check
                          key={index}
                          type="checkbox"
                          id={`stock-${index}`}
                          label={`${stock.ticker} - ${stock.name}`}
                          checked={selectedStocks.includes(stock.ticker)}
                          onChange={() => handleStockSelection(stock.ticker)}
                          className="mb-2"
                        />
                      ))}
                    </div>
                  </Form.Group>
                </Col>
                <Col md={4} className="d-flex align-items-end">
                  <Button 
                    variant="primary" 
                    onClick={getPredictions}
                    disabled={loading || selectedStocks.length === 0}
                    className="w-100"
                  >
                    {loading ? (
                      <>
                        <Spinner animation="border" size="sm" className="me-2" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <FaBrain className="me-2" />
                        Get Predictions
                      </>
                    )}
                  </Button>
                </Col>
              </Row>
              {selectedStocks.length > 0 && (
                <div className="mt-3">
                  <strong>Selected Stocks ({selectedStocks.length}):</strong>
                  <div className="mt-2">
                    {selectedStocks.map((ticker, index) => (
                      <Badge key={index} bg="primary" className="me-2">
                        {ticker.toUpperCase()}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Error Message */}
      {error && (
        <Alert variant="danger" className="mb-4">
          {error}
        </Alert>
      )}

      {/* Predictions Results */}
      {predictions.length > 0 && (
        <Row>
          <Col>
            <Card>
              <Card.Header>
                <FaChartLine className="me-2" />
                ML Predictions Results
              </Card.Header>
              <Card.Body>
                <Table responsive hover>
                  <thead>
                    <tr>
                      <th>Ticker</th>
                      <th>Signal</th>
                      <th>Confidence</th>
                      <th>Buy Probability</th>
                      <th>Sell Probability</th>
                      <th>Hold Probability</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {predictions.map((prediction, index) => (
                      <tr key={index}>
                        <td>
                          <strong>{prediction.ticker}</strong>
                        </td>
                        <td>
                          {prediction.error ? (
                            <span className="text-muted">N/A</span>
                          ) : (
                            <Badge className={getSignalClass(prediction.signal)}>
                              {prediction.signal}
                            </Badge>
                          )}
                        </td>
                        <td>
                          {prediction.error ? (
                            <span className="text-muted">N/A</span>
                          ) : (
                            <span className={getConfidenceColor(prediction.confidence)}>
                              {prediction.confidence}%
                            </span>
                          )}
                        </td>
                        <td>
                          {prediction.error ? (
                            <span className="text-muted">N/A</span>
                          ) : (
                            <span className={prediction.probabilities.Buy > 50 ? 'text-success' : ''}>
                              {prediction.probabilities.Buy}%
                            </span>
                          )}
                        </td>
                        <td>
                          {prediction.error ? (
                            <span className="text-muted">N/A</span>
                          ) : (
                            <span className={prediction.probabilities.Sell > 50 ? 'text-danger' : ''}>
                              {prediction.probabilities.Sell}%
                            </span>
                          )}
                        </td>
                        <td>
                          {prediction.error ? (
                            <span className="text-muted">N/A</span>
                          ) : (
                            <span className={prediction.probabilities.Hold > 50 ? 'text-warning' : ''}>
                              {prediction.probabilities.Hold}%
                            </span>
                          )}
                        </td>
                        <td>
                          <Button 
                            variant="outline-primary" 
                            size="sm"
                            onClick={() => handleStockClick(prediction.ticker.toLowerCase())}
                          >
                            View Details
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      {/* ML Model Info */}
      <Row className="mt-4">
        <Col>
          <Card>
            <Card.Header>
              <FaBrain className="me-2" />
              About the ML Model
            </Card.Header>
            <Card.Body>
              <p>
                Our machine learning model analyzes multiple technical indicators including:
              </p>
              <ul>
                <li>Moving Averages (5, 20, 50, 200-day)</li>
                <li>MACD (Moving Average Convergence Divergence)</li>
                <li>RSI (Relative Strength Index)</li>
                <li>Fibonacci Retracement Levels</li>
                <li>Price and Volume Patterns</li>
              </ul>
              <p className="mb-0">
                <strong>Disclaimer:</strong> These predictions are for educational purposes only. 
                Always conduct your own research and consider consulting with a financial advisor 
                before making investment decisions.
              </p>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default MLPredictions; 