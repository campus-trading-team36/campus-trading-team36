// 生成 COMP208 设计文档 (.docx)
// 跑法: node generate_design_doc.js
// 输出: 项目根目录下的 Design_Document.docx

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

function H1(text) { return new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun(text)] }); }
function H2(text) { return new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun(text)] }); }
function H3(text) { return new Paragraph({ heading: HeadingLevel.HEADING_3, children: [new TextRun(text)] }); }
function P(text, opts = {}) {
  return new Paragraph({
    spacing: { after: 120 },
    alignment: opts.align || AlignmentType.JUSTIFIED,
    children: [new TextRun({ text, ...opts })]
  });
}
function Code(text) {
  return text.split("\n").map(l => new Paragraph({
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
  return new Table({
    width: { size: 9026, type: WidthType.DXA },
    columnWidths: [9026],
    rows: [new TableRow({ children: [new TableCell({
      width: { size: 9026, type: WidthType.DXA },
      margins: { top: 600, bottom: 600, left: 200, right: 200 },
      shading: { fill: "FFF4D6", type: ShadingType.CLEAR },
      borders: {
        top: { style: BorderStyle.DASHED, size: 12, color: "C09030" },
        bottom: { style: BorderStyle.DASHED, size: 12, color: "C09030" },
        left: { style: BorderStyle.DASHED, size: 12, color: "C09030" },
        right: { style: BorderStyle.DASHED, size: 12, color: "C09030" }
      },
      children: [
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 80 },
          children: [new TextRun({ text: "[ 这里放图: " + label + " ]", bold: true, size: 24, color: "8A6500" })] }),
        new Paragraph({ alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: "(see Appendix A for full list)", italics: true, size: 20, color: "8A6500" })] })
      ]
    })] })]
  });
}
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
          text: String(cell), bold: i === 0,
          color: i === 0 ? "FFFFFF" : "000000", size: 20
        })] })]
      }))
    }))
  });
}
function twoColTable(rows, w1 = 2880, w2 = 6146) {
  return table(rows, [w1, w2]);
}

// ---------- 内容 ----------
const children = [];

// COVER
children.push(new Paragraph({ spacing: { before: 2400, after: 200 }, alignment: AlignmentType.CENTER,
  children: [new TextRun({ text: "COMP208 Team Software Project", bold: true, size: 36, color: "1F3864" })]}));
children.push(new Paragraph({ spacing: { after: 1200 }, alignment: AlignmentType.CENTER,
  children: [new TextRun({ text: "Design Document", bold: true, size: 56, color: "1F3864" })]}));
children.push(new Paragraph({ spacing: { after: 200 }, alignment: AlignmentType.CENTER,
  children: [new TextRun({ text: "UoL Campus Market", italics: true, size: 32 })]}));
children.push(new Paragraph({ spacing: { after: 1600 }, alignment: AlignmentType.CENTER,
  children: [new TextRun({ text: "二手交易平台 — for University of Liverpool students", size: 22, color: "595959" })]}));
children.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 100 },
  children: [new TextRun({ text: "Team 36", bold: true, size: 24 })]}));
children.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 100 },
  children: [new TextRun({ text: "Department of Computer Science, University of Liverpool", size: 22 })]}));
children.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 400 },
  children: [new TextRun({ text: "Submission: 11 May 2026", size: 22, color: "595959" })]}));
children.push(new Paragraph({ children: [new PageBreak()] }));

// DOC INFO
children.push(H1("Document Info"));
children.push(twoColTable([
  ["Field", "Value"],
  ["Module", "COMP208 — Team Software Project (2025/26)"],
  ["Document type", "Design Document (final version)"],
  ["Project name", "UoL Campus Market"],
  ["Team", "Team 36"],
  ["Repository", "campus-trading-team36"],
  ["Live demo", "http://38.65.91.221:8080"],
  ["Default admin", "admin@liverpool.ac.uk / admin123"],
  ["Version", "1.0 (final)"],
  ["Deadline", "11 May 2026 (15% of module)"]
]));
children.push(new Paragraph({ children: [new PageBreak()] }));

// TOC
children.push(H1("Table of Contents"));
children.push(new Paragraph({ children: [new TableOfContents("TOC", { hyperlink: true, headingStyleRange: "1-3" })]}));
children.push(P("(Right-click → Update Field in Word to refresh page numbers)", { italics: true, size: 20, color: "808080" }));
children.push(new Paragraph({ children: [new PageBreak()] }));

// 1. INTRO
children.push(H1("1. Introduction"));

children.push(H2("1.1 Background"));
children.push(P(
  "Every summer many students leave halls of residence and throw away things that are still usable — " +
  "laptops, textbooks, kitchen stuff, small furniture. At the same time new students come in and buy " +
  "the same items new at full price. This is wasteful. Existing platforms like eBay or Facebook " +
  "Marketplace are not really for students: anyone can use them, no university check, no campus filter."
));
children.push(P(
  "我们的目标是做一个只给利物浦大学学生用的平台，邮箱必须是 @liverpool.ac.uk 才能注册。" +
  "Compared to public marketplaces, this platform is safer (only verified students), and has features " +
  "that fit student life — like filtering by hall of residence, or tagging by module code."
));

children.push(H2("1.2 What this document covers"));
children.push(P("Following the COMP208 brief, this document covers:"));
children.push(Bullet("System architecture (Chapter 2)"));
children.push(Bullet("Data design with ER diagram and full data dictionary (Chapter 3)"));
children.push(Bullet("Process and algorithms (Chapter 4)"));
children.push(Bullet("Interface design — REST API + UI (Chapter 5)"));
children.push(Bullet("Security design (Chapter 6)"));
children.push(Bullet("Evaluation and test plan (Chapter 7)"));
children.push(Bullet("Deployment (Chapter 8)"));

children.push(H2("1.3 Methodology"));
children.push(P(
  "We use a data-centric approach (Connolly & Begg style) because the system is mostly CRUD around the " +
  "product database. ER model, data dictionary, and sequence diagrams for the main flows. " +
  "项目代码分层比较清晰：路由 → controller → service → 数据层，每层职责单一。"
));

