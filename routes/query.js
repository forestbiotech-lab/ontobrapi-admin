const express = require('express');
const router = express.Router();

let xsd = require("@ontologies/xsd")
let classProperties = require('./../components/sparql/ppeoClassProperties')
let inferredRelationship = require('./../components/sparql/ppeoInferredRelationships')
const listClasses = require('./../components/sparql/ppeoListClasses')

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


module.exports = router;
