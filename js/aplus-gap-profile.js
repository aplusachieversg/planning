/* APLUS GAP PROFILE v1.0 — independent 07 Gap Analysis boundary */
(function(){
"use strict";
function load(){try{return JSON.parse(localStorage.getItem("APLUS_MASTER_PROFILE")||"null")}catch(e){return null}}
async function run(profile){
 profile=profile||load();
 if(!profile)return {ok:false,code:"profile_missing",message:"Student profile not found."};
 if(window.APLUS_REQUIREMENTS&&window.APLUS_REQUIREMENTS.sync){try{await window.APLUS_REQUIREMENTS.sync(profile.target&&profile.target.university,profile.target&&profile.target.course,profile.target&&profile.target.entryYear)}catch(e){}}
 if(window.APLUS_DIAGNOSTIC_02&&typeof window.APLUS_DIAGNOSTIC_02.assess==="function")return {ok:true,data:window.APLUS_DIAGNOSTIC_02.assess(profile)};
 if(window.APLUS_RUN_DIAGNOSTIC_02){window.APLUS_RUN_DIAGNOSTIC_02();return {ok:true,code:"legacy_runner"}}
 return {ok:false,code:"engine_missing",message:"Gap engine is not ready."};
}
window.APLUSGapProfile={version:"1.0",run,getState:function(){return window.APLUS_GAP_STATE||"ready"}};
window.APLUS_GAP_STATE="ready";
})();