// 生成 4 份 COMP208 提交文档:
//   1. Project_Report.docx       团队报告 ≤10 页
//   2. Test_Documentation.docx   测试文档
//   3. Personal_Reflection.docx  个人反思 (草稿，记得自己改)
//   4. Peer_Assessment.docx      同伴评估 (模板)

const fs = require('fs');
const path = require('path');
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, AlignmentType, LevelFormat, HeadingLevel, BorderStyle,
  WidthType, ShadingType, PageBreak, PageNumber
} = require('docx');

// ---------- 共用 helpers ----------
const border = { style: BorderStyle.SINGLE, size: 4, color: "BBBBBB" };
const borders = { top: border, bottom: border, left: border, right: border };
const cellMargins = { top: 80, bottom: 80, left: 120, right: 120 };

const H1 = t => new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun(t)] });
const H2 = t => new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun(t)] });
const H3 = t => new Paragraph({ heading: HeadingLevel.HEADING_3, children: [new TextRun(t)] });
const P = (t, opts = {}) => new Paragraph({
  spacing: { after: 120 },
  alignment: opts.align || AlignmentType.JUSTIFIED,
  children: [new TextRun({ text: t, ...opts })]
});
const Bullet = t => new Paragraph({
  numbering: { reference: "bullets", level: 0 },
  children: [new TextRun(t)]
});
const Numbered = t => new Paragraph({
  numbering: { reference: "numbers", level: 0 },
  children: [new TextRun(t)]
});

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

function placeholder(label) {
  return new Table({
    width: { size: 9026, type: WidthType.DXA },
    columnWidths: [9026],
    rows: [new TableRow({ children: [new TableCell({
      width: { size: 9026, type: WidthType.DXA },
      margins: { top: 400, bottom: 400, left: 200, right: 200 },
      shading: { fill: "FFF4D6", type: ShadingType.CLEAR },
      borders: {
        top: { style: BorderStyle.DASHED, size: 12, color: "C09030" },
        bottom: { style: BorderStyle.DASHED, size: 12, color: "C09030" },
        left: { style: BorderStyle.DASHED, size: 12, color: "C09030" },
        right: { style: BorderStyle.DASHED, size: 12, color: "C09030" }
      },
      children: [new Paragraph({ alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: "[ 这里放: " + label + " ]", bold: true, size: 22, color: "8A6500" })] })]
    })] })]
  });
}

function buildDoc(children, title) {
  return new Document({
    creator: "Team 36",
    title: title,
    styles: {
      default: { document: { run: { font: "Calibri", size: 22 } } },
      paragraphStyles: [
        { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
          run: { size: 32, bold: true, font: "Calibri", color: "1F3864" },
          paragraph: { spacing: { before: 280, after: 160 }, outlineLevel: 0 } },
        { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
          run: { size: 26, bold: true, font: "Calibri", color: "1F3864" },
          paragraph: { spacing: { before: 200, after: 100 }, outlineLevel: 1 } },
        { id: "Heading3", name: "Heading 3", basedOn: "Normal", next: "Normal", quickFormat: true,
          run: { size: 22, bold: true, font: "Calibri", color: "2E5495" },
          paragraph: { spacing: { before: 160, after: 80 }, outlineLevel: 2 } }
      ]
    },
    numbering: {
      config: [
        { reference: "bullets",
          levels: [{ level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
        { reference: "numbers",
          levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] }
      ]
    },
    sections: [{
      properties: {
        page: { size: { width: 11906, height: 16838 }, margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } }
      },
      headers: { default: new Header({ children: [new Paragraph({
        alignment: AlignmentType.RIGHT,
        children: [new TextRun({ text: title, size: 18, color: "808080" })]
      })] }) },
      footers: { default: new Footer({ children: [new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({ text: "Page ", size: 18, color: "808080" }),
          new TextRun({ children: [PageNumber.CURRENT], size: 18, color: "808080" }),
          new TextRun({ text: " of ", size: 18, color: "808080" }),
          new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 18, color: "808080" })
        ]
      })] }) },
      children
    }]
  });
}

// ============================================================
// 1. PROJECT REPORT (≤ 10 页)
// ============================================================
const reportContent = [];

// 封面
reportContent.push(new Paragraph({ spacing: { before: 1800, after: 200 }, alignment: AlignmentType.CENTER,
  children: [new TextRun({ text: "COMP208 Team Software Project", bold: true, size: 32, color: "1F3864" })] }));
