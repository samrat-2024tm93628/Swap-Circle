# Database Schema

SwapCircle uses MongoDB with four separate databases  one per microservice.

---

## swapcircle_auth  Auth Service

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

## swapcircle_users  User Service

### Collection: `profiles`

| Field | Type | Description |
|-------|------|-------------|
| `_id` | ObjectId | Auto-generated |
| `userId` | String | References `users._id` in auth DB |
| `bio` | String | Short description, default empty |
| `skills` | [String] | List of skill tags |
| `location` | String | City or region |
| `rating` | Number | Rolling average, default 0 |
| `ratingCount` | Number | Total ratings received, default 0 |
| `completedSwaps` | Number | Count of completed swaps, default 0 |
| `createdAt` | Date | Auto |
| `updatedAt` | Date | Auto |

**Indexes:** `userId` (unique)

---

## swapcircle_listings  Listing Service

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

**Indexes:** `userId`, `status`, `category`, `type`

---

## swapcircle_swaps  Swap Service

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
| `proposerRating` | Number | Rating given by proposer (1–5 or null) |
| `receiverRating` | Number | Rating given by receiver (1–5 or null) |
| `completedAt` | Date | Set when marked complete |
| `createdAt` | Date | Auto |
| `updatedAt` | Date | Auto |

**Status values:** `pending`, `accepted`, `in-progress`, `completed`, `rejected`, `cancelled`

**Indexes:** `proposerId`, `receiverId`, `offeredListingId`, `requestedListingId`

---

## Relationships Diagram

```
[Auth DB: users]
      |
      | userId (string reference)
      |
      ├──► [User DB: profiles]       — one-to-one
      |
      ├──► [Listing DB: listings]    — one-to-many (a user has many listings)
      |
      └──► [Swap DB: swaps]          — one-to-many (as proposer or receiver)

[Listing DB: listings]
      |
      └──► [Swap DB: swaps]          — one swap references two listings
```

> Note: Cross-service references are stored as plain strings (not ObjectId foreign keys)
> since each service has its own database. Data integrity is enforced at the application layer.
