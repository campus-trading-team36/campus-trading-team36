// Admin controller - handles admin panel endpoints

const adminService = require("../services/adminService");
const reportService = require("../services/reportService");

// GET /api/admin/products/pending
function pendingProducts(req, res) {
  const result = adminService.getPendingProducts();
  res.json(result);
}

// POST /api/admin/products/:id/review
function reviewProduct(req, res) {
  const { action, reason } = req.body;
  const result = adminService.reviewProduct(req.params.id, action, reason, req.user);
  const status = result.success ? 200 : 400;
  res.status(status).json(result);
}

// GET /api/admin/users
function allUsers(req, res) {
  const result = adminService.getAllUsers();
  res.json(result);
}

// POST /api/admin/users/:id/ban
function banUser(req, res) {
  const banned = req.body && req.body.banned !== undefined ? !!req.body.banned : true;
  const result = adminService.setUserBanned(req.params.id, banned, req.user);
  const status = result.success ? 200 : 400;
  res.status(status).json(result);
}

// POST /api/admin/users/:id/role
function setUserRole(req, res) {
  const { role } = req.body || {};
  const result = adminService.setUserRole(req.params.id, role, req.user);
  const status = result.success ? 200 : 400;
  res.status(status).json(result);
}

// DELETE /api/admin/users/:id
function deleteUser(req, res) {
  if (req.params.id === req.user.id) {
    return res.status(400).json({ success: false, message: 'You cannot delete your own account' });
  }
  const result = adminService.deleteUser(req.params.id, req.user);
  const status = result.success ? 200 : 400;
  res.status(status).json(result);
}

// GET /api/admin/reports
function allReports(req, res) {
  const status = req.query.status || "all";
  const result = reportService.getReports(status);
  res.json(result);
}

// POST /api/admin/reports/:id/handle
function handleReport(req, res) {
  const { action } = req.body;
  const result = reportService.handleReport(req.params.id, action);
  const httpStatus = result.success ? 200 : 400;
  res.status(httpStatus).json(result);
}

// GET /api/admin/stats
function stats(req, res) {
  const result = adminService.getStats();
  res.json(result);
}

function allProducts(req, res) {
  const result = adminService.getAllProducts();
  res.json(result);
}

// GET /api/admin/log?limit=100
function auditLog(req, res) {
  const result = adminService.getAuditLog(req.query.limit);
  res.json(result);
}

module.exports = {
  pendingProducts,
  reviewProduct,
  allUsers,
  banUser,
  setUserRole,
  deleteUser,
  allReports,
  handleReport,
  stats,
  allProducts,
  auditLog
};
