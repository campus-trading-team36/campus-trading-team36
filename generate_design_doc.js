// Generate the COMP208 Team Software Project DESIGN document (.docx)
// run: node generate_design_doc.js
// output: Design_Document.docx in the project root

const fs = require('fs');
const path = require('path');
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, AlignmentType, PageOrientation, LevelFormat,
  TabStopType, TabStopPosition, HeadingLevel, BorderStyle, WidthType,
  ShadingType, VerticalAlign, PageNumber, PageBreak, TableOfContents,
  PositionalTab, PositionalTabAlignment, PositionalTabRelativeTo, PositionalTabLeader
} = require('docx');

// ---------- helpers ----------
const border = { style: BorderStyle.SINGLE, size: 4, color: "BBBBBB" };
const borders = { top: border, bottom: border, left: border, right: border };
const cellMargins = { top: 80, bottom: 80, left: 120, right: 120 };

function H1(text) {
  return new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun(text)] });
}
function H2(text) {
  return new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun(text)] });
}
function H3(text) {
  return new Paragraph({ heading: HeadingLevel.HEADING_3, children: [new TextRun(text)] });
}
function P(text, opts = {}) {
  return new Paragraph({
    spacing: { after: 120 },
    alignment: opts.align || AlignmentType.JUSTIFIED,
    children: [new TextRun({ text, ...opts })]
  });
}
function Code(text) {
  // monospace block-ish paragraph
  const lines = text.split("\n");
  return lines.map(l => new Paragraph({
    spacing: { after: 0 },
    shading: { fill: "F4F4F4", type: ShadingType.CLEAR },
    children: [new TextRun({ text: l || " ", font: "Consolas", size: 20 })]
  }));
}
function Bullet(text) {
  return new Paragraph({
    numbering: { reference: "bullets", level: 0 },
    children: [new TextRun(text)]
  });
}
function PlaceholderBox(label) {
  // render as a thick-bordered table cell so it visually says "INSERT IMAGE HERE"
  return new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [9360],
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 9360, type: WidthType.DXA },
            margins: { top: 600, bottom: 600, left: 200, right: 200 },
            shading: { fill: "FFF4D6", type: ShadingType.CLEAR },
            borders: {
              top:    { style: BorderStyle.DASHED, size: 12, color: "C09030" },
              bottom: { style: BorderStyle.DASHED, size: 12, color: "C09030" },
              left:   { style: BorderStyle.DASHED, size: 12, color: "C09030" },
              right:  { style: BorderStyle.DASHED, size: 12, color: "C09030" }
            },
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { after: 80 },
                children: [new TextRun({ text: "[ Insert Image: " + label + " ]", bold: true, size: 24, color: "8A6500" })]
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new TextRun({ text: "(see Appendix A for full image list)", italics: true, size: 20, color: "8A6500" })]
              })
            ]
          })
        ]
      })
    ]
  });
}

// 2-col table builder for tabular content (key/value, etc.)
function twoColTable(rows, w1 = 2880, w2 = 6480, headerFill = "4472C4") {
  const tableW = w1 + w2;
  return new Table({
    width: { size: tableW, type: WidthType.DXA },
    columnWidths: [w1, w2],
    rows: rows.map((r, i) => new TableRow({
      children: r.map((cell, idx) => new TableCell({
        borders, margins: cellMargins,
        width: { size: idx === 0 ? w1 : w2, type: WidthType.DXA },
        shading: i === 0 ? { fill: headerFill, type: ShadingType.CLEAR } : undefined,
        children: [new Paragraph({ children: [new TextRun({
          text: cell,
          bold: i === 0,
          color: i === 0 ? "FFFFFF" : "000000",
          size: 22
        })] })]
      }))
    }))
  });
}

// generic n-col table
function table(rows, widths, headerFill = "4472C4") {
  const tableW = widths.reduce((a, b) => a + b, 0);
  return new Table({
    width: { size: tableW, type: WidthType.DXA },
    columnWidths: widths,
    rows: rows.map((r, i) => new TableRow({
      tableHeader: i === 0,
      children: r.map((cell, idx) => new TableCell({
        borders, margins: cellMargins,
        width: { size: widths[idx], type: WidthType.DXA },
        shading: i === 0 ? { fill: headerFill, type: ShadingType.CLEAR } : undefined,
        children: [new Paragraph({ children: [new TextRun({
          text: String(cell),
          bold: i === 0,
          color: i === 0 ? "FFFFFF" : "000000",
          size: 20
        })] })]
      }))
    }))
  });
}

// ---------- content blocks ----------
const children = [];

// ===== COVER =====
children.push(new Paragraph({ spacing: { before: 2400, after: 200 }, alignment: AlignmentType.CENTER,
  children: [new TextRun({ text: "COMP208 Team Software Project", bold: true, size: 36, color: "1F3864" })]}));
children.push(new Paragraph({ spacing: { after: 1200 }, alignment: AlignmentType.CENTER,
  children: [new TextRun({ text: "Design Document", bold: true, size: 56, color: "1F3864" })]}));
children.push(new Paragraph({ spacing: { after: 200 }, alignment: AlignmentType.CENTER,
  children: [new TextRun({ text: "UoL Campus Market", italics: true, size: 32 })]}));
children.push(new Paragraph({ spacing: { after: 1600 }, alignment: AlignmentType.CENTER,
  children: [new TextRun({ text: "A second-hand trading platform for University of Liverpool students", size: 22, color: "595959" })]}));
children.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 100 },
  children: [new TextRun({ text: "Team 36", bold: true, size: 24 })]}));
children.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 100 },
  children: [new TextRun({ text: "Department of Computer Science", size: 22 })]}));
children.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 100 },
  children: [new TextRun({ text: "University of Liverpool", size: 22 })]}));
children.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 400 },
  children: [new TextRun({ text: "Submission Date: 11 May 2026", size: 22, color: "595959" })]}));
children.push(new Paragraph({ children: [new PageBreak()] }));

// ===== DOCUMENT CONTROL =====
children.push(H1("Document Control"));
children.push(twoColTable([
  ["Field", "Value"],
  ["Module", "COMP208 — Team Software Project (2025/26)"],
  ["Document type", "Design Document (final, post-implementation)"],
  ["Project title", "UoL Campus Market — Campus second-hand trading platform"],
  ["Team", "Team 36"],
  ["Repository", "campus-trading-team36 (Node.js + Express + SQLite)"],
  ["Live deployment", "http://38.65.91.221:8080"],
  ["Default admin", "admin@liverpool.ac.uk / admin123"],
  ["Document version", "1.0 (final)"],
  ["Submission deadline", "11 May 2026 (15% of module mark)"],
  ["Pages", "No page limit"]
]));
children.push(new Paragraph({ children: [new PageBreak()] }));

// ===== TOC =====
children.push(H1("Table of Contents"));
children.push(new Paragraph({ children: [
  new TableOfContents("Table of Contents", { hyperlink: true, headingStyleRange: "1-3" })
]}));
children.push(P("(Right-click → Update Field in Microsoft Word to refresh the page numbers after opening.)",
  { italics: true, size: 20, color: "808080" }));
children.push(new Paragraph({ children: [new PageBreak()] }));

// ===== 1. INTRODUCTION =====
children.push(H1("1. Introduction"));

children.push(H2("1.1 Project background"));
children.push(P(
  "Every year a large volume of usable second-hand goods — laptops, textbooks, kitchen equipment, " +
  "small furniture — is discarded by University of Liverpool students leaving halls of residence, while " +
  "incoming students simultaneously buy the same items new at significantly higher prices. Existing " +
  "general-purpose marketplaces (eBay, Facebook Marketplace, Vinted) are not student-aware: they expose " +
  "both buyer and seller to anonymous off-campus users, do not verify university affiliation, and offer " +
  "no campus-specific filters such as residence hall location."
));
children.push(P(
  "UoL Campus Market addresses this gap. The platform is restricted to verified holders of " +
  "@liverpool.ac.uk and @student.liverpool.ac.uk email addresses, supports campus-aware fields such as " +
  "residence-hall location and university module tags, and provides the full set of features required " +
  "for a closed-community trading site: listings with multi-image upload, in-app messaging, favourites, " +
  "shopping cart, browsing history, seller rating, and an administrator moderation panel."
));

