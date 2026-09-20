/* APLUS DEVELOPMENT & ROADMAP ENGINE v1.0
   Converts requirement gaps and student readiness into dated development milestones.
   Official requirements remain separate from APLUS planning factors.
*/
(function(){
  "use strict";

  const esc=v=>String(v==null?"":v).replace(/[&<>"]/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[m]));

  const stageOrder={
    "Primary":1,"Secondary 1":2,"Secondary 2":3,"Secondary 3":4,"Secondary 4":5,
    "JC 1":6,"JC 2":7,"Poly Year 1":3,"Poly Year 2":4,"Poly Year 3":5
  };

  function currentYear(){ return new Date().getFullYear(); }

  function yearsToEntry(entryYear){
    const y=Number(entryYear);
    return Number.isFinite(y)?Math.max(0,y-currentYear()):null;
  }

  function loadProfile(){
    try{return JSON.parse(localStorage.getItem("APLUS_MASTER_PROFILE")||"null");}
    catch(e){return null;}
  }

  function targetRequirements(profile){
    const t=profile&&profile.target||{};
    if(!window.APLUS_REQUIREMENTS) return [];
    return window.APLUS_REQUIREMENTS.get(t.university,t.course,t.entryYear)||[];
  }

  function addMilestone(list,year,quarter,title,objective,action,evidence,type,source){
    list.push({
      year,quarter,title,objective,action,evidence,type:type||"Development",
      source:source||"APLUS Planning Factor",
      status:"Planned"
    });
  }

  function build(profile, options){
    options=options||{};
    const t=profile.target||{};
    const r=profile.readiness||{};
    const entry=Number(t.entryYear);
    const start=currentYear();
    const horizon=yearsToEntry(entry);
    const milestones=[];
    const reqs=targetRequirements(profile);

    if(!entry || !Number.isFinite(entry)){
      return {ok:false,message:"Select a valid target entry year before building the roadmap."};
    }

    // Official requirements: schedule only when the target-year record is verified.
    reqs.forEach(x=>{
      if(x.status==="pending") return;
      const text=(x.requirement+" "+x.threshold).toLowerCase();
      if(text.includes("ucat")){
        addMilestone(milestones,entry-1,"Q2","UCAT planning window",
          "Complete UCAT preparation before the valid test window closes.",
          "Confirm the target-year UCAT window, build a preparation schedule and complete timed practice.",
          "Valid UCAT result + preparation record","Official requirement",x.verified);
      }
      if(text.includes("personal statement")){
        addMilestone(milestones,entry-1,"Q1","Application writing preparation",
          "Develop a clear medicine motivation narrative supported by real experiences.",
          "Create an evidence bank and draft, review and refine the personal statement.",
          "Final application-ready personal statement","Official requirement",x.verified);
      }
      if(text.includes("referee")){
        addMilestone(milestones,entry-1,"Q1","Referee planning",
          "Identify appropriate referees and allow sufficient time for supporting reports.",
          "Confirm referee eligibility, brief referees and track submission deadlines.",
          "Confirmed referees + submitted reports","Official requirement",x.verified);
      }
      if(text.includes("fsa")){
        addMilestone(milestones,entry-1,"Q2","FSA preparation",
          "Build readiness for structured in-person assessment.",
          "Practice communication, ethical reasoning, reflection and structured responses.",
          "Practice log + reflection records","Official requirement",x.verified);
      }
      if(text.includes("mmi")){
        addMilestone(milestones,entry-1,"Q2","MMI preparation",
          "Build structured communication and interview readiness.",
          "Practice timed stations, reflection, teamwork and ethical scenarios.",
          "MMI practice record + feedback","Official requirement",x.verified);
      }
    });

    // APLUS development factors.
    // Experience Profile is the current evidence source for personal-development gaps.
    const focus=options.focus||"Full profile";
    const experience=(profile.evidence&&profile.evidence.experienceProfile)
      || (window.APLUS_EXPERIENCE_PROFILE&&window.APLUS_EXPERIENCE_PROFILE.profile
          ? window.APLUS_EXPERIENCE_PROFILE.profile((profile.evidence&&profile.evidence.activities)||[])
          : null);
    const quality=(key)=>{
      const q=experience&&experience.personalQualities
        ? experience.personalQualities.find(x=>x.key===key)
        : null;
      return q?q.development:"Not yet evidenced";
    };
    const development=[];

    if(focus==="Academics"||focus==="Full profile"||r.academic!=="strong"){
      development.push(["Academic trajectory","Strengthen subject mastery and maintain a documented grade trend.","Academic results, teacher feedback, topic mastery record"]);
    }
    if(focus==="UCAT / FSA preparation"||focus==="Full profile"||r.test!=="strong"){
      development.push(["Assessment readiness","Build test and assessment skills progressively rather than relying on last-minute preparation.","Practice record, diagnostic results, reflection"]);
    }

    if(focus==="Leadership & service"||focus==="Full profile"){
      if(quality("leadership")!=="Established"){
        development.push(["Leadership evidence","Build sustained responsibility with increasing ownership and measurable outcomes.","Role record, project evidence, outcome, reflection"]);
      }
      if(quality("commitment")!=="Established"){
        development.push(["Service / community contribution","Build sustained contribution and reflect on impact rather than collecting activities.","Service record, contribution, outcome, reflection"]);
      }
    }

    if(focus==="Full profile"){
      if(quality("collaboration")!=="Established"||quality("reflection")!=="Established"){
        development.push(["Communication & reflection","Develop clear communication, listening, reasoning and reflection through real activities.","Presentation, discussion, writing or interview practice evidence"]);
      }
    }

    development.forEach((d,i)=>{
      const targetYear=Math.max(start, entry-(Math.max(1,Math.min(3,horizon||3))));
      addMilestone(milestones,targetYear,i%2===0?"Q2":"Q4",d[0],d[1],
        "Set one measurable objective, review progress each term and update the evidence portfolio.",d[2],"APLUS development","APLUS Planning Framework");
    });

    // Ensure there is a near-term milestone even for long horizons.
    if(!milestones.some(m=>m.year===start)){
      addMilestone(milestones,start,"Q4","Baseline planning review",
        "Establish the student's starting point against the target.",
        "Confirm target, subjects, academic trend, readiness and evidence portfolio.",
        "Baseline profile + first review","APLUS development","APLUS Planning Framework");
    }

    // Convert to a compact year plan.
    const byYear={};
    milestones.sort((a,b)=>a.year-b.year || a.quarter.localeCompare(b.quarter));
    milestones.forEach(m=>(byYear[m.year]||(byYear[m.year]=[])).push(m));

    return {
      ok:true,target:{university:t.university,course:t.course,entryYear:entry},
      horizon,generatedAt:new Date().toISOString(),milestones,byYear
    };
  }

  function render(result,out){
    if(!out)return;
    if(!result.ok){
      out.style.display="block";
      out.innerHTML="<b>"+esc(result.message)+"</b>";
      return;
    }
    const years=Object.keys(result.byYear).sort((a,b)=>Number(a)-Number(b));
    out.style.display="block";
    out.innerHTML=
      '<h3>Development & Roadmap</h3>'+
      '<p style="color:#647084">A dated plan connecting the student profile to the target entry year. Official requirements and APLUS development factors are clearly separated.</p>'+
      '<div class="pgrid">'+
      '<div class="pbox"><b>'+esc(result.target.entryYear)+'</b><br><small>Target entry year</small></div>'+
      '<div class="pbox"><b>'+esc(result.horizon==null?"—":result.horizon)+'</b><br><small>Years from current planning cycle</small></div>'+
      '<div class="pbox"><b>'+esc(result.milestones.length)+'</b><br><small>Planned milestones</small></div>'+
      '</div>'+
      '<div class="roadmap" style="margin-top:18px">'+
      years.map(y=>{
        const rows=result.byYear[y];
        return '<div style="margin:18px 0 8px;font-weight:900;color:#16213e">Entry '+esc(result.target.entryYear)+' · Year '+esc(y)+'</div>'+
          rows.map(m=>
            '<div class="rstep">'+
            '<div class="ryear">'+esc(m.quarter)+'<br><small>'+esc(m.year)+'</small></div>'+
            '<div><div class="rtitle">'+esc(m.title)+'</div><div class="rdesc"><b>Objective:</b> '+esc(m.objective)+'<br><b>Action:</b> '+esc(m.action)+'<br><b>Evidence:</b> '+esc(m.evidence)+'<br><small>Source: '+esc(m.source)+'</small></div></div>'+
            '<div class="rstatus">'+esc(m.type)+'</div>'+
            '</div>'
          ).join("");
      }).join("")+
      '</div>'+
      '<p style="font-size:12px;color:#7b8495;margin-top:16px">This roadmap is a planning tool. It does not predict admission outcomes or assign an admissions score.</p>';
  }

  function run(){
    const profile=loadProfile();
    const out=document.getElementById("developmentRoadmapResult");
    if(!profile){
      render({ok:false,message:"Save the Student Profile first."},out);
      return;
    }
    const focus=(document.getElementById("drFocus")||{}).value||"Full profile";
    const result=build(profile,{focus});
    try{localStorage.setItem("APLUS_DEVELOPMENT_ROADMAP",JSON.stringify(result));}catch(e){}
    render(result,out);
  }

  function inject(){
    const planner=document.getElementById("planner");
    if(!planner || document.getElementById("developmentRoadmapEngine"))return;
    const box=document.createElement("div");
    box.id="developmentRoadmapEngine";
    box.className="planner";
    box.style.marginTop="22px";
    box.innerHTML=
      '<div class="section-title" style="text-align:left;margin-bottom:18px">'+
      '<div class="eyebrow" style="color:#2563eb">DEVELOPMENT & ROADMAP ENGINE</div>'+
      '<h2 style="font-size:28px">Turn gaps into a development plan</h2>'+
      '<p>Work backwards from the target entry year and convert gaps into objectives, actions, evidence and review points.</p>'+
      '</div>'+
      '<div class="formgrid">'+
      '<div><label>Primary development focus</label><select id="drFocus"><option>Full profile</option><option>Academics</option><option>UCAT / FSA preparation</option><option>Leadership & service</option></select></div>'+
      '<div><label>Roadmap principle</label><div style="padding:13px 14px;border:1px solid #dbe1eb;border-radius:11px;background:#f8fbff;font-size:14px">Target year → milestones → evidence → review</div></div>'+
      '</div>'+
      '<button class="next" onclick="APLUS_BUILD_DEVELOPMENT_ROADMAP()">Build Development Roadmap →</button>'+
      '<div id="developmentRoadmapResult" class="result"></div>';
    planner.parentNode.insertBefore(box,document.getElementById("gapEngine")||document.getElementById("centralSubmission")||document.getElementById("result"));
  }

  window.APLUS_DEVELOPMENT_ROADMAP={build,run,render};
  window.APLUS_BUILD_DEVELOPMENT_ROADMAP=run;
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",inject);else inject();
})();