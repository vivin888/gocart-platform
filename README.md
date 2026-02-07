<div align="center">

# 🛒 GoCart

**Your marketplace, simplified.**

A full-stack, multi-vendor e-commerce platform where sellers create shops, customers discover products, and admins keep everything running smoothly — all in one place.

</div>

<br>

## What is GoCart?

GoCart is an open-source multi-vendor marketplace that gives you everything out of the box:

- **Sellers** sign up, create a store, list products, and track orders from a dedicated dashboard.
- **Customers** browse shops, add items to cart, pay with Stripe, and leave ratings.
- **Admins** approve stores, manage coupons, monitor sales analytics, and control the entire platform.

All powered by a modern React 19 + Next.js 16 stack with server-side rendering, Turbopack dev server, and edge-ready deployment.

<br>

## Tech Stack

### Core

```
Next.js 16          →  App Router, Server Actions, Turbopack
React 19            →  Latest concurrent features
Tailwind CSS 4      →  Utility-first styling with PostCSS
TypeScript          →  Middleware & config type safety
```

### Database & ORM

```
PostgreSQL          →  Primary relational database
Neon                →  Serverless Postgres (WebSocket driver)
Prisma 6            →  Type-safe ORM with Neon adapter
```

### Authentication

```
Clerk               →  User management, sign-in/sign-up, session handling
```

### Payments

```
Stripe              →  Checkout, payment processing, webhooks
```

### AI & Generative

```
Google Gemini AI    →  AI-powered store creation assistant
```

### Media & Storage

```
ImageKit            →  Image upload, optimization, and CDN delivery
```

### State & Data

```
Redux Toolkit       →  Global client state management
React Redux         →  React bindings for Redux
Axios               →  HTTP client for API calls
```

### Background Jobs

```
Inngest             →  Serverless event-driven background functions
```

### UI & Visualization

```
Lucide React        →  Beautiful open-source icon set
Recharts            →  Composable charting library for dashboards
React Hot Toast     →  Lightweight toast notifications
date-fns            →  Modern date utility library
```

<br>

## Project Structure

```
app/
├── (public)/           Customer-facing pages (home, shop, cart, orders, product)
├── store/              Seller dashboard (add/manage products, orders)
├── admin/              Admin panel (approve stores, coupons, analytics)
└── api/                REST API routes
    ├── cart/           Cart operations
    ├── products/       Product CRUD
    ├── orders/         Order management
    ├── store/          Store creation, AI assist, dashboard data
    ├── stripe/         Payment webhooks
    ├── admin/          Admin endpoints
    └── ...

components/             Reusable UI components
configs/                ImageKit & AI configuration
inngest/                Background job definitions
lib/                    Prisma client, Redux store, constants
middlewares/            Auth guards (admin, seller)
prisma/                 Database schema
```

<br>

## Getting Started

**Prerequisites** — Node.js 18+ and npm

```bash
# 1 · Clone the repo
git clone https://github.com/vivin888/gocart-platform.git
cd gocart-platform

# 2 · Install dependencies
npm install

# 3 · Set up environment variables
cp .env.example .env
#    Fill in your keys: DATABASE_URL, CLERK, STRIPE, IMAGEKIT, GEMINI, INNGEST

# 4 · Push the database schema
npx prisma db push

# 5 · Start the dev server (Turbopack ⚡)
npm run dev
```

Open **http://localhost:3000** and you're live.

<br>

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start dev server with Turbopack |
| `npm run build` | Generate Prisma client & build for production |
| `npm start` | Run the production server |
| `npm run lint` | Lint the codebase |

<br>

---

<div align="center">
<sub>Built with ❤️ by <a href="https://github.com/vivin888">vivin888</a> · Powered by Next.js, Tailwind CSS, Prisma & Stripe</sub>
</div>
