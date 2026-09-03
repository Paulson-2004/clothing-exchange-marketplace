import { Link } from 'react-router-dom';
import Icon from '../components/common/Icon';

const MILESTONES = [
  {
    id: 'visual-polish-sep-2026',
    tag: 'Latest Milestone',
    date: 'September 2026',
    title: 'Visual Polish, Accessibility & Portfolio Refinements',
    highlight: true,
    summary:
      'A comprehensive UI/UX refinement pass elevating visual consistency, mobile ergonomics, accessibility, and platform presentation.',
    bullets: [
      'Marketplace Value-Proposition Hero: Introduced a clean, compact intro banner communicating the direct non-monetary exchange model.',
      'Category Filter Pills: Added an interactive category pill bar for 1-click visual category discovery and filtering.',
      'Swap Value Comparison Meter: Created a visual progress meter bar on swap cards with color-coded fairness thresholds (≤20% Close Match, 21–50% Moderate Diff, >50% Large Diff).',
      'Specification Chips: Converted Category, Brand, Size, and Condition on the Item Details page into modern apparel specification tags.',
      'Reusable SVG Icon Component: Replaced raw system emojis across admin stats, user dashboard, and match tags with unified vector icons.',
      'Refined Card Border Contrast: Standardized 1px solid #eeece5 borders across all white card surfaces to prevent display blending.',
      'Vector SVG Favicon: Added a crisp SVG favicon matching the brand exchange arrows icon in the Navbar.',
      'Mobile Navigation & Chat Ergonomics: Implemented an accessible hamburger navigation drawer and narrow-screen chat view toggling with back navigation.',
      'Contextual In-Thread Swap Actions: Enabled one-click Accept, Reject, Cancel, and Complete actions directly within the negotiation chat header.',
      'Verification: 173/173 backend automated integration tests passing (100% test pass rate), 0 build errors, 0 build warnings, and zero new dependencies.',
    ],
  },
  {
    id: 'production-deployment',
    tag: 'Infrastructure',
    date: 'Production Readiness',
    title: 'Production Deployment & Cloud Services',
    summary:
      'Complete production deployment and environment configuration across modern cloud platforms.',
    bullets: [
      'Frontend Production: Deployed React + Vite single-page application to Vercel with automated build optimization.',
      'Backend Production: Deployed Node.js / Express REST API to Render with environment variable isolation.',
      'Cloud Database: Connected production runtime to high-availability MongoDB Atlas cluster.',
      'Cloud Image Storage: Integrated Cloudinary for multi-image uploads with automatic UI fallback placeholders.',
      'Security Remediation: Complete Git history sanitization ensuring no credentials or secrets exist in repository tracking.',
    ],
  },
  {
    id: 'profile-and-location',
    tag: 'Feature Addition',
    date: 'Post-Roadmap Polish',
    title: 'Personal Profile & Marketplace Location Filtering',
    summary:
      'Implemented dedicated profile management and enhanced geographic filtering directly on the marketplace.',
    bullets: [
      'Personal Profile Dashboard: Added user profile management with editable name, contact phone, city/state location, and bio.',
      'Activity Statistics: Real-time user metrics displaying total listings, available items, and completed trades.',
      'Marketplace Location Filtering: Added direct city and state filter inputs on the marketplace with case-insensitive search intersection.',
      'Test Suite Expansion: Added 17 automated integration tests specifically validating profile updates, protected fields, and location queries.',
    ],
  },
  {
    id: 'phase-8',
    tag: 'Phase 8',
    date: 'Milestone 8',
    title: 'Role-Based Admin Panel & Moderation',
    summary:
      'Comprehensive administrative governance tools for platform moderation and activity monitoring.',
    bullets: [
      'Admin Authorization: Enforced role-based access control (RBAC) middleware restricting /api/admin/* to verified administrator accounts.',
      'Platform Overview Dashboard: Real-time global metric counters for total users, admins, listings, swap requests, and messages.',
      'User Management: Searchable user list with role filtering, role promotion/demotion, and protection against admin self-demotion.',
      'Listing Moderation: Platform-wide listing overview with status/category filtering and cascading deletion that safely auto-rejects active swaps.',
      'Swap Activity Monitoring: Full visibility into incoming, pending, accepted, completed, and rejected trades across the entire marketplace.',
    ],
  },
  {
    id: 'phase-7',
    tag: 'Phase 7',
    date: 'Milestone 7',
    title: 'Location-Based Swap Matching Engine',
    summary:
      'Intelligent geographical and value-compatible item discovery engine on listing details.',
    bullets: [
      'Proximity Matching Algorithm: Hierarchical spatial evaluation matching candidate items in the exact same city+state or same state.',
      'Value Compatibility Filter: Cross-referenced with Phase 6 valuation to recommend only items with compatible trade values (Close Match or Moderate Difference).',
      'Exclusion Rules: Automatically filters out non-available listings and items owned by the requesting user.',
      'Visual Match Tags: Renders clear location tier and value compatibility badges on recommendation cards.',
    ],
  },
  {
    id: 'phase-6',
    tag: 'Phase 6',
    date: 'Milestone 6',
    title: 'Deterministic Swap Value Comparator',
    summary:
      'Objective, rule-based valuation and trade fairness calculation engine.',
    bullets: [
      'Deterministic Valuation Engine: Calculates an estimated reference dollar value based on category, brand tier, and garment condition.',
      'Comparison Endpoint: Computes absolute value difference, percentage gap, and trade fairness tier.',
      'Three Fairness Classifications: Close Match (≤20%), Moderate Difference (21–50%), and Large Difference (>50%).',
      'Transparent Comparison: Integrated into swap request proposals and item detail recommendation feeds.',
    ],
  },
  {
    id: 'phase-5',
    tag: 'Phase 5',
    date: 'Milestone 5',
    title: 'In-App Negotiation & Messaging',
    summary:
      'Private 1-on-1 messaging threads allowing trading partners to negotiate before swap acceptance.',
    bullets: [
      'Private Conversations: Dedicated 1-on-1 chat channels restricted to trading participants.',
      'Swap Request Linking: Threads directly associate with the relevant swap request proposal.',
      'Read Receipts & Unread Badges: Real-time tracking of unread message counts in the conversation list.',
      'Lightweight Synchronization: Client polling sync every 4 seconds providing resilient communication.',
    ],
  },
  {
    id: 'phase-4',
    tag: 'Phase 4',
    date: 'Milestone 4',
    title: 'Swap Request Lifecycle & State Machine',
    summary:
      'Rigorous finite-state machine governing trade proposals, locking, acceptance, and completion.',
    bullets: [
      'State Transitions: Strictly enforced lifecycle from pending to accepted, completed, rejected, or cancelled.',
      'Concurrency Protection: Automatically rejects conflicting pending proposals when an item is accepted into a trade.',
      'Item Status Locking: Prevents items from being offered into multiple overlapping active swaps.',
      'Inventory Archiving: Completed trades permanently update items to "swapped" and hide them from the public marketplace.',
    ],
  },
  {
    id: 'phase-3',
    tag: 'Phase 3',
    date: 'Milestone 3',
    title: 'Clothing Listings & Marketplace Catalog',
    summary:
      'Complete apparel listing inventory management with photo uploads and multi-parameter search.',
    bullets: [
      'Listing CRUD: Full creation, update, and deletion of clothing listings with categories, sizes, conditions, and descriptions.',
      'Multi-Image Uploads: Image upload processing with thumbnail previews and primary cover selection.',
      'Marketplace Filtering: Search by title/brand and filter by category, size, condition, and location.',
      'Responsive Grid: Fluid responsive card layout with status pills and hover micro-interactions.',
    ],
  },
  {
    id: 'phase-2',
    tag: 'Phase 2',
    date: 'Milestone 2',
    title: 'User Authentication & Session Management',
    summary:
      'Secure token-based authentication foundation for user identity and data protection.',
    bullets: [
      'Registration & Login: Secure authentication endpoints using bcrypt password hashing.',
      'JWT Authorization: Stateless authentication via JSON Web Tokens for API requests.',
      'Client AuthContext: React context provider managing login status, user tokens, and automatic session restoration.',
      'Protected Routes: Client-side route guards redirecting unauthorized visitors to login.',
    ],
  },
  {
    id: 'phase-1',
    tag: 'Phase 1',
    date: 'Milestone 1',
    title: 'Project Scaffolding & Architecture Setup',
    summary:
      'Foundational infrastructure, project directory structure, and database connectivity.',
    bullets: [
      'Monorepo Architecture: Decoupled Vite React frontend and Node.js Express backend.',
      'Database Schema Design: Mongoose models for User, Listing, SwapRequest, Conversation, and Message.',
      'Health Check & Environment: Configured environment isolation and system health monitoring endpoint.',
      'Design System: Established the earthy green (#2f6f4f) and warm neutral (#faf9f6) design foundations.',
    ],
  },
];

function RecentChangesPage() {
  return (
    <div className="page-container changelog-page">
      <div className="changelog-header">
        <span className="changelog-header-badge">Project History</span>
        <h1>Recent Changes & Milestones</h1>
        <p className="changelog-subtitle">
          A curated product changelog documenting the development phases, technical architecture, and final visual polish of the Clothing Exchange & Swap Marketplace.
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
        <h3>Explore the Platform</h3>
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

