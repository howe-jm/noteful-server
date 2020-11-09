const path = require('path');
const express = require('express');
const xss = require('xss');
const FoldersService = require('./folders-service');

const foldersRouter = express.Router();
const jsonParser = express.json();

const serializeFolder = (folder) => ({
  id: folder.id,
  foldername: xss(folder.foldername),
});

foldersRouter
  .route('/')
  .get((req, res, next) => {
    FoldersService.getAllFolders(req.app.get('db'))
      .then((folders) => {
        if (folders.length === 0) {
          return res.status(404).json({
            error: { message: 'No folders' },
          });
        }
        res.json(folders);
      })
      .catch(next);
  })
  .post(jsonParser, (req, res, next) => {
    const { foldername } = req.body;
    const newFolder = { foldername };

    for (const [key, value] of Object.entries(newFolder)) {
      if (value === null) {
        return res
          .status(400)
          .json({ error: { message: `Missing ${key} in request body` } });
      }
    }
    newFolder.foldername = foldername;

    FoldersService.insertFolder(req.app.get('db'), newFolder)
      .then((folder) => {
        res
          .status(201)
          .location(path.posix.join(req.originalUrl, `/${folder.id}`))
          .json(serializeFolder(folder));
      })
      .catch(next);
  });

foldersRouter
  .route('/:folder_id')
  .all((req, res, next) => {
    FoldersService.getById(req.app.get('db'), req.params.folder_id)
      .then((folder) => {
        if (!folder) {
          return res.status(404).json({
            error: { message: 'Folder does not exist' },
          });
        }
        res.folder = folder;
        next();
      })
      .catch(next);
  })
  .get((req, res) => {
    res.json(serializeFolder(res.folder));
  });
module.exports = foldersRouter;
