const { expect } = require('chai');
const knex = require('knex');
const supertest = require('supertest');
const app = require('../src/app');
const { makeFoldersArray } = require('./folders.fixtures');
const { makeNotesArray } = require('./notes.fixtures');

let token = '49d6cc60-c0bb-47df-8472-c44ec0def09f';

describe('Notes Endpoints', function () {
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

  describe('GET /api/notes', () => {
    context('Given no articles', () => {
      it('responds with a 404 error', () => {
        return supertest(app)
          .get('/api/notes')
          .set({ Authorization: `Bearer ${token}` })
          .expect(404, { error: { message: 'No notes' } });
      });
    });
  });
  context('Given there are notes in the database', () => {
    const testFolders = makeFoldersArray();
    const testNotes = makeNotesArray();

    beforeEach('Insert notes', () => {
      return db
        .into('noteful_folders')
        .insert(testFolders)
        .then(() => {
          return db.into('noteful_notes').insert(testNotes);
        });
    });

    it('Responds with 200 and all of the notes', () => {
      return supertest(app)
        .get('/api/notes')
        .set({ Authorization: `Bearer ${token}` })
        .expect(200, testNotes);
    });
  });

  describe('POST /api/notes', () => {
    context('Given there are notes in the database', () => {
      const testFolders = makeFoldersArray();

      beforeEach('Insert notes', () => {
        return db.into('noteful_folders').insert(testFolders);
      });
      it('Creates a new note, responding with a 201 and the new note', () => {
        const newNote = {
          notename: 'Test note name',
          folderid: 2,
          content: 'Test note content!',
        };
        return supertest(app)
          .post('/api/notes')
          .send(newNote)
          .set({ Authorization: `Bearer ${token}` })
          .expect(201)
          .expect((res) => {
            expect(res.body.notename).to.eql(newNote.notename);
            expect(res.body.folderid).to.eql(newNote.folderid);
            expect(res.body.content).to.eql(newNote.content);
            expect(res.body).to.have.property('id');
            expect(res.headers.location).to.eql(`/api/notes/${res.body.id}`);
            const expected = new Date().toLocaleString();
            const actual = new Date(res.body.modified).toLocaleString();
            expect(actual).to.eql(expected);
          })
          .then((postRes) =>
            supertest(app)
              .get(`/api/notes/${postRes.body.id}`)
              .set({ Authorization: `Bearer ${token}` })
              .expect(postRes.body)
          );
      });
    });
  });

  describe('GET /api/notes/:note_id', () => {
    context('Given no articles', () => {
      it('Resonds with 404', () => {
        const noteId = 1919;
        return supertest(app)
          .get(`/api/notes/${noteId}`)
          .set({ Authorization: `Bearer ${token}` })
          .expect(404, {
            error: { message: 'Note does not exist' },
          });
      });
    });
    context('Given there are notes in the database', () => {
      const testFolders = makeFoldersArray();
      const testNotes = makeNotesArray();

      beforeEach('Insert notes', () => {
        return db
          .into('noteful_folders')
          .insert(testFolders)
          .then(() => {
            return db.into('noteful_notes').insert(testNotes);
          });
      });
      it('Responds with 200 and the specified note', () => {
        const noteId = 1;
        const expectedNote = testNotes[noteId - 1];
        return supertest(app)
          .get(`/api/notes/${noteId}`)
          .set({ Authorization: `Bearer ${token}` })
          .expect(200, expectedNote);
      });
    });
    context('Given an XSS attack note', () => {
      const maliciousNote = {
        id: 911,
        notename: 'Naughty naughty very naughty <script>alert("xss");</script>',
        content:
          'Bad image <img src="https://url.to.file.which/does-not.exist" onerror="alert(document.cookie);">. But not <strong>all</strong> bad.',
      };

      beforeEach('insert malicious note', () => {
        return db.into('noteful_notes').insert([maliciousNote]);
      });

      it('removes XSS attack content', () => {
        return supertest(app)
          .get(`/api/notes/${maliciousNote.id}`)
          .set({ Authorization: `Bearer ${token}` })
          .expect(200)
          .expect((res) => {
            expect(res.body.notename).to.eql(
              'Naughty naughty very naughty &lt;script&gt;alert("xss");&lt;/script&gt;'
            );
            expect(res.body.content).to.eql(
              'Bad image <img src="https://url.to.file.which/does-not.exist">. But not <strong>all</strong> bad.'
            );
          });
      });
    });
  });

  describe('DELETE /api/notes/:note_id', () => {
    context('Given no notes in the database', () => {
      it('Returns a 404 error', () => {
        const noteId = 442;
        return supertest(app)
          .delete(`/api/notes/${noteId}`)
          .set({ Authorization: `Bearer ${token}` })
          .expect(404, { error: { message: 'Note does not exist' } });
      });
    });
    context('Given there are notes in the database', () => {
      const testNotes = makeNotesArray();
      const testFolders = makeFoldersArray();

      beforeEach('Insert folders and notes', () => {
        return db
          .into('noteful_folders')
          .insert(testFolders)
          .then(() => {
            return db.into('noteful_notes').insert(testNotes);
          });
      });
      it('Returns with 204 and removes the note', () => {
        const idToRemove = 2;
        const expectedNotes = testNotes.filter((note) => note.id !== idToRemove);
        return supertest(app)
          .delete(`/api/notes/${idToRemove}`)
          .set({ Authorization: `Bearer ${token}` })
          .expect(204)
          .then(() =>
            supertest(app)
              .get('/api/notes')
              .set({ Authorization: `Bearer ${token}` })
              .expect(expectedNotes)
          );
      });
    });
  });
  // Reserved for future tests
});
