/* APLUS APPLICATION PROFILE v1.0 — independent 09 Application boundary */
(function(){
"use strict";
function load(){try{return JSON.parse(localStorage.getItem("APLUS_MASTER_PROFILE")||"null")}catch(e){return null}}
function build(){
 const profile=load();
 if(!profile)return {ok:false,message:"Student profile not found."};
 if(window.APLUS_APPLICATION_COMBINATION&&typeof window.APLUS_APPLICATION_COMBINATION.build==="function")return window.APLUS_APPLICATION_COMBINATION.build();
 return {ok:false,message:"Application engine is not ready."};
}
function run(){const r=build();try{localStorage.setItem("APLUS_APPLICATION_PROFILE",JSON.stringify(r))}catch(e){};return r}
window.APLUSApplicationProfile={version:"1.0",build,run};
})();