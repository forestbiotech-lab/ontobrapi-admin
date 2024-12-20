//---------------------------- Vue data handling --------------------------------------------------------------
async function loadSubItemObject() {
    Vue.component('subitemObject', {
        // Loads a collapse component that can be used as a nested element
        // Loads a series of dynamic layers
        template: await getTemplate("template-object"),
        props: {
            subItem: {type: String},
            attribute: {type: String},
            subType: {type: String},
            callStructure: {type: Object},
            dataProperties: {type: Object},
            objectProperties: {type: Object}
        },
        computed: {
            mapping: function () {
                if (this.callStructure.result) {
                    if(this.subType=="object"){
                        if (this.callStructure.result.data[0][this.attribute])
                            return this.callStructure.result.data[0][this.attribute]
                    }else if( this.subType=="array"){
                        if (this.callStructure.result.data[0][this.attribute][0])
                            return this.callStructure.result.data[0][this.attribute][0]
                    }
                } else {
                    return {}
                }
            }

        },
        data: function () {
            return {
                allowChangeName:false,
                newAttribute:""
            }
        },
        methods: {
            activateChangeAttributeName(){
                this.allowChangeName=true
            },
            setNewAttribute: function(val){
                if(this.allowChangeName && this.newAttribute!==""){
                    //this.mapping[this.newAttribute]=this.mapping[this.subItem]
                    this.$set(this.mapping,this.newAttribute,this.mapping[this.subItem])
                    delete this.mapping[this.subItem]
                    //badge placement
                    saveCallStruture(event.target)
                    this.subItem=this.newAttribute
                }

            },
            changeAttributeName(){
                event.target

            }

        }
    })
}
Vue.component('test',{
    template: $('#template-test').clone()[0],
    props:{
        tester:{type: String}
    }
})
async function dynamicLayer(name) {
    Vue.component(name, {
        template:await getTemplate('template-layer'),
        //template: $('#template-layer').clone()[0],
        props: {
            callStructure: {type: Object},
            dataProperties: {type: Object},
            objectProperties: {type: Object},
            layer: {type: Number},
            attribute: {type: String},
            subType:{type:String},
            subItem: {type:String}
        },
        data: function () {
            return {}
        },
        computed: {
            mapping: function () {
                if (this.callStructure.result) {
                    if (this.callStructure.result.data[0][this.attribute])
                        if(this.subType == "object") {
                            return this.callStructure.result.data[0][this.attribute][this.subItem]
                        }else if(this.subType == "array"){
                            //TODO possibly deal with multiple values that are different
                            if(this.callStructure.result.data[0][this.attribute][0] instanceof Object){
                                return this.callStructure.result.data[0][this.attribute][0][this.subItem]
                            }else{
                                //TODO Not sure what is appropriate
                                return {}
                            }
                        }else {
                            return this.callStructure.result.data[0][this.attribute]
                        }
                } else {
                    return {}
                }
            },
            className: function () {
                if (this.mapping._sparQL) {
                    return this.mapping._sparQL[this.layer].class
                } else {
                    return ""
                }
            },
            property: function () {
                if (this.mapping._sparQL) {
                    return this.mapping._sparQL[this.layer].property
                } else {
                    return ""
                }
            },
            anchor: function () {
                if (this.callStructure._anchor) {
                    if (this.layer == 0) {
                        return this.callStructure._anchor.class
                    } else if (this.layer > 0) {
                        //TODO check if it's a object property before adding new layer
                        try {
                            let lastClass = this.mapping._sparQL[this.layer - 1].class.split("#")[1]
                            if (this.objectProperties[lastClass] === undefined) {
                                this.loadMissingProperty(lastClass)
                            }
                            return lastClass
                        } catch (e) {
                            console.log("Error getting new anchor for this layer: ", e)
                            return this.callStructure._anchor.class
                        }
                    }
                } else {
                    return ""
                }
            },
            layers:function(){
                return this.mapping._sparQL.length
            },
            canHideLayer: function () {
                try {
                    if (this.className.split("#")[1] === undefined)
                        return true
                    else if (this.className.split("#")[1] !== this.anchor && this.anchor !== "" && (this.layer+1) == this.layers ) //Only make sense ig we have an Object Property
                        return false
                    else
                        return true
                } catch (e) {
                    //If it catches an error it's not ready so hide
                    return true
                }
            },
        },
        methods: {
            async loadMissingProperty(className) {
                this.objectProperties[className] = await $.get(`/admin/query/inferred/objectProperty/${className}`)
                this.dataProperties[className] = await $.get(`/admin/query/inferred/dataProperty/${className}`)
            },
            loadValues(id) {
                let that = this
                id = id || this.attribute
                this.$children.filter(child => child.$attrs.attribute == id)
                    .forEach(vselect => {
                        try {
                            let className = vselect.$attrs.anchor
                            let properties = that.objectProperties[className].concat(that.dataProperties[className])
                            let layer = parseInt(that.layer)
                            //let layer = parseInt(vselect.$attrs.layer)  Old
                            //if (layer == 0) {
                            //this.mapping[id]=[{className:"",property:""}]
                            //}else if (layer >= this.mapping.length && layer != 0) {
                            //this.mapping[id].push({className:"",property:""})
                            //} else {
                            //Not necessary it aready exists
                            //this.mapping[id][layer]={className:"",property:""}
                            //}  //TODO layer0 only
                            vselect.options = properties;
                            vselect.loading = false
                        } catch (e) {
                            console.log("Failed to load Properties")
                        }
                    })

            },
            saveInputValue(ev, dataType) {
                //TODO deprecated since required setValueForLayer first
                let input = event ? event.target : $(`#${this.attribute} [layer|= ${this.layer}] input[name|=${dataType}]:nth(0)`)
                dataType = dataType || input.name

                let value,targetLabel;
                if(dataType == "class"){
                    if (input.tagName=="INPUT"){
                        input.value
                    }else{
                        value = this.className

                    }
                }else if(dataType == "property"){
                    if (input.tagName=="INPUT"){
                        input.value
                    }else{
                        value = this.property
                    }
                }

                if(input instanceof HTMLElement){
                    targetLabel =$(`#${this.attribute} [layer|= ${this.layer}] input[name|=${dataType}]:nth(0)`).closest('.form-group').children('label').children('.badge-holder')
                }else if(input.jquery){
                    targetLabel = input.closest('.form-group').children('label').children('.badge-holder')
                }
                //modifyCallStructure(this.attribute, this.layer, dataType, value, this.mapping)
                saveCallStruture(targetLabel)
            },
            setValueForLayer(val) {
                //TODO subType Object and Array
                if (this.mapping._sparQL) {
                    this.mapping._sparQL[this.layer].class = val.class
                    this.mapping._sparQL[this.layer].property = val.label
                    //Test if the layer that was just saved was a lower lever. In that case the levels above should be removed to be corrected
                    if (this.layer < this.mapping._sparQL.length - 1) {
                        for (let i = this.mapping._sparQL.length - 1; i > this.layer; i--) {
                            if(this.subType=="object"){
                                this.callStructure.result.data[0][this.attribute][this.subItem]._sparQL.pop()
                            }else if(this.subType=="array"){
                                this.callStructure.result.data[0][this.attribute][0][this.subItem]._sparQL.pop()
                            }else{
                                this.callStructure.result.data[0][this.attribute]._sparQL.pop()
                            }
                        }
                    }
                } else {
                    let prevValue = this.mapping
                    if(this.subType=="object") {
                        this.callStructure.result.data[0][this.attribute][this.subItem] = {
                            _sparQL: [{
                                class: val.class,
                                property: val.label
                            }], _value: prevValue
                        }
                    }else if(this.subType=="array"){
                        this.callStructure.result.data[0][this.attribute][0][this.subItem] = {
                            _sparQL: [{
                                class: val.class,
                                property: val.label
                            }], _value: prevValue
                        }
                    }else {
                        this.callStructure.result.data[0][this.attribute] = {
                            _sparQL: [{
                                class: val.class,
                                property: val.label
                            }], _value: prevValue
                        }
                    }
                }
                this.saveInputValue(null, "class")
                this.saveInputValue(null, "property")
                let className = val.class.split("#")[1]
                if (this.anchor != className)
                    this.loadMissingProperty(className)
            },
            addNewLayer() {
                let layers = this.mapping._sparQL
                if (layers) {
                    layers.push({class: "", property: ""})
                } else {
                    let value = this.mapping
                    this.callStructure.result.data[0][this.attribute] = {_sparQL: [], _value: value}
                }
            },
        },
        mounted: function () {
            //this.loadValues()
            //addNewLayerOnClick(element)
            //addSelectPropertyOnChange(element)

        }
    })
}


