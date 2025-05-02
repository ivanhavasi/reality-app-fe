import React, { useState } from 'react';
import { Form, Button, Row, Col } from 'react-bootstrap';
import { 
  NotificationFilter, 
  EmailNotificationCommand, 
  WebhookNotificationCommand, 
  DiscordWebhookNotificationCommand,
  BuildingType,
  TransactionType
} from '../types/notifications';
import { addNotification } from '../services/api';
import { useError } from '../context/ErrorContext';

interface AddNotificationProps {
  onSuccess: () => void;
  onCancel: () => void;
}

const AddNotification: React.FC<AddNotificationProps> = ({ onSuccess, onCancel }) => {
  const [name, setName] = useState('');
  const [type, setType] = useState('email');
  const [email, setEmail] = useState('');
  const [url, setUrl] = useState('');
  const [webhookId, setWebhookId] = useState('');
  const [token, setToken] = useState('');
  
  // Filter state
  const [buildingType, setBuildingType] = useState<BuildingType>(BuildingType.APARTMENT);
  const [transactionType, setTransactionType] = useState<TransactionType>(TransactionType.SALE);
  const [sizeFrom, setSizeFrom] = useState<string>('');
  const [sizeTo, setSizeTo] = useState<string>('');
  const [priceFrom, setPriceFrom] = useState<string>('');
  const [priceTo, setPriceTo] = useState<string>('');
  const [subTypes, setSubTypes] = useState<string>('');
  
  const [loading, setLoading] = useState(false);
  const { setError } = useError();

  const createFilter = (): NotificationFilter => {
    // Create filter with required properties
    const filter: NotificationFilter = {
      buildingType,
      transactionType
    };
    
    // Add size range if provided
    if (sizeFrom || sizeTo) {
      filter.size = {
        from: sizeFrom ? parseFloat(sizeFrom) : undefined,
        to: sizeTo ? parseFloat(sizeTo) : undefined
      };
    }
    
    // Add price range if provided
    if (priceFrom || priceTo) {
      filter.price = {
        from: priceFrom ? parseInt(priceFrom) : undefined,
        to: priceTo ? parseInt(priceTo) : undefined
      };
    }
    
    // Add subTypes if provided
    if (subTypes) {
      filter.subTypes = subTypes.split(',').map(t => t.trim());
    }
    
    return filter;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name) {
      console.log('Setting error: Name is required');
      setError('Name is required');
      return;
    }
  
    const filter = createFilter();
    setLoading(true);
  
    try {
      let command;
      
      switch (type) {
        case 'email':
          if (!email) {
            console.log('Setting error: Email is required');
            setError('Email is required');
            setLoading(false);
            return;
          }
          command = new EmailNotificationCommand(name, filter, email);
          break;
          
        case 'api':
          if (!url) {
            console.log('Setting error: URL is required');
            setError('URL is required');
            setLoading(false);
            return;
          }
          command = new WebhookNotificationCommand(name, filter, url);
          break;
          
        case 'discord':
          if (!webhookId || !token) {
            console.log('Setting error: Webhook ID and Token are required');
            setError('Webhook ID and Token are required');
            setLoading(false);
            return;
          }
          command = new DiscordWebhookNotificationCommand(name, filter, webhookId, token);
          break;
          
        default:
          console.log('Setting error: Invalid notification type');
          setError('Invalid notification type');
          setLoading(false);
          return;
      }
  
      // Add the notification
      const result = await addNotification(command);
      console.log('Notification added successfully:', result);
      
      // Call onSuccess to close the modal and refresh parent data
      onSuccess();
    } catch (err) {
      // Extract error message from Error object
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      console.log('Setting error:', errorMessage);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form onSubmit={handleSubmit}>
      <Row>
        <Col md={6}>
          <h5 className="mb-3">Notification Details</h5>
          <Form.Group className="mb-3">
            <Form.Label>Name</Form.Label>
            <Form.Control 
              type="text" 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              placeholder="Notification name"
              required
            />
          </Form.Group>
          
          <Form.Group className="mb-3">
            <Form.Label>Type</Form.Label>
            <Form.Select value={type} onChange={(e) => setType(e.target.value)}>
              <option value="email">Email</option>
              <option value="api">Webhook</option>
              <option value="discord">Discord</option>
            </Form.Select>
          </Form.Group>
          
          {type === 'email' && (
            <Form.Group className="mb-3">
              <Form.Label>Email</Form.Label>
              <Form.Control 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                placeholder="Email address"
                required
              />
            </Form.Group>
          )}
          
          {type === 'api' && (
            <Form.Group className="mb-3">
              <Form.Label>Webhook URL</Form.Label>
              <Form.Control 
                type="url" 
                value={url} 
                onChange={(e) => setUrl(e.target.value)} 
                placeholder="https://example.com/webhook"
                required
              />
            </Form.Group>
          )}
          
          {type === 'discord' && (
            <>
              <Form.Group className="mb-3">
                <Form.Label>Webhook ID</Form.Label>
                <Form.Control 
                  type="text" 
                  value={webhookId} 
                  onChange={(e) => setWebhookId(e.target.value)} 
                  placeholder="Discord webhook ID"
                  required
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Token</Form.Label>
                <Form.Control 
                  type="password" 
                  value={token} 
                  onChange={(e) => setToken(e.target.value)} 
                  placeholder="Discord webhook token"
                  required
                />
              </Form.Group>
            </>
          )}
        </Col>
        
        <Col md={6}>
          <h5 className="mb-3">Filter Settings</h5>
          <Form.Group className="mb-3">
            <Form.Label>Building Type</Form.Label>
            <Form.Select 
              value={buildingType} 
              onChange={(e) => setBuildingType(e.target.value as BuildingType)}
            >
              {Object.values(BuildingType).map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </Form.Select>
          </Form.Group>
          
          <Form.Group className="mb-3">
            <Form.Label>Transaction Type</Form.Label>
            <Form.Select 
              value={transactionType} 
              onChange={(e) => setTransactionType(e.target.value as TransactionType)}
            >
              {Object.values(TransactionType).map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </Form.Select>
          </Form.Group>
          
          <Row>
            <Col>
              <Form.Group className="mb-3">
                <Form.Label>Size From (m²)</Form.Label>
                <Form.Control 
                  type="number" 
                  value={sizeFrom} 
                  onChange={(e) => setSizeFrom(e.target.value)} 
                  placeholder="Min size"
                  min="0"
                />
              </Form.Group>
            </Col>
            <Col>
              <Form.Group className="mb-3">
                <Form.Label>Size To (m²)</Form.Label>
                <Form.Control 
                  type="number" 
                  value={sizeTo} 
                  onChange={(e) => setSizeTo(e.target.value)} 
                  placeholder="Max size"
                  min="0"
                />
              </Form.Group>
            </Col>
          </Row>
          
          <Row>
            <Col>
              <Form.Group className="mb-3">
                <Form.Label>Price From</Form.Label>
                <Form.Control 
                  type="number" 
                  value={priceFrom} 
                  onChange={(e) => setPriceFrom(e.target.value)} 
                  placeholder="Min price"
                  min="0"
                />
              </Form.Group>
            </Col>
            <Col>
              <Form.Group className="mb-3">
                <Form.Label>Price To</Form.Label>
                <Form.Control 
                  type="number" 
                  value={priceTo} 
                  onChange={(e) => setPriceTo(e.target.value)} 
                  placeholder="Max price"
                  min="0"
                />
              </Form.Group>
            </Col>
          </Row>
          
          <Form.Group className="mb-3">
            <Form.Label>Sub Types (comma separated)</Form.Label>
            <Form.Control 
              type="text" 
              value={subTypes} 
              onChange={(e) => setSubTypes(e.target.value)} 
              placeholder="type1, type2, type3"
            />
          </Form.Group>
        </Col>
      </Row>
      
      <div className="d-flex justify-content-end gap-2 mt-3">
        <Button variant="secondary" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Adding...' : 'Add Notification'}
        </Button>
      </div>
    </Form>
  );
};

export default AddNotification;
