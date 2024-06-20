const SparqlClient = require('sparql-http-client')
const sparql=require('./../../.config').sparql
const prefixes=require('./assets/prefixes')


class Query{
    constructor(uid){
        let host=sparql.host
        let port=sparql.port
        const endpointUrl = `http://${host}:${port}/sparql`
        this.client = new SparqlClient({ endpointUrl })
        this.prefixes=prefixes
        this._suffix=""
        this._triples=[]
        if(uid){
            this._newDataset=[
                //dataset or datasetInvestigation??
                "dataset: void:inDataset ontobrapi: .",
                "dataset: miappe:hasInvestigation dataset:Investigation?? .",
                "dataset:Investigation?? rdf:type miappe:investigation .",
                `dataset:Investigation?? miappe:hasDatabaseId "${uid}"^^xsd:string .`,
                'dataset:hasStatus rdf:type owl:ObjectProperty .',
                'dataset:hasStatus rdfs:domain dataset:Investigation?? .',
                'dataset:hasStatus rdfs:range rdfs:Literal .',
                'dataset:hasStatus rdfs:label "hasStatus" .',
                'dataset:hasStatus rdfs:subPropertyOf void:hasProperty .',
                'dataset:hasStatus rdf:type owl:ObjectProperty .',
                'dataset: miappe:hasStatus "Awaiting validation"^^xsd:string .' //Default for new dataset
            ]
        }else{
            this._newDataset=[]
        }
    }
    loadPrefix(key,value){
        this._prefixes[key]=value
    }
    set prefixes(input){
        this._prefixes=input
    }
    loadInto(load,graph){
        this.graph=graph
        //override default
        this._action=`LOAD ${load} INTO GRAPH ${graph} ;`
        //override default
        this._query=Object.entries(this._prefixes).reduce((acc,[key,currValue])=>{return acc+`${currValue.prefix}\n`},"")+"\n\n"
        this._query+=this.action
        return this.send()
    }
    set action(input){
        if(this.graph===undefined){
            let graphErro=new Error("graphUndefined")
            graphErro.code=500
            graphErro.message="Graph not defined"
            throw graphErro
        }
        if (input=="INSERT"){
            this._action=`INSERT INTO GRAPH ${this.graph} `
            this._triples = this._triples.concat(this._newDataset)
        }else if(input=="DELETE") {
            this._action = `DELETE
                            FROM ${this.graph} `
        }else if(input=="SELECT") {
            if(this._selectors.length>0){
                this._action="SELECT DISTINCT "+this._selectors.reduce((acc,curr)=>{return acc+`\t${curr}`},"")+` FROM ${this.graph} WHERE`
            }else{
                this._action = `SELECT DISTINCT * FROM ${this.graph} WHERE`
            }
        }
    }
    set selectors(input){
        if(input instanceof Array){
            this._selectors=input
        }else{
            let notArrayError=new Error("notArray")
            notArrayError.code=500
            notArrayError.message="Input must be an array"
            throw notArrayError
        }

    }
    get action(){
        return this._action
    }
    convertTerm(term){
        let prefix = term.split(":",1)[0].slice(1)
        let instance = decodeURI(term.slice(prefix.length+2,-1).replace(/:/g,"_")).replace(/ /g,"_")
        let result=instance.matchAll("[^a-zA-Z0-9_-]")
        if(result){
            for(let match of result){
                instance=instance.replace(match[0],`_`)
            }
        }

        return `<${this._prefixes[prefix].url}${instance}>`
    }
    set suffix(input){
        this._suffix=input
    }
    get suffix(){
        return this._suffix
    }

