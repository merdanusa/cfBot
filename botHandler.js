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

  const welcomeMessage = `
🚀 <b>Welcome to SBP31 SpyBot!</b> 🤖

🔍 <i>Unlock the power of domain intelligence!</i>
🕵️ <i>Discover hidden information about any website!</i>
💎 <i>Become a VIP for unlimited access!</i>

✨ <b>Features:</b>
• IP/Domain analysis
• Deep domain spying
• Real-time intelligence
• VIP exclusive tools

💡 <i>Start by choosing an option below!</i>
    `.trim();

  // Middleware to check user limits
  bot.use(async (ctx, next) => {
    if (ctx.from) {
      let user = await User.findOne({ id: ctx.from.id });
      if (!user) {
        user = new User({
          id: ctx.from.id,
          username: ctx.from.username,
        });
        await user.save();

        // Send welcome message to new users
        await ctx.reply(welcomeMessage, {
          parse_mode: "HTML",
          ...Markup.inlineKeyboard([
            [Markup.button.callback("🔍 Start Searching", "search")],
            [Markup.button.callback("💎 Get VIP", "shop")],
            [Markup.button.callback("📊 My Profile", "profile")],
          ]),
        });
      }
      ctx.user = user;
    }
    next();
  });

  bot.command("start", async (ctx) => {
    await ctx.reply(welcomeMessage, {
      parse_mode: "HTML",
      ...Markup.inlineKeyboard([
        [Markup.button.callback("🔍 Search IP/Domain", "search")],
        [Markup.button.callback("🕵️ Spy Domain", "spy")],
        [Markup.button.callback("💎 VIP Shop", "shop")],
        [Markup.button.callback("👤 My Profile", "profile")],
        [
          Markup.button.callback("⭐ Rate Us", "rate"),
          Markup.button.callback("📞 Support", "support"),
        ],
      ]),
    });
  });

  bot.action("about", async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.reply(
      `
🚀 <b>SBP31 SpyBot - Ultimate Domain Intelligence</b>

🔍 <i>Professional tools for digital investigators</i>
🕵️ <i>Uncover hidden website information</i>
💎 <i>VIP features for power users</i>

📊 <b>What we offer:</b>
• Real-time domain analysis
• IP intelligence gathering
• SSL security checks
• Social media discovery
• WHOIS information
• And much more!

👨‍💻 <b>Created by:</b> @merdan_usa
⭐ <b>Rating:</b> 4.9/5 from 1000+ users
    `.trim(),
      { parse_mode: "HTML" }
    );
  });

  bot.action("rate", async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.reply(
      `
⭐ <b>Love SBP31 SpyBot?</b>

Please rate us and share your experience! Your feedback helps us improve and grow.

💬 <i>Tell your friends about us!</i>
📱 <i>Share on social media!</i>
⭐ <i>Rate us 5 stars!</i>

Thank you for your support! 🙏
    `.trim(),
      { parse_mode: "HTML" }
    );
  });

  bot.action("support", async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.reply(
      `
📞 <b>Need Help?</b>

We're here to assist you! Contact our support team for:

• Technical issues
• VIP subscription help
• Feature requests
• General questions

🔗 <b>Contact:</b> @merdan_usa
⏰ <b>Response time:</b> Within 24 hours

💡 <i>We value your feedback!</i>
    `.trim(),
      { parse_mode: "HTML" }
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
    await ctx.reply(
      `
💎 <b>VIP SUBSCRIPTION PLANS</b>

✨ <b>Unlock Premium Features:</b>
• Unlimited searches (10/day → Unlimited)
• 3x more spy requests
• Priority processing
• Advanced analytics
• Exclusive tools

💰 <b>Only $1 per month!</b>

⚡ <i>Best value for professional users!</i>
    `.trim(),
      {
        parse_mode: "HTML",
        ...Markup.inlineKeyboard([
          [Markup.button.callback("💎 Get VIP (1 Month - $1)", "vip_month")],
          [Markup.button.callback("🔙 Back to Menu", "back_menu")],
        ]),
      }
    );
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
