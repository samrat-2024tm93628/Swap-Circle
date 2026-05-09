# SwapCircle API Documentation

Base URL: `http://localhost:3000/api`

All protected routes require the `Authorization: Bearer <token>` header.

---

## Auth Service `/api/auth`

### POST `/api/auth/register`
Register a new user account.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "secret123"
}
```

**Response `201`:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "664f1a2b...",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user",
    "timeCredits": 5
  }
}
```

**Error `409`:** Email already in use  
**Error `400`:** Missing required fields

---

### POST `/api/auth/login`
Login with existing credentials.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "secret123"
}
```

**Response `200`:** Same structure as register response.

**Error `401`:** Invalid credentials

---

### GET `/api/auth/me` *(protected)*
Get current authenticated user.

**Response `200`:**
```json
{
  "_id": "664f1a2b...",
  "name": "John Doe",
  "email": "john@example.com",
  "role": "user",
  "timeCredits": 42,
  "createdAt": "2024-05-01T10:00:00.000Z"
}
```

---

## Credits Wallet `/api/auth/credits`

### GET `/api/auth/credits/stats/:userId`
Get aggregated credit statistics for any user. Public endpoint.

**Response `200`:**
```json
{
  "currentBalance": 42,
  "totalBought": 1000,
  "totalRedeemed": 50,
  "totalReceived": 150,
  "totalSpent": 200,
  "totalEarned": 1150,
  "transactionCount": 18
}
```

---

### GET `/api/auth/credits/transactions` *(protected)*
Get the last 50 credit transactions for the logged-in user, newest first.

**Response `200`:**
```json
[
  {
    "_id": "...",
    "userId": "664f1a2b...",
    "type": "buy",
    "amount": 500,
    "description": "Purchased 500 credits for ₹500",
    "counterpartId": null,
    "counterpartName": null,
    "createdAt": "2024-05-01T10:00:00.000Z"
  }
]
```

**Transaction types:** `buy`, `redeem`, `sent`, `received`

---

### POST `/api/auth/credits/buy` *(protected)*
Purchase credits (simulated — no real payment gateway).

**Request Body:**
```json
{ "amount": 500 }
```

**Rules:** `amount` min 1, max 10000.

**Response `200`:**
```json
{
  "user": { "id": "...", "timeCredits": 542, ... },
  "message": "500 credits added to your wallet"
}
```

---

### POST `/api/auth/credits/redeem` *(protected)*
Request cash redemption of credits (simulated, logged only).

**Request Body:**
```json
{ "amount": 100 }
```

**Rules:** `amount` min 10. User must have sufficient balance.

**Response `200`:**
```json
{
  "user": { "id": "...", "timeCredits": 442, ... },
  "message": "₹100 redemption request submitted"
}
```

**Error `400`:** Insufficient credits

---

### POST `/api/auth/credits/pay` *(protected)*
Direct immediate credit payment from logged-in user to another user. Credits transfer instantly.

**Request Body:**
```json
{
  "toUserId": "664abc...",
  "toUserName": "Jane Smith",
  "amount": 50,
  "listingTitle": "Guitar lessons"
}
```

**Error `400`:** Insufficient credits or invalid details  
**Error `400`:** Cannot pay yourself

---

### POST `/api/auth/credits/internal-transfer` *(service token only)*
Internal service-to-service credit transfer. Called by swap service when a credit offer is accepted or locked. Not accessible by clients.

**Request Body:**
```json
{
  "fromUserId": "664abc...",
  "toUserId": "664def...",
  "amount": 150,
  "listingTitle": "Bike repair"
}
```

**Error `400`:** Buyer has insufficient credits

---

## User Service `/api/users`

### GET `/api/users/:userId`
Get a user's public profile. Auto-creates a blank profile if none exists yet.

**Response `200`:**
```json
{
  "_id": "...",
  "userId": "664f1a2b...",
  "bio": "I fix things and love cooking.",
  "skills": ["bike repair", "cooking", "photography"],
  "location": "Mumbai, India",
  "rating": 4.5,
  "ratingCount": 6,
  "ratingBreakdown": { "1": 0, "2": 0, "3": 1, "4": 2, "5": 3 },
  "completedSwaps": 6
}
```

---

### PUT `/api/users/:userId` *(protected, own profile only)*
Update bio, skills, and location.

**Request Body:**
```json
{
  "bio": "Freelance developer and cyclist.",
  "skills": ["React", "Node.js", "cycling"],
  "location": "Bangalore, India"
}
```

**Response `200`:** Updated profile object.  
**Error `403`:** Cannot edit another user's profile.

---

### PATCH `/api/users/:userId/rating` *(service token only)*
Update a user's rolling average rating. Called internally by swap service after a rating is submitted. Increments `ratingBreakdown[star]` and recalculates weighted average.

**Request Body:**
```json
{ "rating": 4 }
```

**Response `200`:** Updated profile with new averaged rating and incremented `completedSwaps`.

---

## Listing Service `/api/listings`

### GET `/api/listings`
Fetch active listings with optional filters. Defaults to `status=active`.

**Query Params:**
| Param | Type | Description |
|-------|------|-------------|
| `type` | `offer` \| `request` | Filter by listing type |
| `category` | string | Filter by category |
| `search` | string | Search by title (case-insensitive regex) |
| `status` | string | Override status filter |

**Response `200`:** Array of listing objects.

---

### GET `/api/listings/:id`
Get a single listing by ID.

**Response `200`:** Single listing object.  
**Error `404`:** Listing not found.

---

### GET `/api/listings/user/:userId` *(protected)*
Get all listings created by a specific user (all statuses).

**Response `200`:** Array of listing objects.

---

### POST `/api/listings` *(protected)*
Create a new listing.

**Request Body:**
```json
{
  "type": "offer",
  "title": "I'll fix your bike",
  "description": "I have 5+ years experience with all bike types.",
  "category": "Home Services",
  "estimatedHours": 2,
  "tags": ["bike", "repair"]
}
```

**Categories:** `Technology`, `Education`, `Home Services`, `Transportation`, `Arts & Creative`, `Food & Cooking`, `Health & Wellness`, `Other`

**Response `201`:** Created listing object.

---

### PUT `/api/listings/:id` *(protected)*
Update a listing. Only the owner or admin role can update. Also used internally by swap service (with admin token) to change `status`.

**Response `200`:** Updated listing object.  
**Error `403`:** Not the owner.

---

### DELETE `/api/listings/:id` *(protected)*
Delete a listing. Only the owner or admin.

**Response `200`:** `{ "message": "Deleted" }`

---

## Swap Service `/api/swaps`

### POST `/api/swaps` *(protected)*
Propose a new swap between two listings.

**Request Body:**
```json
{
  "offeredListingId": "664abc...",
  "requestedListingId": "664def...",
  "receiverId": "664user2...",
  "receiverName": "Jane Smith",
  "message": "Hey! I think this is a fair trade."
}
```

**Rules:**
- `offeredListingId` must belong to the proposer.
- `requestedListingId` must belong to the receiver.
- No duplicate active swaps allowed (`pending`, `accepted`, `in-progress`) for the same listing pair.

**Response `201`:** Created swap object.  
**Error `403`:** Offered listing is not yours.  
**Error `409`:** Active swap already exists.

---

### GET `/api/swaps/mine` *(protected)*
Get all swaps where the current user is proposer or receiver, sorted newest first.

**Response `200`:** Array of swap objects.

---

### GET `/api/swaps/ratings/:userId`
Get all individual ratings received by a user from completed swaps. Public endpoint used for the profile feedback list.

**Response `200`:**
```json
[
  {
    "rating": 5,
    "raterName": "Jane Smith",
    "service": "I'll teach you guitar",
    "date": "2024-05-10T08:00:00.000Z"
  }
]
```

---

### GET `/api/swaps/:id` *(protected)*
Get details of a specific swap. Only accessible to the two parties involved.

**Response `200`:** Full swap object.  
**Error `403`:** Not a participant.

---

### PATCH `/api/swaps/:id/accept` *(protected, receiver only)*
Accept an incoming swap proposal. Both listings move to `in-swap` status via service token call to listing service.

**Response `200`:** Updated swap with `status: "accepted"`.  
**Error `400`:** Swap is not in `pending` state.

---

### PATCH `/api/swaps/:id/reject` *(protected, receiver only)*
Reject an incoming swap proposal.

**Response `200`:** Updated swap with `status: "rejected"`.

---

### PATCH `/api/swaps/:id/cancel` *(protected, proposer only)*
Cancel a swap you proposed. If it was `accepted`, both listings revert to `active`.

**Response `200`:** Updated swap with `status: "cancelled"`.

---

### PATCH `/api/swaps/:id/complete` *(protected)*
Mark a swap as completed. Either party can trigger. Both listings move to `completed` status.

**Response `200`:** Updated swap with `status: "completed"`.  
**Error `400`:** Swap must be in `accepted` state first.

---

### PATCH `/api/swaps/:id/rate` *(protected)*
Submit a star rating (1–5) after a swap is completed. Each party rates the other once. Internally calls user service to update the rated user's rolling average and `ratingBreakdown`.

**Request Body:**
```json
{ "rating": 5 }
```

**Response `200`:** Updated swap with rating recorded.  
**Error `400`:** Already rated, or swap not completed.

---

## Swap Status Flow

```text
pending → accepted → completed
pending → rejected
pending → cancelled
accepted → cancelled  (listings revert to active)
accepted → completed  (listings move to completed)
```

---

## Credit Offers `/api/credit-offers`

The credit offer system allows buyers to negotiate a price before credits are transferred. No credits are held or deducted during negotiation — transfer happens only on final acceptance.

### POST `/api/credit-offers` *(protected)*
Buyer proposes a credit amount for a listing.

**Request Body:**
```json
{
  "listingId": "664abc...",
  "listingTitle": "Guitar lessons",
  "sellerId": "664seller...",
  "sellerName": "Jane Smith",
  "proposedAmount": 150,
  "message": "Is 150 credits fair for 1.5 hours?"
}
```

**Error `400`:** Cannot offer on your own listing.  
**Error `409`:** Already have an active offer on this listing.

**Response `201`:** Created credit offer object with `status: "pending"`.

---

### GET `/api/credit-offers/mine` *(protected)*
Get all credit offers where the current user is buyer or seller, sorted newest first.

**Response `200`:**
```json
[
  {
    "_id": "...",
    "listingTitle": "Guitar lessons",
    "buyerId": "...",
    "buyerName": "John Doe",
    "sellerId": "...",
    "sellerName": "Jane Smith",
    "proposedAmount": 150,
    "counterAmount": null,
    "finalAmount": null,
    "message": "Is 150 credits fair?",
    "status": "pending",
    "createdAt": "..."
  }
]
```

---

### PATCH `/api/credit-offers/:id/accept` *(protected, seller only)*
Seller accepts the offer. Credits transfer immediately from buyer to seller via internal auth service call.

**Response `200`:** Updated offer with `status: "accepted"` and `finalAmount` set.  
**Error `400`:** Offer is not active.  
**Error `400`:** Buyer has insufficient credits.

---

### PATCH `/api/credit-offers/:id/counter` *(protected, seller only)*
Seller proposes a different amount. Offer moves to `countered` state.

**Request Body:**
```json
{ "counterAmount": 120 }
```

**Response `200`:** Updated offer with `status: "countered"` and `counterAmount` set.  
**Error `400`:** Can only counter a pending offer.

---

### PATCH `/api/credit-offers/:id/lock` *(protected, buyer only)*
Buyer accepts the seller's counter offer. Credits transfer immediately.

**Response `200`:** Updated offer with `status: "accepted"` and `finalAmount` set to `counterAmount`.  
**Error `400`:** No counter offer to accept.  
**Error `400`:** Buyer has insufficient credits.

---

### PATCH `/api/credit-offers/:id/reject` *(protected)*
Either the buyer or seller rejects/withdraws the offer. No credits affected.

**Response `200`:** Updated offer with `status: "rejected"`.

---

## Credit Offer Status Flow

```text
pending → accepted          (seller accepts directly)
pending → countered         (seller counters)
countered → accepted        (buyer locks deal)
pending/countered → rejected (either party)
```
