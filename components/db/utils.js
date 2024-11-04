const fs = require("fs")
const cache = require("./cache")


function mapExists(version,moduleName,callName){
    if (fs.existsSync(`components/calls/${version}/modules/${moduleName}/maps/`)) {
        return fs.existsSync(`components/calls/${version}/modules/${moduleName}/maps/${callName}`)
    }else{
        return false
    }
}


async function setCallStatus(version, moduleName, callName) {
    if (mapExists(version, moduleName, callName)){
        let json = JSON.parse(fs.readFileSync(`components/calls/${version}/modules/${moduleName}/maps/${callName}`))
        let listCall=json["_list-call"]
        if(listCall == 'true'){
            let callUrl = json["_call-url"]
            let post = json["_call-post"]
            let get = json["_call-get"]
            //TODO Dynamic
            let datatype= "application/json"
            let requestParams=[{"$match":{'callUrl':callUrl}}]

            let result=await cache.query("",moduleName,"serverInfo.json",requestParams,"")

            let callUpdate=addCall(callUrl, version, get, post, datatype, result.data,{'callUrl':callUrl})
            console.log(`    Added status of: ${callName}`)
        }else{
            let callUrl = json["_call-url"]
            if(callUrl) {
                cache.clearEntry("serverInfo.json", {callUrl})
            }
        }
    }
}


function makeCall(callUrl, version, get, post, datatype){
    let _= {
        callUrl,
        datatypes: {},
        versions: {},
        methods:{
            get,
            post
        }
    }
    _.datatypes[datatype]=true
    _.versions[version]=true
    return _
}

async function addCall(callUrl, version,get,post,datatype,result,requestParams){
    if (result.length==0){
        let call = makeCall(callUrl,version, get, post, datatype)
        await cache.define("serverInfo.json",[call])
    }else {
        let _=result[0]
        _.methods={
            get,
            post
        }
        _.datatypes[datatype] = true
        _.versions[version] = true
        await cache.update("serverInfo.json" ,_ ,requestParams)
    }
}


module.exports = {setCallStatus}

