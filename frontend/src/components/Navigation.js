import React from 'react';
import { Navbar, Nav, Container } from 'react-bootstrap';
import { Link, useLocation } from 'react-router-dom';
import { FaChartLine, FaSearch, FaBrain, FaHome } from 'react-icons/fa';

const Navigation = () => {
  const location = useLocation();

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <Navbar bg="light" expand="lg" className="navbar">
      <Container>
        <Navbar.Brand as={Link} to="/" className="navbar-brand">
          <FaChartLine className="me-2" />
          Trade Vision
        </Navbar.Brand>
        
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="ms-auto">
            <Nav.Link 
              as={Link} 
              to="/" 
              className={isActive('/') ? 'active' : ''}
            >
              <FaHome className="me-1" />
              Dashboard
            </Nav.Link>
            <Nav.Link 
              as={Link} 
              to="/screener" 
              className={isActive('/screener') ? 'active' : ''}
            >
              <FaSearch className="me-1" />
              Stock Screener
            </Nav.Link>
            <Nav.Link 
              as={Link} 
              to="/predictions" 
              className={isActive('/predictions') ? 'active' : ''}
            >
              <FaBrain className="me-1" />
              ML Predictions
            </Nav.Link>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default Navigation; 