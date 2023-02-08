// @ts-check

const { resolve } = require('node:path');

const { EmbedBuilder } = require('discord.js');

const request = require('request');

const express = require('express');
const session = require('express-session');
const rateLimit = require('express-rate-limit');
const bodyParser = require('body-parser');

const client = require('./index');

const server = express();

server.set('trust proxy', 1);

const limiter = rateLimit({
  windowMs: 15 * 60 * 5, // 15 minutes
  max: 20, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// Apply the rate limiting middleware to all requests
server.use(limiter);

server.use(bodyParser.json());
server.use(bodyParser.urlencoded({ extended: true }));

server.engine('html', require('ejs').renderFile);

server.use(
  session({
    name: 'sitedata',
    rolling: true,
    secret: 'USE_YOUR_OWN_SECRETS', // TODO: Change this to your own secret
    resave: true,
    proxy: true,
    saveUninitialized: true,
    cookie: { maxAge: 60000 * 60 * 12, secure: true },
  }),
);

server.use(express.static('assets'));

server.all('/', (req, res) => res.send('Bot is Running!'));

server.get('/verify', async (req, res) => {
  const oauthApiOptions = {
    method: 'POST',
    url: 'https://discord.com/api/oauth2/token',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    form: {
      client_id: client.application?.id,
      client_secret: process.env.CLIENT_SECRET,
      grant_type: 'authorization_code',
      code: req.query.code,
      redirect_uri: process.env.CALLBACK_URL,
      scope: ['identify', 'email', 'guilds.join'],
    },
  };

  request(oauthApiOptions, function (error, _, body) {
    if (error) throw new Error(error);

    const oauth_parsed = JSON.parse(body);

    const apiUser = {
      method: 'GET',
      url: 'https://discord.com/api/users/@me',
      headers: { authorization: `Bearer ${oauth_parsed.access_token}` },
    };

    request(apiUser, async (error, response, body) => {
      if (error) throw new Error(error);

      if (req.session.verify_userid) {
        res.render(resolve('./html/captcha.html'), {
          recaptcha_sitekey: process.env.RECAPTCHA_SITEKEY,
        });

        return;
      }

      if (response.statusCode !== 200) {
        res.redirect(
          `https://discord.com/oauth2/authorize?client_id=${process.env.CLIENT_ID}&redirect_uri=${process.env.CALLBACK_URL}&response_type=code&scope=guilds.join%20email%20identify`,
        );

        return;
      }

      const parsed = JSON.parse(body);

      const fetchedGuild = client.guilds.cache.get(process.env.SERVER_ID);

      const userfetch = await client.users.fetch(parsed.id);

      await fetchedGuild?.members.add(userfetch, {
        accessToken: oauth_parsed.access_token,
      });

      const userguild = await fetchedGuild?.members.fetch(userfetch);

      if (!userguild) {
        res.render(resolve('./html/error.html'), {
          messageText: 'You already verified!',
        });

        return;
      }

      if (userguild.roles.cache.has(process.env.VERIFIED_ROLE_ID)) {
        res.render(resolve('./html/success.html'), {
          messageText: 'You already verified!',
        });

        return;
      }

      req.session.verify_userid = parsed.id;

      if (process.env.REQUIRE_VERIFIED_EMAIL === 'true' || parsed.verified) {
        req.session.verify_status = 'waiting_recaptcha';
        res.render(resolve('./html/captcha.html'), {
          recaptcha_sitekey: process.env.RECAPTCHA_SITEKEY,
        });
      } else {
        req.session.destroy(() => undefined);
        res.render(resolve('./html/error.html'), {
          messageText: 'Please verify your email!',
        });
      }
    });
  });
});

server.post('/verify/solve/', async (req, res) => {
  console.log(req.session.verify_userid);
  if (!req.session.verify_userid || !req.body['g-recaptcha-response']) {
    return res.redirect('/verify');
  }

  const options = {
    method: 'POST',
    url: 'https://www.google.com/recaptcha/api/siteverify',
    headers: {
      'content-type':
        'multipart/form-data; boundary=----WebKitFormBoundary7MA4YWxkTrZu0gW',
    },
    formData: {
      secret: process.env.RECAPTCHA_SECRET,
      response: req.body['g-recaptcha-response'],
    },
  };

  request(options, async (error, _, body) => {
    if (error) throw new Error(error);

    const parsed = JSON.parse(body);

    if (parsed.success && req.session.verify_userid) {
      const fetchedGuild = client.guilds.cache.get(process.env.SERVER_ID);

      const userfetch = await client.users.fetch(req.session.verify_userid);

      if (!fetchedGuild) {
        res.redirect('/verify');

        return;
      }

      const member = await fetchedGuild.members.fetch(userfetch.id);

      await member.roles.add(process.env.VERIFIED_ROLE_ID, 'Verified');

      req.session.verify_status = 'done';

      const embed = new EmbedBuilder()
        .setTitle(':white_check_mark: Verified')
        .setDescription('Now you can access to the server!')
        .setColor('Green');

      member.send({ embeds: [embed] }).catch(() => undefined);

      res.redirect('/verify/succeed');
    } else {
      res.redirect('/verify');
    }
  });
});

server.get('/verify/succeed', async (req, res) => {
  if (!req.session.verify_userid) return res.redirect('/verify');
  if (req.session.verify_status !== 'done') return res.redirect('/verify');

  res.sendFile(resolve('./html/verified.html'));

  req.session.destroy(() => undefined);
});

server.get('/verify/logout', async (req, res) => {
  if (!req.session.verify_userid) {
    res.render(resolve('./html/error.html'), {
      messageText: 'You did not login!',
    });

    return;
  }

  req.session.destroy(() => undefined);

  res.render(resolve('./html/success.html'), {
    messageText: 'Done logout!',
  });
});

const PORT = process.env.PORT || 8080;

server.listen(PORT);

console.log(`Server is running on port ${PORT}`)