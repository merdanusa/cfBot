const { Telegraf } = require("telegraf");
const botHandler = require("./botHandler");
const connectDB = require("./config/database");
require("dotenv").config();

const bot = new Telegraf(process.env.BOT_TOKEN);

connectDB();

botHandler(bot);

bot.on("pre_checkout_query", (ctx) => {
  ctx.answerPreCheckoutQuery(true);
});

bot.on("successful_payment", async (ctx) => {
  const User = require("./models/User");
  const payload = ctx.message.successful_payment.invoice_payload;
  const [_, period, userId] = payload.split("_");

  const user = await User.findOne({ id: parseInt(userId) });
  if (user) {
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + (period === "week" ? 7 : 30));

    user.isVip = true;
    user.vipExpires = expiryDate;
    await user.save();

    await ctx.reply("🎉 Thank you for your purchase! You now have VIP status!");
  }
});

bot.launch();
console.log("🤖 SBP31 Spy Bot is running...");

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
