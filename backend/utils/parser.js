const fs = require("fs");
const pdfParseLib = require("pdf-parse");

const pdfParse = pdfParseLib.default || pdfParseLib;

const parseResume = async (filePath) => {
  const dataBuffer = fs.readFileSync(filePath);
  const data = await pdfParse(dataBuffer);
  return data.text;
};

module.exports = parseResume;
