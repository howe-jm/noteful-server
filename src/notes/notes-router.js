const path = require('path');
const express = require('express');
const xss = require('xss');
const NotesService = require('./notes-service');

const notesRouter = express.Router();
const jsonParser = express.json();

const serializeNote = (note) => ({
  id: note.id,
  notename: xss(note.notename),
  content: xss(note.content),
  modified: note.modified,
  folderid: note.folderid,
});

notesRouter
  .route('/')
  .get((req, res, next) => {
    NotesService.getAllNotes(req.app.get('db'))
      .then((notes) => {
        if (notes.length === 0) {
          return res.status(404).json({
            error: { message: 'No notes' },
          });
        }
        res.json(notes);
      })
      .catch(next);
  })
  .post(jsonParser, (req, res, next) => {
    const { notename, folderid, content } = req.body;
    const newNote = { notename, folderid, content };

    for (const [key, value] of Object.entries(newNote)) {
      if (value === null) {
        return res
          .status(400)
          .json({ error: { message: `Missing ${key} in request body` } });
      }
    }
    newNote.notename = notename;

    NotesService.insertNote(req.app.get('db'), newNote)
      .then((note) => {
        res
          .status(201)
          .location(path.posix.join(req.originalUrl, `/${note.id}`))
          .json(serializeNote(note));
      })
      .catch(next);
  });

notesRouter
  .route('/:note_id')
  .all((req, res, next) => {
    NotesService.getById(req.app.get('db'), req.params.note_id)
      .then((note) => {
        if (!note) {
          return res.status(404).json({
            error: { message: 'Note does not exist' },
          });
        }
        res.note = note;
        next();
      })
      .catch(next);
  })
  .get((req, res) => {
    res.json(serializeNote(res.note));
  });

module.exports = notesRouter;
