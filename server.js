const { MessageEmbed } = require('discord.js')
const express = require('express')
const bodyParser = require('body-parser')
const session = require('express-session')
const compression = require('compression')
const request = require('request')
const { resolve } = require('path')
const client = require('./index')
const config = require('./config.json')
const server = express()

server
  .use(compression())
  .engine('html', require('ejs').renderFile)
  .use(bodyParser.urlencoded({ extended: true }))
  .disable('x-powered-by')
  .set('trust proxy', 1)
  .use(
    session({
      name: 'sitedata',
      rolling: true,
      secret: `EfT4AVq9r-F,.FRclHc#Y##QJNT^^fY#3Wxd#ci8Z@KrEn6T2^^%7m%H26wUj&4Ena&uqLX!m!6Ca&%ubd*9FddGWSjayV8NyW4anKGCQQ#xYcY%e6Jh6PA37T2wug@KCkpSmfk`,
      resave: true,
      proxy: true,
      saveUninitialized: true,
      cookie: { maxAge: 60000 * 60 * 12, secure: true },
    })
  )
  .use(express.static('assets'))
server.all('/', (req, res) => res.send('Bot is Running!'))
server.get(`/verify`, async (req, res) => {
  var options = {
    method: 'POST',
    url: 'https://discord.com/api/oauth2/token',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    form: {
      client_id: client.application.id,
      client_secret: process.env.CLIENT_SECRET,
      grant_type: 'authorization_code',
      code: req.query.code,
      redirect_uri: config.callback_url,
      scope: ['identify', 'email', 'guilds.join'],
    },
  }
  request(options, function (error, response, body) {
    if (error) throw new Error(error)
    var oauth_parsed = JSON.parse(body)
    var options = {
      method: 'GET',
      url: 'https://discord.com/api/users/@me',
      headers: { authorization: `Bearer ${oauth_parsed.access_token}` },
    }
    request(options, async function (error, response, body) {
      if (error) throw new Error(error)
      if (req.session.verify_userid) {
        return res.render(resolve('./html/captcha.html'), {
          recaptcha_sitekey: process.env.RECAPTCHA_SITEKEY,
        })
      }
      if (response.statusCode !== 200) {
        return res.redirect(
          `https://discord.com/oauth2/authorize?client_id=${config.client_id}&redirect_uri=${config.callback_url}&response_type=code&scope=guilds.join%20email%20identify`
        )
      }
      const parsed = JSON.parse(body)
      const guildGet = client.guilds.cache.get(config.server_id)
      const userfetch = await client.users.fetch(parsed.id)
      await guildGet.addMember(userfetch, {
        accessToken: oauth_parsed.access_token,
      })
      const userguild = guildGet.member(userfetch)

      if (userguild.roles.cache.has(config.verifiedrole_id)) {
        return res.render(resolve('./html/success.html'), {
          success_msg: 'You already verified!',
        })
      }
      req.session.verify_userid = parsed.id
      if (config.verified_email_required === true || parsed.verified) {
        req.session.verify_status = 'waiting_recaptcha'
        return res.render(resolve('./html/captcha.html'), {
          recaptcha_sitekey: process.env.RECAPTCHA_SITEKEY,
        })
      } else {
        await req.session.destroy()
        return res.render(resolve('./html/error.html'), {
          error_msg: 'Please verify your email!',
        })
      }
    })
  })
})

server.post('/verify/solve/', async (req, res) => {
  if (!req.session.verify_userid || !req.body['g-recaptcha-response']) {
    return res.redirect('/verify')
  }
  var options = {
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
  }
  request(options, async function (error, response, body) {
    if (error) throw new Error(error)
    const parsed = JSON.parse(body)
    if (parsed.success) {
      const guildGet = client.guilds.cache.get(config.server_id)
      const userfetch = await client.users.fetch(req.session.verify_userid)
      const member = await guildGet.members.fetch(userfetch.id)
      await member.roles.add(config.verifiedrole_id, `Verified`)
      req.session.verify_status = 'done'
      const embed = new MessageEmbed()
        .setTitle(':white_check_mark: Verified')
        .setDescription('Now you can access to the server!')
        .setColor('GREEN')
      member.send({ embeds: [embed] }).catch(() => undefined)
      return res.redirect('/verify/succeed')
    } else {
      res.redirect('/verify')
    }
  })
})

server.get('/verify/succeed', async (req, res) => {
  if (!req.session.verify_userid) return res.redirect('/verify')
  if (req.session.verify_status !== 'done') return res.redirect('/verify')
  res.sendFile(resolve('/html/verified.html'))
  return req.session.destroy()
})

server.get('/verify/logout', async (req, res) => {
  if (!req.session.verify_userid) {
    return res.render(resolve('/html/error.html'), {
      error_msg: `You did not login!`,
    })
  }
  await req.session.destroy()
  return res.render(resolve('/html/success.html'), {
    success_msg: `Done logout!`,
  })
})

server.listen(process.env.PORT || 8080)
