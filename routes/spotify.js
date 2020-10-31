const express = require('express');
const controllerSpotify = require('../controller/spotify');

const router = express.Router();

router.get('/login', controllerSpotify.login);
router.get('/callback', controllerSpotify.callback);
router.get('/refresh_token', controllerSpotify.refresh_token);

module.exports = router;
