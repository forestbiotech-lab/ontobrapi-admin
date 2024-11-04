const fs=require('fs')
const glob=require('glob')
const utils = require("../db/utils");

//TODO add version selector

function listVersions(){
    let modules=glob.sync('components/calls/*/')
    modules=modules.map(m=>m.slice(0,-1).split("/").pop())
    return modules
}


function listModules(version){
    let modules=glob.sync(`components/calls/${version}/modules/*/`)
    modules=modules.map(m=>m.slice(0,-1).split("/").pop())
    return modules
}

function listCalls(version,moduleName){
    let calls=glob.sync(`components/calls/${version}/modules/${moduleName}/schemes/*.json`)
    calls=calls.map(c=>c.split("/").pop())
    return calls
}

function mapExists(version, moduleName,callName){
    if (fs.existsSync(`components/calls/${version}/modules/${moduleName}/maps/`)) {
        return fs.existsSync(`components/calls/${version}/modules/${moduleName}/maps/${callName}`)
    }else{
        fs.mkdirSync(`components/calls/${version}/modules/${moduleName}/maps`)
        return false
    }
}



function makeMapCall(version, moduleName,callName) {
    if (!mapExists(version, moduleName, callName)){
        fs.copyFileSync(`components/calls/${version}/modules/${moduleName}/schemes/${callName}`, `components/${version}/modules/${moduleName}/maps/${callName}`)
        let json = JSON.parse(fs.readFileSync(`components/calls/${version}/modules/${moduleName}/schemes/${callName}`))
        json["_anchor"] = {}
        json["_anchor"].class = ""
        json["_anchor"].s = ""
        json["_anchor"].p = "rdf:type"
        json["_anchor"].o = ""
        fs.writeFileSync(`components/calls/${version}/modules/${moduleName}/maps/${callName}`, JSON.stringify(json, null,2))
        console.log(`    Map created ${callName}`)
    }
}

/* Creates maps from schemas if they don't exist */
for (let version of listVersions()) {
    for (let module of listModules(version)) {
        console.log(`Creating maps for: ${module} | version:${version}`)
        let calls = listCalls(version, module)
        for (let call of calls) {
            makeMapCall(version, module, call)
        }
    }
}


