/* APLUS ROADMAP PROFILE v1.0 — independent 08 Development/Roadmap boundary */
(function(){
"use strict";
function load(){try{return JSON.parse(localStorage.getItem("APLUS_MASTER_PROFILE")||"null")}catch(e){return null}}
function build(profile){
 profile=profile||load();
 if(!profile)return {ok:false,message:"Student profile not found."};
 if(window.APLUS_DEVELOPMENT_ROADMAP&&typeof window.APLUS_DEVELOPMENT_ROADMAP.build==="function")return window.APLUS_DEVELOPMENT_ROADMAP.build(profile,{focus:"Full profile"});
 return {ok:false,message:"Roadmap engine is not ready."};
}
function run(){const r=build();try{localStorage.setItem("APLUS_ROADMAP_PROFILE",JSON.stringify(r))}catch(e){};return r}
window.APLUSRoadmapProfile={version:"1.0",build,run};
})();