var express = require('express');
var router = express.Router();
var glob = require('glob')
const sparql=require('.././components/sparql/sparql')

//var sparqlQuery = require('.././components/sparql/sparqlQuery')
//var testsparql = require('.././components/sparql/testsparql')

//var classProperties = require('./../components/sparql/classProperties')
//var inferredRelationships = require('./../components/sparql/inferredRelationships')
//const sanitizeParams  = require('./../components/helpers/sanitizeParms')
//const fs = require('fs')

//TODO implement MongoDB on docker-compose
//const db = require('./../componentes/db')

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

  res.render('admin', { title: 'Admin BrAPI Calls'})

})



router.get('/listmodules', function(req, res, next) {
  let modules=glob.sync('components/modules/*')
  modules=modules.map(m=>m.split("/").pop())
  let listCalls="d-none"
  let listModules="block"
  let mapCall="d-none"
  res.render('callEditor/listModules', { title: 'Onto BrAPI - Module List',modules,listCalls,listModules,mapCall})
});

/*
router.get('/listcalls/:moduleName/list', function(req, res, next) {
  let moduleName=req.params.moduleName
  let calls=glob.sync(`componentes/modules/${moduleName}/schemes/*`)
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
  let json=JSON.parse(fs.readFileSync(`componentes/modules/${moduleName}/schemes/${callName}`))
  let className=json["_anchor"].class

  prettyHtml=require('json-pretty-html').default
  let html=prettyHtml(json)
  let anchorProperties={objectProperties:[],dataProperties:[]}
  try{
    anchorProperties=await classProperties(className)
    anchorProperties.objectProperties=await inferredRelationships.objectProperties(className)
    anchorProperties.dataProperties=await inferredRelationships.dataProperties(className)
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


router.get('/listCalls/:moduleName/:callName/result',async function(req,res,next){
  try{
    let requestParams=sanitizeParams(req.query) //TODO security check params based onl
    let server=`${req.protocol}://${req.headers.host}/`
    let {moduleName,callName}=req.params
    let queryResults=await testsparql(server,moduleName,callName,requestParams)
    Promise.all(queryResults.results).then(result=>{
      queryResults.callStructure.result.data=result
      res.json(queryResults.callStructure)
    }).catch(err=>{
      throw err
    })
  }catch(err){

    res.json(err)
  }

})
router.get('/listCalls/:moduleName/:callName/gui',async function(req,res,next){
  try{
    let requestParams=sanitizeParams(req.query) //TODO security check params based onl
    let server=`${req.protocol}://${req.headers.host}/`
    let {moduleName,callName}=req.params
    let queryResults=await testsparql(server,moduleName,callName,requestParams)
    Promise.all(queryResults.results).then(result=>{
      queryResults.callStructure.result.data=result
      res.render( "callEditor/callGUI",{data:queryResults.callStructure})
    }).catch(err=>{
      throw err
    })
  }catch(err){
    defaultCall.metadata.status[0].message=err.message
    defaultCall.metadata.status[0].messageType="Error"
    defaultCall.metadata.status[0].stack=err.stack
    res.json(defaultCall)
  }

})
router.get('/listCalls/:moduleName/:callName/report',async function(req,res,next){
  let server=`${req.protocol}://${req.headers.host}/`
  let {moduleName,callName}=req.params
  let json=JSON.parse(fs.readFileSync(`componentes/modules/${moduleName}/schemes/${callName}`))
  res.render( "callEditor/reportGUI",{data:json,callName})

})

router.get('/listcalls/:moduleName/:callName/json', function(req, res, next) {
  let moduleName=req.params.moduleName
  let callName=req.params.callName
  let json=JSON.parse(fs.readFileSync(`componentes/modules/${moduleName}/schemes/${callName}`))
  res.json(json)
});
router.get('/listcalls/:moduleName/:callName/mongodb/insertOne', async function(req, res, next) {
  let {moduleName,callName}=req.params
  let json=JSON.parse(fs.readFileSync(`componentes/modules/${moduleName}/schemes/${callName}`))
  // TODO waiting for mongoDB implementation
  //await db.insertOne({moduleName,callName,data:json})
  res.json(json)
});
//This call adds the mapping information
router.post('/listcalls/:moduleName/:callName/update', async function(req, res, next) {
  let moduleName=req.params.moduleName
  let callName=req.params.callName
  let file=`componentes/modules/${moduleName}/schemes/${callName}`
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

function writeFile(file,data){
  return new Promise((res,rej)=>{
    fs.open(file,'w',(err,fd)=>{
      if(err) res(err)

    })

  })
}
*/

module.exports = router;
