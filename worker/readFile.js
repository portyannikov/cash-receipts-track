const fs = require("fs/promises");

const readFile = async (filePath) => {
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

module.exports = readFile;