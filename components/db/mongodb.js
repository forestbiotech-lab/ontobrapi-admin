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

module.exports = DB