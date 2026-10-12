import React from 'react';
import { Button } from 'react-bootstrap';
import { Lock } from 'react-bootstrap-icons';
import { useNavigate } from 'react-router-dom';
import { EmptyState } from '../components/ui';

const AccessDenied: React.FC = () => {
  const navigate = useNavigate();

  return (
    <EmptyState
      icon={Lock}
      title="Admins only"
      text="You don't have permission to view this page."
      actions={
        <Button variant="primary" onClick={() => navigate('/settings')}>
          Go to settings
        </Button>
      }
    />
  );
};

export default AccessDenied;
