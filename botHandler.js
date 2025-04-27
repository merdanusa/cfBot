const { Markup } = require("telegraf");
const rateLimit = require("./middlewares/rateLimit");
const logger = require("./middlewares/logger");
const { searchDomainOrIP } = require("./services/searchService");

const userSearchState = {};

const botHandler = (bot) => {
  bot.use(logger);
  bot.use(rateLimit);

  bot.command("start", async (ctx) => {
    await ctx.reply("🛠️ Choose an option:", {
      ...Markup.inlineKeyboard([
        [Markup.button.callback("🔍 Search IP/Domain", "search")],
        [Markup.button.callback("ℹ️ About", "about")],
      ]),
    });
  });

  bot.action("about", async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.reply("🚀 Fast IP/Domain tools.\nCreated by @merdan_usa.");
  });

  bot.action("search", async (ctx) => {
    await ctx.answerCbQuery();
    userSearchState[ctx.chat.id] = true;
    await ctx.reply("🔎 Please enter IP or Domain:");
  });

  bot.on("text", async (ctx) => {
    if (userSearchState[ctx.chat.id]) {
      const query = ctx.message.text.trim();
      delete userSearchState[ctx.chat.id];

      const result = await searchDomainOrIP(query);

      await ctx.replyWithHTML(result);
    }
  });
};

module.exports = botHandler;
