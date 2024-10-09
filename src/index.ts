import './validate-env';
import 'dotenv/config';
import './server';

import { Client, GatewayIntentBits, Partials, EmbedBuilder } from 'discord.js';

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

client.login(process.env.TOKEN);

client.on('ready', () => console.log('Login in as ' + client.user?.tag));

client.on('guildMemberAdd', async member => {
  /**
   * You can use this code to send a message to the member
   * when they join the server.
   * PLEASE NOTE: Change the message to your own message.
   */
  const embed = new EmbedBuilder()
    .setTitle('Verification')
    .setDescription(
      `Please solve captcha here: ${process.env.CALLBACK_URL}\nBefore accessing to the server!`,
    );

  await member.send({ embeds: [embed] });
});

export default client;
