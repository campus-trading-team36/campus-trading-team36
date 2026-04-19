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
  const result = adminService.reviewProduct(req.params.id, action, reason);
  const status = result.success ? 200 : 400;
  res.status(status).json(result);
}

// GET /api/admin/users
function allUsers(req, res) {
  const result = adminService.getAllUsers();
  res.json(result);
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

module.exports = {
  pendingProducts,
  reviewProduct,
  allUsers,
  allReports,
  handleReport,
  stats,
  allProducts
};
