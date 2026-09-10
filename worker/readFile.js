const fs = require("fs/promises");
const ExcelJS = require("exceljs");

const readCsv = async (filePath) => {
  const content = await fs.readFile(filePath, "utf-8");

  const lines = content
    .split(/\r?\n/)
    .filter(Boolean);

  if (!lines.length) {
    return [];
  }

  const headers = lines[0].split(";");

  return lines
    .slice(1)
    .map((line) => {
      const values = line.split(";");

      return headers.reduce((result, header, index) => {
        result[header] = values[index] || "";
        return result;
      }, {});
    });
};

const readXlsx = async (filePath) => {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);
  const worksheet = workbook.worksheets[0];
  if (!worksheet) return [];

  const headers = worksheet.getRow(1).values.slice(1);
  const rows = [];

  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;
    const values = row.values.slice(1);
    rows.push(
      headers.reduce((result, header, index) => {
        result[header] = values[index] ?? "";
        return result;
      }, {})
    );
  });

  return rows;
};

const readFile = async (filePath, exportFormat) => {
  return exportFormat === "xlsx" ? readXlsx(filePath) : readCsv(filePath);
};

module.exports = readFile;