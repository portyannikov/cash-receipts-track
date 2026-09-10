const sessionMiddleware = () => {
  const store = new Map();

  return async (ctx, next) => {
    const chatId = ctx.chat && ctx.chat.id;
    if (chatId === null) {
      return next();
    }

    if (!store.has(chatId)) {
      store.set(chatId, { step: null, data: {} });
    }
    ctx.session = store.get(chatId);
    await next();

    store.set(chatId, ctx.session);
  };
};

module.exports = { sessionMiddleware };
