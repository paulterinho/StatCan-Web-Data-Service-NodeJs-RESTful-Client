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
let req = https.request(options, (res) => {
	let chunks_of_data = [];
	res.on('data', (fragments) => {
		chunks_of_data.push(fragments);
	});
	res.on('end', () => {
		let response_body = Buffer.concat(chunks_of_data);
		console.log(JSON.parse(response_body.toString()));
	});
});
req.on('error', error => {
	console.log(error);
});
req.write(data);
req.end();
