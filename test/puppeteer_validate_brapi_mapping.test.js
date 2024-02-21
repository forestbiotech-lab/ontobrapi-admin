const puppeteer = require('puppeteer');
const fs=require('fs');
const http=require('http');
const path=require('path');
const {direct} = require("selenium-webdriver/lib/proxy");
const chai = require("chai");
const prettyHtml = require('json-pretty-html').default;
const browserURL = 'http://localhost:45131'  //debug port
const moduleName = "core"
const callName = "programs.json"
const testPagePort= 3000

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
    await firstPage.goto(`http://localhost:${testPagePort}/admin/brapi/listcalls/${moduleName}/${callName}/map`);
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
    },
    async getResultJSON(moduleName, callName) {
        return new Promise((resolve, reject) => {
            http.get(`http://localhost:${testPagePort}/admin/brapi/listcalls/${moduleName}/${callName}/result`, (res) => {
                const {statusCode} = res;
                const contentType = res.headers['content-type'];

                let error;
                // Any 2xx status code signals a successful response but
                // here we're only checking for 200.
                if (statusCode !== 200) {
                    error = new Error('Request Failed.\n' +
                        `Status Code: ${statusCode}`);
                } else if (!/^application\/json/.test(contentType)) {
                    error = new Error('Invalid content-type.\n' +
                        `Expected application/json but received ${contentType}`);
                }
                if (error) {
                    console.error(error.message);
                    // Consume response data to free up memory
                    res.resume();
                    reject(error)
                }
                res.setEncoding('utf8');
                let rawData = '';
                res.on('data', (chunk) => {
                    rawData += chunk;
                });
                res.on('end', () => {
                    try {
                        const parsedData = JSON.parse(rawData);
                        console.log(parsedData);
                        resolve(parsedData);
                    } catch (e) {
                        console.error(e.message);
                    }
                });

            }).on('error', (e) => {
                console.error(`Got error: ${e.message}`);
            });
        })
    }
}

