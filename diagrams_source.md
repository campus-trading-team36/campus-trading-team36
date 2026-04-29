# Design Document — Diagram Source Code

All 9 figures referenced in `Design_Document.docx`, written in copy-paste-ready source.

| Figure | Format | Render at |
|--------|--------|-----------|
| F1, F2, F4, F5, F6, F7, F8, F9 | Mermaid | https://mermaid.live |
| F3 | dbdiagram.io DBML (preferred) **or** Mermaid erDiagram (fallback) | https://dbdiagram.io |

**Workflow:** open the link, paste the source, click **Export → PNG (2×)**, drag the PNG into the matching `[ Insert Image: … ]` box in the Word document.

> Tip: in mermaid.live, change the theme to **neutral** and the background to **white** before exporting — the default dark text on transparent background looks washed-out when printed.

---

## F1 — Figure 2.1: Three-tier architecture

```mermaid
flowchart LR
    subgraph Tier1["Presentation tier — browser"]
        UI["index.html SPA<br/>vanilla JS + CSS"]
        LS[("localStorage<br/>token + user")]
        UI --- LS
    end

    subgraph Tier2["Application tier — Node.js / Express on VPS:8080"]
        APP["app.js<br/>Express factory"]
        MW["middleware<br/>auth · CORS · CSP<br/>rate-limit · logger"]
        RT["routes/*"]
        CT["controllers/*"]
        SV["services/*"]
        APP --> MW --> RT --> CT --> SV
    end

    subgraph Tier3["Data tier"]
        DB[("data.db<br/>SQLite + WAL")]
        UP[("/uploads<br/>image files")]
        SS[("sessions.json<br/>token map")]
    end

    UI -- "HTTPS · JSON<br/>Bearer token" --> APP
    SV -- "prepared<br/>statements" --> DB
    APP -- "multer<br/>diskStorage" --> UP
    UI -. "GET /uploads/*<br/>static" .-> UP
    MW -- "read / write" --> SS

    classDef tierP fill:#E3F2FD,stroke:#1565C0,stroke-width:2px
    classDef tierA fill:#FFF3E0,stroke:#E65100,stroke-width:2px
    classDef tierD fill:#E8F5E9,stroke:#2E7D32,stroke-width:2px
    class Tier1 tierP
    class Tier2 tierA
    class Tier3 tierD
```

---

## F2 — Figure 2.2: Layered module dependency

```mermaid
flowchart TB
    subgraph L1["Edge — HTTP"]
        R["routes/<br/>user · product · favorite<br/>message · report · review · admin"]
    end
    subgraph L2["Translation — request/response"]
        C["controllers/<br/>userController · productController<br/>messageController · reportController<br/>reviewController · adminController"]
    end
    subgraph L3["Business logic"]
        S["services/<br/>userService · productService · cartService<br/>browsingService · reviewService<br/>messageService · reportService · adminService"]
    end
    subgraph L4["Data"]
        M["models/db.js<br/>store · save() · saveSync()"]
        DB[("SQLite WAL")]
    end
    subgraph LX["Cross-cutting middleware"]
        MW["auth · securityHeaders<br/>rateLimiter · logger · errorHandler"]
    end

    R --> C --> S --> M --> DB
    MW -. "wraps every request" .- R

    classDef l1 fill:#FFEBEE,stroke:#C62828
    classDef l2 fill:#FFF3E0,stroke:#E65100
    classDef l3 fill:#E8F5E9,stroke:#2E7D32
    classDef l4 fill:#E3F2FD,stroke:#1565C0
    classDef lx fill:#F3E5F5,stroke:#6A1B9A
    class L1 l1
    class L2 l2
    class L3 l3
    class L4 l4
    class LX lx
```

---

## F3 — Figure 3.1: Entity–Relationship diagram

### Option A (preferred) — dbdiagram.io DBML

Paste at <https://dbdiagram.io>:

