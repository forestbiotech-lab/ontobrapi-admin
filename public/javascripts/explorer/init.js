var pathname=document.location.pathname
var paths=pathname.split("/").splice(1)

scriptName=[
]


//TODO Change this to use
if(paths[0]=="staging" || paths[0]=="production" || paths[0]=="ontobrapi"){
    scriptName=[
        "main"
    ]
}



scriptTarget = document.body;
for (s in scriptName){
    let url=`/admin/public/javascripts/explorer/`+scriptName[s]+".js";
    let script = document.createElement('script');
    script.src = url;
    scriptTarget.append(script);
}