//pagefunctions
let pf={
    toggleAttributeCollapse: async function(attributeName,attributeType,page) {
        let {selectorTypeClass,attributeTypeName} = pf.getSelectorType(attributeType)
        let attributeButton = await page.waitForSelector(`td.${selectorTypeClass}[attribute='${attributeName}'] button[attribute='${attributeName}']`)
        await attributeButton.click()
        await page.waitForTimeout(1000)
    },
    getSelectorType:function(attributeType){
        if (attributeType == "directAttribute") {
            selectorTypeClass = "direct-attribute"
            attributeTypeName = "Direct Attribute"

        } else if (attributeType == "objectAttribute") {
            selectorTypeClass = "object-attribute"
            attributeTypeName = "Object Attribute"
        } else if (attributeType == "arrayAttribute") {
            selectorTypeClass = "array-attribute"
            attributeTypeName = "Array Attribute"
        }
        return {selectorTypeClass,attributeTypeName}
    },
    vSelectTypeOption: async function(attributeName,attributeType,ontologyType,layer,page,collapseId) {
        collapseId = collapseId || `${attributeName}`
        let {selectorTypeClass,attributeTypeName} = pf.getSelectorType(attributeType)

        let vselect_attribute = await firstPage.waitForSelector(`td.${selectorTypeClass}[attribute="${attributeName}"] .collapse#${collapseId} [layer="${layer}"] .v-select`)
        await vselect_attribute.click()
        await firstPage.waitForTimeout(1000)


        let vselect_attribute_options = await page.$$(`td.${selectorTypeClass}[attribute="${attributeName}"] .collapse#${collapseId} [layer="${layer}"] .v-select li .${ontologyType}`)
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
    addLayer:async function(attributeName,attributeType,layer,page, collapseId){
        collapseId =   collapseId || attributeName
        let {selectorTypeClass,attributeTypeName} = pf.getSelectorType(attributeType)

        const addLayerButtonSelector = `td.${selectorTypeClass}[attribute="${attributeName}"] .collapse#${collapseId} [layer="${layer}"] button.add-new-layer`;
        let addLayerButton=await page.$$(addLayerButtonSelector)
        if(addLayerButton.length<1){
            console.log(`*****Fail***** [${attributeTypeName}] - Add layer button not found`)
        }
        await addLayerButton[0].click()
        await page.waitForTimeout(1000)
    },
    toggleRandomSubObject:async function (attributeName,attributeType,page){
        let collapseId=  `${attributeName}`
        let {selectorTypeClass,attributeTypeName} = pf.getSelectorType(attributeType)
        let sub_attributeButtons = await page.$$(`td.${selectorTypeClass}[attribute='${attributeName}'] .collapse#${collapseId} button[attribute|='${attributeName}']`)
        let option=tools.random(sub_attributeButtons.length)
        //TODO get sub-attribute name
        await sub_attributeButtons[option].click()
        await page.waitForTimeout(1000)
        let buttonSelector=`td.${selectorTypeClass}[attribute='${attributeName}'] .collapse#${collapseId} button[attribute|='${attributeName}']`


        collapseId = await page.evaluate((buttonSelector,option) => {
            const buttonElement = document.querySelectorAll(buttonSelector)[option];
            return buttonElement ? buttonElement.attributes.attribute.value : null;
        }, buttonSelector,option);

        return collapseId
    },
    toggleSubObject:async function (attributeName,attributeType,page,subAttributeName){
        let collapseId=  `${attributeName}`
        let {selectorTypeClass,attributeTypeName} = pf.getSelectorType(attributeType)
        let sub_attributeButtons = await page.$$(`td.${selectorTypeClass}[attribute='${attributeName}'] .collapse#${collapseId} button[attribute='${attributeName}-${subAttributeName}']`)
        await sub_attributeButtons[0].click()
        await page.waitForTimeout(1000)
    }
}

async function directSetup(attributeName) {
    let attributeType = "directAttribute"
    let layer=0
    attributeName = attributeName || "abbreviation"
    let type="objectProperty"
    let attributeTypeName, selectorTypeClass, collapseId


    firstPage = await setupEnvironment(moduleName, callName)
    await pf.toggleAttributeCollapse(attributeName,attributeType,firstPage)
    const {className,propertyName} = await pf.vSelectTypeOption(attributeName,attributeType,type,layer,firstPage)

    //const directRows = (await firstPage.$$(`td.${selectorTypeClass}`))  //???
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
    await pf.toggleAttributeCollapse(attributeName,attributeType,firstPage)
    await pf.addLayer(attributeName,attributeType,layer-1,firstPage)
    const {className,propertyName} = await pf.vSelectTypeOption(attributeName,attributeType,type,layer,firstPage)
    let callStructure = await tools.exfiltrate("callStructure",firstPage)
    let callStructureFragment = tools.extractCallStructureFragment(callStructure, attributeName)

    return {callStructureFragment,className,propertyName}
}

async function objectAddLayer(attributeName,attributeType,subAttributeName) {
    attributeType = attributeType || "directAttribute"
    let layer=1
    let ontologyType="objectProperty"
    let collapseId=attributeName
    if(subAttributeName){
        collapseId+=`-${subAttributeName}`
    }

    firstPage = await setupEnvironment(moduleName, callName)
    await pf.toggleAttributeCollapse(attributeName,attributeType,firstPage)
    await pf.toggleSubObject(attributeName,attributeType,firstPage,subAttributeName)
    await pf.addLayer(attributeName,attributeType,layer-1,firstPage,collapseId)
    collapseId=`${attributeName}-${subAttributeName}`
    const {className,propertyName} = await pf.vSelectTypeOption(attributeName,attributeType,ontologyType,layer,firstPage,collapseId)
    let callStructure = await tools.exfiltrate("callStructure",firstPage)
    let callStructureFragment = tools.extractCallStructureFragment(callStructure, attributeName)

    return {callStructureFragment,className,propertyName}
}

async function objectSetup(attributeName,attributeType,subAttributeName) {
    attributeType =  attributeType || "objectAttribute"
    let layer=0
    attributeName = attributeName || "additionalInfo"
    let ontologyType="objectProperty"
    let attributeTypeName, selectorTypeClass, collapseId
    subAttributeName = subAttributeName || null

    let firstPage = await setupEnvironment(moduleName, callName)
    await pf.toggleAttributeCollapse(attributeName,attributeType,firstPage)

    if(subAttributeName){
        collapseId=`${attributeName}-${subAttributeName}`
        await pf.toggleSubObject(attributeName,attributeType,firstPage,subAttributeName)
    }else {
        collapseId = await pf.toggleRandomSubObject(attributeName, attributeType, firstPage)
        subAttributeName=collapseId.split("-")[1]
    }

    const {className,propertyName} = await pf.vSelectTypeOption(attributeName,attributeType,ontologyType,layer,firstPage,collapseId)

    let callStructure = await tools.exfiltrate("callStructure",firstPage)
    let callStructureFragment = tools.extractCallStructureFragment(callStructure, attributeName)
    return {callStructureFragment,className,propertyName,subAttributeName}
}


//**************************************** TESTS ****************************************


describe("Direct test <abbreviation>", function () {
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
    it("Instance direct attribute", async function () {
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
    it("Change layer 0 (Remove all other layers)", async function () {
        let result=await directSetup()
        let callStructureFragment=result.callStructureFragment
        //works for array and object, but not for direct
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

describe("Object test random attribute non instanced", function () {
    this.timeout(10000)

})

describe("Object <additionalInfo> Sub-attribute Direct single layer", function () {
    this.timeout(10000)
    //before prepare the call structure
    let subAttribute;

    it("First layer", async function () {
        let result=await objectSetup()
        let callStructureFragment=result.callStructureFragment
        subAttribute=result.subAttributeName
        chai.assert.typeOf(callStructureFragment, 'object')
        chai.assert.exists(callStructureFragment[subAttribute])
        chai.assert.typeOf(callStructureFragment[subAttribute], "object")
        chai.assert.exists(callStructureFragment[subAttribute]._sparQL)
        chai.assert.typeOf(callStructureFragment[subAttribute]._sparQL, "array")
        chai.assert.equal(callStructureFragment[subAttribute]._sparQL.length, 1)
        chai.assert.equal(callStructureFragment[subAttribute]._sparQL[0].class, result.className)
        chai.assert.equal(callStructureFragment[subAttribute]._sparQL[0].property, result.propertyName)
        chai.assert.exists(callStructureFragment[subAttribute]._value)
    })
    it("Add layer", async function () {
        let result=await objectAddLayer("additionalInfo","objectAttribute",subAttribute)
        let callStructureFragment=result.callStructureFragment
        chai.assert.typeOf(callStructureFragment, 'object')
        chai.assert.exists(callStructureFragment[subAttribute])
        chai.assert.typeOf(callStructureFragment[subAttribute], "object")
        chai.assert.exists(callStructureFragment[subAttribute]._sparQL)
        chai.assert.typeOf(callStructureFragment[subAttribute]._sparQL, "array")
        chai.assert.equal(callStructureFragment[subAttribute]._sparQL.length, 2)
        chai.assert.equal(callStructureFragment[subAttribute]._sparQL[1].class, result.className)
        chai.assert.equal(callStructureFragment[subAttribute]._sparQL[1].property, result.propertyName)
        chai.assert.exists(callStructureFragment[subAttribute]._value)
    })
    it("Change layer 0 (Remove all other layers)", async function () {
        let result=await objectSetup("additionalInfo","objectAttribute",subAttribute)
        let callStructureFragment=result.callStructureFragment
        chai.assert.typeOf(callStructureFragment, 'object')
        chai.assert.exists(callStructureFragment[subAttribute])
        chai.assert.typeOf(callStructureFragment[subAttribute], "object")
        chai.assert.exists(callStructureFragment[subAttribute]._sparQL)
        chai.assert.typeOf(callStructureFragment[subAttribute]._sparQL, "array")
        chai.assert.equal(callStructureFragment[subAttribute]._sparQL.length, 1)
        chai.assert.equal(callStructureFragment[subAttribute]._sparQL[0].class, result.className)
        chai.assert.equal(callStructureFragment[subAttribute]._sparQL[0].property, result.propertyName)
        chai.assert.exists(callStructureFragment[subAttribute]._value)
    })
})

describe("Array <externalReferences> Sub-attribute Direct single layer", function () {
    this.timeout(10000)
    //before prepare the call structure
    let subAttribute;
    it("First layer", async function () {
        let result=await objectSetup("externalReferences","arrayAttribute")
        let callStructureFragment=result.callStructureFragment
        subAttribute=result.subAttributeName
        chai.assert.typeOf(callStructureFragment, 'array')
        //It prepends an object to the array but keeps the original array values.
        //The addition of a
        chai.assert.exists(callStructureFragment[0][subAttribute])
        chai.assert.typeOf(callStructureFragment[0][subAttribute], "object")
        chai.assert.exists(callStructureFragment[0][subAttribute]._sparQL)
        chai.assert.typeOf(callStructureFragment[0][subAttribute]._sparQL, "array")
        chai.assert.equal(callStructureFragment[0][subAttribute]._sparQL.length, 1)
        chai.assert.equal(callStructureFragment[0][subAttribute]._sparQL[0].class, result.className)
        chai.assert.equal(callStructureFragment[0][subAttribute]._sparQL[0].property, result.propertyName)
        chai.assert.exists(callStructureFragment[0][subAttribute]._value)
    })
    it("Add layer", async function () {
        let result=await objectAddLayer("externalReferences","arrayAttribute",subAttribute)
        let callStructureFragment=result.callStructureFragment
        chai.assert.typeOf(callStructureFragment, 'array')
        //It prepends an object to the array but keeps the original array values.
        //The addition of a
        chai.assert.exists(callStructureFragment[0][subAttribute])
        chai.assert.typeOf(callStructureFragment[0][subAttribute], "object")
        chai.assert.exists(callStructureFragment[0][subAttribute]._sparQL)
        chai.assert.typeOf(callStructureFragment[0][subAttribute]._sparQL, "array")
        chai.assert.equal(callStructureFragment[0][subAttribute]._sparQL.length, 2)
        chai.assert.equal(callStructureFragment[0][subAttribute]._sparQL[1].class, result.className)
        chai.assert.equal(callStructureFragment[0][subAttribute]._sparQL[1].property, result.propertyName)
        chai.assert.exists(callStructureFragment[0][subAttribute]._value)
    })
    it("Change layer 0 (Remove all other layers)", async function () {
        let result=await objectSetup("externalReferences","arrayAttribute",subAttribute)
        let callStructureFragment=result.callStructureFragment
        chai.assert.typeOf(callStructureFragment, 'array')
        //It prepends an object to the array but keeps the original array values.
        //The addition of a
        chai.assert.exists(callStructureFragment[0][subAttribute])
        chai.assert.typeOf(callStructureFragment[0][subAttribute], "object")
        chai.assert.exists(callStructureFragment[0][subAttribute]._sparQL)
        chai.assert.typeOf(callStructureFragment[0][subAttribute]._sparQL, "array")
        chai.assert.equal(callStructureFragment[0][subAttribute]._sparQL.length, 1)
        chai.assert.equal(callStructureFragment[0][subAttribute]._sparQL[0].class, result.className)
        chai.assert.equal(callStructureFragment[0][subAttribute]._sparQL[0].property, result.propertyName)
        chai.assert.exists(callStructureFragment[0][subAttribute]._value)
    })
})


function setupCallStructureForResultVerification(moduleName,callName,callJSON) {
    callJSON.result.data[0].programName = {
        "_sparQL": [
            {
                "class": "http://purl.org/ppeo/PPEO.owl#investigation",
                "property": "hasName"
            }
        ],
        "_value": "Tomatillo_Breeding_Program"
    }
    //Sets layer one test on object
    //Sets layer two test on object
    callJSON.result.data[0].additionalInfo= {
        "additionalProp1": {
            "_sparQL": [
                {
                    "class": "http://purl.org/ppeo/PPEO.owl#investigation",
                    "property": "hasName"
                }
            ],
            "_value": "string"
        },
        "additionalProp2": {
            "_sparQL": [
                {
                    "class": "http://purl.org/ppeo/PPEO.owl#study",
                    "property": "hasPart"
                },
                {
                    "class": "http://purl.org/ppeo/PPEO.owl#study",
                    "property": "hasName"
                }
            ],
            "_value": "string"
        },
        "additionalProp3":"Testing string"
    }
    callJSON.result.data[0].externalReferences = [
        {
            "referenceID": {
                "_sparQL": [
                    {
                        "class": "http://purl.org/ppeo/PPEO.owl#role",
                        "property": "hasPersonWithRole"
                    },
                    {
                        "class": "nodeID://b11077",
                        "property": "isRoleOfPersonIn"
                    }
                ],
                "_value": "doi:10.155454/12341234"
            },
            "referenceSource": {
                "_sparQL": [
                    {
                        "class": "http://purl.org/ppeo/PPEO.owl#study",
                        "property": "hasPart"
                    },
                    {
                        "class": "http://purl.org/ppeo/PPEO.owl#study",
                        "property": "hasName"
                    }
                ],
                "_value": "DOI"
            }
        },
        {
            "referenceID": "http://purl.obolibrary.org/obo/ro.owl",
            "referenceSource": "OBO Library"
        },
        {
            "referenceID": "75a50e76",
            "referenceSource": "Remote Data Collection Upload Tool"
        }
    ]
    fs.writeFileSync(`components/modules/${moduleName}/maps/${callName}`, JSON.stringify(callJSON, null, 2))
}


describe("Test json output", function () {
    this.timeout(10000)
    //Hardcoded expectations, based on vitis dataset


    let {callPrettyJSON,callJSON} = tools.getJSON(moduleName,callName)
    let backupJSON=callJSON
    let resultJSON;

    before(async ()=>{
        setupCallStructureForResultVerification(moduleName,callName,callJSON)
        resultJSON=await tools.getResultJSON(moduleName,callName)
    })
    it("Test json output", async function () {
        chai.assert.exists(resultJSON)
    })
    it("Direct attribute single layer", async function () {
        chai.assert.exists(resultJSON.result.data[0].programName)
        chai.assert.typeOf(resultJSON.result.data[0].programName,"string")
        chai.assert.equal(resultJSON.result.data[0].programName, "THERMAL REQUIREMENTS, DURATION AND PRECOCITY OF PHENOLOGICAL STAGES OF GRAPEVINE CULTIVARS OF THE PORTUGUESE COLLECTION")
    })
    it("Direct attribute multiple layers", async function () {
        //chai.assert.exists(resultJSON.result.data[0].programName)
        //chai.assert.typeOf(resultJSON.result.data[0].programName,"string")
        //chai.assert.equal(resultJSON.result.data[0].programName._value, "THERMAL REQUIREMENTS, DURATION AND PRECOCITY OF PHENOLOGICAL STAGES OF GRAPEVINE CULTIVARS OF THE PORTUGUESE COLLECTION")
    })
    it("Object attribute single layer", async function () {
        chai.assert.exists(resultJSON.result.data[0].additionalInfo)
        chai.assert.typeOf(resultJSON.result.data[0].additionalInfo,"object")
        chai.assert.exists(resultJSON.result.data[0].additionalInfo.additionalProp1)
        chai.assert.typeOf(resultJSON.result.data[0].additionalInfo.additionalProp1,"string")
        chai.assert.equal(resultJSON.result.data[0].additionalInfo.additionalProp1, "THERMAL REQUIREMENTS, DURATION AND PRECOCITY OF PHENOLOGICAL STAGES OF GRAPEVINE CULTIVARS OF THE PORTUGUESE COLLECTION")
    })
    it("Object attribute multiple layers", async function () {
        chai.assert.exists(resultJSON.result.data[0].additionalInfo)
        chai.assert.typeOf(resultJSON.result.data[0].additionalInfo,"object")
        chai.assert.exists(resultJSON.result.data[0].additionalInfo.additionalProp2)
        chai.assert.typeOf(resultJSON.result.data[0].additionalInfo.additionalProp2,"string")
        chai.assert.equal(resultJSON.result.data[0].additionalInfo.additionalProp2, "THERMAL REQUIREMENTS, DURATION AND PRECOCITY OF PHENOLOGICAL STAGES OF GRAPEVINE CULTIVAR Alfrocheiro T OF THE PORTUGUESE COLLECTION")
    })

    it("Array attribute single layer", async function () {

    })

    it("Array attribute multiple layers", async function () {
        chai.assert.exists(resultJSON.result.data[0].externalReferences)
        chai.assert.typeOf(resultJSON.result.data[0].externalReferences,"array")
        chai.assert.equal(resultJSON.result.data[0].externalReferences.length,34)
        chai.assert.typeOf(resultJSON.result.data[0].externalReferences[0].referenceSource,"THERMAL REQUIREMENTS, DURATION AND PRECOCITY OF PHENOLOGICAL STAGES OF GRAPEVINE CULTIVAR Alfrocheiro T OF THE PORTUGUESE COLLECTION")
        chai.assert.equal(resultJSON.result.data[0].externalReferences[33].referenceSource, "THERMAL REQUIREMENTS, DURATION AND PRECOCITY OF PHENOLOGICAL STAGES OF GRAPEVINE CULTIVAR Viosinho B OF THE PORTUGUESE COLLECTION")
    })
    after(function () {
        fs.writeFileSync(`components/modules/${moduleName}/maps/${callName}`, JSON.stringify(backupJSON, null, 2))
    })

})


//Validate output call
