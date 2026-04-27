// regression tests for messaging
// the headline test is "read state survives a save round-trip" - the read/isRead
// field-name bug let unread counts revert to the original value after persistence.

const request = require('supertest');
const app = require('../app');

let aliceToken, bobToken, aliceId, bobId;

beforeAll(async () => {
  const mk = async (name) => {
    const email = name + '@liverpool.ac.uk';
    const v = await request(app).post('/api/user/verify').send({ email });
    const r = await request(app).post('/api/user/register').send({
      username: name, email, password: 'password123', code: v.body.code
    });
    return { token: r.body.data.token, id: r.body.data.user.id };
  };
  const a = await mk('msgalice');
  const b = await mk('msgbob');
  aliceToken = a.token; aliceId = a.id;
  bobToken = b.token; bobId = b.id;
});

describe('Messaging', () => {
  test('alice can send bob a message and bob sees unread = 1', async () => {
    const send = await request(app).post('/api/messages/send')
      .set('Authorization', 'Bearer ' + aliceToken)
      .send({ receiverId: bobId, content: 'hi bob' });
    expect(send.status).toBe(201);

    const unread = await request(app).get('/api/messages/unread')
      .set('Authorization', 'Bearer ' + bobToken);
    expect(unread.status).toBe(200);
    expect(unread.body.data.unread).toBeGreaterThanOrEqual(1);
  });

  test('after bob opens the chat, unread drops to 0 AND the read state persists', async () => {
    // open the chat - this marks messages as read
    const chat = await request(app).get('/api/messages/chat/' + aliceId)
      .set('Authorization', 'Bearer ' + bobToken);
    expect(chat.status).toBe(200);
    expect(Array.isArray(chat.body.data)).toBe(true);

    const unread1 = await request(app).get('/api/messages/unread')
      .set('Authorization', 'Bearer ' + bobToken);
    expect(unread1.body.data.unread).toBe(0);

    // force a save+reload by reaching into the db module - mimics a server restart.
    // if the persistence layer uses the wrong field name the unread state will
    // come back as "unread" after reload.
    const db = require('../models/db');
    db.saveSync();
    db._reload();

    const unread2 = await request(app).get('/api/messages/unread')
      .set('Authorization', 'Bearer ' + bobToken);
    expect(unread2.body.data.unread).toBe(0);   // <-- the bug made this 1
  });

  test('conversations list returns the partner with last-message preview', async () => {
    const conv = await request(app).get('/api/messages/conversations')
      .set('Authorization', 'Bearer ' + aliceToken);
    expect(conv.status).toBe(200);
    const found = conv.body.data.find(c => c.partnerId === bobId);
    expect(found).toBeTruthy();
    expect(found.lastMessage.content).toBe('hi bob');
  });

  test('cannot message yourself', async () => {
    const res = await request(app).post('/api/messages/send')
      .set('Authorization', 'Bearer ' + aliceToken)
      .send({ receiverId: aliceId, content: 'hi me' });
    expect(res.status).toBe(400);
  });
});
