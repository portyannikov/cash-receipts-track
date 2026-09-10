const fs = require("fs");
const path = require("path");
const ExcelJS = require("exceljs");
const { FIELD_NAMES } = require("./config");

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

const appendXlsx = async (filePath, payload) => {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });

  const workbook = new ExcelJS.Workbook();
  let worksheet;

  if (fs.existsSync(filePath)) {
    await workbook.xlsx.readFile(filePath);
    worksheet = workbook.worksheets[0];
  } else {
    worksheet = workbook.addWorksheet("submissions");
    worksheet.addRow(FIELD_NAMES);
  }

  worksheet.addRow(FIELD_NAMES.map((key) => payload[key] ?? ""));
  await workbook.xlsx.writeFile(filePath);

  console.log(`Appended submission to ${filePath}`);
}

const appendDataToFile = async (filePath, exportFormat, payload) => {
  if (exportFormat === "xlsx") {
    await appendXlsx(filePath, payload);
  } else if (exportFormat === "csv") {
    await appendCsv(filePath, payload);
  } else {
    console.error(`Unknown exportFormat "${exportFormat}", submission NOT saved`);
  }
}

module.exports = { appendDataToFile };