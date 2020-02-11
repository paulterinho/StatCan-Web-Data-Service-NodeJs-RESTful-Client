"use strict";                                                              // 80
// REST API documentation:
// https://www12.statcan.gc.ca/wds-sdw/cr2016geo-eng.cfm
const https = require('https'),
         fs = require('fs'), // file system
       host = 'https://www12.statcan.gc.ca/', 
       path = 'rest/census-recensement/CR2016Geo.json?',
       lang = 'lang=E&', geo = 'geos=CSD&', cpt = 'cpt=00',
        url = host + path + lang + geo + cpt;
       // cpt=24 === Québec
      // geos=CSD === Census Subdivisions

(async function() {
  await makeRequestByPromise();
})();

async function makeRequestByPromise() {
  try {
    let http_promise = getPromise();
    let response_body = await http_promise;
    console.log("This many geographies: " + response_body.length);
    output(response_body.join("")); // pass string to output
  } catch(error) {
    console.log("Looks like an error... :" + error);
  }
  function output(_this) {
    let s = "./GEO.csv";
    fs.writeFile(s, _this, function(err) {
      err ? console.log("Look! " + err) : console.log("File written as " + s);
    });
  }
}

function getPromise() {
  return new Promise((resolve, reject) => {
  // ***
    https.get(url, (response) => {
      let chunks_of_data = [];
      response.on('data', (fragments) => {
        chunks_of_data.push(fragments);
      });
      response.on('end', () => {
        let response_body = Buffer.concat(chunks_of_data);
        // pass string to response handler
        let x = responseHandler(response_body.toString());
        resolve(x);
      });
      response.on('error', (error) => {
        reject(error);
      });
    });
  // ***  
  });
}

function responseHandler(res) {
  let trimMsg = res.slice(2), // remove first two characters of string
            p = JSON.parse(trimMsg), // transform string into JS object
         list = [],
      pLength = p.DATA.length - 1;

  for (let i = 0; i <= pLength; i += 1){
    let pd = p.DATA[i][0];
    i !== pLength ? list[i] = pd + "\n" : list[i] = pd;
  }
  return list; // return an array
}
