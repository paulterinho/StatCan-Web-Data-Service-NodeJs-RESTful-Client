"use strict";                                                              // 80
// REST API documentation :
// https://www12.statcan.gc.ca/wds-sdw/cpr2016-eng.cfm
const   CTP = 48, // Alberta
        https = require('https'),
         fs = require('fs'), // file system
				 rl = require('readline'),
       host = 'https://www12.statcan.gc.ca/',
       path = 'rest/census-recensement/CPR2016.json?',
       lang = 'lang=E&', geo = 'geos=CT&', topic = 'topic=13&', notes = 'notes=0&', ctp = "ctp=" +CTP,
        CSV = fs.readFileSync('./GEO.csv'),
     geoCSV = CSV.toString().split("\n"), //this is an array[]
    gLength = geoCSV.length;

let pb = {
	"size": gLength,
	"cursor": 0,
	"timer": null,
	"start": function () {
		process.stdout.write("\x1B[?25l")
		rl.cursorTo(process.stdout, this.cursor, 0);
	},
	"increment": function () {		
			process.stdout.write("\u2588");
			this.cursor += 1;
			if (this.cursor >= this.size) {
				console.log("done!");
			}
		}
}

console.log("Fetching data for " + gLength + " geographic units");

pb.start(gLength);

let accString = "", // accumulate responses in one long string
			headers = "Name,ID,Density,Land Area\n",
         urls = []; // my list of requests to make (http GET)

(function makeUrlsArray() {
  // put each dguid into the urls[] array. 
  for (let i = 0; i < gLength; i += 1) {
    urls[i] = constructTheUrl(i);
  }
  // make a request for each url and store response in accString
  function constructTheUrl(i) {
    let url = host + path + lang + "dguid=" + geoCSV[i] + "&" + topic + notes;
    return url;
  }
})();

(async function() {
  console.log("started...");
  await makeRequestByPromise();
  console.log("finished!");
	accString = headers + accString;
	output(accString);
	function output(_this) {
		let s = "./GET.csv";
		fs.writeFile(s, _this, function(err) {
			err ? console.log("Look! " + err) : console.log("File written as " + s);
		});
	}
})();

async function makeRequestByPromise() {
  try {
    for (let i = 0; i < gLength; i += 1) {
      let url = urls[i];
      let http_promise = getPromise(url);
      let response_body = await http_promise;
      console.log(".");
			pb.increment();
    }
  } catch(error) {
    console.log(error);
  }
}

function getPromise(url) {
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
	function responseHandler(res) {

    try {
      let obj = JSON.parse(res), // string to JS object
				  geoName = '\"' + obj.DATA[0][4] + '\"',
					geoID = obj.DATA[0][2],
				  density = obj.DATA[5][13],
			    landArea = obj.DATA[6][13],
		      fetchedData = [geoName, geoID, density, landArea];
		
		  accString += fetchedData.join() + "\n";

    } catch(error) {
      console.log(error);
    }
	}
}

