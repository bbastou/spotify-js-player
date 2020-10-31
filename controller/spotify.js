
const request = require('request'); // "Request" library
const querystring = require('querystring');

const {CLIENT_ID} = process.env;
const {CLIENT_SECRET} = process.env;
const {REDIRECT_URI} = process.env;


const generateRandomString = (length) => {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

    for (let i = 0; i < length; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
  };

const stateKey = 'spotify_auth_state';


module.exports.login = (req, res) => {
    const state = generateRandomString(16);
    res.cookie(stateKey, state);

    // your application requests authorization
    const scope = 'user-read-private user-read-email playlist-modify-public playlist-modify-private user-library-read user-library-modify user-top-read user-read-playback-state user-modify-playback-state user-read-currently-playing user-read-recently-played';
    res.redirect(`https://accounts.spotify.com/authorize?${
      querystring.stringify({
        response_type: 'code',
        client_id: CLIENT_ID,
        scope,
        redirect_uri: REDIRECT_URI,
        state
      })}`);
};

module.exports.callback = (req, res) => {
    const code = req.query.code || null;
    const state = req.query.state || null;
    const storedState = req.cookies ? req.cookies[stateKey] : null;

    if (state === null || state !== storedState) {
      res.redirect(`/#${
        querystring.stringify({
          error: 'state_mismatch'
        })}`);
    } else {
      res.clearCookie(stateKey);
      const authOptions = {
        url: 'https://accounts.spotify.com/api/token',
        form: {
          code,
          redirect_uri: REDIRECT_URI,
          grant_type: 'authorization_code'
        },
        headers: {
          'Authorization': `Basic ${Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64')}`
        },
        json: true
      };

      request.post(authOptions, (error, response, body) => {
        if (!error && response.statusCode === 200) {

          const {access_token, refresh_token} = body;

          const options = {
            url: 'https://api.spotify.com/v1/me',
            headers: { 'Authorization': `Bearer ${access_token}` },
            json: true
          };

          // use the access token to access the Spotify Web API
          request.get(options, function(error, response, body) {
            console.log(body);
          });

          // we can also pass the token to the browser to make requests from there
          res.redirect(`/#${
            querystring.stringify({
              access_token,
              refresh_token
            })}`);
        } else {
          res.redirect(`/#${
            querystring.stringify({
              error: 'invalid_token'
            })}`);
        }
      });
}};

module.exports.refresh_token = (req, res) => {
  // requesting access token from refresh token
  const {refresh_token} = req.query;
  const authOptions = {
    url: 'https://accounts.spotify.com/api/token',
    headers: { 'Authorization': `Basic ${Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64')}` },
    form: {
      grant_type: 'refresh_token',
      refresh_token
    },
    json: true
  };

  request.post(authOptions, (error, response, body) => {
    if (!error && response.statusCode === 200) {
      const {access_token} = body;
      res.send({
        'access_token': access_token
      });
    }
  });
};