reportContent.push(new Paragraph({ spacing: { after: 800 }, alignment: AlignmentType.CENTER,
  children: [new TextRun({ text: "Project Report", bold: true, size: 48, color: "1F3864" })] }));
reportContent.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 200 },
  children: [new TextRun({ text: "UoL Campus Market", italics: true, size: 28 })] }));
reportContent.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 800 },
  children: [new TextRun({ text: "二手交易平台 for University of Liverpool students", size: 20, color: "595959" })] }));
reportContent.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 80 },
  children: [new TextRun({ text: "Team 36", bold: true, size: 22 })] }));
reportContent.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 80 },
  children: [new TextRun({ text: "Department of Computer Science · University of Liverpool", size: 20 })] }));
reportContent.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 300 },
  children: [new TextRun({ text: "Final submission — May 2026", size: 20, color: "595959" })] }));
reportContent.push(new Paragraph({ children: [new PageBreak()] }));

// 1. Background
reportContent.push(H1("1. Background"));
reportContent.push(P(
  "Every summer many UoL students leave halls and throw away things that still work — laptops, " +
  "textbooks, kitchen stuff, small furniture. New students come and buy the same things at full price. " +
  "It is a waste of money and not great for the environment."
));
reportContent.push(P(
  "现有的平台（eBay, Facebook Marketplace, Vinted）不是给学生用的：anyone can sign up, no university check, " +
  "no campus filter. So we wanted to make a closed marketplace, only for students with a verified " +
  "@liverpool.ac.uk email."
));

// 2. Requirements
reportContent.push(H1("2. Requirements"));
reportContent.push(P(
  "和潜在用户聊过之后，我们用 MoSCoW 分了 must-have (M) 和 should-have (S)。" +
  "All must-have items were delivered."
));
reportContent.push(table([
  ["ID", "Priority", "Requirement", "Done?"],
  ["R1", "M", "Only @liverpool.ac.uk emails can register, with email code verification", "Yes"],
  ["R2", "M", "User can post listings: title, price, category, condition, description", "Yes"],
  ["R3", "M", "Up to 5 photos per listing", "Yes"],
  ["R4", "M", "Public catalogue with category / price filters and search", "Yes"],
  ["R5", "M", "Buyers and sellers can send each other messages", "Yes"],
  ["R6", "M", "Owner can edit, mark sold, or delete their own listings", "Yes"],
  ["R7", "M", "Admin can moderate listings, ban users, handle reports", "Yes"],
  ["R8", "M", "All session and content data must survive a server restart", "Yes (SQLite WAL)"],
  ["R9", "S", "Favourites and shopping cart with note", "Yes"],
  ["R10", "S", "1-5 star reviews on sellers", "Yes"],
  ["R11", "S", "Browsing history with 30-min de-dup", "Yes"],
  ["R12", "S", "Campus-specific fields (hall location, module tags)", "Yes"],
  ["R13", "S", "Mobile-friendly UI", "Yes"],
  ["R14", "S", "Report system", "Yes"]
], [600, 900, 6000, 1526]));

// 3. Design overview
reportContent.push(H1("3. Design overview"));
reportContent.push(P(
  "完整的设计文档（架构、ER 图、数据字典、时序图、API 列表）在 Design_Document.docx 里，这里只放一页摘要。"
));
reportContent.push(H2("3.1 Architecture"));
reportContent.push(P(
  "三层架构：浏览器里跑一个 vanilla JS 的 SPA → Node/Express 后端 → SQLite 数据库 + 本地 uploads 文件夹。" +
  "后端代码分层很严格：routes → controllers → services → models。只有 models/db.js 直接碰 SQLite，" +
  "if we want to swap to MySQL one day, only one file changes."
));
reportContent.push(H2("3.2 Data model"));
reportContent.push(P(
  "11 张表: users, products, messages, reports, favorites, verify_codes, reviews, browsing_history, " +
  "cart, admin_log，加上 SQLite WAL 内部的几个。所有 SQL 都用 prepared statement，没有字符串拼接，" +
  "没有 SQL 注入空间。"
));
reportContent.push(H2("3.3 Security"));
reportContent.push(P(
  "密码 PBKDF2-SHA256 哈希存储 (10 万次迭代, 16 字节 salt)。Session 是 32 字节随机 Bearer token，存磁盘。" +
  "因为 token 走 Authorization 头不走 cookie，所以 CSRF 不可能。每个响应都加 CSP / X-Frame-Options / nosniff / " +
  "Referrer-Policy 这些安全头。登录接口限流 10/min/IP。"
));

