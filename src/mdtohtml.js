const showdown = require("showdown");
const fs = require("fs");

const converter = new showdown.Converter();

function convertToHTML(pathToMD, pathForHTML) {
  let convertedHTML = converter.makeHtml(
    fs.readFileSync(pathToMD, { encoding: "utf8" })
  );

  fs.writeFile(pathForHTML, convertedHTML, (err) => {
    if (err) {
      console.error(err);
      return;
    }
    //file written successfully
  });
}
