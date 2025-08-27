const { Markup } = require("telegraf");
const rateLimit = require("./middlewares/rateLimit");
const logger = require("./middlewares/logger");
const cache = require("./services/cacheService");
const { searchDomainOrIP } = require("./services/searchService");
const { resolveRealIP, isCloudflareIP } = require("./utils/cloudflare");
const axios = require("axios");
const { checkOpenPorts } = require("./services/portService");
const mongoose = require("mongoose");
const cheerio = require("cheerio");

require("dotenv").config();

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("🧠 MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB error:", err));

const userSchema = new mongoose.Schema({
  id: Number,
  username: String,
  joinedAt: Date,
  vipUntil: Date,
  history: [
    {
      type: String, // 'search' or 'spy'
      query: String,
      date: Date,
    },
  ],
  lastRequestDate: Date,
  requestCount: { type: Number, default: 0 },
  lastSpyDate: Date,
  spyCount: { type: Number, default: 0 },
});

const User = mongoose.model("User", userSchema);

const ownerId = 6558036376;

const userStates = {};

const getUser = async (userId, username) => {
  let user = await User.findOne({ id: userId });
  if (!user) {
    user = new User({
      id: userId,
      username: username,
      joinedAt: new Date(),
    });
    await user.save();
  }
  return user;
};

const isVip = (user) => {
  return user.vipUntil && user.vipUntil > new Date();
};

const checkLimit = async (user, type, userId) => {
  if (userId === ownerId) return true;

  const today = new Date().toDateString();
  let lastDate = type === "search" ? user.lastRequestDate : user.lastSpyDate;
  let count = type === "search" ? user.requestCount : user.spyCount;
  const vipStatus = isVip(user);
  const limit = type === "search" ? (vipStatus ? 10 : 3) : vipStatus ? 3 : 1;

  if (lastDate && lastDate.toDateString() === today) {
    if (count >= limit) return false;
  } else {
    if (type === "search") {
      user.lastRequestDate = new Date();
      user.requestCount = 0;
    } else {
      user.lastSpyDate = new Date();
      user.spyCount = 0;
    }
    await user.save();
  }
  return true;
};

const incrementCount = async (user, type, query) => {
  if (type === "search") {
    user.requestCount++;
  } else {
    user.spyCount++;
  }
  user.history.push({ type, query, date: new Date() });
  await user.save();
};

const getNetcraftInfo = async (query) => {
  try {
    const url = `https://sitereport.netcraft.com/?url=${query}`;
    const res = await axios.get(url);
    const $ = cheerio.load(res.data);
    let info = "🕵️‍♂️ Netcraft Spy Report:\n\n";

    $("table.reporttable").each((i, table) => {
      $(table)
        .find("tr")
        .each((j, tr) => {
          const th = $(tr).find("th").text().trim().replace(/:$/, "");
          const td = $(tr).find("td").text().trim();
          if (th && td) {
            info += `🤓 ${th}: <b>${td}</b>\n`;
          }
        });
    });

    if (info === "🕵️‍♂️ Netcraft Spy Report:\n\n") {
      info += "❌ No detailed info found.";
    }
    return info;
  } catch (err) {
    return `❌ Spy Error: ${err.message}`;
  }
};