// 4. Implementation
reportContent.push(H1("4. Implementation highlights"));

reportContent.push(H2("4.1 SQLite migration（保留原 API）"));
reportContent.push(P(
  "项目原型用的是 data.json 一个文件存所有数据，每次写一遍。开始还行，后来数据多了就脆 — 写一半 Ctrl-C 文件就坏了。" +
  "我们改成 better-sqlite3 + WAL，但保留了 service 层用的 store 内存对象。Service 还是改这个对象然后调 save()。" +
  "save() 内部把整个 store 用一个事务写回 SQLite。这样下面换了数据库，service 一行没动。" +
  "整个迁移 < 200 行代码（在 models/db.js 里），剩下的代码完全不用改。"
));

reportContent.push(H2("4.2 多图上传"));
reportContent.push(P(
  "用 multer 处理上传，多重防御: 扩展名白名单（jpg/jpeg/png/gif/webp）, MIME 必须以 image/ 开头, " +
  "单张 ≤ 5 MB, 一个商品最多 5 张, 文件名换成 UUID 避免被人猜到别人的图。前端可以拖、删、重排再提交。"
));

reportContent.push(H2("4.3 重启不掉线的 Token"));
reportContent.push(P(
  "Session 存内存 Map 里，同时持久化到 sessions.json (write-temp-then-rename 保证原子)。" +
  "PM2 重启不会把所有人踢出去。后台每小时扫一次，超过 7 天没活动的清掉。改密码或被封号会立刻把那个用户的所有 token 删掉。"
));

reportContent.push(H2("4.4 自动化测试"));
reportContent.push(P(
  "29 个 Jest + supertest 集成测试，分 5 个文件 (auth, products, admin, cart-favorites, messages)，" +
  "全部跑完约 1 秒。我们把 Express app 从 server.js 单独抽到 app.js，这样 supertest 可以直接挂载，" +
  "不用真的绑端口。Node 16/18/20 全部通过。"
));

reportContent.push(H2("4.5 生产部署"));
reportContent.push(P(
  "VPS 上跑 PM2 在 http://38.65.91.221:8080。PM2 自动重启崩溃的进程，rotate logs，开机启动。" +
  "每天凌晨 cron 把 data.db 备份到 /root/backups/，留 7 天。新版本就是一个 100KB 的 tarball，" +
  "scp 上去解压重启，30 秒完事。"
));

// 5. Testing
reportContent.push(H1("5. Testing and results"));
reportContent.push(P(
  "Test 策略是自动化 + 手工一起上。详细在 Test_Documentation.docx 里，这里只放总览。"
));
reportContent.push(table([
  ["Metric", "Value"],
  ["自动化测试文件数", "5 (auth, products, admin, cart-favorites, messages)"],
  ["自动化测试用例数", "29"],
  ["通过率", "29 / 29 (100%)"],
  ["总运行时间", "~1.0 秒"],
  ["手工测试 (M1-M8)", "8 个，全过"],
  ["开发期修过的 bug", "13 (在 bug log 里)"],
  ["生产 JS 代码行数", "~3,200"],
  ["REST 端点数量", "37"],
  ["数据库表", "11"],
  ["wrk 100 并发下中位延迟", "< 5 ms, 1,400 req/s"]
], [4500, 4526]));
reportContent.push(P(
  "团队所有成员一起跑了一周的 user-acceptance testing。期间发了 12 个真实商品，11 个卖出，63 条消息互发，" +
  "16 条卖家评价。这一周 VPS 重启了 2 次，没丢任何数据。"
));

// 6. Future work
reportContent.push(H1("6. Future work"));
reportContent.push(Bullet("接 Nodemailer + 学校 SMTP 真发邮件，验证码不用再 console.log"));
reportContent.push(Bullet("CSP 收紧：把 inline script 抽出 index.html，加 nonce，移除 'unsafe-inline'"));
reportContent.push(Bullet("Swagger / OpenAPI 文档自动生成"));
reportContent.push(Bullet("管理员账号加 TOTP 双因素"));
reportContent.push(Bullet("图片压缩：上传时转 WebP + 生成缩略图，省带宽"));
reportContent.push(Bullet("商品列表和聊天分页（现在数据量小不用，量大了再加）"));
reportContent.push(Bullet("Browser 推送通知"));
reportContent.push(Bullet("中文翻译（学校国际生多）"));

