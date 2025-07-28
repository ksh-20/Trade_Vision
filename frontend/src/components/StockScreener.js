import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Form, Button, Table, Spinner, Alert } from 'react-bootstrap';
import { FaSearch, FaFilter, FaChartLine } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const StockScreener = () => {
  const [filters, setFilters] = useState({
    min_price: '',
    max_price: '',
    min_volume: '',
    rsi_oversold: '',
    rsi_overbought: '',
    ma_crossover: false,
    macd_bullish: false
  });
  
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleFilterChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleScreen = async () => {
    setLoading(true);
    setError('');
    
    try {
      // Remove empty filters
      const activeFilters = Object.fromEntries(
        Object.entries(filters).filter(([_, value]) => 
          value !== '' && value !== false
        )
      );
      
      const response = await axios.post('/api/screener', activeFilters);
      setResults(response.data.results);
    } catch (error) {
      setError('Error screening stocks. Please try again.');
      console.error('Screening error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStockClick = (ticker) => {
    navigate(`/stock/${ticker}`);
  };

  const getRSIColor = (rsi) => {
    if (rsi < 30) return 'text-success';
    if (rsi > 70) return 'text-danger';
    return 'text-warning';
  };

  const getMACDColor = (macd) => {
    return macd > 0 ? 'text-success' : 'text-danger';
  };

  return (
    <div>
      <h2 className="text-white mb-4">
        <FaSearch className="me-2" />
        Stock Screener
      </h2>

      {/* Filters */}
      <Row className="mb-4">
        <Col>
          <Card>
            <Card.Header>
              <FaFilter className="me-2" />
              Screening Filters
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={3}>
                  <Form.Group className="mb-3">
                    <Form.Label>Min Price ($)</Form.Label>
                    <Form.Control
                      type="number"
                      name="min_price"
                      value={filters.min_price}
                      onChange={handleFilterChange}
                      placeholder="0.00"
                      step="0.01"
                    />
                  </Form.Group>
                </Col>
                <Col md={3}>
                  <Form.Group className="mb-3">
                    <Form.Label>Max Price ($)</Form.Label>
                    <Form.Control
                      type="number"
                      name="max_price"
                      value={filters.max_price}
                      onChange={handleFilterChange}
                      placeholder="1000.00"
                      step="0.01"
                    />
                  </Form.Group>
                </Col>
                <Col md={3}>
                  <Form.Group className="mb-3">
                    <Form.Label>Min Volume</Form.Label>
                    <Form.Control
                      type="number"
                      name="min_volume"
                      value={filters.min_volume}
                      onChange={handleFilterChange}
                      placeholder="1000000"
                    />
                  </Form.Group>
                </Col>
                <Col md={3}>
                  <Form.Group className="mb-3">
                    <Form.Label>RSI Oversold</Form.Label>
                    <Form.Control
                      type="number"
                      name="rsi_oversold"
                      value={filters.rsi_oversold}
                      onChange={handleFilterChange}
                      placeholder="30"
                      min="0"
                      max="100"
                    />
                  </Form.Group>
                </Col>
              </Row>
              
              <Row>
                <Col md={3}>
                  <Form.Group className="mb-3">
                    <Form.Label>RSI Overbought</Form.Label>
                    <Form.Control
                      type="number"
                      name="rsi_overbought"
                      value={filters.rsi_overbought}
                      onChange={handleFilterChange}
                      placeholder="70"
                      min="0"
                      max="100"
                    />
                  </Form.Group>
                </Col>
                <Col md={3}>
                  <Form.Group className="mb-3">
                    <Form.Check
                      type="checkbox"
                      name="ma_crossover"
                      checked={filters.ma_crossover}
                      onChange={handleFilterChange}
                      label="MA Crossover (Price > 20MA > 50MA)"
                    />
                  </Form.Group>
                </Col>
                <Col md={3}>
                  <Form.Group className="mb-3">
                    <Form.Check
                      type="checkbox"
                      name="macd_bullish"
                      checked={filters.macd_bullish}
                      onChange={handleFilterChange}
                      label="MACD Bullish (MACD > Signal)"
                    />
                  </Form.Group>
                </Col>
                <Col md={3} className="d-flex align-items-end">
                  <Button 
                    variant="primary" 
                    onClick={handleScreen}
                    disabled={loading}
                    className="w-100"
                  >
                    {loading ? (
                      <>
                        <Spinner animation="border" size="sm" className="me-2" />
                        Screening...
                      </>
                    ) : (
                      <>
                        <FaSearch className="me-2" />
                        Screen Stocks
                      </>
                    )}
                  </Button>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Results */}
      {error && (
        <Alert variant="danger" className="mb-4">
          {error}
        </Alert>
      )}

      {results.length > 0 && (
        <Row>
          <Col>
            <Card>
              <Card.Header>
                <FaChartLine className="me-2" />
                Screening Results ({results.length} stocks found)
              </Card.Header>
              <Card.Body>
                <Table responsive hover>
                  <thead>
                    <tr>
                      <th>Ticker</th>
                      <th>Price ($)</th>
                      <th>Volume</th>
                      <th>RSI</th>
                      <th>MACD</th>
                      <th>20-Day MA</th>
                      <th>50-Day MA</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.map((stock, index) => (
                      <tr 
                        key={index} 
                        className="stock-card"
                        onClick={() => handleStockClick(stock.ticker)}
                      >
                        <td>
                          <strong>{stock.ticker}</strong>
                        </td>
                        <td>${stock.close?.toFixed(2) || 'N/A'}</td>
                        <td>{stock.volume?.toLocaleString() || 'N/A'}</td>
                        <td className={getRSIColor(stock.rsi)}>
                          {stock.rsi?.toFixed(1) || 'N/A'}
                        </td>
                        <td className={getMACDColor(stock.macd)}>
                          {stock.macd?.toFixed(3) || 'N/A'}
                        </td>
                        <td>${stock.ma_20day?.toFixed(2) || 'N/A'}</td>
                        <td>${stock.ma_50day?.toFixed(2) || 'N/A'}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}
    </div>
  );
};

export default StockScreener; 