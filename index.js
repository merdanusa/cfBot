const { Telegraf } = require("telegraf");
const botHandler = require("./botHandler");
const connectDB = require("./config/database");
require("dotenv").config();

const bot = new Telegraf(process.env.BOT_TOKEN);

connectDB();

botHandler(bot);

bot.launch();
console.log("🤖 SBP31 Spy Bot is running...");

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
