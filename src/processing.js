const fs = require("fs");
const path = require("path");
const fse = require("fs-extra");
const marked = require("marked");
const walk = require("walkdir");
const p = require("path");

// create a function that reads a file and returns the contents
const readFile = (filePath) => fs.readFileSync(filePath, "utf8");

const FORMAT_HTML = readFile("./src/layout/format.html");
const SECTION_FORMAT_HTML = readFile("./src/layout/section_format.html");

const TOP_DIR_ENTRY = '<a href="{URL}"class="box"><h3>';
const MIDDLE_SECTION_ENTRY = "</h3>";
const FOLDER_SVG_SECTION =
  '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" class="svgicon" x="0px" y="0px" viewBox="0 0 298.757 298.757" style="enable-background:new 0 0 298.757 298.757;" xml:space="preserve"><path d="M291.701,119.091h-39.95v-29.61c0-3.893-3.156-7.05-7.05-7.05h-95.549l-16.896-35.955    c-1.162-2.472-3.648-4.051-6.381-4.051H7.05c-3.893,0-7.05,3.157-7.05,7.05v199.806c0,3.846,3.135,7.051,7.054,7.051    c0.004,0,0.008-0.001,0.012-0.001h237.635c2.923,0,5.543-1.805,6.587-4.536l47-123.14    C300.048,124.044,296.635,119.091,291.701,119.091z M14.1,56.526h107.299l16.896,35.955c1.162,2.472,3.648,4.051,6.381,4.051    h92.975v22.56H54.05c-2.923,0-5.544,1.805-6.587,4.536L14.1,211.04V56.526z M239.846,242.231H17.287l41.618-109.04    c10.158,0,212.404,0,222.559,0L239.846,242.231z"/>';
const DOCUMENT_SVG_SECTION =
  '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" class="svgicon" x="0px" y="0px" viewBox="0 0 293.151 293.151" style="enable-background:new 0 0 293.151 293.151;" xml:space="preserve"><path d="M255.316,55.996l-51.928-52.94C201.471,1.102,198.842,0,196.104,0h-82.302h-8.232H45.113    c-5.631,0-10.197,4.566-10.197,10.192c0,5.626,4.566,10.192,10.197,10.192h60.457h8.232h72.11l0.005,44.231    c0,5.631,4.561,10.197,10.192,10.197h41.731v197.955H56.592V47.828c0-5.631-4.566-10.197-10.197-10.197    c-5.631,0-10.192,4.566-10.192,10.197v235.131c0,5.631,4.566,10.192,10.192,10.192h201.642c5.631,0,10.197-4.566,10.197-10.192    V63.137C258.229,60.467,257.185,57.903,255.316,55.996z M206.307,54.423V35.147l18.906,19.276H206.307z"/>';
const BOTTOM_DIR_ENTRY = "</a>";

const TOC_LIST_START = '<li><a class="" href="/Tutorials/';
const TOC_LIST_MID = '">';
const TOC_LIST_END = "</a></li>";

const deployPath = "./deploy";

