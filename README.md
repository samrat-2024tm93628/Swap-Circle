# SwapCircle

SwapCircle is a peer-to-peer skill and service barter platform. The idea is simple — instead of paying money for something you need, you offer something you're good at in return. You fix my bike, I help you set up your laptop. You teach me Excel, I cook you a meal. No cash changes hands.

---

## The Problem

Most service platforms require payment. But a lot of the time, the person who needs help also has something useful to offer. There's no easy way to find those people and make a fair exchange. SwapCircle fills that gap.

---

## How It Works

1. **Post what you can offer** — a skill, a service, your time. Could be anything: tutoring, bike repair, graphic design, home cleaning, driving someone to the airport.

2. **Post what you need** — describe what you're looking for and roughly how many hours it would take.

3. **Browse and propose** — find someone whose offer matches what you need, and propose a swap using one of your own listings as the exchange.

4. **Agree and do it** — the other person accepts, you both complete the swap, and then rate each other. Your rating builds up over time and shows others you're reliable.

---

## Who It's For

Anyone who has a skill or some time and needs something done. Students, freelancers, neighbors, small communities — basically anyone who'd rather trade than pay.

---

## Features

- Post offers and requests with category, estimated hours, and tags
- Browse listings with filters by type, category, and keyword search
- Propose swaps directly from any listing — pick one of your own offers as the exchange
- Accept, reject, cancel, or mark swaps as complete
- Rate the other person after completion — builds a trust score on your profile
- Dashboard shows pending proposals, recent listings, and your stats
- Each user gets a profile with bio, skills, location, and swap history

---

## Tech Stack

| Layer | Technology |
| --- | --- |
| Frontend | React, Vite, Tailwind CSS |
| Backend | Node.js, Express (microservices) |
| Database | MongoDB (separate DB per service) |
| Auth | JWT (JSON Web Tokens) |
| API Layer | Express HTTP Proxy gateway |

### Services

```
api-gateway      :3000   single entry point, routes all /api/* traffic
auth-service     :3001   registration, login, JWT
user-service     :3002   profiles, skills, ratings
listing-service  :3003   offers, requests, search
swap-service     :3004   swap lifecycle, completion, ratings
```

---

## Running Locally

**Prerequisites:** Node.js, MongoDB running locally

```bash
# Install dependencies in each folder
cd backend/auth-service && npm install
cd backend/user-service && npm install
cd backend/listing-service && npm install
cd backend/swap-service && npm install
cd backend/api-gateway && npm install
cd frontend && npm install

# Copy .env.example to .env in each backend folder and fill in values

# Start all services (5 terminals)
cd backend/auth-service && npm run dev
cd backend/user-service && npm run dev
cd backend/listing-service && npm run dev
cd backend/swap-service && npm run dev
cd backend/api-gateway && npm run dev

# Start frontend
cd frontend && npm run dev
```

Open `http://localhost:5173`

---

## API Docs

Each service exposes a Swagger UI once running:

- Auth — `http://localhost:3001/api-docs`
- Users — `http://localhost:3002/api-docs`
- Listings — `http://localhost:3003/api-docs`
- Swaps — `http://localhost:3004/api-docs`

---

## Project Structure

```
swapcircle/
├── backend/
│   ├── api-gateway/
│   ├── auth-service/
│   ├── listing-service/
│   ├── swap-service/
│   └── user-service/
├── frontend/
│   └── src/
│       ├── components/
│       ├── context/
│       ├── pages/
│       └── services/
└── docs/
    ├── api-documentation.md
    ├── architecture.md
    ├── db-schema.md
    └── ai-usage-log.md
```
