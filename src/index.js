// @ts-check

const { Client, Intents, MessageEmbed } = require('discord.js');

const config = require('../config.json');

const client = new Client({
  partials: ['MESSAGE', 'CHANNEL', 'REACTION'],
  allowedMentions: { parse: ['users', 'roles'], repliedUser: true },
  intents: new Intents(32767),
});

module.exports = client;

client.login(process.env.TOKEN);

client.on('ready', () => console.log('logined in as ' + client.user?.tag));

client.on('guildMemberAdd', member => {
  const embed = new MessageEmbed()
    .setTitle('Verification')
    .setDescription(
      `Please solve reCAPTCHA here:${config.callback_url}\nBefore accessing to the server!`,
    );

  member.send({ embeds: [embed] });
});

require('./server');
