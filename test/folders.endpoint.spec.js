const { expect } = require('chai');
const knex = require('knex');
const supertest = require('supertest');
const app = require('../src/app');
const { makeFoldersArray } = require('./folders.fixtures');
const { makeNotesArray } = require('./notes.fixtures');

describe('Folders Endpoints', function () {
  let db;

  before('make knex instance', () => {
    db = knex({
      client: 'pg',
      connection: process.env.TEST_DB_URL,
    });
    app.set('db', db);
  });

  after('disconnect from db', () => db.destroy());

  before('clean the table', () =>
    db.raw('TRUNCATE noteful_folders, noteful_notes RESTART IDENTITY CASCADE')
  );

  afterEach('cleanup', () =>
    db.raw('TRUNCATE noteful_folders, noteful_notes RESTART IDENTITY CASCADE')
  );

  describe('GET /api/folders', () => {
    context('Given no folders', () => {
      it('Returns a 404 error', () => {
        return supertest(app)
          .get('/api/folders')
          .expect(404, { error: { message: 'No folders' } });
      });
    });
  });
  context('Given there are folders in the database', () => {
    const testFolders = makeFoldersArray();

    beforeEach('Insert folders', () => {
      return db.into('noteful_folders').insert(testFolders);
    });

    it('Responds with 200 and all of the folders', () => {
      return supertest(app).get('/api/folders').expect(200, testFolders);
    });
  });

  describe('POST /api/folders', () => {
    it('Creates a new folder, responding with a 201 and the new folder', () => {
      const newFolder = {
        foldername: 'Test Folder',
      };
      return supertest(app)
        .post('/api/folders')
        .send(newFolder)
        .expect(201)
        .expect((res) => {
          expect(res.body.foldername).to.eql(newFolder.foldername);
          expect(res.body).to.have.property('id');
          expect(res.headers.location).to.eql(`/api/folders/${res.body.id}`);
        })
        .then((postRes) =>
          supertest(app).get(`/api/folders/${postRes.body.id}`).expect(postRes.body)
        );
    });
  });
  describe('GET /api/folders/:folder_id', () => {
    context('Given there are no folders', () => {
      it('Returns a 404 error', () => {
        const folderId = 449;
        return supertest(app)
          .get(`/api/folders/${folderId}`)
          .expect(404, { error: { message: 'Folder does not exist' } });
      });
    });
    context('Given there are folders', () => {
      const testFolders = makeFoldersArray();
      const testNotes = makeNotesArray();

      beforeEach('Insert folders', () => {
        return db
          .into('noteful_folders')
          .insert(testFolders)
          .then(() => {
            return db.into('noteful_notes').insert(testNotes);
          });
      });
      it('Returns with 200 and the specified folder', () => {
        const folderId = 2;
        const expectedFolder = testFolders[folderId - 1];
        return supertest(app).get(`/api/folders/${folderId}`).expect(200, expectedFolder);
      });
    });
    context('Given an XSS attack foldername', () => {
      const maliciousFolder = {
        id: 911,
        foldername: 'Naughty naughty very naughty <script>alert("xss");</script>',
      };

      beforeEach('Insert malicious folder', () => {
        return db.into('noteful_folders').insert([maliciousFolder]);
      });

      it('Removes XSS attack content', () => {
        return supertest(app)
          .get(`/api/folders/${maliciousFolder.id}`)
          .expect(200)
          .expect((res) => {
            expect(res.body.foldername).to.eql(
              'Naughty naughty very naughty &lt;script&gt;alert("xss");&lt;/script&gt;'
            );
          });
      });
    });
  });
});