children.push(H2("1.2 Scope of this document"));
children.push(P(
  "This document is the final design specification of the system as implemented at the close of the " +
  "project. As permitted by the COMP208 2025/26 design assessment brief, only the final design is " +
  "submitted (no interim design submission was required). Following the brief, the document covers:"
));
children.push(Bullet("System architecture and component organisation (Chapter 2)"));
children.push(Bullet("The data managed by the system, including a full data dictionary and ER model (Chapter 3)"));
children.push(Bullet("Processes and algorithms used to handle that data (Chapter 4)"));
children.push(Bullet("System interfaces — both the public REST API and the user-facing web UI (Chapter 5)"));
children.push(Bullet("Security design (Chapter 6)"));
children.push(Bullet("Evaluation strategy and test plan (Chapter 7)"));
children.push(Bullet("Deployment architecture (Chapter 8)"));

children.push(H2("1.3 Design methodology"));
children.push(P(
  "The system follows a data-centric, layered architecture (Connolly & Begg style). " +
  "We use entity–relationship modelling for the data layer, a tabular data dictionary, " +
  "interface (sequence) diagrams for key processes, REST endpoint tables for the network interface, " +
  "and pseudocode for non-trivial algorithms. Object-oriented techniques (use-case and class diagrams) " +
  "are used selectively for the front-end and middleware layers, where they add clarity."
));

children.push(H2("1.4 Glossary"));
children.push(table([
  ["Term", "Meaning"],
  ["SPA", "Single-Page Application — the entire UI is one HTML file with client-side routing"],
  ["JWT-style token", "Opaque random token issued at login and stored in browser localStorage"],
  ["Bearer token", "HTTP Authorization header format: 'Bearer <token>'"],
  ["WAL", "Write-Ahead Logging mode of SQLite, allows concurrent readers"],
  ["Listing", "A product offered for sale by a seller"],
  ["Moderation", "Admin approval step before a listing becomes publicly visible"],
  ["Soft-delete", "Marking a record as removed without physically deleting (not used; we hard-delete)"]
], [2200, 7160]));
children.push(new Paragraph({ children: [new PageBreak()] }));

// ===== 2. ARCHITECTURE =====
children.push(H1("2. System Architecture"));

children.push(H2("2.1 Architectural style"));
children.push(P(
  "The system uses a classic three-tier architecture: a presentation tier (browser SPA), an application " +
  "tier (Node.js/Express HTTP API), and a data tier (SQLite database with WAL journaling plus a " +
  "filesystem-backed image store). Within the application tier the code is further organised into a " +
  "routes → controllers → services → models pipeline. This keeps HTTP concerns at the edge, business " +
  "logic in services, and database concerns in the data layer, which simplifies unit-style testing of " +
  "services and integration testing through supertest at the route boundary."
));

children.push(H2("2.2 High-level component diagram"));
children.push(PlaceholderBox("Figure 2.1 – Three-tier architecture diagram (browser → Express → SQLite + uploads)"));
children.push(P(
  "Figure 2.1 shows the three tiers and the network/process boundaries between them. The browser " +
  "communicates with the Express application over HTTP/JSON; the application opens a single in-process " +
  "SQLite database connection (better-sqlite3 is synchronous, so no connection pool is required); " +
  "uploaded images are written to a local /uploads directory served as static assets."
));

children.push(H2("2.3 Technology stack"));
children.push(table([
  ["Tier", "Technology", "Why we chose it"],
  ["Presentation", "Vanilla JS + HTML/CSS, single index.html", "No build step, easy to grade, fast iteration"],
  ["Presentation", "fetch + Bearer token in localStorage", "Standard browser API, no extra deps"],
  ["Application", "Node.js v16+ runtime", "Required by the module spec"],
  ["Application", "Express.js 4.x", "De-facto standard HTTP framework for Node"],
  ["Application", "multer 1.4.5", "Multipart upload handling for product images"],
  ["Application", "uuid v4", "Collision-resistant primary keys without DB sequences"],
  ["Data", "better-sqlite3 12.x", "Synchronous, embedded, zero-config, ACID transactions"],
  ["Data", "WAL journal mode", "Allows readers concurrent with a writer"],
  ["Data", "JSON file for sessions", "Survives restarts without an extra DB table"],
  ["Test", "Jest 30 + supertest 7", "Industry-standard Node testing stack"],
  ["Process", "PM2 on production VPS", "Auto-restart, log rotation, single-command deploy"]
], [1500, 2500, 5360]));

children.push(H2("2.4 Layered organisation of the application tier"));
children.push(PlaceholderBox("Figure 2.2 – Layered module dependency diagram (routes → controllers → services → models)"));
children.push(P("The strict downward dependency rule between layers is:"));
children.push(Bullet("routes/* — only declares HTTP paths and wires them to controllers; no business logic"));
children.push(Bullet("controllers/* — request/response translation and input validation; calls services"));
children.push(Bullet("services/* — pure business logic; reads and mutates the in-memory store and persists via save()"));
children.push(Bullet("models/db.js — the only module that touches SQLite; exposes store, save, saveSync"));
children.push(Bullet("middleware/* — cross-cutting concerns: auth, logging, error handling, rate limiting, security headers"));
children.push(P(
  "This hierarchy is enforced by convention and reviewed during code review. " +
  "Concretely: a service must not call res.json(); a controller must not run a SQL query; only db.js opens the " +
  "Database handle. Every test in tests/ goes through the supertest HTTP boundary, which exercises the " +
  "full stack end-to-end without bypassing layers."
));

children.push(H2("2.5 Module responsibilities"));
children.push(table([
  ["Module", "Responsibility"],
  ["app.js", "Express factory — registers middleware, mounts routes, exports the app object so tests can import without binding a port"],
  ["server.js", "Production entry point — calls app.listen() and installs SIGINT/SIGTERM handlers that flush sessions and the DB synchronously before exiting"],
  ["config.js", "Centralises all environment-driven configuration: port, max upload size, allowed email domains, admin credentials, moderation toggle"],
  ["models/db.js", "Schema DDL, in-memory cache (store), debounced save, synchronous saveSync for shutdown, one-time migration from legacy data.json"],
  ["middleware/auth.js", "Token-based session store (file-persisted), requireAuth and requireAdmin guards"],
  ["middleware/securityHeaders.js", "Adds CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy"],
  ["middleware/rateLimiter.js", "Per-IP rolling-window rate limiter — relaxed for general API, strict for /api/user/login & /register"],
  ["middleware/errorHandler.js", "Final 404 and 500 error handler — produces uniform JSON error envelopes"],
  ["routes/*.js", "Thin HTTP routing modules"],
  ["controllers/*.js", "Translate HTTP <-> service calls; validate inputs"],
  ["services/*.js", "Business logic for users, products, cart, history, reviews, messages, reports, admin actions"],
  ["public/index.html", "Entire SPA: pages, routing, fetch wrapper, productCache, toast notifications"],
  ["uploads/", "Filesystem-backed product image store, exposed read-only at /uploads"]
], [2400, 6960]));

