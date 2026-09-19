/* APLUS SYSTEM ORCHESTRATOR v1.0
   Target -> Requirements -> Profile -> Evidence -> Gap -> Development -> Roadmap -> Application -> Intelligence.
*/
(function(){
"use strict";
function load(){try{return JSON.parse(localStorage.getItem("APLUS_MASTER_PROFILE")||"null")}catch(e){return null}}
function setv(id,v){const e=document.getElementById(id);if(e&&v!=null&&String(v)!=="")e.value=String(v)}
function syncTarget(p){
 const t=p&&p.target||{};
 setv("entryYear",t.entryYear); setv("acEntry",t.entryYear);
 if(t.university==="NUS")setv("uni","NUS Medicine");
 else if(t.university==="NTU")setv("uni","NTU Medicine");
 else if(t.country==="United Kingdom")setv("uni","UK Medicine");
 else if(t.country==="Australia")setv("uni","Australia Medicine");
 const wanted=[];
 if(t.university==="NUS")wanted.push("NUS Medicine");
 if(t.university==="NTU")wanted.push("NTU Medicine");
 if(t.country==="United Kingdom")wanted.push("UK Medicine");
 if(t.country==="Australia")wanted.push("Australia Medicine");
 document.querySelectorAll(".acChoice").forEach(cb=>{if(wanted.length)cb.checked=wanted.includes(cb.value)});
}
async function requirements(p){
 const t=p&&p.target||{};
 if(!window.APLUS_REQUIREMENTS||!t.university||!t.course||!t.entryYear)return [];
 try{return await window.APLUS_REQUIREMENTS.sync(t.university,t.course,t.entryYear)||[]}catch(e){return []}
}
function gap(){try{if(window.APLUS_RUN_GAP_ENGINE)window.APLUS_RUN_GAP_ENGINE()}catch(e){}}
function roadmap(p){
 try{
  if(!window.APLUS_DEVELOPMENT_ROADMAP)return null;
  const r=window.APLUS_DEVELOPMENT_ROADMAP.build(p,{focus:"Full profile"});
  localStorage.setItem("APLUS_DEVELOPMENT_ROADMAP",JSON.stringify(r));
  const out=document.getElementById("developmentRoadmapResult");
  if(out&&window.APLUS_DEVELOPMENT_ROADMAP.render)window.APLUS_DEVELOPMENT_ROADMAP.render(r,out);
  return r;
 }catch(e){return null}
}
async function refresh(){
 const p=load(); if(!p)return {ok:false,reason:"profile_not_found"};
 syncTarget(p);
 const req=await requirements(p);
 gap();
 const road=roadmap(p);
 syncTarget(p);
 if(window.APLUS_REFRESH_PLANNING_INTELLIGENCE)try{await window.APLUS_REFRESH_PLANNING_INTELLIGENCE()}catch(e){}
 if(window.APLUS_refreshDashboard)try{window.APLUS_refreshDashboard()}catch(e){}
 const intelligence=(()=>{try{return JSON.parse(localStorage.getItem("APLUS_PLANNING_INTELLIGENCE")||"null")}catch(e){return null}})();
 const snap={generatedAt:new Date().toISOString(),target:p.target||{},requirementsCount:req.length,roadmapReady:!!(road&&road.ok),planningIntelligenceReady:!!intelligence};
 try{localStorage.setItem("APLUS_SYSTEM_SNAPSHOT",JSON.stringify(snap))}catch(e){}
 window.APLUS_SYSTEM_SNAPSHOT=snap;
 return {ok:true,snapshot:snap};
}
window.APLUS_SYSTEM={refresh,load,syncTarget,requirements};
window.APLUS_REFRESH_SYSTEM=refresh;
function boot(){if(load())setTimeout(refresh,500)}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot);else boot();
})();