```dbml
Table users {
  id varchar [pk]
  username varchar [not null]
  email varchar [unique, not null]
  password varchar [not null, note: 'PBKDF2 salt:hash']
  role varchar [not null, default: 'user']
  verified boolean [not null, default: false]
  banned boolean [not null, default: false]
  lastLoginAt varchar
  createdAt varchar [not null]

  Indexes {
    email [name: 'idx_users_email']
  }
}

Table products {
  id varchar [pk]
  title varchar [not null]
  description text
  price real [not null]
  category varchar
  images text [note: 'JSON array of /uploads paths']
  image varchar [note: 'first image, legacy']
  condition varchar [default: 'good']
  brand varchar
  purchaseDate varchar
  defects text
  location varchar
  tags text [note: 'JSON string array']
  sellerId varchar [not null, ref: > users.id]
  sellerName varchar
  status varchar [not null, default: 'pending', note: 'pending|approved|rejected|sold']
  viewCount integer [not null, default: 0]
  rejectReason text
  createdAt varchar [not null]
  updatedAt varchar

  Indexes {
    sellerId [name: 'idx_products_seller']
    status [name: 'idx_products_status']
    category [name: 'idx_products_category']
  }
}

Table messages {
  id varchar [pk]
  senderId varchar [not null, ref: > users.id]
  senderName varchar
  receiverId varchar [not null, ref: > users.id]
  receiverName varchar
  content text [not null]
  productId varchar [ref: > products.id]
  productTitle varchar
  createdAt varchar [not null]
  isRead boolean [not null, default: false]

  Indexes {
    senderId [name: 'idx_messages_sender']
    receiverId [name: 'idx_messages_receiver']
  }
}

Table reports {
  id varchar [pk]
  reporterId varchar [not null, ref: > users.id]
  reporterName varchar
  targetId varchar [not null]
  targetType varchar [not null, note: 'product|user']
  reason text
  status varchar [not null, default: 'pending']
  createdAt varchar [not null]
  handledAt varchar
  handledBy varchar
}

Table favorites {
  userId varchar [ref: > users.id]
  productId varchar [ref: > products.id]
  addedAt varchar [not null]

  Indexes {
    (userId, productId) [pk]
  }
}

Table cart {
  id varchar [pk]
  userId varchar [not null, ref: > users.id]
  productId varchar [not null, ref: > products.id]
  note text
  addedAt varchar [not null]

  Indexes {
    (userId, productId) [unique]
    userId [name: 'idx_cart_user']
  }
}

Table reviews {
  id varchar [pk]
  productId varchar [not null, ref: > products.id]
  sellerId varchar [not null, ref: > users.id]
  buyerId varchar [not null, ref: > users.id]
  buyerName varchar
  rating integer [not null, note: '1..5']
  comment text
  createdAt varchar [not null]

  Indexes {
    sellerId [name: 'idx_reviews_seller']
    productId [name: 'idx_reviews_product']
  }
}

Table browsing_history {
  id varchar [pk]
  userId varchar [not null, ref: > users.id]
  productId varchar [not null, ref: > products.id]
  viewedAt varchar [not null]

  Indexes {
    userId [name: 'idx_history_user']
  }
}

Table verify_codes {
  email varchar [pk]
  code varchar [not null]
  expiresAt integer [not null, note: 'unix-ms, +10min']
}

Table admin_log {
  id integer [pk, increment]
  actorId varchar
  actorName varchar
  action varchar
  targetType varchar
  targetId varchar
  detail text
  at varchar [not null]
}
```

### Option B (fallback) — Mermaid erDiagram

```mermaid
erDiagram
    USERS ||--o{ PRODUCTS         : sells
    USERS ||--o{ MESSAGES         : sends
    USERS ||--o{ MESSAGES         : receives
    USERS ||--o{ FAVORITES        : keeps
    PRODUCTS ||--o{ FAVORITES     : appears-in
    USERS ||--o{ CART             : owns
    PRODUCTS ||--o{ CART          : appears-in
    USERS ||--o{ REVIEWS          : writes
    USERS ||--o{ REVIEWS          : receives
    PRODUCTS ||--o{ REVIEWS       : about
    USERS ||--o{ BROWSING_HISTORY : views
    PRODUCTS ||--o{ BROWSING_HISTORY : viewed-in
    USERS ||--o{ REPORTS          : files
    USERS ||--o{ ADMIN_LOG        : performs

    USERS {
        TEXT id PK
        TEXT username
        TEXT email UK
        TEXT password
        TEXT role
        INT  verified
        INT  banned
        TEXT lastLoginAt
        TEXT createdAt
    }
    PRODUCTS {
        TEXT id PK
        TEXT title
        TEXT description
        REAL price
        TEXT category
        TEXT images
        TEXT condition
        TEXT brand
        TEXT location
        TEXT tags
        TEXT sellerId FK
        TEXT status
        INT  viewCount
        TEXT createdAt
    }
    MESSAGES {
        TEXT id PK
        TEXT senderId FK
        TEXT receiverId FK
        TEXT content
        TEXT productId FK
        TEXT createdAt
        INT  isRead
    }
    FAVORITES {
        TEXT userId PK
        TEXT productId PK
        TEXT addedAt
    }
    CART {
        TEXT id PK
        TEXT userId FK
        TEXT productId FK
        TEXT note
        TEXT addedAt
    }
    REVIEWS {
        TEXT id PK
        TEXT productId FK
        TEXT sellerId FK
        TEXT buyerId FK
        INT  rating
        TEXT comment
        TEXT createdAt
    }
    BROWSING_HISTORY {
        TEXT id PK
        TEXT userId FK
        TEXT productId FK
        TEXT viewedAt
    }
    REPORTS {
        TEXT id PK
        TEXT reporterId FK
        TEXT targetId
        TEXT targetType
        TEXT reason
        TEXT status
        TEXT createdAt
    }
    VERIFY_CODES {
        TEXT email PK
        TEXT code
        INT  expiresAt
    }
    ADMIN_LOG {
        INT  id PK
        TEXT actorId
        TEXT action
        TEXT targetType
        TEXT targetId
        TEXT at
    }
```

