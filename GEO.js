"use strict";                                                              // 80
// REST API documentation:
// https://www12.statcan.gc.ca/wds-sdw/cr2016geo-eng.cfm
const https = require('https'),
         fs = require('fs'), // file system
       host = 'https://www12.statcan.gc.ca/', 
       path = 'rest/census-recensement/CR2016Geo.json?',
       lang = 'lang=E&', geo = 'geos=CT&', cpt = 'cpt=48&', topic="topic=0",
        url = host + path + lang + geo + cpt + topic;
       // cpt=48 === Alberta
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

  
  let trimMsg, // remove first two characters of string
      stripped,
      p, // transform string into JS object
      list,
      pLength,
      colNames;

 
      try{
          
          //trimMsg = res.slice(2); // remove first two characters of string
          p = JSON.parse(res); // transform string into JS object
          colNames = p.COLUMNS.join(",") + "\n"

          list = [colNames];
          pLength = p.DATA.length - 1;


          // for each element in the row
          for (let i = 1; i <= pLength; i += 1){
              

            let rowData = p.DATA[i],
                
            // Hardcode this becaue it's more performant than iterating
            pd = rowData[0] + "," + rowData[1] + "," + rowData[2]+ "," + rowData[3]+ "," + rowData[4]+ "," + 
                      rowData[5]+ "," + rowData[6]+ "," + rowData[7]+ "," + rowData[8];

             
            i !== pLength ? list[i] = pd + "\n" : list[i] = pd;
          }

      }catch(exp){
        console.error(exp)
      }
  
  return list; // return an array
}