children.push(H2("1.4 Glossary / 术语"));
children.push(table([
  ["Term", "Meaning"],
  ["SPA", "Single Page Application — 整个前端就一个 HTML 文件"],
  ["Bearer token", "登录后用的令牌，放在 HTTP header: 'Bearer xxx'"],
  ["WAL", "SQLite 的写前日志模式，可以多读一写"],
  ["Listing", "商品/物品（卖家发布的）"],
  ["Moderation", "管理员审核（商品发布前要批准）"]
], [2200, 7160]));
children.push(new Paragraph({ children: [new PageBreak()] }));

// 2. ARCHITECTURE
children.push(H1("2. System Architecture"));

children.push(H2("2.1 Overall structure"));
children.push(P(
  "三层架构 (three-tier architecture): browser SPA on top, Node/Express in the middle, SQLite + uploads " +
  "folder at the bottom. Inside the middle tier the code goes routes → controllers → services → models. " +
  "Only models/db.js touches SQLite directly. This way if we want to change the database to MySQL one day, " +
  "we only change one file."
));

children.push(H2("2.2 Architecture diagram"));
children.push(PlaceholderBox("Figure 2.1 – 三层架构图 (browser → Express → SQLite + uploads)"));
children.push(P(
  "Figure 2.1 shows the three layers. Browser talks to Express by HTTP/JSON, sending a Bearer token " +
  "in the Authorization header. Express opens one SQLite handle (better-sqlite3 是同步的, no need to pool). " +
  "Uploaded images go to /uploads which is served as static files."
));

children.push(H2("2.3 Tech stack"));
children.push(table([
  ["Layer", "Tech", "Why we picked it"],
  ["Frontend", "Vanilla JS + HTML/CSS, single index.html", "No build step, easy to demo, fast to iterate"],
  ["Frontend", "fetch() + Bearer token in localStorage", "Built-in, no extra library"],
  ["Backend", "Node.js v16+", "Module spec requires Node"],
  ["Backend", "Express 4.x", "Standard HTTP framework"],
  ["Backend", "multer 1.4", "处理上传文件"],
  ["Backend", "uuid v4", "生成主键，比自增 id 更安全"],
  ["Data", "better-sqlite3 12.x", "Synchronous, embedded, no setup"],
  ["Data", "WAL journal mode", "Allow read while writing"],
  ["Data", "JSON file for sessions", "Simple, survive restart"],
  ["Test", "Jest + supertest", "标准 Node 测试组合"],
  ["Production", "PM2 on VPS", "Auto-restart, log rotation"]
], [1500, 2500, 5360]));

children.push(H2("2.4 Code layers"));
children.push(PlaceholderBox("Figure 2.2 – 模块依赖图 (routes → controllers → services → models)"));
children.push(P("Layer rules / 分层规则:"));
children.push(Bullet("routes/* — only declare HTTP paths and call controllers, no business logic"));
children.push(Bullet("controllers/* — handle request/response, validate input, call services"));
children.push(Bullet("services/* — business logic, mutate the in-memory store, call save()"));
children.push(Bullet("models/db.js — only file that opens SQLite. Provides store + save() + saveSync()"));
children.push(Bullet("middleware/* — auth, logger, error handler, rate limiter, security headers"));
children.push(P(
  "我们靠 code review 来保证这些规则不被破坏。比如 service 层不能调 res.json(), controller 层不能 " +
  "写 SQL 语句。所有测试都从 HTTP 边界进入 (supertest)，所以会跑完整链路。"
));

children.push(H2("2.5 Module list"));
children.push(table([
  ["Module", "Job"],
  ["app.js", "Express 工厂函数。测试导入这个，不会绑端口"],
  ["server.js", "生产入口。调 app.listen() + 处理 SIGINT/SIGTERM"],
  ["config.js", "配置：端口、文件大小限制、邮箱域名等"],
  ["models/db.js", "Schema、in-memory store、save()、saveSync()、从 data.json 一次性迁移"],
  ["middleware/auth.js", "Token session 存储 + requireAuth/requireAdmin"],
  ["middleware/securityHeaders.js", "加 CSP / X-Frame / nosniff 等头"],
  ["middleware/rateLimiter.js", "限流：API 200/min，登录 10/min"],
  ["middleware/errorHandler.js", "统一错误格式 { success: false, message: ... }"],
  ["routes/*.js", "路由表"],
  ["controllers/*.js", "处理 HTTP 请求"],
  ["services/*.js", "用户、商品、购物车、浏览历史、评价、消息、举报、管理员的业务逻辑"],
  ["public/index.html", "整个前端。所有页面、路由、apiFetch、toast 都在这里"],
  ["uploads/", "上传的图片，HTTP 只读访问"]
], [2400, 6960]));
children.push(new Paragraph({ children: [new PageBreak()] }));

// 3. DATA
children.push(H1("3. Data Design"));

children.push(H2("3.1 Approach"));
children.push(P(
  "用 SQLite 做关系型数据库，schema 在 models/db.js 里用一个 CREATE TABLE IF NOT EXISTS 块定义。" +
  "第一次启动会建表，之后启动是 no-op。"
));
children.push(P(
  "为了不大改 service 层，我们保留了原型版的 store + save() API。Service 还是改 store 这个对象，然后调 " +
  "save()，save() 负责把整个 store 用一个事务写回 SQLite。这样 service 层完全不用知道下面是什么数据库。"
));

children.push(H2("3.2 ER model"));
children.push(PlaceholderBox("Figure 3.1 – ER 图 (10 个实体 + junction tables)"));
children.push(P("主要实体 (10 个):"));
children.push(Bullet("USER — 注册用户或管理员"));
children.push(Bullet("PRODUCT — 卖家发布的商品"));
children.push(Bullet("MESSAGE — 用户之间的私信，可以关联到某个商品"));
children.push(Bullet("REPORT — 用户对商品或其他用户的举报"));
children.push(Bullet("FAVORITE — 用户收藏的商品 (USER × PRODUCT)"));
children.push(Bullet("CART — 用户的购物车 (USER × PRODUCT，可以加备注)"));
children.push(Bullet("REVIEW — 买家给卖家的评分 (1-5 星)"));
children.push(Bullet("BROWSING_HISTORY — 浏览历史，30 分钟内重复看的会去重"));
children.push(Bullet("VERIFY_CODE — 注册/重设密码用的一次性验证码"));
children.push(Bullet("ADMIN_LOG — 管理员操作日志"));

