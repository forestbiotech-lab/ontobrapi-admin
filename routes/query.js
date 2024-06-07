const express = require('express');
const router = express.Router();

let xsd = require("@ontologies/xsd")
let classProperties = require('../components/sparql/baseOntologyClassProperties')
let inferredRelationship = require('../components/sparql/baseOntologyInferredRelationships')
const listClasses = require('../components/sparql/baseOntologyListClasses')
const freeQuery = require('./../components/sparql/freeQuery')
const restructuring = require("../components/helpers/restructuring");
const cache = require('../components/db/cache');
const Query = require("../components/sparql/query");


// query/

const baseOntologyURI="http://purl.org/ppeo/PPEO.owl#"

/* GET users listing. */
router.get('/', function(req, res, next) {
    res.send('respond with a resource');
});

router.get('/ppeo/class/:class/properties/', async function(req, res, next) {
    let className=req.params.class
    let queryResult=await classProperties(className,baseOntologyURI)
    res.json(queryResult)
});

router.get('/ppeo/listClasses',async (req,res)=>{
    try{
        let classList=await listClasses(baseOntologyURI)
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
    inferredRelationship.objectProperties(className,baseOntologyURI).then(result=>{
        res.json(result)
    }).catch(err=>{
        let message=err.msg
        res.json({err,message,stack})
    })

})
router.get('/inferred/dataProperty/:class',(req,res)=>{
    let className=req.params.class
    inferredRelationship.dataProperties(className,baseOntologyURI).then(result=>{
        res.json(result)
    }).catch(err=>{
        let message=err.msg
        res.json({err,message,stack})
    })
})

router.get('/inferred/dataPropertyRange/:dataProperty',(req,res)=>{
    let dataProperty=req.params.dataProperty
    inferredRelationship.dataPropertyRange(dataProperty,baseOntologyURI).then(result=>{
        res.json(result)
    }).catch(err=>{
        let message=err.msg
        res.json({err,message,stack})
    })

})


//TODO USE query
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

//TODO Send logic elsewhere
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


router.post("/explorer/classes/downward",async (req,res)=>{
    let {graph,term} = req.body
    let query=new Query()

    query.graph = graph
    query.selectors = ["*"]
    query.action = "SELECT"
    query.triples = [
        `<http://brapi.biodata.pt/${graph.slice(0,-1)}/${term}> ?downwardPredicate ?downwardObservation .`,
        '?downwardObservation rdf:type ?miappeClass .',
        '?miappeClass rdf:type owl:Class .'

    ]
    query.build()
    let downwardClass = await query.send()
    if (downwardClass.err) return res.json(downwardClass)
    res.json(downwardClass)
})

router.post("/explorer/classes/upward",async (req,res)=>{
    let {graph,term} = req.body
    let query=new Query()

    query.graph = graph
    query.selectors = ["*"]
    query.action = "SELECT"
    query.triples = [
        `?upwardSubject ?upwardPredicate <http://brapi.biodata.pt/${graph.slice(0,-1)}/${term}>.`,
        '?upwardSubject rdf:type ?miappeClass .',
        '?miappeClass rdf:type owl:Class .'
    ]
    query.build()
    let upwardClass = await query.send()
    if (upwardClass.err) return res.json(upwardClass)
    res.json(upwardClass)
})

router.post("/explorer/dataproperties",async (req,res)=>{
    let {graph,term} = req.body
    let query=new Query()
    query.graph = graph
    query.selectors = ["*"]
    query.action = "SELECT"
    query.triples = [
        `<http://brapi.biodata.pt/${graph.slice(0,-1)}/${term}> ?dataProperty ?dataValue .`,
        '?dataProperty rdf:type owl:DatatypeProperty .'
    ]
    query.build()
    let dataProperties = await query.send()
    if (dataProperties.err) return res.json(dataProperties)
    res.json(dataProperties)

})


//TODO sanitize term
router.post("/lookup/data-property",async (req,res)=>{
    let {graph,term} = req.body
    let query=new Query()
    query.graph = graph
    query.selectors = ["*"]
    query.action = "SELECT"
    query.triples = [
        '?class     rdf:type  owl:Class .',
        '?dataPropertyURI rdf:type ?class .',
        `?dataPropertyURI ?property ?dataValue .`,
        '?property rdf:type owl:DatatypeProperty .',
        `FILTER (REGEX(?dataValue, "${term}", 'i'))`
    ]
    query.build()
    let properties = await query.send()
    if (properties.err) return res.json(properties)
    if(req.hostname == "localhost" && req.port == "3010"){   //no-cors option for development
        res.set('Access-Control-Allow-Origin', 'http://localhost:3010');
        res.set('Access-Control-Allow-Method', 'POST,GET;OPTIONS');
        res.set('Access-Control-Allow-Headers');
    }
    res.json(properties)
})



module.exports = router;
