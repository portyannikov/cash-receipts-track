const { Telegraf } = require("telegraf");

const config = require("./config");
const { sessionMiddleware } = require("./session");
const { registerHandlers } = require("./handlers");
const { MqPublisher } = require("./mqPublisher");


const main = async () => {
  const mqPublisher = new MqPublisher({
    rabbitmqUrl: config.rabbitmqUrl,
    exchangeName: config.exchangeName,
    routingKey: config.routingKey,
  });
  await mqPublisher.connect();

  const bot = new Telegraf(config.botToken);
  bot.use(sessionMiddleware());
  registerHandlers(bot, mqPublisher);

  bot.catch((error, ctx) => {
    console.error(`Unhandled error for update ${ctx.updateType}:`, error);
  });

  await bot.launch();
  console.log("Telegram bot started (polling)");

  const shutdown = async (signal) => {
    console.log(`Received ${signal}, shutting down...`);
    bot.stop(signal);
    await mqPublisher.close();
    process.exit(0);
  };
  process.once("SIGINT", () => shutdown("SIGINT"));
  process.once("SIGTERM", () => shutdown("SIGTERM"));
}

main().catch((err) => {
  console.error("Fatal error during bot startup:", err);
  process.exit(1);
});