import { useState } from 'react';
import { Link } from 'react-router-dom';
import Icon from '../components/common/Icon';

const FAQ_SECTIONS = [
  {
    category: 'Platform Basics',
    items: [
      {
        id: 'what-is-clothing-exchange',
        question: 'What is Clothing Exchange?',
        answer:
          'Clothing Exchange is a web-based circular fashion marketplace designed for direct item-for-item apparel trades. Members list garments they no longer wear, browse items listed by others, and propose trades locally without any monetary transactions.',
      },
      {
        id: 'money-transactions',
        question: 'Are money transactions supported?',
        answer:
          'No. The platform strictly enforces direct item-for-item non-monetary exchanges. There is no payment gateway, fee collection, or wallet system. All exchanges are negotiated and agreed upon as 1-to-1 trades.',
      },
      {
        id: 'how-swap-works',
        question: 'How does a clothing swap work?',
        answer:
          'A member browses the marketplace, finds an available listing they want, and clicks "Request Swap". They select one of their own available listings to offer in return. The owner of the requested item receives an incoming request with estimated values compared side-by-side, and can either chat, accept, or reject the trade.',
      },
      {
        id: 'authentication-security',
        question: 'How is authentication handled?',
        answer:
          'User authentication uses secure bcrypt password hashing and HTTP-only JSON Web Tokens (JWT). Passwords and sensitive data are never returned in public profile responses, and protected routes enforce role authorization on both client and server.',
      },
    ],
  },
  {
    category: 'Listings & Valuation',
    items: [
      {
        id: 'create-listing',
        question: 'How do I create a listing?',
        answer:
          'Once logged in, click "+ Create Listing" in the navigation bar or dashboard. Fill in the item title, description, category, size, condition, and brand, and upload photos. An estimated reference swap value is automatically suggested to help guide fair trades.',
      },
      {
        id: 'edit-delete-listing',
        question: 'Can I edit or delete my listing?',
        answer:
          'Yes. Through the "My Listings" page, owners can update listing details or delete items at any time, provided the item is not currently locked in an active swap request.',
      },
      {
        id: 'value-estimation',
        question: 'How does swap value estimation work?',
        answer:
          'The platform uses a deterministic, rule-based valuation engine that computes an estimated reference value based on category, brand tier, and garment condition (new, like-new, good, fair). This value is not a retail cash price; it serves as an objective reference point to ensure fair, balanced exchanges.',
      },
      {
        id: 'value-classifications',
        question: 'What do "Close Match", "Moderate Difference", and "Large Difference" mean?',
        answer:
          'When two items are compared via the Phase 6 Value Comparator, the percentage difference is classified into three fairness tiers: "Close Match" (within 20% difference, indicating an even trade), "Moderate Difference" (21% to 50% difference, an acceptable gap subject to agreement), and "Large Difference" (greater than 50% difference, highlighting trade asymmetry).',
      },
    ],
  },
  {
    category: 'Swaps, Negotiation & Matching',
    items: [
      {
        id: 'nearby-matches',
        question: 'How are nearby swap matches determined?',
        answer:
          'On every Item Details page, the Phase 7 Location-Based Matching engine automatically analyzes geographic proximity and value compatibility. Candidates are classified as "Exact City Match" (same city and state) or "State Match" (same state, different city), filtered to items with compatible values, while excluding the user\'s own items and non-available listings.',
      },
      {
        id: 'negotiate-chat',
        question: 'Can I negotiate before accepting a swap?',
        answer:
          'Yes. Every swap request card has an "Open Negotiation" button that opens a linked private chat thread. Users can discuss item condition, measurements, and meetup details in real time before formalizing the trade.',
      },
      {
        id: 'accept-complete-swap',
        question: 'What happens when a swap is accepted or completed?',
        answer:
          'When the recipient accepts a swap request, both items are marked "pending" and any other competing swap requests referencing either item are automatically rejected. Once the users meet and exchange items, either party can mark the swap as "Completed", which updates both items to "swapped" and archives them from the active public marketplace.',
      },
      {
        id: 'cancel-reject-swap',
        question: 'Can I cancel or reject a swap request?',
        answer:
          'Yes. The requester can cancel a pending swap proposal at any time, and the recipient can reject an incoming offer. In both cases, both items immediately return to "available" status.',
      },
      {
        id: 'deleted-listing-swap',
        question: 'What happens if a listing involved in a pending swap is deleted?',
        answer:
          'If a user or administrator deletes a listing that is part of an active swap request, the platform\'s backend automatically cascades the deletion by auto-rejecting all active swap requests referencing that item and releasing the partner\'s item back to "available" status.',
      },
      {
        id: 'chat-messaging',
        question: 'How does in-app chat work?',
        answer:
          'Chat provides direct 1-on-1 messaging between trading partners. Threads sync via a reliable 4-second REST polling interval with read receipts, unread indicators, mobile view toggling, and an in-header swap action bar for one-click trade confirmation.',
      },
    ],
  },
  {
    category: 'Administration & Architecture',
    items: [
      {
        id: 'admin-management',
        question: 'What can administrators manage?',
        answer:
          'Authorized administrators have access to a dedicated Admin Panel (/admin). They can monitor platform-wide analytics, view and search all registered users, toggle user/admin roles (with protection against self-demotion), delete violating listings, and review all swap transactions across the platform.',
      },
      {
        id: 'deployment-architecture',
        question: 'How is the platform deployed?',
        answer:
          'The application uses a modern decoupled cloud architecture: the React/Vite single-page application is deployed on Vercel, the Node.js/Express REST API is deployed on Render, and data is persisted in a high-availability MongoDB Atlas cloud cluster with Cloudinary for image storage.',
      },
    ],
  },
];

