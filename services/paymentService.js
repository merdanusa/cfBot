const { Markup } = require("telegraf");
const User = require("../models/User");

const handlePayment = async (ctx, period) => {
  const prices = {
    week: 3000, // 30 stars * 100
    month: 10000, // 100 stars * 100
  };

  const periods = {
    week: 7,
    month: 30,
  };

  await ctx.replyWithInvoice({
    title: `VIP Subscription - ${period}`,
    description: `Get VIP access for ${period}`,
    payload: `vip_${period}_${ctx.from.id}`,
    provider_token: process.env.PROVIDER_TOKEN,
    currency: "USD",
    prices: [{ label: "Stars", amount: prices[period] }],
  });
};

bot.on("pre_checkout_query", (ctx) => {
  ctx.answerPreCheckoutQuery(true);
});

bot.on("successful_payment", async (ctx) => {
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

module.exports = { handlePayment };
