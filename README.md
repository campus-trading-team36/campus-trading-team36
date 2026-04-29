# UoL Campus Market

一个给利物浦大学学生用的二手交易平台。Team 36 做的 COMP208 项目。

**线上地址：** http://38.65.91.221:8080

---

## 功能 / Features

- 学校邮箱（@liverpool.ac.uk）注册 + 验证码
- 发布商品，可以传最多 5 张图片
- 商品字段比较全：成色、品牌、购买时间、宿舍位置、标签、瑕疵描述
- 购物车、收藏、浏览历史
- 卖家评价（1-5 星）
- 买家卖家可以直接发消息
- 举报不合规商品
- 管理员后台：用户管理、商品审核、统计、举报处理

---

## 技术栈 / Tech stack

- 后端：Node.js + Express
- 前端：原生 JS 单页应用（就一个 index.html）
- 数据库：SQLite（用 better-sqlite3）
- 图片上传：multer
- 登录：自己写的 token 方案，存在内存里 + 持久化到 sessions.json
- 测试：Jest + supertest

> 一开始用的是 JSON 文件存数据，后来改成 SQLite 了。

---

## 怎么跑 / How to run

需要 Node.js v16 以上。

```bash
git clone https://github.com/campus-trading-team36/campus-trading-team36.git
cd campus-trading-team36
npm install
npm start
```

打开浏览器 http://localhost:8080

---

## 默认账号

| 角色 | 邮箱 | 密码 |
|-----|------|------|
| Admin | admin@liverpool.ac.uk | admin123 |

注册需要 @liverpool.ac.uk 邮箱。验证码会在 dev 模式下直接返回到响应里（演示用），不用真的发邮件。

---

## 文件结构 / Project structure

```
campus-trading-team36/
├── server.js              # 启动文件
├── app.js                 # Express 应用本体（测试也用这个）
├── config.js              # 配置
├── package.json
├── models/
│   └── db.js              # SQLite 数据层
├── middleware/
│   ├── auth.js            # 登录认证
│   ├── errorHandler.js    # 错误处理
│   ├── logger.js          # 请求日志
│   ├── rateLimiter.js     # 限流
│   └── securityHeaders.js # 安全头
├── routes/                # 路由
├── controllers/           # 处理 HTTP
├── services/              # 业务逻辑
├── utils/                 # 工具函数
├── public/
│   └── index.html         # 前端单页应用
├── tests/                 # Jest 测试
└── uploads/               # 图片存这里（自动创建）
```

---

## 接口 / API

| Method | Endpoint | 是否需要登录 | 干啥的 |
|--------|----------|--------------|--------|
| POST | /api/user/verify | 否 | 发验证码 |
| POST | /api/user/register | 否 | 注册 |
| POST | /api/user/login | 否 | 登录 |
| POST | /api/user/logout | 是 | 登出 |
| GET | /api/user/profile | 是 | 个人信息 |
| GET | /api/user/cart | 是 | 看购物车 |
| POST | /api/user/cart | 是 | 加购物车 |
| DELETE | /api/user/cart/:id | 是 | 删购物车 |
| GET | /api/user/history | 是 | 浏览历史 |
| POST | /api/user/history | 是 | 记一次浏览 |
| GET | /api/products | 否 | 商品列表（支持过滤） |
| GET | /api/products/:id | 否 | 商品详情 |
| POST | /api/products | 是 | 发布商品 |
| PUT | /api/products/:id | 是 | 改商品 |
| DELETE | /api/products/:id | 是 | 删商品 |
| PUT | /api/products/:id/sold | 是 | 标记已售 |
| POST | /api/upload | 是 | 上传图片（最多 5 张） |
| POST | /api/review | 是 | 给卖家评价 |
| GET | /api/review/seller/:id | 否 | 看卖家评分 |
| GET | /api/admin/stats | 管理员 | 平台统计 |
| GET | /api/admin/users | 管理员 | 所有用户 |
| GET | /api/admin/products/all | 管理员 | 所有商品 |
| GET | /api/admin/reports | 管理员 | 举报列表 |

---

## 测试

```bash
npm test
```

跑完应该看到：

```
Test Suites: 5 passed, 5 total
Tests:       29 passed, 29 total
```

测试在隔离的 `data.test.db` 里跑，不会动开发数据。

---

## 部署到 VPS

服务器上跑的是 PM2：

```bash
npm install -g pm2
pm2 start server.js --name campus-trading
pm2 save
pm2 startup

# 改完代码上传新文件后：
pm2 restart campus-trading
```

防火墙记得开 8080：

```bash
ufw allow 8080
```

---

## 团队 / Team

Team 36 — University of Liverpool, COMP208 (2025/26)
