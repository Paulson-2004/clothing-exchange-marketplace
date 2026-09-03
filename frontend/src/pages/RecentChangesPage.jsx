import { Link } from 'react-router-dom';
import Icon from '../components/common/Icon';

const MILESTONES = [
  {
    id: 'visual-polish-sep-2026',
    tag: 'Latest Update',
    date: 'September 2026',
    title: 'September 2026 — Visual Polish, Accessibility & User Experience Improvements',
    highlight: true,
    summary:
      'A comprehensive design and user experience update focusing on visual clarity, mobile ergonomics, accessibility, and day-to-day usability across the marketplace.',
    bullets: [
      'Marketplace Value-Proposition Banner: Introduced a clean introduction banner highlighting the direct, non-monetary clothing exchange model.',
      'Quick Category Filters: Added interactive category filter pills for one-click discovery across popular clothing types.',
      'Visual Value Comparison Meter: Added a clear progress meter bar on swap requests to make it easy to see how closely two items match in estimated value.',
      'Garment Specification Chips: Reorganized clothing details (Category, Brand, Size, Condition) into modern visual specification tags on item pages.',
      'Consistent Vector Icons: Replaced platform-dependent emojis with a unified SVG icon set across all dashboards and tags for a cleaner experience on any device.',
      'Refined Surface Visuals: Improved border contrast and surface styling across all cards, filters, and dashboard containers.',
      'Light & Dark Theme System: Added an accessible theme toggle in the navigation bar with light mode as default, a warm earthy dark palette, and persistent preference saving.',
      'Mobile Navigation & Chat Ergonomics: Implemented an accessible hamburger navigation drawer and improved mobile chat navigation with smooth thread switching.',
      'Contextual In-Chat Swap Actions: Enabled one-click action buttons inside chat headers so swappers can accept, decline, cancel, or complete trades while discussing details.',
      'Strengthened Registration Validation: Added instant inline validation to clearly flag invalid emails, malformed phone numbers, short passwords, and mismatched confirmations before submission.',
      'Quality Benchmark: Verified with 173/173 backend automated tests passing (100% test pass rate), frontend build completed with 0 errors and 0 warnings, and no new dependencies introduced.',
    ],
  },
  {
    id: 'production-deployment',
    tag: 'Infrastructure',
    date: 'September 2026',
    title: 'September 2026 — Production Deployment & Service Reliability',
    summary:
      'Deployed the application to cloud environments with automated builds, high-availability database storage, and secure photo hosting.',
    bullets: [
      'Cloud Hosting: Deployed the interactive web client and application server to production cloud environments with automated build optimization.',
      'Cloud Database: Connected to a reliable, high-availability cloud database cluster for real-time data persistence.',
      'Photo Storage Integration: Added cloud storage for multi-image listing uploads with automatic placeholder fallbacks.',
      'Security Sanitization: Audited and secured repository configuration, ensuring zero sensitive credentials or development secrets in tracked files.',
    ],
  },
  {
    id: 'profile-and-location',
    tag: 'Feature Update',
    date: 'September 2026',
    title: 'September 2026 — Member Profiles & Location Filtering',
    summary:
      'Added dedicated user profiles, activity metrics, and localized marketplace search capabilities.',
    bullets: [
      'Personal Profile Management: Members can manage their display name, contact phone, city/state, and personal bio.',
      'Member Activity Counters: Added real-time counters displaying total listings, available garments, and completed trades.',
      'Location-Based Search: Added direct city and state filter inputs on the marketplace to help users find clothes available locally.',
      'Automated Test Coverage: Added 17 integration tests verifying profile updates, field protections, and location search accuracy.',
    ],
  },
  {
    id: 'phase-8',
    tag: 'Milestone',
    date: 'Phase 8',
    title: 'Phase 8 — Administration & Content Moderation',
    summary:
      'Added administrative governance tools to oversee marketplace health and maintain community safety.',
    bullets: [
      'Administrator Dashboard: High-level platform statistics displaying total members, active listings, swap requests, and messages.',
      'User Management: Searchable directory of registered accounts with role management and protections against accidental admin self-demotion.',
      'Listing Moderation: Platform-wide oversight of apparel listings with category/status filtering and safe deletion that cancels linked active trades.',
      'Swap Monitoring: Comprehensive view of incoming, pending, accepted, and completed swaps across the marketplace.',
    ],
  },
  {
    id: 'phase-7',
    tag: 'Milestone',
    date: 'Phase 7',
    title: 'Phase 7 — Nearby Swap Matching',
    summary:
      'Introduced localized trade recommendations on item detail pages to help members find compatible swaps nearby.',
    bullets: [
      'Location Proximity Matching: Automatically finds and suggests compatible listings from people in the same city or state.',
      'Value Compatibility Matching: Filters suggestions to items with reasonably close estimated values so trades remain fair.',
      'Smart Filtering: Automatically excludes unavailable listings and the member\'s own items from recommendation lists.',
    ],
  },
  {
    id: 'phase-6',
    tag: 'Milestone',
    date: 'Phase 6',
    title: 'Phase 6 — Swap Value Comparison',
    summary:
      'Introduced objective value estimation and fairness comparison between garments proposed for exchange.',
    bullets: [
      'Estimated Swap Values: Automatically calculates an estimated reference value based on category, brand tier, and garment condition.',
      'Fairness Tiers: Categorizes trade balance into Close Match (≤20% difference), Moderate Difference (21–50%), and Large Difference (>50%).',
      'Transparent Trade Insights: Displays value comparison directly on swap proposals to help members make informed trade decisions.',
    ],
  },
  {
    id: 'phase-5',
    tag: 'Milestone',
    date: 'Phase 5',
    title: 'Phase 5 — Chat & Negotiation',
    summary:
      'Integrated private messaging so trading partners can connect and discuss items before accepting a swap.',
    bullets: [
      'Direct Messaging: 1-on-1 private conversations between trading partners to discuss sizing, condition, and meetups.',
      'Swap Linking: Conversations automatically associate with the corresponding swap request for clear context.',
      'Unread Message Badges: Real-time unread counts and read receipts across conversation lists.',
    ],
  },
  {
    id: 'phase-4',
    tag: 'Milestone',
    date: 'Phase 4',
    title: 'Phase 4 — Swap Request Lifecycle',
    summary:
      'Built the end-to-end swap request workflow from proposal to completion.',
    bullets: [
      'Swap Workflow: Structured trade states from proposal submission to acceptance, completion, decline, or cancellation.',
      'Inventory Locking: Automatically marks items as pending during active proposals to prevent double-swapping.',
      'Conflict Resolution: Automatically declines competing proposals once an item is accepted into an active trade.',
      'Archiving: Automatically marks items as swapped upon completion and archives them from the active marketplace.',
    ],
  },
  {
    id: 'phase-3',
    tag: 'Milestone',
    date: 'Phase 3',
    title: 'Phase 3 — Clothing Listings & Marketplace',
    summary:
      'Created the core marketplace catalog with multi-photo garment listings and search filters.',
    bullets: [
      'Item Creation & Management: Full support for creating, updating, and removing clothing listings with photos, size, condition, and brand.',
      'Marketplace Browsing: Real-time search with multi-parameter filtering by category, size, condition, and keywords.',
      'Responsive Item Cards: Clean visual grid displaying item photos, status badges, estimated values, and location tags.',
    ],
  },
  {
    id: 'phase-2',
    tag: 'Milestone',
    date: 'Phase 2',
    title: 'Phase 2 — Account & Authentication',
    summary:
      'Implemented secure user registration, login, and session handling.',
    bullets: [
      'Member Registration & Login: Secure account creation with password encryption and authenticated sessions.',
      'Session Persistence: Remembers logged-in members across browser refreshes and restores their active session.',
      'Protected Member Areas: Restricts listing creation, swap requests, and chat to authenticated members.',
    ],
  },
  {
    id: 'phase-1',
    tag: 'Milestone',
    date: 'Phase 1',
    title: 'Phase 1 — Project Foundation',
    summary:
      'Established the foundation, data architecture, and visual design system for the Clothing Exchange marketplace.',
    bullets: [
      'System Architecture: Decoupled web client and application server architecture.',
      'Data Models: Structured schemas for members, listings, swap requests, conversations, and messages.',
      'Design System: Created the signature earthy green and warm neutral visual theme with accessible responsive components.',
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
          A look at the latest improvements and milestones across the Clothing Exchange marketplace.
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
                {item.bullets.map((bullet, idx) => {
                  const [title, ...rest] = bullet.split(': ');
                  return (
                    <li key={idx}>
                      {rest.length > 0 ? (
                        <>
                          <strong>{title}:</strong> {rest.join(': ')}
                        </>
                      ) : (
                        bullet
                      )}
                    </li>
                  );
                })}
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