async function process() {
  console.log("Processing files...");

  // check if deploy folder exists
  if (fs.existsSync(deployPath)) {
    try {
      fs.rmSync(deployPath, { recursive: true }, () => {});
    } catch (err) {
      console.log("Error deleting ./deploy folder");
    }
  }

  // make new directory at ./deploy
  fs.mkdirSync(deployPath);
  console.log("created ./deploy folder");

  // readdirsync from ./layout
  const layoutFiles = fs.readdirSync("./src/layout");

  // iterate through layout files
  layoutFiles.forEach((layoutFile) => {
    // if the file name is not format.html and the file name is not section_format.html
    if (
      !layoutFile.includes("format.html") &&
      !layoutFile.includes("section_format.html") &&
      fs.existsSync("./src/layout/" + layoutFile) &&
      !fs.lstatSync("./src/layout/" + layoutFile).isDirectory()
    ) {
      // if the file is named index.html
      if (layoutFile.includes("index.html"))
        try {
          fs.copyFileSync(
            `./src/layout/${layoutFile}`,
            `./deploy/${layoutFile}`
          );
        } catch (e) {
          console.log("Failed copying HTML file over");
        }
      else {
        // for each file in layoutFiles, create a new folder in deploy
        let dir = `./deploy/${layoutFile.replace(".html", "")}`;
        fs.mkdirSync(dir);
        // copy the file over
        fs.copyFileSync(
          `./src/layout/${layoutFile}`,
          path.join(dir, "index.html")
        );
      }
    }
  });

  // recursively clone the files in ./layout/static to ./deploy/static
  fse.copySync(
    `./src/layout/static`,
    `./deploy/static`,
    { overwrite: true },
    (err) => {
      if (err) console.log("Failed copying static!");
    }
  );

  // read ./site/pages/Featured.csv as a string
  const featuredCSV = fs.readFileSync("./src/site/pages/Featured.csv", "utf8");

  // split the csv in an array
  const featuredCSVArray = featuredCSV.split(",");

  let urls = [];

  // get all md files in ./site/pages
  const files = getAllMdFiles("./src/site/pages");

  for (entry of files) {
    urls.push(handle_md(entry, featuredCSVArray));
  }

  // let skippedDirectories = []
  // async function walkFunc(err, pathname, dirent) {
  //     let checkFileExists = (s) => new Promise((r) => fs.access(s, fs.constants.F_OK, (e) => r(!e)));
  //     // don't descend into sus directories
  //     directorySkipped = false;
  //     skippedDirectories.forEach((dir) => {
  //         if (pathname.includes(dir)) {
  //             directorySkipped = true;
  //         }
  //     })
  //     if (directorySkipped) {
  //         console.log("Directory was previously sus!")
  //         return false
  //     }

  //     if (!(dirent.isDirectory() && checkFileExists(pathname + "/index.html"))) {
  //         skippedDirectories.push(pathname)
  //         return false;
  //     }
  //     let p = pathname.replace("deploy", "")
  //     let ret = "";
  //     let paths = fs.readdirSync(pathname)
  //     for (let path of paths) {
  //         if (checkFileExists(pathname + path + "/index.html")) {
  //             console.log('Skipped!')
  //             continue
  //             // ret += DOCUMENT_SVG_SECTION
  //         }
  //         let name = path.split("/").pop();
  //         ret += TOP_DIR_ENTRY
  //         ret += name
  //         ret += MIDDLE_SECTION_ENTRY
  //         ret += FOLDER_SVG_SECTION

  //         ret = ret.replace("{URL}", path.split("/").pop())
  //         ret += BOTTOM_DIR_ENTRY
  //     }

  //     let output = SECTION_FORMAT_HTML
  //     output = output.replace("{CONTENT}", ret)
  //     // replace {PAGE_NAME} with the name of the directory
  //     output = output.replace("{PAGE_NAME}", pathname.split("/").pop())
  //     output = output.replace("{TITLE}", pathname.split("/").pop())
  //     urls.push(pathname)

  //     fs.writeFileSync(pathname + "/index.html", output)

  // }

  // walk.walk(deployPath + "/Tutorials", walkFunc);

  //await Walk.walk("./deploy/Tutorials", walkFunc);

  walk("./deploy/Tutorials", function (path, stat) {
    if (!stat.isDirectory() || !path.endsWith("index.html")) {
      return;
    }

    let ret;
    let p = path.replace("deploy", "");
    console.log(p);

    let paths = fs.readdirSync(path);
    if (stat.isDirectory())
      for (path in paths) {
        let name = path.split("/").pop();

        ret += TOP_DIR_ENTRY;
        ret += name;
        ret += MIDDLE_SECTION_ENTRY;
        ret += FOLDER_SVG_SECTION;

        if (path.endsWith("index.html")) ret += DOCUMENT_SVG_SECTION;
        else ret += FOLDER_SVG_SECTION;

        ret = ret.replace("{URL}", path.split("/").pop());
        ret += BOTTOM_DIR_ENTRY;
      }
    changeOutput();
  });

  function changeOutput() {
    let output = SECTION_FORMAT_HTML;
    output = output.replace("{CONTENT}", ret);
    output = output.replace("{PAGE_NAME}", pathname.split("/").pop());
    output = output.replace("{TITLE}", pathname.split("/").pop());
    urls.push(path);

    fs.writeFileSync(pathname + "/index.html", output);
  }

  generate_sitemap(urls);
  console.log("Deploy directory successfully created!");
}
function handle_md(path, featured) {
  // read the file
  const file = fs.readFileSync(path, "utf8");

  nameOfFile = path.split("pages/").pop();

  let html = marked.parse(file);

  let output = FORMAT_HTML;
  output = output.replace("{PAGE_NAME}", "");
  output = output.replace("{CONTENT}", html);
  let toc = "";

  featured.forEach((f) => {
    toc += TOC_LIST_START + f + TOC_LIST_MID + f + TOC_LIST_END;
  });

  output = output.replace("{TOC}", toc);

  let file_name = path.split("pages/").pop();

  file_name = file_name.replace(".md", "");
  let path_url = ["Tutorials/", file_name].join("");
  file_name += ".html";
  file_name = ["deploy/Tutorials/", file_name].join("");

  // get directory name and do
  let directories = file_name.replace(".html", "");
  fs.mkdirSync("./" + directories, { recursive: true });

  // write a file
  fs.writeFileSync("./" + directories + "/index.html", output);

  return path_url;
}
const getAllMdFiles = function (dirPath, arrayOfFiles) {
  const files = fs.readdirSync(dirPath);

  arrayOfFiles = arrayOfFiles || [];

  files.forEach((file) => {
    if (fs.statSync(dirPath + "/" + file).isDirectory()) {
      // Very suspicious code
      arrayOfFiles = getAllMdFiles(dirPath + "/" + file, arrayOfFiles);
    } else if (file.endsWith(".md")) {
      arrayOfFiles.push(path.join(dirPath, "/", file));
    }
  });

  return arrayOfFiles;
};

function generate_sitemap(urls) {
  // For the header
  let sitemap =
    '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">';
  urls.forEach((url) => {
    sitemap += "<url><loc>https://learn.texastorque.org/";
    sitemap += url;
    sitemap += "</loc></url>";
  });

  // For the end
  sitemap += "</urlset>";
  fs.writeFileSync("./deploy/sitemap.xml", sitemap);
}

process();
