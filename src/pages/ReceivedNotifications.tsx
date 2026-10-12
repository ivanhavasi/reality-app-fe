import React, { useState, useEffect } from 'react';
import { Button } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { Bell, Building, ChevronLeft, ChevronRight, Inbox } from 'react-bootstrap-icons';
import { fetchNotifications } from '../services/api';
import { userService } from '../services/UserService';
import { BUILDING_TYPE_META, BuildingType, isBuildingType } from '../types/property';
import { formatPrice, typeLabel } from '../utils/format';
import { EmptyState, ListingImage, ListingSkeletonGrid, PageHeader } from '../components/ui';

interface SentNotificationRealEstate {
  id: string;
  name: string;
  url: string;
  price: number;
  city: string;
  image: string;
  provider: string;
  // not sent by the backend yet; older sent notifications will never have them
  mainCategory?: BuildingType | null;
  subCategory?: string | null;
}

interface SentNotification {
  notificationId: string;
  userId: string;
  type: string;
  realEstate: SentNotificationRealEstate;
  sentAt: string; // OffsetDateTime as string (for simplicity)
}

interface ReceivedNotificationsProps {
  token: string;
}

const ReceivedNotifications = ({ token }: ReceivedNotificationsProps) => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<SentNotification[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  // Always assume there are more pages until proven otherwise
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const limit = 20;

  // Use a single useEffect for data fetching that depends only on currentPage and token
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      try {
        // Get the user ID from storage
        const userId = userService.getUserId();
        
        if (!userId) {
          console.error('User ID not found in storage');
          setLoading(false);
          return;
        }
        
        const newNotifications = await fetchNotifications(
          userId,
          limit,
          (currentPage - 1) * limit,
        );
        
        // Always replace notifications with new page data
        setNotifications(newNotifications);
        
        // a short page means this was the last one
        setHasMore(newNotifications.length === limit);
      } catch (error) {
        console.error('Failed to fetch notifications', error);
        // In case of error, don't change hasMore state
      } finally {
        setLoading(false);
      }
    };
  
    fetchData();
    // Only run when these dependencies change
  }, [currentPage, token, limit]);

  const handleNextPage = () => {
    if (!hasMore || loading) return; // Prevent navigating if no more data or currently loading
    setCurrentPage((prevPage) => prevPage + 1);
  };
  
  const handlePreviousPage = () => {
    if (currentPage === 1 || loading) return; // Prevent navigating if already at first page or loading
    setCurrentPage((prevPage) => prevPage - 1);
  };

  const formatSentAt = (value: string) =>
    new Date(value).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <>
      <PageHeader
        title="Matches"
        subtitle="Listings your alerts have sent you, newest first"
        actions={
          <Button variant="outline-secondary" onClick={() => navigate('/notifications')}>
            <Bell size={14} />
            Manage alerts
          </Button>
        }
      />

      {loading ? (
        <ListingSkeletonGrid />
      ) : notifications.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title={currentPage > 1 ? 'No more matches' : 'No matches yet'}
          text={
            currentPage > 1
              ? "You've reached the end of your match history."
              : "When a new listing fits one of your alerts, it'll show up here."
          }
          actions={
            currentPage > 1 ? (
              <Button variant="outline-secondary" onClick={handlePreviousPage}>
                <ChevronLeft size={14} />
                Previous page
              </Button>
            ) : (
              <Button variant="primary" onClick={() => navigate('/notifications')}>
                Set up an alert
              </Button>
            )
          }
        />
      ) : (
        <>
          <div className="listing-grid">
            {notifications.map((notification) => {
              const estate = notification.realEstate;
              const TypeIcon = isBuildingType(estate.mainCategory) ? BUILDING_TYPE_META[estate.mainCategory].icon : Building;
              return (
                <Link
                  key={`${notification.notificationId}-${estate.id}-${notification.sentAt}`}
                  to={`/real-estates/${estate.id}`}
                  className="listing-card"
                >
                  <ListingImage src={estate.image} alt={estate.name} fallbackIcon={TypeIcon}>
                    <div className="listing-tags">
                      <span className="media-tag">{estate.provider}</span>
                    </div>
                  </ListingImage>
                  <div className="listing-body">
                    <div className="listing-price">{formatPrice(estate.price)}</div>
                    <div className="listing-title line-clamp-1" title={estate.name}>{estate.name}</div>
                    <div className="listing-meta">
                      {[estate.mainCategory ? typeLabel(estate.mainCategory, estate.subCategory) : null, estate.city]
                        .filter(Boolean)
                        .join(' · ')}
                    </div>
                    <div className="listing-meta text-3">
                      Sent {formatSentAt(notification.sentAt)} via {notification.type.toLowerCase()}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>

          {(currentPage > 1 || hasMore) && (
            <div className="d-flex align-items-center justify-content-center gap-3 mt-5">
              <Button variant="outline-secondary" onClick={handlePreviousPage} disabled={currentPage === 1}>
                <ChevronLeft size={14} />
                Previous
              </Button>
              <span className="text-2 tabular" style={{ fontSize: '0.875rem' }}>Page {currentPage}</span>
              <Button variant="outline-secondary" onClick={handleNextPage} disabled={!hasMore}>
                Next
                <ChevronRight size={14} />
              </Button>
            </div>
          )}
        </>
      )}
    </>
  );
};

export default ReceivedNotifications;
