require("dotenv").config();

module.exports = {
  rabbitmqUrl: process.env.RABBITMQ_URL || "amqp://guest:guest@rabbitmq:5672/",
  exchangeName: process.env.EXCHANGE_NAME || "form_submissions",
  queueName: process.env.QUEUE_NAME || "form_submissions_storage",

  bindingPattern: process.env.BINDING_PATTERN || "#",
  exportFormat: process.env.EXPORT_FORMAT || "csv",
  dataFilePath: process.env.DATA_FILE_PATH || "/storage/submissions.csv",
}