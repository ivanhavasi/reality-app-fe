import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Button, Navbar } from 'react-bootstrap';
import { PersonFill } from 'react-bootstrap-icons';
import RealEstateDetail from './RealEstateDetail';

const PublicRealEstateDetail: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-vh-100 d-flex flex-column">
      {/* Simple public navbar */}
      <Navbar className="bg-primary" data-bs-theme="dark">
        <Container>
          <Navbar.Brand className="fw-bold">
            🏠 Havasi Reality Platform
          </Navbar.Brand>
          <Button 
            variant="outline-light" 
            size="sm"
            onClick={() => navigate('/login')}
          >
            <PersonFill className="me-1" />
            Login
          </Button>
        </Container>
      </Navbar>

      {/* Main content - reuse the existing RealEstateDetail component */}
      <div className="flex-grow-1">
        <RealEstateDetail />
      </div>
    </div>
  );
};

export default PublicRealEstateDetail;
