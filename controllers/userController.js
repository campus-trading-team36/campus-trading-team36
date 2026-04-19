// User controller - handles HTTP requests related to user operations

const userService = require("../services/userService");

// POST /api/user/verify - Send email verification code
function sendVerifyCode(req, res) {
  const { email } = req.body;
  const result = userService.sendVerification(email);
  const status = result.success ? 200 : 400;
  res.status(status).json(result);
}

// POST /api/user/register
function register(req, res) {
  const { username, email, password, code } = req.body;
  const result = userService.register(username, email, password, code);
  const status = result.success ? 201 : 400;
  res.status(status).json(result);
}

// POST /api/user/login
function login(req, res) {
  const { email, password } = req.body;
  const result = userService.login(email, password);
  const status = result.success ? 200 : 401;
  res.status(status).json(result);
}

// POST /api/user/logout
function logout(req, res) {
  const token = req.headers["authorization"] || "";
  const result = userService.logout(token);
  res.json(result);
}

// GET /api/user/profile
function getProfile(req, res) {
  const result = userService.getProfile(req.user.id);
  res.json(result);
}

module.exports = {
  sendVerifyCode,
  register,
  login,
  logout,
  getProfile
};