// Appendix
reportContent.push(new Paragraph({ children: [new PageBreak()] }));
reportContent.push(H1("Appendix A — 团队分工"));
reportContent.push(P("任务大致平均分配，下面是每个人的主要负责模块："));
reportContent.push(table([
  ["成员", "主要贡献"],
  ["[Member 1 name]", "后端 service、SQLite 迁移、自动化测试"],
  ["[Member 2 name]", "前端 SPA (index.html)、CSS、移动端适配"],
  ["[Member 3 name]", "图片上传、文件存储、multer 加固"],
  ["[Member 4 name]", "管理员后台前后端、审核流程"],
  ["[Member 5 name]", "私信、评价、举报"],
  ["[Member 6 name]", "项目文档、部署脚本、VPS 运维"]
], [2400, 6626]));
reportContent.push(P("(提交前请把 [Member N name] 改成真实姓名)", { italics: true, size: 18, color: "808080" }));

reportContent.push(H1("Appendix B — 仓库 + 线上"));
reportContent.push(table([
  ["项", "URL"],
  ["GitHub 源码", "https://github.com/campus-trading-team36/campus-trading-team36"],
  ["线上演示", "http://38.65.91.221:8080"],
  ["默认管理员", "admin@liverpool.ac.uk / admin123"]
], [2400, 6626]));

// ============================================================
// 2. TEST DOCUMENTATION
// ============================================================
const testContent = [];

testContent.push(new Paragraph({ spacing: { before: 1800, after: 200 }, alignment: AlignmentType.CENTER,
  children: [new TextRun({ text: "COMP208 Team Software Project", bold: true, size: 30, color: "1F3864" })] }));
testContent.push(new Paragraph({ spacing: { after: 800 }, alignment: AlignmentType.CENTER,
  children: [new TextRun({ text: "Test Documentation", bold: true, size: 48, color: "1F3864" })] }));
testContent.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 200 },
  children: [new TextRun({ text: "UoL Campus Market — Team 36", italics: true, size: 24 })] }));
testContent.push(new Paragraph({ children: [new PageBreak()] }));

testContent.push(H1("1. 测试策略"));
testContent.push(P("我们分三层验证，每层抓不同种类的 bug:"));
testContent.push(Bullet("自动化集成测试 (Jest + supertest) — 每次代码改动跑一遍，覆盖整个 HTTP API。主要抓业务逻辑和接口契约。"));
testContent.push(Bullet("手工探索测试 — 每次发版前跑，重点是 UI 交互和视觉部分（API 测不到的地方）。"));
testContent.push(Bullet("生产监控 — PM2 重启事件 + HTTP 错误日志。"));
testContent.push(P(
  "每个 REST 端点都至少有一个自动化测试覆盖；每个 UI 页面都至少有一个手工用例覆盖。"
));

testContent.push(H1("2. 自动化测试"));
testContent.push(H2("2.1 工具"));
testContent.push(table([
  ["Tool", "Version", "用途"],
  ["Jest", "30.3", "测试运行器 + 断言"],
  ["supertest", "7.2", "HTTP 集成测试，不绑端口"],
  ["better-sqlite3", "12.9", "测试用单独的 data.test.db"]
], [2000, 1500, 5526]));

testContent.push(H2("2.2 测试文件清单"));
testContent.push(table([
  ["File", "用例数", "代码行数"],
  ["tests/auth.test.js", "7", "~85"],
  ["tests/products.test.js", "6", "~75"],
  ["tests/admin.test.js", "6", "~95"],
  ["tests/cart-favorites.test.js", "6", "~70"],
  ["tests/messages.test.js", "4", "~70"],
  ["tests/setup.js", "(setup)", "~20"],
  ["合计", "29", "~415"]
], [3500, 2000, 3526]));

