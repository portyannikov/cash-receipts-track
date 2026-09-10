const amqplib = require("amqplib");

class MqPublisher {
  constructor({ rabbitmqUrl, exchangeName, routingKey }) {
    this.url = rabbitmqUrl;
    this.exchangeName = exchangeName;
    this.routingKey = routingKey;
    this.connection = null;
    this.channel = null;
  }

  async connect() {
    this.connection = await amqplib.connect(this.url);
    this.channel = await this.connection.createChannel();

    await this.channel.assertExchange(this.exchangeName, "topic", { durable: true });

    this.connection.on("error", (error) => {
      console.error(`RabbitMQ connection error: ${error.message}`);
    });

    console.log(`Connecter to RabbitMQ exchange=${this.exchangeName}`);
  }

  async close() {
    if (this.channel) await this.channel.close();
    if (this.connection) await this.connection.close();
  }

  /**
   * @param {object} payload
   */
  async publishSubmission(payload) {
    if(!this.channel) {
      throw new Error("MqPublisher.connect() must be called before publishing");
    }

    const body = Buffer.from(JSON.stringify(payload), "utf-8");
    this.channel.publish(this.exchangeName, this.routingKey, body, {
      contentType: "application/json",
      persistent: true,
    });

    console.log(`Published submission routing_key=${this.routingKey}`);
  }
}

module.exports = { MqPublisher };