children.push(H2("3.3 Cardinality / 关系基数"));
children.push(table([
  ["Relationship", "Cardinality", "Notes"],
  ["USER — PRODUCT", "1 : N", "一个用户可以发多个商品"],
  ["USER — MESSAGE (sends)", "1 : N", "发送方"],
  ["USER — MESSAGE (receives)", "1 : N", "接收方"],
  ["USER — FAVORITE — PRODUCT", "M : N", "联结表 favorites，复合主键"],
  ["USER — CART — PRODUCT", "M : N", "联结表 cart，UNIQUE(userId, productId)"],
  ["USER — REVIEW (writes)", "1 : N", "买家可以写多个评价"],
  ["USER — REVIEW (receives)", "1 : N", "卖家收到的评价"],
  ["USER — BROWSING_HISTORY", "1 : N", "时间戳的视图记录"],
  ["USER — REPORT", "1 : N", "一个人可以提多个举报"]
], [3000, 1800, 4560]));

children.push(H2("3.4 Data dictionary / 数据字典"));
children.push(P("下面列出 models/db.js 里实际定义的每张表的每个字段。"));

children.push(H3("3.4.1 users"));
children.push(table([
  ["Column", "Type", "Constraints", "Description"],
  ["id", "TEXT", "PK", "UUID v4 (or 'admin-001' for seeded admin)"],
  ["username", "TEXT", "NOT NULL", "用户名"],
  ["email", "TEXT", "NOT NULL UNIQUE", "邮箱（小写，必须是允许的域名）"],
  ["password", "TEXT", "NOT NULL", "PBKDF2 哈希，绝不存明文"],
  ["role", "TEXT", "NOT NULL DEFAULT 'user'", "'user' 或 'admin'"],
  ["verified", "INTEGER", "DEFAULT 0", "1 = 邮箱已验证"],
  ["banned", "INTEGER", "DEFAULT 0", "1 = 已封号"],
  ["lastLoginAt", "TEXT", "", "最近一次登录时间（ISO）"],
  ["createdAt", "TEXT", "NOT NULL", "注册时间（ISO）"]
], [1700, 1100, 2200, 4360]));
children.push(P("Index: idx_users_email — 登录查询用。", { size: 20, italics: true }));

children.push(H3("3.4.2 products"));
children.push(table([
  ["Column", "Type", "Constraints", "Description"],
  ["id", "TEXT", "PK", "UUID"],
  ["title", "TEXT", "NOT NULL", "商品标题（1-80 字符）"],
  ["description", "TEXT", "", "详细描述"],
  ["price", "REAL", "NOT NULL", "价格 (£)，必须 > 0"],
  ["category", "TEXT", "", "Electronics / Books / Clothing / Furniture / Sports / Stationery / Other"],
  ["images", "TEXT", "", "JSON 数组，最多 5 张图"],
  ["image", "TEXT", "", "第一张图（前端兼容字段）"],
  ["condition", "TEXT", "DEFAULT 'good'", "new | like-new | good | fair"],
  ["brand", "TEXT", "DEFAULT ''", "品牌（可选）"],
  ["purchaseDate", "TEXT", "DEFAULT ''", "购买时间（自由文本）"],
  ["defects", "TEXT", "DEFAULT ''", "瑕疵描述"],
  ["location", "TEXT", "DEFAULT ''", "宿舍/位置"],
  ["tags", "TEXT", "", "JSON 字符串数组"],
  ["sellerId", "TEXT", "NOT NULL", "FK → users.id"],
  ["sellerName", "TEXT", "", "卖家名（冗余存一份）"],
  ["status", "TEXT", "NOT NULL DEFAULT 'pending'", "pending | approved | rejected | sold"],
  ["viewCount", "INTEGER", "DEFAULT 0", "浏览数"],
  ["rejectReason", "TEXT", "", "被拒原因"],
  ["createdAt", "TEXT", "NOT NULL", "发布时间"],
  ["updatedAt", "TEXT", "", "上次修改时间"]
], [1700, 1100, 2200, 4360]));
children.push(P("Indexes: idx_products_seller / idx_products_status / idx_products_category — 三个最常用的过滤字段。", { size: 20, italics: true }));

children.push(H3("3.4.3 messages"));
children.push(table([
  ["Column", "Type", "Constraints", "Description"],
  ["id", "TEXT", "PK", "UUID"],
  ["senderId / senderName", "TEXT", "NOT NULL / -", "发送方"],
  ["receiverId / receiverName", "TEXT", "NOT NULL / -", "接收方"],
  ["content", "TEXT", "NOT NULL", "消息内容（≤ 2000 字符）"],
  ["productId / productTitle", "TEXT", "", "关联的商品（可选）"],
  ["createdAt", "TEXT", "NOT NULL", "发送时间"],
  ["isRead", "INTEGER", "DEFAULT 0", "1 = 接收方已读"]
], [1700, 1100, 2200, 4360]));
children.push(P("Indexes: idx_messages_sender, idx_messages_receiver — 拉对话列表用。", { size: 20, italics: true }));

children.push(H3("3.4.4 reports / 3.4.5 favorites / 3.4.6 verify_codes / 3.4.7 reviews / 3.4.8 browsing_history / 3.4.9 cart / 3.4.10 admin_log"));
children.push(P("剩下 7 张表结构都比较简单，主要字段如下："));
children.push(table([
  ["Table", "主要字段"],
  ["reports", "id, reporterId, targetId, targetType ('product' | 'user'), reason, status, createdAt"],
  ["favorites", "userId + productId 复合主键, addedAt"],
  ["verify_codes", "email PK, code, expiresAt（10 分钟过期）"],
  ["reviews", "id, productId, sellerId, buyerId, rating (1-5), comment, createdAt"],
  ["browsing_history", "id, userId, productId, viewedAt（30 分钟内去重）"],
  ["cart", "id, userId, productId, note, addedAt, UNIQUE(userId, productId)"],
  ["admin_log", "id (auto), actorId, action, targetType, targetId, detail, at"]
], [2400, 6626]));

children.push(H2("3.5 Indexes"));
children.push(P("索引是看 service 层实际查询挑的，不是乱建：" ));
children.push(table([
  ["Index", "Used by"],
  ["idx_users_email", "登录: SELECT * FROM users WHERE email = ?"],
  ["idx_products_seller", "我的商品: WHERE sellerId = ?"],
  ["idx_products_status", "公开列表: WHERE status = 'approved'"],
  ["idx_products_category", "按类目过滤"],
  ["idx_messages_sender / _receiver", "对话列表"],
  ["idx_reviews_seller / _product", "卖家评分聚合 / 商品评论"],
  ["idx_history_user", "我的浏览历史"],
  ["idx_cart_user", "我的购物车"]
], [3000, 6360]));

