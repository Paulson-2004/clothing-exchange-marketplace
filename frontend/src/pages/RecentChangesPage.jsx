import { Link } from 'react-router-dom';
import Icon from '../components/common/Icon';

const MILESTONES = [
  {
    id: 'visual-polish-sep-2026',
    tag: 'Latest Update',
    date: 'September 2026',
    title: 'Visual Polish, Dark Mode & Navigation',
    highlight: true,
    summary:
      'Improved the marketplace design with dark mode, interactive value meters, mobile navigation, and faster browsing.',
    bullets: [
      'Switch between light mode and a warm, earthy dark theme with a single click.',
      'View a visual comparison meter on swap requests to see how closely item values align.',
      'Browse popular clothing categories quickly using interactive filter pills.',
      'See garment size, condition, brand, and category formatted as clear visual chips.',
      'Accept, decline, or complete swaps directly from the conversation header while chatting.',
      'Navigate smoothly on mobile devices with an accessible menu drawer and touch-friendly chat.',
      'Receive instant guidance on the registration form to catch typos and short passwords.',
    ],
  },
  {
    id: 'production-deployment',
    tag: 'Release',
    date: 'September 2026',
    title: 'Cloud Release & Multi-Photo Uploads',
    summary:
      'Launched ReWear online with reliable cloud hosting and photo management.',
    bullets: [
      'Access the marketplace live on the web with fast, continuous cloud hosting.',
      'Upload multiple photos per clothing listing with automatic placeholder fallbacks.',
      'Keep your wardrobe and messages safely synchronized across devices.',
    ],
  },
  {
    id: 'profile-and-location',
    tag: 'Profiles',
    date: 'September 2026',
    title: 'Member Profiles & Local Search',
    summary:
      'Personal profile pages and location filters to help you discover clothing available nearby.',
    bullets: [
      'Manage your personal profile with a custom bio, contact phone, and location.',
      'Track your wardrobe activity with counters for active items and completed swaps.',
      'Filter marketplace listings by city or state to find wearable clothes locally.',
    ],
  },
  {
    id: 'phase-8',
    tag: 'Safety',
    date: 'Phase 8',
    title: 'Community Moderation & Safety',
    summary:
      'Tools to oversee marketplace health, resolve conflicts, and maintain community trust.',
    bullets: [
      'Monitor marketplace activity including active listings, swap proposals, and conversations.',
      'Search and manage community members with protected administrative roles.',
      'Review and moderate clothing listings to keep marketplace items accurate and safe.',
      'Supervise ongoing trades to ensure a smooth, reliable exchange process.',
    ],
  },
  {
    id: 'phase-7',
    tag: 'Recommendations',
    date: 'Phase 7',
    title: 'Nearby Swap Matches',
    summary:
      'Smart recommendations on item pages showing compatible items available from nearby swappers.',
    bullets: [
      'Find nearby items available for swapping in your city or state.',
      'Discover clothing recommendations with similar estimated swap values.',
      'View only available items, with your own clothing automatically filtered out.',
    ],
  },
  {
    id: 'phase-6',
    tag: 'Fairness',
    date: 'Phase 6',
    title: 'Swap Value Comparison',
    summary:
      'Objective value estimates to help members compare items and make balanced trades.',
    bullets: [
      'Compare the estimated value of two items before agreeing to a trade.',
      'Receive instant value estimates based on garment category, brand, and condition.',
      'See clear match ratings for close, moderate, or large value differences.',
    ],
  },
  {
    id: 'phase-5',
    tag: 'Messaging',
    date: 'Phase 5',
    title: 'Direct Chat & Negotiation',
    summary:
      'Private 1-on-1 chat to ask questions, verify condition, and arrange local meetups.',
    bullets: [
      'Chat with other users about a swap to discuss sizing, fit, and pickup details.',
      'View the related swap request directly at the top of your conversation.',
      'Track unread messages with clear visual notification dots.',
    ],
  },
  {
    id: 'phase-4',
    tag: 'Swaps',
    date: 'Phase 4',
    title: 'Swap Proposals & Lifecycle',
    summary:
      'A simple, step-by-step process to propose, manage, and complete clothing trades.',
    bullets: [
      'Send, accept, decline, or cancel swap proposals with a single click.',
      'Items are held as pending during active proposals so they cannot be double-traded.',
      'Completed trades automatically update items to swapped and archive them from search.',
    ],
  },
  {
    id: 'phase-3',
    tag: 'Marketplace',
    date: 'Phase 3',
    title: 'Clothing Catalog & Search',
    summary:
      'Upload pre-loved clothing and search the marketplace by size, category, and condition.',
    bullets: [
      'List clothing items with photos, brand, size, condition, and location details.',
      'Filter the marketplace catalog by clothing type, size, condition, or keyword.',
      'Browse clear item cards showing garment photos, availability, and reference values.',
    ],
  },
  {
    id: 'phase-2',
    tag: 'Accounts',
    date: 'Phase 2',
    title: 'User Accounts & Secure Sign-In',
    summary:
      'Fast, secure account creation to start listing clothes and requesting swaps.',
    bullets: [
      'Create a secure account with your email and password in seconds.',
      'Stay safely signed in across browser visits on your favorite device.',
      'Keep personal swap requests and private messages protected within your account.',
    ],
  },
  {
    id: 'phase-1',
    tag: 'Foundation',
    date: 'Phase 1',
    title: 'Marketplace Launch & Sustainable Barter Model',
    summary:
      'Built the foundation for a sustainable, 100% money-free clothing exchange.',
    bullets: [
      'Designed exclusively for direct item-for-item clothing swaps without money.',
      'Responsive interface tailored for comfortable use on desktop, tablet, and mobile.',
      'Warm, sustainable earthy green visual identity supporting circular fashion.',
    ],
  },
];

function RecentChangesPage() {
  return (
    <div className="page-container changelog-page">
      <div className="changelog-header">
        <span className="changelog-header-badge">Product Updates</span>
        <h1>Recent Changes</h1>
        <p className="changelog-subtitle">
          A look at the latest improvements and milestones across the ReWear marketplace.
        </p>
      </div>

      <div className="changelog-timeline">
        {MILESTONES.map((item) => (
          <div
            key={item.id}
            className={`changelog-item ${item.highlight ? 'changelog-item-highlight' : ''}`}
          >
            <div className="changelog-indicator">
              <div className="changelog-dot">
                <Icon name={item.highlight ? 'check' : 'package'} size={14} />
              </div>
              <div className="changelog-line" />
            </div>

            <div className="changelog-card">
              <div className="changelog-card-header">
                <div className="changelog-meta-row">
                  <span className={`changelog-tag ${item.highlight ? 'tag-highlight' : ''}`}>
                    {item.tag}
                  </span>
                  <span className="changelog-date">{item.date}</span>
                </div>
                <h2 className="changelog-title">{item.title}</h2>
                <p className="changelog-summary">{item.summary}</p>
              </div>

              <ul className="changelog-bullets">
                {item.bullets.map((bullet, idx) => (
                  <li key={idx}>{bullet}</li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>

      <div className="changelog-footer-cta">
        <h3>Explore the Marketplace</h3>
        <p>Browse active clothing listings or learn more in our FAQ.</p>
        <div className="changelog-cta-buttons">
          <Link to="/" className="btn btn-primary">
            Explore Marketplace
          </Link>
          <Link to="/faq" className="btn btn-secondary">
            Read FAQ
          </Link>
        </div>
      </div>
    </div>
  );
}

export default RecentChangesPage;
