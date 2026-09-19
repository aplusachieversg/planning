/* APLUS REQUIREMENT-EVIDENCE GAP ENGINE v1.0 */
(function(){
  "use strict";
  const esc=v=>String(v==null?"":v).replace(/[&<>"]/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[m]));
  function assess(){
    let s=null;try{s=JSON.parse(localStorage.getItem("APLUS_MASTER_PROFILE")||"null")}catch(e){}
    const out=document.getElementById("gapEngineResult");
    if(!s){out.style.display="block";out.innerHTML="<b>Student profile not found.</b><br><small>Save the Student Profile first.</small>";return;}
    const y=s.target.entryYear, u=s.target.university, c=s.target.course;
    const rec=(window.APLUS_REQUIREMENTS&&window.APLUS_REQUIREMENTS.get(u,c,y))||[];
    const readiness=s.readiness||{};
    const map=[];
    rec.forEach(r=>{
      let status="unknown", reason="Requirement needs verification against the target-year source.";
      const text=(r.requirement+" "+r.threshold).toLowerCase();
      if(r.status==="pending"){status="unknown";reason="Target-year rule is pending official verification.";}
      else if(text.includes("ucat not required")){status="met";reason="No UCAT is required for this qualification route in the verified record.";}
      else if(text.includes("ucat")&&readiness.test==="strong"){status="met";reason="Student has marked test readiness as strong; verify actual valid UCAT result separately.";}
      else if(text.includes("ucat")){status=readiness.test==="needs_work"?"missing":"unknown";reason="UCAT readiness/result is not yet evidenced.";}
      else if(text.includes("chemistry")&&s.profile.subjects.join(" ").toLowerCase().includes("chem")){status="met";reason="Chemistry is recorded in the student subject profile; verify exact qualification threshold.";}
      else if(text.includes("biology")||text.includes("physics")){const subs=s.profile.subjects.join(" ").toLowerCase();status=(subs.includes("biology")||subs.includes("physics"))?"met":"missing";reason=status==="met"?"Relevant Biology/Physics is recorded.":"Relevant Biology/Physics is not recorded.";}
      else if(r.category==="Assessment"){status=readiness.communication==="strong"?"met":"unknown";reason="Assessment readiness is a planning proxy; it does not predict admission.";}
      else {status="unknown";}
      map.push({r,status,reason});
    });
    const extras=[
      ["Leadership evidence",readiness.leadership,"Build sustained responsibility and document evidence."],
      ["Service / community evidence",readiness.service,"Build sustained contribution and record outcomes/reflection."],
      ["Communication / assessment readiness",readiness.communication,"Practice structured communication and reflection."]
    ];
    extras.forEach(x=>map.push({r:{category:"APLUS planning factor",requirement:x[0]},status:x[1]==="strong"?"met":x[1]==="needs_work"?"missing":"unknown",reason:x[2]}));
    const count={met:0,missing:0,unknown:0};map.forEach(x=>count[x.status]++);
    out.style.display="block";
    out.innerHTML='<h3>Requirement → Evidence → Gap</h3>'+
      '<p style="color:#647084">Official requirements are kept separate from APLUS planning factors. This is not an admissions prediction.</p>'+
      '<div class="pgrid">'+
      '<div class="pbox"><b>'+count.met+'</b><br><small>Evidence / condition recorded</small></div>'+
      '<div class="pbox"><b>'+count.missing+'</b><br><small>Gap requiring action</small></div>'+
      '<div class="pbox"><b>'+count.unknown+'</b><br><small>Needs verification</small></div></div>'+
      '<div style="margin-top:16px">'+map.map(x=>{
        const bg=x.status==="met"?"#eaf7f1":x.status==="missing"?"#fff4e5":"#eef2ff";
        return '<div style="margin:7px 0;padding:12px;border-radius:10px;background:'+bg+'"><b>'+esc(x.status.toUpperCase())+' · '+esc(x.r.category)+'</b><br>'+esc(x.r.requirement||"")+'<br><small>'+esc(x.reason)+'</small></div>';
      }).join("")+'</div>';
    const actions=map.filter(x=>x.status!=="met").slice(0,6);
    out.innerHTML+='<h4 style="margin:20px 0 8px">Priority actions</h4><ol>'+actions.map(x=>'<li style="margin:8px 0"><b>'+esc(x.r.requirement||x.r.category)+'</b><br><small>'+esc(x.reason)+'</small></li>').join("")+'</ol>';
  }
  function inject(){
    const planner=document.getElementById("planner");
    if(!planner||document.getElementById("gapEngine"))return;
    const box=document.createElement("div");box.id="gapEngine";box.className="planner";box.style.marginTop="22px";
    box.innerHTML='<div class="section-title" style="text-align:left;margin-bottom:18px"><div class="eyebrow" style="color:#2563eb">REQUIREMENT-EVIDENCE ENGINE</div><h2 style="font-size:28px">Find the real planning gaps</h2><p>Match the saved student profile against the selected target-year requirements and separate verified requirements from APLUS development factors.</p></div><button class="next" onclick="APLUS_RUN_GAP_ENGINE()">Run Requirement Gap Analysis →</button><div id="gapEngineResult" class="result"></div>';
    planner.parentNode.insertBefore(box,document.getElementById("centralSubmission")||document.getElementById("result"));
  }
  window.APLUS_RUN_GAP_ENGINE=assess;
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",inject);else inject();
})();