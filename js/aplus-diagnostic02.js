/* APLUS DIAGNOSTIC 02 · REQUIREMENT-EVIDENCE GAP ANALYSIS v1.2 */
(function(){
  "use strict";
  const esc=v=>String(v==null?"":v).replace(/[&<>"]/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[m]));
  const arr=v=>Array.isArray(v)?v:[];

  function load(){
    try{return JSON.parse(localStorage.getItem("APLUS_MASTER_PROFILE")||"null");}catch(e){return null;}
  }

  function assess(profile){
    const t=profile.target||{}, p=profile.profile||{}, r=profile.readiness||{};
    const req=(window.APLUS_REQUIREMENTS&&window.APLUS_REQUIREMENTS.get(t.university,t.course,t.entryYear))||[];
    const subjects=arr(p.subjects).join(" ").toLowerCase();
    const items=[];
    req.forEach(x=>{
      const text=(String(x.requirement||"")+" "+String(x.threshold||"")).toLowerCase();
      const targetYearStatus=x.status==="pending"?"reference_pending":"verified";
      let evidenceStatus="unknown", evidenceReason="Student evidence has not yet been assessed.";
      if(/ucat/.test(text)){
        if(/not required/.test(text)){evidenceStatus="not_applicable"; evidenceReason="The latest recorded requirement states that UCAT is not required."; }
        else { evidenceStatus=(profile.application&&profile.application.ucatScore)?"recorded":"missing"; evidenceReason=evidenceStatus==="recorded"?"A UCAT result is recorded.":"No actual UCAT result is recorded in the student profile."; }
      }else if(/chemistry/.test(text)){
        evidenceStatus=subjects.includes("chem")?"recorded":"missing";
        evidenceReason=evidenceStatus==="recorded"?"Chemistry is recorded in the student's subject profile.":"Chemistry is not recorded in the student's subject profile.";
      }else if(/biology/.test(text)){
        evidenceStatus=subjects.includes("biolog")?"recorded":"missing";
        evidenceReason=evidenceStatus==="recorded"?"Biology is recorded in the student's subject profile.":"Biology is not recorded in the student's subject profile.";
      }else if(/physics/.test(text)){
        evidenceStatus=subjects.includes("phys")?"recorded":"missing";
        evidenceReason=evidenceStatus==="recorded"?"Physics is recorded in the student's subject profile.":"Physics is not recorded in the student's subject profile.";
      }else if(/personal statement/.test(text)){
        evidenceStatus=profile.application&&profile.application.personalStatementReady?"recorded":"missing";
        evidenceReason=evidenceStatus==="recorded"?"Personal statement readiness is recorded.":"Personal statement readiness has not yet been evidenced.";
      }else if(/referee/.test(text)){
        evidenceStatus=(profile.application&&Number(profile.application.refereeCount)>=2)?"recorded":"missing";
        evidenceReason=evidenceStatus==="recorded"?"Two or more referees are recorded.":"The required referee evidence is not yet recorded.";
      }else if(/fsa|mmi/.test(text)){
        evidenceStatus=r.communication==="strong"?"recorded":r.communication==="developing"?"developing":"unknown";
        evidenceReason="Communication readiness is a planning indicator, not an admission prediction.";
      }else if(x.category==="Assessment"){
        evidenceStatus=r.test==="strong"?"recorded":r.test==="needs_work"?"missing":r.test==="developing"?"developing":"unknown";
        evidenceReason="Assessment readiness is a planning proxy and must not be treated as an admission result.";
      }else if(/academic|general paper|project work/.test(text)){
        evidenceStatus=(subjects&&p.academicProfile)?"recorded":"unknown";
        evidenceReason=evidenceStatus==="recorded"?"Academic subjects and profile evidence are recorded.":"More academic evidence is needed to assess this requirement.";
      }
      items.push({
        category:x.category, requirement:x.requirement, threshold:x.threshold,
        targetYearStatus, evidenceStatus, evidenceReason,
        official:true, source:x.source, verified:x.verified
      });
    });

    const factors=[
      ["Academic foundation",r.academic,"Academic trajectory should be supported by actual results and grade trends."],
      ["Communication",r.communication,"Build evidence through structured communication, reflection and feedback."],
      ["Leadership",r.leadership,"Record sustained responsibility, not only participation."],
      ["Service / community",r.service,"Record meaningful contribution, outcomes and reflection."],
      ["Application readiness",r.application,"Identify application components that require preparation."]
    ];
    factors.forEach(x=>{
      const evidenceStatus=x[1]==="strong"?"recorded":x[1]==="developing"?"developing":x[1]==="needs_work"?"missing":"unknown";
      items.push({category:"APLUS planning factor",requirement:x[0],targetYearStatus:"not_applicable",evidenceStatus,evidenceReason:x[2],official:false});
    });

    const evidence={recorded:0,developing:0,missing:0,unknown:0,not_applicable:0};
    const verification={verified:0,reference_pending:0};
    items.forEach(x=>{ evidence[x.evidenceStatus]=(evidence[x.evidenceStatus]||0)+1; if(x.official)verification[x.targetYearStatus]=(verification[x.targetYearStatus]||0)+1; });

    const actions=items.filter(x=>x.evidenceStatus==="missing"||x.evidenceStatus==="developing").map(x=>({
      priority:x.evidenceStatus==="missing"?"High":"Develop",
      requirement:x.requirement||x.category,
      action:x.evidenceReason
    })).slice(0,8);
    items.filter(x=>x.official&&x.targetYearStatus==="reference_pending").slice(0,4).forEach(x=>actions.push({
      priority:"Monitor", requirement:x.requirement||x.category,
      action:"Verify the target-year rule when the new cycle is published; use the latest verified cycle only as a reference."
    }));

    return {
      version:"1.2", completedAt:new Date().toISOString(),
      target:{university:t.university||"",course:t.course||"",entryYear:t.entryYear||null},
      summary:{evidence,verification,total:items.length},
      items, priorityActions:actions.slice(0,8)
    };
  }
  async function run(){
    const profile=load();
    const out=document.getElementById("gapEngineResult");
    if(!out)return;
    if(!profile){
      out.style.display="block";
      out.innerHTML="<b>Student profile not found.</b><br><small>Complete Diagnostic 01 first.</small>";
      return;
    }

    if(window.APLUS_REQUIREMENTS&&window.APLUS_REQUIREMENTS.sync){
      await window.APLUS_REQUIREMENTS.sync(profile.target.university,profile.target.course,profile.target.entryYear);
    }

    const diagnostic=assess(profile);
    profile.diagnostic02=diagnostic;

    try{
      localStorage.setItem("APLUS_MASTER_PROFILE",JSON.stringify(profile));
      localStorage.setItem("APLUS_DIAGNOSTIC_02",JSON.stringify(diagnostic));
    }catch(e){}

    let dbSync="local_only";
    if(window.APLUS_DATABASE&&window.APLUS_DATABASE.saveStudentProfile){
      const db=await window.APLUS_DATABASE.saveStudentProfile(profile);
      dbSync=db.ok?"synced":(db.code||"not_synced");
    }

    out.style.display="block";
    const items=diagnostic.items;
    out.innerHTML=
      '<h3>Diagnostic 02 · Requirement → Evidence → Gap</h3>'+
      '<p style="color:#647084">This diagnostic checks the saved student baseline against the selected target-year requirements and APLUS planning factors. It does not predict admission.</p>'+
      '<div class="pgrid">'+
      '<div class="pbox"><b>'+diagnostic.summary.evidence.recorded+'</b><br><small>Evidence recorded</small></div>'+
      '<div class="pbox"><b>'+diagnostic.summary.evidence.developing+'</b><br><small>Evidence developing</small></div>'+
      '<div class="pbox"><b>'+diagnostic.summary.evidence.missing+'</b><br><small>Evidence gaps</small></div>'+
      '<div class="pbox"><b>'+diagnostic.summary.verification.reference_pending+'</b><br><small>Requirement verification pending</small></div>'+
      '</div>'+
      '<div style="margin-top:16px">'+items.map(x=>{
        const bg=x.evidenceStatus==="recorded"?"#eaf7f1":x.evidenceStatus==="missing"?"#fff4e5":x.evidenceStatus==="developing"?"#fff8e1":"#eef2ff";
        const verification=x.official&&x.targetYearStatus==="reference_pending"
          ?'<br><small><b>Target-year status:</b> Reference pending — latest verified cycle shown for planning only.</small>':"";
        const source=x.official&&x.source?'<br><small>Source: '+esc(x.source)+' · Verified: '+esc(x.verified||"—")+'</small>':"";
        return '<div style="margin:7px 0;padding:12px;border-radius:10px;background:'+bg+'"><b>'+esc(x.evidenceStatus.toUpperCase())+' · '+esc(x.category)+'</b><br>'+esc(x.requirement||"")+'<br><small>'+esc(x.evidenceReason)+'</small>'+verification+source+'</div>';
      }).join("")+'</div>'+
      '<h4 style="margin:20px 0 8px">Priority actions</h4>'+
      '<ol>'+diagnostic.priorityActions.map(x=>'<li style="margin:8px 0"><b>'+esc(x.priority)+' · '+esc(x.requirement)+'</b><br><small>'+esc(x.action)+'</small></li>').join("")+'</ol>'+
      '<div class="sp2-foot">Diagnostic 02 · '+esc(new Date(diagnostic.completedAt).toLocaleDateString())+' · Database sync: '+esc(dbSync)+'</div>';
  }

  function inject(){
    const planner=document.getElementById("planner");
    if(!planner){
      return false;
    }
    if(document.getElementById("gapEngine")){
      return true;
    }
    const box=document.createElement("div");
    box.id="gapEngine";
    box.className="planner";
    box.style.marginTop="22px";
    box.innerHTML=
      '<div class="section-title" style="text-align:left;margin-bottom:18px">'+
      '<div class="eyebrow" style="color:#2563eb">DIAGNOSTIC 02 · REQUIREMENT-EVIDENCE GAP</div>'+
      '<h2 style="font-size:28px">Find the real planning gaps</h2>'+
      '<p>Match the Diagnostic 01 student baseline against the selected target-year requirements and separate official requirements from APLUS planning factors.</p>'+
      '</div>'+
      '<button class="next" id="runDiagnostic02">Run Diagnostic 02 →</button>'+
      '<div id="gapEngineResult" class="result"></div>';
    planner.appendChild(box);
    document.getElementById("runDiagnostic02").onclick=run;
    return true;
  }

  function boot(){
    if(inject()) return;
    let tries=0;
    const timer=setInterval(()=>{
      tries++;
      if(inject() || tries>=30) clearInterval(timer);
    },500);
  }

  window.APLUS_RUN_DIAGNOSTIC_02=run;
  window.APLUS_RUN_GAP_ENGINE=run;
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot);
  else boot();
})();