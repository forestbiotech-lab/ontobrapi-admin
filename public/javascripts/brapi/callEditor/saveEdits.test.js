////// NOT USED //////
/////  Has interesting implementations of virtual DOMs with pug and vue ////////



var expect = require('chai').expect
const jQuery=require("jquery")
//global['$']=jQuery
//global['window']={}
global['testing']={render, fireEvent, screen} = require('@testing-library/vue')
const jsdom=require('jsdom')
const { JSDOM } = jsdom;
const pug=require('pug')
const fs = require("fs");
const Vue =require('vue/dist/vue.common.js')
const vSelect =require("vue-select")



const port=3001 //gateway on docker
const classProperties = require("../../../../components/sparql/baseOntologyClassProperties");
const inferredRelationships = require("../../../../components/sparql/baseOntologyInferredRelationships");

const baseOntologyURI="http://purl.org/ppeo/PPEO.owl#"
//Setup DOM from pug file
//html=pug.renderFile("./views/factory/vue/callEditor/template-layer.pug",{pretty:true})




/* Start  pug vars */
let moduleName="core"
let callName="programs.json"
let json=JSON.parse(fs.readFileSync(`components/modules/${moduleName}/maps/${callName}`))
let className=json["_anchor"].class
json=JSON.parse(fs.readFileSync(`components/modules/${moduleName}/schemes/${callName}`))

prettyHtml=require('json-pretty-html').default
//Not necessary
let inside_html=prettyHtml(json)
let anchorProperties={objectProperties:[],dataProperties:[]}
try{
    //mock unnecessary
    //anchorProperties=await classProperties(className,baseOntologyURI)
    //anchorProperties.objectProperties=await inferredRelationships.objectProperties(className,baseOntologyURI)
    //anchorProperties.dataProperties=await inferredRelationships.dataProperties(className,baseOntologyURI)
}catch(err){
    console.log(err)
    anchorProperties=[]
}
let listCalls="d-none"
let listModules="d-none"
let mapCall="block"
/* End pug vars */


html=pug.renderFile("./views/callEditor/mapCall.pug",{pretty:true,title:"",json,anchor:className,moduleName,callName,anchorProperties,html:inside_html, mapCall,listCalls,listModules})
global['window'] = { window } = (new JSDOM(html,{
    url: `http://localhost:${port}/admin/brapi/listcalls/${moduleName}/${callName}/map`,
    referrer: "https://example.com/",
    contentType: "text/html",
})).window;
global['document'] = window.document;
global['Element'] = window.Element;
Object.keys(window).forEach((key) => {
    global[key] = window[key];
})
global["$"] = require( "jquery" )( window );
global['Vue']=Vue
global['vSelect']=vSelect

let component=Vue.component("layer", {
    template:"<div></div>",
    props: {
    },
    data: function () {
        return {}
    }
})
const div = document.createElement('div')
const baseElement =  document.body
const container =  baseElement.appendChild(div)

HTMLBodyElement=document.body
let wrapper = testing.render(component,{
    store: null,
    routes: null,
    container,
    baseElement,
    attachTo: '#mapping'
})
console.log("hkjkjhk")





/*Multiple  direct*/
callAttribute="leadPersonName"
layer=0
inputAttribute="class"
inputValue="http://purl.org/ppeo/PPEO.owl#role"
callStrutureFragment={
    "_sparQL": [
        {
            "class": "http://purl.org/ppeo/PPEO.owl#study",
            "property": "hasPart"
        },
        {
            "class": "http://purl.org/ppeo/PPEO.owl#person",
            "property": "isRoleOf"
        },
        {
            "class": "http://purl.org/ppeo/PPEO.owl#person",
            "property": "hasName"
        }
    ],
    "_value": "Bob Robertson"
}

callStrutureNotInitialized="Bob Robertson"



//Test 1 single layer direct no initialized
//Test 1 single layer callStructureFragment should be exactly the same
//

//Test 2 multiple layers random layer change that is not last layer


//JS structures under test

saveEdits=require('./saveEdits.js')
loader=require("./loader.js")

console.log("Testing public/callEditor/saveEdits.js")

function loaded(){
    return new Promise((resolve,reject)=>{
        if (window.vmapping && window.vmapping._isVue===true && window.exports.layer) {
            resolve(true)
        } else {
            setTimeout(loaded,100)
        }
    })
}


describe("public/callEditor/saveEdits.js", function () {
    this.timeout(0)
    describe("Testing modifyCallStructure", function(){
        this.timeout(0)
        it("Single layers direct not initialized", async function(done) {
            this.timeout(0);
            let result=await loaded()

            //window.vmapping.$children[8].property="jkjkjkj"
            console.log("khkhk")
            console.log("Testing multiple layers direct")

            window.exports.modifyCallStructure(callAttribute,layer,inputAttribute,inputValue,callStrutureNotInitialized)
            console.log(callStrutureNotInitialized)
            done()
            //vmapping.$children[8].$vnode.elm.querySelector('input[name="property"]').dispatchEvent(new Event('change', {bubbles: true}))
        })
    })
})