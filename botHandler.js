const { Markup } = require("telegraf");
const rateLimit = require("./middlewares/rateLimit");
const logger = require("./middlewares/logger");
const cache = require("./services/cacheService");
const { searchDomainOrIP } = require("./services/searchService");
const { spyDomain } = require("./services/spyService");
const User = require("./models/User");
const { handlePayment } = require("./services/paymentService");

const userState = {};

const botHandler = (bot) => {
  bot.use(logger);
  bot.use(rateLimit);

  bot.use(async (ctx, next) => {
    if (ctx.from) {
      let user = await User.findOne({ id: ctx.from.id });
      if (!user) {
        user = new User({
          id: ctx.from.id,
          username: ctx.from.username,
        });
        await user.save();
      }
      ctx.user = user;
    }
    next();
  });

  bot.command("start", async (ctx) => {
    await ctx.reply("🛠️ Choose an option:", {
      ...Markup.inlineKeyboard([
        [Markup.button.callback("🔍 Search IP/Domain", "search")],
        [Markup.button.callback("🕵️ Spy Domain", "spy")],
        [Markup.button.callback("🛒 Shop", "shop")],
        [Markup.button.callback("👤 Profile", "profile")],
        [Markup.button.callback("ℹ️ About", "about")],
      ]),
    });
  });

  bot.action("about", async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.reply(
      "🚀 SBP31 Spy Bot - Fast IP/Domain tools.\nCreated by @SbP_31."
    );
  });

  bot.action("search", async (ctx) => {
    await ctx.answerCbQuery();

    if (ctx.user.id !== 6558036376) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const searchCount = ctx.user.isVip ? 10 : 3;
      const searchesToday = await User.aggregate([
        { $match: { id: ctx.user.id } },
        { $unwind: "$history" },
        {
          $match: {
            "history.type": "search",
            "history.timestamp": { $gte: today },
          },
        },
        { $count: "count" },
      ]);

      if ((searchesToday[0]?.count || 0) >= searchCount) {
        return ctx.reply(
          `❌ You've reached your daily search limit (${searchCount}). Upgrade to VIP for more searches.`
        );
      }
    }

    userState[ctx.chat.id] = { action: "search" };
    await ctx.reply("🔎 Please enter IP or Domain:");
  });

  bot.action("spy", async (ctx) => {
    await ctx.answerCbQuery();

    if (ctx.user.id !== 6558036376) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const lastSpyToday = await User.findOne({
        id: ctx.user.id,
        "history.type": "spy",
        "history.timestamp": { $gte: today },
      });

      if (lastSpyToday && !ctx.user.isVip) {
        return ctx.reply(
          "❌ Standard users can only spy once per day. Upgrade to VIP for more spies."
        );
      }

      if (ctx.user.isVip) {
        const spiesToday = await User.aggregate([
          { $match: { id: ctx.user.id } },
          { $unwind: "$history" },
          {
            $match: {
              "history.type": "spy",
              "history.timestamp": { $gte: today },
            },
          },
          { $count: "count" },
        ]);

        if ((spiesToday[0]?.count || 0) >= 3) {
          return ctx.reply("❌ You've reached your daily spy limit (3).");
        }
      }
    }

    userState[ctx.chat.id] = { action: "spy" };
    await ctx.reply("🕵️ Please enter Domain to spy:");
  });

  bot.action("shop", async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.reply("💎 VIP Subscription Plans:", {
      ...Markup.inlineKeyboard([
        [Markup.button.callback("1 Week - 30 Stars", "vip_week")],
        [Markup.button.callback("1 Month - 100 Stars", "vip_month")],
      ]),
    });
  });

  bot.action("profile", async (ctx) => {
    await ctx.answerCbQuery();

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const searchesToday = await User.aggregate([
      { $match: { id: ctx.user.id } },
      { $unwind: "$history" },
      {
        $match: {
          "history.type": "search",
          "history.timestamp": { $gte: today },
        },
      },
      { $count: "count" },
    ]);

    const searchCount = searchesToday[0]?.count || 0;
    const searchLimit = ctx.user.isVip ? 10 : 3;

    const profileText = `
👤 User Profile:
╔═════════════════
╟─🆔 ID: ${ctx.user.id}
╟─👤 Username: @${ctx.user.username || "N/A"}
╟─💎 VIP: ${ctx.user.isVip ? "Yes ✅" : "No ❌"}
╟─🔍 Searches today: ${searchCount}/${searchLimit}
╟─🕵️ Spies today: ${ctx.user.isVip ? "3/3" : "1/1"}
╚═════════════════
        `.trim();

    await ctx.reply(profileText);
  });

  bot.action(/vip_(week|month)/, async (ctx) => {
    await ctx.answerCbQuery();
    const period = ctx.match[1];
    await handlePayment(ctx, period);
  });

  bot.on("text", async (ctx) => {
    const chatId = ctx.chat.id;
    if (userState[chatId]) {
      const query = ctx.message.text.trim();
      const action = userState[chatId].action;
      delete userState[chatId];

      try {
        let message;
        if (action === "search") {
          message = await searchDomainOrIP(query);
          ctx.user.history.push({
            query,
            type: "search",
          });
          await ctx.user.save();
        } else if (action === "spy") {
          message = await spyDomain(query);
          ctx.user.history.push({
            query,
            type: "spy",
          });
          await ctx.user.save();
        }

        await ctx.reply(message, { parse_mode: "HTML" });
      } catch (err) {
        await ctx.reply(`❌ Error: ${err.message}`);
      }
    }
  });
};

module.exports = botHandler;
