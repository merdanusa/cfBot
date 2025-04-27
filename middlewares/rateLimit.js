const rateLimit = require("telegraf-ratelimit");

module.exports = rateLimit({
  window: 60000,
  limit: 5,
  onLimitExceeded: (ctx) =>
    ctx.reply("⚠️ Too many requests. Please wait a minute."),
});
