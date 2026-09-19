/* APLUS STUDENT PROFILE ENGINE v1.0
   Converts student self-report into structured readiness + requirement evidence state.
*/
(function(){
  "use strict";
  function esc(v){return String(v==null?"":v).replace(/[&<>"]/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[m]));}
  const levels={strong:"Strong",developing:"Developing",needs_work:"Needs building",unknown:"Not assessed"};
  function read(id){const e=document.getElementById(id);return e?e.value:"";}
  function build(){
    const readiness={
      academic:read("spAcademic"),test:read("spTest"),communication:read("spCommunication"),
      leadership:read("spLeadership"),service:read("spService"),application:read("spApplication")
    };
    const subjects=read("spSubjects").split(",").map(x=>x.trim()).filter(Boolean);
    const weakTopics=read("spWeakTopics").split(",").map(x=>x.trim()).filter(Boolean);
    const currentLevel=read("spLevel"), qualification=read("spQualification");
    const targetYear=read("entryYear")||read("dbEntryYear")||"2027";
    const base=window.APLUS_MASTER_PROFILE.create({
      field:read("targetField"),university:read("targetUniversity"),course:read("targetCourse"),
      country:read("targetCountry"),entryYear:targetYear,scholarship:read("targetScholarship"),
      currentLevel,qualification,academicProfile:read("spAcademicProfile"),
      subjects,strengths:read("spStrengths").split(",").map(x=>x.trim()).filter(Boolean),
      weakTopics,readiness,activities:window.APLUS_UI_ACTIVITIES||[]
    });
    try{localStorage.setItem("APLUS_MASTER_PROFILE",JSON.stringify(base));}catch(e){}
    const rr=window.APLUS_MASTER_PROFILE.readiness(base);
    const result=document.getElementById("studentProfileResult");
    result.style.display="block";
    const labels=rr.items.map(x=>'<div class="pbox"><b>'+esc(x[0])+'</b><br><span class="status">'+esc(levels[x[1]]||x[1])+'</span></div>').join("");
    const gaps=rr.items.filter(x=>x[1]==="needs_work"||x[1]==="unknown").map(x=>x[0]);
    result.innerHTML='<h3>Student Profile State</h3>'+
      '<p style="color:#647084">This is a planning state, not an admissions prediction.</p>'+
      '<div class="pgrid">'+labels+'</div>'+
      '<div style="margin-top:16px;padding:14px;border-radius:12px;background:#f8fbff;border:1px solid #dbe4f2">'+
      '<b>Profile completeness</b><br><small>'+esc(rr.known)+' of 6 readiness dimensions assessed · '+esc(rr.status.replaceAll("_"," "))+'</small></div>'+
      (gaps.length?'<div style="margin-top:12px;padding:14px;border-radius:12px;background:#fff4e5"><b>Next evidence to build</b><br><small>'+esc(gaps.join(" · "))+'</small></div>':
      '<div style="margin-top:12px;padding:14px;border-radius:12px;background:#eaf7f1"><b>Core readiness recorded</b><br><small>Next step: map this profile against the target-year requirements database.</small></div>');
    document.getElementById("spSummary").innerHTML=
      '<span class="chip">'+esc(currentLevel)+'</span><span class="chip">'+esc(qualification)+'</span>'+
      '<span class="chip">'+esc(subjects.length?subjects.join(", "):"Subjects not recorded")+'</span>'+
      '<span class="chip">Entry '+esc(targetYear)+'</span>';
    result.scrollIntoView({behavior:"smooth",block:"center"});
  }
  function inject(){
    const planner=document.getElementById("planner");
    if(!planner||document.getElementById("studentProfileEngine"))return;
    const box=document.createElement("div");
    box.id="studentProfileEngine";box.className="planner";box.style.marginTop="22px";
    box.innerHTML=
      '<div class="section-title" style="text-align:left;margin-bottom:20px"><div class="eyebrow" style="color:#2563eb">STUDENT PROFILE ENGINE</div><h2 style="font-size:28px">Turn the student into structured data</h2><p>Academics, subjects, strengths and readiness are stored as a reusable profile that can be matched to every target.</p></div>'+
      '<div class="formgrid">'+
      '<div><label>Current education level</label><select id="spLevel"><option>Primary</option><option>Secondary 1</option><option>Secondary 2</option><option>Secondary 3</option><option>Secondary 4</option><option>JC 1</option><option>JC 2</option><option>Poly Year 1</option><option>Poly Year 2</option><option>Poly Year 3</option></select></div>'+
      '<div><label>Qualification pathway</label><select id="spQualification"><option>A-Level</option><option>IB</option><option>NUS High School Diploma</option><option>Polytechnic Diploma</option><option>Other / undecided</option></select></div>'+
      '<div style="grid-column:1/-1"><label>Current / planned subjects</label><input id="spSubjects" placeholder="e.g. H2 Chemistry, H2 Biology, H1 GP"></div>'+
      '<div style="grid-column:1/-1"><label>Academic profile</label><input id="spAcademicProfile" placeholder="e.g. Strong Chemistry, improving Biology, current grade trend..."></div>'+
      '<div><label>Strengths</label><input id="spStrengths" placeholder="e.g. communication, maths"></div>'+
      '<div><label>Weak topics / gaps</label><input id="spWeakTopics" placeholder="e.g. organic chemistry, time management"></div>'+
      '<div><label>Academic readiness</label><select id="spAcademic"><option value="unknown">Not assessed</option><option value="strong">Strong</option><option value="developing">Developing</option><option value="needs_work">Needs building</option></select></div>'+
      '<div><label>Test / assessment readiness</label><select id="spTest"><option value="unknown">Not assessed</option><option value="strong">Strong</option><option value="developing">Developing</option><option value="needs_work">Needs building</option></select></div>'+
      '<div><label>Communication readiness</label><select id="spCommunication"><option value="unknown">Not assessed</option><option value="strong">Strong</option><option value="developing">Developing</option><option value="needs_work">Needs building</option></select></div>'+
      '<div><label>Leadership readiness</label><select id="spLeadership"><option value="unknown">Not assessed</option><option value="strong">Strong</option><option value="developing">Developing</option><option value="needs_work">Needs building</option></select></div>'+
      '<div><label>Service / community readiness</label><select id="spService"><option value="unknown">Not assessed</option><option value="strong">Strong</option><option value="developing">Developing</option><option value="needs_work">Needs building</option></select></div>'+
      '<div><label>Application readiness</label><select id="spApplication"><option value="unknown">Not assessed</option><option value="strong">Strong</option><option value="developing">Developing</option><option value="needs_work">Needs building</option></select></div>'+
      '</div><div id="spSummary" style="margin-top:16px"></div><button class="next" onclick="APLUS_BUILD_STUDENT_PROFILE()">Save Student Profile →</button><div id="studentProfileResult" class="result"></div>';
    planner.parentNode.insertBefore(box,document.getElementById("activityEvidencePanel")||document.getElementById("result"));
  }
  window.APLUS_BUILD_STUDENT_PROFILE=build;
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",inject);else inject();
})();