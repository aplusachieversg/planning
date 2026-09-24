/* APLUS EVIDENCE PROFILE v1.0
   06 · Evidence — independent canonical activity/evidence layer.
   Lifecycle: READ → HYDRATE → EDIT → SAVE.
   Experience UI may collect fields; this module owns persistence.
*/
(function(){
  "use strict";
  const KEY="aplus_experience_profile_v1";
  let activities=[];
  let state="idle";

  function setState(s){state=s;window.APLUS_EVIDENCE_STATE=s;window.dispatchEvent(new CustomEvent("APLUS_EVIDENCE_STATE",{detail:{state:s}}));}
  function normalize(list){return Array.isArray(list)?list.map(function(x){return Object.assign({},x);}):[];}
  function read(){return normalize(activities);}
  function hydrateSavedProfile(list){
    activities=normalize(list);
    try{
      localStorage.setItem(KEY,JSON.stringify(activities));
      localStorage.setItem("APLUS_UI_ACTIVITIES",JSON.stringify(activities));
    }catch(e){}
    setState("ready");
    document.dispatchEvent(new CustomEvent("APLUS_EXPERIENCE_RESTORED"));
    window.dispatchEvent(new CustomEvent("APLUS_EVIDENCE_HYDRATED",{detail:{activities:read()}}));
    return true;
  }
  function markDirty(){if(state==="ready"||state==="saved")setState("dirty");}
  async function save(list){
    activities=normalize(list);
    markDirty();
    setState("saving");
    try{
      const r=window.APLUS_DATABASE&&window.APLUS_DATABASE.saveExperienceProfile
        ?await window.APLUS_DATABASE.saveExperienceProfile(activities)
        :{ok:false,code:"database_unavailable"};
      if(!r||!r.ok){setState("dirty");return r||{ok:false};}
      try{
        localStorage.setItem(KEY,JSON.stringify(activities));
        localStorage.setItem("APLUS_UI_ACTIVITIES",JSON.stringify(activities));
      }catch(e){}
      if(window.APLUS_PROFILE_STORE&&window.APLUS_PROFILE_STORE.saved)window.APLUS_PROFILE_STORE.saved(r.data||null);
      setState("saved");
      return r;
    }catch(e){setState("dirty");return {ok:false,code:"db_error",message:e.message};}
  }
  window.APLUSEvidenceProfile={
    version:"1.0",
    read:read,
    get:function(){return read();},
    hydrateSavedProfile:hydrateSavedProfile,
    markDirty:markDirty,
    save:save,
    getState:function(){return state;}
  };
})();