const express = require('express');
const router = express.Router();

let xsd = require("@ontologies/xsd")
let classProperties = require('./../components/sparql/ppeoClassProperties')
let inferredRelationship = require('./../components/sparql/ppeoInferredRelationships')
const listClasses = require('./../components/sparql/ppeoListClasses')
const freeQuery = require('./../components/sparql/freeQuery')
const restructuring = require("../components/helpers/restructuring");
const cache = require('../components/db/cache');
// query/

/* GET users listing. */
router.get('/', function(req, res, next) {
    res.send('respond with a resource');
});

router.get('/ppeo/class/:class/properties/', async function(req, res, next) {
    let className=req.params.class
    let queryResult=await classProperties(className)
    res.json(queryResult)
});

router.get('/ppeo/listClasses',async (req,res)=>{
    try{
        let classList=await listClasses()
        if (classList instanceof Error) res.json()
        res.json(classList)
    }catch (e) {
        res.sendStatus(400)
    }
})

router.get('/xsd/datatypes/', function(req, res) {
    res.json(xsd)
});



router.get('/inferred/objectProperty/:class',(req,res)=>{
    let className=req.params.class
    inferredRelationship.objectProperties(className).then(result=>{
        res.json(result)
    }).catch(err=>{
        let message=err.msg
        res.json({err,message,stack})
    })

})
router.get('/inferred/dataProperty/:class',(req,res)=>{
    let className=req.params.class
    inferredRelationship.dataProperties(className).then(result=>{
        res.json(result)
    }).catch(err=>{
        let message=err.msg
        res.json({err,message,stack})
    })

})

router.get('/inferred/dataPropertyRange/:dataProperty',(req,res)=>{
    let dataProperty=req.params.dataProperty
    inferredRelationship.dataPropertyRange(dataProperty).then(result=>{
        res.json(result)
    }).catch(err=>{
        let message=err.msg
        res.json({err,message,stack})
    })

})


router.get('/list/graphs',(req,res)=>{
    query=`SELECT  DISTINCT ?g
            WHERE  { GRAPH ?g {?s ?p ?o} }
            ORDER BY  ?g
    `
    freeQuery(query).then(data=>{
        data=data.map(graph=>graph.g)
        res.json(data)
    }).catch(err=>{
        let message=err.message
        res.writeHead( 400, message, {'content-type' : 'text/plain'});
        res.end(message)
    })
})

router.post("/graph/lookup/summary/",(req,res)=>{
    let graph=req.body.graph
    query=`
PREFIX ppeo:<http://purl.org/ppeo/PPEO.owl#>
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>

SELECT DISTINCT ?investigation ?investigationName ?investigationDescription ?study

FROM <${graph}> 
WHERE {
  ?investigation rdf:type      ppeo:investigation .
  ?investigation ppeo:hasName ?investigationName .
  ?investigation ppeo:hasDescription ?investigationDescription .
  ?investigation ppeo:hasPart  ?study . 
  ?study         rdf:type      ppeo:study . 
}
    `
    freeQuery(query).then(data=>{
        res.json(data)
    }).catch(err=>{
        let message=err.message
        res.writeHead( 400, message, {'content-type' : 'text/plain'});
        res.end(message)
    })
})

router.get("/cache/createdAt",async (req,res)=>{
    let now = Date.now()
    const referer = req.get('Referer') || req.get('referrer');
    let callName = referer.trimEnd("/").split("/").splice(-2)[0]
    let createdAt= await cache.age(callName)

    res.json({ageHH:Math.round((now-createdAt)/1000/60/60),createdAt})
})
router.get("/cache/clear",async (req,res)=>{
    let referer = req.get('Referer') || req.get('referrer');
    let callName = referer.trimEnd("/").split("/").splice(-2)[0]
    let clear= await cache.clear(callName)
    res.json({clear})
})

module.exports = router;
