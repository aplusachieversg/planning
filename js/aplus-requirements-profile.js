/* APLUS REQUIREMENTS PROFILE v1.0
   05 · Requirements — independent module.
   Lifecycle: READ → HYDRATE → COMPUTE → DISPLAY.
   Source of truth: Target Profile + verified Requirements Database.
*/
(function(){
  "use strict";
  const state={target:null,records:[],status:"idle",error:""};
  function readTarget(){
    try{
      if(window.APLUSTargetProfile&&window.APLUSTargetProfile.get){
        const t=window.APLUSTargetProfile.get();
        if(t)return t;
      }
      const p=JSON.parse(localStorage.getItem("APLUS_MASTER_PROFILE")||"null");
      return p&&p.target||null;
    }catch(e){return null;}
  }
  function normalize(t){
    t=t||{};
    const rawU=String(t.university||"").trim();
    const rawC=String(t.course||"").trim();
    let university=rawU, course=rawC;
    if(rawU.includes("NUS")){university="NUS"; if(!course)course="Medicine";}
    else if(rawU.includes("NTU")){university="NTU"; if(!course)course="Medicine";}
    return {university,course,entryYear:Number(t.entryYear)||0,labelUniversity:rawU,labelCourse:rawC};
  }
  function escapeHtml(v){return String(v==null?"":v).replace(/[&<>"]/g,function(m){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[m]});}
  function badge(status){
    const s=String(status||"pending");
    return '<span class="req-status '+(s==="verified"?"verified":"pending")+'">'+escapeHtml(s==="verified"?"VERIFIED":"PENDING")+'</span>';
  }
  function render(){
    const box=document.getElementById("requirementsProfileEngine");if(!box)return;
    const t=normalize(state.target||readTarget());
    if(!t.university||!t.course||!t.entryYear){
      box.innerHTML='<div class="aplus-module-head"><div><div class="aplus-module-kicker">05 · REQUIREMENTS</div><h2>Target Requirements</h2><p>Official target-year requirements are loaded from the verified APLUS data layer.</p></div><span class="aplus-module-no">05</span></div><div class="dataCard"><b>Complete Target first.</b><p style="margin:7px 0 0;color:#667085">Requirements will activate automatically after your Target university, course and entry year are saved.</p></div>';
      return;
    }
    const records=state.records||[];
    if(state.status==="loading"){
      box.innerHTML=head(t)+'<div class="dataCard"><b>Loading verified requirements…</b><p style="margin:7px 0;color:#667085">Reading the target-year requirement records.</p></div>';
      return;
    }
    if(!records.length){
      box.innerHTML=head(t)+'<div class="dataCard"><b>No verified requirement records are available for this target year.</b><p style="margin:7px 0;color:#667085">APLUS will not invent missing requirements. This target-year record remains a verification task.</p></div>';
      return;
    }
    const verified=records.filter(r=>r.status==="verified").length;
    const pending=records.filter(r=>r.status==="pending").length;
    const groups={};
    records.forEach(r=>(groups[r.category]||(groups[r.category]=[])).push(r));
    box.innerHTML=head(t)+
      '<div class="req-summary"><div><b>'+records.length+'</b><span>Requirement records</span></div><div><b>'+verified+'</b><span>Verified</span></div><div><b>'+pending+'</b><span>Pending verification</span></div></div>'+
      Object.keys(groups).map(function(category){
        return '<div class="dataCard req-group"><div class="req-group-head"><h3>'+escapeHtml(category)+'</h3>'+badge(groups[category].every(r=>r.status==="verified")?"verified":"pending")+'</div>'+
          groups[category].map(function(r){
            return '<div class="req-row"><div class="req-main"><b>'+escapeHtml(r.requirement)+'</b><div class="req-meta">'+escapeHtml(r.qualification||"All applicants")+'</div></div><div class="req-detail"><span><b>Threshold:</b> '+escapeHtml(r.threshold||"Not specified")+'</span><span><b>Assessment:</b> '+escapeHtml(r.assessment||"Not specified")+'</span><span><b>Deadline:</b> '+escapeHtml(r.deadline||"Not specified")+'</span></div><div class="req-source">'+badge(r.status)+' '+(r.source?'<a href="'+escapeHtml(r.source)+'" target="_blank" rel="noopener">Official source ↗</a>':"Source not recorded")+(r.verified?' · Verified '+escapeHtml(r.verified):"")+'</div></div>';
          }).join("")+'</div>';
      }).join("");
  }
  function head(t){
    return '<div class="aplus-module-head"><div><div class="aplus-module-kicker">05 · REQUIREMENTS</div><h2>Target Requirements</h2><p>Verified requirements for <b>'+escapeHtml(t.labelUniversity||t.university)+'</b> · <b>'+escapeHtml(t.labelCourse||t.course)+'</b> · Entry Year <b>'+escapeHtml(t.entryYear)+'</b>.</p></div><span class="aplus-module-no">05</span></div>';
  }
  async function hydrateTarget(target){
    state.target=target||readTarget();
    const t=normalize(state.target);
    if(!t.university||!t.course||!t.entryYear){state.records=[];state.status="idle";render();return [];}
    state.status="loading";state.error="";render();
    try{
      if(window.APLUS_REQUIREMENTS&&window.APLUS_REQUIREMENTS.sync){
        await window.APLUS_REQUIREMENTS.sync(t.university,t.course,t.entryYear);
        state.records=window.APLUS_REQUIREMENTS.get(t.university,t.course,t.entryYear)||[];
      }else state.records=[];
      state.status="ready";
    }catch(e){state.records=[];state.status="error";state.error=e.message||"Requirements could not be loaded.";}
    render();
    window.APLUS_REQUIREMENTS_PROFILE=state;
    window.dispatchEvent(new CustomEvent("APLUS_REQUIREMENTS_HYDRATED",{detail:{target:t,records:state.records}}));
    return state.records;
  }
  function init(){
    const run=function(){
      let box=document.getElementById("requirementsProfileEngine");
      if(!box){
        const planner=document.getElementById("planner");
        if(!planner){setTimeout(run,250);return;}
        box=document.createElement("section");box.id="requirementsProfileEngine";box.className="planner aplus-module";planner.appendChild(box);
      }
      hydrateTarget(readTarget());
    };
    if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",run);else setTimeout(run,160);
  }
  window.APLUSRequirementsProfile={hydrateSavedProfile:hydrateTarget,render:render,getState:function(){return state;}};
  init();
})();