children.push(H2("3.6 Persistence strategy"));
children.push(P(
  "WAL 模式 + synchronous=NORMAL —— 读多写少的场景这样最划算。Service 改 store 后调 save()，save() " +
  "用 setImmediate 节流（连续多次调用合并成一个事务）。优雅关停时改用 saveSync()，保证退出前数据落盘。"
));

children.push(H2("3.7 Migration from legacy data.json"));
children.push(P(
  "我们最早是用 data.json 文件存数据的。后来改成 SQLite 了。第一次启动时 models/db.js 会检测 " +
  "data.json 是否存在 + users 表是否为空，是就把所有数据导进去（一个事务），然后把 data.json 改名为 " +
  "data.json.imported，下次启动就不会再导了。"
));
children.push(new Paragraph({ children: [new PageBreak()] }));

// 4. PROCESS
children.push(H1("4. Process Design"));

children.push(H2("4.1 Use cases / 用例"));
children.push(PlaceholderBox("Figure 4.1 – 用例图 (Buyer / Seller / Admin)"));
children.push(P("3 类角色，主要用例如下："));
children.push(table([
  ["Actor", "Use cases"],
  ["游客 / Anonymous", "看公开商品列表 + 详情 / 注册 / 请求验证码"],
  ["登录用户 / Buyer or Seller", "登录登出 / 发布修改删除商品 / 上传图片 / 标记已售 / 收藏 / 加购物车 / 浏览历史 / 发消息 / 举报 / 评价卖家 / 改资料"],
  ["管理员 / Admin", "全部用户操作 + 审核商品 / 封号解封 / 处理举报 / 删除任何商品 / 查看统计"]
], [2400, 6960]));

children.push(H2("4.2 Flow: 注册 + 验证码"));
children.push(PlaceholderBox("Figure 4.2 – 注册流程时序图"));
children.push(P("伪代码 (verify-then-register):"));
children.push(...Code(
"// 第一步：客户端请求验证码\n" +
"POST /api/user/verify { email }\n" +
"  if (邮箱域名不对): return 400\n" +
"  code = 6 位随机数字\n" +
"  store.verifyCodes[email] = { code, expiresAt: now + 10min }\n" +
"  save()\n" +
"  console.log(code)  // 演示用，生产环境会发邮件\n" +
"  return { success: true, code }  // dev 模式才返回 code\n" +
"\n" +
"// 第二步：客户端带验证码注册\n" +
"POST /api/user/register { username, email, password, code }\n" +
"  validate 邮箱域名 + 密码强度\n" +
"  rec = store.verifyCodes[email]\n" +
"  if (!rec || rec.code != code || rec.expiresAt < now): return 400\n" +
"  if (邮箱已注册): return 409\n" +
"  user = { id: uuid(), username, email, password: hash(password), ... }\n" +
"  store.users.push(user)\n" +
"  delete store.verifyCodes[email]\n" +
"  token = createSession(user.id)\n" +
"  save()\n" +
"  return { success: true, data: { token, user } }"));

children.push(H2("4.3 Flow: 登录"));
children.push(PlaceholderBox("Figure 4.3 – 登录流程时序图"));
children.push(...Code(
"POST /api/user/login { email, password }\n" +
"  user = store.users.find(u => u.email === email.toLowerCase())\n" +
"  if (!user) return 401  // 注意：邮箱不存在和密码错返回一样的提示，避免枚举\n" +
"  if (user.banned) return 403 'Account suspended'\n" +
"  if (!verifyHash(password, user.password)) return 401\n" +
"  user.lastLoginAt = now\n" +
"  token = createSession(user.id)  // 32 字节 hex 随机串\n" +
"  save()\n" +
"  return { success: true, data: { token, user } }"));

children.push(H2("4.4 Flow: 发布商品 + 上传图片"));
children.push(PlaceholderBox("Figure 4.4 – 发布商品时序图（含图片上传）"));
children.push(P("前端是两步："));
children.push(...Code(
"// 第一步: 上传最多 5 张图\n" +
"POST /api/upload  (multipart/form-data, field: 'images')\n" +
"  multer 检查:\n" +
"    最多 5 个文件\n" +
"    每张 ≤ 5 MB\n" +
"    扩展名 ∈ {jpg, jpeg, png, gif, webp}\n" +
"    mimetype 必须以 'image/' 开头\n" +
"    存为 <uuid>.<ext>\n" +
"  return { success: true, urls: ['/uploads/abc.png', ...] }\n" +
"\n" +
"// 第二步: 用上面的 url 创建商品\n" +
"POST /api/products { title, description, price, category, images, ... }\n" +
"  validate 必填字段 + 价格\n" +
"  清洗 title / description / brand / location / defects / tags\n" +
"  status = 审核开关 ? 'pending' : 'approved'\n" +
"  push 到 store.products + save()"));

children.push(H2("4.5 Algorithm: 列表搜索 / 过滤"));
children.push(P(
  "GET /api/products 支持 category, q (搜索词), minPrice, maxPrice, condition, sort 这些参数。" +
  "实现在 services/productService.js 的 list() 里："
));
children.push(...Code(
"function list(query):\n" +
"  results = store.products.filter(p =>\n" +
"      p.status === 'approved'\n" +
"      and (没传 category 或 p.category 匹配)\n" +
"      and (没传 condition 或 p.condition 匹配)\n" +
"      and 价格在 [minPrice, maxPrice] 区间\n" +
"      and (没传 q 或 标题/描述/标签里包含 q))\n" +
"  按 sort 排序：price_asc / price_desc / 默认按 createdAt 倒序\n" +
"  return results"));

children.push(H2("4.6 Algorithm: 卖家评分聚合"));
children.push(...Code(
"function getSellerRating(sellerId):\n" +
"  rs = store.reviews.filter(r => r.sellerId === sellerId)\n" +
"  if (rs.length === 0): return { avg: 0, count: 0 }\n" +
"  sum = rs.reduce((s, r) => s + r.rating, 0)\n" +
"  return {\n" +
"    avg: round1(sum / rs.length),\n" +
"    count: rs.length,\n" +
"    recent: rs.slice(-5).reverse()  // 最近 5 条\n" +
"  }"));

