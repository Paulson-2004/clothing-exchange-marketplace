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
          'Clothing Exchange is a circular fashion marketplace where members trade unworn apparel directly with one another. Instead of buying or selling with money, you exchange clothing item-for-item, giving good clothes a second life.',
      },
      {
        id: 'money-transactions',
        question: 'Are money transactions supported?',
        answer:
          'No. Clothing Exchange is strictly a non-monetary, direct item-for-item exchange. There are no fees, wallet balances, or payment processing. Every trade is a direct one-to-one exchange between two members.',
      },
      {
        id: 'how-swap-works',
        question: 'How does a clothing swap work?',
        answer:
          'Browse available items listed by other members. When you find a piece you like, propose a swap by selecting one of your own available listings to offer in return. The other person reviews your offer, can message you to discuss details, and chooses to accept or decline.',
      },
      {
        id: 'account-requirement',
        question: 'Do I need an account to swap items?',
        answer:
          'You can browse the public marketplace freely without an account. To list your own clothes, send swap proposals, or message other members, you will need to sign up for a free account.',
      },
    ],
  },
  {
    category: 'Listings',
    items: [
      {
        id: 'create-listing',
        question: 'How do I create a listing?',
        answer:
          'After logging in, click "+ Create Listing" in the navigation bar or from your dashboard. Upload clear photos of your garment, fill in the title, description, category, size, brand, and condition, and save your listing.',
      },
      {
        id: 'required-information',
        question: 'What information do I need to provide?',
        answer:
          'Every listing needs at least one photo, a descriptive title, category (such as tops, bottoms, outerwear, footwear, or dresses), size, brand, condition (New with tags, Like new, Good, or Fair), and a brief description highlighting fit or styling notes.',
      },
      {
        id: 'edit-delete-listing',
        question: 'Can I edit or delete my listing?',
        answer:
          'Yes. You can edit your listing details, photos, or descriptions anytime from your "My Listings" page, or delete the listing entirely—as long as the item is not currently locked in an active trade.',
      },
      {
        id: 'listing-in-swap',
        question: 'What happens to my listing when it is involved in a swap?',
        answer:
          'When you propose or accept a swap, both items are temporarily marked as pending so they cannot be offered to anyone else at the same time. Once the trade is marked completed, both items are archived as swapped. If a swap is cancelled or declined, the items become available again immediately.',
      },
    ],
  },
  {
    category: 'Swap Values',
    items: [
      {
        id: 'value-estimation',
        question: 'How is an item\'s estimated swap value determined?',
        answer:
          'When you list a garment, the platform estimates its reference value based on its category, brand, and condition. This estimated value is not a cash price; it serves as a helpful reference point so both members can easily judge whether an exchange is fair and balanced.',
      },
      {
        id: 'close-match',
        question: 'What does "Close Match" mean?',
        answer:
          'A "Close Match" means the two items being compared have estimated swap values within 20% of each other. This indicates a very balanced, even exchange.',
      },
      {
        id: 'moderate-large-diff',
        question: 'What do "Moderate Difference" and "Large Difference" mean?',
        answer:
          'A "Moderate Difference" means the estimated values differ by 21% to 50%, which is often still an agreeable trade if both parties are happy with the exchange. A "Large Difference" means the values differ by more than 50%, highlighting a significant value gap so both members are aware before agreeing.',
      },
      {
        id: 'cash-price-comparison',
        question: 'Is the estimated value the same as a cash price?',
        answer:
          'No. There is no money or cash payment used on Clothing Exchange. Estimated values are presented in Indian Rupees (₹) purely as an informational reference benchmark to help you and your trade partner evaluate the relative balance of an exchange.',
      },
      {
        id: 'unequal-value-swaps',
        question: 'Can I swap items with different estimated values or pay the difference?',
        answer:
          'Clothing Exchange is strictly an item-for-item barter marketplace — cash payments, cash top-ups, and buying the difference are not supported. Unequal-value swaps are completely valid as long as both users mutually agree to the trade. The estimated swap value is only an informational guide to help you compare items, not an enforced price or payment requirement.',
      },
    ],
  },
  {
    category: 'Swaps & Negotiation',
    items: [
      {
        id: 'send-swap-request',
        question: 'How do I send a swap request?',
        answer:
          'Open any available item in the marketplace, click "Request Swap", and pick which of your own available items you would like to offer in exchange. The owner will be notified of your proposal.',
      },
      {
        id: 'negotiate-chat',
        question: 'Can I talk to someone before accepting a swap?',
        answer:
          'Yes. Every swap request includes an "Open Negotiation" button that opens a private chat with the other member. You can ask about measurements, fabric feel, or meetup preferences before deciding.',
      },
      {
        id: 'cancel-reject-swap',
        question: 'Can I reject or cancel a request?',
        answer:
          'Yes. If you sent an offer, you can cancel it at any time before it is accepted. If you received an offer, you can decline it if the proposed item isn\'t a good match for you. In both cases, both items immediately return to available status.',
      },
      {
        id: 'accept-swap',
        question: 'What happens when a swap is accepted?',
        answer:
          'When the recipient accepts an offer, both items are locked in for that swap, and any other pending proposals referencing either item are automatically declined so you can focus on meeting up.',
      },
      {
        id: 'complete-swap',
        question: 'What happens when a swap is completed?',
        answer:
          'Once you and your trading partner have met and exchanged your clothes, either member can click "Mark Completed". Both items are then permanently marked as swapped and archived from the active marketplace.',
      },
      {
        id: 'deleted-item-swap',
        question: 'What happens if an item involved in an unfinished swap is removed?',
        answer:
          'If an item is removed while a swap is still in progress, the affected request is cancelled so the other person\'s item can safely become available again for new trades.',
      },
    ],
  },
  {
    category: 'Nearby Matches',
    items: [
      {
        id: 'nearby-matches',
        question: 'How are nearby swap matches found?',
        answer:
          'When you view an item, the platform automatically looks for compatible items from people in your area. We match based on city and state location while checking estimated values so you can discover great trades close to home.',
      },
      {
        id: 'state-matches',
        question: 'Why might I see items from elsewhere in my state?',
        answer:
          'We first look for compatible items from people in your exact city. If suitable options aren\'t available locally, we also show compatible items from elsewhere in your state to give you more trade possibilities.',
      },
      {
        id: 'filter-city-state',
        question: 'Can I filter listings by city or state?',
        answer:
          'Yes. When browsing the marketplace, you can use the location filters to search specifically for items in your city or state, alongside filters for category, size, and condition.',
      },
    ],
  },
  {
    category: 'Chat & Account Safety',
    items: [
      {
        id: 'chat-messaging',
        question: 'How does chat work?',
        answer:
          'Chat gives you a direct conversation channel with your trading partner. You can access all your active threads from the Chat page, see read receipts, and even confirm or complete your swap right from the chat header.',
      },
      {
        id: 'chat-privacy',
        question: 'Who can see my swap conversation?',
        answer:
          'Your messages are private between you and the person you are negotiating with.',
      },
      {
        id: 'account-protection',
        question: 'How is my account protected?',
        answer:
          'Your account is protected by your secure password and private login session. Private credentials are never shared with other users, and you can update your contact information or location anytime from your Profile page.',
      },
      {
        id: 'public-profile-info',
        question: 'What information can other users see?',
        answer:
          'Other members can only see your public profile information—such as your name, general location (city/state), bio, and the items you currently have listed for swap.',
      },
      {
        id: 'admin-role',
        question: 'What can administrators do?',
        answer:
          'Platform administrators help maintain a safe, respectful community by monitoring marketplace activity, removing inappropriate listings, and assisting with member account management.',
      },
    ],
  },
];

function FaqPage() {
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
        <span className="faq-header-badge">Help & Support</span>
        <h1>Frequently Asked Questions</h1>
        <p className="faq-subtitle">
          Everything you need to know about swapping clothes, finding nearby matches, and using the marketplace.
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
