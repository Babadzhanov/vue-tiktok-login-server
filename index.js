const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');
const cors = require('cors');
const querystring = require('node:querystring');
const cookieParser = require('cookie-parser');

const app = express();
const port = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(express.json());
app.use(cors());
app.use(express.static(__dirname));
app.use(cookieParser());

app.get('/oauth-user', (req, res) => {
  console.log(`Received GET request at: ${req.originalUrl}`);
  const clientKey = process.env.TIKTOK_CLIENT_KEY;
  const redirectUri = process.env.TIKTOK_REDIRECT_URI;
  const availableScopes = [
    'user.info.basic',
    'user.info.profile',
    'user.info.stats',
    'artist.certification.read',
    'artist.certification.update',
    'research.data.u18eu',
    'video.list',
  ];

  const stateParam = req.query.state;
  console.log(`State parameter: ${stateParam}`);

  const scope = availableScopes.join(',');
  // const csrfState = Math.random().toString(36).substring(2);
  // res.cookie('csrfState', csrfState, { maxAge: 60000 });
  let url = 'https://www.tiktok.com/v2/auth/authorize/';
  url += `?client_key=${clientKey}`;
  url += `&scope=${scope}`;
  url += '&response_type=code';
  url += `&redirect_uri=${redirectUri}`;
  url += '&state=' + stateParam;
  res.json({ url: url });
});

app.post('/accesstoken-user', async (req, res) => {
  console.log(`Received POST request at: ${req.originalUrl}`);
  try {
    const clientKey = process.env.TIKTOK_CLIENT_KEY;
    const clientSecret = process.env.TIKTOK_CLIENT_SECRET;
    const redirectUri = process.env.TIKTOK_REDIRECT_URI;
    console.log(`clientKey: ${clientKey}`);
    console.log(`clientSecret: ${clientSecret}`);
    console.log(`redirectUri: ${redirectUri}`);
    const { code } = req.body;
    const decode = decodeURI(code);
    const tokenEndpoint = 'https://open.tiktokapis.com/v2/oauth/token/';
    const params = {
      client_key: clientKey,
      client_secret: clientSecret,
      code: decode,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri,
    };
    const response = await axios.post(tokenEndpoint, querystring.stringify(params), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Cache-Control': 'no-cache',
      },
    });
    console.log('response:', response);
    res.send(response.data);
  } catch (error) {
    console.error('Error during callback:', error.message);
    res.status(500).send('An error occurred during the login process.');
  }
});

// Advertiser

app.get('/oauth-advertiser', (req, res) => {
  console.log(`Received GET request at: ${req.originalUrl}`);
  const appId = process.env.TIKTOK_APP_ID;
  const appRedirectUri = process.env.TIKTOK_APP_REDIRECT_URI;

  const appStateParam = req.query.state;
  console.log(`State parameter: ${appStateParam}`);

  // https://business-api.tiktok.com/portal/auth?app_id=7405027833598181392&state=your_custom_params&redirect_uri=https%3A%2F%2Fdev.vervesearch.com%2F_temp%2Ftiktok-login%2F

  // const csrfState = Math.random().toString(36).substring(2);
  // res.cookie('csrfState', csrfState, { maxAge: 60000 });
  let url = 'https://business-api.tiktok.com/portal/auth';
  url += `?app_id=${appId}`;
  url += `&state=${appStateParam}`;
  url += `&redirect_uri=${appRedirectUri}`;
  res.json({ url: url });
});

app.post('/accesstoken-advertiser', async (req, res) => {
  console.log(`Received POST request at: ${req.originalUrl}`);

  // https://ads.tiktok.com/marketing_api/docs？state=your_custom_params&code=3c6dc21d2db289199737bcb8c006c23aaf000a1e&auth_code=1234c21d2db289199737bcb8c006c23aaf000a1e&id=1701890905779201
  try {
    const appId = process.env.TIKTOK_APP_ID;
    const appSecret = process.env.TIKTOK_APP_SECRET;
    const redirectUri = process.env.TIKTOK_REDIRECT_URI;
    console.log(`clientKey: ${clientKey}`);
    console.log(`clientSecret: ${clientSecret}`);
    console.log(`redirectUri: ${redirectUri}`);
    console.log(
      'auth_code is only valid for one hour and can be used only once. After the auth_code expires, you need to start over and perform the authorization steps again.'
    );
    const { auth_code } = req.body;
    const decode = decodeURI(auth_code);
    console.log(`Decoded auth_code: ${decode}`);
    const tokenEndpoint =
      'https://business-api.tiktok.com/open_api/open_api/v1.3/oauth2/access_token/';

    // curl --location 'https://business-api.tiktok.com/open_api/open_api/v1.3/oauth2/access_token/' \
    // --header 'Content-Type: application/json' \
    // --data '{
    // 	"app_id": "{{app_id}}",
    // 	"secret": "{{secret}}",
    // 	"auth_code": "{{auth_code}}"
    // }'
    const params = {
      app_id: appId,
      secret: appSecret,
      auth_code: decode,
    };
    const response = await axios.post(tokenEndpoint, querystring.stringify(params), {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    console.log('response:', response);
    res.send(response.data);
  } catch (error) {
    console.error('Error during callback:', error.message);
    res.status(500).send('An error occurred during the login process.');
  }
});

app.listen(port, () => {
  console.log(`Server is running on port:${port}`);
});
