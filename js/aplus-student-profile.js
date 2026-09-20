/* APLUS STUDENT PROFILE DIAGNOSTIC v4.0
   Diagnostic 01: establish the student's current academic and development baseline.
   Output is diagnostic, not an admissions prediction or ranking.
*/
(function(){
  "use strict";
  const esc=v=>String(v==null?"":v).replace(/[&<>"]/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[m]));
  const arr=v=>Array.isArray(v)?v:[];
  const read=id=>{const e=document.getElementById(id);return e?e.value:"";};
  const split=id=>{const e=document.getElementById(id);if(id==="spWeakTopics")return Array.from(document.querySelectorAll('input[name="spWeakTopic"]:checked')).map(x=>x.value);if(e&&e.tagName==="SELECT"&&e.multiple)return Array.from(e.selectedOptions).map(o=>o.value).filter(Boolean);return read(id).split(",").map(x=>x.trim()).filter(Boolean);};
  const tax=()=>window.APLUS_SUBJECT_TAXONOMY;
  function selectedSubjects(){
    const out=[];
    document.querySelectorAll("#spSubjectSelector input[data-subject-key]:checked").forEach(cb=>{
      const level=cb.dataset.level, subject=cb.dataset.subject, category=cb.dataset.category;
      const gradeEl=document.querySelector('select[data-grade-key="'+CSS.escape(cb.dataset.subjectKey)+'"]');
      out.push({level,subject,category,grade:gradeEl?gradeEl.value:"not_available"});
    });
    return out;
  }
  function renderSubjects(){
    const host=document.getElementById("spSubjectSelector");
    if(!host||!tax())return;
    const grades=['<option value="not_available">Not available yet</option>'].concat(tax().gradeOptions.map(g=>'<option value="'+g+'">'+g+'</option>')).join("");
    const groups=["H2","H1","H3","CORE"];
    host.innerHTML=groups.map(level=>{
      const title=level==="CORE"?"Core / Other":"Higher "+level.slice(1);
      return '<div class="subject-group"><div class="subject-group-title">'+title+'</div><div class="subject-options">'+
        tax().list(level).map(x=>{
          const k=level+"__"+x.subject.replace(/[^a-z0-9]+/gi,"_");
          return '<div class="subject-option"><label><input type="checkbox" data-subject-key data-subject-key-value="'+k+'" data-subject-key="'+k+'" data-level="'+esc(x.level)+'" data-subject="'+esc(x.subject)+'" data-category="'+esc(x.category)+'"> '+esc(x.subject)+'</label></div>';
        }).join("")+'</div></div>';
    }).join("");
    host.querySelectorAll("input[data-subject-key]").forEach(cb=>{
      cb.addEventListener("change",()=>{
        const sel=host.querySelector('select[data-grade-key="'+CSS.escape(cb.dataset.subjectKey)+'"]');
        if(sel)sel.disabled=!cb.checked; updateSubjectSummary(); updateSubjectGrades(); updateStrengthList();
        if(cb.checked&&sel&&sel.value==="not_available")sel.value="not_available";
      });
    });
  }

  function updateSubjectSummary(){
    const el=document.getElementById("spSubjectSummary");
    if(!el)return;
    const selected=selectedSubjects();
    if(!selected.length){el.textContent="Select your subjects";return;}
    const h1=selected.filter(x=>x.level==="H1").length;
    const h2=selected.filter(x=>x.level==="H2").length;
    const h3=selected.filter(x=>x.level==="H3").length;
    const parts=[];
    if(h1)parts.push("H1: "+h1);
    if(h2)parts.push("H2: "+h2);
    if(h3)parts.push("H3: "+h3);
    el.textContent=selected.length+" subjects selected · "+parts.join(" · ");
  }

  function updateSubjectGrades(){
    const host=document.getElementById("spStrengthSummary");
    if(!host)return;
    const selected=selectedSubjects();
    if(!selected.length){
      host.innerHTML='<div class="sp-grade-empty">Select subjects above first.</div>';
      return;
    }
    const gradeOptions=['<option value="not_available">Not available yet</option>'].concat((tax()?tax().gradeOptions:[]).map(g=>'<option value="'+g+'">'+g+'</option>')).join("");
    host.innerHTML='<div class="sp-grade-list">'+selected.map(x=>{
      const k=x.level+"__"+x.subject.replace(/[^a-z0-9]+/gi,"_");
      return '<div class="sp-grade-row"><div><span class="sp-grade-level">'+esc(x.level)+'</span><span class="sp-grade-subject">'+esc(x.subject)+'</span></div><select data-grade-key="'+esc(k)+'">'+gradeOptions+'</select></div>';
    }).join("")+'</div>';
    selected.forEach(x=>{
      const k=x.level+"__"+x.subject.replace(/[^a-z0-9]+/gi,"_");
      const el=host.querySelector('select[data-grade-key="'+CSS.escape(k)+'"]');
      if(el){
        el.value=x.grade||"not_available";
        el.addEventListener("change",()=>{ updateSubjectSummary(); updateStrengthList(); });
      }
    });
  }

  function updateStrengthList(){
    const host=document.getElementById("spStrengthList");
    if(!host)return;
    const selected=selectedSubjects();
    const groups=[
      {key:"A",title:"Strong",items:selected.filter(x=>x.grade==="A")},
      {key:"B",title:"Developing",items:selected.filter(x=>x.grade==="B")},
      {key:"C",title:"Needs Development",items:selected.filter(x=>x.grade==="C")},
      {key:"D",title:"Needs Support",items:selected.filter(x=>x.grade==="D")}
    ];
    if(!selected.length){
      host.innerHTML='<div class="sp-grade-empty">Select subjects and grades above to identify the academic profile.</div>';
      return;
    }
    host.innerHTML=groups.map(g=>{
      const content=g.items.length
        ?g.items.map(x=>'<span class="sp-strength-chip"><b>'+esc(x.level)+'</b> '+esc(x.subject)+' <em>'+esc(x.grade)+'</em></span>').join("")
        :'<span class="sp-grade-empty" style="display:inline-block;padding:7px 9px">—</span>';
      return '<div class="sp-strength-group" style="margin-bottom:10px"><div style="font-size:11px;font-weight:850;margin-bottom:6px">'+g.title+'</div><div class="sp-strength-list">'+content+'</div></div>';
    }).join("");
  }

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

    const targetField=read("spTargetField")||"Medicine";
    const targetUniversityRaw=read("spTargetUniversity")||"Not decided yet";
    const targetEntryYear=read("spEntryYear")||"2027";
    const legacyTarget=targetUniversityRaw;
    const isUK=/^UK Medicine$/i.test(legacyTarget);
    const isAustralia=/^Australia Medicine$/i.test(legacyTarget);
    const targetUniversity=/^NUS Medicine$/i.test(legacyTarget)?"NUS":/^NTU Medicine$/i.test(legacyTarget)?"NTU":legacyTarget;
    const targetCourse=targetField||(/(Medicine)$/i.test(legacyTarget)?"Medicine":legacyTarget);
    const targetCountry=isUK?"United Kingdom":isAustralia?"Australia":"Singapore";

    const raw={
      field:targetField,
      university:targetUniversity,
      course:targetCourse,
      country:targetCountry,
      entryYear:targetEntryYear||read("dbEntryYear")||"2027",
      scholarship:read("targetScholarship"),
      currentLevel:read("spLevel")||read("level")||"Not specified",
      qualification:read("spQualification"),
      academicProfile:read("spAcademicProfile"),
      subjects:selectedSubjects(),
      strengths:[],
      weakTopics:split("spWeakTopics"),
      readiness,
      activities
    };

    const base=window.APLUS_MASTER_PROFILE.create(raw);
    base.studentName=read("studentName")||"";
    const graded=base.profile.subjects.filter(x=>x.grade&&x.grade!=="not_available");
    base.profile.strengths=graded.filter(x=>["A","B"].includes(x.grade)).map(x=>x.level+" "+x.subject);
    base.profile.weakTopics=split("spWeakTopics");
    base.schemaVersion="4.0";
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
      subjects:subjects.length?((subjects.some(x=>["chemistry","biology","physics","mathematics","further mathematics","economics","history","literature in english","computing","english language and linguistics","general paper"].includes(String(x.subject||"").toLowerCase()))?"recorded":"developing")):"unknown",
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
      version:"4.0",
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
      '.sp1-title{text-align:left;margin:0 0 24px;padding-bottom:4px}.sp1-title .eyebrow{margin-bottom:8px}.sp1-title h2{font-size:30px!important;line-height:1.2;margin:0 0 9px!important}.sp1-title p{max-width:760px;margin:0!important;line-height:1.6}.sp1-form{margin-top:4px}.sp1-form>.sp1-full{grid-column:1/-1}.sp1-form>div{min-width:0}.sp1-host{display:block}.sp1-card{box-sizing:border-box;width:100%;max-width:1120px;margin-left:auto!important;margin-right:auto!important;background:#fff;border:1px solid var(--line,#e6eaf0);border-radius:20px;padding:30px;box-shadow:0 12px 35px #16213e0b}.sp1-title{display:block;text-align:left;margin:0 0 28px;padding:0}.sp1-title .eyebrow{margin:0 0 9px}.sp1-title h2{font-size:30px!important;line-height:1.2;margin:0 0 10px!important}.sp1-title p{max-width:780px;margin:0!important;line-height:1.6;color:var(--muted,#667085)}.sp1-form{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr));gap:18px}.sp1-target-grid{display:grid;grid-template-columns:1.15fr 1.15fr .7fr;gap:18px}.sp1-full{grid-column:1/-1}.sp1-target-grid{display:grid;grid-template-columns:1.15fr 1.15fr .7fr;gap:18px}.sp1-full{grid-column:1/-1}.sp1-form>div{min-width:0}.sp1-form>.sp1-full{grid-column:1/-1}.sp1-card .sp-subject-toggle,.sp1-card #spWeakToggle{box-sizing:border-box}.sp1-card .formgrid{align-items:start}.sp1-card .next{display:block;width:auto;margin-top:26px}.sp1-card #spSummary{min-height:0}.sp1-card #spSummary:empty{display:none}@media(max-width:800px){.sp1-card{padding:22px}.sp1-form{grid-template-columns:1fr!important}.sp1-target-grid{grid-template-columns:1fr}}.sp2-header{display:flex;justify-content:space-between;gap:20px;align-items:flex-start;margin-bottom:18px}'+
      '.sp2-header h3{font-size:22px;margin:7px 0}.sp2-header p{font-size:12px;color:#667085;margin:0;line-height:1.5}'+
      '.sp2-badge{font-size:9px;font-weight:900;letter-spacing:.12em;padding:7px 9px;border-radius:999px;background:#eef2ff;color:#3157ff;white-space:nowrap}'+
      '.sp2-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:9px;margin-bottom:14px}'+
      '.sp2-stats>div{border:1px solid #e8ebf2;border-radius:12px;padding:13px;background:#fff}.sp2-stats b{display:block;font-size:20px}.sp2-stats span{font-size:10px;color:#667085}'+
      '.diag-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:10px}'+
      '.diag-box{border:1px solid #e8ebf2;border-radius:14px;padding:15px;background:#fff}'+
      '.diag-box.good{border-color:#ccebdd;background:#f2fbf6}.diag-box.warn{border-color:#f5dfb5;background:#fff9ed}.diag-box.mid{border-color:#dbe4ff;background:#f7f9ff}.diag-box.neutral{background:#fafbfc}'+
      '.diag-label{font-size:12px;font-weight:850}.diag-status{font-size:11px;color:#667085;margin-top:6px}'+
      '.sp2-callout{margin-top:14px;padding:14px;border-radius:12px;background:#fff7e8;border:1px solid #f5dfb5;font-size:11px;line-height:1.6}.sp2-callout.good{background:#eaf7f1;border-color:#ccebdd}.sp2-callout ul{margin:7px 0 0;padding-left:18px}.sp2-callout li{margin:4px 0}.sp2-foot{font-size:10px;color:#98a2b3;margin-top:13px}.sp-subject-toggle{width:100%;display:flex;justify-content:space-between;align-items:center;text-align:left;padding:13px 15px;border:1px solid #dbe1eb;border-radius:12px;background:#fff;font-size:12px;font-weight:750;cursor:pointer}.sp-subject-toggle:hover{border-color:#b9c4d6}.sp-subject-toggle.open{border-radius:12px 12px 0 0;border-bottom-color:#eef1f5}.sp-chevron{font-size:18px;transition:transform .2s}.sp-subject-toggle.open .sp-chevron{transform:rotate(180deg)}.sp-subject-panel{padding-top:6px}.subject-group{border:1px solid #e8ebf2;border-radius:14px;padding:14px;margin:9px 0;background:#fbfcfe}.subject-group-title{font-size:12px;font-weight:900;margin-bottom:9px}.subject-options{display:grid;grid-template-columns:repeat(2,1fr);gap:7px}.subject-option{display:flex;align-items:center;padding:7px 8px;background:#fff;border:1px solid #edf0f5;border-radius:9px}.subject-option label{font-size:11px;margin:0;font-weight:650}.subject-option select{padding:7px 6px;font-size:11px}.sp-strength-summary{margin-top:9px}.sp-grade-list{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.sp-grade-row{display:grid;grid-template-columns:1fr 100px;gap:10px;align-items:center;padding:10px 11px;border:1px solid #e8ebf2;border-radius:10px;background:#fbfcfe}.sp-grade-row>div{min-width:0}.sp-grade-level{font-size:10px;font-weight:850;color:#667085;margin-right:6px}.sp-grade-subject{font-size:11px;font-weight:750}.sp-grade-row select{width:100%;padding:7px 6px;font-size:11px}.sp-grade-empty{padding:11px;border:1px dashed #dbe1eb;border-radius:10px;background:#fafbfc;color:#667085;font-size:11px}.sp-academic-profile-box{border:1px solid #e8ebf2;border-radius:14px;background:#fbfcfe;padding:14px}.sp-section-mini-title{font-size:11px;font-weight:850;color:#344054;margin-bottom:8px}.sp-optional{font-weight:600;color:#98a2b3}.sp-academic-grade-section,.sp-academic-strength-section{padding-bottom:14px;margin-bottom:14px;border-bottom:1px solid #e8ebf2}.sp-academic-context-section input{background:#fff}.sp-strength-list{display:flex;flex-wrap:wrap;gap:7px}.sp-strength-chip{display:inline-flex;align-items:center;gap:5px;padding:7px 9px;border:1px solid #ccebdd;border-radius:999px;background:#f2fbf6;font-size:10px;font-weight:700}.sp-strength-chip b{font-size:9px;color:#667085}.sp-strength-chip em{font-style:normal;font-weight:900}..sp-auto-note{font-size:11px;color:#667085;line-height:1.5;padding:11px;border:1px dashed #dbe1eb;border-radius:10px;background:#fafbfc}.sp-weak-panel{padding:8px 0}.weak-options{display:grid;grid-template-columns:repeat(2,1fr);gap:7px;padding:10px;border:1px solid #e8ebf2;border-top:0;border-radius:0 0 12px 12px;background:#fbfcfe}.weak-option{display:flex;align-items:center;gap:7px;padding:9px 10px;border:1px solid #edf0f5;border-radius:9px;background:#fff;font-size:11px;font-weight:650;cursor:pointer}.weak-option input{margin:0}.weak-option:has(input:checked){border-color:#b9c4d6;background:#f7f9ff}@media(max-width:700px){.subject-options{grid-template-columns:1fr}.weak-options{grid-template-columns:1fr}.sp-grade-list{grid-template-columns:1fr}.sp-grade-row{grid-template-columns:1fr 92px}}'+
      '@media(max-width:700px){.sp2-stats{grid-template-columns:1fr 1fr}.sp2-header{flex-direction:column}.diag-grid{grid-template-columns:1fr}}';
    document.head.appendChild(s);
  }

  function inject(){
    injectStyle();
    const planner=document.getElementById("planner");
    if(!planner||document.getElementById("studentProfileEngine"))return;
    planner.classList.add("sp1-host");

    const box=document.createElement("div");
    box.id="studentProfileEngine";
    box.className="sp1-card";
    box.style.marginTop="0";

    box.innerHTML=
      '<div class="sp1-title">'+
        '<div class="eyebrow" style="color:#3157ff">DIAGNOSTIC 01 · STUDENT BASELINE</div>'+
        '<h2 style="font-size:28px">Understand the student before analysing the target.</h2>'+
        '<p>Capture the student\'s current academic position, development readiness and evidence baseline. This diagnostic is the starting point for every later planning analysis.</p>'+
      '</div>'+
      '<div class="formgrid sp1-form">'+
        '<div class="sp1-full"><div class="sp1-target-grid">'+
          '<div><label>Target field</label><select id="spTargetField"><option>Medicine</option><option>Dentistry</option><option>Law</option><option>Engineering</option><option>Computer Science</option><option>Business</option></select></div>'+
          '<div><label>Target university</label><select id="spTargetUniversity"><option>NUS Medicine</option><option>NTU Medicine</option><option>Not decided yet</option></select></div>'+
          '<div><label>Target entry year</label><select id="spEntryYear"><option>2027</option><option>2028</option><option>2029</option><option>2030</option><option>2031</option></select></div>'+
        '</div></div>'+
        '<div><label>Current education level</label><select id="spLevel"><option>Primary</option><option>Secondary 1</option><option>Secondary 2</option><option>Secondary 3</option><option>Secondary 4</option><option>JC 1</option><option>JC 2</option><option>Poly Year 1</option><option>Poly Year 2</option><option>Poly Year 3</option></select></div>'+
        '<div><label>Qualification pathway</label><select id="spQualification"><option>A-Level</option><option>IB</option><option>NUS High School Diploma</option><option>Polytechnic Diploma</option><option>Other / undecided</option></select></div>'+
        '<div class="sp1-full"><label>Current / planned subjects</label><button type="button" id="spSubjectToggle" class="sp-subject-toggle" aria-expanded="false"><span id="spSubjectSummary">Select your subjects</span><span class="sp-chevron">⌄</span></button><div id="spSubjectSelector" class="sp-subject-panel" hidden></div></div>'+
        '<div class="sp1-full"><label>Academic Profile</label><div class="sp-academic-profile-box"><div class="sp-academic-grade-section"><div class="sp-section-mini-title">Subject grades</div><div id="spStrengthSummary" class="sp-strength-summary"><div class="sp-grade-empty">Select subjects above first.</div></div></div><div class="sp-academic-strength-section"><div class="sp-section-mini-title">Academic strengths</div><div id="spStrengthList" class="sp-strength-list"><div class="sp-grade-empty">Strengths will be identified from subject grades.</div></div></div><div class="sp-academic-context-section"><div class="sp-section-mini-title">Additional academic context <span class="sp-optional">(optional)</span></div><input id="spAcademicProfile" placeholder="Add grade trend, learning progress or other relevant context"></div></div></div>'+
        '<div class="sp1-full"><label>Areas to improve</label><button type="button" id="spWeakToggle" class="sp-subject-toggle" aria-expanded="false"><span id="spWeakSummary">Select areas to improve</span><span class="sp-chevron">⌄</span></button><div id="spWeakSelector" class="sp-weak-panel" hidden><div class="weak-options"><label class="weak-option"><input type="checkbox" name="spWeakTopic" value="Subject knowledge"> <span>Subject knowledge</span></label><label class="weak-option"><input type="checkbox" name="spWeakTopic" value="Concept application"> <span>Concept application</span></label><label class="weak-option"><input type="checkbox" name="spWeakTopic" value="Data analysis"> <span>Data analysis</span></label><label class="weak-option"><input type="checkbox" name="spWeakTopic" value="Problem solving"> <span>Problem solving</span></label><label class="weak-option"><input type="checkbox" name="spWeakTopic" value="Essay / written response"> <span>Essay / written response</span></label><label class="weak-option"><input type="checkbox" name="spWeakTopic" value="Time management"> <span>Time management</span></label><label class="weak-option"><input type="checkbox" name="spWeakTopic" value="Exam technique"> <span>Exam technique</span></label><label class="weak-option"><input type="checkbox" name="spWeakTopic" value="Revision consistency"> <span>Revision consistency</span></label><label class="weak-option"><input type="checkbox" name="spWeakTopic" value="Not identified yet"> <span>Not identified yet</span></label></div></div></div><div><label>Academic foundation</label><select id="spAcademic"><option value="unknown">Not assessed</option><option value="strong">Strong</option><option value="developing">Developing</option><option value="needs_work">Needs building</option></select></div>'+
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
    const toggle=document.getElementById("spSubjectToggle");
    const panel=document.getElementById("spSubjectSelector");
    if(toggle&&panel){
      toggle.addEventListener("click",()=>{
        const open=toggle.getAttribute("aria-expanded")==="true";
        toggle.setAttribute("aria-expanded",String(!open));
        panel.hidden=open;
        toggle.classList.toggle("open",!open);
      });
    }
    renderSubjects();
    updateSubjectGrades();
    updateStrengthList();
    const targetSync=function(){
      const pairs=[["spTargetField","field"],["spTargetUniversity","uni"],["spEntryYear","entryYear"]];
      pairs.forEach(function(pair){const src=document.getElementById(pair[0]),dst=document.getElementById(pair[1]);if(src&&dst)dst.value=src.value;});
    };
    ["spTargetField","spTargetUniversity","spEntryYear"].forEach(function(id){const el=document.getElementById(id);if(el)el.addEventListener("change",targetSync);});
    targetSync();
    const weakToggle=document.getElementById("spWeakToggle");
    const weakPanel=document.getElementById("spWeakSelector");
    const weakSummary=document.getElementById("spWeakSummary");
    if(weakToggle&&weakPanel){
      const updateWeakSummary=()=>{const selected=split("spWeakTopics");weakSummary.textContent=selected.length?selected.length+" areas selected":"Select areas to improve";};
      weakToggle.addEventListener("click",()=>{const open=weakToggle.getAttribute("aria-expanded")==="true";weakToggle.setAttribute("aria-expanded",String(!open));weakPanel.hidden=open;weakToggle.classList.toggle("open",!open);});
      weakPanel.querySelectorAll('input[name="spWeakTopic"]').forEach(cb=>cb.addEventListener("change",updateWeakSummary));
      updateWeakSummary();
    }
  }

  window.APLUS_BUILD_STUDENT_PROFILE=build;
  window.APLUS_STUDENT_PROFILE={collect,save,build,diagnosticState};

  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",inject);
  else inject();
})();