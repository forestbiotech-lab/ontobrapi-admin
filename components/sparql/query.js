const SparqlClient = require('sparql-http-client')
const sparql=require('./../../.config').sparql
const prefixes=require('./assets/prefixes')


class Query{
    constructor(){
        let host=sparql.host
        let port=sparql.port
        const endpointUrl = `http://${host}:${port}/sparql`
        this.client = new SparqlClient({ endpointUrl })
        this.prefixes=prefixes
    }
    loadPrefix(key,value){
        this._prefixes[key]=value
    }
    set prefixes(input){
        this._prefixes=input
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
        }else if(input=="DELETE"){
            this._action=`DELETE FROM ${this.graph} `
        }else if(input=="SELECT") {
            if(this._selectors.length>0){
                this._action="SELECT DISTINCT "+this._selectors.reduce((acc,curr)=>{return acc+`\t${curr}`},"")+` FROM ${this.graph} WHERE`
            }else{
                this._action = `SELECT DISTINCT * FROM ${this.graph} WHERE`
            }
        }
    }
    set selectors(input){
        this._selectors=input
    }
    get action(){
        return this._action
    }
    set triples(input){
        this._triples=input
    }
    get triples(){
        return this._triples
    }
    build(){
        this._query=""
        this._query+=Object.entries(this._prefixes).reduce((acc,[key,currValue])=>{return acc+`${currValue.prefix}\n`},"")+"\n\n"
        this._query+=this.action
        this._query+=this.triples.reduce((acc,curr)=>{return acc+`\t${curr}\n`},"{\n")+"\n}"
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
    send(){
        return new Promise((res,rej)=> {
            this.client.query.select(this.query).then(stream => {
                let result = []
                stream.on('data', row => {
                    let resultTriple = {}
                    Object.entries(row).forEach(([key, value]) => {
                        resultTriple[key] = value.value
                    })
                    result.push(resultTriple)
                })
                stream.on('error', err => {
                    res({data: null, err})
                })
                stream.on('end', err => {
                    res({data: result,err})  //TODO Check this err that might not be err
                })
            }).catch(err => {
                let message = err.message
                let stack = err.stack
                res({data:null, err:{message,stack}})
            })
        })
    }
}

module.exports = Query