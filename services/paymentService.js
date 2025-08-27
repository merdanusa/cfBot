const { Markup } = require("telegraf");

const handlePayment = async (ctx, period) => {
  const prices = {
    week: 3000, // 30 stars * 100
    month: 10000, // 100 stars * 100
  };

  await ctx.replyWithInvoice({
    title: `VIP Subscription - ${period}`,
    description: `Get VIP access for ${
      period === "week" ? "1 week" : "1 month"
    }`,
    payload: `vip_${period}_${ctx.from.id}`,
    provider_token: process.env.PROVIDER_TOKEN,
    currency: "USD",
    prices: [{ label: "Stars", amount: prices[period] }],
  });
};

module.exports = { handlePayment };
