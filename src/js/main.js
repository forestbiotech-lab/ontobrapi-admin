// Import our custom CSS
import '../scss/styles.scss'

// Import all of Bootstrap's JS
import * as bootstrap from 'bootstrap'

//const wp=require(".././webpack.config")
//console.log(wp)
import Vue from 'vue/dist/vue.esm.browser';
import {VueSelect} from "vue-select";
const buildingblocks=require("@netbofia/buildingblocks")

/* possible deprecation due to use of plugin */
function insertScripts(names) {
    let collection=[]
    for(let name of names) {
        let element = document.createElement('script');
        element.src = "/admin/public/webpack/"+name+".js"
        document.body.appendChild(element)
    }
}
//let names=webpack.entry.map(pkg=>pkg.filename)
let names=['cookieconsent']
//insertScripts(names);

window.Vue = Vue
window.VueSelect=VueSelect
Object.keys(buildingblocks).forEach(key=>window[key]=buildingblocks[key])