const https = require('https');
// should split into host + path
const root =
'https://www12.statcan.gc.ca/rest/census-recensement/CR2016Geo.json?';
const lang = 'lang=E&'; 
const geo  = 'geos=CSD&';// All Census Subdivisions (csd), 
const cpt  = 'cpt=00';     // 24 = Québec

const url = root + lang + geo + cpt;

(async function() {
	await makeRequestByPromise();
})();
async function makeRequestByPromise() {
	try {
		let http_promise = getPromise();
		let response_body = await http_promise;
		console.log(response_body.length);
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
	let trimMsg = res.slice(2);//remove first two characters
	let p = JSON.parse(trimMsg);//transform string into JS object
	//console.log(p.DATA[0][0]);
	let list = [];
	let pLength = p.DATA.length;
	for (let i = 0; i < pLength; i++){
		if (i !== pLength - 1){
			list[i] = p.DATA[i][0] + "\n"; //grab dguid only
		} else {
			list[i] = p.DATA[i][0];
		}
	}
	return list;
}
