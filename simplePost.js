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
let req = https.request(options, res => {
	res.on('data', d => {
		//returns true if successfull
		let x = process.stdout.write(d);
	});
});
req.on('error', error => {
	console.log(error);
});
req.write(data);
req.end();
