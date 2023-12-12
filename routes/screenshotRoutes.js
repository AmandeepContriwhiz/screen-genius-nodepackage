const express = require('express');
const router = express.Router();
const multer  = require('multer');
const storage = multer.diskStorage({
  destination: function(req, file, next){
    next(null, './public/upload/screenshots');
  },
  filename: function(req, file, next){
    //set the file fieldname to a unique name containing the original name, current datetime and the extension.
    var fileP = './public/upload/screenshots/'+ req.body.name;
    fs.exists(fileP, function(exists) {
      if (exists) 
      {
        var bodyName = req.body.name;
        bodyName = bodyName.split(".");
        var fName = bodyName[0]+"_"+Math.floor(Math.random() * 99)+'.'+bodyName[1];
        next(null, fName);
      }
      else
      {
        next(null, req.body.name);
      }
    });
  }
});
const upload = multer({ storage: storage});
const screenGeniusRoutesApi = require('../services/screenGeniusRoutesApi');
var fs = require('fs');
const helper = require('../helper');

router.get('/list', async function(req, res, next) {
  try 
  {
    res.json(await screenGeniusRoutesApi.getScreenshotList(req, res));
  } 
  catch (err) 
  {
    next(err);
  }
});
router.post('/rename', async function(req, res, next) {
  try {
    res.json(await screenGeniusRoutesApi.renameScreenshot(req, res));
  } catch (err) {
    next(err);
  }
});
router.post('/upload', upload.single('screenshot'), async function(req, res, next) {
  try {
    res.json(await screenGeniusRoutesApi.uploadScreenshot(req, res));
  } catch (err) {
    next(err);
  }
});
router.post('/starred', async function(req, res, next) {
  try {
    res.json(await screenGeniusRoutesApi.starredScreenshot(req, res));
  } catch (err) {
    next(err);
  }
});
router.get('/starred-list', async function(req, res, next) {
  try {
    res.json(await screenGeniusRoutesApi.getStarredScreenshotList(req, res));
  } catch (err) {
    next(err);
  }
});
router.post('/trash', async function(req, res, next) {
  try {
    res.json(await screenGeniusRoutesApi.trashScreenshot(req, res));
  } catch (err) {
    next(err);
  }
});
router.get('/trashed-list', async function(req, res, next) {
  try {
    res.json(await screenGeniusRoutesApi.getTrashedScreenshotList(req, res));
  } catch (err) {
    next(err);
  }
});
router.post('/delete', async function(req, res, next) {
  try {
    res.json(await screenGeniusRoutesApi.deleteScreenshot(req, res));
  } catch (err) {
    next(err);
  }
});

router.get('/details', async function(req, res, next) {
  try {
    res.json(await screenGeniusRoutesApi.getScreenshotDetails(req, res));
  } catch (err) {
    next(err);
  }
});

router.get('/progress/:id' , async function(req, res, next) {
  try {
    res.json(await screenGeniusRoutesApi.getAccountUploadProgress(req, res));
  } catch (err) {
    next(err);
  }
});

router.get('/wipe-data', async function(req, res, next) {
  try {
    res.json(await screenGeniusRoutesApi.wipeAllData(req, res));
  } catch (err) {
    next(err);
  }
});

router.get('/update-db', async function(req, res, next) {
  try {
    res.json(await screenGeniusRoutesApi.updateDB(req, res));
  } catch (err) {
    next(err);
  }
});

router.post('/send-email', async function(req, res, next) {
  try {
    res.json(await screenGeniusRoutesApi.sendScreenshotEmail(req, res));
  } catch (err) {
    next(err);
  }
});

router.post('/send-feedback', async function(req, res, next) {
  try {
    res.json(await screenGeniusRoutesApi.sendFeedback(req, res));
  } catch (err) {
    next(err);
  }
});

module.exports = router;