"use strict";                                                              // 80
// REST API documentation :
// https://www12.statcan.gc.ca/wds-sdw/cpr2016-eng.cfm
const CTP = 48, // Alberta
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

(async function () {
    function output(_this, fileName) {
        let s = fileName;
        fs.writeFile(s, _this, function (err) {
            err ? console.log("Look! " + err) : console.log("File written as " + s);
        });
    }

    console.log("started..." + new Date().getTime() / 1000);
    await makeRequestByPromise();
    console.log("finished!" + new Date().getTime() / 1000);
    accString = headers + accString;
    output(accString,  "./GET.csv");
    output(failedUrls.join("\n"),  "./Errors.csv");
    
})();

async function makeRequestByPromise() {
    
    let promises =[];

    try {
        for (let i = 0; i < gLength; i += 1) {
            let url = urls[i],
                idToReportLaterIfErr = geoCSV[i];
            promises.push(getPromise(url, idToReportLaterIfErr));
            
            /*let http_promise = getPromise(url);
            let response_body = await http_promise;
            console.log(".");
            pb.increment();
            */
        }

        await Promise.all(promises)
            .then(function(){
                console.log('all calls have finished');
            }).catch(()=>{
                console.log("error");
            });

    } catch (error) {
        console.error(error);
    }
}

function getPromise(url, idToReportLaterIfErr) {

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
        
        let obj, geoName, geoID, density, landArea, fetchedData;

        try {

            obj = JSON.parse(res); // string to JS object
            geoName = '\"' + obj.DATA[0][4] + '\"';
            geoID = obj.DATA[0][2];
            density = obj.DATA[5][13];
            landArea = obj.DATA[6][13];
            fetchedData = [geoName, geoID, density, landArea];

            accString += fetchedData.join() + "\n";

            console.log("received: " +geoID);

        } catch (error) {
            failedUrls.push(idToReportLaterIfErr);
            console.log(res)
            console.error(error);
        }
    }
}

