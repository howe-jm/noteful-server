const app = require('../src/app');

let token = process.env.API_KEY;

describe('App', () => {
  it('GET / responds with 200 containing "Hello, world!"', () => {
    return supertest(app)
      .get('/')
      .set({ Authorization: `Bearer ${token}` })
      .expect(200, 'Hello, world!');
  });
});