(async function loadVue() {
    await loadSubItemObject()
    await dynamicLayer("layer")
        //.catch(err => console.log("Error loading Layer: ", err))
    await dynamicLayer("layer-sub-object")
    //(err => console.log("Error loading Layer-sub-object: ", err)))
    window.vmapping = new Vue({                                                  //Anonymous can't get back to it if necessary!!!!
        el: "#mapping",
        data: {
            dataProperties: {},
            objectProperties: {},
            mapping: {},
            className: $('#mapping').attr('anchor'),
            callStructure: {},
            cacheCreatedAt:0,
        },
        computed: {
            isArray() {
                return false
            }
        },
        methods: {
            addAttribute(attribute,valueType){
                if(valueType=="object"){
                    this.$set(this.callStructure.result.data[0][attribute],"__new_attribute__","")
                }else if(valueType=="array"){
                    //TODO not implemented
                }
            },
            valueType(attribute) {
                let key = this.callStructure.result.data[0][attribute]
                if (typeof key === "object")
                    if (key._sparQL) {
                        return "directProcessed"
                    } else if (key instanceof Array) {
                        return "array"
                    } else {
                        return "object"
                    }
                else return "direct"
            },
            async clearCache(){
                let result = await $.get("/admin/query/cache/clear")
                if(result.clear) {
                    //displayToast(`Cleared ${result.clear.deletedCount} cache results`)
                    if(result.clear.acknowledged == true) location.reload()
                }else{
                    //displayToast(`Error clearing cache`)
                }

            },
            classType(attribute) {
                if (this.valueType(attribute) == "array") {
                    return "array-attribute"
                } else if (this.valueType(attribute).startsWith("direct")) {
                    return "direct-attribute"
                } else if (this.valueType(attribute) == "object") {
                    return "object-attribute"
                } else {
                    return ""
                }
            },
            buttonType(attribute) {
                if (this.valueType(attribute) == "array") {
                    return "btn-secondary dropdown-toggle array-attribute"
                } else if (this.valueType(attribute).startsWith("direct")) {
                    return "btn-primary direct-attribute"
                } else if (this.valueType(attribute) == "object") {
                    return "btn-warning dropdown-toggle object-attribute"
                } else {
                    return ""
                }
            }
        },
        beforeMount: async function () {
            //Loads the Properties on all v-select
            if (this.className==""){
                //Otherwise it will go to the incorrect route
                this.className="undefined"
            }
            this.objectProperties[this.className] = await $.get(`/admin/query/inferred/objectProperty/${this.className}`)
            this.dataProperties[this.className] = await $.get(`/admin/query/inferred/dataProperty/${this.className}`)
            let that = this
            $('#mapping table').removeClass('d-none')
            $('#mapping .spinner-grow').hide()
            this.cacheCreatedAt = await $.get(`/admin/query/cache/createdAt`)
            /*window.vmapping.$children.filter(child=> child.$vnode.tag.startsWith("vue-component"))
                .forEach(
                    layer=>{
                        //vselect.options=this.dataProperties[this.className]
                        let id=layer.$children[0].$attrs.attribute
                        //that.mapping[id]=[]
                        //layer.loadValues(id)
                        layer.$children[0].loading=false

                    }
                )

             */
        }
    })
    window.vmapping.callStructure=window.callStructure
}())

