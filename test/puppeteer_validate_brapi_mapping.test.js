const puppeteer = require('puppeteer');
const fs=require('fs');
const path=require('path');
const {direct} = require("selenium-webdriver/lib/proxy");
const chai = require("chai");
const prettyHtml = require('json-pretty-html').default;
const browserURL = 'http://localhost:37679'  //debug port
const moduleName = "core"
const callName = "programs.json"

/*
  Check chrome://version for details
  userdata, remote-debugging port and others
  To connect to running session user puppeteer.connect(url)
  the url is localhost and the port running the remote-debugging
 */

let browser, firstPage, pages;

/**
 * This code snippet defines an asynchronous function called setupEnvironment which sets up the environment for a given module and call. It uses the Puppeteer library to interact with a browser, modifies a JSON object, writes the JSON to a file, brings a page to the front, and navigates to a specific URL.
 *
 * Asynchronously sets up the environment for the given module and call.
 *
 * @param {string} moduleName - the name of the module
 * @param {string} callName - the name of the call
 * @return {Promise<void>} returns a promise with no value
 */
async function setupEnvironment(moduleName, callName) {
    //Setup config
    if (process.platform == "darwin") {
        system = "mac"
    } else if (process.platform == "linux") {
        root = "firworks"
    }

    let opts = {
        headless: false,
        //executablePath:"/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome",
        executablePath: "/opt/google/chrome/google-chrome",
        //devtools: true,
        //slowMo: 250, // slow down by 250ms
        //userDataDir: "/Users/brunocosta/Library/Application Support/Google/Chrome"
        userDataDir: "/home/brunocosta/.cache/JetBrains/WebStorm2023.3/chrome-user-data-37679"
    }
    //Start browser
    //const browser = await puppeteer.launch(opts);
    // Lookup on chrome session "chrome://"

    console.log("    Starting puppeteer")
    //this.timeout(1000)
    browser = await puppeteer.connect({browserURL, defaultViewport: null})
    pages = await browser.pages()

    firstPage = pages[0]
    await firstPage.bringToFront();
    await firstPage.goto(`http://localhost:3000/admin/brapi/listcalls/${moduleName}/${callName}/map`);
    await tools.testStateOfLoading(firstPage)
    return firstPage
}

let tools={
    exfiltrate:async function(name,page) {
        let newValue = await page.evaluate((name) => {
            return JSON.stringify(window[name], null, 2)
        }, name);
        return newValue
    },
    extractCallStructureFragment:function (callStructure, attributeName) {
        callStructure = JSON.parse(callStructure)
        return callStructure.result.data[0][attributeName]
    },
    random:function(max) {
        return Math.floor(Math.random() * max);
    },
    getJSON:function(moduleName, callName) {
        let json = JSON.parse(fs.readFileSync(`components/modules/${moduleName}/maps/${callName}`))
        return {callPrettyJSON: prettyHtml(json), callJSON: json}
    },
    inject:async function(name, value) {
        await testStateOfLoading()
        let newValue = await firstPage.evaluate((name) => window[name] = "value", name);
        console.log(`${name}: ${newValue}`);
    },
    getStateOfLoading:async function(page) {
        return await page.evaluate(() => {
            const loading = document.querySelector('.spinner-grow')
            return JSON.parse(JSON.stringify(getComputedStyle(loading)))
        })
    },
    testStateOfLoading:async function (page) {
        let stateOfLoading = await tools.getStateOfLoading(page)
        if (stateOfLoading.display == undefined || stateOfLoading.display == 'block') {
            await page.waitForTimeout(1500);
            console.log("    Waiting for GUI to load")
            await tools.testStateOfLoading(page)
        } else if (stateOfLoading.display == 'none') {
            console.log("    Page Loaded!")
        }
    },
    setCallMapping:function(moduleName, callName) {
        let {callPrettyJSON,callJSON} = tools.getJSON(moduleName, callName)
        //Eventually restruture it to make the first attribute a made up test attribute
        callJSON.result.data[0].abbreviation = "P2"
        fs.writeFileSync(`components/modules/${moduleName}/maps/${callName}`, JSON.stringify(callJSON, null, 2))
        return callJSON
    }
}

//pagefunctions
let pf={
    toggleAttributeCollapse: async function(attributeName,page) {
        let abbreviationButton = await page.waitForSelector(`button[attribute='${attributeName}']`)
        await abbreviationButton.click()
        await firstPage.waitForTimeout(1000)
    },
    vSelectTypeOption: async function(attributeName,attributeType,type,layer,page) {
        let collapseId =  `${attributeName}`
        if (attributeType == "directAttribute") {
            selectorTypeClass = "direct-attribute"
            attributeTypeName = "Direct Attribute"
        } else if (attributeType == "objectAttribute") {
            selectorTypeClass = "object-attribute"
            attributeTypeName = "Object Attribute"
        }

        let vselect_attribute = await firstPage.waitForSelector(`td.${selectorTypeClass}[attribute="${attributeName}"] .collapse#${collapseId} [layer="${layer}"] .v-select`)
        await vselect_attribute.click()
        await firstPage.waitForTimeout(1000)


        let vselect_attribute_options = await page.$$(`td.${selectorTypeClass}[attribute="${attributeName}"] .collapse#${collapseId} [layer="${layer}"] .v-select li .${type}`)
        if (vselect_attribute_options < 1) {
            console.log(`*****Fail***** [${attributeTypeName}] - V-select has no options`)
        }
        let optionRandom = tools.random(vselect_attribute_options.length)
        await vselect_attribute_options[optionRandom].click()
        await page.waitForTimeout(1000)

        const inputSelectorClass = `td.${selectorTypeClass}[attribute="${attributeName}"] .collapse#${collapseId} [layer="${layer}"] input[name="class"]`;
        const className = await page.evaluate(inputSelectorClass => {
            const inputElement = document.querySelector(inputSelectorClass);
            return inputElement ? inputElement.value : null;
        }, inputSelectorClass);
        const inputSelectorProperty = `td.${selectorTypeClass}[attribute="${attributeName}"] .collapse#${collapseId} [layer="${layer}"] input[name="property"]`;
        const propertyName = await page.evaluate(inputSelectorProperty => {
            const inputElement = document.querySelector(inputSelectorProperty);
            return inputElement ? inputElement.value : null;
        }, inputSelectorProperty);

        return {className,propertyName}
    },
    addLayer:async function(attributeName,attributeType,layer,page) {
        let collapseId =  `${attributeName}`
        if (attributeType == "directAttribute") {
            selectorTypeClass = "direct-attribute"
            attributeTypeName = "Direct Attribute"
        } else if (attributeType == "objectAttribute") {
            selectorTypeClass = "object-attribute"
            attributeTypeName = "Object Attribute"
        }
        const addLayerButtonSelector = `td.${selectorTypeClass}[attribute="${attributeName}"] .collapse#${collapseId} [layer="${layer}"] button.add-new-layer`;
        let addLayerButton=await page.$$(addLayerButtonSelector)
        if(addLayerButton.length<1){
            console.log(`*****Fail***** [${attributeTypeName}] - Add layer button not found`)
        }
        await addLayerButton[0].click()
        await page.waitForTimeout(1000)
    }
}

