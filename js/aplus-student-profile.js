/* APLUS STUDENT PROFILE ENGINE v2.0
   Longitudinal student profile: one reusable record powering targets, gaps, roadmap and planning intelligence.
*/
(function(){
  "use strict";
  const esc=v=>String(v==null?"":v).replace(/[&<>"]/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[m]));
  const arr=v=>Array.isArray(v)?v:[];
  const read=id=>{const e=document.getElementById(id);return e?e.value:"";};
  const split=id=>read(id).split(",").map(x=>x.trim()).filter(Boolean);
  const labels={strong:"Strong",developing:"Developing",needs_work:"Needs building",unknown:"Not assessed"};

  function collect(){
    const activities=arr(window.APLUS_UI_ACTIVITIES);
    const readiness={
      academic:read("spAcademic")||"unknown",test:read("spTest")||"unknown",
      communication:read("spCommunication")||"unknown",leadership:read("spLeadership")||"unknown",
      service:read("spService")||"unknown",application:read("spApplication")||"unknown"
    };
    const raw={
      field:read("targetField"),university:read("targetUniversity"),course:read("targetCourse"),
      country:read("targetCountry"),entryYear:read("entryYear")||read("dbEntryYear")||"2027",
      scholarship:read("targetScholarship"),currentLevel:read("spLevel"),qualification:read("spQualification"),
      academicProfile:read("spAcademicProfile"),subjects:split("spSubjects"),strengths:split("spStrengths"),
      weakTopics:split("spWeakTopics"),readiness,activities
    };
    const base=window.APLUS_MASTER_PROFILE.create(raw);\n    base.studentName=read("studentName")||"";
    base.schemaVersion="2.0";
    base.profile.profileCompleteness={
      subjects:base.profile.subjects.length>0,
      academicDescription:!!base.profile.academicProfile,
      strengths:base.profile.strengths.length>0,
      weakTopics:base.profile.weakTopics.length>0
    };
    base.evidence.activitySummary={
      total:activities.length,
      leadership:activities.filter(a=>String(a.leadership||a.role||"").toLowerCase().includes("lead")).length,
      service:activities.filter(a=>String(a.category||a.type||"").toLowerCase().includes("service")).length,
      withOutcome:activities.filter(a=>a.result||a.outcome).length,
      withReflection:activities.filter(a=>a.reflection).length
    };
    base.application.profileStatus="active";
    base.metadata.evidenceQuality=activities.length?"self_reported_with_activity_evidence":"self_reported";
    base.metadata.profileVersion="2.0";
    return base;
  }

  function save(profile){
    try{
      const previous=JSON.parse(localStorage.getItem("APLUS_MASTER_PROFILE")||"null");
      if(previous){
        const history=arr(JSON.parse(localStorage.getItem("APLUS_PROFILE_HISTORY")||"[]"));
        history.unshift({savedAt:new Date().toISOString(),summary:window.APLUS_MASTER_PROFILE.summary(previous)});
        localStorage.setItem("APLUS_PROFILE_HISTORY",JSON.stringify(history.slice(0,12)));
      }
      localStorage.setItem("APLUS_MASTER_PROFILE",JSON.stringify(profile));
    }catch(e){}
  }

  function build(){
    const base=collect(); save(base);
    const rr=window.APLUS_MASTER_PROFILE.readiness(base);
    const result=document.getElementById("studentProfileResult");
    if(!result)return;
    const gaps=rr.items.filter(x=>x[1]==="needs_work"||x[1]==="unknown");
    const a=base.evidence.activitySummary;
    result.style.display="block";
    result.innerHTML=
      '<div class="sp2-header"><div><div class="eyebrow" style="color:#2563eb">PROFILE SAVED · VERSION 2.0</div><h3>Student Profile is now a reusable planning record.</h3><p>New evidence can be added over time without rebuilding the profile from scratch.</p></div><span class="sp2-badge">LONGITUDINAL</span></div>'+
      '<div class="sp2-stats"><div><b>'+esc(rr.known)+'/6</b><span>readiness dimensions assessed</span></div><div><b>'+esc(a.total)+'</b><span>activities recorded</span></div><div><b>'+esc(a.withOutcome)+'</b><span>activities with outcomes</span></div><div><b>'+esc(a.withReflection)+'</b><span>activities with reflection</span></div></div>'+
      '<div class="pgrid">'+rr.items.map(x=>'<div class="pbox"><b>'+esc(x[0])+'</b><br><span class="status">'+esc(labels[x[1]]||x[1])+'</span></div>').join("")+'</div>'+
      (gaps.length?'<div class="sp2-callout"><b>Evidence to clarify next</b><div>'+esc(gaps.map(x=>x[0]).join(" · "))+'</div></div>':'<div class="sp2-callout good"><b>Core readiness recorded</b><div>Next step: map this profile against the target-year requirements and Planning Intelligence.</div></div>')+
      '<div class="sp2-foot">Database sync: '+esc(base.metadata.databaseSync||"local_only")+' · Last updated '+esc(new Date().toLocaleDateString("en-SG"))+' · '+esc(base.studentId)+'</div>';
    const summary=document.getElementById("spSummary");
    if(summary)summary.innerHTML=
      '<span class="chip">'+esc(base.profile.currentLevel||"Level not recorded")+'</span>'+
      '<span class="chip">'+esc(base.profile.qualification||"Qualification not recorded")+'</span>'+
      '<span class="chip">'+esc(base.target.course||"Target course not selected")+'</span>'+
      '<span class="chip">Entry '+esc(base.target.entryYear||"—")+'</span>';
    result.scrollIntoView({behavior:"smooth",block:"center"});
    if(window.APLUS_REFRESH_PLANNING_INTELLIGENCE)setTimeout(window.APLUS_REFRESH_PLANNING_INTELLIGENCE,50);
  }

  function injectStyle(){
    if(document.getElementById("sp2Styles"))return;
    const s=document.createElement("style");s.id="sp2Styles";
    s.textContent=`
      .sp2-header{display:flex;justify-content:space-between;gap:20px;align-items:flex-start;margin-bottom:18px}.sp2-header h3{font-size:21px;margin:7px 0}.sp2-header p{font-size:12px;color:#667085;margin:0;line-height:1.5}.sp2-badge{font-size:9px;font-weight:900;letter-spacing:.12em;padding:7px 9px;border-radius:999px;background:#eef2ff;color:#3157ff;white-space:nowrap}
      .sp2-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:9px;margin-bottom:14px}.sp2-stats>div{border:1px solid #e8ebf2;border-radius:12px;padding:13px;background:#fff}.sp2-stats b{display:block;font-size:20px}.sp2-stats span{font-size:10px;color:#667085}
      .sp2-callout{margin-top:14px;padding:14px;border-radius:12px;background:#fff7e8;border:1px solid #f5dfb5;font-size:11px;line-height:1.6}.sp2-callout.good{background:#eaf7f1;border-color:#ccebdd}.sp2-foot{font-size:10px;color:#98a2b3;margin-top:13px}
      @media(max-width:700px){.sp2-stats{grid-template-columns:1fr 1fr}.sp2-header{flex-direction:column}}
    `;
    document.head.appendChild(s);
  }

  function inject(){
    injectStyle();
    const planner=document.getElementById("planner");
    if(!planner||document.getElementById("studentProfileEngine"))return;
    const box=document.createElement("div");
    box.id="studentProfileEngine";box.className="planner";box.style.marginTop="22px";
    box.innerHTML=
      '<div class="section-title" style="text-align:left;margin-bottom:20px"><div class="eyebrow" style="color:#2563eb">STUDENT PROFILE 2.0</div><h2 style="font-size:28px">Build one profile that grows with the student.</h2><p>Capture academic context, development readiness and evidence once. APLUS can reuse the profile across multiple target courses and planning cycles.</p></div>'+
      '<div class="formgrid">'+
      '<div><label>Current education level</label><select id="spLevel"><option>Primary</option><option>Secondary 1</option><option>Secondary 2</option><option>Secondary 3</option><option>Secondary 4</option><option>JC 1</option><option>JC 2</option><option>Poly Year 1</option><option>Poly Year 2</option><option>Poly Year 3</option></select></div>'+
      '<div><label>Qualification pathway</label><select id="spQualification"><option>A-Level</option><option>IB</option><option>NUS High School Diploma</option><option>Polytechnic Diploma</option><option>Other / undecided</option></select></div>'+
      '<div style="grid-column:1/-1"><label>Current / planned subjects</label><input id="spSubjects" placeholder="e.g. H2 Chemistry, H2 Biology, H1 GP"></div>'+
      '<div style="grid-column:1/-1"><label>Academic profile</label><input id="spAcademicProfile" placeholder="e.g. Strong Chemistry, improving Biology, current grade trend..."></div>'+
      '<div><label>Strengths</label><input id="spStrengths" placeholder="e.g. communication, mathematics"></div>'+
      '<div><label>Weak topics / gaps</label><input id="spWeakTopics" placeholder="e.g. organic chemistry, time management"></div>'+
      '<div><label>Academic readiness</label><select id="spAcademic"><option value="unknown">Not assessed</option><option value="strong">Strong</option><option value="developing">Developing</option><option value="needs_work">Needs building</option></select></div>'+
      '<div><label>Test / assessment readiness</label><select id="spTest"><option value="unknown">Not assessed</option><option value="strong">Strong</option><option value="developing">Developing</option><option value="needs_work">Needs building</option></select></div>'+
      '<div><label>Communication readiness</label><select id="spCommunication"><option value="unknown">Not assessed</option><option value="strong">Strong</option><option value="developing">Developing</option><option value="needs_work">Needs building</option></select></div>'+
      '<div><label>Leadership readiness</label><select id="spLeadership"><option value="unknown">Not assessed</option><option value="strong">Strong</option><option value="developing">Developing</option><option value="needs_work">Needs building</option></select></div>'+
      '<div><label>Service / community readiness</label><select id="spService"><option value="unknown">Not assessed</option><option value="strong">Strong</option><option value="developing">Developing</option><option value="needs_work">Needs building</option></select></div>'+
      '<div><label>Application readiness</label><select id="spApplication"><option value="unknown">Not assessed</option><option value="strong">Strong</option><option value="developing">Developing</option><option value="needs_work">Needs building</option></select></div>'+
      '</div><div id="spSummary" style="margin-top:16px"></div><button class="next" onclick="APLUS_BUILD_STUDENT_PROFILE()">Save & Update My Profile →</button><div id="studentProfileResult" class="result"></div>';
    planner.parentNode.insertBefore(box,document.getElementById("activityEvidencePanel")||document.getElementById("result"));
  }

  window.APLUS_BUILD_STUDENT_PROFILE=build;
  window.APLUS_STUDENT_PROFILE={collect,save,build};
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",inject);else inject();
})();