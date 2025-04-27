const rateLimit = require("telegraf-ratelimit");

module.exports = rateLimit({
  window: 60000, // 1 minut
  limit: 5, // 5 request
  onLimitExceeded: (ctx) =>
    ctx.reply("⚠️ Too many requests. Please wait a minute."),
});
