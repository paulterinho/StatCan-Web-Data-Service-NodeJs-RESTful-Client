"use strict";                                                              // 80
// REST API documentation :
// https://www12.statcan.gc.ca/wds-sdw/cpr2016-eng.cfm
const
    GET_FILE = "./GET.csv",
    GEO_ID_FILE = './GEO.csv',
    CTP = 48, // Alberta
    https = require('https'),
    fs = require('fs'), // file system
    rl = require('readline'),
    host = 'https://www12.statcan.gc.ca/',
    path = 'rest/census-recensement/CPR2016.json?',
    lang = 'lang=E&', geo = 'geos=CT&', topic = '', notes = 'notes=0&', ctp = "ctp=" + CTP,
    CSV = fs.readFileSync(GEO_ID_FILE),
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

function output(_this, fileName, overwrite = true) {
    let s = fileName;

    if (overwrite == true) {
        fs.writeFile(s, _this, function (err) {
            err ? console.log("Look! " + err) : console.log("File written as " + s);
        });
    } else {
        fs.appendFile(s, _this, function (err) {
            if (err) throw err;
            console.log('File appended to');
        });
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

    console.log("started..." + new Date().getTime() / 1000);
    await makeRequestByPromise();
    console.log("finished!" + new Date().getTime() / 1000);
    //accString = headers + accString;

    fs.rename(GEO_ID_FILE, "BACKUP.csv", function (err) {

        if (err) throw err;
        console.log('File Renamed!');
    });

    output(accString, GET_FILE, false);
    output(failedUrls.join("\n"), GEO_ID_FILE, true);

    console.warn("Add header row to CSV: " + headers)
})();

async function makeRequestByPromise() {

    let promises = [];

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
            .then(function () {
                console.log('all calls have finished');
            }).catch(() => {
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


            /*      
                [0..99]
                0:(19) ['48', 'Alberta', '2016S05078050003.01', '8050003.01', '0003.01', null, 'Population', 1000, '1.1.1', 0, 'Population, 2016', 1, null, 3977, null, null, '...', null, '...']
                0:'48'
                1:'Alberta'
                2:'2016S05078050003.01'
                3:'8050003.01'
                4:'0003.01'
                5:null
                6:'Population'
                7:1000
                8:'1.1.1'
                9:0
                10:'Population, 2016'
                11:1
                12:null
                13:3977
                14:null
                15:null
                16:'...'
                17:null
                18:'...'
            */

            // Grab 3 (CT), 8(Question ID), 

            obj = JSON.parse(res); // string to JS object

            var json = obj.DATA; //json3.items
            var fields = Object.keys(obj.COLUMNS)
            var replacer = function (key, value) { return value === null ? '' : value }
            var csv = json.map(function (row) {
                return fields.map(function (fieldName) {
                    return JSON.stringify(row[fieldName], replacer)
                }).join(',')
            })
            //csv.unshift(fields.join(',')) // add header column
            csv = csv.join('\r\n');
            csv = csv.replace('"', "");
            console.log(csv)

            output(accString, GET_FILE, false);

            geoName = '\"' + obj.DATA[0][4] + '\"';
            geoID = obj.DATA[0][2];
            density = obj.DATA[5][13];
            landArea = obj.DATA[6][13];
            fetchedData = [geoName, geoID, density, landArea];

            accString += fetchedData.join() + "\n";

            console.log("received: " + geoID);

        } catch (error) {
            failedUrls.push(idToReportLaterIfErr);
            console.log(res)
            console.error(error);
        }
    }
}