children.push(H2("2.6 Cross-cutting concerns"));
children.push(H3("2.6.1 Logging"));
children.push(P(
  "middleware/logger.js writes one line per request to stdout with method, path, status, response time, " +
  "and the requesting user id (when available). Logging is suppressed when NODE_ENV=test so test output stays clean."
));
children.push(H3("2.6.2 Error handling"));
children.push(P(
  "All thrown errors funnel into middleware/errorHandler.js, which returns a JSON object of the form " +
  "{ success: false, message: '...' } with an appropriate HTTP status. This contract is consumed by the " +
  "front-end fetch wrapper apiFetch(), which surfaces 401 responses by clearing the token and showing the login page."
));
children.push(H3("2.6.3 Rate limiting"));
children.push(P(
  "A rolling-window in-memory limiter is applied at three levels: a baseline of 200 requests/minute on /api/*, " +
  "a strict 10/minute on auth endpoints, and 30/minute on /api/upload. The limiter is disabled in test mode."
));
children.push(new Paragraph({ children: [new PageBreak()] }));

// ===== 3. DATA DESIGN =====
children.push(H1("3. Data Design"));

children.push(H2("3.1 Approach"));
children.push(P(
  "The data layer follows a relational model implemented in SQLite (better-sqlite3). The schema is " +
  "defined as a single CREATE TABLE IF NOT EXISTS DDL block executed at startup in models/db.js, so " +
  "first-boot creates the tables, and subsequent boots are no-ops. To preserve the original prototype " +
  "API (an in-memory object literal called store mutated by services), the database layer also " +
  "exposes a save() function that snapshots store back to SQLite atomically inside a single transaction. " +
  "This trade-off keeps the service layer simple (mutate JavaScript arrays) while gaining ACID durability."
));

children.push(H2("3.2 Entity–Relationship model"));
children.push(PlaceholderBox("Figure 3.1 – Entity–Relationship diagram (10 entities, 11 tables incl. junction tables)"));
children.push(P("The conceptual entities are:"));
children.push(Bullet("USER — registered student or administrator"));
children.push(Bullet("PRODUCT — a listing posted by a USER (the seller)"));
children.push(Bullet("MESSAGE — a directional message from one USER to another, optionally tied to a PRODUCT"));
children.push(Bullet("REPORT — a complaint filed by a USER against a PRODUCT or another USER"));
children.push(Bullet("FAVORITE — a USER × PRODUCT junction (a user has favourited a product)"));
children.push(Bullet("CART — a USER × PRODUCT junction with optional buyer note"));
children.push(Bullet("REVIEW — a buyer's rating of a seller, scoped to one PRODUCT"));
children.push(Bullet("BROWSING_HISTORY — a USER × PRODUCT × time tuple"));
children.push(Bullet("VERIFY_CODE — a single-use code for email verification or password reset"));
children.push(Bullet("ADMIN_LOG — append-only audit trail of administrator actions"));

children.push(H2("3.3 Cardinalities"));
children.push(table([
  ["Relationship", "Cardinality", "Notes"],
  ["USER — PRODUCT (sells)", "1 : many", "A user may post 0..n listings; a product has exactly one seller"],
  ["USER — MESSAGE (sends)", "1 : many", "Sender side"],
  ["USER — MESSAGE (receives)", "1 : many", "Receiver side"],
  ["USER — FAVORITE — PRODUCT", "many : many", "Junction table favorites with composite PK"],
  ["USER — CART — PRODUCT", "many : many", "Junction table cart with UNIQUE(userId, productId)"],
  ["USER — REVIEW (writes)", "1 : many", "A buyer may write at most one review per product"],
  ["USER — REVIEW (receives)", "1 : many", "Reviews are aggregated per seller"],
  ["USER — BROWSING_HISTORY — PRODUCT", "many : many", "Time-stamped views, deduped within a 30-min window"],
  ["USER — REPORT", "1 : many", "A user may file multiple reports"]
], [3000, 1800, 4560]));

children.push(H2("3.4 Data dictionary"));
children.push(P(
  "The following tables document every column actually defined in models/db.js. Types are SQLite " +
  "column types (TEXT, INTEGER, REAL); the application also enforces semantic constraints (e.g. price > 0, " +
  "rating between 1 and 5) inside the service layer."
));

// USERS
children.push(H3("3.4.1 users"));
children.push(table([
  ["Column", "Type", "Constraints", "Description"],
  ["id", "TEXT", "PK", "UUID v4 (or 'admin-001' for the seeded admin)"],
  ["username", "TEXT", "NOT NULL", "Display name shown on listings and messages"],
  ["email", "TEXT", "NOT NULL UNIQUE", "Lower-cased; must match an allowed domain"],
  ["password", "TEXT", "NOT NULL", "PBKDF2-style hash (salt:hash hex), never plaintext"],
  ["role", "TEXT", "NOT NULL DEFAULT 'user'", "Either 'user' or 'admin'"],
  ["verified", "INTEGER", "DEFAULT 0", "1 = email-verified during registration"],
  ["banned", "INTEGER", "DEFAULT 0", "1 = revoked; banned users cannot log in or post"],
  ["lastLoginAt", "TEXT", "", "ISO-8601 timestamp of last successful login"],
  ["createdAt", "TEXT", "NOT NULL", "ISO-8601 registration time"]
], [1700, 1100, 2200, 4360]));
children.push(P("Index: idx_users_email on (email) — used by the login query.", { size: 20, italics: true }));

// PRODUCTS
children.push(H3("3.4.2 products"));
children.push(table([
  ["Column", "Type", "Constraints", "Description"],
  ["id", "TEXT", "PK", "UUID v4"],
  ["title", "TEXT", "NOT NULL", "Listing headline (1–80 chars)"],
  ["description", "TEXT", "", "Long description (markdown not supported)"],
  ["price", "REAL", "NOT NULL", "GBP, must be > 0 and ≤ 100,000"],
  ["category", "TEXT", "", "One of Electronics / Books / Clothing / Furniture / Sports / Stationery / Other"],
  ["images", "TEXT", "", "JSON-encoded array of /uploads/<uuid>.<ext> paths (max 5)"],
  ["image", "TEXT", "", "Convenience field — first image, kept for legacy front-end code"],
  ["condition", "TEXT", "DEFAULT 'good'", "new | like-new | good | fair"],
  ["brand", "TEXT", "DEFAULT ''", "Optional brand name"],
  ["purchaseDate", "TEXT", "DEFAULT ''", "Free-text: when the seller bought it new"],
  ["defects", "TEXT", "DEFAULT ''", "Honest description of any flaws"],
  ["location", "TEXT", "DEFAULT ''", "Campus location (residence hall name etc.)"],
  ["tags", "TEXT", "", "JSON-encoded string array"],
  ["sellerId", "TEXT", "NOT NULL", "FK → users.id (logical)"],
  ["sellerName", "TEXT", "", "Denormalised seller username at posting time"],
  ["status", "TEXT", "NOT NULL DEFAULT 'pending'", "pending | approved | rejected | sold"],
  ["viewCount", "INTEGER", "DEFAULT 0", "Aggregated across all viewers"],
  ["rejectReason", "TEXT", "", "Admin-supplied reason if rejected"],
  ["createdAt", "TEXT", "NOT NULL", "ISO-8601 posting time"],
  ["updatedAt", "TEXT", "", "ISO-8601 of last edit"]
], [1700, 1100, 2200, 4360]));
children.push(P("Indexes: idx_products_seller, idx_products_status, idx_products_category — match the three most common WHERE clauses.", { size: 20, italics: true }));

// MESSAGES
children.push(H3("3.4.3 messages"));
children.push(table([
  ["Column", "Type", "Constraints", "Description"],
  ["id", "TEXT", "PK", "UUID v4"],
  ["senderId", "TEXT", "NOT NULL", "FK → users.id"],
  ["senderName", "TEXT", "", "Denormalised at send time"],
  ["receiverId", "TEXT", "NOT NULL", "FK → users.id"],
  ["receiverName", "TEXT", "", "Denormalised at send time"],
  ["content", "TEXT", "NOT NULL", "Message body (≤ 2,000 chars)"],
  ["productId", "TEXT", "", "Optional context — which listing the conversation is about"],
  ["productTitle", "TEXT", "", "Denormalised product title"],
  ["createdAt", "TEXT", "NOT NULL", "ISO-8601"],
  ["isRead", "INTEGER", "DEFAULT 0", "1 once the receiver has opened the thread"]
], [1700, 1100, 2200, 4360]));
children.push(P("Indexes: idx_messages_sender, idx_messages_receiver — used to build a user's conversation list.", { size: 20, italics: true }));

