const request = require('supertest');
const app = require('../app');

let userToken;
let userId;

beforeAll(async () => {
  // create a test user that we'll use across the product tests
  const email = 'producttester@liverpool.ac.uk';
  const v = await request(app).post('/api/user/verify').send({ email });
  const r = await request(app).post('/api/user/register').send({
    username: 'producttester', email, password: 'password123', code: v.body.code
  });
  userToken = r.body.data.token;
  userId = r.body.data.user.id;
});

describe('Products', () => {
  test('public can list products', async () => {
    const res = await request(app).get('/api/products');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  test('creating product requires auth', async () => {
    const res = await request(app).post('/api/products').send({
      title: 'no auth', description: 'x', price: 5, category: 'Other'
    });
    expect(res.status).toBe(401);
  });

  test('authenticated user can create a product', async () => {
    const res = await request(app)
      .post('/api/products')
      .set('Authorization', 'Bearer ' + userToken)
      .send({
        title: 'My Test Item', description: 'A great little gadget', price: 12.5,
        category: 'Electronics', condition: 'good', location: 'Test Hall'
      });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.title).toBe('My Test Item');
    expect(res.body.data.sellerId).toBe(userId);
  });

  test('product creation rejects negative price', async () => {
    const res = await request(app)
      .post('/api/products')
      .set('Authorization', 'Bearer ' + userToken)
      .send({ title: 'bad', description: 'x', price: -10, category: 'Other' });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('seller can edit and delete their own product', async () => {
    const create = await request(app)
      .post('/api/products')
      .set('Authorization', 'Bearer ' + userToken)
      .send({ title: 'Editable', description: 'd', price: 10, category: 'Other' });
    const id = create.body.data.id;

    const edit = await request(app)
      .put('/api/products/' + id)
      .set('Authorization', 'Bearer ' + userToken)
      .send({ title: 'Edited' });
    expect(edit.status).toBe(200);
    expect(edit.body.data.title).toBe('Edited');

    const del = await request(app)
      .delete('/api/products/' + id)
      .set('Authorization', 'Bearer ' + userToken);
    expect(del.status).toBe(200);
    expect(del.body.success).toBe(true);
  });

  test('user cannot delete another user\'s product', async () => {
    // create a second user
    const email2 = 'otheruser@liverpool.ac.uk';
    const v = await request(app).post('/api/user/verify').send({ email: email2 });
    const r = await request(app).post('/api/user/register').send({
      username: 'otheruser', email: email2, password: 'password123', code: v.body.code
    });
    const otherToken = r.body.data.token;

    const create = await request(app)
      .post('/api/products')
      .set('Authorization', 'Bearer ' + userToken)
      .send({ title: 'Mine', description: 'd', price: 10, category: 'Other' });
    const id = create.body.data.id;

    const del = await request(app)
      .delete('/api/products/' + id)
      .set('Authorization', 'Bearer ' + otherToken);
    expect(del.status).toBe(403);
    expect(del.body.success).toBe(false);
  });
});
