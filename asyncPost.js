"use strict";
const https = require('https'),
				url = '/t1/wds/rest/getSeriesInfoFromVector',
					v = '1',
			 data =  '[{\"vectorId\":' + v + '}]',
		options = {
			hostname: 'www150.statcan.gc.ca',
			port: 443,
			path: url,
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Content-Length': data.length
			}
		};
function getPromise() {
	return new Promise((resolve, reject) => {
		let req = https.request(options, (res) => {
			let chunks_of_data = [];
			res.on('data', (fragments) => {
				chunks_of_data.push(fragments);
			});
			res.on('end', () => {
				let response_body = Buffer.concat(chunks_of_data);
				resolve(
					JSON.parse(
						response_body.toString()
					)
				);
			});
			res.on('error', (error) => {
				reject(error);
			});
		});
		req.on('error', (error) => {
			console.log(error);
		});
		req.write(data);
		req.end();
	});
}
async function makeRequest() {
	try {
		console.clear();
		let http_promise = getPromise();
		let response_body = await http_promise;
		// here goes some extra processing if we want
		console.log(response_body);
	}
	catch(error) {
		console.log(error);
	}
}
(async function () {
	await makeRequest();
	console.log("finished!");
})();