Vue.component('v-select', vSelect);

Vue.config.warnHandler = function (msg, vm, trace) {
    if (msg === `Avoid mutating a prop directly since the value will be overwritten whenever the parent component re-renders. Instead, use a data or computed property based on the prop's value. Prop being mutated: "column"`) {
        //Do nothing
    }
}


//---------------------- END VUE -----------------------------------------------------------------


// Loads JSON call spec
$.ajax({
    url:window.location.pathname.replace(/map$/,"json"),
    method:"get",
    success:function(data,textStatus,jqXHR){
        (function triggerLoadingOfCallStructure(data) {
            if(window.callStructureLoaded){
                window.callStructure = data
                window.callStructureLoaded.status = true
            }else{
                setTimeout(function () {
                    triggerLoadingOfCallStructure(data)
                }, 1000)
            }
        })(data)
    },
    error:function(jqXHR,textStatus,error){
        console.log(error)
    }
})

function getRelatedItems(ontoTerm){
    ////THIS is ClassProperties from
    url=`/admin/query/ppeo/class/${ontoTerm}/properties`
    return new Promise((res,rej)=>{
        $.ajax({
            url,
            method:"get",
            success:function(data,textStatus,jqXHR){
                res(data)
            },
            error:function(jqXHR,textStatus,error){
                rej(error)
            }
        })
    })
}


