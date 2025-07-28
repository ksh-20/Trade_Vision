import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Table, Spinner } from 'react-bootstrap';
import { FaTrendingUp, FaTrendingDown, FaChartBar, FaClock } from 'react-icons/fa';
import axios from 'axios';

const Dashboard = () => {
  const [marketSummary, setMarketSummary] = useState(null);
  const [recentStocks, setRecentStocks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Fetch market summary
        const summaryResponse = await axios.get('/api/market-summary');
        setMarketSummary(summaryResponse.data);

        // Fetch recent stocks
        const stocksResponse = await axios.get('/api/stocks');
        setRecentStocks(stocksResponse.data.stocks.slice(0, 10));
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="loading-spinner">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-white mb-4">
        <FaChartBar className="me-2" />
        Market Dashboard
      </h2>

      {/* Market Summary Cards */}
      <Row className="mb-4">
        <Col md={3}>
          <Card className="stats-card">
            <FaTrendingUp className="text-success mb-2" size={30} />
            <div className="stats-number">{marketSummary?.total_stocks || 0}</div>
            <div className="stats-label">Total Stocks</div>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="stats-card">
            <FaChartBar className="text-primary mb-2" size={30} />
            <div className="stats-number">{marketSummary?.active_stocks || 0}</div>
            <div className="stats-label">Active Stocks</div>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="stats-card">
            <FaTrendingDown className="text-warning mb-2" size={30} />
            <div className="stats-number">
              {marketSummary?.total_volume ? 
                (marketSummary.total_volume / 1000000).toFixed(1) + 'M' : '0M'}
            </div>
            <div className="stats-label">Total Volume</div>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="stats-card">
            <FaClock className="text-info mb-2" size={30} />
            <div className="stats-number">
              {marketSummary?.last_updated ? 
                new Date(marketSummary.last_updated).toLocaleTimeString() : 'N/A'}
            </div>
            <div className="stats-label">Last Updated</div>
          </Card>
        </Col>
      </Row>

      {/* Recent Stocks Table */}
      <Row>
        <Col>
          <Card>
            <Card.Header>
              <FaChartBar className="me-2" />
              Recent Stock Activity
            </Card.Header>
            <Card.Body>
              <Table responsive hover>
                <thead>
                  <tr>
                    <th>Ticker</th>
                    <th>Company Name</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentStocks.map((stock, index) => (
                    <tr key={index} className="stock-card">
                      <td>
                        <strong>{stock.ticker}</strong>
                      </td>
                      <td>{stock.name}</td>
                      <td>
                        <span className="badge bg-success">Active</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard; 