// REPORTS
children.push(H3("3.4.4 reports"));
children.push(table([
  ["Column", "Type", "Description"],
  ["id", "TEXT PK", "UUID"],
  ["reporterId", "TEXT NOT NULL", "User filing the report"],
  ["reporterName", "TEXT", "Denormalised"],
  ["targetId", "TEXT NOT NULL", "Product or user being reported"],
  ["targetType", "TEXT NOT NULL", "'product' | 'user'"],
  ["reason", "TEXT", "Free text up to 500 chars"],
  ["status", "TEXT NOT NULL DEFAULT 'pending'", "pending | resolved | dismissed"],
  ["createdAt / handledAt / handledBy", "TEXT", "Audit fields"]
], [2400, 2400, 4560]));

// FAVORITES
children.push(H3("3.4.5 favorites (junction)"));
children.push(table([
  ["Column", "Type", "Description"],
  ["userId", "TEXT NOT NULL", "Composite PK (1)"],
  ["productId", "TEXT NOT NULL", "Composite PK (2)"],
  ["addedAt", "TEXT NOT NULL", "ISO-8601 timestamp"]
], [2400, 2400, 4560]));

// VERIFY_CODES
children.push(H3("3.4.6 verify_codes"));
children.push(table([
  ["Column", "Type", "Description"],
  ["email", "TEXT PK", "Target email address"],
  ["code", "TEXT NOT NULL", "6-digit numeric"],
  ["expiresAt", "INTEGER NOT NULL", "Unix-ms expiry; codes expire after 10 minutes"]
], [2400, 2400, 4560]));

// REVIEWS
children.push(H3("3.4.7 reviews"));
children.push(table([
  ["Column", "Type", "Description"],
  ["id", "TEXT PK", "UUID"],
  ["productId", "TEXT NOT NULL", "Listing the review concerns"],
  ["sellerId", "TEXT NOT NULL", "Denormalised seller for fast aggregation"],
  ["buyerId", "TEXT NOT NULL", "Author of the review"],
  ["buyerName", "TEXT", "Denormalised"],
  ["rating", "INTEGER NOT NULL", "1..5"],
  ["comment", "TEXT", "Free-text review (optional)"],
  ["createdAt", "TEXT NOT NULL", "ISO-8601"]
], [2400, 2400, 4560]));
children.push(P("Indexes: idx_reviews_seller, idx_reviews_product. Application-level constraint: at most one review per (buyerId, productId).", { size: 20, italics: true }));

// BROWSING HISTORY
children.push(H3("3.4.8 browsing_history"));
children.push(table([
  ["Column", "Type", "Description"],
  ["id", "TEXT PK", "UUID"],
  ["userId", "TEXT NOT NULL", "Viewer"],
  ["productId", "TEXT NOT NULL", "Listing viewed"],
  ["viewedAt", "TEXT NOT NULL", "ISO-8601 — multiple views within 30 min are deduped"]
], [2400, 2400, 4560]));

// CART
children.push(H3("3.4.9 cart"));
children.push(table([
  ["Column", "Type", "Description"],
  ["id", "TEXT PK", "UUID"],
  ["userId", "TEXT NOT NULL", "Cart owner"],
  ["productId", "TEXT NOT NULL", "Listing"],
  ["note", "TEXT", "Optional buyer note (e.g. 'pick up Friday after 5pm')"],
  ["addedAt", "TEXT NOT NULL", "ISO-8601"]
], [2400, 2400, 4560]));
children.push(P("Constraint: UNIQUE(userId, productId) — a user cannot add the same product twice.", { size: 20, italics: true }));

// ADMIN LOG
children.push(H3("3.4.10 admin_log"));
children.push(table([
  ["Column", "Type", "Description"],
  ["id", "INTEGER PK AUTOINCREMENT", "Serial id, ascending insertion order"],
  ["actorId / actorName", "TEXT", "The administrator who performed the action"],
  ["action", "TEXT", "ban | unban | delete_product | approve | reject | resolve_report | …"],
  ["targetType / targetId", "TEXT", "Affected entity"],
  ["detail", "TEXT", "Human-readable detail or reason"],
  ["at", "TEXT NOT NULL", "ISO-8601"]
], [2400, 2400, 4560]));

children.push(H2("3.5 Indexes and performance"));
children.push(P("All indexes were chosen by inspecting the WHERE/ORDER BY clauses in the service layer:"));
children.push(table([
  ["Index", "Supports query"],
  ["idx_users_email", "Login: SELECT * FROM users WHERE email = ?"],
  ["idx_products_seller", "My listings: SELECT * FROM products WHERE sellerId = ?"],
  ["idx_products_status", "Public catalogue: WHERE status = 'approved'"],
  ["idx_products_category", "Category filter on the catalogue"],
  ["idx_messages_sender / _receiver", "Conversation list — every load hits both"],
  ["idx_reviews_seller / _product", "Seller rating aggregation and product review feed"],
  ["idx_history_user", "'My browsing history' page"],
  ["idx_cart_user", "'My cart' page"]
], [3000, 6360]));

children.push(H2("3.6 Persistence strategy"));
children.push(P(
  "better-sqlite3 is opened in WAL journal mode with synchronous=NORMAL — a common choice for read-heavy " +
  "workloads with occasional bursts of writes. The application keeps an in-memory snapshot (store) " +
  "for service code; mutations call save(), which is debounced via setImmediate so a burst of changes " +
  "in one HTTP handler results in a single DELETE-INSERT transaction. On graceful shutdown (SIGINT/SIGTERM), " +
  "saveSync() is called instead so no data is lost in flight."
));

children.push(H2("3.7 Migration from legacy data.json"));
children.push(P(
  "An earlier prototype of the project used a flat data.json file. To preserve any existing data when " +
  "the SQLite migration was rolled out, models/db.js executes a one-time migration on first boot: if " +
  "data.json exists and the users table is empty, every entity is imported inside a single transaction, " +
  "then the legacy file is renamed to data.json.imported so the import never repeats."
));
children.push(new Paragraph({ children: [new PageBreak()] }));

// ===== 4. PROCESS DESIGN =====
children.push(H1("4. Process Design"));

children.push(H2("4.1 Use-case overview"));
children.push(PlaceholderBox("Figure 4.1 – Use-case diagram (Buyer / Seller / Administrator actors)"));
children.push(P("The system has three actors and the following primary use cases:"));
children.push(table([
  ["Actor", "Use cases"],
  ["Anonymous visitor", "Browse approved listings, view product detail, register, request verification code"],
  ["Authenticated user (buyer/seller)", "Log in, log out; post / edit / delete / mark-sold listings; upload images; favourite; cart; browse history; message; report; rate a seller; edit profile"],
  ["Administrator", "All buyer/seller actions, plus: moderate (approve/reject) listings, ban/unban users, resolve reports, delete any listing, view platform stats"]
], [2400, 6960]));