const botHandler = (bot) => {
  bot.use(logger);
  bot.use(rateLimit);

  bot.command("start", async (ctx) => {
    await ctx.reply("👨‍💻 Welcome to sbp31SpyBot! 🛠️ Choose an option:", {
      reply_markup: Markup.inlineKeyboard([
        [
          Markup.button.callback("🔍 Search IP/Domain", "search"),
          Markup.button.callback("🕵️‍♂️ Spy Domain", "spy"),
        ],
        [
          Markup.button.callback("📊 Profile", "profile"),
          Markup.button.callback("💳 Shop", "shop"),
        ],
        [Markup.button.callback("ℹ️ About", "about")],
      ]),
    });
  });

  bot.action("about", async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.reply(
      "🚀 sbp31SpyBot: Fast IP/Domain spy tools.\nCreated by @merdan_usa. 🤓"
    );
  });

  bot.action("search", async (ctx) => {
    await ctx.answerCbQuery();
    userStates[ctx.chat.id] = "search";
    await ctx.reply("🔎 Enter IP or Domain to search: 🧠");
  });

  bot.action("spy", async (ctx) => {
    await ctx.answerCbQuery();
    userStates[ctx.chat.id] = "spy";
    await ctx.reply("🕵️‍♂️ Enter Domain to spy: 👨‍💻");
  });

  bot.action("profile", async (ctx) => {
    await ctx.answerCbQuery();
    const user = await getUser(ctx.from.id, ctx.from.username);
    const vipStatus = isVip(user);
    const searchLimit = vipStatus ? 10 : 3;
    const spyLimit = vipStatus ? 3 : 1;
    const vipText = vipStatus
      ? `Yes (until ${user.vipUntil.toDateString()})`
      : "No";
    await ctx.reply(
      `📊 Your Profile:\n` +
        `ID: <b>${user.id}</b>\n` +
        `Username: <b>${user.username}</b>\n` +
        `Joined: <b>${user.joinedAt.toDateString()}</b>\n` +
        `VIP: <b>${vipText}</b>\n` +
        `Searches today: <b>${user.requestCount}/${searchLimit}</b>\n` +
        `Spies today: <b>${user.spyCount}/${spyLimit}</b>\n` +
        `Total History: <b>${user.history.length} requests</b>`,
      { parse_mode: "HTML" }
    );
  });

  bot.action("shop", async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.reply("💳 Choose VIP plan:", {
      reply_markup: Markup.inlineKeyboard([
        [Markup.button.callback("🌟 Week (30 stars)", "vip_week")],
        [Markup.button.callback("🌟 Month (100 stars)", "vip_month")],
      ]),
    });
  });

  bot.action("vip_week", async (ctx) => {
    await ctx.answerCbQuery();
    await bot.telegram.sendInvoice(ctx.chat.id, {
      title: "VIP Week",
      description: "Unlimited access for 1 week 🧠",
      payload: "vip_week",
      provider_token: process.env.PROVIDER_TOKEN,
      currency: "XTR",
      prices: [{ label: "VIP Week", amount: 30 }],
    });
  });

  bot.action("vip_month", async (ctx) => {
    await ctx.answerCbQuery();
    await bot.telegram.sendInvoice(ctx.chat.id, {
      title: "VIP Month",
      description: "Unlimited access for 1 month 👨‍💻",
      payload: "vip_month",
      provider_token: process.env.PROVIDER_TOKEN,
      currency: "XTR",
      prices: [{ label: "VIP Month", amount: 100 }],
    });
  });

  bot.on("pre_checkout_query", (ctx) => ctx.answerPreCheckoutQuery(true));

  bot.on("successful_payment", async (ctx) => {
    const payload = ctx.update.message.successful_payment.invoice_payload;
    const days = payload === "vip_week" ? 7 : 30;
    const user = await getUser(ctx.from.id, ctx.from.username);
    user.vipUntil = new Date(Date.now() + days * 86400000);
    await user.save();
    await ctx.reply("🌟 VIP activated successfully! 🤓");
  });

  bot.on("text", async (ctx) => {
    const state = userStates[ctx.chat.id];
    if (!state) return;

    const query = ctx.message.text.trim();
    delete userStates[ctx.chat.id];

    const user = await getUser(ctx.from.id, ctx.from.username);

    if (!(await checkLimit(user, state, ctx.from.id))) {
      await ctx.reply(
        `⚠️ Daily ${state} limit reached. Upgrade to VIP for more! 💳`
      );
      return;
    }

    const cached = cache.get(query);
    if (cached && state === "search") {
      await ctx.replyWithHTML(cached);
      await incrementCount(user, state, query);
      return;
    }

    try {
      let message;
      if (state === "search") {
        message = await searchDomainOrIP(query);
        cache.set(query, message);
      } else {
        // spy
        message = await getNetcraftInfo(query);
      }
      await ctx.reply(message, { parse_mode: "HTML" });
      await incrementCount(user, state, query);
    } catch (err) {
      await ctx.reply(`❌ Error: ${err.message}`);
    }
  });

  // Add hears for quick commands
  bot.hears("profile", async (ctx) => {
    // Same as action profile
    const user = await getUser(ctx.from.id, ctx.from.username);
    const vipStatus = isVip(user);
    const searchLimit = vipStatus ? 10 : 3;
    const spyLimit = vipStatus ? 3 : 1;
    const vipText = vipStatus
      ? `Yes (until ${user.vipUntil.toDateString()})`
      : "No";
    await ctx.reply(
      `📊 Your Profile:\n` +
        `ID: <b>${user.id}</b>\n` +
        `Username: <b>${user.username}</b>\n` +
        `Joined: <b>${user.joinedAt.toDateString()}</b>\n` +
        `VIP: <b>${vipText}</b>\n` +
        `Searches today: <b>${user.requestCount}/${searchLimit}</b>\n` +
        `Spies today: <b>${user.spyCount}/${spyLimit}</b>\n` +
        `Total History: <b>${user.history.length} requests</b>`,
      { parse_mode: "HTML" }
    );
  });

  bot.hears("shop", async (ctx) => {
    await ctx.reply("💳 Choose VIP plan:", {
      reply_markup: Markup.inlineKeyboard([
        [Markup.button.callback("🌟 Week (30 stars)", "vip_week")],
        [Markup.button.callback("🌟 Month (100 stars)", "vip_month")],
      ]),
    });
  });
};

module.exports = botHandler;
