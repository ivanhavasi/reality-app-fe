import React, { useEffect, useState } from 'react';
import { Button, Toast } from 'react-bootstrap';
import { useError } from '../context/ErrorContext';
import { ExclamationCircleFill, X } from 'react-bootstrap-icons';

const ErrorToast: React.FC = () => {
  const { error, clearError } = useError();
  const [visible, setVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (error) {
      setErrorMessage(error);
      setVisible(true);
    }
  }, [error]);

  const handleClose = () => {
    setVisible(false);
    // let the fade-out finish before the message disappears
    setTimeout(clearError, 300);
  };

  return (
    <div className="app-toast" role="alert" aria-live="assertive">
      <Toast show={visible} onClose={handleClose} delay={6000} autohide>
        <div className="app-toast-body">
          <ExclamationCircleFill size={18} className="text-negative flex-shrink-0 mt-1" />
          <div className="flex-grow-1" style={{ minWidth: 0 }}>
            <div className="app-toast-title">Something went wrong</div>
            <div className="app-toast-message">{errorMessage}</div>
          </div>
          <Button variant="ghost" size="sm" className="btn-icon flex-shrink-0" onClick={handleClose} aria-label="Dismiss">
            <X size={18} />
          </Button>
        </div>
      </Toast>
    </div>
  );
};

export default ErrorToast;
