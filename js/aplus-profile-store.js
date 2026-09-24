/* APLUS PROFILE STORE v1.0
   Mature lifecycle boundary for Planning:
   READ -> HYDRATE -> READY -> USER EDIT -> SAVE
   This store is intentionally limited to the Planning repository.
*/
(function(){
  "use strict";
  var state="idle";
  var bootPromise=null;
  var sessionUserId=null;
  var lastRow=null;

  function setState(next,detail){
    state=next;
    window.APLUS_PROFILE_STATE=next;
    window.dispatchEvent(new CustomEvent("APLUS_PROFILE_STATE",{detail:{state:next,detail:detail||null}}));
  }

  async function boot(userId){
    if(bootPromise && sessionUserId===userId)return bootPromise;
    sessionUserId=userId||null;
    bootPromise=(async function(){
      setState("loading");
      try{
        /* The existing restore routine is now called through one single gate.
           Nothing in this bootstrap path is allowed to save. */
        if(typeof window.APLUS_RESTORE_SAVED_PROFILE!=="function"){
          throw new Error("Profile restore routine is not ready.");
        }
        await window.APLUS_RESTORE_SAVED_PROFILE();
        var db=window.APLUS_DATABASE;
        var result=db&&db.getStudentProfile?await db.getStudentProfile():null;
        if(result&&result.ok)lastRow=result.data||null;
        setState("ready",lastRow);
        return {ok:true,data:lastRow};
      }catch(e){
        setState("error",e);
        throw e;
      }
    })();
    try{return await bootPromise;}finally{
      if(state!=="error")setState("ready",lastRow);
    }
  }

  function reset(){
    bootPromise=null;
    sessionUserId=null;
    lastRow=null;
    setState("idle");
  }

  function markDirty(){
    if(state==="ready"||state==="saved")setState("dirty");
  }

  function saving(){
    if(state==="dirty"||state==="ready")setState("saving");
  }

  function saved(data){
    if(data!==undefined)lastRow=data;
    setState("saved",lastRow);
  }

  window.APLUS_PROFILE_STORE={
    version:"1.0",
    getState:function(){return state;},
    getData:function(){return lastRow;},
    boot:boot,
    reset:reset,
    markDirty:markDirty,
    saving:saving,
    saved:saved
  };
})();
