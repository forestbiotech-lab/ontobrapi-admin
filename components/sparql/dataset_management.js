const Query = require('./query')
const ontobrapi = require('../../.config').sparql.ontoBrAPI

async function init(repo){
    let query=new Query()
    let loading=await query.loadInto("miappe:",`${repo}:`)
    if(loading.err) return loading

    //else return loading

    query=new Query()
    query.graph=`${repo}:`
    query.action="INSERT"
    query.triples=[
        `${repo}: rdf:type void:Dataset .`,
        `${repo}: owl:imports miappe: .`
    ]

    let importsMiappe=await query.send()
    if(importsMiappe.err) return importsMiappe

    else{
        loading.data.push(importsMiappe.data[0])
        return loading
    }
}


//TODO hardcoded url
function add(repo,uid,triples){
    let dataset={
        "prefix": `PREFIX dataset: <${ontobrapi}/${repo}/${uid}#>`,
        "url": `${ontobrapi}/${repo}/${uid}#`
    }
    let query=new Query(uid)
    query.graph=`${repo}:`
    query.action="INSERT"
    query.loadPrefix("dataset",dataset)
    query.triples=triples
    //console.log(query.query)
    return query.send()
}

function del(repo){

}

function get(repo,uid){
    let query=new Query()
    query.selectors=["?datasets","?dsInvestigation", "?investigationId", "?investigationName", "?investigationStatus", "?investigationDescription", "?studyName"]
    query.graph=`${repo}:`
    query.action="SELECT"
    query.triples=[
        "?datasets void:inDataset ontobrapi: .",
        "?datasets miappe:hasInvestigation ?dsInvestigation .",
        "?dsInvestigation rdf:type miappe:investigation .",   //For some reason this does not work, might be the constraint on one ID
        `?dsInvestigation miappe:hasDatabaseId "${uid}"^^xsd:string .`,
        "?dsInvestigation miappe:hasIdentifier ?investigationId .",
        "?dsInvestigation miappe:hasName ?investigationName .",
        "?datasets miappe:hasStatus ?investigationStatus .",
        "?dsInvestigation miappe:hasDescription ?investigationDescription .",
        "?dsInvestigation miappe:hasPart ?study .",
        "?study rdf:type miappe:study .",
        "?study miappe:hasName ?studyName ."
    ]
    console.log(query.query)
    return query.send()
}

function list(repo){
    let query=new Query()
    query.selectors=["?dataset","?dsInvestigation","?dsInvestigationDbId", "?investigationId", "?investigationName", "?investigationStatus", "?investigationDescription"]
    query.graph=`${repo}:`
    query.action="SELECT"
    query.triples=[
        //Don't need to specify all get all triples associated to Investigation
        "?dataset void:inDataset ontobrapi: .",
        "?dataset miappe:hasInvestigation ?dsInvestigation .",
        `?dsInvestigation miappe:hasDatabaseId ?dsInvestigationDbId .`,
        "?dsInvestigation miappe:hasIdentifier ?investigationId .",
        "?dsInvestigation miappe:hasName ?investigationName .",
        "?dataset miappe:hasStatus ?investigationStatus .",
        "?dsInvestigation miappe:hasDescription ?investigationDescription ."
    ]
    console.log(query.query)
    return query.send()

}

module.exports = {
    init,
    add,
    del,
    get,
    list
}