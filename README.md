# Web Data Service (WDS) 
NodeJs CLI REST client for StatCan Web Data Service

>>This is a work in progress!

#### How to Run (Census Profile example)
In order to get the geography (Census Tract, Census Division, ect..), you first need to query a preliminary webservice with `Geo.js`, which will give you the IDs needed (writes them out to `Geo.csv`) to query the second webservice by running `CensusProfile.js`.

1. run Geo.js to fetch unique geography identifiers (outputs GEO.csv).
2. run CensusProfile.js to get Profile data (pop. density & land area) for list of geographies (outputs GET.csv).

#### VectorID example
1. run asyncPost.js to fetch Canadian population estimates (vectorID: 1) and display in console.log().

## StatCan resource:
* https://www.statcan.gc.ca/eng/developers

## NodeJS tutorial resource:
* https://usefulangle.com/post/170/nodejs-synchronous-http-request
