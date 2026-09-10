const fs = require("fs");
const path = require("path");

const FIELD_NAMES = [
  "Platform",
  "Full Name",
  "IBAN",
  "IBAN Problem",
  "Tax ID",
  "Phone",
  "Submitted date",
]

const DELIMITER = ";";

const escapeCsvField = (value) => {
  const str = value === null || value === undefined ? "" : String(value);
  if (str.includes(DELIMITER) || str.includes('"') || str.includes("\n") || str.includes("\r")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

const rowToLine = (values) => {
  return values.map(escapeCsvField).join(DELIMITER) + "\n";
}

const appendCsv = async (filePath, payload) => {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });

  const fileExists = fs.existsSync(filePath) && fs.statSync(filePath).size > 0;

  const lines = [];
  if (!fileExists) {
    lines.push(rowToLine(FIELD_NAMES));
  }
  lines.push(rowToLine(FIELD_NAMES.map(key => payload[key])));

  fs.appendFileSync(filePath, lines.join(""), "utf-8");
  console.log(`Appended submission to ${filePath}`);
}

const appendDataToFile = async (filePath, exportFormat, payload) => {
  if (exportFormat === "csv") {
    await appendCsv(filePath, payload);
  }
}

module.exports = { appendDataToFile };