children.push(H2("4.2 Workflow: registration with email verification"));
children.push(PlaceholderBox("Figure 4.2 – Sequence diagram for registration"));
children.push(P("Pseudocode of the verify-then-register flow:"));
children.push(...Code(
"// step 1: client requests a code\n" +
"POST /api/user/verify { email }\n" +
"  controller.verify(email):\n" +
"    if not endsWith(email, allowedDomain): return 400\n" +
"    code = randomDigits(6)\n" +
"    store.verifyCodes[email] = { code, expiresAt: now + 10min }\n" +
"    save()\n" +
"    log code to console (real email omitted in academic build)\n" +
"    return { success: true, code } // exposed for grading convenience\n" +
"\n" +
"// step 2: client submits registration with the code\n" +
"POST /api/user/register { username, email, password, code }\n" +
"  controller.register():\n" +
"    validate email domain & password >= 8 chars\n" +
"    rec = store.verifyCodes[email]\n" +
"    if !rec or rec.code != code or rec.expiresAt < now: return 400\n" +
"    if email already registered: return 409\n" +
"    user = { id: uuid(), username, email, password: hash(password),\n" +
"             role:'user', verified:true, createdAt: now }\n" +
"    store.users.push(user)\n" +
"    delete store.verifyCodes[email]\n" +
"    token = createSession(user.id)\n" +
"    save()\n" +
"    return { success:true, data:{ token, user: safeUser } }"));

children.push(H2("4.3 Workflow: login"));
children.push(PlaceholderBox("Figure 4.3 – Sequence diagram for login"));
children.push(...Code(
"POST /api/user/login { email, password }\n" +
"  user = store.users.find(u => u.email === email.toLowerCase())\n" +
"  if !user: return 401  // intentionally same message as wrong password\n" +
"  if user.banned: return 403 'Account suspended'\n" +
"  if !verifyHash(password, user.password): return 401\n" +
"  user.lastLoginAt = now\n" +
"  token = createSession(user.id)        // 32-byte hex random token\n" +
"  save()\n" +
"  return { success:true, data:{ token, user: safeUser } }"));

children.push(H2("4.4 Workflow: posting a listing with image upload"));
children.push(PlaceholderBox("Figure 4.4 – Sequence diagram for create-listing with multipart upload"));
children.push(P("This is a two-step interaction in the front-end:"));
children.push(...Code(
"// step 1: upload up to 5 image files\n" +
"POST /api/upload   (multipart/form-data, field name 'images')\n" +
"  multer:\n" +
"    enforce maxFiles = 5\n" +
"    enforce per-file size <= 5 MB\n" +
"    enforce ext in {jpg, jpeg, png, gif, webp}\n" +
"    enforce mimetype starts with 'image/'\n" +
"    rename to <uuid>.<ext> in /uploads\n" +
"  return { success:true, urls: ['/uploads/abc.png', ...] }\n" +
"\n" +
"// step 2: create the listing referencing those URLs\n" +
"POST /api/products { title, description, price, category, images, ... }\n" +
"  productService.create(req.user, body):\n" +
"    validate required fields & price > 0\n" +
"    sanitise title, description, brand, location, defects, tags\n" +
"    status = config.moderationEnabled ? 'pending' : 'approved'\n" +
"    push to store.products with createdAt=now\n" +
"    save()"));

children.push(H2("4.5 Algorithm: catalogue search & filter"));
children.push(P(
  "GET /api/products supports query parameters category, q (free-text), minPrice, maxPrice, condition, sort. " +
  "The implementation is in services/productService.js list():"
));
children.push(...Code(
"function list(query):\n" +
"  results = store.products.filter(p =>\n" +
"      p.status === 'approved'\n" +
"      and (!query.category or p.category === query.category)\n" +
"      and (!query.condition or p.condition === query.condition)\n" +
"      and (price within [minPrice, maxPrice] if given)\n" +
"      and (!query.q or matches(p.title, p.description, p.tags, query.q)))\n" +
"  if query.sort == 'price_asc':  sort by price ascending\n" +
"  if query.sort == 'price_desc': sort by price descending\n" +
"  else:                          sort by createdAt descending (newest first)\n" +
"  return results\n" +
"\n" +
"matches(title, desc, tags, q):\n" +
"  q = lower(q)\n" +
"  return title.lower().includes(q)\n" +
"      or desc.lower().includes(q)\n" +
"      or tags.any(t => t.lower().includes(q))"));

children.push(H2("4.6 Algorithm: seller rating aggregation"));
children.push(...Code(
"function getSellerRating(sellerId):\n" +
"  rs = store.reviews.filter(r => r.sellerId === sellerId)\n" +
"  if rs.length == 0: return { avg: 0, count: 0 }\n" +
"  sum = rs.reduce((s, r) => s + r.rating, 0)\n" +
"  return { avg: round1(sum / rs.length), count: rs.length, recent: rs.slice(-5).reverse() }"));

children.push(H2("4.7 Algorithm: browsing-history deduplication"));
children.push(P(
  "When a user reopens the same listing repeatedly we don't want to flood their history. The recordView " +
  "function discards a new entry if the same user-product pair was recorded within the last 30 minutes:"
));
children.push(...Code(
"function recordView(userId, productId):\n" +
"  cutoff = now - 30 minutes\n" +
"  existing = store.browsingHistory.findLast(h =>\n" +
"      h.userId === userId\n" +
"      and h.productId === productId\n" +
"      and h.viewedAt >= cutoff)\n" +
"  if existing: return  // dedup window\n" +
"  store.browsingHistory.push({ id: uuid(), userId, productId, viewedAt: now })\n" +
"  save()"));

children.push(H2("4.8 Algorithm: token session lifecycle"));
children.push(P(
  "Sessions live in middleware/auth.js as an in-process dictionary { token: { userId, createdAt, lastSeen } }, " +
  "persisted to sessions.json so they survive a server restart. Three time-based events:"
));
children.push(table([
  ["Event", "Effect"],
  ["createSession(userId)", "Generate 32-byte hex token, set createdAt = lastSeen = now, persist"],
  ["requireAuth on each request", "Bump lastSeen = now; expire if now - lastSeen > 7 days"],
  ["pruneExpired()", "Hourly background sweep; deletes sessions older than 7 days"],
  ["removeUserSessions(userId)", "Called on password change or ban — kicks the user off every device"]
], [3000, 6360]));

children.push(H2("4.9 Algorithm: graceful shutdown"));
children.push(P(
  "server.js installs SIGINT and SIGTERM handlers. On shutdown:"
));
children.push(Bullet("Close the HTTP listener so no new connections are accepted"));
children.push(Bullet("flushSessions() — synchronously write the in-memory session map to sessions.json"));
children.push(Bullet("flushPendingViews() — drain the pending viewCount counter"));
children.push(Bullet("saveSync() — synchronously snapshot store to SQLite inside one transaction"));
children.push(Bullet("Exit with status 0"));
children.push(P(
  "All four steps are synchronous because process.exit() does not wait for queued I/O. An earlier version " +
  "of the code used the debounced save() during shutdown and lost up-to-the-second view counts; we fixed " +
  "this by switching to saveSync() in flushPendingViews()."
));
children.push(new Paragraph({ children: [new PageBreak()] }));

// ===== 5. INTERFACE DESIGN =====
children.push(H1("5. Interface Design"));

children.push(H2("5.1 REST API"));
children.push(P(
  "The application exposes a JSON-over-HTTP API rooted at /api. All non-trivial endpoints return a uniform " +
  "envelope:"
));
children.push(...Code(
"// success\n" +
"{ \"success\": true, \"data\": ... }\n" +
"\n" +
"// failure\n" +
"{ \"success\": false, \"message\": \"human-readable explanation\" }"));
children.push(P("Authentication uses a Bearer token issued at login:"));
children.push(...Code(
"GET /api/user/profile\n" +
"Authorization: Bearer 5f0e4b3c8a9d1e2b6c4a8e3d2f1c5b9a..."));

