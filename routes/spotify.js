const express = require('express');
const bodyParser = require('body-parser');
const controllerSpotify = require('../controller/spotify');

const router = express.Router();

router.get('/login', controllerSpotify.login);
router.get('/callback', controllerSpotify.callback);
router.get('/refresh_token', controllerSpotify.refresh_token);

module.exports = router;
