# Database Schema

ReWear uses MongoDB with Mongoose for object modeling. The primary collections are `users`, `listings`, `swaprequests`, `conversations`, and `messages`.

## Users

Stores account information and authentication credentials.

- `name` (String, required)
- `email` (String, required, unique)
- `passwordHash` (String, hashed)
- `role` (String, enum: `['user', 'admin']`, default: `'user'`)
- `phone` (String)
- `bio` (String)
- `location` (Object with `city`, `state`, `country`)
- `createdAt`, `updatedAt` (Date)

## Listings

Stores clothing items uploaded by users.

- `title` (String, required)
- `description` (String, required)
- `category` (String, enum: `['tops', 'bottoms', 'dresses', 'outerwear', 'formalwear', 'footwear', 'accessories', 'activewear', 'other']`, required)
- `brand` (String, required)
- `size` (String, enum: `['XS', 'S', 'M', 'L', 'XL', 'XXL', 'One Size']`, required)
- `condition` (String, enum: `['new', 'like-new', 'good', 'fair']`, required)
- `estimatedValue` (Number, required)
- `images` (Array of Strings, Cloudinary URLs)
- `location` (Object with `city`, `state`, `country`)
- `status` (String, enum: `['available', 'pending', 'swapped']`, default: `'available'`)
- `owner` (ObjectId, ref: `User`)
- `createdAt`, `updatedAt` (Date)

## SwapRequests

Tracks proposals to trade items between two users.

- `requester` (ObjectId, ref: `User`)
- `requestedListing` (ObjectId, ref: `Listing`)
- `offeredListing` (ObjectId, ref: `Listing`)
- `status` (String, enum: `['pending', 'accepted', 'rejected', 'completed', 'cancelled']`, default: `'pending'`)
- `createdAt`, `updatedAt` (Date)

## Conversations & Messages

Handles the chat threads associated with users or specific swaps.

**Conversation:**
- `participants` (Array of ObjectIds, ref: `User`, exactly 2)
- `relatedSwapRequest` (ObjectId, ref: `SwapRequest`, optional)
- `lastMessageAt` (Date)
- `createdAt`, `updatedAt` (Date)

**Message:**
- `conversation` (ObjectId, ref: `Conversation`)
- `sender` (ObjectId, ref: `User`)
- `text` (String)
- `readBy` (Array of ObjectIds, ref: `User`)
- `createdAt`, `updatedAt` (Date)