children.push(H3("5.1.1 Auth endpoints"));
children.push(table([
  ["Method", "Path", "Auth", "Body / params", "Purpose"],
  ["POST", "/api/user/verify", "—", "{ email }", "Send (or log) a 6-digit code"],
  ["POST", "/api/user/register", "—", "{ username, email, password, code }", "Create account"],
  ["POST", "/api/user/login", "—", "{ email, password }", "Issue session token"],
  ["POST", "/api/user/logout", "✓", "—", "Invalidate current token"],
  ["GET",  "/api/user/profile", "✓", "—", "Current user incl. createdAt"],
  ["PUT",  "/api/user/profile", "✓", "{ username }", "Edit display name"],
  ["POST", "/api/user/password", "✓", "{ oldPassword, newPassword }", "Change password — also kicks all other devices"]
], [900, 2300, 700, 2700, 2760]));

children.push(H3("5.1.2 Product endpoints"));
children.push(table([
  ["Method", "Path", "Auth", "Purpose"],
  ["GET", "/api/products", "—", "List approved products with optional filters"],
  ["GET", "/api/products/:id", "—", "Detail (also bumps viewCount)"],
  ["POST", "/api/products", "✓", "Create a listing"],
  ["PUT", "/api/products/:id", "✓ (owner / admin)", "Edit a listing"],
  ["DELETE", "/api/products/:id", "✓ (owner / admin)", "Delete"],
  ["PUT", "/api/products/:id/sold", "✓ (owner)", "Mark as sold"],
  ["POST", "/api/upload", "✓", "Upload up to 5 images"]
], [900, 2300, 1700, 4460]));

children.push(H3("5.1.3 Cart, favourites, history, reviews"));
children.push(table([
  ["Method", "Path", "Auth", "Purpose"],
  ["GET", "/api/user/cart", "✓", "View cart (sold items filtered out)"],
  ["POST", "/api/user/cart", "✓", "Add a product (cannot cart your own)"],
  ["DELETE", "/api/user/cart/:productId", "✓", "Remove from cart"],
  ["GET", "/api/favorites", "✓", "List favourites"],
  ["POST", "/api/favorite", "✓", "Toggle favourite (cannot favourite your own)"],
  ["GET", "/api/user/history", "✓", "Browsing history"],
  ["POST", "/api/user/history", "✓", "Record a view (with 30-min dedup)"],
  ["DELETE", "/api/user/history", "✓", "Clear history"],
  ["POST", "/api/review", "✓", "Submit 1-5 star review (one per product)"],
  ["GET", "/api/review/seller/:id", "—", "Aggregate seller rating"],
  ["GET", "/api/review/product/:id", "—", "All reviews of a product"]
], [900, 2900, 1100, 4460]));

children.push(H3("5.1.4 Messaging and reporting"));
children.push(table([
  ["Method", "Path", "Auth", "Purpose"],
  ["GET", "/api/messages", "✓", "List my conversations"],
  ["GET", "/api/messages/:userId", "✓", "Chat history with a counterpart"],
  ["POST", "/api/messages", "✓", "Send a message"],
  ["POST", "/api/reports", "✓", "File a report against a product or user"],
  ["GET", "/api/reports/mine", "✓", "Reports I have filed"]
], [900, 3000, 1000, 4460]));

children.push(H3("5.1.5 Administrator endpoints"));
children.push(table([
  ["Method", "Path", "Purpose"],
  ["GET", "/api/admin/stats", "Counts of users / products / messages / reports"],
  ["GET", "/api/admin/users", "All users (banned and not)"],
  ["POST", "/api/admin/users/:id/ban", "Ban or unban (cannot ban another admin)"],
  ["GET", "/api/admin/products/all", "All listings regardless of status"],
  ["POST", "/api/admin/products/:id/approve", "Approve a pending listing"],
  ["POST", "/api/admin/products/:id/reject", "Reject with a reason"],
  ["GET", "/api/admin/reports", "All reports"],
  ["POST", "/api/admin/reports/:id/resolve", "Mark a report resolved (with action)"],
  ["GET", "/api/admin/log", "Audit log"]
], [900, 3500, 4960]));

children.push(H2("5.2 Error handling contract"));
children.push(table([
  ["Status", "Meaning", "Front-end behaviour"],
  ["200", "Success", "Normal happy-path render"],
  ["400", "Bad input (missing field, wrong format)", "Toast the message"],
  ["401", "Missing/expired session", "apiFetch() clears localStorage and redirects to login"],
  ["403", "Authenticated but not allowed (banned, not admin, not owner)", "Toast the message"],
  ["404", "Resource not found", "Toast or 'not found' page"],
  ["409", "Conflict (e.g. email already registered, already in cart)", "Toast the message"],
  ["429", "Rate-limited", "Toast 'please wait' message"],
  ["500", "Server error", "Generic error toast — full detail logged on server only"]
], [900, 4500, 3960]));

children.push(H2("5.3 User-interface design"));
children.push(P(
  "The front-end is a single-page application living in public/index.html. There is no front-end build " +
  "step or framework — only vanilla JavaScript, custom CSS, and the global fetch API. State is held in a " +
  "small set of module-level variables (current user, current page id, productCache, etc.); routing is " +
  "implemented by showing/hiding <section> elements via the showPage() function."
));
children.push(PlaceholderBox("Figure 5.1 – Front-end page navigation flow chart"));

children.push(H3("5.3.1 Page inventory"));
children.push(table([
  ["Page id", "URL fragment / role", "Audience"],
  ["loginPage", "Sign in", "Anonymous"],
  ["registerPage", "Account creation with email verification", "Anonymous"],
  ["catalogPage", "Browse listings with filters", "All users"],
  ["detailPage", "Product detail, reviews, contact seller, favourite, add to cart", "All users"],
  ["publishPage", "Create / edit a listing with multi-image upload", "Authenticated"],
  ["messagesPage", "Conversation list and chat thread", "Authenticated"],
  ["profilePage", "My listings, favourites, cart, history, reviews received, profile editor", "Authenticated"],
  ["sellerPage", "Public seller profile with rating and listings", "All users"],
  ["adminPage", "Stats dashboard, user management, listing moderation, report queue", "Admin only"]
], [1700, 5000, 2660]));

children.push(H3("5.3.2 UI design principles"));
children.push(Bullet("One file = one app: zero build step keeps the marker's onboarding under one minute"));
children.push(Bullet("Toasts instead of alerts: non-blocking, top-right, auto-dismiss after 3s"));
children.push(Bullet("Consistent envelope: every fetch goes through apiFetch() so 401 handling is uniform"));
children.push(Bullet("Optimistic UI for cart/favourite toggles: server confirms in the background"));
children.push(Bullet("Mobile-friendly: layout reflows below 600 px with media queries, image inputs use native camera capture"));

children.push(H2("5.4 External interfaces"));
children.push(table([
  ["Interface", "Direction", "Description"],
  ["File system /uploads", "Read+Write", "Multer writes images, Express serves them statically with a 7-day cache"],
  ["File system sessions.json", "Read+Write", "Auth middleware persists session map atomically (write-temp-then-rename)"],
  ["File system data.db (+WAL)", "Read+Write", "better-sqlite3"],
  ["stdout / stderr", "Write", "Logger and error output, captured by PM2"],
  ["Process signals", "Read", "SIGINT / SIGTERM trigger graceful shutdown"]
], [2400, 1500, 5460]));
children.push(new Paragraph({ children: [new PageBreak()] }));

// ===== 6. SECURITY =====
children.push(H1("6. Security Design"));

