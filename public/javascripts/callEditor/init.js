


var pathname=document.location.pathname
var paths=pathname.split("/").splice(1)

  scriptName=[
    'saveEdits','loader',
  ]

  if(paths[1]=="targets"){
    scriptName=[
    ]
  }



  scriptTarget = document.body;
  for (s in scriptName){
    let url="/admin/public/javascripts/callEditor/"+scriptName[s]+".js";
    let script = document.createElement('script');
    script.src = url;
    scriptTarget.append(script);
  }



