const express = require('express');
const router = express.Router();
const screenGeniusRoutesApi = require('../services/screenGeniusRoutesApi');
const helper = require('../helper');

router.get('/get', async function(req, res, next) {
  try 
  {
    
    res.json(await screenGeniusRoutesApi.userGet(req, res));
  } catch (err) {
    next(err);
  }
});

router.get('/logout', async function(req, res, next) {
  try 
  {
    res.json(await screenGeniusRoutesApi.userLogout(req, res));
  } catch (err) {
    next(err);
  }
});

router.post('/signup', async function(req, res, next) {
  try {
    res.json(await screenGeniusRoutesApi.userSignup(req, res));
  } catch (err) {
    next(err);
  }
});

router.post('/login', async function(req, res, next) {
  try {
    res.json(await screenGeniusRoutesApi.userLogin(req, res));
  } catch (err) {
    next(err);
  }
});

module.exports = router;