function FaqPage() {
  // Store open items as a Set of string IDs
  const [openIds, setOpenIds] = useState(
    new Set(['what-is-clothing-exchange', 'money-transactions', 'how-swap-works'])
  );

  const toggleItem = (id) => {
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleExpandAll = () => {
    const allIds = new Set();
    FAQ_SECTIONS.forEach((sec) => sec.items.forEach((item) => allIds.add(item.id)));
    setOpenIds(allIds);
  };

  const handleCollapseAll = () => {
    setOpenIds(new Set());
  };

  return (
    <div className="page-container faq-page">
      <div className="faq-header">
        <span className="faq-header-badge">Knowledge Base</span>
        <h1>Frequently Asked Questions</h1>
        <p className="faq-subtitle">
          Everything you need to know about trading clothes, value estimation, and platform features.
        </p>
        <div className="faq-actions-row">
          <button type="button" className="btn btn-secondary btn-sm" onClick={handleExpandAll}>
            Expand All
          </button>
          <button type="button" className="btn btn-secondary btn-sm" onClick={handleCollapseAll}>
            Collapse All
          </button>
        </div>
      </div>

      <div className="faq-sections-container">
        {FAQ_SECTIONS.map((section) => (
          <div key={section.category} className="faq-section-group">
            <h2 className="faq-category-title">{section.category}</h2>
            <div className="faq-accordion">
              {section.items.map((item) => {
                const isOpen = openIds.has(item.id);
                return (
                  <div key={item.id} className={`faq-card ${isOpen ? 'is-open' : ''}`}>
                    <button
                      type="button"
                      className="faq-question-btn"
                      aria-expanded={isOpen}
                      aria-controls={`faq-answer-${item.id}`}
                      id={`faq-question-${item.id}`}
                      onClick={() => toggleItem(item.id)}
                    >
                      <span className="faq-question-text">{item.question}</span>
                      <span className={`faq-chevron-icon ${isOpen ? 'rotated' : ''}`}>
                        <Icon name="chevron-down" size={18} />
                      </span>
                    </button>

                    <div
                      id={`faq-answer-${item.id}`}
                      role="region"
                      aria-labelledby={`faq-question-${item.id}`}
                      className={`faq-answer ${isOpen ? 'open' : ''}`}
                    >
                      <div className="faq-answer-content">
                        <p>{item.answer}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="faq-footer-cta">
        <h3>Ready to trade unworn clothes?</h3>
        <p>Explore the active marketplace or list an item in under two minutes.</p>
        <div className="faq-cta-buttons">
          <Link to="/" className="btn btn-primary">
            Browse Marketplace
          </Link>
          <Link to="/listings/new" className="btn btn-secondary">
            + List an Item
          </Link>
        </div>
      </div>
    </div>
  );
}

export default FaqPage;

