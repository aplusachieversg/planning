/* APLUS TARGET PROFILE v1.0
   04 · Target — independent profile module.
   Lifecycle: READ → HYDRATE → READY → USER EDIT → DIRTY → SAVE.
   Target is stored in the canonical student_profiles row.
*/
(function(){
  "use strict";

  const KEY="aplus_target_profile_v1";
  const DEFAULTS={
    field:"",
    university:"",
    course:"",
    country:"",
    entryYear:"",
    scholarship:"Not decided"
  };

  function clean(v){return v==null?"":String(v).trim();}
  function esc(v){return String(v==null?"":v).replace(/[&<>"]/g,function(m){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[m]});}
  function load(){
    try{return Object.assign({},DEFAULTS,JSON.parse(localStorage.getItem(KEY)||"{}"))}
    catch(e){return Object.assign({},DEFAULTS);}
  }
  function cache(data){
    try{localStorage.setItem(KEY,JSON.stringify(data));}catch(e){}
  }
  function syncMasterCache(data){
    try{
      var master=JSON.parse(localStorage.getItem("APLUS_MASTER_PROFILE")||"{}");
      master.target=Object.assign({},master.target||{},{
        field:data.field||"",
        university:data.university||"",
        course:data.course||"",
        country:data.country||"",
        entryYear:data.entryYear?Number(data.entryYear):null,
        scholarship:data.scholarship||"Not decided"
      });
      localStorage.setItem("APLUS_MASTER_PROFILE",JSON.stringify(master));
      if(window.APLUS_refreshDashboard)window.APLUS_refreshDashboard();
    }catch(e){console.warn("Target master cache sync skipped:",e);}
  }
  function fromRow(row){
    var t=row&&row.target_profile;
    if(t&&typeof t==="object")return Object.assign({},DEFAULTS,t);
    return {
      field:clean(row&&row.academic_profile&&row.academic_profile.field),
      university:clean(row&&row.target_university),
      course:clean(row&&row.target_programme),
      country:"",
      entryYear:row&&row.entry_year?Number(row.entry_year):"",
      scholarship:"Not decided"
    };
  }
  function hydrateSavedProfile(row){
    try{
      var t=fromRow(row);
      cache(t);
      syncMasterCache(t);
      render(t);
      return true;
    }catch(e){console.warn("Target Profile hydrate failed:",e);return false;}
  }
  function option(value,label){
    return '<option value="'+esc(value)+'">'+esc(label)+'</option>';
  }
  function render(data){
    var mount=document.getElementById("targetProfileEngine");
    if(!mount)return false;
    var t=data||load();
    var years=[];
    var current=new Date().getFullYear();
    for(var y=current;y<=current+8;y++)years.push(y);
    mount.innerHTML=
      '<div class="aplus-module-head"><div><div class="aplus-module-kicker">04 · TARGET</div><h2>Target & Direction</h2><p>Define the destination that the Requirements, Gap, Roadmap and Application modules will use.</p></div><span class="aplus-module-no">04</span></div>'+
      '<div class="formgrid">'+
      '<div><label>Target field</label><select id="targetField">'+
        option("","Select field")+option("Medicine","Medicine")+option("Law","Law")+option("Business","Business")+option("Computer Science","Computer Science")+option("Engineering","Engineering")+option("Dentistry","Dentistry")+option("Other","Other")+
      '</select></div>'+
      '<div><label>Target university</label><select id="targetUniversity">'+
        option("","Select university")+option("NUS Medicine","NUS Medicine")+option("NTU Medicine","NTU Medicine")+option("UK Medicine","UK Medicine")+option("Australia Medicine","Australia Medicine")+option("NUS Law","NUS Law")+
      '</select></div>'+
      '<div><label>Target course / programme</label><input id="targetCourse" type="text" placeholder="e.g. Medicine" /></div>'+
      '<div><label>Target entry year</label><select id="targetEntryYear">'+
        option("","Select entry year")+years.map(function(y){return option(String(y),String(y));}).join("")+
      '</select></div>'+
      '<div><label>Country / region</label><input id="targetCountry" type="text" placeholder="e.g. Singapore" /></div>'+
      '<div><label>Scholarship interest</label><select id="targetScholarship">'+
        option("Not decided","Not decided")+option("Yes","Yes")+option("No","No")+
      '</select></div>'+
      '</div>'+
      '<div style="display:flex;justify-content:flex-end;margin-top:16px"><button class="aplus-save" id="targetSave">Save Target</button></div>'+
      '<div id="targetProfileStatus" class="aplus-status">Target is loaded from your saved profile. Editing does not save until you press Save Target.</div>';
    setValue("targetField",t.field);
    setValue("targetUniversity",t.university);
    setValue("targetCourse",t.course);
    setValue("targetEntryYear",t.entryYear);
    setValue("targetCountry",t.country);
    setValue("targetScholarship",t.scholarship||"Not decided");
    ["targetField","targetUniversity","targetCourse","targetEntryYear","targetCountry","targetScholarship"].forEach(function(id){
      var el=document.getElementById(id);
      if(el){
        el.addEventListener("input",markDirty);
        el.addEventListener("change",markDirty);
      }
    });
    document.getElementById("targetSave").onclick=save;
    return true;
  }
  function setValue(id,value){
    var el=document.getElementById(id);
    if(el&&value!==undefined&&value!==null)el.value=String(value);
  }
  function read(){
    return {
      field:clean(document.getElementById("targetField")&&document.getElementById("targetField").value),
      university:clean(document.getElementById("targetUniversity")&&document.getElementById("targetUniversity").value),
      course:clean(document.getElementById("targetCourse")&&document.getElementById("targetCourse").value),
      country:clean(document.getElementById("targetCountry")&&document.getElementById("targetCountry").value),
      entryYear:clean(document.getElementById("targetEntryYear")&&document.getElementById("targetEntryYear").value),
      scholarship:clean(document.getElementById("targetScholarship")&&document.getElementById("targetScholarship").value)||"Not decided"
    };
  }
  function markDirty(){
    if(window.APLUS_PROFILE_STORE&&window.APLUS_PROFILE_STORE.markDirty)window.APLUS_PROFILE_STORE.markDirty();
  }
  async function save(){
    var data=read();
    if(!data.field||!data.university||!data.course||!data.entryYear){
      document.getElementById("targetProfileStatus").textContent="Please complete Target field, university, course and entry year.";
      return;
    }
    var btn=document.getElementById("targetSave");
    if(btn)btn.disabled=true;
    cache(data);
    syncMasterCache(data);
    if(window.APLUS_PROFILE_STORE&&window.APLUS_PROFILE_STORE.markDirty)window.APLUS_PROFILE_STORE.markDirty();
    if(window.APLUS_PROFILE_STORE&&window.APLUS_PROFILE_STORE.saving)window.APLUS_PROFILE_STORE.saving();
    try{
      var r=window.APLUS_DATABASE&&window.APLUS_DATABASE.saveTargetProfile
        ?await window.APLUS_DATABASE.saveTargetProfile(data)
        :{ok:false};
      if(!r.ok){
        document.getElementById("targetProfileStatus").textContent="Database save was not confirmed. Please try again.";
        return;
      }
      if(window.APLUS_PROFILE_STORE&&window.APLUS_PROFILE_STORE.saved)window.APLUS_PROFILE_STORE.saved(r.data||null);
      document.getElementById("targetProfileStatus").textContent="Target saved: "+data.university+" · "+data.course+" · Entry "+data.entryYear;
      if(window.APLUS_showSaveSuccess)window.APLUS_showSaveSuccess("Target");
      if(window.APLUS_refreshDashboard)window.APLUS_refreshDashboard();
    }catch(e){
      console.warn("Target Profile save failed:",e);
      document.getElementById("targetProfileStatus").textContent="Database save was not confirmed. Please try again.";
    }finally{if(btn)btn.disabled=false;}
  }
  function init(){
    var run=function(){
      var planner=document.getElementById("planner");
      if(!planner){setTimeout(run,250);return;}
      var mount=document.getElementById("targetProfileEngine");
      if(!mount){
        mount=document.createElement("section");
        mount.id="targetProfileEngine";
        mount.className="planner aplus-module";
        planner.appendChild(mount);
      }
      render();
    };
    if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",run);else setTimeout(run,120);
  }
  window.APLUSTargetProfile={
    render:render,
    hydrateSavedProfile:hydrateSavedProfile,
    get:load,
    read:read
  };
  init();
})();