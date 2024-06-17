// Import our custom CSS
import '../scss/styles.scss'

// Import all of Bootstrap's JS
import * as bootstrap from 'bootstrap'
import Vue from 'vue/vue.esm.browser.min';
import vSelect from "vue-select";


window.Vue = Vue
window.vSelect=vSelect
window.bootstrap=bootstrap
Object.keys(buildingblocks).forEach(key=>window[key]=buildingblocks[key])
Object.keys(bootstrap).forEach(key=>window[key]=bootstrap[key])