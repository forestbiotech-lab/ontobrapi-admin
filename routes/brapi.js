var express = require('express');
var router = express.Router();
var glob = require('glob')

const hash = require("object-hash")
const datasetManagement = require('../components/sparql/dataset_management')
const brapiAttributesQuery = require('.././components/sparql/brapiAttributesQuery')
const classProperties = require('../components/sparql/baseOntologyClassProperties')
const inferredRelationships = require('../components/sparql/baseOntologyInferredRelationships')
const Query = require('../components/sparql/query')

const sanitizeParams  = require('./../components/helpers/sanitizeParams')
const fs = require('fs')
const config=require("../.config")
const access_point={
  external: process.env.GIT_COMMIT != undefined ? "" : config.access_point.external,
  ontobrapi: config.sparql.ontoBrAPI
}

const baseOntologyURI="http://purl.org/ppeo/PPEO.owl#"


//TODO implement MongoDB on docker-compose
//const db = require('./../components/db')

let defaultCall={
  "@context": [
    "https://brapi.org/jsonld/context/metadata.jsonld"
  ],
  "metadata": {
    "datafiles": [],
    "pagination": {
      "currentPage": 0,
      "pageSize": 1,
      "totalCount": 1,
      "totalPages": 1
    },
    "status": [
      {
        "message": "Request accepted, response successful",
        "messageType": "INFO"
      }
    ]
  },
  "result": {
    "data": []
  }
}


router.get('/',async function(req,res,next){

  res.render('brapi', { title: 'Admin BrAPI Calls'})

})



router.get('/listmodules', function(req, res, next) {
  let modules=glob.sync('components/modules/*')
  modules=modules.map(m=>m.split("/").pop())
  let listCalls="d-none"
  let listModules="block"
  let mapCall="d-none"
  res.render('callEditor/listModules', { title: 'Onto BrAPI - Module List',modules,listCalls,listModules,mapCall})
});


router.get('/listcalls/:moduleName/list', function(req, res, next) {
  let moduleName=req.params.moduleName
  let calls=glob.sync(`components/modules/${moduleName}/schemes/*.json`)
  calls=calls.map(c=>c.split("/").pop())
  let listCalls="block"
  let listModules="d-none"
  let mapCall="d-none"
  res.render('callEditor/listCalls', { title: 'Onto BrAPI - Call List',calls,listModules,listCalls,mapCall})
});


router.get('/listcalls/:moduleName/:callName/map', async function(req, res, next) {
  let moduleName=req.params.moduleName
  let callName=req.params.callName
  //let json=require(`.././componentes/modules/${moduleName}/schemes/${callName}`)

  let json=JSON.parse(fs.readFileSync(`components/modules/${moduleName}/maps/${callName}`))
  let className=json["_anchor"].class
  json=JSON.parse(fs.readFileSync(`components/modules/${moduleName}/schemes/${callName}`))

  prettyHtml=require('json-pretty-html').default
  let html=prettyHtml(json)
  let anchorProperties={objectProperties:[],dataProperties:[]}
  let classList=[]
  try{
    anchorProperties=await classProperties(className,baseOntologyURI)
    anchorProperties.objectProperties=await inferredRelationships.objectProperties(className,baseOntologyURI)
    anchorProperties.dataProperties=await inferredRelationships.dataProperties(className,baseOntologyURI)
  }catch(err){
    console.log(err)
    anchorProperties=[]
  }
  let listCalls="d-none"
  let listModules="d-none"
  let mapCall="block"
  res.render('callEditor/mapCall', {
    title: 'Onto BrAPI - Call List',
    json,
    callName,
    anchorProperties,
    html,
    mapCall,
    listCalls,
    listModules,
    moduleName,
    anchor:className
  })
});

router.get('/listcalls/:moduleName/:callName/json', function(req, res, next) {
  let moduleName=req.params.moduleName
  let callName=req.params.callName
  let json=JSON.parse(fs.readFileSync(`components/modules/${moduleName}/maps/${callName}`))
  res.json(json)
});


router.get('/listCalls/:moduleName/:callName/result',async function(req,res,next){
  try{
    let requestParams=sanitizeParams(req.query) //TODO security check params based onl
    let servers= {
      server:`${req.protocol}://${req.headers.host}/`,
      activeGraph:require("./../.config.json").sparql.ontoBrAPIgraph
    }
    let {moduleName,callName}=req.params
    let callStructure=await brapiAttributesQuery(servers,moduleName,callName,requestParams)
    res.json(callStructure)
  }catch(err){
    res.json(err)
  }
})

router.get('/listCalls/:moduleName/:callName/gui',async function(req,res,next){
  let listCalls="d-none"
  let listModules="d-none"
  let mapCall="block"
  try{
    let requestParams=sanitizeParams(req.query) //TODO security check params based onl
    let servers= {
      server:`${req.protocol}://${req.headers.host}/`,
      activeGraph:require("./../.config.json").sparql.ontoBrAPIgraph
    }
    let {moduleName,callName}=req.params
    let callStructure=await brapiAttributesQuery(servers,moduleName,callName,requestParams)
    res.render( "callEditor/callGUI",{data:callStructure,moduleName,listCalls,listModules,mapCall})
  }catch(err){
    defaultCall.metadata.status[0].message=err.message
    defaultCall.metadata.status[0].messageType="Error"
    defaultCall.metadata.status[0].stack=err.stack
    res.json(defaultCall)
  }

})

