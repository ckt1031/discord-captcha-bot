// @ts-check

require('dotenv').config();

const {
  Client,
  GatewayIntentBits,
  Partials,
  EmbedBuilder,
} = require('discord.js');
const config = require('../config.json');

const client = new Client({
  allowedMentions: { parse: ['users', 'roles'], repliedUser: true },
  partials: [
    Partials.User,
    Partials.Channel,
    Partials.Message,
    Partials.GuildMember,
  ],
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.MessageContent,
  ],
});

module.exports = client;

client.login(process.env.TOKEN);

client.on('ready', () => console.log('logined in as ' + client.user?.tag));

client.on('guildMemberAdd', member => {
  const embed = new EmbedBuilder()
    .setTitle('Verification')
    .setDescription(
      `Please solve reCAPTCHA here:${config.callback_url}\nBefore accessing to the server!`,
    );

  member.send({ embeds: [embed] });
});

require('./server');
