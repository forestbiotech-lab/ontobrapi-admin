const Query = require('./query')


function initialize(repo){
    let query=new Query()
    query.action="INSERT"
    query.graph=`${repo}:`
    query.triples=[
        "ontobrapi: rdf:type owl:Ontology .",
        "ontobrapi: owl:imports miappe: ."
    ]
    console.log(query.query)
    return query.send()
}

function add(repo,uid,triples){
    let dataset={
        "prefix": `PREFIX dataset: <http://brapi.biodata.pt/${repo}/${uid}#>`,
            "url": `http://brapi.biodata.pt/${repo}/${uid}#`
    }


    let query=new Query()
    query.graph=`${repo}:`
    query.action="INSERT"
    query.loadPrefix("dataset",dataset)
    query.triples=[
        "dataset: void:inDataset ontobrapi: .",
        "dataset: miappe:hasInvestigation dataset:Investigation01 .",
        //"dataset:Investigation01 rdf:type miappe:investigation .",
        `dataset:Investigation01 miappe:hasDatabaseId "${uid}"^^xsd:string .`,
        'dataset:Investigation01 miappe:hasIdentifier "0001"^^xsd:string .',
        'dataset:Investigation01 miappe:hasName "Investigation 0001"^^xsd:string .',
        'dataset:hasStatus rdf:type owl:ObjectProperty .',
        'dataset:hasStatus rdfs:domain dataset:Investigation01 .',
        'dataset:hasStatus rdfs:range rdfs:Literal .',
        'dataset:hasStatus rdfs:label "hasStatus" .',
        'dataset:hasStatus rdfs:subPropertyOf void:hasProperty .',
        'dataset:hasStatus rdf:type owl:ObjectProperty .',
        'dataset:Investigation01 miappe:hasStatus "Awaiting validation"^^xsd:string .',
        'dataset:Investigation01 miappe:hasDescription "Temperature is the major climate element for grapevine development, controlling the rhythm at which several phenological stages like budbreak, flowering, veraison and maturity occur during the biological cycle. In Portugal, information about the thermal requirements of the different cultivars for wine production is lacking. This work aims to evaluate the thermal durations of each development phase of grapevine cultivars of the portuguese collection, located at Estação Vitivinícola Nacional, Dois Portos. Cultivars were classified as short-cycle, medium-cycle or long-cycle according to the duration of both each phase of development and the full cycle. They were also classified as early-season, mid season or late-season cultivars, starting on the 1st of January."^^xsd:string .'
    ]
    console.log(query.query)
    return query.send()
}

function del(repo){

}

function get(repo,uid){
    let query=new Query()
    query.selectors=["?datasets","?dsInvestigation", "?investigationId", "?investigationName", "?investigationStatus", "?investigationDescription"]
    query.graph=`${repo}:`
    query.action="SELECT"
    query.triples=[
        "?datasets void:inDataset ontobrapi: .",
        "?dataset miappe:hasInvestigation ?dsInvestigation .",
        //"?dsInvestigation rdf:type miappe:investigation .",   //For some reason this does not work, might be the constraint on one ID
        `?dsInvestigation miappe:hasDatabaseId "${uid}"^^xsd:string .`,
        "?dsInvestigation miappe:hasIdentifier ?investigationId .",
        "?dsInvestigation miappe:hasName ?investigationName .",
        "?dsInvestigation miappe:hasStatus ?investigationStatus .",
        "?dsInvestigation miappe:hasDescription ?investigationDescription ."
    ]
    console.log(query.query)
    return query.send()
}

function list(repo){
    let query=new Query()
    query.selectors=["?datasets","?dsInvestigationDbId", "?investigationId", "?investigationName", "?investigationStatus", "?investigationDescription"]
    query.graph=`${repo}:`
    query.action="SELECT"
    query.triples=[
        "?datasets void:inDataset ontobrapi: .",
        "?dataset miappe:hasInvestigation ?dsInvestigation .",
        `?dsInvestigation miappe:hasDatabaseId ?dsInvestigationDbId .`,
        "?dsInvestigation miappe:hasIdentifier ?investigationId .",
        "?dsInvestigation miappe:hasName ?investigationName .",
        "?dsInvestigation miappe:hasStatus ?investigationStatus .",
        "?dsInvestigation miappe:hasDescription ?investigationDescription ."
    ]
    console.log(query.query)
    return query.send()

}

module.exports = {
    initialize,
    add,
    del,
    get,
    list
}