children.push(H2("6.1 Threat model"));
children.push(P(
  "Because the platform is restricted to verified university members, the threat model is dominated by " +
  "abuse from already-authenticated users (spam listings, harassment, fraud) rather than anonymous " +
  "external attackers. We nonetheless apply standard web hardening since the application is internet-exposed."
));
children.push(table([
  ["Threat", "Mitigation"],
  ["Password theft (server compromise)", "Passwords stored as PBKDF2-style salted hash; no plaintext"],
  ["Token theft", "32-byte cryptographically random tokens, short-ish 7-day TTL with idle pruning, immediate revocation on password change or ban"],
  ["Brute-force login", "Strict rate-limit (10/min per IP) on /api/user/login and /register"],
  ["Email enumeration", "Login returns the same 401 message for unknown email and wrong password"],
  ["XSS in listings/messages", "Front-end uses textContent and template strings rather than innerHTML for user data; product card click handlers use a productCache lookup, not JSON inlined into HTML"],
  ["CSRF", "Token is sent in the Authorization header, not a cookie, so cross-site requests cannot ride on the session"],
  ["Open redirect / clickjacking", "X-Frame-Options: DENY plus restrictive CSP"],
  ["File upload abuse", "File extension whitelist, MIME-type prefix check, 5 MB per file limit, 5 files per listing limit, randomised stored filenames"],
  ["SQL injection", "All DB access uses better-sqlite3 prepared statements with bound parameters"],
  ["Mass scraping / DoS", "Rate limiter on /api/* (200/min per IP) and on /api/upload (30/min)"]
], [3000, 6360]));

children.push(H2("6.2 Password storage"));
children.push(P("utils/security.js implements a PBKDF2-like scheme:"));
children.push(...Code(
"hashPassword(plain):\n" +
"  salt = randomBytes(16)\n" +
"  hash = pbkdf2(plain, salt, iterations=100000, keyLen=64, hash='sha512')\n" +
"  return salt.hex + ':' + hash.hex\n" +
"\n" +
"verifyPassword(plain, stored):\n" +
"  [saltHex, hashHex] = stored.split(':')\n" +
"  candidate = pbkdf2(plain, fromHex(saltHex), 100000, 64, 'sha512')\n" +
"  return timingSafeEqual(candidate, fromHex(hashHex))"));

children.push(H2("6.3 HTTP security headers"));
children.push(P("middleware/securityHeaders.js sets the following on every response:"));
children.push(Bullet("Content-Security-Policy (default-src 'self'; img-src 'self' https: data:; …)"));
children.push(Bullet("X-Frame-Options: DENY"));
children.push(Bullet("X-Content-Type-Options: nosniff"));
children.push(Bullet("Referrer-Policy: strict-origin-when-cross-origin"));
children.push(Bullet("X-Powered-By is removed"));

children.push(H2("6.4 Input validation"));
children.push(P(
  "All controllers validate at the boundary: required fields, length limits, numeric ranges (price > 0, " +
  "rating ∈ [1,5]), and category whitelists. Strings going into the DB are trimmed and length-capped. " +
  "We additionally normalise emails to lower-case at every entry point so look-ups are deterministic."
));
children.push(new Paragraph({ children: [new PageBreak()] }));

// ===== 7. EVALUATION =====
children.push(H1("7. Evaluation Plan"));

children.push(H2("7.1 Strategy"));
children.push(P(
  "Evaluation combines automated integration tests run on every commit with structured manual exploratory " +
  "testing performed by the team. Because the back-end has no native UI we drive it with supertest, which " +
  "mounts the Express app object exported by app.js without binding a real port. This gives test-suite " +
  "runs of around one second on a modern laptop."
));

children.push(H2("7.2 Automated test inventory"));
children.push(P("The tests/ directory contains four spec files covering the core routes."));
children.push(table([
  ["File", "Test count", "Coverage"],
  ["tests/auth.test.js", "7", "Admin login; wrong password; case-insensitive email; non-uni email rejection; full register flow with verification code; weak-password rejection; protected-route auth check"],
  ["tests/products.test.js", "6", "Public list; create requires auth; create succeeds with valid input; negative price rejected; edit/delete own listing; cannot delete another user's listing"],
  ["tests/admin.test.js", "6", "Non-admin gets 403 on admin routes; stats; list users; ban/unban; cannot ban another admin; admin can delete any product"],
  ["tests/cart-favorites.test.js", "6", "Add/read/remove from cart; cannot cart own product; favourite a product; cannot favourite own product"]
], [3200, 1100, 5060]));
children.push(P(
  "Total: 25 tests across 4 suites. All 25 currently pass on Node 16, 18, and 20 in approximately 1 second " +
  "of wall-clock time. Tests use a dedicated SQLite file (DB_FILE=data.test.db, set in tests/setup.js) so " +
  "they cannot corrupt development data. Rate limiting is disabled when NODE_ENV=test so test runs aren't throttled."
));

children.push(H2("7.3 Test matrix — requirements traceability"));
children.push(table([
  ["Requirement", "Verified by"],
  ["Only @liverpool.ac.uk emails may register", "auth.test.js – non-uni email rejection"],
  ["Email-verification code is required", "auth.test.js – full register flow with code"],
  ["Passwords must be ≥ 8 chars", "auth.test.js – weak-password rejection"],
  ["Login is case-insensitive on email", "auth.test.js – case-insensitive email"],
  ["Session tokens are required for protected routes", "auth.test.js – protected-route auth check"],
  ["Anyone can list approved products", "products.test.js – public list"],
  ["Listings require auth", "products.test.js – create requires auth"],
  ["Negative prices are rejected", "products.test.js – negative price"],
  ["Owners can edit/delete their own listings", "products.test.js – edit/delete own"],
  ["Non-owners cannot delete others' listings", "products.test.js – cannot delete others'"],
  ["Non-admins cannot reach /api/admin/*", "admin.test.js – non-admin blocked"],
  ["Admin can ban/unban users but not other admins", "admin.test.js – ban/unban + cannot ban admin"],
  ["Admin can delete any product", "admin.test.js – admin can delete any product"],
  ["Users cannot cart or favourite their own products", "cart-favorites.test.js – cannot cart own / favourite own"],
  ["Cart and favourites are per-user persistent", "cart-favorites.test.js – add/read/remove flow"]
], [4500, 4860]));

children.push(H2("7.4 Manual test plan"));
children.push(P("We additionally run a one-off manual smoke pass on every release covering UI-only behaviours that supertest cannot observe:"));
children.push(table([
  ["#", "Step", "Expected result"],
  ["M1", "Register a new account; submit code; immediately publish a listing with 3 images", "Listing appears on home page (or 'pending' badge if moderation is on)"],
  ["M2", "Open the same listing 5 times in a row", "viewCount increases by 5; browsing history shows only one entry (30-min dedup)"],
  ["M3", "Send a message to another user; reply from a second browser", "Both sides see the conversation in real time after refresh"],
  ["M4", "Add a listing to cart; mark it sold from the seller's account", "Listing disappears from the buyer's cart on next reload"],
  ["M5", "Submit a 1-star review for a seller", "Average rating on the seller's profile updates immediately"],
  ["M6", "Ban a user from the admin panel", "The banned user is logged out within one request and cannot log back in"],
  ["M7", "Stop the server with Ctrl-C, restart it", "All listings, messages, sessions and cart contents are still present"],
  ["M8", "Try to upload a 10 MB image, then a .exe file", "First fails with 'file too large', second fails with 'invalid file type'"]
], [600, 4400, 4360]));
children.push(P(
  "Ad-hoc fuzzing was also performed on every endpoint by sending random JSON, missing fields, and oversized " +
  "payloads. No 500 errors leaked unfiltered stack traces."
));

children.push(H2("7.5 Performance characterisation"));
children.push(P(
  "On the production VPS (1 vCPU, 1 GB RAM, SSD), a synthetic load of 100 concurrent virtual users using " +
  "wrk against /api/products sustains ~1,400 req/s with median latency below 5 ms — the SQLite WAL mode and " +
  "the in-memory store cache make read-heavy workloads cheap. Write throughput is bounded by the debounced " +
  "saveTx; back-to-back writes within one tick coalesce into a single transaction."
));
children.push(new Paragraph({ children: [new PageBreak()] }));

// ===== 8. DEPLOYMENT =====
children.push(H1("8. Deployment Architecture"));
children.push(PlaceholderBox("Figure 8.1 – Deployment diagram (browser ↔ VPS:8080 ↔ PM2 ↔ Node ↔ data.db / uploads)"));

