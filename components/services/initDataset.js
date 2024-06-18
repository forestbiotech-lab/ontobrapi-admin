#!/usr/bin/env node

const fs=require("fs")
let retries=0
function initDataset() {
    try {
        let env = fs.readFileSync(".env", "utf8")

        let port = "3000"
        let portLine = []
        if (env) {
            portLine = env.split("\n").filter(line => line.startsWith("PORT"))
        }
        if (portLine.length > 0) {
            port = portLine[0].split("=")[1]
        }
        fetch(`http://localhost:${port}/admin/brapi/dataset/init`).then(response => {
            response.json().then(json => {
                console.log(json)
            })

        })
    } catch (e) {
        console.log(e)
        if (retries < 3) {
            retries++
            console.log("Retrying in 5 seconds")
            setTimeout(function () {
                initDataset()
            }, 5000)
        }
    }
}
initDataset()
