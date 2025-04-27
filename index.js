const { Telegraf } = require("telegraf");
const botHandler = require("./botHandler");
require("dotenv").config();

const bot = new Telegraf(process.env.BOT_TOKEN);

botHandler(bot);

bot.launch();
console.log("🤖 Bot is running...");

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
