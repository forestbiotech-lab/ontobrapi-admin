const fs=require('fs')
const glob=require('glob')
const cache=require('../db/cache')
const utils=require('../db/utils')

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


/* Creates maps from schemas if they don't exist */
async function run(){
    for (let version of listVersions()) {
        for (let module of listModules(version)) {
            console.log(`Updating call status for ${module} version:${version}`)
            let calls = listCalls(version, module)
            for (let call of calls) {
                await utils.setCallStatus(version, module, call)
            }
        }
    }
}

run().then(data=>{
    console.log("Done")
    return "done"
}).catch(err=>{
    console.log(err)
})

module.exports = run