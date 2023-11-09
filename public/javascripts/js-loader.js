var pathname=document.location.pathname
var paths=pathname.split("/").splice(1)

scriptName=[
]


//TODO Change this to use
if(paths[1]=="brapi" && paths.length==2){
    scriptName=["init"]

}



scriptTarget = document.body;
for (s in scriptName){
    let url=`/admin/public/javascripts/${paths[1]}/`+scriptName[s]+".js";
    let script = document.createElement('script');
    script.src = url;
    scriptTarget.append(script);
}

