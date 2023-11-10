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
            let studyCount = details.map(study=>study.s)
        }

    },
    async beforeMount() {
        let graph=await $.get("/admin/forms/graph/get")
        this.graph=graph.graph
        this.availableGraphs=await $.get("/admin/query/list/graphs")

    },
    async mounted(){
       graph="http://localhost:8890/trace-rice"
       this.graphSummary[graph] = await $.post("/admin/query/graph/lookup/summary/", {graph})
    }

})