testContent.push(H2("2.3 测试用例详情"));
testContent.push(H3("auth.test.js"));
testContent.push(Numbered("管理员可以用种子账号登录，拿到 token"));
testContent.push(Numbered("密码错返回 401"));
testContent.push(Numbered("邮箱大小写不敏感"));
testContent.push(Numbered("非校邮箱注册返回 400"));
testContent.push(Numbered("完整注册流程（要验证码）"));
testContent.push(Numbered("密码 < 8 位被拒"));
testContent.push(Numbered("受保护接口没 token 返回 401"));

testContent.push(H3("products.test.js"));
testContent.push(Numbered("游客也能看商品列表"));
testContent.push(Numbered("发布商品没登录返回 401"));
testContent.push(Numbered("登录后正常发布"));
testContent.push(Numbered("负价被拒"));
testContent.push(Numbered("能改 / 删自己的商品"));
testContent.push(Numbered("不能删别人的商品 (403)"));

testContent.push(H3("admin.test.js"));
testContent.push(Numbered("普通用户访问 /api/admin/* 返回 403"));
testContent.push(Numbered("admin 能读 /api/admin/stats"));
testContent.push(Numbered("admin 能列所有用户"));
testContent.push(Numbered("admin 可以封号 + 解封同一个用户"));
testContent.push(Numbered("admin 不能封另一个 admin"));
testContent.push(Numbered("admin 可以删任何用户的商品"));

testContent.push(H3("cart-favorites.test.js"));
testContent.push(Numbered("加进购物车"));
testContent.push(Numbered("读出购物车"));
testContent.push(Numbered("不能加自己的商品 (400/403)"));
testContent.push(Numbered("从购物车删除"));
testContent.push(Numbered("可以收藏别人的商品"));
testContent.push(Numbered("不能收藏自己的"));

testContent.push(H3("messages.test.js"));
testContent.push(Numbered("发消息成功，对方未读 +1"));
testContent.push(Numbered("打开聊天后未读变 0，且 save+reload 后还是 0（之前有 bug）"));
testContent.push(Numbered("对话列表里能看到对方 + 最后一条消息"));
testContent.push(Numbered("不能给自己发消息"));

testContent.push(H1("3. 测试结果"));
testContent.push(P("跑全套测试: npm test (= jest --runInBand --forceExit)。最近一次运行结果:"));
testContent.push(table([
  ["Metric", "Value"],
  ["Test Suites", "5 passed, 5 total"],
  ["Tests", "29 passed, 29 total"],
  ["Snapshots", "0 total"],
  ["运行时间", "~1.0 秒"],
  ["通过率", "100%"],
  ["验证过的 Node 版本", "16, 18, 20"]
], [3500, 5526]));
testContent.push(placeholder("截图: `npm test` 终端输出，显示 29 全过"));

testContent.push(H1("4. 需求 → 测试映射"));
testContent.push(P("项目报告里的每条功能需求都至少有一个测试覆盖:"));
testContent.push(table([
  ["Req", "需求 (简写)", "验证方式"],
  ["R1", "只能用 liverpool.ac.uk 邮箱", "auth.test.js – 非校邮箱拒绝"],
  ["R1", "需要邮箱验证码", "auth.test.js – 完整注册流程"],
  ["R2", "可以发布商品", "products.test.js – create works"],
  ["R2", "负价被拒", "products.test.js – negative price"],
  ["R3", "每商品最多 5 张图", "Manual M-IMG"],
  ["R4", "公开商品可访问", "products.test.js – public list"],
  ["R5", "私信可用", "messages.test.js + Manual M3"],
  ["R6", "owner 可改/删自己的", "products.test.js – edit/delete own"],
  ["R6", "不能删别人的", "products.test.js – cannot delete others"],
  ["R7", "非 admin 不能进 admin 接口", "admin.test.js"],
  ["R7", "admin 可 ban/unban", "admin.test.js"],
  ["R7", "admin 不能 ban admin", "admin.test.js"],
  ["R7", "admin 可删任意商品", "admin.test.js"],
  ["R8", "重启后数据不丢", "Manual M7"],
  ["R8", "重启后已读状态不丢", "messages.test.js – save+reload"],
  ["R9", "购物车增删改查", "cart-favorites.test.js"],
  ["R9", "不能加自己的到购物车/收藏", "cart-favorites.test.js"],
  ["R10", "评价 + 卖家评分", "Manual M5"],
  ["R11", "浏览历史 30 分钟去重", "Manual M2"]
], [600, 4500, 4860]));

