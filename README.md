# UoL Campus Market

A second-hand trading platform for University of Liverpool students. Students can buy and sell items within the campus community.

**Live URL:** http://38.65.91.221:8080

---

## Features

- University email verification (@liverpool.ac.uk)
- Product listings with real image upload (up to 5 photos)
- Product fields: condition, brand, purchase date, location, tags, defects
- Shopping cart and browsing history
- Seller ratings and product reviews
- Favourites list
- Direct messaging between buyers and sellers
- Report system for inappropriate listings
- Admin panel: user management, product moderation, stats

---

## Tech Stack

- **Backend:** Node.js, Express.js
- **Frontend:** Vanilla JS single-page app (one HTML file)
- **Storage:** JSON file (`data.json`) — no database required
- **Image upload:** multer (stored in `/uploads/`)
- **Auth:** Token-based sessions (in-memory)

---

## Getting Started

### Prerequisites

- Node.js v16 or higher

### Install

```bash
git clone https://github.com/your-repo/campus-trading-team36.git
cd campus-trading-team36
npm install
```

### Run

```bash
npm start
```

Open http://localhost:8080 in your browser.

---

## Default Accounts

| Role  | Email                    | Password |
|-------|--------------------------|----------|
| Admin | admin@liverpool.ac.uk    | admin123 |
| User  | alice@liverpool.ac.uk    | pass123  |
| User  | bob@liverpool.ac.uk      | pass123  |

> Registration requires a `@liverpool.ac.uk` email. The verification code is returned in the API response for demo purposes (check the browser network tab or server console).

---

## Project Structure

```
campus-trading-team36/
├── server.js              # Entry point, Express setup, multer config
├── config.js              # Port, file size limits, allowed email domains
├── package.json
├── models/
│   └── db.js              # JSON file store, seed data, migration logic
├── middleware/
│   └── auth.js            # Token auth, requireAuth, requireAdmin
├── routes/
│   ├── user.js            # /api/user/*
│   ├── product.js         # /api/products/*
│   ├── favorite.js        # /api/favorite/*
│   ├── message.js         # /api/messages/*
│   ├── report.js          # /api/reports/*
│   ├── review.js          # /api/review/*
│   └── admin.js           # /api/admin/*
├── controllers/           # HTTP request handlers
├── services/              # Business logic
│   ├── userService.js
│   ├── productService.js
│   ├── cartService.js
│   ├── browsingService.js
│   ├── reviewService.js
│   ├── messageService.js
│   ├── reportService.js
│   └── adminService.js
├── public/
│   └── index.html         # Entire frontend SPA
└── uploads/               # Uploaded product images (auto-created)
```

---

## API Overview

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | /api/user/verify | — | Send verification code |
| POST | /api/user/register | — | Register new account |
| POST | /api/user/login | — | Login |
| POST | /api/user/logout | ✓ | Logout |
| GET | /api/user/profile | ✓ | Get profile |
| GET | /api/user/stats | ✓ | Listing/cart/history counts |
| GET | /api/user/cart | ✓ | Get cart |
| POST | /api/user/cart | ✓ | Add to cart |
| DELETE | /api/user/cart/:id | ✓ | Remove from cart |
| GET | /api/user/history | ✓ | Browsing history |
| POST | /api/user/history | ✓ | Record product view |
| DELETE | /api/user/history | ✓ | Clear history |
| GET | /api/products | — | List products (supports filters) |
| GET | /api/products/:id | — | Product detail |
| POST | /api/products | ✓ | Create listing |
| PUT | /api/products/:id | ✓ | Edit listing |
| DELETE | /api/products/:id | ✓ | Delete listing |
| PUT | /api/products/:id/sold | ✓ | Mark as sold |
| POST | /api/upload | ✓ | Upload images (max 5) |
| POST | /api/review | ✓ | Submit review |
| GET | /api/review/seller/:id | — | Seller rating |
| GET | /api/review/product/:id | — | Product reviews |
| GET | /api/admin/stats | Admin | Platform stats |
| GET | /api/admin/users | Admin | All users |
| GET | /api/admin/products/all | Admin | All products |
| GET | /api/admin/reports | Admin | Reports list |

---

## VPS Deployment

The app runs on a VPS with PM2 for process management.

```bash
# Install PM2 globally
npm install -g pm2

# Start the app
pm2 start server.js --name campus-trading

# Auto-start on reboot
pm2 save
pm2 startup

# Restart after uploading updated files
pm2 restart campus-trading
```

Make sure port 8080 is open in both UFW and your cloud provider's firewall panel.

```bash
ufw allow 8080
```

---

## Team

Group 36 — COMP2005 / University of Liverpool
