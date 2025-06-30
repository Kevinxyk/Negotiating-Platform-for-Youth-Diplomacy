const request = require('supertest');
const app = require('../../app');

describe('Settings API', () => {
  it('GET /api/settings returns default settings', async () => {
    const res = await request(app).get('/api/settings').set('x-user-role','delegate');
    expect(res.statusCode).toBe(200);
    expect(res.body.theme).toBeDefined();
  });

  it('POST /api/settings updates settings', async () => {
    const res = await request(app)
      .post('/api/settings')
      .set('x-user-role','delegate')
      .send({ theme:'dark' });
    expect(res.statusCode).toBe(200);
    expect(res.body.theme).toBe('dark');
  });
});
