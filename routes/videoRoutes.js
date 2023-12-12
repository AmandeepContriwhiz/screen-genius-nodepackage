const express = require('express');
const router = express.Router();
const multer  = require('multer');
var path = require('path');
const storage = multer.diskStorage({
  destination: function(req, file, next){
    if(file.mimetype === "image/png" || file.mimetype == "image/jpeg")
    {
      next(null, './public/upload/videos/images');
    }
    else if(file.mimetype === "audio/mpeg" || file.mimetype === "audio/mp3")
    {
      next(null, './public/upload/videos/audios');
    }
    else
    {
      next(null, './public/upload/videos');
    }
  },
  filename: function(req, file, next){
    if(file.originalname !== undefined && file.originalname !== null && file.originalname !== "" && file.originalname !== "blob")
    {
      var ext = path.extname(file.originalname);
      var orgName = file.originalname.split('.')[0];
    }
    else
    {
      var ext = '.' + file.mimetype.split('/')[1];
      var orgName = file.originalname.split('.')[0];
    }
    //set the file fieldname to a unique name containing the original name, current datetime and the extension.
    next(null, file.fieldname + '-' + orgName + '-' + Date.now() + ext);
  }
});
const upload = multer({ storage: storage});
const screenGeniusRoutesApi = require('../services/screenGeniusRoutesApi');
var fs = require('fs');
const helper = require('../helper');

router.get('/list', async function(req, res, next) {
  try 
  {
    res.json(await screenGeniusRoutesApi.getVideoRecordingList(req, res));
  } 
  catch (err) 
  {
    next(err);
  }
});
router.post('/rename', async function(req, res, next) {
  try {
    res.json(await screenGeniusRoutesApi.renameVideoRecording(req, res));
  } catch (err) {
    next(err);
  }
});
router.post('/upload', upload.single('recording'), async function(req, res, next) {
  try {
    await screenGeniusRoutesApi.uploadVideoRecording(req, res);
  } catch (err) {
    next(err);
  }
});
router.post('/starred', async function(req, res, next) {
  try {
    res.json(await screenGeniusRoutesApi.starredVideoRecording(req, res));
  } catch (err) {
    next(err);
  }
});
router.get('/starred-list', async function(req, res, next) {
  try {
    res.json(await screenGeniusRoutesApi.getStarredVideoRecordingList(req, res));
  } catch (err) {
    next(err);
  }
});
router.post('/trash', async function(req, res, next) {
  try {
    res.json(await screenGeniusRoutesApi.trashVideoRecording(req, res));
  } catch (err) {
    next(err);
  }
});
router.get('/trashed-list', async function(req, res, next) {
  try {
    res.json(await screenGeniusRoutesApi.getTrashedVideoRecordingList(req, res));
  } catch (err) {
    next(err);
  }
});
router.get('/details', async function(req, res, next) {
  try {
    res.json(await screenGeniusRoutesApi.getVideoDetails(req, res));
  } catch (err) {
    next(err);
  }
});
router.post('/delete', async function(req, res, next) {
  try {
    res.json(await screenGeniusRoutesApi.deleteVideoRecording(req, res));
  } catch (err) {
    next(err);
  }
});
router.post('/download', async function(req, res, next) {
  try {
    res.json(await screenGeniusRoutesApi.downloadVideoRecording(req, res));
  } catch (err) {
    next(err);
  }
});

router.post('/edit', upload.array('bg_files') , async function(req, res, next) {
  try {
    await screenGeniusRoutesApi.editVideoRecording(req, res);
  } catch (err) {
    next(err);
  }
});

router.post('/send-email', async function(req, res, next) {
  try {
    res.json(await screenGeniusRoutesApi.sendVideoEmail(req, res));
  } catch (err) {
    next(err);
  }
});

module.exports = router;