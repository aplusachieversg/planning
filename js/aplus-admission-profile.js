/* APLUS ADMISSION PROFILE v1.0
   Application readiness only. Does not predict admission or score applicants.
*/
(function(){
"use strict";
var KEY="aplus_admission_profile_v1";
function esc(v){return String(v==null?"":v).replace(/[&<>"]/g,function(m){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[m]})}
function load(){try{return JSON.parse(localStorage.getItem(KEY)||"{}")}catch(e){return {}}}
function cache(d){try{localStorage.setItem(KEY,JSON.stringify(d))}catch(e){}}
function hydrateFromRow(row){
 var e=row&&row.evidence_profile||{},a=e.application||{};
 if(!Object.keys(a).length)return;
 cache(a); render();
}
function render(){
 var mount=document.getElementById("admissionProfileEngine");if(!mount)return;
 var a=load();
 mount.innerHTML='<div class="aplus-module-head"><div><div class="aplus-module-kicker">03 · ADMISSION PROFILE</div><h2>Application Readiness</h2><p>Assessment preparation, application evidence and interview readiness — recorded separately from the Academic and Experience Profiles.</p></div><span class="aplus-module-no">03</span></div>'+
 '<div class="formgrid">'+
 '<div class="aplus-small-card"><label>Assessment / test</label><select id="apAssessmentType"><option value="">Not specified</option><option>UCAT</option><option>FSA</option><option>MMI</option><option>Interview / other</option></select></div>'+
 '<div class="aplus-small-card"><label>Assessment preparation</label><select id="apAssessmentReady"><option>Not started</option><option>Preparing</option><option>Ready</option></select></div>'+
 '<div class="aplus-small-card"><label>Personal statement</label><select id="apPersonalStatement"><option>Not started</option><option>Drafting</option><option>Ready</option></select></div>'+
 '<div class="aplus-small-card"><label>Referee reports</label><select id="apReferees"><option value="0">Not arranged</option><option value="1">1 referee</option><option value="2">2 referees</option><option value="3">3+ referees</option></select></div>'+
 '<div class="aplus-small-card"><label>Interview readiness</label><select id="apInterview"><option>Not started</option><option>Preparing</option><option>Ready</option></select></div>'+
 '<div class="aplus-small-card"><label>Application documents</label><select id="apDocuments"><option>Not started</option><option>In progress</option><option>Ready</option></select></div>'+
 '</div><button class="aplus-save" id="apAdmissionSave" style="margin-top:16px">Save Admission Profile</button><div id="apAdmissionStatus" class="aplus-status">Records application preparation only. It does not assess admission chances.</div>';
 ["apAssessmentType","apAssessmentReady","apPersonalStatement","apReferees","apInterview","apDocuments"].forEach(function(id){var el=document.getElementById(id);if(el&&a[id]!==undefined)el.value=String(a[id])});
 document.getElementById("apAdmissionSave").onclick=save;
}
async function save(){
 var a={assessmentType:document.getElementById("apAssessmentType").value,assessmentReady:document.getElementById("apAssessmentReady").value,personalStatement:document.getElementById("apPersonalStatement").value,refereeCount:Number(document.getElementById("apReferees").value||0),interviewReady:document.getElementById("apInterview").value,documentsReady:document.getElementById("apDocuments").value,updatedAt:new Date().toISOString()};
 cache(a);
 if(window.APLUS_PROFILE_STORE&&window.APLUS_PROFILE_STORE.markDirty)window.APLUS_PROFILE_STORE.markDirty();
 if(window.APLUS_PROFILE_STORE&&window.APLUS_PROFILE_STORE.saving)window.APLUS_PROFILE_STORE.saving();
 try{
  var r=window.APLUS_DATABASE&&window.APLUS_DATABASE.saveAdmissionProfile?await window.APLUS_DATABASE.saveAdmissionProfile(a):{ok:false};
  if(!r.ok){document.getElementById("apAdmissionStatus").textContent="Database save was not confirmed. Please try again.";return;}
  if(window.APLUS_PROFILE_STORE&&window.APLUS_PROFILE_STORE.saved)window.APLUS_PROFILE_STORE.saved(r.data||null);
  document.getElementById("apAdmissionStatus").textContent="Admission Profile saved.";
  if(window.APLUS_showSaveSuccess)window.APLUS_showSaveSuccess("Admission Profile");
  if(window.APLUS_refreshDashboard)window.APLUS_refreshDashboard();
 }catch(e){console.warn("Admission Profile save failed:",e);document.getElementById("apAdmissionStatus").textContent="Database save was not confirmed. Please try again."}
}
function init(){
 var run=function(){var planner=document.getElementById("planner"),mount=document.getElementById("admissionProfileEngine");if(!planner)return;if(!mount){mount=document.createElement("section");mount.id="admissionProfileEngine";mount.className="planner aplus-module";planner.appendChild(mount)}render();};
 if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",run);else setTimeout(run,100);
}
window.APLUSAdmissionProfile={hydrateSavedProfile:hydrateFromRow,render:render};init();
})();