---

## F4 — Figure 4.1: Use-case diagram

```mermaid
flowchart LR
    A(("Anonymous<br/>Visitor"))
    U(("Buyer / Seller<br/>verified user"))
    AD(("Administrator"))

    subgraph SYS["UoL Campus Market"]
        UC1["Browse listings"]
        UC2["View product detail"]
        UC3["Register account"]
        UC4["Request verification code"]
        UC5["Log in / log out"]
        UC6["Post / edit / delete listing"]
        UC7["Upload product images"]
        UC8["Mark listing as sold"]
        UC9["Add to cart / favourite"]
        UC10["Browse history"]
        UC11["Send / receive messages"]
        UC12["Submit seller review"]
        UC13["Report product or user"]
        UC14["Edit profile / change password"]
        UC15["Approve or reject listing"]
        UC16["Ban or unban user"]
        UC17["Resolve report"]
        UC18["Delete any listing"]
        UC19["View platform stats"]
    end

    A --> UC1
    A --> UC2
    A --> UC3
    A --> UC4

    U --> UC1
    U --> UC2
    U --> UC5
    U --> UC6
    U --> UC7
    U --> UC8
    U --> UC9
    U --> UC10
    U --> UC11
    U --> UC12
    U --> UC13
    U --> UC14

    AD --> UC15
    AD --> UC16
    AD --> UC17
    AD --> UC18
    AD --> UC19

    classDef actor fill:#FFE0B2,stroke:#E65100,stroke-width:2px
    classDef uc fill:#E1F5FE,stroke:#0277BD
    class A,U,AD actor
    class UC1,UC2,UC3,UC4,UC5,UC6,UC7,UC8,UC9,UC10,UC11,UC12,UC13,UC14,UC15,UC16,UC17,UC18,UC19 uc
```

---

## F5 — Figure 4.2: Registration sequence

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant B as Browser SPA
    participant API as Express /api/user
    participant SVC as userService
    participant DB as SQLite (verify_codes, users)

    User->>B: enter email
    B->>API: POST /api/user/verify { email }
    API->>SVC: verify(email)
    SVC->>SVC: check email domain
    SVC->>SVC: code = random6()
    SVC->>DB: store.verifyCodes[email] = { code, expiresAt }
    SVC-->>API: { code }
    API-->>B: 200 { success, code* }
    Note right of API: code is returned for grading. Production would email it.

    User->>B: fill username, password, code
    B->>API: POST /api/user/register
    API->>SVC: register(body)
    SVC->>DB: read verify_codes by email
    alt code missing / expired / wrong
        SVC-->>API: 400
        API-->>B: { success: false }
    else valid
        SVC->>SVC: hashPassword(plain)
        SVC->>DB: insert into users
        SVC->>DB: delete verify_codes[email]
        SVC->>API: createSession(userId)
        API-->>B: 200 { token, user }
        B->>B: localStorage.setItem(token)
        B->>User: redirect to catalogue
    end
```

---

## F6 — Figure 4.3: Login sequence

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant B as Browser SPA
    participant API as Express
    participant AU as middleware/auth
    participant SVC as userService
    participant DB as SQLite (users)
    participant SS as sessions.json

    User->>B: enter email + password
    B->>API: POST /api/user/login
    API->>SVC: login(email, password)
    SVC->>DB: SELECT * FROM users WHERE email=?
    alt user not found
        SVC-->>API: 401 'Invalid credentials'
    else banned
        SVC-->>API: 403 'Account suspended'
    else wrong password
        SVC->>SVC: timingSafeEqual = false
        SVC-->>API: 401 'Invalid credentials'
    else success
        SVC->>SVC: timingSafeEqual = true
        SVC->>DB: UPDATE lastLoginAt = now
        SVC->>AU: createSession(userId)
        AU->>AU: token = randomBytes(32).hex
        AU->>SS: persist sessions (debounced)
        SVC-->>API: { token, user }
        API-->>B: 200
        B->>B: localStorage.setItem('token', t)
    end

    Note over B,API: every later call:<br/>Authorization: Bearer t
```

---

## F7 — Figure 4.4: Publish a listing with image upload

