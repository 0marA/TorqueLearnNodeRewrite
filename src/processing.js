const fs = require("fs");

const deployPath = "../src/deploy";

function process() {
  console.log("Processing files...");

  // If the deploy path exists, remove it
  if (fs.existsSync(deployPath)) removeDirectory(deployPath);

  // Make a new deploy directory
  fs.mkdir("../src/deploy", (err) => {
    if (err) {
      throw err;
    }
  });

  // Get length of all the files in the directory
  fs.readdir("../src", (err, files) => {
    console.log(files.length);
  });
}

function removeDirectory(path) {
  fs.rmdir(deployPath, (err) => {
    if (err) {
      throw err;
    }
  });
}

process();
