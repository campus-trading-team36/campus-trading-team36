const request = require('supertest');
const app = require('../app');

let buyerToken, sellerToken, productId;

beforeAll(async () => {
  const sEmail = 'seller-cart@liverpool.ac.uk';
  const sv = await request(app).post('/api/user/verify').send({ email: sEmail });
  const sr = await request(app).post('/api/user/register').send({
    username: 'sellercart', email: sEmail, password: 'password123', code: sv.body.code
  });
  sellerToken = sr.body.data.token;

  const bEmail = 'buyer-cart@liverpool.ac.uk';
  const bv = await request(app).post('/api/user/verify').send({ email: bEmail });
  const br = await request(app).post('/api/user/register').send({
    username: 'buyercart', email: bEmail, password: 'password123', code: bv.body.code
  });
  buyerToken = br.body.data.token;

  const created = await request(app).post('/api/products')
    .set('Authorization', 'Bearer ' + sellerToken)
    .send({ title: 'Item For Sale', description: 'cool', price: 30, category: 'Books' });
  productId = created.body.data.id;
});

describe('Cart & Favourites', () => {
  test('buyer can add item to cart', async () => {
    const res = await request(app).post('/api/user/cart')
      .set('Authorization', 'Bearer ' + buyerToken)
      .send({ productId, note: 'meet on campus' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test('buyer can read their cart', async () => {
    const res = await request(app).get('/api/user/cart')
      .set('Authorization', 'Bearer ' + buyerToken);
    expect(res.status).toBe(200);
    expect(res.body.data.some(i => i.id === productId)).toBe(true);
  });

  test('seller cannot add their own product to cart', async () => {
    const res = await request(app).post('/api/user/cart')
      .set('Authorization', 'Bearer ' + sellerToken)
      .send({ productId });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('cart item can be removed', async () => {
    const res = await request(app).delete('/api/user/cart/' + productId)
      .set('Authorization', 'Bearer ' + buyerToken);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test('buyer can favourite a product', async () => {
    const res = await request(app).post('/api/favorite/add')
      .set('Authorization', 'Bearer ' + buyerToken)
      .send({ productId });
    expect([200, 201]).toContain(res.status);
    expect(res.body.success).toBe(true);
  });

  test('seller cannot favourite their own listing', async () => {
    const res = await request(app).post('/api/favorite/add')
      .set('Authorization', 'Bearer ' + sellerToken)
      .send({ productId });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});
