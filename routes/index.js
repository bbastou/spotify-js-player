const express = require('express');
const bodyParser = require('body-parser');
const https = require('https');

//const controllerUsers = require('../controller/users');

const router = express.Router();
/* GET home page. */


router.get('/', function(req, res, next) {
  res.render('index', { title: 'Spotify' });
});

module.exports = router;
