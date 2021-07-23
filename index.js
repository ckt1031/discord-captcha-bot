"use strict";

const Discord = require("discord.js");
const client = new Discord.Client();
const config = require("./config.json");

client.login(process.env.TOKEN);
global.client = client;

client.on("ready", () => {
  console.log("logined in as " + client.user.tag);
});

client.on("guildMemberAdd", member => {
  const embed = new Discord.MessageEmbed()
    .setTitle("Verification")
    .setDescription(
      `Please solve reCAPTCHA here:${
        config.callback_url
      }\nBefore accessing to the server!`
    );
  member.send(embed);
});

require("./server")();