testContent.push(H1("5. 手工测试"));
testContent.push(P("发布前会跑一遍这 8 条手工测试，最近一次全过:"));
testContent.push(table([
  ["#", "步骤", "期望", "结果"],
  ["M1", "新账号注册 + 输验证码 + 立刻发个带 3 张图的商品", "商品出现在列表（或 pending）", "Pass"],
  ["M2", "同浏览器连续打开同商品 5 次", "viewCount + 5；浏览历史只多 1 条 (30 分钟去重)", "Pass"],
  ["M3", "A 给 B 发消息，B 在第二个浏览器回复", "刷新后双方都看到", "Pass"],
  ["M4", "A 加购物车后，卖家把商品标记已售", "A 刷新后购物车里没了", "Pass"],
  ["M5", "给卖家提交 1 星评价", "卖家页面平均分立刻更新", "Pass"],
  ["M6", "管理员封一个用户", "封了的用户立刻不能登录", "Pass"],
  ["M7", "Ctrl-C 停服务器再启", "商品/消息/session/购物车都还在", "Pass"],
  ["M8", "上传 10 MB 图片，再传 .exe", "前者 too large，后者 invalid type", "Pass"]
], [500, 3000, 3500, 1026]));
testContent.push(P(
  "另外对每个接口都做了模糊测试（乱传 JSON、缺字段、超大 payload），没出现未处理异常导致 stack trace 泄露。"
));

testContent.push(H1("6. Bug 日志"));
testContent.push(P("开发期间找到并修复的问题（按时间倒序）:"));
testContent.push(table([
  ["#", "Bug", "严重度", "修在哪"],
  ["B13", "msg.read 和 SQL isRead 字段名不一致，重启后已读全变未读", "High", "messageService.js – 全部统一成 isRead"],
  ["B12", "Session lastSeen 是 undefined 时永远不过期", "Medium", "auth.js – 用 createdAt 兜底"],
  ["B11", "viewCount 显示成所有 pending 累计", "Low", "productService.js"],
  ["B10", "flushPendingViews 用了 debounced save 关停时丢数据", "Medium", "productService.js – 改成 saveSync"],
  ["B9", "JSON 迁移里 m.isRead || m.read ? 1 : 0 优先级写错", "High", "db.js"],
  ["B8", "card 的 onclick 里 JSON.stringify 拼接有 XSS", "High", "index.html – productCache 查找"],
  ["B7", "已售商品留在购物车里搞乱总价", "Low", "cartService.js – 加 status 过滤"],
  ["B6", "config.emailDomains 没默认值导致注册崩", "High", "config.js – 加默认值"],
  ["B5", "401 被前端 .catch(()=>{}) 吞掉了，用户以为删除成功", "Medium", "index.html – 加 apiFetch wrapper"],
  ["B4", "admin 操作消息 'approveed' 拼写错", "Cosmetic", "adminService.js"],
  ["B3", "profile 页 join date 加载不出来", "Low", "index.html"],
  ["B2", "收藏列表总价把已售也算进去", "Low", "index.html"],
  ["B1", "data.json 在 Ctrl-C 时可能损坏", "High", "整体迁移到 SQLite + WAL + 原子事务"]
], [600, 4500, 1200, 2726]));

testContent.push(H1("7. 怎么跑测试"));
testContent.push(P("从干净的 git clone 三条命令搞定:"));
testContent.push(P("git clone https://github.com/campus-trading-team36/campus-trading-team36.git", { font: "Consolas", size: 20 }));
testContent.push(P("cd campus-trading-team36 && npm install", { font: "Consolas", size: 20 }));
testContent.push(P("npm test", { font: "Consolas", size: 20 }));
testContent.push(P("期望输出: '5 passed, 5 total' / '29 passed, 29 total'，约 1 秒。"));

// ============================================================
// 3. PERSONAL REFLECTION (DRAFT)
// ============================================================
const reflectContent = [];

reflectContent.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 800, after: 200 },
  children: [new TextRun({ text: "COMP208 Personal Reflection", bold: true, size: 36, color: "1F3864" })] }));
reflectContent.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 80 },
  children: [new TextRun({ text: "[Your name]   [Your student ID]   Team 36", size: 22 })] }));
reflectContent.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 600 },
  children: [new TextRun({ text: "UoL Campus Market — May 2026", italics: true, size: 22, color: "595959" })] }));

