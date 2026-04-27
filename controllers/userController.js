// User controller - handles HTTP requests related to user operations

const userService = require("../services/userService");

// POST /api/user/verify - Send email verification code (for register)
function sendVerifyCode(req, res) {
  const { email } = req.body;
  const result = userService.sendVerification(email, 'register');
  const status = result.success ? 200 : 400;
  res.status(status).json(result);
}

// POST /api/user/forgot - Send a code so the user can reset their password
function sendResetCode(req, res) {
  const { email } = req.body;
  const result = userService.sendVerification(email, 'reset');
  // always 200 here - we never want to leak whether the email is registered
  res.status(200).json(result);
}

// POST /api/user/reset - Apply a new password using a reset code
function resetPassword(req, res) {
  const { email, code, password } = req.body;
  const result = userService.resetPassword(email, code, password);
  res.status(result.success ? 200 : 400).json(result);
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

// POST /api/user/password - change password while logged in
function changePassword(req, res) {
  const { currentPassword, newPassword } = req.body;
  const result = userService.changePassword(req.user.id, currentPassword, newPassword);
  res.status(result.success ? 200 : 400).json(result);
}

module.exports = {
  sendVerifyCode,
  sendResetCode,
  resetPassword,
  register,
  login,
  logout,
  getProfile,
  changePassword
};
