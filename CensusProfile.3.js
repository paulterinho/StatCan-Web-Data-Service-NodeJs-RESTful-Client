"use strict";                                                              // 80
// REST API documentation :
// https://www12.statcan.gc.ca/wds-sdw/cpr2016-eng.cfm
const _ = require('lodash'),
    Promises = require('es6-promise').Promises,
    
    BATCH_SIZE = 10, 
    CTP = 48, // Alberta
    https = require('https'),
    fs = require('fs'), // file system
    rl = require('readline'),
    host = 'https://www12.statcan.gc.ca/',
    path = 'rest/census-recensement/CPR2016.json?',
    lang = 'lang=E&', geo = 'geos=CT&', topic = 'topic=13&', notes = 'notes=0&', ctp = "ctp=" + CTP,
    CSV = fs.readFileSync('./GEO.csv'),
    geoCSV = CSV.toString().split("\n"); //this is an array[]

let accString = "", // accumulate responses in one long string
    headers = "Name,ID,Density,Land Area\n",
    urls = [], // my list of requests to make (http GET)
    gLength = geoCSV.length,
    failedUrls = [];

/**
 * Batch an array of promises so we don't overwhealm the server. 
 * 
 * Check out the constant `BATCH_SIZE` for how big we are making our batches. 
 * 
 * @param {*} queries
 * @see https://stackoverflow.com/questions/53964228/how-do-i-perform-a-large-batch-of-promises 
 * @returns 
 */
async function runAllQueries(queries) {
    const batches = _.chunk(queries, BATCH_SIZE);
    const results = [];
    while (batches.length) {
        const batch = batches.shift();
        const result = await Promises.all(batch.map(runQuery));
        results.push(result)
    }
    return _.flatten(results);
}

function makeUrlsArray() {
    // put each dguid into the urls[] array. 
    for (let i = 0; i < gLength; i += 1) {
        urls[i] = constructTheUrl(i);
    }
    // make a request for each url and store response in accString
    function constructTheUrl(i) {
        let url = host + path + lang + "dguid=" + geoCSV[i] + "&" + topic + notes;
        return url;
    }
}

async function makeRequestByPromise() {

    let promises = [];

    try {
        for (let i = 0; i < gLength; i += 1) {
            let url = urls[i];
            promises.push(getPromise(url));
        }

        // Send requests all at once (instead of serially)
        /*await Promise.all(promises)
            .then(function () {
                console.log('all calls have finished');
            });
        */
        await runAllQueries(promises)
            .then(function () {
                console.log('all calls have finished');
            });

    } catch (error) {
        console.error(error);
    }
}



function getPromise(url) {

    /*return new Promise((resolve, reject) => {
        // ***  
        https.get(url, (response) => {
            let chunks_of_data = [];
            response.on('data', (fragments) => {
                chunks_of_data.push(fragments);
            });
            response.on('end', () => {
                let response_body = Buffer.concat(chunks_of_data);
                // pass string to response handler
                let x = responseHandler(response_body.toString(), url);
                resolve(x);
            });
            response.on('error', (error) => {
                reject(error);
            });
        });
        // ***  
    });*/

    /**
     * 
     * @see https://gist.github.com/briancavalier/842626/c0eb8816486a95d907ca1cd754c9f6e17f68d589
     * @param {*} fn 
     * @param {*} retriesLeft 
     * @param {*} interval 
     * @returns 
     */
    function retry(fn, retriesLeft = 5, interval = 1000) {
        return new Promise((resolve, reject) => {
            fn()
                .then(resolve)
                .catch((error) => {
                    setTimeout(() => {
                        if (retriesLeft === 1) {
                            // reject('maximum retries exceeded');
                            reject(error);
                            return;
                        }

                        // Passing on "reject" is the important part
                        retry(fn, interval, retriesLeft - 1).then(resolve, reject);
                    }, interval);
                });
        });
    }

    /**
     * Response handler for the Promise
     * @param {string} res The server response string. We'll parse this for proper JSON.
     * @param {string} url Used for error logging: we'll want to know which URLs failed so we can compare. 
     */
    function responseHandler(res, url) {

        let obj, geoName, geoID, density, landArea, fetchedData;

        try {

            obj = JSON.parse(res); // string to JS object
            geoName = '\"' + obj.DATA[0][4] + '\"';
            geoID = obj.DATA[0][2];
            density = obj.DATA[5][13];
            landArea = obj.DATA[6][13];
            fetchedData = [geoName, geoID, density, landArea];

            accString += fetchedData.join() + "\n";

            console.log("received: " + geoID + ", " + new Date().getTime() / 1000);
            gLength--;
            console.log("To go: " + gLength);
        } catch (error) {
            failedUrls.push(url);
            console.error("failed url: " + url)
            console.log(res)
            console.log(error);
        }
    }

    return retry((resolve, reject) => {
        // ***  
        https.get(url, (response) => {
            let chunks_of_data = [];
            response.on('data', (fragments) => {
                chunks_of_data.push(fragments);
            });
            response.on('end', () => {
                let response_body = Buffer.concat(chunks_of_data);
                // pass string to response handler
                let x = responseHandler(response_body.toString(), url);
                resolve(x);
            });
            response.on('error', (error) => {
                reject(error);
            });
        });
        // ***  
    })
}

function output(_this) {
    let s = "./GET.csv";
    fs.writeFile(s, _this, function (err) {
        err ? console.log("Look! " + err) : console.log("File written as " + s);
    });
}


console.log("started..." + new Date().getTime() / 1000);
makeUrlsArray()
console.log("Fetching data for " + gLength + " geographic units");
makeRequestByPromise()
    .then(() => {
        console.log("finished!" + new Date().getTime() / 1000);
        accString = headers + accString;
        output(accString);
    }).finally(() => {
        console.log("Failed URLS:" + failedUrls.join(",\n"));
    });


// return promise:
// https://stackoverflow.com/questions/38213668/promise-retry-design-patterns

