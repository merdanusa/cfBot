module.exports = (ctx, next) => {
  console.log(
    `📩 [${new Date().toISOString()}] Message from ${
      ctx.from.username || ctx.from.id
    }: ${ctx.updateType}`
  );
  return next();
};
