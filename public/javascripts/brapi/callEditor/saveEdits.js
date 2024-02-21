  const attributeGlue="-"
  let callStructure=""
  let callStructureLoaded = {
    aInternal: false,
    aListener: function(val) {},
    set status(val) {
      this.aInternal = val;
      this.aListener(val);
    },
    get status() {
      return this.aInternal;
    },
    registerListener: function(listener) {
      this.aListener = listener;
    }
  }
  callStructureLoaded.registerListener(function(val){
    if(val=== true){
      callStructure=window.callStructure
      //loadValues()
      if(!window.vmapping) window.vmapping={}
      window.vmapping.callStructure=callStructure
    }
  })
  //Export the function for loader
  window.callStructureLoaded=callStructureLoaded


    
  function setTemporaryBadge(msg,target,options){
    let extraOptions={}
    //Add badge stating save was successful
    if(options){
      extraOptions.duration=options.duration || 5000
      extraOptions.type=options.type || "success"
    }
    let badge=mkel("span",{class:`badge bg-${extraOptions.type}`},target)
    badge.textContent=msg
    target.empty()
    target.append(badge)
    setTimeout(function(){
      target.empty()
    },extraOptions.duration)    
  }



