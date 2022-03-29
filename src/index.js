const showdown = require("showdown");
const fs = require("fs");

const converter = new showdown.Converter();

let bruh = fs.readFileSync("./examplemd.md", { encoding: "utf8" });

let bruh2 = converter.makeHtml(bruh);

fs.writeFile("index.html", bruh2, (err) => {
  if (err) {
    console.error(err);
    return;
  }
  //file written successfully
});