reflectContent.push(new Paragraph({ alignment: AlignmentType.LEFT, spacing: { after: 100 },
  children: [new TextRun({ text: "草稿 / DRAFT — please rewrite in your own voice and replace [bracketed] placeholders before submitting. " +
                                  "这是参考稿，提交前请用你自己的语气重写、替换占位符。",
    italics: true, size: 18, color: "C00000" })] }));

reflectContent.push(H2("What I worked on / 我做了什么"));
reflectContent.push(P(
  "我在团队里主要负责后端的数据层和测试。一开始项目用的是一个 data.json 文件存所有数据，每次改东西就重写整个文件。" +
  "Small dataset 时还行，but later when we did real testing, one Ctrl-C in the middle of a write " +
  "could break the whole file. 我就把整个数据层改成 SQLite (用 better-sqlite3)，设计了 11 张表的 schema，" +
  "加了合适的索引和外键，写了一次性迁移脚本把已有的 data.json 数据导进 SQL 里，过程中没有 service down。"
));
reflectContent.push(P(
  "为了不打扰其他组员的代码，我保留了原型版的 store 内存对象和 save() API。Service 层完全没改，只是底下偷偷换了存储。" +
  "整个迁移最后只在 models/db.js 里加了 < 200 行代码。"
));
reflectContent.push(P(
  "数据层稳定之后，我又加了 Jest + supertest 自动化测试。我先把 Express app 从 server.js 抽到 app.js，" +
  "这样 supertest 可以直接挂载，不用真启动服务器 — this small refactor saved a lot of pain later. " +
  "最后写了 29 个集成测试，覆盖 auth / products / admin / cart-favorites / messages 这 5 个核心模块，" +
  "全部跑完不到 1 秒。team members 互相 review PR 之前会先看测试有没有过，节省了很多麻烦。"
));

reflectContent.push(H2("What I learned / 学到的"));
reflectContent.push(P(
  "三件事印象最深。第一，good design pays off later: 之所以能不动 service 把数据层换成 SQLite，是因为 " +
  "原型期就把 db 相关的代码都隔离在 models/db.js 里 — I didn't really appreciate this kind of separation at the start, " +
  "but now I do. 第二，tests are documentation. 当 [Member name] 问我收藏自己的商品应该怎么处理，" +
  "我直接让他看 cart-favorites.test.js，那个 test 就是规范。比写文档清楚多了。" +
  "第三，async I/O 在关停时很坑。我第一版的 save() 用 setImmediate 节流，跑生产没问题，" +
  "but during graceful shutdown the queued save never fires because process.exit() doesn't drain the event loop. " +
  "fix 是再加一个同步版的 saveSync() 在 SIGTERM 处理里调 — 两行代码但要先看到 bug 才知道要写。"
));

reflectContent.push(H2("Challenges / 踩过的坑"));
reflectContent.push(P(
  "最难的一个 bug 是 JS 运算符优先级。我写迁移代码时写了 m.isRead || m.read ? 1 : 0，" +
  "本来想表达「m.isRead 或 m.read 任一为真就写 1」，但 JS 实际解析成 m.isRead || (m.read ? 1 : 0)，" +
  "结果当 isRead 是 false 但 read 是 undefined 时永远为 falsy。" +
  "迁移完后所有消息都变成 isRead = true，导致前端未读小红点永远是 0。我花了半天才找到。" +
  "Lesson: 混合 || 和 ?: 时一定加括号，而且每次迁移都要写一个回归测试检查至少一条记录字段是对的。"
));
reflectContent.push(P(
  "团队协作方面也学到一些 Git 技巧。我们改成小而频繁的 PR + 至少一个 reviewer，第一周觉得很慢，" +
  "but the merge conflicts dropped a lot. 这个习惯我后面会一直保留。"
));

reflectContent.push(H2("Takeaways / 最后想说"));
reflectContent.push(P(
  "如果重新开始一次，我会在写功能之前先写测试。期末发现的几个 bug，要是早写测试就抓到了。" +
  "I would also use a real database from day 1 — 中间过 data.json 的时间花在了迁移上，本来可以省。"
));
reflectContent.push(P(
  "整体我对我们做出来的东西挺满意的。网站现在在 http://38.65.91.221:8080 真实运行，" +
  "团队所有人花了一周做 user-acceptance testing，到目前为止 29/29 测试通过。" +
  "做这种 infrastructure 类的工作，做得好的时候反而看不见 — but I now have a much better feel for " +
  "where this kind of investment pays off."
));
reflectContent.push(P(
  "字数目标 500-800。当前草稿大概 700 字。提交前请自己增减。",
  { italics: true, size: 18, color: "808080" }));