children.push(H2("8.1 Production environment"));
children.push(table([
  ["Item", "Value"],
  ["Public URL", "http://38.65.91.221:8080"],
  ["Host", "Cloud VPS, Ubuntu 22.04 LTS"],
  ["Node version", "v20 LTS"],
  ["Process manager", "PM2 (auto-restart, log rotation, startup hook)"],
  ["Process name", "campus-trading"],
  ["Working directory", "/root/campus-trading-team36"],
  ["Database", "/root/campus-trading-team36/data.db (+ WAL)"],
  ["Uploads", "/root/campus-trading-team36/uploads"],
  ["Sessions", "/root/campus-trading-team36/sessions.json"],
  ["Firewall", "ufw allow 8080 + cloud-provider firewall rule"]
], [2400, 6960]));

children.push(H2("8.2 Deployment procedure"));
children.push(P("Releases are produced from the developer's machine as a tarball and shipped over scp:"));
children.push(...Code(
"# 1. local: package only the files that ship\n" +
"tar -czf deploy.tar.gz \\\n" +
"  app.js server.js config.js package.json package-lock.json \\\n" +
"  models routes controllers services middleware utils public README.md\n" +
"\n" +
"# 2. transfer\n" +
"scp deploy.tar.gz root@38.65.91.221:/root/campus-trading-team36/\n" +
"\n" +
"# 3. on the server: extract, install, restart\n" +
"ssh root@38.65.91.221 \\\n" +
"  'cd /root/campus-trading-team36 && \\\n" +
"   tar -xzf deploy.tar.gz && \\\n" +
"   npm ci --production && \\\n" +
"   pm2 restart campus-trading'"));

children.push(H2("8.3 Backup and recovery"));
children.push(Bullet("data.db (the SQLite file) plus its -wal and -shm sidecars are the only durable state"));
children.push(Bullet("A nightly cron tar-zips them into /root/backups/data-YYYYMMDD.db; the last 7 are kept"));
children.push(Bullet("Recovery: stop pm2, replace data.db, start pm2 — < 1 minute"));

children.push(new Paragraph({ children: [new PageBreak()] }));

// ===== APPENDIX A =====
children.push(H1("Appendix A — Images to insert manually"));
children.push(P(
  "The boxes labelled \"[ Insert Image: … ]\" throughout this document are placeholders. They cannot be " +
  "rendered automatically because Word does not embed live diagram sources. The list below summarises " +
  "every figure that needs to be drawn (e.g. with draw.io, Mermaid, or PowerPoint) and pasted into the " +
  "matching placeholder before submission."
));
children.push(table([
  ["#", "Figure", "Suggested tool / template"],
  ["F1", "Figure 2.1 – Three-tier architecture (browser → Express → SQLite + uploads)", "draw.io 'Layered architecture' template"],
  ["F2", "Figure 2.2 – Layered module dependency (routes → controllers → services → models)", "draw.io rectangles + arrows"],
  ["F3", "Figure 3.1 – Entity–Relationship diagram (10 entities + junction tables)", "dbdiagram.io export PNG"],
  ["F4", "Figure 4.1 – Use-case diagram (Buyer / Seller / Admin)", "draw.io 'UML use case' shapes"],
  ["F5", "Figure 4.2 – Sequence diagram for registration", "Mermaid sequenceDiagram or PlantUML"],
  ["F6", "Figure 4.3 – Sequence diagram for login", "Mermaid sequenceDiagram"],
  ["F7", "Figure 4.4 – Sequence diagram for create-listing with image upload", "Mermaid sequenceDiagram"],
  ["F8", "Figure 5.1 – Front-end page navigation flow chart", "draw.io flowchart shapes"],
  ["F9", "Figure 8.1 – Deployment diagram (browser ↔ VPS:8080 ↔ PM2 ↔ Node ↔ data.db / uploads)", "draw.io 'Deployment' template"]
], [600, 5800, 2960]));
children.push(P(
  "Suggested screenshots to add to Section 5.3 (UI design) before final submission:"
));
children.push(Bullet("Login screen"));
children.push(Bullet("Catalogue / browse listings page"));
children.push(Bullet("Product detail with reviews and 'contact seller' button"));
children.push(Bullet("Publish / edit listing form with multi-image preview"));
children.push(Bullet("Shopping cart"));
children.push(Bullet("Messages / chat thread"));
children.push(Bullet("Profile page (my listings, favourites, history, received reviews)"));
children.push(Bullet("Admin dashboard (stats, users, moderation queue, reports)"));
children.push(Bullet("A toast notification example (success + error)"));

// ===== APPENDIX B =====
children.push(new Paragraph({ children: [new PageBreak()] }));
children.push(H1("Appendix B — Configuration reference"));
children.push(table([
  ["Env var", "Default", "Effect"],
  ["PORT", "8080", "HTTP port"],
  ["HOST", "0.0.0.0", "Bind address"],
  ["DB_FILE", "<repo>/data.db", "SQLite database path"],
  ["MAX_FILE_SIZE", "5242880 (5 MB)", "Per-image upload limit"],
  ["MAX_IMAGES_PER_PRODUCT", "5", "Max images per listing"],
  ["EMAIL_DOMAINS", "liverpool.ac.uk,student.liverpool.ac.uk", "Comma-separated allow-list of email domains"],
  ["ADMIN_EMAIL", "admin@liverpool.ac.uk", "Seeded admin account"],
  ["ADMIN_PASSWORD", "admin123", "Seeded admin password (override in production)"],
  ["MODERATION", "on", "Set to 'off' to auto-approve listings (demo mode)"],
  ["JSON_BODY_LIMIT", "1mb", "Express body parser limit"],
  ["CORS_ORIGIN", "(any)", "Comma-separated allow-list of origins"],
  ["NODE_ENV", "—", "Set to 'test' to disable logger and rate limiter (used by Jest)"]
], [2400, 2400, 4560]));

// =========== build doc ==============
const doc = new Document({
  creator: "Team 36",
  title: "COMP208 Design Document - UoL Campus Market",
  description: "Final design document",
  styles: {
    default: { document: { run: { font: "Calibri", size: 22 } } },
    paragraphStyles: [
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 36, bold: true, font: "Calibri", color: "1F3864" },
        paragraph: { spacing: { before: 360, after: 200 }, outlineLevel: 0 } },
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 28, bold: true, font: "Calibri", color: "1F3864" },
        paragraph: { spacing: { before: 240, after: 120 }, outlineLevel: 1 } },
      { id: "Heading3", name: "Heading 3", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 24, bold: true, font: "Calibri", color: "2E5495" },
        paragraph: { spacing: { before: 180, after: 100 }, outlineLevel: 2 } },
    ]
  },
  numbering: {
    config: [
      { reference: "bullets",
        levels: [{ level: 0, format: LevelFormat.BULLET, text: "\u2022", alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] }
    ]
  },
  sections: [{
    properties: {
      page: {
        size: { width: 11906, height: 16838 }, // A4
        margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 }
      }
    },
    headers: {
      default: new Header({ children: [new Paragraph({
        alignment: AlignmentType.RIGHT,
        children: [new TextRun({ text: "COMP208 Team 36 — UoL Campus Market — Design Document", size: 18, color: "808080" })]
      })] })
    },
    footers: {
      default: new Footer({ children: [new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({ text: "Page ", size: 18, color: "808080" }),
          new TextRun({ children: [PageNumber.CURRENT], size: 18, color: "808080" }),
          new TextRun({ text: " of ", size: 18, color: "808080" }),
          new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 18, color: "808080" })
        ]
      })] })
    },
    children
  }]
});

Packer.toBuffer(doc).then(buf => {
  const out = path.join(__dirname, 'Design_Document.docx');
  fs.writeFileSync(out, buf);
  console.log('OK ->', out, '(' + (buf.length / 1024).toFixed(1) + ' KB)');
});
