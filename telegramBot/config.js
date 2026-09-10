require('dotenv').config();

function required(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

module.exports = {
  botToken: required('TELEGRAM_BOT_TOKEN'),
  rabbitmqUrl: process.env.RABBITMQ_URL || 'amqp://guest:guest@rabbitmq:5672/',
  exchangeName: process.env.EXCHANGE_NAME || 'form_submissions',
  routingKey: process.env.ROUTING_KEY || 'telegram',
};