// REST API documentation :
// https://www12.statcan.gc.ca/wds-sdw/cpr2016-eng.cfm
const https = require('https'),
				 fs = require('fs'),
			 host = 'https://www12.statcan.gc.ca/',
			 path = 'rest/census-recensement/CPR2016.json?',
			 lang = 'lang=E&', geo = '', topic = 'topic=13&', notes = 'notes=0';
			 // 'dguid=2016A000011124&'; //see constructTheUrl for CSV -> dguid

/*
	convert CSV file to string, and string to array (split the string on new line)
	the symbol   \n   is a new line character.
	a CSV file is split in columns with "," and rows with "\n".
	our geoCSV string will be one column with many rows so
	we can ignore the "," since GEO.csv has only one column.
*/
let CSV = fs.readFileSync('./GEO.csv');
let geoCSV = CSV.toString().split("\n"); //this is an array[]
console.log(geoCSV);
let url;
let areWeThereYet = false;

let accString = ""; //accumulate responses in one long string
let urls      = []; // my list of requests to make (http GET)
let counter   = 0;
let gLength   = geoCSV.length;
// put each dguid into the urls[] array. 
for (i = 0; i < gLength; i++) {
  urls[i] = constructTheUrl(i);
}

// make a request for each url and store response in accString

function constructTheUrl(i) {
  let url = host + path + lang + "dguid=" + geoCSV[i] + "&" + topic + notes;
  return url;
}

(async function() {
	await makeRequestByPromise();
})();
async function makeRequestByPromise() {
	try {
		for (i = 0; i < gLength; i++) {
			url = urls[i];
			let http_promise = getPromise();
			let response_body = await http_promise;
		}
	} catch(error) {
		console.log(error);
	}
}
function getPromise() {
	return new Promise((resolve, reject) => {
		https.get(url, (response) => {
			let chunks_of_data = [];
			response.on('data', (fragments) => {
				chunks_of_data.push(fragments);
			});
			response.on('end', () => {
				let response_body = Buffer.concat(chunks_of_data);
				let x = responseHandler(response_body.toString());
				resolve(x);
			});
			response.on('error', (error) => {
				reject(error);
			});
		});
	});
}
function responseHandler(res) {
	let trimMsg = res.slice(2); //remove first two characters
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
	fs.writeFile("./GET.csv", _this, function(err) {
		if (err) {
			return console.log("look at this error: " + err);
		} else {
			return console.log("Looks like it worked...");
		}
	});
}
