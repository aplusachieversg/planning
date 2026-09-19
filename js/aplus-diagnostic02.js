/* APLUS DIAGNOSTIC 02 · REQUIREMENT-EVIDENCE GAP ANALYSIS v1.0 */
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
    const map=[];

    req.forEach(x=>{
      const text=(String(x.requirement||"")+" "+String(x.threshold||"")).toLowerCase();
      let status="unknown", reason="Target-year requirement needs verification.";
      if(x.status==="pending"){
        status="unknown";
        reason="Latest available cycle is being used only as a reference; target-year verification is pending.";
      }else if(/ucat/.test(text)){
        status=/not required/.test(text)?"met":(r.test==="strong"?"recorded":"missing");
        reason=status==="met"?"The verified requirement states that UCAT is not required.":"UCAT requirement is recorded, but an actual valid result has not been evidenced.";
      }else if(/chemistry/.test(text)){
        status=subjects.includes("chem")?"recorded":"missing";
        reason=status==="recorded"?"Chemistry is recorded in the student's subject profile.":"Chemistry is not recorded in the student's subject profile.";
      }else if(/biology/.test(text)){
        status=subjects.includes("biolog")?"recorded":"missing";
        reason=status==="recorded"?"Biology is recorded in the student's subject profile.":"Biology is not recorded in the student's subject profile.";
      }else if(/physics/.test(text)){
        status=subjects.includes("phys")?"recorded":"missing";
        reason=status==="recorded"?"Physics is recorded in the student's subject profile.":"Physics is not recorded in the student's subject profile.";
      }else if(/personal statement/.test(text)){
        status=profile.application&&profile.application.personalStatementReady?"recorded":"missing";
        reason=status==="recorded"?"Personal statement readiness is recorded.":"Personal statement readiness has not yet been evidenced.";
      }else if(/referee/.test(text)){
        status=(profile.application&&Number(profile.application.refereeCount)>=2)?"recorded":"missing";
        reason=status==="recorded"?"Two or more referees are recorded.":"The required referee evidence is not yet recorded.";
      }else if(/fsa|mmi/.test(text)){
        status=r.communication==="strong"?"recorded":"unknown";
        reason="Communication readiness is used only as a planning indicator; it does not predict assessment outcome.";
      }else if(x.category==="Assessment"){
        status=r.test==="strong"?"recorded":r.test==="needs_work"?"missing":"unknown";
        reason="Assessment readiness is a planning proxy and must not be treated as an admission result.";
      }
      map.push({category:x.category,requirement:x.requirement,threshold:x.threshold,status,reason,official:true,source:x.source,verified:x.verified});
    });

    const factors=[
      ["Academic foundation",r.academic,"Academic trajectory should be supported by actual results and grade trends."],
      ["Communication",r.communication,"Build evidence through structured communication, reflection and feedback."],
      ["Leadership",r.leadership,"Record sustained responsibility, not only participation."],
      ["Service / community",r.service,"Record meaningful contribution, outcomes and reflection."],
      ["Application readiness",r.application,"Identify application components that require preparation."]
    ];
    factors.forEach(x=>map.push({category:"APLUS planning factor",requirement:x[0],status:x[1]==="strong"?"recorded":x[1]==="needs_work"?"missing":"unknown",reason:x[2],official:false}));

    const counts={recorded:0,missing:0,unknown:0};
    map.forEach(x=>counts[x.status]++);
    const actions=map.filter(x=>x.status!=="recorded").slice(0,8).map(x=>({
      priority:x.status==="missing"?"High":"Verify",
      requirement:x.requirement||x.category,
      action:x.reason
    }));

    return {
      version:"1.0",
      completedAt:new Date().toISOString(),
      target:{university:t.university||"",course:t.course||"",entryYear:t.entryYear||null},
      summary:counts,
      total:map.length,
      items:map,
      priorityActions:actions
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
      '<div class="pbox"><b>'+diagnostic.summary.recorded+'</b><br><small>Recorded / evidenced</small></div>'+
      '<div class="pbox"><b>'+diagnostic.summary.missing+'</b><br><small>Gap requiring action</small></div>'+
      '<div class="pbox"><b>'+diagnostic.summary.unknown+'</b><br><small>Needs verification</small></div>'+
      '</div>'+
      '<div style="margin-top:16px">'+items.map(x=>{
        const bg=x.status==="recorded"?"#eaf7f1":x.status==="missing"?"#fff4e5":"#eef2ff";
        const source=x.official&&x.source?'<br><small>Source: '+esc(x.source)+' · Verified: '+esc(x.verified||"—")+'</small>':"";
        return '<div style="margin:7px 0;padding:12px;border-radius:10px;background:'+bg+'"><b>'+esc(x.status.toUpperCase())+' · '+esc(x.category)+'</b><br>'+esc(x.requirement||"")+'<br><small>'+esc(x.reason)+'</small>'+source+'</div>';
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
    planner.parentNode.insertBefore(box,document.getElementById("centralSubmission")||document.getElementById("result"));
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