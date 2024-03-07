const { MongoClient } = require('mongodb');

const CACHE_DAYS=1

class DB {

    constructor() {

        return new Promise(async (res, rej) => {
            this.config = require('./../../.config').mongo
            this.url = `mongodb://${this.config.user}:${this.config.password}@${this.config.host}:${this.config.port}`
            this.dbName = this.config.database
            let that=this
            this.connected=false
            try{
                that.client = new MongoClient(that.url, { monitorCommands: true });
                await that.connect();
                res(that)
            }catch(err){
                console.log(err)
                this.connected=false
                rej(that)
            }

        })

    }
    async connect() {
        if (this.connected) return Promise.resolve()
        await this.client.connect()
        this.connected=true
        return
    }
    get client() {
        if(this.connected){
            return this._client.db(this.dbName)
        }else{
            return this._client
        }
    }
    set client(value) {
        this._client = value
    }

    async disconnect() {
        if(this.connected==false) return Promise.resolve()
        await this.client.client.close()
        return
    }

}



async function query(servers,moduleName,callName,requestParam,requestTrip) {
    let now=Date.now()
    let db=await new DB();
    let collection=db.client.collection(callName)

    //TODO query options

    let callStructure=await collection.aggregate(requestParam).toArray()
    if(callStructure.length>0) {
        if (callStructure[0]._createdAt + CACHE_DAYS * 24 * 60 * 60 * 1000 > now) { //if cache is older than CACHE_DAYS
            callStructure = callStructure.map(result => {
                delete result._createdAt
                delete result._id
                return result
            })
        } else {
            //cache duration elapsed
            let deleteResult = await collection.deleteMany({_createdAt: callStructure[0]._createdAt})
            callStructure = []
        }
    }
    //TODO lookup in cache for call
    //TODO if params filter call
    //TODO return {data:null, found:false, error:""}
    await db.disconnect()
    return {data:callStructure, found:callStructure.length>0, error:"",totalResults:await count(callName)}
}

async function define(callName,results) {
    const now=Date.now()
    let db=await new DB();
    let collection=db.client.collection(callName)
    results=results.map(result=>{
        result._createdAt=now
        return result
    })
    //TODO this should be is all of them
    let insertResult=await collection.insertMany(results)

    //TODO date
    //inserResult{ acknowledged:true/false, insertedIds:[], insertedCount:X}
    //insertResult.insertedIds[0].toString()

    await db.disconnect()
    return insertResult
}
async function retrieve(callName,moduleName,getCallStructure) {
    let db=await new DB();
    let collection=db.client.collection(callName+".structure")
    let callStructure= await collection.findOne({})
    if(callStructure == null){
        callStructure=getCallStructure(moduleName,callName)
        await store(callName,callStructure)
    }
    await db.disconnect()
    return callStructure
}
async function store(callName,callStructure){
    let db=await new DB();
    let collection=db.client.collection(callName+".structure")
    let insertResult= await collection.insertOne(callStructure)
    await db.disconnect()
    return insertResult
}
async function count(callName){
    let db=await new DB();
    let collection=db.client.collection(callName)
    let count=await collection.count()
    await db.disconnect()
    return count
}


module.exports = {
    query,
    define,
    callStructure:{retrieve,store},
    count
}