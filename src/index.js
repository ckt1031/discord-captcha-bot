// @ts-check

require('dotenv').config();
require('./validate-env');

const {
  Client,
  GatewayIntentBits,
  Partials,
  EmbedBuilder,
} = require('discord.js');

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
  /**
   * You can use this code to send a message to the member
   * when they join the server.
   * PLEASE NOTE: Change the message to your own message.
   */
  const embed = new EmbedBuilder()
    .setTitle('Verification')
    .setDescription(
      `Please solve captcha here:${process.env.CALLBACK_URL}\nBefore accessing to the server!`,
    );

  member.send({ embeds: [embed] });
});

require('./server');
