# SwapCircle — Architecture & Design

## Problem Statement

People often have skills or time to offer but lack money to pay for services they need.
SwapCircle is a peer-to-peer barter platform where users post what they can offer and
what they need, then negotiate direct skill-for-skill swaps — no money involved.

---

## System Architecture

```
┌─────────────────────────────────────────────────────┐
│                  React Frontend                     │
│              (Vite + Tailwind, :5173)               │
└─────────────────────┬───────────────────────────────┘
                      │ HTTP via Vite proxy /api/*
                      ▼
┌─────────────────────────────────────────────────────┐
│                  API Gateway                        │
│              (Express, :3000)                       │
│  /api/auth/*  →  auth-service                       │
│  /api/users/* →  user-service                       │
│  /api/listings/* → listing-service                  │
│  /api/swaps/* →  swap-service                       │
└──────┬──────────┬──────────┬──────────┬─────────────┘
       │          │          │          │
       ▼          ▼          ▼          ▼
  ┌─────────┐ ┌────────┐ ┌────────┐ ┌────────┐
  │  Auth   │ │  User  │ │Listing │ │  Swap  │
  │ :3001   │ │ :3002  │ │ :3003  │ │ :3004  │
  └────┬────┘ └───┬────┘ └───┬────┘ └───┬────┘
       │          │          │          │
       ▼          ▼          ▼          ▼
  [MongoDB]  [MongoDB]  [MongoDB]  [MongoDB]
  _auth      _users     _listings  _swaps
```

The swap service also calls the listing service directly (HTTP) to update listing
statuses when a swap is accepted or completed.

---

## Microservice Responsibilities

| Service | Port | Responsibility |
|---------|------|----------------|
| api-gateway | 3000 | Route, CORS, single entry point |
| auth-service | 3001 | Register, login, JWT issue & verify |
| user-service | 3002 | Profile CRUD, rating aggregation |
| listing-service | 3003 | Offer/request CRUD, search, filters |
| swap-service | 3004 | Swap lifecycle, rating submission |

---

## Frontend Component Hierarchy

```
App
├── Navbar
└── Routes
    ├── Landing
    ├── Login
    ├── Register
    ├── Dashboard
    │   ├── ListingCard (×6)
    │   └── SwapCard (×3)
    ├── Listings
    │   └── ListingCard (×n)
    ├── ListingDetail
    │   └── Swap Proposal Form
    ├── CreateListing
    ├── MySwaps
    │   └── SwapCard (×n)
    ├── SwapDetail
    │   └── StarRating
    └── Profile
        └── ListingCard (×n)
```

---

## Authentication Flow

```
1. User submits login/register form
2. Frontend POSTs to /api/auth/login
3. Auth service verifies credentials, returns JWT
4. Frontend stores token in localStorage
5. Axios instance attaches token to every request header
6. Each microservice independently verifies JWT
7. On 401, interceptor clears storage and redirects to /login
```

---

## Swap Lifecycle

```
User A posts an "offer" listing
User B posts an "offer" or "request" listing

User A browses listings → finds User B's listing
User A selects one of their own offers → submits swap proposal

Swap created: status = pending
  ↓
User B sees notification on dashboard
User B accepts → status = accepted (both listings → in-swap)
  ↓
Either party marks complete → status = completed (both listings → completed)
  ↓
Both parties can rate each other (1–5 stars)
Rating updates User profile's rolling average
```

---

## Key Design Decisions

**Database per service:** Each microservice owns its MongoDB database. Cross-service
references are plain string IDs. This keeps services independent and deployable separately.

**Denormalized display data:** userName, listingTitle etc. are stored inside swap
documents to avoid cross-service queries on every read.

**JWT verified per service:** The gateway does not validate tokens — each service does.
This means any service can be called directly in development without the gateway.

**Conflict prevention:** Before creating a swap, the swap service checks for existing
active swaps on the same listing pair to prevent double-booking.

---

## Assumptions

- Single-machine local deployment (all services on localhost)
- No email verification — registration is immediate
- Time credits are cosmetic in this version (not enforced as payment)
- No real-time notifications — users refresh to see new proposals
- Images/avatars not supported — initials avatar used instead