children.push(H2("4.7 Algorithm: 浏览历史去重"));
children.push(P("用户重复打开同一个商品时不想重复记录，30 分钟内只记一次："));
children.push(...Code(
"function recordView(userId, productId):\n" +
"  cutoff = now - 30 minutes\n" +
"  existing = 找最近一条同 user 同 product 且 viewedAt >= cutoff 的\n" +
"  if (existing): return  // 30 分钟内不重复\n" +
"  store.browsingHistory.push({ id: uuid(), userId, productId, viewedAt: now })\n" +
"  save()"));

children.push(H2("4.8 Algorithm: token 会话生命周期"));
children.push(P(
  "Session 在 middleware/auth.js 里是一个 Map { token: { userId, createdAt, lastSeen } }，持久化到 sessions.json。" +
  "三个时间事件："
));
children.push(table([
  ["Event", "Effect"],
  ["createSession(userId)", "生成 32 字节 hex token，createdAt = lastSeen = now"],
  ["每次请求经过 requireAuth", "更新 lastSeen = now；超过 7 天未活动就过期"],
  ["pruneExpired() 每小时跑一次", "把超过 7 天的 session 删掉"],
  ["removeUserSessions(userId)", "改密码或封号时调用，把这个用户的所有 token 都删掉"]
], [3000, 6360]));

children.push(H2("4.9 Algorithm: 优雅关停"));
children.push(P("server.js 装了 SIGINT 和 SIGTERM 处理。关停时按顺序："));
children.push(Bullet("server.close() —— 不接新请求"));
children.push(Bullet("flushSessions() —— 同步把 sessions 写到 sessions.json"));
children.push(Bullet("flushPendingViews() —— 把还没写的浏览数刷下去"));
children.push(Bullet("saveSync() —— 同步把 store 用一个事务写到 SQLite"));
children.push(Bullet("process.exit(0)"));
children.push(P(
  "都得是同步的，因为 process.exit() 不会等 setImmediate 队列。我们之前踩过这个坑：用了 debounced save() 会丢数据，后来改成 saveSync()。"
));
children.push(new Paragraph({ children: [new PageBreak()] }));

// 5. INTERFACE
children.push(H1("5. Interface Design"));

children.push(H2("5.1 REST API"));
children.push(P(
  "JSON over HTTP，根路径 /api。所有非 trivial 接口返回统一格式："
));
children.push(...Code(
"// 成功\n" +
"{ \"success\": true, \"data\": ... }\n" +
"\n" +
"// 失败\n" +
"{ \"success\": false, \"message\": \"出错原因\" }"));
children.push(P("登录用 Bearer token，放在 Authorization 头里："));
children.push(...Code("GET /api/user/profile\nAuthorization: Bearer 5f0e4b3c8a9d1e2b6c4a8e3d2f1c5b9a..."));

children.push(H3("5.1.1 用户认证接口"));
children.push(table([
  ["Method", "Path", "Auth", "Body / params", "Purpose"],
  ["POST", "/api/user/verify", "—", "{ email }", "发送 6 位验证码"],
  ["POST", "/api/user/register", "—", "{ username, email, password, code }", "注册"],
  ["POST", "/api/user/login", "—", "{ email, password }", "登录，返回 token"],
  ["POST", "/api/user/logout", "✓", "—", "登出"],
  ["GET", "/api/user/profile", "✓", "—", "当前用户信息"],
  ["PUT", "/api/user/profile", "✓", "{ username }", "改用户名"],
  ["POST", "/api/user/password", "✓", "{ oldPassword, newPassword }", "改密码（会踢掉所有设备）"]
], [900, 2300, 700, 2700, 2760]));

children.push(H3("5.1.2 商品接口"));
children.push(table([
  ["Method", "Path", "Auth", "Purpose"],
  ["GET", "/api/products", "—", "商品列表（带过滤参数）"],
  ["GET", "/api/products/:id", "—", "商品详情（顺便加 viewCount）"],
  ["POST", "/api/products", "✓", "发布商品"],
  ["PUT", "/api/products/:id", "✓ (owner / admin)", "修改"],
  ["DELETE", "/api/products/:id", "✓ (owner / admin)", "删除"],
  ["PUT", "/api/products/:id/sold", "✓ (owner)", "标记已售"],
  ["POST", "/api/upload", "✓", "上传图片（最多 5 张）"]
], [900, 2300, 1700, 4460]));

children.push(H3("5.1.3 购物车 / 收藏 / 历史 / 评价"));
children.push(table([
  ["Method", "Path", "Auth", "Purpose"],
  ["GET", "/api/user/cart", "✓", "看购物车（已售商品自动过滤）"],
  ["POST", "/api/user/cart", "✓", "加进购物车（不能加自己的）"],
  ["DELETE", "/api/user/cart/:productId", "✓", "从购物车删除"],
  ["GET", "/api/favorites", "✓", "收藏列表"],
  ["POST", "/api/favorite", "✓", "切换收藏（不能收藏自己的）"],
  ["GET", "/api/user/history", "✓", "浏览历史"],
  ["POST", "/api/user/history", "✓", "记一次浏览（30 分钟去重）"],
  ["DELETE", "/api/user/history", "✓", "清空历史"],
  ["POST", "/api/review", "✓", "提交 1-5 星评价（每人每商品只能一次）"],
  ["GET", "/api/review/seller/:id", "—", "卖家评分汇总"],
  ["GET", "/api/review/product/:id", "—", "某商品的所有评价"]
], [900, 2900, 1100, 4460]));

children.push(H3("5.1.4 私信 + 举报"));
children.push(table([
  ["Method", "Path", "Auth", "Purpose"],
  ["GET", "/api/messages", "✓", "我的对话列表"],
  ["GET", "/api/messages/:userId", "✓", "和某人的聊天记录"],
  ["POST", "/api/messages", "✓", "发消息"],
  ["POST", "/api/reports", "✓", "举报商品或用户"],
  ["GET", "/api/reports/mine", "✓", "我提交的举报"]
], [900, 3000, 1000, 4460]));

