# SwapCircle — Architecture & Design

## Problem Statement

People often have skills or time to offer but lack cash to pay for services they need.
SwapCircle is a peer-to-peer barter platform where users post what they can offer and
what they need, then negotiate direct skill-for-skill swaps or credit-based deals.
Credits (1 credit = ₹1 INR) let one party pay the other without requiring a return service.

---

## System Architecture

```text
┌─────────────────────────────────────────────────────┐
│                  React Frontend                     │
│          (Vite + Tailwind CSS, :5173)               │
└─────────────────────┬───────────────────────────────┘
                      │ HTTP via Vite proxy /api/*
                      ▼
┌─────────────────────────────────────────────────────┐
│                  API Gateway                        │
│              (Express, :3000)                       │
│  /api/auth/*          →  auth-service               │
│  /api/users/*         →  user-service               │
│  /api/listings/*      →  listing-service            │
│  /api/swaps/*         →  swap-service               │
│  /api/credit-offers/* →  swap-service               │
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

**Service-to-service calls (not through gateway):**

- Swap service → Listing service: update listing `status` on swap accept/complete/cancel
- Swap service → Auth service: transfer credits when a credit offer is accepted or locked
- Swap service → User service: update rolling rating after a swap is rated

All inter-service calls use a short-lived admin JWT (1-minute expiry, `role: "admin"`) generated internally — this avoids impersonating the client user and keeps calls auditable.

---

## Microservice Responsibilities

| Service | Port | Responsibility |
|---------|------|----------------|
| api-gateway | 3000 | Single entry point, CORS, Authorization header forwarding, route proxying |
| auth-service | 3001 | Register, login, JWT issuance, credits wallet (buy/redeem/pay/transfer), transaction log |
| user-service | 3002 | Public profiles (bio, skills, location), rating aggregation with per-star breakdown |
| listing-service | 3003 | Offer/request listing CRUD, search, category/type filters, status lifecycle |
| swap-service | 3004 | Swap proposal lifecycle, ratings, credit offer negotiation |

---

## Frontend Component Hierarchy

```text
App.jsx
├── Navbar.jsx            (sticky, shows live credit balance, nav links)
└── Routes
    ├── Landing           (hero page for unauthenticated users)
    ├── Login
    ├── Register
    ├── Dashboard         (post-login home: stats, recent listings, pending swaps)
    │   ├── ListingCard (×n)
    │   └── SwapCard (×n)
    ├── Listings          (browse all listings, live search + type/category filters)
    │   └── ListingCard (×n)
    ├── ListingDetail     (view listing, propose swap or credit offer with negotiation)
    ├── CreateListing     (form to post offer or request)
    ├── MySwaps           (swap proposals + credit offers with inline actions)
    │   └── SwapCard (×n)
    ├── SwapDetail        (accept/reject/complete/rate a specific swap)
    ├── Profile           (public profile: bio, skills, activity stats bureau, ratings breakdown, feedback list)
    │   └── ListingCard (×n)
    └── Credits           (wallet: buy, redeem, active credit offers, transaction history)
```

**State Management:** React Context API (`AuthContext`) for global auth state. Local `useState` + `useEffect` for page-level data. No external library (Redux etc.) needed.

**Routing:** React Router v6. Protected routes use a `<Protected>` wrapper that redirects unauthenticated users to `/login`.

**API Layer:** Axios instance with:

- Request interceptor: attaches JWT from `localStorage` on every call
- Response interceptor: redirects to `/login` on 401 only if a token exists (prevents false logout on public routes)

---

## Authentication Flow

```text
1. User submits login/register form
2. Frontend POSTs to /api/auth/login
3. Auth service verifies credentials, signs JWT (7-day expiry), returns token + user
4. Frontend stores token in localStorage, user object in AuthContext
5. Axios request interceptor reads token fresh from localStorage on each call
6. Each microservice independently verifies the JWT using shared JWT_SECRET
7. On 401 (with token present), interceptor clears storage and redirects to /login
```

---

## Swap Lifecycle

```text
User A posts an "offer" listing
User B posts an "offer" or "request" listing

User A browses → finds User B's listing → selects one of their own offers
User A submits swap proposal (must own the offered listing)

Swap: status = pending
  ↓
User B accepts → status = accepted
  Both listings → in-swap (via service token call to listing-service)
  ↓
Either party marks complete → status = completed
  Both listings → completed
  ↓
Each party can rate the other (1–5 stars, once only)
  Swap-service calls user-service to update rolling average + ratingBreakdown
```

---

## Credit Offer Negotiation Flow

```text
Buyer views a listing → clicks "Propose credit offer" → enters amount + note
Credit offer created: status = pending  (NO credits deducted yet)
  ↓
Seller sees offer in My Swaps / Credits page
  Option A: Seller accepts → credits transfer immediately (buyer → seller)
            offer status = accepted, finalAmount set
  Option B: Seller counters with different amount → status = countered
              ↓
            Buyer sees counter offer
              Option A: Buyer locks deal → credits transfer immediately
                        offer status = accepted, finalAmount = counterAmount
              Option B: Buyer rejects → status = rejected (no credits moved)
  Option C: Seller rejects → status = rejected
```

---

## Key Design Decisions

**Database per service:** Each microservice owns its MongoDB database on Atlas. Cross-service references are plain string IDs. This keeps services independently deployable and avoids shared-schema coupling.

**Denormalized display data:** `userName`, `listingTitle`, `buyerName` etc. are stored inside swap and credit offer documents to avoid cross-service joins on every read. Accepted trade-off: stale names if a user renames (not a concern in this use case).

**JWT verified per service:** The gateway does not validate tokens — each service does. This means any service is independently callable in development without the gateway.

**Admin service token for inter-service writes:** The swap service generates a short-lived JWT with `role: "admin"` (1-minute expiry) for calls to listing-service and auth-service. This avoids impersonating the user and keeps inter-service writes auditable and scoped.

**Credits deducted only at deal close:** In the credit offer flow, credits are never held or escrowed during negotiation. The transfer happens only when the seller accepts or the buyer locks the counter offer. This simplifies rollback handling — there is no rollback needed if a negotiation falls through.

**Live search without debounce:** Listings search triggers on `search.length >= 2` via `useEffect`, giving instant feedback without the 400ms lag of a debounce approach.

---

## Assumptions

- Single-machine local deployment (all services on localhost with fixed ports)
- No email verification — registration is immediate
- Credits system is simulated — `buy` adds credits without real payment processing; `redeem` is logged but not processed externally
- No real-time notifications — users refresh or navigate to see new proposals
- Images and avatars not supported — initials-based avatar used throughout
- Credit redemptions are assumed to be processed out-of-band within 2-3 business days (displayed as a notice to the user)
- Each new user starts with 5 free credits
