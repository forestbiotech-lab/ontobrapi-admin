#!/usr/bin/env node

const fs=require("fs")
let env=fs.readFileSync(".env","utf8")

let port="3000"
let portLine=[]
if(env){
    portLine = env.split("\n").filter(line=>line.startsWith("PORT"))
}
if (portLine.length>0){
    port=portLine[0].split("=")[1]
}
console.log(port)
fetch(`http://localhost:${port}/admin/brapi/dataset/init`).then(response=> {
    response.json().then(json=>{
        console.log(json)
    })

})


