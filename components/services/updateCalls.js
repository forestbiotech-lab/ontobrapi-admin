const fs=require('fs')
const glob=require('glob')


function listModules(){
    let modules=glob.sync('components/modules/*')
    modules=modules.map(m=>m.split("/").pop())
    return modules
}

function listCalls(moduleName){
    let calls=glob.sync(`components/modules/${moduleName}/schemes/*.json`)
    calls=calls.map(c=>c.split("/").pop())
    return calls
}

function mapExists(moduleName,callName){
    if (fs.existsSync(`components/modules/${moduleName}/maps/`)) {
        return fs.existsSync(`components/modules/${moduleName}/maps/${callName}`)
    }else{
        fs.mkdirSync(`components/modules/${moduleName}/maps`)
        return false
    }

}


function makeMapCall(moduleName,callName) {
    if (!mapExists(moduleName, callName)){
        fs.copyFileSync(`components/modules/${moduleName}/schemes/${callName}`, `components/modules/${moduleName}/maps/${callName}`)
        let json = JSON.parse(fs.readFileSync(`components/modules/${moduleName}/schemes/${callName}`))
        json["_anchor"] = {}
        json["_anchor"].class = ""
        json["_anchor"].s = ""
        json["_anchor"].p = "rdf:type"
        json["_anchor"].o = ""
        fs.writeFileSync(`components/modules/${moduleName}/maps/${callName}`, JSON.stringify(json, null,2))
        console.log(`    Map created ${callName}`)
    }
}

/* Creates maps from schemas if they don't exist */
modules=listModules()
for(let module of modules){
    console.log("Creating maps for "+module)
    let calls=listCalls(module)
    for(let call of calls){
        makeMapCall(module,call)
    }
}

