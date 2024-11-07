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

            let data={
                callUrl: json["_call-url"],
                post: json["_call-post"] =="true",
                get: json["_call-get"]=="true",
                datatype: "application/json"
            }

            let requestParams=[{"$match":{'callUrl':data.callUrl}}]

            let result=await cache.query("",moduleName,"serverInfo.json",requestParams,"")

            data.module=moduleName
            data.file=callName

            let callUpdate=addCall(data.callUrl, version, data, result.data,{'callUrl':data.callUrl})
            console.log(`    Added status of: ${callName}`)
        }else{
            let callUrl = json["_call-url"]
            if(callUrl) {
                cache.clearEntry("serverInfo.json", {callUrl})
            }
        }
    }
}


function makeCall(callUrl, version,data){
    let {get, post, datatype, module, file}=data
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
    _.module=module
    _.file=file
    return _
}

async function addCall(callUrl, version,data,result,requestParams){
    let {get,post,datatype}=data
    if (result.length==0){
        let call = makeCall(callUrl,version, data)
        await cache.define("serverInfo.json",[call])
    }else {
        let _=result[0]
        _.methods={
            get,
            post
        }
        _.datatypes[datatype] = true
        _.versions[version] = true
        _.module = data.module
        _.file = data.file
        await cache.update("serverInfo.json" ,_ ,requestParams)
    }
}


module.exports = {setCallStatus}