    set triples(input){
        if(input instanceof Array){
            this._triples=input
        }else if( input instanceof Object){
            if(input.individuals && input.properties && input.prefix && input.baseOntology){
                // Replaces spaces and ":" with "_"
                let investigation=input.individuals[Object.keys(input.individuals)[0]].s
                let investigationPrefix=investigation.split(":",1)[0]
                let investigationInstance=decodeURI(investigation.slice(investigationPrefix.length+1,-1).replace(/:/g,"_")).replace(/ /g,"_")
                this._triples=this._triples.map(t=>t.replace(/Investigation\?\?/g,investigationInstance))

                let index=0
                for( let [key,individual] of Object.entries(input.individuals)){
                    this._triples.push(
                        `${this.convertTerm(individual.s)} ${individual.p.slice(1,-1)} ${this.convertTerm(individual.o)} .`
                    )
                    if(index==5){
                        break;
                    }
                }
                for( let [key,property] of Object.entries(input.properties)){
                    if(!property.o.match("\\^\\^")){
                        property.o=this.convertTerm(property.o)
                    }
                    this._triples.push(
                        `${this.convertTerm(property.s)} ${property.p.slice(1,-1)} ${property.o} .`
                    )
                }
            }else{
                let undetermined=new Error("undetermined")
                undetermined.code=500
                undetermined.message="Undetermined type of triples, must be an array or a triples object"
                throw  undetermined
            }

        }

    }
    get triples(){
        return this._triples
    }
    build(){
        this._query=""
        this._query+=Object.entries(this._prefixes).reduce((acc,[key,currValue])=>{return acc+`${currValue.prefix}\n`},"")+"\n\n"
        this._query+=this.action
        this._query+=this.triples.reduce((acc,curr)=>{return acc+`\t${curr}\n`},"{\n")+"\n}"
        this._query+=this.suffix
    }
    set query(input){
        this._query=input
    }
    get query(){
        this.build()
        return this._query
    }
    set graph(input){
        this._graph=input
    }
    get graph(){
        return this._graph
    }
    set where(input){

    }
    set order(input){

    }
    set limit(input){

    }
    set offset(input){

    }
    async send(){
        if(this.triples.length>50){
            this._backuptriples=this.triples
            let queryResult=[]
            let delta=40
            let lowerBound=0
            let upperBound=delta

            for (let i=delta; i<this._backuptriples.length;) {
                //Can't use set triples (this.triples)

                this._triples = this._backuptriples.slice(lowerBound, upperBound)
                this.build()
                console.log("Query size:",new Blob([this.query]).size)
                let result=await this.send()
                if(result.err) {
                    if(delta>10 && result.err.message.startsWith("Bad Request (400): Virtuoso 37000 Error SP030:")){
                        delta=delta-10
                        upperBound-=10
                    }else{
                        console.log(result.err)
                        return result
                    }
                    console.log("Error size: ",new Blob([result.err.message]).size)

                }else{
                    queryResult=queryResult.concat(result.data)
                    lowerBound+=delta
                    upperBound+=delta
                    i+=delta
                }
            }
            return {data: queryResult,err:null}
        }
        return new Promise((res,rej)=> {
            if (this.action == "SELECT"){
                this.client.query.select(this.query).then(stream => callBack(stream)).catch(err => errorCallback(err))
            }else if(this.action.startsWith("INSERT")){
                this.client.query.select(this.query).then(stream => callBack(stream)).catch(err => errorCallback(err))
            }else{
                this.client.query.select(this._query).then(stream => callBack(stream)).catch(err => errorCallback(err))
            }
            function callBack(stream) {
                let result = []
                stream.on('data', row => {
                    let resultTriple = {}
                    Object.entries(row).forEach(([key, value]) => {
                        resultTriple[key] = value.value
                    })
                    result.push(resultTriple)
                })
                stream.on('error', err => {
                    let message = err.message
                    let stack = err.stack
                    res({data: null, err: {message, stack}})
                })
                stream.on('end', err => {
                    res({data: result, err})  //TODO Check this err that might not be err
                })
            }
            function errorCallback(err){
                let message = err.message
                let stack = err.stack
                res({data:null, err:{message,stack}})
            }
        })
    }
}

module.exports = Query