import React from 'react';
import { Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

const AccessDenied: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="text-center my-5">
      <h2>Access Denied</h2>
      <p className="lead">You don't have permission to access this page.</p>
      <p>This area is restricted to administrators only.</p>
      <Button variant="primary" onClick={() => navigate('/settings')}>
        Go to Settings
      </Button>
    </div>
  );
};

export default AccessDenied;
