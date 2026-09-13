# Features

ReWear is designed specifically for peer-to-peer clothing exchange. It focuses on item trading rather than monetary sales.

## Core Workflows

### 1. Listing Items
Users can upload photos of clothing they no longer wear. Each listing includes:
- Category, Brand, Size, and Condition.
- Location (City, State).
- An **Estimated Value**: ReWear requires an estimated value to help ensure fair trades, though no money changes hands.

### 2. Discovering Items
Users can browse the marketplace grid on the homepage or use filters to find specific items.
- Filtering by Category, Size, Condition.
- Location search to find items geographically nearby.
- A hero section showcases featured editorial picks.

### 3. Proposing a Swap
When a user finds an item they like, they can initiate a "Swap Request".
- Instead of paying, the requester selects one or more of their own active listings to offer in exchange.
- The system automatically compares the estimated values of the offered items vs. the requested item.
- If the value disparity is too high, the system presents a **Fair Value Warning** before the request can be sent.

### 4. Negotiation and Chat
Once a swap request is initiated, a dedicated chat thread is created.
- The item owner and the requester can discuss the trade.
- Users can negotiate, ask for more photos, or discuss shipping/meetup logistics.
- The swap request status (Pending, Accepted, Rejected, Completed) is integrated directly into the chat header.

### 5. Managing Swaps
Users have a dedicated Dashboard and Swap Requests page to track inbound and outbound offers.
- Once a swap is mutually accepted, the involved listings are marked as unavailable.
- Users can finalize the swap once the items have been exchanged.

## Administrative Tools

ReWear includes a robust `/admin` panel accessible only to users with the `admin` role.
- **Manage Users**: View, demote, or delete users.
- **Manage Listings**: Monitor all platform inventory and remove inappropriate listings.
- **Review Swaps**: Oversee active and completed swap transactions for moderation purposes.

## UI/UX

- **Modern Design**: The interface is designed with a premium, editorial aesthetic.
- **Dark Mode**: Fully supported light and dark themes.
- **Responsive**: Mobile-first layouts ensure the marketplace works seamlessly on phones, tablets, and desktops.
