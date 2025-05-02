import React, { useEffect, useState } from 'react';
import { Toast, ToastContainer } from 'react-bootstrap';
import { useError } from '../context/ErrorContext';
import { XCircleFill } from 'react-bootstrap-icons';

const ErrorToast: React.FC = () => {
  const { error, clearError } = useError();
  const [visible, setVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Set error message and visibility when error changes
  useEffect(() => {
    if (error) {
      console.log('Error set:', error);
      setErrorMessage(error);
      setVisible(true);
    }
  }, [error]);

  // Auto-dismiss the toast after 5 seconds
  useEffect(() => {
    if (visible) {
      const timer = setTimeout(() => {
        setVisible(false);
        // Delayed clear to allow animation to complete
        setTimeout(clearError, 500);
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [visible, clearError]);

  const handleClose = () => {
    setVisible(false);
    setTimeout(clearError, 500);
  };

  return (
    <div 
      className="position-fixed"
      style={{ 
        top: 20, 
        right: 20, 
        zIndex: 9999,
        minWidth: '300px',
        maxWidth: '400px',
        pointerEvents: 'auto'
      }}
    >
      <Toast 
        show={visible} 
        onClose={handleClose} 
        bg="danger" 
        delay={8000} // Increase delay to give more time to read error messages
        autohide
        animation={true}
      >
        <Toast.Header closeButton>
          <XCircleFill className="me-2" />
          <strong className="me-auto">Error</strong>
        </Toast.Header>
        <Toast.Body className="text-white">
          {errorMessage}
        </Toast.Body>
      </Toast>
    </div>
  );
};

export default ErrorToast;
