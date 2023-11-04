const SparqlClient = require('sparql-http-client')
const fs = require("fs");

const sparql=require('../../../.config.json').sparql

let host=sparql.host
let port=sparql.port
const DEFAULT_LIMIT=1000
const endpointUrl = `http://${host}:${port}/sparql`
//should-sponge=soft
let subject = 's'
let object = 'o'
let predicate = 'p'
const brapi="http://brapi.biodata.pt/"
const ontoBrAPI="http://localhost:8890/vitis"
let devServer="http://localhost:3000/"

const prefixes={
    "ppeo":"http://purl.org/ppeo/PPEO.owl#"
}


async function getAnchors(server,moduleName,callName,requestParam,requestTrip){
    devServer=server
    //Define class and property
    let callStructure=Object.assign({},getCallStructure(moduleName,callName))
    let subject,predicate,object,anchor
    if(callStructure['_anchor']){
        anchor=callStructure['_anchor'].class
        subject=callStructure['_anchor'].s
        predicate=callStructure['_anchor'].p
        object=callStructure['_anchor'].o
    }else{
        return {callStructure,results:[]}
    }
    let query1,query2,query3
    query1=query2=query3=""
    query1=subject
    let sparqlQuerySelectors={query1,query2,query3}

    let options={}
    let totalPages,queryCount
    let count;
    if (requestParam) {
        if (requestParam.pageSize) {
            options.page = requestParam.page
            options.limit = requestParam.pageSize
            queryCount = await sparqlQuery(sparqlQuerySelectors, [{subject, predicate, object}], {},count = true)
        }
    }
    let anchorIndividuals=await getResults(sparqlQuerySelectors,[{subject,predicate,object}],options)
    let results=[]

    if(options.limit<1000)
        totalPages=Math.ceil(queryCount[0].count/options.limit)
    //TODO only true if count is less then default
    else totalPages=1
    if(!callStructure.metadata.pagination) callStructure.metadata.pagination={}

    callStructure.metadata.pagination.currentPage=parseInt(options.page) || 0
    callStructure.metadata.pagination.pageSize=parseInt(options.limit)
    pageSize=options.limit //Used bellow as safeguard
    callStructure.metadata.pagination.totalPages=totalPages
    callStructure.metadata.pagination.totalCount= options.limit<DEFAULT_LIMIT ? parseInt(queryCount[0].count) : DEFAULT_LIMIT



    anchorIndividuals.forEach(async (individual,index)=>{
        let  triples=[{subject,predicate,object}]
        triples[0].subject=`<${individual[anchor]}>`
        if (index<pageSize){
            results.push(parseCallStructure(callStructure.result.data[0],sparqlQuerySelectors,triples))
        }
    })
    delete callStructure["_anchor"]
    return {callStructure,results}
}


module.exports={
    getAnchors
}