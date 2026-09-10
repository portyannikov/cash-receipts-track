const fs = require("fs");
const path = require("path");
const { FIELD_NAMES } = require("./config");

const ensureXlsxExists = async (filePath) => {
  const ExcelJS = require("exceljs");

  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  if (fs.existsSync(filePath)) return;

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("submissions");
  worksheet.addRow(FIELD_NAMES);
  await workbook.xlsx.writeFile(filePath);
  console.log(`Created empty file with header at ${filePath}`);
};

const ensureFileExists = async (filePath, exportFormat) => {
  if (exportFormat === "xlsx") {
    await ensureXlsxExists(filePath);
  }
};

module.exports = ensureFileExists;