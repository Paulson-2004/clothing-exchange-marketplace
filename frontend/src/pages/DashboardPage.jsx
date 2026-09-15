import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getIncomingRequests, getSentRequests } from '../api/swapApi';
import { getMyListings } from '../api/listingApi';
import Loader from '../components/common/Loader';
import ErrorMessage from '../components/common/ErrorMessage';
import ListingCard from '../components/listing/ListingCard';
import { getOptimizedImageUrl } from '../utils/imageUrl';

function timeAgo(date) {
  const seconds = Math.floor((new Date() - date) / 1000);
  let interval = Math.floor(seconds / 31536000);
  if (interval >= 1) return interval + ' year' + (interval === 1 ? '' : 's') + ' ago';
  interval = Math.floor(seconds / 2592000);
  if (interval >= 1) return interval + ' month' + (interval === 1 ? '' : 's') + ' ago';
  interval = Math.floor(seconds / 86400);
  if (interval >= 1) return interval + ' day' + (interval === 1 ? '' : 's') + ' ago';
  interval = Math.floor(seconds / 3600);
  if (interval >= 1) return interval + ' hour' + (interval === 1 ? '' : 's') + ' ago';
  interval = Math.floor(seconds / 60);
  if (interval >= 1) return interval + ' min' + (interval === 1 ? '' : 's') + ' ago';
  return 'Just now';
}

