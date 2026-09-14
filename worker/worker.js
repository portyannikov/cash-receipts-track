require("dotenv").config();
const amqplib = require("amqplib");
const config = require("./config");
const express = require("express");
const { appendDataToFile } = require("./appendDataToFile");
const readFile = require("./readFile");
const { ensureFileExists, resetXlsxFile } = require("./ensureFileExists")
const cors = require("cors");

const main = async() => {
  const connection = await amqplib.connect(config.rabbitmqUrl);
  const channel = await connection.createChannel();

  await channel.prefetch(1);
  await channel.assertExchange(config.exchangeName, "topic", { durable: true });
  await channel.assertQueue(config.queueName, { durable: true });
  await channel.bindQueue(config.queueName, config.exchangeName, config.bindingPattern);

  await ensureFileExists(config.dataFilePath, config.exportFormat);

  console.log(
    `Worker ready. exchange=${config.exchangeName} queue=${config.queueName} ` +
    `pattern=${config.bindingPattern} format=${config.exportFormat} file=${config.dataFilePath}`
  );

  channel.consume(config.queueName, async (msg) => {
    if (!msg) return;

    try {
      const payload = JSON.parse(msg.content.toString("utf-8"));
      
      await appendDataToFile(config.dataFilePath, config.exportFormat, payload);
      channel.ack(msg);
    } catch (error) {
      console.error(`Failed to precess message: ${error}`);
      channel.nack(msg, false, false);
    }
  });

  connection.on("error", (error) => {
    console.error(`RabbitMQ connection error: ${error.message}`);
  });

  const shutdown = async (signal) => {
    console.log(`Received ${signal}, shutting donw...`);
    await channel.close();
    await connection.close();
    process.exit(0);
  }

  process.once("SIGINT", () => shutdown("SIGINT"));
  process.once("SIGTERM", () => shutdown("SIGTERM"));
}

main().catch((error) => {
  console.error("Fatal error during worker startup:", error);
  process.exit(1);
});

const app = express();
app.use(cors());

app.get("/submissions", async (req, res) => {
  try {
    const data = await readFile(config.dataFilePath, config.exportFormat);

    res.json(data);
  } catch (error) {
    console.error("Failed to read submissions:", error);
    res.status(404).json({
      message: "Failed to read submissions",
    });
  }
});
app.get("/submissions/file", (req, res) => {
  const { isRemove } = req.query;
  const shouldRemove = isRemove === "true" || isRemove === "1";

  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");

  res.sendFile(config.dataFilePath, async (err) => {
    if (err) {
      console.error("Failed to send file:", err);
      return;
    }

    if (shouldRemove) {
      try {
        await resetXlsxFile(config.dataFilePath);
      } catch (error) {
        console.error("Failed to reset file after download:", error);
      }
    }
  });
});

app.listen(process.env.PORT);