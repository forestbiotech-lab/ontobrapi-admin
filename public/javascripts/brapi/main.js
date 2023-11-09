Vue.component('v-select',vSelect)
window.app=new Vue({
    el:"#app",
    data:{
        graph:"ss",
        availableGraphs:[],
    },
    methods:{
        saveGraph(){
            console.log(this.graph)
            $.post("/admin/forms/graph/set",{graph: this.graph})
        }
    },
    async beforeMount() {
        let graph=await $.get("/admin/forms/graph/get")
        this.graph=graph.graph
        this.availableGraphs=await $.get("/admin/query/list/graphs")
    }

})