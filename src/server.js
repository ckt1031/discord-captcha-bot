const { resolve } = require('path');

const { EmbedBuilder } = require('discord.js');

const request = require('request');

const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');

const client = require('./index');
const config = require('../config.json');

const server = express();

server.set('trust proxy', 1);

server.use(bodyParser.urlencoded({ extended: true }));

server.engine('html', require('ejs').renderFile);

server.use(
  session({
    name: 'sitedata',
    rolling: true,
    secret: 'EfT4AVq9r-F,.FRclHc#Y##QJNT^^fY#3Wxd#ci8Z@KrE',
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
      redirect_uri: config.callback_url,
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
          `https://discord.com/oauth2/authorize?client_id=${config.client_id}&redirect_uri=${config.callback_url}&response_type=code&scope=guilds.join%20email%20identify`,
        );

        return;
      }

      const parsed = JSON.parse(body);

      const fetchedGuild = client.guilds.cache.get(config.server_id);

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

      if (userguild.roles.cache.has(config.verifiedrole_id)) {
        res.render(resolve('./html/success.html'), {
          messageText: 'You already verified!',
        });

        return;
      }

      req.session.verify_userid = parsed.id;

      if (config.verified_email_required === true || parsed.verified) {
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

    if (parsed.success) {
      const fetchedGuild = client.guilds.cache.get(config.server_id);

      const userfetch = await client.users.fetch(req.session.verify_userid);

      if (!fetchedGuild) {
        res.redirect('/verify');

        return;
      }

      const member = await fetchedGuild.members.fetch(userfetch.id);

      await member.roles.add(config.verifiedrole_id, 'Verified');

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

  res.sendFile(resolve('/html/verified.html'));

  req.session.destroy(() => undefined);
});

server.get('/verify/logout', async (req, res) => {
  if (!req.session.verify_userid) {
    res.render(resolve('/html/error.html'), {
      messageText: 'You did not login!',
    });

    return;
  }

  req.session.destroy(() => undefined);

  res.render(resolve('/html/success.html'), {
    messageText: 'Done logout!',
  });
});

server.listen(process.env.PORT || 8080);
