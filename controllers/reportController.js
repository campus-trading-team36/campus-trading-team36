// Report controller

const reportService = require("../services/reportService");

// POST /api/reports
function create(req, res) {
  const result = reportService.createReport(req.user.id, req.user.username, req.body);
  const status = result.success ? 201 : 400;
  res.status(status).json(result);
}

module.exports = {
  create
};
