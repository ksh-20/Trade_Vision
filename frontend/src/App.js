import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Container } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';

import Navigation from './components/Navigation';
import Dashboard from './components/Dashboard';
import StockScreener from './components/StockScreener';
import StockDetail from './components/StockDetail';
import MLPredictions from './components/MLPredictions';

function App() {
  return (
    <Router>
      <div className="App">
        <Navigation />
        <Container fluid className="main-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/screener" element={<StockScreener />} />
            <Route path="/stock/:ticker" element={<StockDetail />} />
            <Route path="/predictions" element={<MLPredictions />} />
          </Routes>
        </Container>
      </div>
    </Router>
  );
}

export default App; 