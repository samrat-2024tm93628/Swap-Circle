# Database Schema

SwapCircle uses MongoDB with four separate databases — one per microservice.

---

## swapcircle_auth — Auth Service

### Collection: `users`

| Field | Type | Description |
|-------|------|-------------|
| `_id` | ObjectId | Auto-generated primary key |
| `name` | String | Full name, required |
| `email` | String | Unique, lowercase, required |
| `password` | String | Bcrypt hash, required |
| `role` | String | `user` or `admin`, default `user` |
| `timeCredits` | Number | Starts at 5 for new users |
| `createdAt` | Date | Auto |
| `updatedAt` | Date | Auto |

**Indexes:** `email` (unique)

---

### Collection: `credittransactions`

| Field | Type | Description |
|-------|------|-------------|
| `_id` | ObjectId | Auto-generated |
| `userId` | String | Owner of this transaction |
| `type` | String | `buy`, `redeem`, `sent`, `received` |
| `amount` | Number | Credits involved |
| `description` | String | Human-readable label |
| `counterpartId` | String | Other party's userId (nullable) |
| `counterpartName` | String | Other party's name for display (nullable) |
| `createdAt` | Date | Auto |
| `updatedAt` | Date | Auto |

**Indexes:** `userId`

---

## swapcircle_users — User Service

### Collection: `profiles`

| Field | Type | Description |
|-------|------|-------------|
| `_id` | ObjectId | Auto-generated |
| `userId` | String | References `users._id` in auth DB |
| `bio` | String | Short description, default empty |
| `skills` | [String] | List of skill tags |
| `location` | String | City or region |
| `rating` | Number | Rolling weighted average, default 0 |
| `ratingCount` | Number | Total ratings received, default 0 |
| `ratingBreakdown` | Object | Per-star count: `{ 1: N, 2: N, 3: N, 4: N, 5: N }`, default all 0 |
| `completedSwaps` | Number | Count of completed swaps, default 0 |
| `createdAt` | Date | Auto |
| `updatedAt` | Date | Auto |

**Indexes:** `userId` (unique)

> `ratingBreakdown` is incremented atomically with `$inc` on the matching star key each time a rating is submitted. Used to render the per-star percentage bar chart on the profile page.

---

## swapcircle_listings — Listing Service

### Collection: `listings`

| Field | Type | Description |
|-------|------|-------------|
| `_id` | ObjectId | Auto-generated |
| `userId` | String | Owner's user ID |
| `userName` | String | Denormalized for display |
| `type` | String | `offer` or `request` |
| `title` | String | Short headline, required |
| `description` | String | Full details, required |
| `category` | String | Enum (see below) |
| `estimatedHours` | Number | Min 0.5 |
| `tags` | [String] | Optional keywords |
| `status` | String | `active`, `in-swap`, `completed`, `cancelled` |
| `createdAt` | Date | Auto |
| `updatedAt` | Date | Auto |

**Category values:** `Technology`, `Education`, `Home Services`, `Transportation`, `Arts & Creative`, `Food & Cooking`, `Health & Wellness`, `Other`

**Status flow:** `active → in-swap` (on swap accept) `→ completed` (on swap complete) or `→ cancelled`

**Indexes:** `userId`, `status`, `category`, `type`

---

## swapcircle_swaps — Swap Service

### Collection: `swaps`

| Field | Type | Description |
|-------|------|-------------|
| `_id` | ObjectId | Auto-generated |
| `proposerId` | String | User who initiated the swap |
| `proposerName` | String | Denormalized for display |
| `receiverId` | String | User who received the proposal |
| `receiverName` | String | Denormalized for display |
| `offeredListingId` | String | Listing the proposer is offering |
| `offeredListingTitle` | String | Denormalized |
| `requestedListingId` | String | Listing the proposer wants |
| `requestedListingTitle` | String | Denormalized |
| `message` | String | Optional note from proposer |
| `status` | String | See status flow below |
| `proposerRating` | Number | Rating given by proposer after completion (1–5 or null) |
| `receiverRating` | Number | Rating given by receiver after completion (1–5 or null) |
| `completedAt` | Date | Set when marked complete |
| `createdAt` | Date | Auto |
| `updatedAt` | Date | Auto |

**Status flow:** `pending → accepted → completed` or `pending/accepted → rejected/cancelled`

**Indexes:** `proposerId`, `receiverId`, `offeredListingId`, `requestedListingId`

---

### Collection: `creditoffers`

| Field | Type | Description |
|-------|------|-------------|
| `_id` | ObjectId | Auto-generated |
| `listingId` | String | The listing this offer is for |
| `listingTitle` | String | Denormalized for display |
| `buyerId` | String | User making the credit offer |
| `buyerName` | String | Denormalized for display |
| `sellerId` | String | Listing owner (service provider) |
| `sellerName` | String | Denormalized for display |
| `proposedAmount` | Number | Credits offered by the buyer |
| `counterAmount` | Number | Credits counter-proposed by seller (nullable) |
| `finalAmount` | Number | Actual credits transferred on deal lock (nullable) |
| `message` | String | Optional note from buyer |
| `status` | String | `pending`, `countered`, `accepted`, `rejected` |
| `createdAt` | Date | Auto |
| `updatedAt` | Date | Auto |

**Status flow:** `pending → accepted` (seller accepts) or `pending → countered → accepted` (buyer locks deal) or `→ rejected` at any point

> Credits are only deducted from buyer and credited to seller when status reaches `accepted` via the `/accept` or `/lock` endpoints. No funds are held during negotiation.

**Indexes:** `buyerId`, `sellerId`, `listingId`

---

## Relationships Diagram

```text
[Auth DB: users]
      |
      | userId (string reference)
      |
      ├──► [Auth DB: credittransactions]  — one-to-many (wallet history)
      |
      ├──► [User DB: profiles]            — one-to-one (public profile + ratings)
      |
      ├──► [Listing DB: listings]         — one-to-many (a user has many listings)
      |
      ├──► [Swap DB: swaps]               — one-to-many (as proposer or receiver)
      |
      └──► [Swap DB: creditoffers]        — one-to-many (as buyer or seller)

[Listing DB: listings]
      |
      ├──► [Swap DB: swaps]               — one swap references two listings
      |
      └──► [Swap DB: creditoffers]        — one offer references one listing
```

> Note: Cross-service references are stored as plain strings (not ObjectId foreign keys)
> since each service has its own database. Data integrity is enforced at the application layer.
