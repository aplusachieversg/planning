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
        lastRow=await window.APLUS_RESTORE_SAVED_PROFILE();
        /* Hydrate every profile module from the same canonical DB row. */
        try{
          var evidence=lastRow&&lastRow.evidence_profile;
          var activities=evidence&&Array.isArray(evidence.activities)?evidence.activities:[];
          if(window.APLUSEvidenceProfile&&window.APLUSEvidenceProfile.hydrateSavedProfile){
            window.APLUSEvidenceProfile.hydrateSavedProfile(activities);
          }
          if(window.APLUSExperienceProfile&&window.APLUSExperienceProfile.hydrateSavedProfile){
            window.APLUSExperienceProfile.hydrateSavedProfile(activities);
          }
          if(window.APLUSAdmissionProfile&&window.APLUSAdmissionProfile.hydrateSavedProfile){
            window.APLUSAdmissionProfile.hydrateSavedProfile(lastRow);
          }
          if(window.APLUSTargetProfile&&window.APLUSTargetProfile.hydrateSavedProfile){
            window.APLUSTargetProfile.hydrateSavedProfile(lastRow);
          }
          if(window.APLUSRequirementsProfile&&window.APLUSRequirementsProfile.hydrateSavedProfile){
            window.APLUSRequirementsProfile.hydrateSavedProfile(window.APLUSTargetProfile&&window.APLUSTargetProfile.get?window.APLUSTargetProfile.get():null);
          }
        }catch(e){console.warn("Profile module hydrate skipped:",e);}
        setState("ready",lastRow);
        return {ok:true,data:lastRow||null};
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

  /* User interaction is the only path that moves READY/SAVED -> DIRTY.
     Programmatic hydration uses element.value/checked without dispatching input/change,
     so refresh can never become a save trigger. */
  document.addEventListener("input",function(e){
    if(e.target&&e.target.closest&&e.target.closest("#planner"))markDirty();
  },true);
  document.addEventListener("change",function(e){
    if(e.target&&e.target.closest&&e.target.closest("#planner"))markDirty();
  },true);
  window.addEventListener("APLUS_INFORMATION_SAVED",function(e){
    var d=e.detail||{};
    if(d.data)saved(d.data);
  });
  window.addEventListener("beforeunload",function(){
    /* Intentionally no save here. Browser refresh/unload is READ-only. */
  });

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
