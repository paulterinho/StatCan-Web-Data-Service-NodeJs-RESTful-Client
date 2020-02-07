const https = require('https'),
         fs = require('fs'),
       host = 'https://www12.statcan.gc.ca/', 
       path = 'rest/census-recensement/CR2016Geo.json?',
       lang = 'lang=E&', geo  = 'geos=PR&', cpt  = 'cpt=00',
        url = host + path + lang + geo + cpt;
       // 24 = Québec
      // All Census Subdivisions (csd)
(async function() {
  await makeRequestByPromise();
})();
async function makeRequestByPromise() {
  try {
    let http_promise = getPromise();
    let response_body = await http_promise;
    console.log(response_body.length);
    console.log(response_body);
    output(response_body.join(""));
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
function output(_this) {
  fs.writeFile("./GEO.csv", _this, function(err) {
    if (err) {
      return console.log(err);
    } else {
      return console.log("Looks like it worked...(list)");
    }
  });
}
