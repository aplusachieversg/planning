/* APLUS EVIDENCE PROFILE v1.1
   06 · Evidence — independent canonical activity/evidence layer.
   Lifecycle: READ → HYDRATE → EDIT → SAVE.
*/
(function(){
  "use strict";
  const KEY="aplus_experience_profile_v1";
  let activities=[];
  let state="idle";
  function setState(s){state=s;window.APLUS_EVIDENCE_STATE=s;window.dispatchEvent(new CustomEvent("APLUS_EVIDENCE_STATE",{detail:{state:s}}));}
  function normalize(list){return Array.isArray(list)?list.map(function(x){return Object.assign({},x);}):[];}
  function read(){return normalize(activities);}
  function hydrateSavedProfile(list){activities=normalize(list);try{localStorage.setItem(KEY,JSON.stringify(activities));localStorage.setItem("APLUS_UI_ACTIVITIES",JSON.stringify(activities));}catch(e){}setState("ready");document.dispatchEvent(new CustomEvent("APLUS_EXPERIENCE_RESTORED"));window.dispatchEvent(new CustomEvent("APLUS_EVIDENCE_HYDRATED",{detail:{activities:read()}}));return true;}
  function markDirty(){if(state==="ready"||state==="saved")setState("dirty");}
  function getAnalysis(){
    const a=read(), labels={initiative:"Initiative",commitment:"Commitment",responsibility:"Responsibility",leadership:"Leadership",thinking:"Thinking & Problem Solving",collaboration:"Collaboration & Communication",resilience:"Resilience & Adaptability",reflection:"Reflection & Self-awareness"};
    const counts={};Object.keys(labels).forEach(k=>counts[k]=0);
    a.forEach(x=>{const text=[x.whatIDid,x.whatILearned,x.reflection].join(" ").toLowerCase();if(/initi|start|launch|propos|organis|organized|created|founded|built|led/.test(text)||/founder|leader|organiser|project leader/i.test(x.role||""))counts.initiative++;if(x.ongoing||Number(x.endYear)-Number(x.startYear)>=1)counts.commitment++;if(/leader|organiser|organizer|captain|founder|mentor|representative/i.test(x.role||""))counts.responsibility++;if(/leader|captain|founder|project leader/i.test(x.role||""))counts.leadership++;if(/research|analys|problem|solution|design|debug|strategy|experiment|investigat|evaluate|evidence/i.test(text))counts.thinking++;if(/team|collabor|communicat|coordinate|delegate|mentor|support|feedback|present/i.test(text)||/team|organiser|leader|mentor/i.test(x.role||""))counts.collaboration++;if(/challenge|difficult|obstacle|failure|setback|persist|overcome|adapt|revise|iterate/i.test(text))counts.resilience++;if(x.reflection)counts.reflection++;});
    function level(n){return n>=3?"Established":n>=1?"Developing":"Not yet evidenced";}
    const personalQualities=Object.keys(labels).map(k=>({key:k,label:labels[k],development:level(counts[k]),evidenceCount:counts[k]}));
    const patterns=[];if(a.length>=2)patterns.push("Multiple experience records are present.");if(a.some(x=>x.ongoing))patterns.push("Ongoing commitment is recorded.");if(a.some(x=>/leader|captain|founder|project leader/i.test(x.role||"")))patterns.push("Responsibility or leadership roles are recorded.");if(a.some(x=>x.reflection))patterns.push("Reflection is included in the experience record.");
    return {count:a.length,personalQualities,patterns,evidenceQuality:a.length?(a.some(x=>x.evidenceType&&x.evidenceType!=="No formal evidence")?"Partially evidenced":"Self-reported"):"No experience recorded"};
  }
  async function save(list){activities=normalize(list);markDirty();setState("saving");try{const r=window.APLUS_DATABASE&&window.APLUS_DATABASE.saveExperienceProfile?await window.APLUS_DATABASE.saveExperienceProfile(activities):{ok:false,code:"database_unavailable"};if(!r||!r.ok){setState("dirty");return r||{ok:false};}try{localStorage.setItem(KEY,JSON.stringify(activities));localStorage.setItem("APLUS_UI_ACTIVITIES",JSON.stringify(activities));}catch(e){}if(window.APLUS_PROFILE_STORE&&window.APLUS_PROFILE_STORE.saved)window.APLUS_PROFILE_STORE.saved(r.data||null);setState("saved");return r;}catch(e){setState("dirty");return {ok:false,code:"db_error",message:e.message};}}
  window.APLUSEvidenceProfile={version:"1.1",read:read,get:function(){return read();},getAnalysis:getAnalysis,hydrateSavedProfile:hydrateSavedProfile,markDirty:markDirty,save:save,getState:function(){return state;}};
})();