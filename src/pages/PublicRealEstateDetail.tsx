import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from 'react-bootstrap';
import RealEstateDetail from './RealEstateDetail';
import { BrandMark } from '../components/ui';

const PublicRealEstateDetail: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-vh-100">
      <header className="public-topbar">
        <Link to="/login" className="brand">
          <BrandMark />
          Havasi Reality
        </Link>
        <Button variant="outline-secondary" size="sm" onClick={() => navigate('/login')}>
          Sign in
        </Button>
      </header>

      <main className="public-content">
        <RealEstateDetail />
      </main>
    </div>
  );
};

export default PublicRealEstateDetail;
