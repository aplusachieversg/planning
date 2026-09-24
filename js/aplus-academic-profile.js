/* APLUS ACADEMIC PROFILE v1.0
   01 · Academic Profile — independent canonical save boundary.
   Lifecycle: READ → HYDRATE → EDIT → SAVE.
   Existing Diagnostic 01 calculation logic remains in aplus-student-profile.js.
*/
(function(){
  "use strict";
  var KEY="aplus_academic_profile_v1";
  var state="idle";
  var hydratedRow=null;

  function setState(next,detail){
    state=next;
    window.APLUS_ACADEMIC_PROFILE_STATE=next;
    window.dispatchEvent(new CustomEvent("APLUS_ACADEMIC_PROFILE_STATE",{detail:{state:next,detail:detail||null}}));
    var status=document.getElementById("academicProfileSaveStatus");
    if(status){
      status.textContent=next==="saving"?"Saving Academic Profile…":
        next==="saved"?"Academic Profile saved.":
        next==="dirty"?"Unsaved changes":
        next==="error"?"Academic Profile save failed.":"Ready";
    }
  }

  function read(){
    try{
      var cached=JSON.parse(localStorage.getItem(KEY)||"null");
      if(cached)return cached;
    }catch(e){}
    if(window.APLUS_STUDENT_PROFILE&&window.APLUS_STUDENT_PROFILE.collect){
      try{return window.APLUS_STUDENT_PROFILE.collect();}catch(e){}
    }
    return null;
  }

  function normalize(profile){
    var p=profile||{};
    if(p.profile)return p;
    return {profile:p};
  }

  function saveLocal(profile){
    try{
      localStorage.setItem(KEY,JSON.stringify(profile));
      if(profile&&profile.profile){
        var master=JSON.parse(localStorage.getItem("APLUS_MASTER_PROFILE")||"{}");
        master.profile=Object.assign({},master.profile||{},profile.profile);
        if(profile.target)master.target=Object.assign({},master.target||{},profile.target);
        if(profile.readiness)master.readiness=Object.assign({},master.readiness||{},profile.readiness);
        if(profile.studentName)master.studentName=profile.studentName;
        localStorage.setItem("APLUS_MASTER_PROFILE",JSON.stringify(master));
      }
    }catch(e){}
  }

  function hydrateSavedProfile(row){
    hydratedRow=row||null;
    try{
      if(window.APLUS_STUDENT_PROFILE&&window.APLUS_STUDENT_PROFILE.hydrateSavedProfile){
        var ok=window.APLUS_STUDENT_PROFILE.hydrateSavedProfile(row||{});
        if(!ok)return false;
      }
      var ap=(row&&row.academic_profile)||{};
      saveLocal({profile:ap,target:{
        field:ap.field||"",
        university:(row&&row.target_university)||"",
        course:(row&&row.target_programme)||"",
        entryYear:(row&&row.entry_year)||null
      }});
      state="ready";
      setState("ready",row||null);
      window.dispatchEvent(new CustomEvent("APLUS_ACADEMIC_PROFILE_HYDRATED",{detail:{row:row||null}}));
      return true;
    }catch(e){
      setState("error",e);
      return false;
    }
  }

  function collect(){
    if(window.APLUS_STUDENT_PROFILE&&window.APLUS_STUDENT_PROFILE.collect){
      var p=window.APLUS_STUDENT_PROFILE.collect();
      if(p&&p.profile&&window.APLUS_ALEVEL_SCORE){
        p.profile.aLevelScore=window.APLUS_ALEVEL_SCORE.calculate(p.profile.subjects||[]);
      }
      if(p&&p.profile&&window.APLUS_ACADEMIC_ANALYSIS){
        p.profile.academicAnalysis=window.APLUS_ACADEMIC_ANALYSIS.analyze(p.profile.subjects||[],p.profile.academicProfile||"unknown");
      }
      return p;
    }
    return read();
  }

  function markDirty(){
    if(state==="ready"||state==="saved")setState("dirty");
  }

  async function save(){
    if(!window.APLUS_DATABASE||!window.APLUS_DATABASE.saveAcademicProfileDraft){
      setState("error",{message:"Database save service is unavailable."});
      return {ok:false,code:"database_unavailable"};
    }
    var profile=collect();
    if(!profile){
      setState("error",{message:"Academic Profile is not ready."});
      return {ok:false,code:"profile_unavailable"};
    }
    setState("saving");
    try{
      var r=await window.APLUS_DATABASE.saveAcademicProfileDraft(profile);
      if(!r||!r.ok){
        setState("dirty");
        return r||{ok:false,code:"save_failed"};
      }
      hydratedRow=r.data||null;
      saveLocal(profile);
      if(window.APLUS_PROFILE_STORE&&window.APLUS_PROFILE_STORE.saved)window.APLUS_PROFILE_STORE.saved(r.data||null);
      setState("saved",r.data||null);
      window.dispatchEvent(new CustomEvent("APLUS_ACADEMIC_PROFILE_SAVED",{detail:{data:r.data||null,profile:profile}}));
      return r;
    }catch(e){
      setState("dirty",e);
      return {ok:false,code:"db_error",message:e.message};
    }
  }

  function renderControls(){
    var host=document.getElementById("academicModule")||document.getElementById("studentProfileEngine");
    if(!host||document.getElementById("academicProfileSaveBar"))return;
    var result=document.getElementById("studentProfileResult");
    var bar=document.createElement("div");
    bar.id="academicProfileSaveBar";
    bar.style.cssText="display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;margin-top:16px;padding:12px 14px;border:1px solid #e5e8ef;border-radius:12px;background:#fbfcfe";
    bar.innerHTML='<div><b style="font-size:12px">Academic Profile</b><div id="academicProfileSaveStatus" style="font-size:11px;color:#667085;margin-top:3px">Ready to save</div></div><button type="button" id="academicProfileSaveButton" class="aplus-save">Save Academic Profile →</button>';
    (result&&result.parentElement?result.parentElement:host).appendChild(bar);
    document.getElementById("academicProfileSaveButton").onclick=async function(){
      var b=this;
      b.disabled=true;b.textContent="Saving…";
      var r=await save();
      if(r&&r.ok){
        b.textContent="Saved ✓";
        if(window.APLUS_showSaveSuccess)window.APLUS_showSaveSuccess("Academic Profile");
      }else{
        b.textContent="Save Academic Profile →";
        if(window.APLUS_showSaveError)window.APLUS_showSaveError("Academic Profile was not saved. Please try again.");
      }
      setTimeout(function(){b.disabled=false;b.textContent="Save Academic Profile →";},1600);
    };
  }

  function boot(){
    window.APLUS_ACADEMIC_EXPLICIT_SAVE_MODE=true;
    var tries=0;
    var timer=setInterval(function(){
      renderControls();
      if(document.getElementById("academicProfileSaveBar"))clearInterval(timer);
      if(++tries>80)clearInterval(timer);
    },150);
  }

  window.APLUSAcademicProfile={
    version:"1.0",
    read:read,
    collect:collect,
    hydrateSavedProfile:hydrateSavedProfile,
    markDirty:markDirty,
    save:save,
    render:renderControls,
    getState:function(){return state;}
  };
  window.APLUS_ACADEMIC_PROFILE_HYDRATED=window.APLUS_ACADEMIC_PROFILE_HYDRATED||false;
  boot();
})();