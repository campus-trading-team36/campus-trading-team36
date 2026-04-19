// Application config
// Keep it minimal - no .env needed for demo deployment

const config = {
  port: process.env.PORT || 8080,
  host: "0.0.0.0",
  jwtSecret: "campus-trading-secret-key-2024",
  adminCode: "ADMIN2024",
  emailDomains: ["liverpool.ac.uk", "student.liverpool.ac.uk"]
};

module.exports = config;
