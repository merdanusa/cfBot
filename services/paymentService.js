const { Markup } = require("telegraf");

const handlePayment = async (ctx, period) => {
  const prices = {
    month: 100,
  };

  await ctx.replyWithInvoice({
    title: `💎 VIP Subscription - 1 Month`,
    description: `Unlock unlimited searches, advanced spy tools, and premium features!`,
    payload: `vip_month_${ctx.from.id}`,
    provider_token: process.env.PROVIDER_TOKEN,
    currency: "USD",
    prices: [{ label: "VIP Membership", amount: prices.month }],
  });
};

module.exports = { handlePayment };