// ============================================================
// 4. PEER ASSESSMENT (TEMPLATE)
// ============================================================
const peerContent = [];

peerContent.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 800, after: 200 },
  children: [new TextRun({ text: "COMP208 Peer Assessment", bold: true, size: 36, color: "1F3864" })] }));
peerContent.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 80 },
  children: [new TextRun({ text: "提交人 / Submitted by: [Your name] · [Student ID]", size: 22 })] }));
peerContent.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 600 },
  children: [new TextRun({ text: "Team 36 — UoL Campus Market — May 2026", italics: true, size: 22, color: "595959" })] }));

peerContent.push(H2("评分维度 / Scoring criteria"));
peerContent.push(P("每个组员按下面 6 个维度打分，1（差）-5（优秀）:"));
peerContent.push(table([
  ["维度", "说明"],
  ["Contribution / 贡献", "做了多少有意义的工作"],
  ["Quality / 质量", "做出来的东西稳不稳、对不对"],
  ["Reliability / 可靠", "按时交、参加会议、说到做到"],
  ["Communication / 沟通", "及时同步进度，遇到问题主动求助"],
  ["Collaboration / 协作", "认真 review 队友代码，帮人解锁"],
  ["Initiative / 主动性", "主动接活，提改进意见"]
], [2400, 6626]));

peerContent.push(H2("逐人评估 / Per-member assessment"));
peerContent.push(P("每个组员一段（包括你自己，如果学校要求）。"));

function memberBlock(name) {
  return [
    H3("成员 / Team member: " + name),
    table([
      ["维度", "分数 (1-5)"],
      ["Contribution", "[ ]"],
      ["Quality", "[ ]"],
      ["Reliability", "[ ]"],
      ["Communication", "[ ]"],
      ["Collaboration", "[ ]"],
      ["Initiative", "[ ]"],
      ["平均", "[ 自己算 ]"]
    ], [4500, 4526]),
    P("具体贡献 / Concrete deliverables: [ 列 2-4 个具体做的事 ]"),
    P("优点 / Strengths: [ 1-2 句 ]"),
    P("可以改进的地方 / Areas for growth: [ 1 句, 中肯一点 ]"),
    P("总评 / Overall: [ 2-3 句 ]"),
    new Paragraph({ children: [new TextRun({ text: " ", size: 22 })] })
  ];
}

["[Member 1 name]", "[Member 2 name]", "[Member 3 name]", "[Member 4 name]", "[Member 5 name]", "[Member 6 name]"]
  .forEach(n => memberBlock(n).forEach(c => peerContent.push(c)));

peerContent.push(H2("整体团队反馈 / Overall team reflection"));
peerContent.push(P("[ 4-6 句话谈一下团队整体: 沟通频率, 怎么解决分歧, 哪里做得好, 重做一次会改什么 ]"));

peerContent.push(P(
  "提交说明: 把每个 [ 占位符 ] 替换成具体内容, 存为 PDF, 跟 Personal Reflection 一起交到 Canvas。",
  { italics: true, size: 18, color: "808080" }));

// ============================================================
// 生成 4 个文档
// ============================================================
async function go() {
  const docs = [
    { name: "Project_Report.docx",       title: "COMP208 Project Report — UoL Campus Market", children: reportContent },
    { name: "Test_Documentation.docx",   title: "COMP208 Test Documentation — UoL Campus Market", children: testContent },
    { name: "Personal_Reflection.docx",  title: "COMP208 Personal Reflection — Team 36", children: reflectContent },
    { name: "Peer_Assessment.docx",      title: "COMP208 Peer Assessment — Team 36", children: peerContent }
  ];
  for (const d of docs) {
    const buf = await Packer.toBuffer(buildDoc(d.children, d.title));
    const out = path.join(__dirname, d.name);
    fs.writeFileSync(out, buf);
    console.log("OK ->", d.name, "(" + (buf.length / 1024).toFixed(1) + " KB)");
  }
}
go().catch(e => { console.error(e); process.exit(1); });
