import React, { useState, useEffect } from 'react';
import { 
  getUserNotifications, 
  deleteNotification, 
  enableNotification, 
  disableNotification 
} from '../services/api';
import {
  Notification,
  NotificationType,
  FilterRange,
  EmailNotification,
  WebhookNotification,
  DiscordWebhookNotification
} from '../types/notifications';
import { BUILDING_TYPE_META, isBuildingType, TRANSACTION_TYPE_LABELS } from '../types/property';
import { buildingTypeLabel, subCategoryLabel } from '../utils/format';
import { Button, Form, Modal, Spinner } from 'react-bootstrap';
import { Bell, BellSlash, Discord, Envelope, Link45deg, Plus, Trash3 } from 'react-bootstrap-icons';
import AddNotification from '../components/AddNotification';
import { EmptyState, PageHeader } from '../components/ui';
import { useError } from '../context/ErrorContext';

interface NotificationsProps {
  token?: string;
}

const Notifications: React.FC<NotificationsProps> = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [actionLoading, setActionLoading] = useState<{[id: string]: string}>({});
  const { setError } = useError();
  
  const fetchNotifications = async () => {
    setLoading(true);
    try {
      console.log('Fetching notifications...');
      const data = await getUserNotifications();
      console.log('Notifications received:', data);
      setNotifications(data);
      return true; // Indicate successful fetch
    } catch (err) {
      // Extract error message from Error object
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      console.error('Fetch error:', errorMessage);
      setError(errorMessage);
      return false; // Indicate failed fetch
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log('Notifications component mounted');
    fetchNotifications();
  }, []);

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this notification?')) {
      try {
        setActionLoading({...actionLoading, [id]: 'delete'});
        await deleteNotification(id);

        // After delete operation, refresh the entire notifications list
        // to ensure we have the latest data
        await fetchNotifications();
      } catch (err) {
        // Extract error message from Error object
        const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
        console.error('Delete error:', errorMessage);
        setError(errorMessage);
      } finally {
        const newActionLoading = {...actionLoading};
        delete newActionLoading[id];
        setActionLoading(newActionLoading);
      }
    }
  };

  const handleToggleEnable = async (notification: Notification) => {
    try {
      const action = notification.enabled ? 'disable' : 'enable';
      setActionLoading({...actionLoading, [notification.id]: action});

      if (notification.enabled) {
        await disableNotification(notification.id);
      } else {
        await enableNotification(notification.id);
      }

      // After enable/disable operation, refresh the entire notifications list
      // to ensure we have the latest data
      await fetchNotifications();

    } catch (err) {
      // Extract error message from Error object
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      console.error('Toggle error:', errorMessage);
      setError(errorMessage);
    } finally {
      const newActionLoading = {...actionLoading};
      delete newActionLoading[notification.id];
      setActionLoading(newActionLoading);
    }
  };

  const getChannel = (notification: Notification) => {
    switch (notification.type) {
      case NotificationType.EMAIL:
        return { icon: Envelope, label: 'Email', target: (notification as EmailNotification).email };
      case NotificationType.WEBHOOK:
        return { icon: Link45deg, label: 'Webhook', target: (notification as WebhookNotification).url };
      case NotificationType.DISCORD:
        return { icon: Discord, label: 'Discord', target: `Webhook ${(notification as DiscordWebhookNotification).webhookId}` };
      default:
        return { icon: Bell, label: notification.type, target: '' };
    }
  };

  const formatRange = (range: FilterRange<number> | undefined, unit: string) => {
    const from = range?.from ?? null;
    const to = range?.to ?? null;
    const fmt = (v: number) => `${v.toLocaleString('cs-CZ')} ${unit}`;
    if (from !== null && to !== null) return `${from.toLocaleString('cs-CZ')}–${fmt(to)}`;
    if (from !== null) return `from ${fmt(from)}`;
    if (to !== null) return `up to ${fmt(to)}`;
    return null;
  };

  const describeCriteria = (notification: Notification) => {
    const { buildingType, transactionType, subTypes, price, size } = notification.filter;
    return [
      buildingTypeLabel(buildingType) || 'Any property',
      transactionType ? TRANSACTION_TYPE_LABELS[transactionType]?.toLowerCase() ?? transactionType : null,
      (subTypes || []).map(subType => subCategoryLabel(buildingType, subType)).join(', ') || null,
      formatRange(price, 'Kč'),
      formatRange(size, 'm²'),
    ].filter(Boolean).join(' · ');
  };

  const formatDate = (value: string) =>
    new Date(value).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

  const activeCount = notifications.filter(n => n.enabled).length;

  return (
    <>
      <PageHeader
        title="Alerts"
        subtitle={
          notifications.length > 0
            ? `${activeCount} of ${notifications.length} active · You'll be notified when a new listing matches`
            : "Get notified the moment a new listing matches what you're looking for"
        }
        actions={
          <Button variant="primary" onClick={() => setShowAddModal(true)}>
            <Plus size={18} />
            New alert
          </Button>
        }
      />

      {loading ? (
        <div className="alert-list" aria-hidden="true">
          {[0, 1, 2].map(i => (
            <div className="alert-item" key={i}>
              <div className="flex-grow-1">
                <div className="skeleton" style={{ height: 16, width: '30%' }} />
                <div className="skeleton mt-3" style={{ height: 12, width: '70%' }} />
                <div className="skeleton mt-2" style={{ height: 12, width: '45%' }} />
              </div>
            </div>
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <EmptyState
          icon={BellSlash}
          title="No alerts yet"
          text="Create an alert with your criteria and we'll email you, call your webhook or post to Discord when a matching listing appears."
          actions={
            <Button variant="primary" onClick={() => setShowAddModal(true)}>
              <Plus size={18} />
              Create your first alert
            </Button>
          }
        />
      ) : (
        <div className="alert-list">
          {notifications.map(notification => {
            const channel = getChannel(notification);
            const ChannelIcon = channel.icon;
            const busy = actionLoading[notification.id];
            const TypeIcon = isBuildingType(notification.filter.buildingType)
              ? BUILDING_TYPE_META[notification.filter.buildingType].icon
              : Bell;
            return (
              <div key={notification.id} className={`alert-item${notification.enabled ? '' : ' is-off'}`}>
                <div className="link-card-icon d-none d-sm-grid">
                  <TypeIcon size={16} />
                </div>
                <div className="alert-item-main">
                  <div className="alert-item-head">
                    <h2 className="alert-item-title">{notification.name}</h2>
                    <span className="chip">
                      <span className={`status-dot${notification.enabled ? ' is-on' : ''}`} />
                      {notification.enabled ? 'Active' : 'Paused'}
                    </span>
                  </div>
                  <div className="alert-item-criteria">{describeCriteria(notification)}</div>
                  <div className="alert-item-meta">
                    <span className="text-truncate">
                      <ChannelIcon size={13} className="flex-shrink-0" />
                      <span className="text-truncate">{channel.target || channel.label}</span>
                    </span>
                    <span>Created {formatDate(notification.createdAt)}</span>
                  </div>
                </div>
                <div className="alert-item-actions">
                  <Form.Check
                    type="switch"
                    id={`alert-switch-${notification.id}`}
                    checked={notification.enabled}
                    disabled={busy === 'enable' || busy === 'disable'}
                    onChange={() => handleToggleEnable(notification)}
                    aria-label={notification.enabled ? 'Pause alert' : 'Resume alert'}
                    title={notification.enabled ? 'Pause alert' : 'Resume alert'}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="btn-icon btn-ghost-danger"
                    onClick={() => handleDelete(notification.id)}
                    disabled={busy === 'delete'}
                    aria-label="Delete alert"
                    title="Delete alert"
                  >
                    {busy === 'delete' ? <Spinner animation="border" size="sm" /> : <Trash3 size={15} />}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal show={showAddModal} onHide={() => setShowAddModal(false)} centered>
        <AddNotification
          onSuccess={() => {
            setShowAddModal(false);
            fetchNotifications();
          }}
          onCancel={() => setShowAddModal(false)}
        />
      </Modal>
    </>
  );
};

export default Notifications;
