const request = require('supertest');
const app = require('../app');

let adminToken;
let userToken;

beforeAll(async () => {
  const ad = await request(app).post('/api/user/login')
    .send({ email: 'admin@liverpool.ac.uk', password: 'admin123' });
  adminToken = ad.body.data.token;

  const email = 'admintest@liverpool.ac.uk';
  const v = await request(app).post('/api/user/verify').send({ email });
  const r = await request(app).post('/api/user/register').send({
    username: 'admintestuser', email, password: 'password123', code: v.body.code
  });
  userToken = r.body.data.token;
});

describe('Admin', () => {
  test('non-admin cannot reach admin endpoints', async () => {
    const res = await request(app).get('/api/admin/stats')
      .set('Authorization', 'Bearer ' + userToken);
    expect(res.status).toBe(403);
  });

  test('admin can read stats', async () => {
    const res = await request(app).get('/api/admin/stats')
      .set('Authorization', 'Bearer ' + adminToken);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(typeof res.body.data.totalUsers).toBe('number');
    expect(typeof res.body.data.totalProducts).toBe('number');
  });

  test('admin can list all users', async () => {
    const res = await request(app).get('/api/admin/users')
      .set('Authorization', 'Bearer ' + adminToken);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  test('admin can ban and unban a user', async () => {
    const list = await request(app).get('/api/admin/users')
      .set('Authorization', 'Bearer ' + adminToken);
    const target = list.body.data.find(u => u.email === 'admintest@liverpool.ac.uk');
    expect(target).toBeTruthy();

    const ban = await request(app).post('/api/admin/users/' + target.id + '/ban')
      .set('Authorization', 'Bearer ' + adminToken)
      .send({ banned: true });
    expect(ban.status).toBe(200);
    expect(ban.body.data.banned).toBe(true);

    const unban = await request(app).post('/api/admin/users/' + target.id + '/ban')
      .set('Authorization', 'Bearer ' + adminToken)
      .send({ banned: false });
    expect(unban.status).toBe(200);
    expect(unban.body.data.banned).toBe(false);
  });

  test('admin cannot ban another admin', async () => {
    const list = await request(app).get('/api/admin/users')
      .set('Authorization', 'Bearer ' + adminToken);
    const adminUser = list.body.data.find(u => u.role === 'admin');

    const res = await request(app).post('/api/admin/users/' + adminUser.id + '/ban')
      .set('Authorization', 'Bearer ' + adminToken)
      .send({ banned: true });
    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.body.success).toBe(false);
  });

  test('admin can delete any product', async () => {
    // re-login because earlier ban/unban tests invalidated the original session
    const fresh = await request(app).post('/api/user/login')
      .send({ email: 'admintest@liverpool.ac.uk', password: 'password123' });
    const tok = fresh.body.data.token;

    const created = await request(app).post('/api/products')
      .set('Authorization', 'Bearer ' + tok)
      .send({ title: 'Admin Will Delete', description: 'x', price: 5, category: 'Other' });
    const id = created.body.data.id;

    const del = await request(app).delete('/api/products/' + id)
      .set('Authorization', 'Bearer ' + adminToken);
    expect(del.status).toBe(200);
    expect(del.body.success).toBe(true);
  });
});
