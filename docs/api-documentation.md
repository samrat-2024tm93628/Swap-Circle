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
  "timeCredits": 5,
  "createdAt": "2024-05-01T10:00:00.000Z"
}
```

---

### PATCH `/api/auth/credits` *(protected)*
Adjust time credits for current user.

**Request Body:**
```json
{ "amount": 2 }
```

**Response `200`:** Updated user object.

---

## User Service `/api/users`

### GET `/api/users/:userId`
Get a user's profile. Auto-creates a blank profile if none exists.

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

### PATCH `/api/users/:userId/rating`
Update a user's rating (called internally by swap service after completion).

**Request Body:**
```json
{ "rating": 4 }
```

**Response `200`:** Updated profile with new averaged rating.

---

## Listing Service `/api/listings`

### GET `/api/listings`
Fetch active listings with optional filters.

**Query Params:**
| Param | Type | Description |
|-------|------|-------------|
| `type` | `offer` \| `request` | Filter by listing type |
| `category` | string | Filter by category |
| `search` | string | Search by title (case-insensitive) |
| `status` | string | Defaults to `active` |

**Response `200`:**
```json
[
  {
    "_id": "...",
    "userId": "664f1a2b...",
    "userName": "John Doe",
    "type": "offer",
    "title": "I'll fix your bike",
    "description": "I have 5+ years of experience with all types of bikes.",
    "category": "Home Services",
    "estimatedHours": 2,
    "tags": ["bike", "repair", "weekend"],
    "status": "active",
    "createdAt": "2024-05-01T10:00:00.000Z"
  }
]
```

---

### GET `/api/listings/:id`
Get a single listing by ID.

**Response `200`:** Single listing object.  
**Error `404`:** Listing not found.

---

### GET `/api/listings/user/:userId` *(protected)*
Get all listings created by a specific user.

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
Update a listing. Only the owner (or admin) can update.

**Request Body:** Any subset of listing fields.

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
- No duplicate active swaps allowed for the same listing pair.

**Response `201`:** Created swap object.  
**Error `403`:** Offered listing is not yours.  
**Error `409`:** Active swap already exists.

---

### GET `/api/swaps/mine` *(protected)*
Get all swaps where the current user is proposer or receiver, sorted newest first.

**Response `200`:** Array of swap objects.

---

### GET `/api/swaps/:id` *(protected)*
Get details of a specific swap. Only accessible to the two parties.

**Response `200`:**
```json
{
  "_id": "...",
  "proposerId": "664f1a2b...",
  "proposerName": "John Doe",
  "receiverId": "664f2b3c...",
  "receiverName": "Jane Smith",
  "offeredListingId": "...",
  "offeredListingTitle": "I'll fix your bike",
  "requestedListingId": "...",
  "requestedListingTitle": "I'll teach you guitar",
  "message": "Sounds like a fair deal!",
  "status": "pending",
  "proposerRating": null,
  "receiverRating": null,
  "createdAt": "2024-05-01T10:00:00.000Z"
}
```

---

### PATCH `/api/swaps/:id/accept` *(protected, receiver only)*
Accept an incoming swap proposal. Both listings move to `in-swap` status.

**Response `200`:** Updated swap with `status: "accepted"`.  
**Error `400`:** Swap is not in `pending` state.

---

### PATCH `/api/swaps/:id/reject` *(protected, receiver only)*
Reject an incoming swap proposal.

**Response `200`:** Updated swap with `status: "rejected"`.

---

### PATCH `/api/swaps/:id/cancel` *(protected, proposer only)*
Cancel a swap you proposed (only when `pending` or `accepted`).

**Response `200`:** Updated swap with `status: "cancelled"`.

---

### PATCH `/api/swaps/:id/complete` *(protected)*
Mark a swap as completed. Both listings move to `completed` status.

**Response `200`:** Updated swap with `status: "completed"`.  
**Error `400`:** Swap must be in `accepted` state first.

---

### PATCH `/api/swaps/:id/rate` *(protected)*
Submit a rating (1–5) after a swap is completed. Each party rates once.

**Request Body:**
```json
{ "rating": 5 }
```

**Response `200`:** Updated swap with rating recorded.  
**Error `400`:** Already rated, or swap not completed yet.

---

## Swap Status Flow

```
pending → accepted → completed
pending → rejected
pending → cancelled
accepted → cancelled
accepted → completed
```
