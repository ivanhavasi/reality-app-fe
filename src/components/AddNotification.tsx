import React, { useState } from 'react';
import { Form, Button, Row, Col, Modal, InputGroup, Spinner } from 'react-bootstrap';
import { Discord, Envelope, Link45deg } from 'react-bootstrap-icons';
import { Segmented } from './ui';
import {
  NotificationFilter, 
  EmailNotificationCommand, 
  WebhookNotificationCommand, 
  DiscordWebhookNotificationCommand,
} from '../types/notifications';
import {
  BUILDING_TYPE_META,
  BuildingType,
  ENABLED_BUILDING_TYPES,
  ENABLED_LAND_SUB_TYPES,
  SIZE_LABEL,
  supportedTransaction,
  TRANSACTION_TYPES,
  TransactionType,
} from '../types/property';
import { addNotification } from '../services/api';
import { useError } from '../context/ErrorContext';

const SCOPE_TEXT: Record<BuildingType, string> = {
  APARTMENT: 'Alerts cover new listings in the Prague region.',
  HOUSE: 'House alerts cover houses for sale in the Prague region.',
  LAND: 'Land alerts cover building plots in the Prague region.',
};

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
  const [buildingType, setBuildingType] = useState<BuildingType>('APARTMENT');
  const [transactionType, setTransactionType] = useState<TransactionType>('SALE');
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
    
    // an explicit empty list would match nothing, so subTypes is either non-empty or absent;
    // houses match any type, some portals leave it empty
    const parsedSubTypes = buildingType === 'LAND'
      ? ENABLED_LAND_SUB_TYPES
      : buildingType === 'HOUSE'
        ? []
        : subTypes.split(',').map(t => t.trim()).filter(t => t !== '');
    if (parsedSubTypes.length > 0) {
      filter.subTypes = [...parsedSubTypes];
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

  const handleBuildingTypeChange = (newType: BuildingType) => {
    setBuildingType(newType);
    setTransactionType(supportedTransaction(newType, transactionType));
  };

  return (
    <>
      <Modal.Header closeButton>
        <Modal.Title>New alert</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        <Form id="add-alert-form" onSubmit={handleSubmit}>
          <Form.Group className="mb-4" controlId="alert-name">
            <Form.Label>Name</Form.Label>
            <Form.Control
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. 2+kk in Vinohrady under 8M"
              autoFocus
              required
            />
          </Form.Group>

          <div className="form-section-label">Deliver to</div>
          <Segmented
            ariaLabel="Delivery channel"
            block
            value={type}
            onChange={setType}
            options={[
              { value: 'email', label: 'Email', icon: Envelope },
              { value: 'api', label: 'Webhook', icon: Link45deg },
              { value: 'discord', label: 'Discord', icon: Discord },
            ]}
          />

          <div className="mt-3">
            {type === 'email' && (
              <Form.Group controlId="alert-email">
                <Form.Label>Email address</Form.Label>
                <Form.Control
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                />
              </Form.Group>
            )}

            {type === 'api' && (
              <Form.Group controlId="alert-url">
                <Form.Label>Webhook URL</Form.Label>
                <Form.Control
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://your-app.com/webhook"
                  required
                />
                <Form.Text>We'll POST each matching listing to this endpoint.</Form.Text>
              </Form.Group>
            )}

            {type === 'discord' && (
              <Row className="g-3">
                <Col sm={6}>
                  <Form.Group controlId="alert-discord-id">
                    <Form.Label>Webhook ID</Form.Label>
                    <Form.Control
                      type="text"
                      value={webhookId}
                      onChange={(e) => setWebhookId(e.target.value)}
                      required
                    />
                  </Form.Group>
                </Col>
                <Col sm={6}>
                  <Form.Group controlId="alert-discord-token">
                    <Form.Label>Webhook token</Form.Label>
                    <Form.Control
                      type="password"
                      value={token}
                      onChange={(e) => setToken(e.target.value)}
                      required
                    />
                  </Form.Group>
                </Col>
              </Row>
            )}
          </div>

          <div className="form-section-label mt-4">What to watch</div>
          <Row className="g-3">
            <Col sm={6}>
              <Form.Label as="div">Property</Form.Label>
              <Segmented
                ariaLabel="Property type"
                block
                value={buildingType}
                onChange={handleBuildingTypeChange}
                options={ENABLED_BUILDING_TYPES.map(t => ({ value: t, label: BUILDING_TYPE_META[t].plural }))}
              />
            </Col>
            <Col sm={6}>
              <Form.Label as="div">Transaction</Form.Label>
              <Segmented
                ariaLabel="Transaction"
                block
                value={transactionType}
                onChange={setTransactionType}
                options={TRANSACTION_TYPES[buildingType].map(t => ({ value: t, label: t === 'SALE' ? 'Buy' : 'Rent' }))}
              />
            </Col>

            <Col sm={6}>
              <Form.Label htmlFor="alert-size-from">{SIZE_LABEL[buildingType]}</Form.Label>
              <InputGroup>
                <Form.Control
                  id="alert-size-from"
                  type="number"
                  inputMode="numeric"
                  value={sizeFrom}
                  onChange={(e) => setSizeFrom(e.target.value)}
                  placeholder="Min"
                  min="0"
                />
                <Form.Control
                  type="number"
                  inputMode="numeric"
                  value={sizeTo}
                  onChange={(e) => setSizeTo(e.target.value)}
                  placeholder="Max"
                  min="0"
                  aria-label="Maximum size"
                />
                <InputGroup.Text>m²</InputGroup.Text>
              </InputGroup>
            </Col>
            <Col sm={6}>
              <Form.Label htmlFor="alert-price-from">{transactionType === 'RENT' ? 'Monthly rent' : 'Price'}</Form.Label>
              <InputGroup>
                <Form.Control
                  id="alert-price-from"
                  type="number"
                  inputMode="numeric"
                  value={priceFrom}
                  onChange={(e) => setPriceFrom(e.target.value)}
                  placeholder="Min"
                  min="0"
                />
                <Form.Control
                  type="number"
                  inputMode="numeric"
                  value={priceTo}
                  onChange={(e) => setPriceTo(e.target.value)}
                  placeholder="Max"
                  min="0"
                  aria-label="Maximum price"
                />
                <InputGroup.Text>Kč</InputGroup.Text>
              </InputGroup>
            </Col>

            {buildingType === 'APARTMENT' && (
              <Col xs={12}>
                <Form.Group controlId="alert-layouts">
                  <Form.Label>Layouts</Form.Label>
                  <Form.Control
                    type="text"
                    value={subTypes}
                    onChange={(e) => setSubTypes(e.target.value)}
                    placeholder="e.g. 2+kk, 3+kk, 3+1"
                  />
                  <Form.Text>Comma-separated. Leave empty to match any layout.</Form.Text>
                </Form.Group>
              </Col>
            )}
          </Row>

          <p className="form-text mt-4 mb-0">
            {SCOPE_TEXT[buildingType]}
          </p>
        </Form>
      </Modal.Body>

      <Modal.Footer>
        <Button variant="outline-secondary" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
        <Button variant="primary" type="submit" form="add-alert-form" disabled={loading}>
          {loading && <Spinner animation="border" size="sm" className="text-reset" />}
          {loading ? 'Creating…' : 'Create alert'}
        </Button>
      </Modal.Footer>
    </>
  );
};

export default AddNotification;