```mermaid
sequenceDiagram
    autonumber
    actor Seller
    participant B as Browser SPA
    participant API as Express
    participant MU as multer<br/>diskStorage
    participant FS as /uploads<br/>filesystem
    participant SVC as productService
    participant DB as SQLite (products)

    Seller->>B: pick up to 5 images,<br/>fill listing form
    B->>API: POST /api/upload<br/>(multipart, Bearer)
    API->>MU: handle multipart
    MU->>MU: enforce limits<br/>(5 MB · 5 files · ext + mime)
    MU->>FS: write <uuid>.<ext>
    MU-->>API: req.files = [...]
    API-->>B: 200 { urls: ['/uploads/...'] }

    B->>API: POST /api/products<br/>{ title, price, images:[urls], ... }
    API->>SVC: create(user, body)
    SVC->>SVC: validate fields,<br/>price > 0, sanitise text
    SVC->>SVC: status =<br/>moderationEnabled ? 'pending' : 'approved'
    SVC->>DB: store.products.push(p) + save()
    SVC-->>API: { id }
    API-->>B: 201 { data: product }
    B->>Seller: show toast +<br/>navigate to detail page
```

---

## F8 — Figure 5.1: Front-end page navigation

```mermaid
flowchart TD
    L["loginPage"]
    R["registerPage"]
    C["catalogPage<br/>(home)"]
    D["detailPage"]
    P["publishPage<br/>create / edit"]
    M["messagesPage"]
    PR["profilePage<br/>(my listings · favourites ·<br/>cart · history · reviews)"]
    SP["sellerPage<br/>(public profile)"]
    AD["adminPage<br/>(stats · users · moderation · reports)"]

    L -- "have no account" --> R
    R -- "register success" --> C
    L -- "login success" --> C

    C -- "click card" --> D
    C -- "Sell button" --> P
    C -- "Messages icon" --> M
    C -- "avatar / Profile" --> PR
    C -- "(admin user)" --> AD

    D -- "Contact seller" --> M
    D -- "Seller name" --> SP
    D -- "Edit (own)" --> P
    PR -- "Edit listing" --> P
    PR -- "logout" --> L
    AD -- "logout" --> L

    classDef pub fill:#E8F5E9,stroke:#2E7D32
    classDef auth fill:#FFF3E0,stroke:#E65100
    classDef admin fill:#FFEBEE,stroke:#C62828
    class L,R,C,D,SP pub
    class P,M,PR auth
    class AD admin
```

---

## F9 — Figure 8.1: Deployment diagram

```mermaid
flowchart LR
    subgraph Client["Student device"]
        BR["Web browser<br/>Chrome · Firefox · Safari · mobile"]
    end

    subgraph Net["Internet"]
        FW["Cloud-provider firewall<br/>+ ufw allow 8080"]
    end

    subgraph VPS["VPS · Ubuntu 22.04 · 1 vCPU · 1 GB"]
        PM2["PM2 process manager<br/>auto-restart · log rotation"]
        NODE["Node.js v20<br/>process: campus-trading"]
        APP["Express app<br/>/root/campus-trading-team36"]
        subgraph Storage["local storage"]
            DB[("data.db<br/>+ data.db-wal · -shm")]
            UP[("uploads/<br/>image files")]
            SS[("sessions.json")]
            LOG[("PM2 logs<br/>~/.pm2/logs/")]
        end
        PM2 --> NODE --> APP
        APP --> DB
        APP --> UP
        APP --> SS
        APP --> LOG
    end

    subgraph Backup["Daily cron"]
        BAK[("/root/backups/<br/>data-YYYYMMDD.db<br/>(7-day rotation)")]
    end

    BR -- "HTTP :8080<br/>JSON · multipart" --> FW --> APP
    DB -. "tar.gz nightly" .-> BAK

    classDef cli fill:#E3F2FD,stroke:#1565C0
    classDef net fill:#F3E5F5,stroke:#6A1B9A
    classDef srv fill:#FFF3E0,stroke:#E65100
    classDef st  fill:#E8F5E9,stroke:#2E7D32
    classDef bk  fill:#FFEBEE,stroke:#C62828
    class Client cli
    class Net net
    class VPS srv
    class Storage st
    class Backup bk
```

---

## Quick rendering checklist

1. Open <https://mermaid.live> (or <https://dbdiagram.io> for F3 option A).
2. For each diagram above: copy the fenced block (only the lines between the triple backticks, **not** the backticks themselves), paste into the editor.
3. Wait for the preview to render. If it errors, check that you didn't accidentally include the leading ` ```mermaid ` line.
4. Export → **PNG** (set scale to 2× for sharper print).
5. Open `Design_Document.docx`, scroll to the matching **[ Insert Image: Figure x.y … ]** placeholder, click on the dashed yellow box to select the table cell, **Delete** it, then **Insert → Pictures** → choose the PNG you just exported.
6. Add a caption underneath the image: *Insert → Caption → Label "Figure", number "x.y"*.
