const request = require('supertest');
const app = require('../app');

describe('Auth', () => {
  test('admin can log in with seed credentials', async () => {
    const res = await request(app)
      .post('/api/user/login')
      .send({ email: 'admin@liverpool.ac.uk', password: 'admin123' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeTruthy();
    expect(res.body.data.user.role).toBe('admin');
  });

  test('login fails with wrong password', async () => {
    const res = await request(app)
      .post('/api/user/login')
      .send({ email: 'admin@liverpool.ac.uk', password: 'wrong-password' });
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  test('login is case-insensitive on email', async () => {
    const res = await request(app)
      .post('/api/user/login')
      .send({ email: 'ADMIN@Liverpool.AC.uk', password: 'admin123' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test('verify code rejects non-university emails', async () => {
    const res = await request(app)
      .post('/api/user/verify')
      .send({ email: 'random@gmail.com' });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('full register flow with verification code', async () => {
    const email = 'newstudent@liverpool.ac.uk';
    const sendRes = await request(app).post('/api/user/verify').send({ email });
    expect(sendRes.status).toBe(200);
    expect(sendRes.body.code).toBeTruthy(); // dev mode echoes the code

    const regRes = await request(app).post('/api/user/register').send({
      username: 'newstudent', email, password: 'password123', code: sendRes.body.code
    });
    expect(regRes.status).toBe(201);
    expect(regRes.body.success).toBe(true);
    expect(regRes.body.data.token).toBeTruthy();
  });

  test('register rejects weak password', async () => {
    const email = 'weakpw@liverpool.ac.uk';
    const sendRes = await request(app).post('/api/user/verify').send({ email });
    const res = await request(app).post('/api/user/register').send({
      username: 'weakpw', email, password: '123', code: sendRes.body.code
    });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('protected route requires token', async () => {
    const res = await request(app).get('/api/user/profile');
    expect(res.status).toBe(401);
  });
});
