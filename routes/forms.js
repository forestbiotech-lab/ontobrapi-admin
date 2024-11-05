const express = require('express');
const router = express.Router();
const freeQuery = require('.././components/sparql/freeQuery')
const restructuring = require('./../components/helpers/restructuring')
const fs=require("fs")
const dbUtils=require("./../components/db/utils")


router.get('/ontologyterms/:ontology/',(req,res)=>{
    query=`
    PREFIX rdf-syntax: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
    SELECT DISTINCT ?s ?o from <https://raw.githubusercontent.com/MIAPPE/MIAPPE-ontology/master/PPEO.owl> 
    WHERE {
      ?s rdf-syntax:type ?o .
      FILTER (contains(str(?s), "http://purl.org/ppeo/PPEO.owl"))
    }ORDER BY ?o`
    freeQuery(query).then(data=>{
        data=restructuring.organizeSubjectsByObservation(data)
        res.json(data)
    }).catch(err=>{
        let message=err.message
        res.writeHead( 400, message, {'content-type' : 'text/plain'});
        res.end(message)
    })
})
router.get('/ontologycomments/:ontology/',(req,res)=>{
    query=`
      PREFIX rdf-syntax: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
      PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
      
      SELECT DISTINCT ?s ?o from <http://purl.org/ppeo/PPEO.owl> 
      WHERE {
        ?s ?p ?o .
        FILTER (?p IN (rdf-syntax:type, rdfs:comment))
        FILTER (contains(str(?s), "http://purl.org/ppeo/PPEO.owl"))
    }`
    freeQuery(query).then(data=>{
        data=restructuring.organizeSubjectsByObservation(data)
        res.json(data)
    }).catch(err=>{
        let message=err.message
        res.writeHead( 400, message, {'content-type' : 'text/plain'});
        res.end(message)
    })
})

router.post('/serverinfo/set/call', async (req,res)=>{
    //TODO set to cache as well
    let data=req.body
    let {name,value,version,module,file}=data
    try {
        let json = JSON.parse(fs.readFileSync(`./components/calls/${version}/modules/${module}/maps/${file}`))
        json.result[name] = value
        fs.writeFileSync(`components/calls/${version}/modules/${module}/maps/${file}`, JSON.stringify(json, null, 2))
        res.json("done")
    }catch (e){
        res.json(e)
    }
})
router.post('/list-call/set/checked', async (req,res)=>{
    //TODO set to cache as well
    let data=req.body
    let {name,value,version,module,file}=data
    try {
        let json = JSON.parse(fs.readFileSync(`./components/calls/${version}/modules/${module}/maps/${file}`))
        json[name] = value
        fs.writeFileSync(`components/calls/${version}/modules/${module}/maps/${file}`, JSON.stringify(json, null, 2))
        await dbUtils.setCallStatus(version,module,file)
        res.json("done")
    }catch (e){
        res.json(e)
    }
})

router.post('/list-call/set/url', async (req,res)=>{
    //TODO set to cache as well
    let data=req.body
    let {callUrl,version,module,file}=data
    try {
        let json = JSON.parse(fs.readFileSync(`./components/calls/${version}/modules/${module}/maps/${file}`))
        json["_call-url"] = callUrl
        fs.writeFileSync(`components/calls/${version}/modules/${module}/maps/${file}`, JSON.stringify(json, null, 2))
        await dbUtils.setCallStatus(version,module,file)
        res.json("done")
    }catch (e){
        res.json(e)
    }
})


router.post('/anchor/set/class',(req,res)=>{
    let data=req.body
    let anchor={
        class:data.className,
        s:data.subject,
        p:data.predicate,
        o:data.observation
    }
    try {
        let json = JSON.parse(fs.readFileSync(`./components/modules/${data.module}/maps/${data.file}`))
        json["_anchor"] = anchor
        fs.writeFileSync(`components/modules/${data.module}/maps/${data.file}`, JSON.stringify(json, null, 2))
        res.json("done")
    }catch (e){
        res.json(e)
    }
})

router.post('/graph/set',(req,res)=>{
    let graph=req.body.graph
    let config=require('./../.config.json')
    config.sparql.ontoBrAPIgraph=graph
    fs.writeFileSync("./.config.json",JSON.stringify(config,null,2))
    res.json("done")
})
router.get('/graph/get',(req,res)=>{
    let config=require('./../.config.json')
    res.json({graph:config.sparql.ontoBrAPIgraph})
})

module.exports = router;
