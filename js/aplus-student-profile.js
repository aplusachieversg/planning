/* APLUS STUDENT PROFILE DIAGNOSTIC v3.0
   Diagnostic 01: establish the student's current academic and development baseline.
   Output is diagnostic, not an admissions prediction or ranking.
*/
(function(){
  "use strict";
  const esc=v=>String(v==null?"":v).replace(/[&<>"]/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[m]));
  const arr=v=>Array.isArray(v)?v:[];
  const read=id=>{const e=document.getElementById(id);return e?e.value:"";};
  const split=id=>read(id).split(",").map(x=>x.trim()).filter(Boolean);

  const labels={
    strong:"Strong",
    developing:"Developing",
    needs_work:"Needs building",
    unknown:"Not assessed"
  };

  const diagnosticLabels={
    academic:"Academic foundation",
    consistency:"Academic consistency",
    subjects:"Subject readiness",
    assessment:"Assessment readiness",
    communication:"Communication",
    leadership:"Leadership",
    service:"Service / community",
    application:"Application readiness"
  };

  function collect(){
    const activities=arr(window.APLUS_UI_ACTIVITIES);
    const readiness={
      academic:read("spAcademic")||"unknown",
      test:read("spTest")||"unknown",
      communication:read("spCommunication")||"unknown",
      leadership:read("spLeadership")||"unknown",
      service:read("spService")||"unknown",
      application:read("spApplication")||"unknown"
    };

    const legacyTarget=read("uni");
    const isUK=/^UK Medicine$/i.test(legacyTarget);
    const isAustralia=/^Australia Medicine$/i.test(legacyTarget);
    const targetUniversity=/^NUS Medicine$/i.test(legacyTarget)?"NUS":/^NTU Medicine$/i.test(legacyTarget)?"NTU":legacyTarget;
    const targetCourse=/(Medicine)$/i.test(legacyTarget)?"Medicine":legacyTarget;
    const targetCountry=isUK?"United Kingdom":isAustralia?"Australia":"Singapore";

    const raw={
      field:read("field"),
      university:targetUniversity,
      course:targetCourse,
      country:targetCountry,
      entryYear:read("entryYear")||read("dbEntryYear")||"2027",
      scholarship:read("targetScholarship"),
      currentLevel:read("spLevel")||read("level")||"Not specified",
      qualification:read("spQualification"),
      academicProfile:read("spAcademicProfile"),
      subjects:split("spSubjects"),
      strengths:split("spStrengths"),
      weakTopics:split("spWeakTopics"),
      readiness,
      activities
    };

    const base=window.APLUS_MASTER_PROFILE.create(raw);
    base.studentName=read("studentName")||"";
    base.schemaVersion="3.0";
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
    base.metadata.profileVersion="3.0";
    return base;
  }

  function diagnosticState(base){
    const r=base.readiness||{};
    const p=base.profile||{};
    const subjects=arr(p.subjects);
    const completeness=p.profileCompleteness||{};

    const state={
      academic:r.academic||"unknown",
      consistency:completeness.academicDescription&&r.academic!=="unknown"?"recorded":"unknown",
      subjects:subjects.length?((subjects.join(" ").toLowerCase().match(/chem|biology|physics|math|economics|history|literature|computing|english/g)||[]).length?"recorded":"developing"):"unknown",
      assessment:r.test||"unknown",
      communication:r.communication||"unknown",
      leadership:r.leadership||"unknown",
      service:r.service||"unknown",
      application:r.application||"unknown"
    };

    const next=[];
    if(state.academic==="needs_work"||state.academic==="unknown") next.push("Clarify current academic level and the main learning gaps.");
    if(state.consistency==="unknown") next.push("Record the recent grade trend, not only the latest result.");
    if(state.subjects==="unknown") next.push("Record current or planned subjects so subject readiness can be checked.");
    if(state.assessment==="needs_work"||state.assessment==="unknown") next.push("Establish assessment readiness and identify any required test preparation.");
    if(state.communication==="needs_work"||state.communication==="unknown") next.push("Build evidence of structured communication and reflection.");
    if(state.leadership==="needs_work"||state.leadership==="unknown") next.push("Record sustained responsibility rather than isolated participation.");
    if(state.service==="needs_work"||state.service==="unknown") next.push("Record meaningful service/community contribution and outcomes.");
    if(state.application==="needs_work"||state.application==="unknown") next.push("Clarify application components that may need preparation later.");
    return {state,next};
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
      localStorage.setItem("APLUS_DIAGNOSTIC_01",JSON.stringify({
        version:"3.0",
        completedAt:new Date().toISOString(),
        state:diagnosticState(profile).state
      }));
    }catch(e){}
  }

  function statusClass(v){
    return v==="strong"?"good":v==="needs_work"?"warn":v==="developing"?"mid":"neutral";
  }

  async function build(){
    const base=collect();
    const diag=diagnosticState(base);
    base.diagnostic01={
      version:"3.0",
      completedAt:new Date().toISOString(),
      dimensions:diag.state,
      nextActions:diag.next
    };
    save(base);

    let dbSync="local_only";
    if(window.APLUS_DATABASE&&window.APLUS_DATABASE.saveStudentProfile){
      const db=await window.APLUS_DATABASE.saveStudentProfile(base);
      dbSync=db.ok?"synced":(db.code||"not_synced");
      base.metadata.databaseSync=dbSync;
      save(base);
    }

    const result=document.getElementById("studentProfileResult");
    if(!result)return;

    if(dbSync!=="synced"){
      result.style.display="block";
      result.innerHTML='<div class="sp2-callout"><b>DATABASE SYNC NOT CONFIRMED</b><div>The diagnostic is saved locally, but the Supabase save was not confirmed. Please try again.</div><div class="sp2-foot">Sync status: '+esc(dbSync)+'</div></div>';
      return;
    }

    const vals=Object.values(diag.state);
    const assessed=vals.filter(v=>v!=="unknown").length;
    const strong=vals.filter(v=>v==="strong").length;
    const needs=vals.filter(v=>v==="needs_work").length;
    const profileCompleteness=Object.values(base.profile.profileCompleteness||{}).filter(Boolean).length;

    result.style.display="block";
    result.innerHTML=
      '<div class="sp2-header"><div><div class="eyebrow" style="color:#3157ff">DIAGNOSTIC 01 · COMPLETED</div><h3>Student Baseline Diagnostic</h3><p>This establishes where the student is now before APLUS checks target-specific requirements.</p></div><span class="sp2-badge">BASELINE</span></div>'+
      '<div class="sp2-stats">'+
        '<div><b>'+assessed+'/8</b><span>dimensions assessed</span></div>'+
        '<div><b>'+strong+'</b><span>dimensions recorded as strong</span></div>'+
        '<div><b>'+needs+'</b><span>dimensions needing development</span></div>'+
        '<div><b>'+profileCompleteness+'/4</b><span>profile evidence fields</span></div>'+
      '</div>'+
      '<div class="diag-grid">'+Object.keys(diag.state).map(k=>
        '<div class="diag-box '+statusClass(diag.state[k])+'"><div class="diag-label">'+esc(diagnosticLabels[k])+'</div><div class="diag-status">'+esc(labels[diag.state[k]]||diag.state[k])+'</div></div>'
      ).join("")+'</div>'+
      '<div class="sp2-callout '+(diag.next.length?"":"good")+'"><b>'+(diag.next.length?"What to clarify next":"Baseline recorded")+'</b><ul>'+((diag.next.length?diag.next:["Core baseline information has been recorded. The next diagnostic can now compare it with target-specific requirements."]).map(x=>'<li>'+esc(x)+'</li>').join(""))+'</ul></div>'+
      '<div class="sp2-foot">Diagnostic 01 · '+esc(new Date().toLocaleDateString("en-SG"))+' · Database sync: '+esc(base.metadata.databaseSync||"local_only")+' · '+esc(base.studentId)+'</div>';

    const summary=document.getElementById("spSummary");
    if(summary)summary.innerHTML=
      '<span class="chip">'+esc(base.profile.currentLevel||"Level not recorded")+'</span>'+
      '<span class="chip">'+esc(base.profile.qualification||"Qualification not recorded")+'</span>'+
      '<span class="chip">'+esc(base.target.course||"Target course not selected")+'</span>'+
      '<span class="chip">Entry '+esc(base.target.entryYear||"—")+'</span>';

    if(window.APLUS_REFRESH_PLANNING_INTELLIGENCE){
      try{ await window.APLUS_REFRESH_PLANNING_INTELLIGENCE(); }
      catch(e){
        const pi=document.getElementById("planningIntelligenceHost");
        if(pi)pi.innerHTML='<div class="pi-panel"><b>Planning Intelligence refresh error</b><p>Please refresh the page and try again.</p></div>';
      }
    }
  }

  function injectStyle(){
    if(document.getElementById("sp3Styles"))return;
    const s=document.createElement("style");
    s.id="sp3Styles";
    s.textContent=
      '.sp2-header{display:flex;justify-content:space-between;gap:20px;align-items:flex-start;margin-bottom:18px}'+
      '.sp2-header h3{font-size:22px;margin:7px 0}.sp2-header p{font-size:12px;color:#667085;margin:0;line-height:1.5}'+
      '.sp2-badge{font-size:9px;font-weight:900;letter-spacing:.12em;padding:7px 9px;border-radius:999px;background:#eef2ff;color:#3157ff;white-space:nowrap}'+
      '.sp2-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:9px;margin-bottom:14px}'+
      '.sp2-stats>div{border:1px solid #e8ebf2;border-radius:12px;padding:13px;background:#fff}.sp2-stats b{display:block;font-size:20px}.sp2-stats span{font-size:10px;color:#667085}'+
      '.diag-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:10px}'+
      '.diag-box{border:1px solid #e8ebf2;border-radius:14px;padding:15px;background:#fff}'+
      '.diag-box.good{border-color:#ccebdd;background:#f2fbf6}.diag-box.warn{border-color:#f5dfb5;background:#fff9ed}.diag-box.mid{border-color:#dbe4ff;background:#f7f9ff}.diag-box.neutral{background:#fafbfc}'+
      '.diag-label{font-size:12px;font-weight:850}.diag-status{font-size:11px;color:#667085;margin-top:6px}'+
      '.sp2-callout{margin-top:14px;padding:14px;border-radius:12px;background:#fff7e8;border:1px solid #f5dfb5;font-size:11px;line-height:1.6}.sp2-callout.good{background:#eaf7f1;border-color:#ccebdd}.sp2-callout ul{margin:7px 0 0;padding-left:18px}.sp2-callout li{margin:4px 0}.sp2-foot{font-size:10px;color:#98a2b3;margin-top:13px}'+
      '@media(max-width:700px){.sp2-stats{grid-template-columns:1fr 1fr}.sp2-header{flex-direction:column}.diag-grid{grid-template-columns:1fr}}';
    document.head.appendChild(s);
  }

  function inject(){
    injectStyle();
    const planner=document.getElementById("planner");
    if(!planner||document.getElementById("studentProfileEngine"))return;

    const box=document.createElement("div");
    box.id="studentProfileEngine";
    box.className="planner";
    box.style.marginTop="22px";

    box.innerHTML=
      '<div class="section-title" style="text-align:left;margin-bottom:20px">'+
        '<div class="eyebrow" style="color:#3157ff">DIAGNOSTIC 01 · STUDENT BASELINE</div>'+
        '<h2 style="font-size:28px">Understand the student before analysing the target.</h2>'+
        '<p>Capture the student\'s current academic position, development readiness and evidence baseline. This diagnostic is the starting point for every later planning analysis.</p>'+
      '</div>'+
      '<div class="formgrid">'+
        '<div><label>Current education level</label><select id="spLevel"><option>Primary</option><option>Secondary 1</option><option>Secondary 2</option><option>Secondary 3</option><option>Secondary 4</option><option>JC 1</option><option>JC 2</option><option>Poly Year 1</option><option>Poly Year 2</option><option>Poly Year 3</option></select></div>'+
        '<div><label>Qualification pathway</label><select id="spQualification"><option>A-Level</option><option>IB</option><option>NUS High School Diploma</option><option>Polytechnic Diploma</option><option>Other / undecided</option></select></div>'+
        '<div style="grid-column:1/-1"><label>Current / planned subjects</label><input id="spSubjects" placeholder="e.g. H2 Chemistry, H2 Biology, H1 GP"></div>'+
        '<div style="grid-column:1/-1"><label>Academic profile</label><input id="spAcademicProfile" placeholder="Include recent grades, grade trend, learning strengths and key gaps"></div>'+
        '<div><label>Strengths</label><input id="spStrengths" placeholder="e.g. communication, mathematics"></div>'+
        '<div><label>Weak topics / gaps</label><input id="spWeakTopics" placeholder="e.g. organic chemistry, time management"></div>'+
        '<div><label>Academic foundation</label><select id="spAcademic"><option value="unknown">Not assessed</option><option value="strong">Strong</option><option value="developing">Developing</option><option value="needs_work">Needs building</option></select></div>'+
        '<div><label>Assessment readiness</label><select id="spTest"><option value="unknown">Not assessed</option><option value="strong">Strong</option><option value="developing">Developing</option><option value="needs_work">Needs building</option></select></div>'+
        '<div><label>Communication readiness</label><select id="spCommunication"><option value="unknown">Not assessed</option><option value="strong">Strong</option><option value="developing">Developing</option><option value="needs_work">Needs building</option></select></div>'+
        '<div><label>Leadership readiness</label><select id="spLeadership"><option value="unknown">Not assessed</option><option value="strong">Strong</option><option value="developing">Developing</option><option value="needs_work">Needs building</option></select></div>'+
        '<div><label>Service / community readiness</label><select id="spService"><option value="unknown">Not assessed</option><option value="strong">Strong</option><option value="developing">Developing</option><option value="needs_work">Needs building</option></select></div>'+
        '<div><label>Application readiness</label><select id="spApplication"><option value="unknown">Not assessed</option><option value="strong">Strong</option><option value="developing">Developing</option><option value="needs_work">Needs building</option></select></div>'+
      '</div>'+
      '<div id="spSummary" style="margin-top:16px"></div>'+
      '<button class="next" onclick="APLUS_BUILD_STUDENT_PROFILE()">Complete Diagnostic 01 →</button>'+
      '<div id="studentProfileResult" class="result"></div>';

    planner.appendChild(box);
  }

  window.APLUS_BUILD_STUDENT_PROFILE=build;
  window.APLUS_STUDENT_PROFILE={collect,save,build,diagnosticState};

  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",inject);
  else inject();
})();