children.push(H3("5.1.5 管理员接口"));
children.push(table([
  ["Method", "Path", "Purpose"],
  ["GET", "/api/admin/stats", "用户/商品/消息/举报数量"],
  ["GET", "/api/admin/users", "所有用户"],
  ["POST", "/api/admin/users/:id/ban", "封号/解封（不能封另一个 admin）"],
  ["GET", "/api/admin/products/all", "所有商品（不管状态）"],
  ["POST", "/api/admin/products/:id/approve", "通过待审核商品"],
  ["POST", "/api/admin/products/:id/reject", "拒绝（带原因）"],
  ["GET", "/api/admin/reports", "所有举报"],
  ["POST", "/api/admin/reports/:id/resolve", "处理举报"],
  ["GET", "/api/admin/log", "审计日志"]
], [900, 3500, 4960]));

children.push(H2("5.2 错误处理约定"));
children.push(table([
  ["Status", "含义", "前端怎么处理"],
  ["200", "成功", "正常显示"],
  ["400", "请求参数错（缺字段/格式错）", "Toast 报错"],
  ["401", "没登录或 token 过期", "apiFetch() 清 localStorage + 跳登录页"],
  ["403", "登录了但没权限（封号/不是 admin/不是 owner）", "Toast 报错"],
  ["404", "找不到资源", "Toast 或 not found 页"],
  ["409", "冲突（邮箱已注册、已在购物车）", "Toast"],
  ["429", "限流", "Toast 'please wait'"],
  ["500", "服务器错", "Toast 通用错误，详细只在服务端 log"]
], [900, 4500, 3960]));

children.push(H2("5.3 前端 UI 设计"));
children.push(P(
  "前端就一个 public/index.html 文件，没有 build 步骤。状态用几个模块级变量保管 (current user, " +
  "current page, productCache 等)，路由就是 showPage() 函数显示/隐藏 <section>。"
));
children.push(PlaceholderBox("Figure 5.1 – 前端页面跳转图"));

children.push(H3("5.3.1 页面列表"));
children.push(table([
  ["Page id", "URL fragment / 作用", "谁能看"],
  ["loginPage", "登录", "未登录用户"],
  ["registerPage", "注册（带验证码）", "未登录用户"],
  ["catalogPage", "商品列表 + 过滤", "所有人"],
  ["detailPage", "商品详情、评论、联系卖家、收藏、加购物车", "所有人"],
  ["publishPage", "发布或修改商品（多图上传）", "登录后"],
  ["messagesPage", "对话列表 + 聊天框", "登录后"],
  ["profilePage", "我的商品、收藏、购物车、历史、收到的评价", "登录后"],
  ["sellerPage", "卖家公开主页（评分 + 在售）", "所有人"],
  ["adminPage", "管理员后台（统计、用户、审核、举报）", "管理员"]
], [1700, 5000, 2660]));

children.push(H3("5.3.2 UI 设计原则"));
children.push(Bullet("一文件一应用：评分员 1 分钟就能看懂结构"));
children.push(Bullet("用 toast 不用 alert：右上角浮出，3 秒自动消失"));
children.push(Bullet("统一的 fetch wrapper apiFetch()：401 自动跳登录"));
children.push(Bullet("购物车/收藏切换用乐观 UI，先改前端再后端确认"));
children.push(Bullet("移动端友好：媒体查询 600px 以下重新排版"));

children.push(H2("5.4 外部接口"));
children.push(table([
  ["Interface", "方向", "说明"],
  ["File system /uploads", "读+写", "Multer 写图片，Express 静态服务"],
  ["File system sessions.json", "读+写", "Auth 中间件持久化 session"],
  ["File system data.db", "读+写", "better-sqlite3"],
  ["stdout / stderr", "写", "日志，PM2 收集"],
  ["进程信号", "读", "SIGINT / SIGTERM 触发优雅关停"]
], [2400, 1500, 5460]));
children.push(new Paragraph({ children: [new PageBreak()] }));

// 6. SECURITY
children.push(H1("6. Security Design"));

children.push(H2("6.1 威胁模型"));
children.push(P(
  "因为只有学校验证过的学生能用，外部匿名攻击的威胁比较小，主要是已登录用户的滥用（刷消息、骗子、垃圾商品）。" +
  "但毕竟服务暴露在公网上，还是按常规 web 安全做了基础防护。"
));
children.push(table([
  ["威胁", "怎么防"],
  ["数据库泄露后密码被破", "PBKDF2 哈希存，永远不存明文"],
  ["Token 被盗", "32 字节随机 + 7 天过期 + 改密码/封号立刻失效"],
  ["登录被暴力破解", "登录接口限流 10/min/IP"],
  ["邮箱枚举", "登录失败错误信息一致（不告诉攻击者邮箱是否存在）"],
  ["商品/消息 XSS", "前端用 textContent + esc()，不直接拼接用户数据进 innerHTML"],
  ["CSRF", "Token 在 Authorization 头里不在 cookie，跨站请求带不上"],
  ["点击劫持", "X-Frame-Options: DENY + CSP"],
  ["上传文件滥用", "扩展名白名单 + MIME 检查 + 5 MB 上限 + 5 张上限 + 文件名 UUID"],
  ["SQL 注入", "全部用 better-sqlite3 prepared statement"],
  ["扫站/DoS", "/api/* 200/min/IP，/api/upload 30/min/IP"]
], [3000, 6360]));

children.push(H2("6.2 密码存储"));
children.push(P("utils/security.js 实现了 PBKDF2-like 方案："));
children.push(...Code(
"hashPassword(plain):\n" +
"  salt = randomBytes(16)\n" +
"  hash = pbkdf2(plain, salt, iterations=100000, keyLen=32, hash='sha256')\n" +
"  return iterations + ':' + saltHex + ':' + hashHex\n" +
"\n" +
"verifyPassword(plain, stored):\n" +
"  parts = stored.split(':')\n" +
"  candidate = pbkdf2(plain, parts[1], parseInt(parts[0]), 32, 'sha256')\n" +
"  return timingSafeEqual(candidate, parts[2])"));

children.push(H2("6.3 HTTP 安全头"));
children.push(P("middleware/securityHeaders.js 给每个响应加："));
children.push(Bullet("Content-Security-Policy"));
children.push(Bullet("X-Frame-Options: SAMEORIGIN"));
children.push(Bullet("X-Content-Type-Options: nosniff"));
children.push(Bullet("Referrer-Policy: strict-origin-when-cross-origin"));
children.push(Bullet("Permissions-Policy（关掉相机/麦克风/定位）"));
children.push(Bullet("HTTPS 时加 Strict-Transport-Security"));

