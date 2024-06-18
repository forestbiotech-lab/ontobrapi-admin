
function testVue() {
    if (typeof window.Vue == "undefined") {
        setTimeout(() => {
            testVue()
        }, 2000)
    }else{
        loadVue()
    }
}
testVue()



function loadVue() {
    window.app = new Vue({
        el: "#app",
        data: {
            protocol: "",
            hostname: "",
            port: "",
            pathname: "",
            hash: "",
            graph: "",
            datasetId: "",
            term: "",
            classes: {
                downward: [],
                upward: [],
                dataProperties: []
            },
            investigation: ""
        },
        methods: {
            goto(forward_location) {
                let term = forward_location.split("#")[1]
                document.location.href = this.protocol + "//" + this.hostname + ":" + this.port + "/" + this.graph + "/" + this.datasetId + "#" + term
                location.reload()
            }
        },
        computed: {},
        async mounted() {
            this.hostname = document.location.hostname
            this.protocol = document.location.protocol
            this.port = document.location.port
            this.pathname = document.location.pathname.replace(/\/$/, "").split("/")
            this.graph = this.pathname[1]
            this.datasetId = this.pathname[2]
            this.term = document.location.hash
            let payload = {term: this.datasetId + this.term, graph: this.graph + ":"}
            let downward = await $.post(`/admin/query/explorer/classes/downward`, payload)
            if (downward.err) this.$set(this.classes, "downward", downward.data)
            this.$set(this.classes, "downward", downward.data)
            let upward = await $.post(`/admin/query/explorer/classes/upward`, payload)
            if (upward.err) this.$set(this.classes, "upward", upward.data)
            this.$set(this.classes, "upward", upward.data)
            let dataProperties = await $.post(`/admin/query/explorer/dataproperties`, payload)
            if (dataProperties.err) this.$set(this.classes, "dataProperties", dataProperties.data)
            this.$set(this.classes, "dataProperties", dataProperties.data)
            let response = await fetch("/admin/query/explorer/investigation", {
                method: "POST",
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    graph: this.graph + ':',
                    id: this.datasetId
                })
            })
            let result = await response.json()
            if (result.err) this.$set(this, "investigation", "")
            if(result.data.length>0) {
                if (Object.keys(result.data[0]).length > 0) {
                    this.$set(this, "investigation", result.data[0].dataPropertyURI.replace(/^https*:\/\/[a-z.]*\//, "/"))
                }
            }
        }
    })
}