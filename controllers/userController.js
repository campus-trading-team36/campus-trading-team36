// 用户相关接口的 controller

const userService = require("../services/userService");

// POST /api/user/verify - 发注册用的验证码
function sendVerifyCode(req, res) {
  const { email } = req.body;
  const result = userService.sendVerification(email, 'register');
  const status = result.success ? 200 : 400;
  res.status(status).json(result);
}

// POST /api/user/forgot - 发重设密码的验证码
function sendResetCode(req, res) {
  const { email } = req.body;
  const result = userService.sendVerification(email, 'reset');
  // 这里固定 200，不能让外人探出来邮箱有没有注册过
  res.status(200).json(result);
}

// POST /api/user/reset - 用验证码改密码
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

// POST /api/user/password - 登录状态下改密码
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