router.get('/listCalls/:moduleName/:callName/report',async function(req,res,next){
  let listCalls="d-none"
  let listModules="d-none"
  let mapCall="block"
  let server=`${req.protocol}://${req.headers.host}/`
  let {moduleName,callName}=req.params
  let json=JSON.parse(fs.readFileSync(`components/modules/${moduleName}/maps/${callName}`))
  res.render( "callEditor/reportGUI",{data:json,callName,moduleName,listCalls,listModules,mapCall})

})

router.get('/listcalls/:moduleName/:callName/json', function(req, res, next) {
  let moduleName=req.params.moduleName
  let callName=req.params.callName
  let json=JSON.parse(fs.readFileSync(`components/modules/${moduleName}/maps/${callName}`))
  res.json(json)
});
/*
router.get('/listcalls/:moduleName/:callName/mongodb/insertOne', async function(req, res, next) {
  let {moduleName,callName}=req.params
  let json=JSON.parse(fs.readFileSync(`componentes/modules/${moduleName}/schemes/${callName}`))
  // TODO waiting for mongoDB implementation
  //await db.insertOne({moduleName,callName,data:json})
  res.json(json)
});
//This call adds the mapping information
*/
router.post('/listcalls/:moduleName/:callName/update', async function(req, res, next) {
  let moduleName=req.params.moduleName
  let callName=req.params.callName
  let file=`components/modules/${moduleName}/maps/${callName}`
  let data=req.body.data
  let json=JSON.parse(data)
  let writeData=JSON.stringify(json,null,4)
  let result="ok"
  // TODO waiting for mongoDB implementation
  // await db.updateOne({moduleName,callName}, { $set: { data:json}})
  fs.writeFile(file,writeData,function(err){
    if(err){
      res.json(err)
    }else{
      res.json("ok")
    }
  })
});

router.get('/dataset/init', async function(req, res, next) {
  let result=await datasetManagement.init("staging")
  res.json(result)
})

router.get('/dataset/status/:uid', async function(req, res, next) {
  let uid=req.params.uid
  let result=await datasetManagement.get("staging",uid)
  let payload={result:result.data,uid}
  payload["ontobrapi"]=config.sparql.ontoBrAPI
  res.render("dataset/status", payload)
})

router.get('/dataset/list', async function(req, res, next) {
  result=await datasetManagement.list("staging")
  res.render("dataset/list",{result: {staging:result.data,production:[]},access_point})
})

router.get("/dataset/list/duplicates/:graph",async function(req,res){
  let graph=req.params.graph
  let query=new Query()
  query.graph=`${graph}:`
  query.selectors = ["?investigationId (COUNT(?investigationId) AS ?count)"]
  query.action = "SELECT"
  query.triples=[
      "?dataset miappe:hasInvestigation ?dsInvestigation .",
      "?dsInvestigation rdf:type miappe:investigation .",
      "?dsInvestigation miappe:hasIdentifier ?investigationId .",
      "?dsInvestigation miappe:hasName ?investigationName ."
  ]
  query.suffix="GROUP BY ?investigationId"
  query.build()
  result=await query.send()
  res.render("dataset/duplicates-investigations", {result:result.data,graph})
})

router.post('/dataset/list/duplicates/:graph', async function(req, res, next) {
  let graph=req.params.graph
  let id=req.body.id
  let query = new Query()
  query.graph=`${graph}:`
  query.selectors = ["?investigationName","?investigationDbId"]
  query.action = "SELECT"
  query.triples=[
    "?dataset miappe:hasInvestigation ?dsInvestigation .",
    "?dsInvestigation rdf:type miappe:investigation .",
    `?dsInvestigation miappe:hasIdentifier "${id}"^^xsd:string .`,
    "?dsInvestigation miappe:hasName ?investigationName .",
    "?dsInvestigation miappe:hasDatabaseId ?investigationDbId ."

  ]
  query.build()
  result=await query.send()
  res.render("dataset/duplicates-investigations-manage", {result:result.data,graph,id})
})

router.post('/dataset/submit/:uid', async function(req, res, next) {
  const formData=require("./../components/helpers/formData")
  let form_data = await formData.singleFile(req)
  let uid=req.params.uid
  let jsonTriples=JSON.parse(form_data.payload)
  let hashResult=hash(JSON.stringify(jsonTriples), {algorithm: "md5"})
  if(hashResult===uid.slice(8)){
    result=await datasetManagement.add("staging",uid,jsonTriples)
    let err=null
    if(result.err){
      err=result.err
    }
    res.json({data: result.data, err})
  }else{
    res.json({data:null, err:{message:"hash mismatch",stack:null}})
  }
})



module.exports = router;