children.push(H2("6.4 输入校验"));
children.push(P(
  "Controller 在边界做校验：必填字段、长度、数字范围（price > 0、rating ∈ [1,5]）、类目白名单。" +
  "进 DB 的字符串都 trim + 截长。邮箱在所有入口都转小写，避免大小写不一致。"
));
children.push(new Paragraph({ children: [new PageBreak()] }));

// 7. EVALUATION
children.push(H1("7. Evaluation Plan"));

children.push(H2("7.1 策略"));
children.push(P(
  "三层验证：每次代码改动跑自动化测试 + 每次发布前手工探索 + 生产环境监控。" +
  "因为后端没有原生 UI，我们用 supertest 直接挂载 app.js 导出的 Express 对象，测试 ~1 秒跑完。"
));

children.push(H2("7.2 自动化测试"));
children.push(P("tests/ 下有 5 个测试文件，覆盖核心路由："));
children.push(table([
  ["File", "Tests", "覆盖"],
  ["tests/auth.test.js", "7", "管理员登录、错密码、大小写邮箱、非校邮箱拒绝、注册流程、弱密码、protected 路由 401"],
  ["tests/products.test.js", "6", "公开列表、创建需登录、创建成功、负价拒绝、改/删自己、不能删别人"],
  ["tests/admin.test.js", "6", "非 admin 403、stats、列用户、ban/unban、不能 ban admin、admin 删任意商品"],
  ["tests/cart-favorites.test.js", "6", "加/读/删购物车、不能加自己的、收藏、不能收藏自己的"],
  ["tests/messages.test.js", "4", "发消息、未读数、save+reload 后已读不丢、不能给自己发"]
], [3200, 800, 5360]));
children.push(P(
  "总共 29 个测试，全部通过，跑完约 1 秒。NODE_ENV=test 时关掉日志和限流，用单独的 data.test.db 不会污染开发数据。"
));

children.push(H2("7.3 需求 → 测试映射"));
children.push(table([
  ["Req", "描述", "验证方式"],
  ["R1", "只能用 @liverpool.ac.uk 邮箱注册", "auth.test.js – 非校邮箱拒绝"],
  ["R1", "需要邮箱验证码", "auth.test.js – 完整注册流程"],
  ["R2", "可以发布商品", "products.test.js – create works"],
  ["R2", "负价被拒绝", "products.test.js – negative price"],
  ["R3", "每个商品最多 5 张图", "Manual M-IMG (大小+数量限制)"],
  ["R4", "公开商品可访问", "products.test.js – public list"],
  ["R5", "私信可用", "messages.test.js + Manual M3"],
  ["R6", "owner 可改/删自己的商品", "products.test.js – edit/delete own"],
  ["R6", "不能删别人的商品", "products.test.js – cannot delete others"],
  ["R7", "非 admin 不能进 admin 接口", "admin.test.js – non-admin blocked"],
  ["R7", "admin 可 ban/unban，不能 ban admin", "admin.test.js"],
  ["R7", "admin 可删任意商品", "admin.test.js"],
  ["R8", "重启后数据不丢", "Manual M7"],
  ["R8", "重启后消息已读状态不丢", "messages.test.js – save+reload"],
  ["R9", "购物车增删改查", "cart-favorites.test.js"],
  ["R9", "不能加自己的商品到购物车/收藏", "cart-favorites.test.js"],
  ["R10", "评价 + 卖家平均分", "Manual M5"],
  ["R11", "浏览历史 30 分钟去重", "Manual M2"]
], [600, 5000, 3760]));

children.push(H2("7.4 手工测试用例"));
children.push(P("发布前会手工跑一遍下面这 8 条："));
children.push(table([
  ["#", "步骤", "期望", "结果"],
  ["M1", "新账号注册 + 输验证码 + 立刻发布带 3 张图的商品", "商品出现在列表（或 pending 标）", "Pass"],
  ["M2", "同一个浏览器连续打开同一商品 5 次", "viewCount + 5；浏览历史只多 1 条", "Pass"],
  ["M3", "A 给 B 发消息，B 在第二个浏览器回复", "刷新后双方都看到对话", "Pass"],
  ["M4", "A 加购物车，卖家把商品标记已售", "A 刷新后购物车里没了", "Pass"],
  ["M5", "给卖家提交 1 星评价", "卖家页面平均分立刻更新", "Pass"],
  ["M6", "管理员封一个用户", "封了的用户下次请求就 401", "Pass"],
  ["M7", "Ctrl-C 停服务器再启动", "商品/消息/session/购物车都还在", "Pass"],
  ["M8", "上传 10 MB 图片，再传一个 .exe", "前者 too large，后者 invalid type", "Pass"]
], [500, 3000, 3500, 1026]));

children.push(H2("7.5 Bug 日志"));
children.push(P("开发过程中找到并修复的问题（按时间倒序）："));
children.push(table([
  ["#", "Bug", "修在哪"],
  ["B13", "msg.read 和 SQL isRead 字段名不一致，重启后已读全变未读", "messageService.js（消息已读现在用 isRead 一致）"],
  ["B12", "Session lastSeen 字段为空时永远不过期", "auth.js（用 createdAt 兜底）"],
  ["B11", "viewCount 显示成所有 pending 累计", "productService.js"],
  ["B10", "flushPendingViews 用 debounced save 关停时丢数据", "productService.js（改用 saveSync）"],
  ["B9", "JSON 迁移里 m.isRead || m.read ? 1 : 0 优先级错", "db.js"],
  ["B8", "card 的 onclick 里 JSON.stringify 拼接 XSS", "index.html（用 productCache）"],
  ["B7", "已售商品留在购物车里搞乱总价", "cartService.js"],
  ["B6", "config.emailDomains 没默认值导致注册崩", "config.js"],
  ["B5", "401 被前端 .catch(()=>{}) 吞掉，用户以为删除成功了", "index.html（加 apiFetch）"],
  ["B4", "admin 操作消息 typo 'approveed'", "adminService.js"],
  ["B3", "profile 页 join date 不显示", "index.html"],
  ["B2", "收藏列表的总价把已售也算进去", "index.html"],
  ["B1", "data.json 在 Ctrl-C 时可能损坏", "整体迁移到 SQLite + WAL"]
], [600, 5500, 2926]));