async function directSetup() {
    let attributeType = "directAttribute"
    let layer=0
    let attributeName = "abbreviation"
    let type="objectProperty"

    let attributeTypeName, selectorTypeClass, collapseId



    firstPage = await setupEnvironment(moduleName, callName)
    const directRows = (await firstPage.$$(`td.${selectorTypeClass}`))



    await pf.toggleAttributeCollapse(attributeName,firstPage)
    const {className,propertyName} = await pf.vSelectTypeOption(attributeName,attributeType,type,layer,firstPage)




    /*collapseId=await (await directRows[attributeChoice].$(`button.${selectorTypeClass}`)).evaluate(el => {
        //window.scrollBy(500, window.innerHeight);
        el.click();
        var buttons=el.closest('td').querySelectorAll('p>button.btn-primary');
        var buttonNumber=Math.floor(Math.random()*buttons.length);
        buttons[buttonNumber].click();
        return buttons[buttonNumber].getAttribute('attribute')
    })*/

    //Only Object properties


    let callStructure = await tools.exfiltrate("callStructure",firstPage)
    let callStructureFragment = tools.extractCallStructureFragment(callStructure, attributeName)

    /*const setTextInputValue = (async (page, selector, value) => {
        await page.waitForSelector(selector);
        await page.evaluate((data) => {
            return document.querySelector(data.selector).value = data.value
        }, {selector, value})
    })*/
    //})
    return {callStructureFragment,className,propertyName}
}

async function directSetupAddLayer() {
    let attributeType = "directAttribute"
    let layer=1
    let attributeName = "abbreviation"
    let type="objectProperty"

    let attributeTypeName, selectorTypeClass, collapseId



    firstPage = await setupEnvironment(moduleName, callName)
    await pf.toggleAttributeCollapse(attributeName,firstPage)
    await pf.addLayer(attributeName,attributeType,layer-1,firstPage)
    const {className,propertyName} = await pf.vSelectTypeOption(attributeName,attributeType,type,layer,firstPage)



    let callStructure = await tools.exfiltrate("callStructure",firstPage)
    let callStructureFragment = tools.extractCallStructureFragment(callStructure, attributeName)

    return {callStructureFragment,className,propertyName}
}



describe("Direct test", function () {
    this.timeout(10000)
    let callJSON;
    before(function(){
        callJSON=tools.setCallMapping(moduleName, callName)
    })
    it("Validate Mapping scheme for abbreviation", async function () {
        chai.assert.typeOf(callJSON, 'object')
        chai.assert.exists(callJSON.result)
        chai.assert.exists(callJSON.result.data)
        chai.assert.exists(callJSON.result.data[0])
        chai.assert.exists(callJSON.result.data[0].abbreviation)
        chai.assert.equal(callJSON.result.data[0].abbreviation, "P2")
    })
    it("Direct non instanced", async function () {
        let result=await directSetup()
        let callStructureFragment=result.callStructureFragment
        chai.assert.typeOf(callStructureFragment, 'object')
        chai.assert.exists(callStructureFragment._sparQL)
        chai.assert.exists(callStructureFragment._value)
        chai.assert.typeOf(callStructureFragment._sparQL, "array")
        chai.assert.equal(callStructureFragment._value, "P2")
        chai.assert.equal(callStructureFragment._sparQL.length, 1)
        chai.assert.equal(callStructureFragment._sparQL[0].class, result.className)
        chai.assert.equal(callStructureFragment._sparQL[0].property, result.propertyName)
    })
    after(async function (){
        await browser.disconnect()
    })
})

describe("Direct test with layers", function () {
    this.timeout(10000)
    it("Direct instanced add layer", async function () {
        let result=await directSetupAddLayer()
        let callStructureFragment=result.callStructureFragment
        chai.assert.typeOf(callStructureFragment, 'object')
        chai.assert.exists(callStructureFragment._sparQL)
        chai.assert.exists(callStructureFragment._value)
        chai.assert.typeOf(callStructureFragment._sparQL, "array")
        chai.assert.equal(callStructureFragment._value, "P2")
        chai.assert.equal(callStructureFragment._sparQL.length, 2)
        chai.assert.equal(callStructureFragment._sparQL[1].class, result.className)
        chai.assert.equal(callStructureFragment._sparQL[1].property, result.propertyName)
    })
})