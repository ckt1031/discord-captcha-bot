const { Client, Intents, MessageEmbed } = require('discord.js')
const client = new Client({
  partials: ['MESSAGE', 'CHANNEL', 'REACTION'],
  allowedMentions: { parse: ['users', 'roles'], repliedUser: true },
  intents: new Intents(32767),
})
const config = require('./config.json')
client.login(process.env.TOKEN)
client.on('ready', () => console.log('logined in as ' + client.user.tag))
client.on('guildMemberAdd', (member) => {
  const embed = new MessageEmbed()
  embed.setTitle('Verification')
  embed.setDescription(
    `Please solve reCAPTCHA here:${config.callback_url}\nBefore accessing to the server!`
  )
  member.send(embed)
})
require('./server')()
module.exports = client