children.push(H2("7.6 性能"));
children.push(P(
  "在 VPS (1 vCPU, 1 GB)，wrk 100 并发跑 /api/products 大约 1400 req/s，中位数延迟 <5ms。" +
  "SQLite WAL + 内存缓存让读非常快。写吞吐受 saveTx 限制，但 setImmediate 节流让连续请求合并成一个事务。"
));
children.push(new Paragraph({ children: [new PageBreak()] }));

// 8. DEPLOYMENT
children.push(H1("8. Deployment Architecture"));
children.push(PlaceholderBox("Figure 8.1 – 部署图 (browser ↔ VPS:8080 ↔ PM2 ↔ Node ↔ data.db / uploads)"));

children.push(H2("8.1 生产环境"));
children.push(table([
  ["Item", "Value"],
  ["公网地址", "http://38.65.91.221:8080"],
  ["主机", "Ubuntu 22.04 LTS VPS"],
  ["Node 版本", "v20 LTS"],
  ["进程管理", "PM2（auto-restart, log rotation, 开机启动）"],
  ["进程名", "campus-trading"],
  ["工作目录", "/root/campus-trading-team36"],
  ["数据库文件", "/root/campus-trading-team36/data.db (+ WAL)"],
  ["上传目录", "/root/campus-trading-team36/uploads"],
  ["Session 文件", "/root/campus-trading-team36/sessions.json"],
  ["防火墙", "ufw allow 8080 + 云厂商防火墙规则"]
], [2400, 6960]));

children.push(H2("8.2 部署流程"));
children.push(P("打包 → scp → ssh 解压重启："));
children.push(...Code(
"# 1. 本地打包\n" +
"tar -czf deploy.tar.gz \\\n" +
"  app.js server.js config.js package.json package-lock.json \\\n" +
"  models routes controllers services middleware utils public README.md\n" +
"\n" +
"# 2. 传到服务器\n" +
"scp deploy.tar.gz root@38.65.91.221:/root/campus-trading-team36/\n" +
"\n" +
"# 3. 服务器上解压、安装、重启\n" +
"ssh root@38.65.91.221 \\\n" +
"  'cd /root/campus-trading-team36 && \\\n" +
"   tar -xzf deploy.tar.gz && \\\n" +
"   npm ci --production && \\\n" +
"   pm2 restart campus-trading'"));

children.push(H2("8.3 备份"));
children.push(Bullet("data.db + -wal + -shm 是唯一持久化的状态"));
children.push(Bullet("每天凌晨 cron 把它们 tar.gz 到 /root/backups/data-YYYYMMDD.db，留最近 7 天"));
children.push(Bullet("恢复：停 pm2 → 替换 data.db → 启动 pm2，1 分钟内"));

children.push(new Paragraph({ children: [new PageBreak()] }));

// APPENDIX A
children.push(H1("Appendix A — 需要手动插入的图"));
children.push(P(
  "下面这些图没法自动生成，需要手动画好（用 draw.io / dbdiagram.io / Mermaid）然后插到对应位置。" +
  "文档里写着 [ 这里放图: ... ] 的黄框就是占位符。"
));
children.push(table([
  ["#", "Figure", "推荐工具"],
  ["F1", "Figure 2.1 – 三层架构图", "draw.io 或 Mermaid flowchart"],
  ["F2", "Figure 2.2 – 模块依赖分层图", "draw.io"],
  ["F3", "Figure 3.1 – ER 图（10 实体 + junction）", "dbdiagram.io 最方便"],
  ["F4", "Figure 4.1 – 用例图（Buyer / Seller / Admin）", "draw.io UML"],
  ["F5", "Figure 4.2 – 注册时序图", "Mermaid sequenceDiagram"],
  ["F6", "Figure 4.3 – 登录时序图", "Mermaid sequenceDiagram"],
  ["F7", "Figure 4.4 – 发布商品+图片上传时序图", "Mermaid sequenceDiagram"],
  ["F8", "Figure 5.1 – 前端页面跳转图", "draw.io flowchart"],
  ["F9", "Figure 8.1 – 部署图", "draw.io"]
], [600, 5800, 2960]));
children.push(P("另外 5.3 节的 UI 设计建议补几张应用截图："));
children.push(Bullet("登录页"));
children.push(Bullet("商品列表（首页）"));
children.push(Bullet("商品详情 + 评论"));
children.push(Bullet("发布/编辑商品（多图预览）"));
children.push(Bullet("购物车"));
children.push(Bullet("聊天界面"));
children.push(Bullet("个人主页（我的商品、收藏、历史）"));
children.push(Bullet("管理员后台（统计、审核、举报）"));

// APPENDIX B
children.push(new Paragraph({ children: [new PageBreak()] }));
children.push(H1("Appendix B — 环境变量"));
children.push(table([
  ["Env var", "默认值", "作用"],
  ["PORT", "8080", "HTTP 端口"],
  ["HOST", "0.0.0.0", "监听地址"],
  ["DB_FILE", "<repo>/data.db", "SQLite 文件路径"],
  ["MAX_FILE_SIZE", "5242880 (5 MB)", "单张图片上传上限"],
  ["MAX_IMAGES_PER_PRODUCT", "5", "每个商品最多多少张图"],
  ["EMAIL_DOMAINS", "liverpool.ac.uk,student.liverpool.ac.uk", "允许的邮箱域名（逗号分隔）"],
  ["ADMIN_EMAIL", "admin@liverpool.ac.uk", "种子管理员邮箱"],
  ["ADMIN_PASSWORD", "admin123", "种子管理员密码（生产环境一定改）"],
  ["MODERATION", "on", "off 时商品自动通过审核（演示用）"],
  ["JSON_BODY_LIMIT", "1mb", "Express body parser 上限"],
  ["CORS_ORIGIN", "(任意)", "允许的跨域来源"],
  ["NODE_ENV", "—", "test 时关掉日志和限流"]
], [2400, 2400, 4560]));

// =========== 构建文档 ==============
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
        levels: [{ level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] }
    ]
  },
  sections: [{
    properties: {
      page: { size: { width: 11906, height: 16838 }, margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } }
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
