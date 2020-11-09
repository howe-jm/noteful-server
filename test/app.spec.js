const app = require('../src/app');

let token = '49d6cc60-c0bb-47df-8472-c44ec0def09f';

describe('App', () => {
  it('GET / responds with 200 containing "Hello, world!"', () => {
    return supertest(app)
      .get('/')
      .set({ Authorization: `Bearer ${token}` })
      .expect(200, 'Hello, world!');
  });
});