function saveCallStruture(target){
    $.ajax({
        url:window.location.pathname.replace(/map$/,"update"),
        method:"POST",
        data:{data:JSON.stringify(callStructure)},
        success:function(data,textStatus,jqXHR){
            if(data=="ok"){
                setTemporaryBadge("Saved!",target,{})
            }else{
                setTemporaryBadge("Not saved!",target,{type:"danger",duration:10000})
            }
        },
        error:function(jqXHR,textStatus,error){
            setTemporaryBadge("Not saved!",target,{type:"danger",duration:10000})
        }
    })
}




//---------------------------------



function fillElement(element,table,attr,attributes){
    element.removeClass("template-element")
    let button = element.find('button')
    button.attr('data-bs-target',`#${attributes.string}`)
    button.attr('aria-controls',`#${attributes.string}`)
    button.attr('key',`${attributes.string}`)
    let collapse = element.find('.collapse')
    collapse.attr('id',`${attributes.string}`)
    button.find('span.button-text').text(attr)
    table.append(element[0])
    addNewLayerOnClick(element)
    addSelectPropertyOnChange(element)
    element.find('.collapse').on("shown.bs.collapse",onInputChange)
}

async function getTemplate(part){
    let result = await $.parseHTML(await $.get(`/admin/factory/vue/callEditor/${part}`))
    return result.pop()
}

window.calls = new Vue({
    el: "#calls",
    data:{
        file:document.location.pathname.split("/").slice(-2)[0],
        module:document.location.pathname.split("/").slice(-3)[0],
        version:document.location.pathname.split("/").slice(-5)[0],
    },
    methods:{
        async saveValue(evt){
            let target=evt.target
            let data=window.calls.$data
            data.name=target.name
            data.value=target.value
            let result=await $.post("/admin/forms/serverinfo/set/call",
                data
            )
            if(result=="done"){
                target.style.backgroundColor="green"
                window.setTimeout(function(){
                    target.style.backgroundColor="white"
                },3000)
            }else{
                displayToast("Failed to save class!",result)
            }
        },
    }
})
Vue.config.devtools = true
window.anchor = new Vue({                                                  //Anonymous can't get back to it if necessary!!!!
    el: "#anchor",
    data: {
        className: $('#mapping').attr('anchor'),
        predicate:"rdf:type",
        file:document.location.pathname.split("/").slice(-2)[0],
        module:document.location.pathname.split("/").slice(-3)[0],
        version:document.location.pathname.split("/").slice(-5)[0],
        callUrl:"",
        classes:[]
    },
    computed: {
        subject(){
            return "?"+this.className
        },
        observation(){
            return "ppeo:"+this.className
        },
        listCall(value){
            return "true"==document.querySelector("input#flexSwitchListCall").getAttribute("listcall")
        },
        get(value){
            return "true"==document.querySelector("input#flexSwitchGet").getAttribute("get")
        },
        post(value){
            return "true"==document.querySelector("input#flexSwitchPost").getAttribute("post")
        }
    },
    methods:{
        async saveCallAttributes(evt){
            let target=evt.target
            window.anchor.$data.name=target.name
            window.anchor.$data.value=target.checked
            let result=await $.post("/admin/forms/list-call/set/checked",
                window.anchor.$data
            )
            if(result=="done"){
                let style=target.style
                target.style.backgroundColor="green"
                window.setTimeout(function(){
                    target.style=style
                },3000)
            }else{
                displayToast("Failed to save class!",result)
            }
        },
        async saveCallUrlToFile(evt){
            window.anchor.$data.callUrl=evt.target.value
            let result=await $.post("/admin/forms/list-call/set/url",
                window.anchor.$data
            )
            if(result=="done"){
                document.location.reload()
            }else{
                displayToast("Failed to save class!",result)
            }
            //todo Deal with results
        },
      //todo something on change of class save class to file reload page
        async saveClassToFile(a){
            window.anchor.$data.observation=window.anchor.observation
            window.anchor.$data.subject=window.anchor.subject
            let saveClass=await $.post("/admin/forms/anchor/set/class",
                window.anchor.$data
            )
            if(saveClass=="done"){
                document.location.reload()
            }else{
                displayToast("Failed to save class!",saveClass.message)
            }
            console.log(a)
            //todo Deal with results
        }
    },
    async beforeMount(){
        try {
            this.classes=await $.get('/admin/query/ppeo/listClasses')
            //window.anchor.$data.initialChecked=document.querySelector("input#flexSwitchListCall").getAttribute("listcall")
            //todo this.listCalls=await $.get('/admin/query/')
        }catch(e){
            displayToast("Error loading table",JSON.stringify(e))
        }
    }
})