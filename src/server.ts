import { resolve } from 'node:path';

import { EmbedBuilder, GuildMember } from 'discord.js';

import qs from 'qs';
import axios, { AxiosRequestConfig } from 'axios';

import express from 'express';
import session from 'express-session';
import { rateLimit } from 'express-rate-limit';
import bodyParser from 'body-parser';
import { renderFile } from 'ejs';

import client from './index';
import { env } from './validate-env';

const server = express();

server.set('trust proxy', 1);

const limiter = rateLimit({
  windowMs: 15 * 60 * 5, // 15 minutes
  limit: 20, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// Apply the rate limiting middleware to all requests
server.use(limiter);

server.use(bodyParser.json());
server.use(bodyParser.urlencoded({ extended: true }));

server.engine('html', renderFile);

server.use(
  session({
    name: 'data',
    rolling: true,
    secret: 'USE_YOUR_OWN_SECRETS', // TODO: Change this to your own secret
    resave: true,
    proxy: true,
    saveUninitialized: true,
    cookie: { maxAge: 60000 * 60 * 12, secure: 'auto' },
  }),
);

server.use(express.static('assets'));

server.all('/', (_req, res) => {
  res.send('Bot is Running!');
});

server.get('/verify', async (req, res) => {
  if (!req.query.code || req.query.code.length === 0) {
    res.redirect(
      `https://discord.com/oauth2/authorize?client_id=${client.application?.id}&redirect_uri=${env.CALLBACK_URL}&response_type=code&scope=guilds.join%20email%20identify`,
    );

    return;
  }

  const oauthApiOptions: AxiosRequestConfig = {
    method: 'POST',
    url: 'https://discord.com/api/oauth2/token',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    data: qs.stringify({
      client_id: client.application?.id,
      client_secret: env.CLIENT_SECRET,
      grant_type: 'authorization_code',
      code: req.query.code,
      redirect_uri: env.CALLBACK_URL,
      scope: ['identify', 'email', 'guilds.join'],
    }),
  };

  try {
    const response = await axios(oauthApiOptions);

    const oauth_parsed = response.data;

    const apiUserOptions: AxiosRequestConfig = {
      method: 'GET',
      url: 'https://discord.com/api/users/@me',
      headers: { authorization: `Bearer ${oauth_parsed.access_token}` },
    };

    const response2 = await axios(apiUserOptions);

    const parsed = response2.data;

    let fetchedGuild = client.guilds.cache.get(env.SERVER_ID);

    if (!fetchedGuild) {
      fetchedGuild = await client.guilds.fetch(env.SERVER_ID);
    }

    let fetchedUser: GuildMember;

    try {
      fetchedUser = await fetchedGuild.members.fetch(parsed.id);
    } catch {
      const userObject = await client.users.fetch(parsed.id);
      fetchedUser = await fetchedGuild.members.add(userObject, {
        accessToken: oauth_parsed.access_token,
      });
    }

    if (fetchedUser.roles.cache.has(env.VERIFIED_ROLE_ID)) {
      res.render(resolve('./html/success.html'), {
        messageText: 'You already verified!',
      });

      return;
    }

    req.session.verify_userid = fetchedUser.id;

    if (env.REQUIRE_VERIFIED_EMAIL === 'true' || parsed.verified) {
      req.session.verify_status = 'waiting_captcha';

      let siteKey = env.RECAPTCHA_SITEKEY;
      let captcha_provider_script = 'https://www.google.com/recaptcha/api.js';

      if (env.CAPTCHA_PROVIDER === 'hcaptcha') {
        siteKey = env.HCAPTCHA_SITEKEY;
        captcha_provider_script = 'https://js.hcaptcha.com/1/api.js';
      }

      if (env.CAPTCHA_PROVIDER === 'turnstile') {
        siteKey = env.TURNSTILE_SITEKEY;
        captcha_provider_script =
          'https://challenges.cloudflare.com/turnstile/v0/api.js?compat=recaptcha';
      }

      res.render(resolve('./html/captcha.html'), {
        captcha_provider: env.CAPTCHA_PROVIDER,
        captcha_provider_script,
        captcha_sitekey: siteKey,
      });
    } else {
      req.session.destroy(() => undefined);
      res.render(resolve('./html/error.html'), {
        messageText: 'Please verify your email!',
      });
    }
  } catch (error) {
    if (error instanceof Error) console.log(error.message);
    res.redirect(
      `https://discord.com/oauth2/authorize?client_id=${client.application?.id}&redirect_uri=${env.CALLBACK_URL}&response_type=code&scope=guilds.join%20email%20identify`,
    );
  }
});

server.post('/verify/solve', async (req, res) => {
  let response_body_field = 'g-recaptcha-response';
  let captcha_server = 'https://www.google.com/recaptcha/api/siteverify';
  let captcha_secret = env.RECAPTCHA_SECRET;

  if (env.CAPTCHA_PROVIDER === 'hcaptcha') {
    response_body_field = 'h-captcha-response';
    captcha_server = 'https://hcaptcha.com/siteverify';
    captcha_secret = env.HCAPTCHA_SECRET;
  }

  if (env.CAPTCHA_PROVIDER === 'turnstile') {
    response_body_field = 'g-recaptcha-response';
    captcha_server =
      'https://challenges.cloudflare.com/turnstile/v0/siteverify';
    captcha_secret = env.TURNSTILE_SECRET;
  }

  // console.log(req.session.verify_userid, req.body[response_body_field]);

  if (!req.session.verify_userid || !req.body[response_body_field]) {
    return res.redirect('/verify');
  }

  const options: AxiosRequestConfig = {
    method: 'POST',
    url: captcha_server,
    data: qs.stringify({
      secret: captcha_secret,
      response: req.body[response_body_field],
    }),
  };

  const response = await axios(options);

  const parsed = response.data;

  if (parsed.success && req.session.verify_userid) {
    const fetchedGuild = client.guilds.cache.get(env.SERVER_ID);

    const userfetch = await client.users.fetch(req.session.verify_userid);

    if (!fetchedGuild) {
      res.redirect('/verify');

      return;
    }

    const member = await fetchedGuild.members.fetch(userfetch.id);

    await member.roles.add(env.VERIFIED_ROLE_ID, 'Verified');

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

server.get('/verify/succeed', async (req, res) => {
  if (!req.session.verify_userid) return res.redirect('/verify');
  if (req.session.verify_status !== 'done') return res.redirect('/verify');

  // res.sendFile(resolve('./html/verified.html'));
  res.render(resolve('./html/verified.html'), {
    messageText: 'You are verified!',
  });

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

const PORT = env.PORT || 8080;

server.listen(PORT);

console.log(`Server is running on port ${PORT}`);
