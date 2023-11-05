try {
    loadAsyncScript()
}catch (e){
    setTimeout(()=>loadAsyncScript(),2000)
}


function loadAsyncScript(){
    let scriptTarget = document.body
    let url = "/admin/public/javascripts/callEditor/init.js";
    let script = document.createElement('script');
    script.src = url;
    scriptTarget.append(script);
}