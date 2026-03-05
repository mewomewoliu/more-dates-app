# Nous — Date Planner Setup

## Stack
- **Frontend**: React 18 + TypeScript + Vite
- **Backend**: Node.js + Express + TypeScript
- **Database**: PostgreSQL + Prisma ORM
- **Auth**: Clerk
- **Real-time**: Socket.io

## Prerequisites
- Node.js 18+
- PostgreSQL (local via Homebrew: `brew install postgresql@16 && brew services start postgresql@16`)

## 1. Install dependencies

```bash
npm install
```

## 2. Set up Clerk

1. Go to [clerk.com](https://clerk.com) → create a new application
2. Copy your keys from the Clerk dashboard

## 3. Configure environment variables

```bash
# Frontend
cp frontend/.env.example frontend/.env.local
# Add your VITE_CLERK_PUBLISHABLE_KEY

# Backend
cp backend/.env.example backend/.env
# Add your DATABASE_URL, CLERK_SECRET_KEY
```

**backend/.env**
```
DATABASE_URL="postgresql://postgres:password@localhost:5432/nous_db"
CLERK_SECRET_KEY=sk_test_...
FRONTEND_URL=http://localhost:5173
PORT=3001
```

**frontend/.env.local**
```
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
```

## 4. Set up the database

```bash
# Create the database
createdb nous_db

# Generate Prisma client & run migrations
cd backend
npm run db:generate
npm run db:migrate
```

## 5. Run the app

```bash
# From root — starts both frontend and backend
npm run dev
```

- Frontend: http://localhost:5173
- Backend: http://localhost:3001

## Architecture

```
my-app1/
├── frontend/          # React + TypeScript + Vite
│   └── src/
│       ├── App.tsx          # Clerk + React Query + Router providers
│       ├── pages/
│       │   ├── DashboardPage.tsx   # List & create plans
│       │   ├── DatePlanPage.tsx    # Main planning UI (phone frame)
│       │   ├── OverviewPage.tsx    # Overview tab
│       │   ├── WhenPage.tsx        # Date/time voting
│       │   ├── WherePage.tsx       # Location suggestions & voting
│       │   ├── WhatPage.tsx        # Activity list
│       │   └── JoinPage.tsx        # Share link handler
│       └── components/
│           ├── PhoneFrame.tsx
│           ├── Calendar.tsx
│           └── BottomSheet.tsx
└── backend/           # Node.js + Express + TypeScript
    ├── prisma/
    │   └── schema.prisma    # PostgreSQL schema
    └── src/
        ├── index.ts          # Express + Socket.io server
        ├── routes/           # REST API routes
        ├── middleware/        # Clerk JWT verification
        └── socket/            # Real-time handlers
```

## Share links

When a user clicks "Share" in the app, they get a link like:
`http://localhost:5173/join/<shareToken>`

Anyone opening this link will be prompted to sign in (if not already) and then
automatically join the plan as a co-planner.