function DashboardPage() {
  const { user } = useAuth();
  const [incoming, setIncoming] = useState([]);
  const [sent, setSent] = useState([]);
  const [myListings, setMyListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [incomingRes, sentRes, listingsRes] = await Promise.all([
          getIncomingRequests(),
          getSentRequests(),
          getMyListings()
        ]);
        setIncoming(incomingRes.swapRequests || []);
        setSent(sentRes.swapRequests || []);
        setMyListings(listingsRes.listings || []);
      } catch (err) {
        setError('Failed to load dashboard data.');
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="page-container">
        <Loader message="Loading dashboard..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-container">
        <ErrorMessage message={error} onRetry={() => window.location.reload()} />
      </div>
    );
  }

  const pendingIncoming = incoming.filter((req) => req.status === 'pending');
  const activeIncoming = incoming.filter((req) => req.status === 'accepted');
  const activeSent = sent.filter((req) => req.status === 'accepted');
  const activeSwaps = [...activeIncoming, ...activeSent]; // accepted items awaiting completion
  const pendingSent = sent.filter((req) => req.status === 'pending');

  const completedSwapsCount = [...incoming, ...sent].filter(req => req.status === 'completed').length;
  const availableListingsCount = myListings.filter(l => l.status === 'available').length;
  const activeAndPendingCount = pendingIncoming.length + pendingSent.length + activeSwaps.length;

  const recentExchanges = [...incoming, ...sent]
    .filter((req) => ['completed', 'rejected', 'cancelled'].includes(req.status))
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
    .slice(0, 3); // top 3 for the history section

  const displayListings = myListings.slice(0, 4);

  // Generate timeline events reliably from existing data
  const timelineEvents = [];
  myListings.forEach(listing => {
    timelineEvents.push({
      id: `list_${listing._id}`,
      title: 'Listing published',
      desc: listing.title,
      date: new Date(listing.createdAt)
    });
  });

  [...incoming, ...sent].forEach(swap => {
    const isIncoming = swap.requestedListing?.owner === user?._id || swap.requestedListing?.owner?._id === user?._id;
    
    // Swap requested event
    timelineEvents.push({
      id: `req_${swap._id}`,
      title: isIncoming ? 'Swap request received' : 'Swap request sent',
      desc: isIncoming 
        ? `${swap.requester?.name || 'Someone'} requested your ${swap.requestedListing?.title || 'item'}`
        : `You requested ${swap.requestedListing?.title || 'an item'}`,
      date: new Date(swap.createdAt)
    });

    // Swap updated event
    if (swap.status !== 'pending' && swap.updatedAt !== swap.createdAt) {
      let title = '';
      let desc = '';
      
      if (swap.status === 'accepted') {
        title = 'Swap accepted';
        desc = isIncoming ? `You accepted the request for ${swap.requestedListing?.title}` : `Your request for ${swap.requestedListing?.title} was accepted`;
      } else if (swap.status === 'completed') {
        title = 'Swap completed';
        desc = `Exchange completed for ${swap.requestedListing?.title}`;
      } else if (swap.status === 'rejected') {
        title = 'Swap declined';
        desc = isIncoming ? `You declined the request for ${swap.requestedListing?.title}` : `Your request for ${swap.requestedListing?.title} was declined`;
      } else if (swap.status === 'cancelled') {
        title = 'Swap cancelled';
        desc = `The request for ${swap.requestedListing?.title} was cancelled`;
      }

      timelineEvents.push({
        id: `upd_${swap._id}_${swap.status}`,
        title,
        desc,
        date: new Date(swap.updatedAt)
      });
    }
  });

  timelineEvents.sort((a, b) => b.date - a.date);
  const recentTimeline = timelineEvents.slice(0, 5);

  const hasNoActivity = myListings.length === 0 && incoming.length === 0 && sent.length === 0;

  return (
    <div className="page-container dashboard-page">
      <div className="dashboard-editorial-header">
        <h1 className="editorial-title" style={{ marginBottom: '0.5rem' }}>
          Welcome back, {user?.name.split(' ')[0]}
        </h1>
        <p className="editorial-subtitle" style={{ margin: 0, color: 'var(--color-text-secondary)' }}>
          Your ReWear exchange control center.
        </p>
      </div>

      
          <section className="dashboard-section" style={{ marginBottom: '3rem' }}>
            <h2 className="dashboard-section-title" style={{ marginBottom: '1.5rem', fontSize: '1.25rem' }}>ReWear Overview</h2>
            <div className="overview-stats-row">
              <div className="overview-stat">
                <span className="overview-stat-value">{availableListingsCount}</span>
                <span className="overview-stat-label">Available Items</span>
              </div>
              <div className="overview-stat">
                <span className="overview-stat-value">{activeAndPendingCount}</span>
                <span className="overview-stat-label">Swaps in Progress</span>
              </div>
              <div className="overview-stat">
                <span className="overview-stat-value">{completedSwapsCount}</span>
                <span className="overview-stat-label">Completed Swaps</span>
              </div>
            </div>
          </section>

          <div className="dashboard-layout-grid">
            <div className="dashboard-main-col">
              {/* Action Required Section */}
              <section className="dashboard-section">
                  <div className="dashboard-section-header">
                    <h2 className="dashboard-section-title">Needs Your Attention</h2>
                  </div>
                  {pendingIncoming.length === 0 && activeSwaps.length === 0 && pendingSent.length === 0 && (
                    <p style={{ color: 'var(--color-text-secondary)', fontStyle: 'italic' }}>You're all caught up! No swaps require your attention.</p>
                  )}
                  
                  {pendingIncoming.length > 0 && (
                    <div className="dashboard-action-card">
                      <div className="dashboard-action-text">
                        <h4>{pendingIncoming.length} Incoming Request{pendingIncoming.length !== 1 ? 's' : ''}</h4>
                        <p>Review people who want to exchange with you.</p>
                      </div>
                      <div className="dashboard-action-btn">
                        <Link to="/swap-requests" className="btn btn-primary">
                          Review Requests
                        </Link>
                      </div>
                    </div>
                  )}

                  {activeSwaps.length > 0 && (
                    <div className="dashboard-action-card">
                      <div className="dashboard-action-text">
                        <h4>{activeSwaps.length} Active Exchange{activeSwaps.length !== 1 ? 's' : ''}</h4>
                        <p>Continue coordinating your accepted swap{activeSwaps.length !== 1 ? 's' : ''}.</p>
                      </div>
                      <div className="dashboard-action-btn">
                        <Link to="/chat" className="btn btn-secondary">
                          Open Messages
                        </Link>
                      </div>
                    </div>
                  )}

                  {pendingSent.length > 0 && (
                    <div className="dashboard-action-card" style={{ background: 'transparent' }}>
                      <div className="dashboard-action-text">
                        <h4>{pendingSent.length} Sent Request{pendingSent.length !== 1 ? 's' : ''}</h4>
                        <p>Waiting for the other member's response.</p>
                      </div>
                      <div className="dashboard-action-btn">
                        <Link to="/swap-requests" className="btn btn-secondary">
                          View Sent
                        </Link>
                      </div>
                    </div>
                  )}
                </section>

              {/* My Wardrobe Section */}
              <section className="dashboard-section">
                <div className="dashboard-section-header">
                  <h2 className="dashboard-section-title">My Wardrobe</h2>
                  <Link to="/my-listings" className="dashboard-section-link">
                    View All Listings →
                  </Link>
                </div>
                
                {myListings.length === 0 ? (
                  <p style={{ color: 'var(--color-text-secondary)', fontStyle: 'italic' }}>Your wardrobe is currently empty.</p>
                ) : (
                  <div className="listing-grid">
                    {displayListings.map(listing => (
                      <div key={listing._id} style={{ position: 'relative' }}>
                        <ListingCard listing={listing} />
                        {listing.status !== 'available' && (
                          <div className="wardrobe-item-mask">
                            <span className="wardrobe-item-mask-text">
                              {listing.status === 'pending' ? 'Pending Swap' : 'Swapped'}
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {/* Recent Exchanges Section */}
              <section className="dashboard-section">
                  <div className="dashboard-section-header">
                    <h2 className="dashboard-section-title">Recent Exchanges</h2>
                    <Link to="/swap-requests" className="dashboard-section-link">
                      View Swap History →
                    </Link>
                  </div>
                  {recentExchanges.length === 0 ? (
                    <p style={{ color: 'var(--color-text-secondary)', fontStyle: 'italic' }}>No recent exchanges.</p>
                  ) : (
                    <div className="history-list">
                    {recentExchanges.map((swap) => {
                      const isIncoming = swap.requestedListing?.owner === user?._id || swap.requestedListing?.owner?._id === user?._id;
                      const itemImage = isIncoming 
                        ? getOptimizedImageUrl(swap.requestedListing?.images?.[0]) 
                        : getOptimizedImageUrl(swap.offeredListing?.images?.[0]);
                      const itemTitle = isIncoming
                        ? swap.requestedListing?.title
                        : swap.offeredListing?.title;
                      
                      return (
                        <div key={swap._id} className="history-item">
                          <img src={itemImage} alt={itemTitle || 'Item'} className="history-item-thumb" />
                          <div className="history-item-details">
                            <p style={{ fontWeight: '500' }}>{itemTitle || 'Item'}</p>
                            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginTop: '0.2rem' }}>
                              {isIncoming ? 'Requested by' : 'Offered to'} {isIncoming ? swap.requester?.name : swap.requestedListing?.owner?.name || 'User'}
                            </p>
                          </div>
                          <span className="history-item-status">
                            {swap.status}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  )}
                </section>
            </div>

            <div className="dashboard-side-col">
              {/* Quick Actions */}
              <section className="dashboard-section" style={{ marginBottom: '4rem' }}>
                <h2 className="dashboard-section-title" style={{ marginBottom: '1.5rem', fontSize: '1.25rem' }}>Quick Actions</h2>
                <div className="quick-action-links">
                  <Link to="/listings/new" className="quick-action-link">List an Item <span>→</span></Link>
                  <Link to="/my-listings" className="quick-action-link">My Listings <span>→</span></Link>
                  <Link to="/swap-requests" className="quick-action-link">Swap Requests <span>→</span></Link>
                  <Link to="/chat" className="quick-action-link">Messages <span>→</span></Link>
                </div>
              </section>

              {/* Recent Activity Timeline */}
              <section className="dashboard-section">
                  <h2 className="dashboard-section-title" style={{ marginBottom: '1.5rem', fontSize: '1.25rem' }}>Recent Activity</h2>
                  {recentTimeline.length === 0 ? (
                    <p style={{ color: 'var(--color-text-secondary)', fontStyle: 'italic' }}>No recent activity.</p>
                  ) : (
                    <div className="dashboard-timeline">
                    {recentTimeline.map((event) => (
                      <div key={event.id} className="timeline-event">
                        <div className="timeline-dot" />
                        <h4 className="timeline-event-title">{event.title}</h4>
                        <p className="timeline-event-desc">{event.desc}</p>
                        <p className="timeline-event-date">{timeAgo(event.date)}</p>
                      </div>
                    ))}
                  </div>
                  )}
                </section>
            </div>
          </div>
        </div>
  );
}

export default DashboardPage;
