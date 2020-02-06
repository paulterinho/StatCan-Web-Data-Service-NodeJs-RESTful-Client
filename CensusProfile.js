// REST API documentation :
//   https://www12.statcan.gc.ca/wds-sdw/cpr2016-eng.cfm
const GET  = require('request');
const fs   = require('fs');

const root  = 'https://www12.statcan.gc.ca/rest/census-recensement/CPR2016.json?';
const lang  = 'lang=E&'; 
const geo   = ''// 'dguid=2016A000011124&'; //see constructTheUrl for CSV -> dguid
const topic = 'topic=13&';
const notes = 'notes=0';

// grab the file GEO.csv that geo.js created.
const CSV = fs.readFileSync('./GEO.csv');
/*
  convert CSV file to string, and string to array (split the string on new line)
  the symbol   \n   is a new line character.
  a CSV file is split in columns with "," and rows with "\n".
  our geoCSV string will be one column with many rows so
  we can ignore the "," since GEO.csv has only one column.
*/
const g = array_we_got_from_our_first_request;

let areWeThereYet = false;

let accString = ""; //accumulate responses in one long string
let urls      = []; // my list of requests to make (http GET)
let counter   = 0;
let gLength   = array_we_got_from_our_first_request.length;
// put each dguid into the urls[] array. 
for (i = 0; i < gLength; i++) {
  urls[i] = constructTheUrl(i);
}

// make a request for each url and store response in accString
for (i = 0; i < gLength; i++) {
  outputTheResult(urls[i]);
}

function constructTheUrl(i) {
  let url = root + lang + "dguid=" + geoCSV[i] + "&" + topic + notes;
  return url;
}

function outputTheResult(url) {
  GET(url, responseHandler);

  function responseHandler(error, response, body) {
    let trimMsg = body.slice(2); //remove first two characters
    let obj     = JSON.parse(trimMsg);//string to JS object
    let geoName = obj.DATA[0][4];
    let geoID   = obj.DATA[0][2];
    let density = obj.DATA[5][13];
    let landArea = obj.DATA[6][13];
    let fetchedData = [geoName, geoID, density, landArea];
    
    accString += fetchedData.join() + "\n";
    
    if (counter === gLength -1){
      areWeThereYet = true;
    } else {
      counter = counter + 1
    }
    if (areWeThereYet) {
      output(accString);
    }
  }

  function output(_this) {
    fs.writeFile("/mnt/c/Users/USER/Desktop/GET.csv", _this, function(err) {
      if (err) {
        return console.log("look at this error: " + err);
      } else {
        return console.log("Looks like it worked...");
      }
    });
  }
}
