const fs = require("fs");
const pdfParseLib = require("pdf-parse");

const pdfParse = pdfParseLib.default || pdfParseLib;

console.log("TYPE:", typeof pdfParse);
console.log("KEYS:", Object.keys(pdfParse));
console.log("VALUE:", pdfParse);

const parseResume = async (filePath) => {
    try {
        console.log("Parsing file:", filePath);

        const dataBuffer = fs.readFileSync(filePath);
        const data = await pdfParse(dataBuffer);

        console.log("PARSED TEXT LENGTH:", data.text.length);
        console.log("SAMPLE TEXT:", data.text.slice(0, 200));

        return data.text;
    } catch (err) {
        console.error("PDF parsing error:", err);
        throw err;
    }
};

module.exports = parseResume;