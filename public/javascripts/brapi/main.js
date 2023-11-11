Vue.component('v-select',vSelect)
window.app=new Vue({
    el:"#app",
    data:{
        graph:"ss",
        availableGraphs:[],
        graphSummary:{},
    },
    methods:{
        saveGraph(){
            console.log(this.graph)
            $.post("/admin/forms/graph/set",{graph: this.graph})
        },
        parseGraphDetails(graph,details){
            let investigations = details.reduce((acc,item)=> {
                acc[item.investigation]={
                    name:item.investigationName,
                    description:item.investigationDescription
                }
                return acc
            },{})
            let studies = details.reduce((acc,item)=> {
                acc[item.study]=""
                return acc
            },{})
            this.graphSummary[graph]={
                studies:Object.keys(studies),
                studiesCount:Object.keys(studies).length,
                investigations:Object.keys(investigations),
                investigationsDetails:investigations
            }
        }

    },
    async beforeMount() {
        let graph=await $.get("/admin/forms/graph/get")
        this.graph=graph.graph
        this.availableGraphs=await $.get("/admin/query/list/graphs")
        //Todo cache this
        for (let graph of this.availableGraphs) {
            //graph="http://localhost:8890/vitis"
            graph=graph.replace(/\\/g,"")
            let graphDetails= await $.post("/admin/query/graph/lookup/summary/", {graph})

            if(graphDetails.length>0){
                this.parseGraphDetails(graph,graphDetails)
            }
        }
        this.$forceUpdate()
    },
    async mounted(){
        //Doesn't resolve before the async methods in beforemount

    }

})