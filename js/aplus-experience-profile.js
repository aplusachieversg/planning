/* APLUS Experience Profile Intelligence v1.1
   Experience is evidence for personal development; it is not an academic score
   and does not predict admissions.
*/
(function(){
  "use strict";

  const TAXONOMY = {
    categories: [
      ["leadership","Leadership",["Student Council / Student Leadership","Class Leadership","CCA Leadership","Team Leadership","Project Leadership","Peer Leadership","Community Leadership","Event / Programme Organisation","Student Initiative","Other"]],
      ["service","Service",["Community Service","Volunteer Service","Peer Support / Mentoring","Tutoring / Education Support","Healthcare-related Service","Environmental Service","Fundraising / Donation Drive","Social Outreach","Other"]],
      ["research","Research",["School Research Project","Independent Research","University Research Programme","Research Attachment","Science Research","Medical / Biomedical Research","Engineering Research","Computing / AI Research","Humanities / Social Science Research","Other"]],
      ["internship","Internship",["School-arranged Internship","Company Internship","Healthcare Internship","Professional Internship","Part-time Work","Holiday Work","Other"]],
      ["competitions","Competitions",["Academic Competition","STEM Competition","Mathematics Competition","Science Competition","Coding / Computing Competition","Business / Entrepreneurship Competition","Debate / Public Speaking","Writing / Essay Competition","Sports Competition","Music / Performing Arts Competition","Art / Design Competition","Innovation Competition","Case Competition","Other"]],
      ["projects","Projects",["Academic Project","STEM Project","Research-based Project","Community Project","Innovation Project","Entrepreneurship Project","Coding / Technology Project","Creative Project","Self-initiated Project","Other"]],
      ["cca","CCA",["Sport","Music","Performing Arts","Visual Arts","Clubs & Societies","Uniformed Group","Academic / STEM CCA","Student Leadership CCA","Other"]]
    ],
    roles:[["participant","Participant"],["member","Member"],["team_member","Team Member"],["volunteer","Volunteer"],["competitor","Competitor"],["researcher","Researcher"],["organiser","Organiser"],["leader","Leader"],["team_captain","Team Captain"],["project_leader","Project Leader"],["founder","Founder"],["mentor","Mentor"],["student_representative","Student Representative"],["speaker","Speaker"],["performer","Performer"],["intern","Intern"],["job_shadow","Job Shadow"],["other","Other"]],
    organisationLevels:[["school","SCHOOL"],["community","COMMUNITY"],["national","NATIONAL"],["international","INTERNATIONAL"],["external_institution","EXTERNAL INSTITUTION"],["university_institution","UNIVERSITY / INSTITUTION"],["self_initiated","SELF-INITIATED"],["other","OTHER"]],
    achievementLevels:[["participation","Participation"],["completion","Completion"],["school_recognition","School Recognition"],["school_award","School Award"],["regional","District / Regional"],["national_finalist","National Finalist"],["national_award","National Award"],["national_representative","National Representative"],["international_finalist","International Finalist"],["international_award","International Award"],["international_representative","International Representative"],["no_formal_award","No formal award"],["not_applicable","Not applicable"]],
    evidenceTypes:[["certificate","Certificate"],["award","Award"],["school_record","School Record"],["testimonial","Testimonial"],["reference","Reference"],["portfolio","Portfolio"],["project_output","Project Output"],["supervisor_confirmation","Supervisor Confirmation"],["other","Other"],["none","No formal evidence"]],
    relevance:[["direct","Directly related"],["partial","Partially related"],["transferable","Transferable"],["general","General"],["undetermined","Not yet determined"]],
    participationLevels:[["individual","Individual"],["team","Team"],["school_wide","School-wide"],["community_wide","Community-wide"],["national","National"],["international","International"]],
    qualities:[["initiative","Initiative"],["commitment","Commitment"],["responsibility","Responsibility"],["leadership","Leadership"],["thinking","Thinking & Problem Solving"],["collaboration","Collaboration & Communication"],["resilience","Resilience & Adaptability"],["reflection","Reflection & Self-awareness"]]
  };

  const esc=v=>String(v==null?"":v).replace(/[&<>"]/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[m]));
  const clean=v=>String(v==null?"":v).trim();
  const arr=v=>Array.isArray(v)?v:[];

  function durationBand(months){const n=Number(months)||0;if(n<1)return "One-off / < 1 month";if(n<3)return "1–3 months";if(n<6)return "3–6 months";if(n<12)return "6–12 months";if(n<24)return "1–2 years";return "2+ years";}
  function categoryLabel(key){const hit=TAXONOMY.categories.find(x=>x[0]===key);return hit?hit[1]:key||"";}
  function optionMap(list){return Object.fromEntries(list.map(x=>[x[0],x[1]]));}
  const roleMap=optionMap(TAXONOMY.roles);

  function normalize(raw){
    raw=raw||{};
    return {activityId:clean(raw.activityId)||("EXP-"+Date.now()+"-"+Math.random().toString(36).slice(2,7)),category:clean(raw.category),activityType:clean(raw.activityType),organization:clean(raw.organization),organizationType:clean(raw.organizationType),organizationLevel:clean(raw.organizationLevel),startMonth:clean(raw.startMonth),startYear:clean(raw.startYear),endMonth:clean(raw.endMonth),endYear:clean(raw.endYear),ongoing:!!raw.ongoing,role:clean(raw.role),participationLevel:clean(raw.participationLevel),achievementLevel:clean(raw.achievementLevel),evidenceType:clean(raw.evidenceType)||"none",relevance:clean(raw.relevance)||"undetermined",whatIDid:clean(raw.whatIDid||raw.action),whatILearned:clean(raw.whatILearned),reflection:clean(raw.reflection),verified:!!raw.verified};
  }
  function calculatedDuration(a){
    if(!a.startYear)return null;
    const sy=Number(a.startYear),sm=Number(a.startMonth)||1;if(!Number.isFinite(sy))return null;
    const ey=a.ongoing?new Date().getFullYear():(Number(a.endYear)||sy),em=a.ongoing?new Date().getMonth()+1:(Number(a.endMonth)||sm);
    if(!Number.isFinite(ey))return null;return Math.max(0,(ey-sy)*12+(em-sm+1));
  }
  function evidenceStrength(a){
    const proof=["certificate","award","school_record","testimonial","reference","portfolio","project_output","supervisor_confirmation"].includes(a.evidenceType);
    const reflection=[a.whatIDid,a.whatILearned,a.reflection].filter(Boolean).length;
    if(proof&&reflection===3)return "Evidenced";if(proof||reflection>=2)return "Partially evidenced";return "Self-reported";
  }
  function analyze(raw){
    const a=normalize(raw),months=calculatedDuration(a),flags=[];
    if(!a.category)flags.push("Category not recorded.");if(!a.activityType)flags.push("Activity type not recorded.");if(!a.organization)flags.push("Organisation not recorded.");if(!a.organizationLevel)flags.push("Organisation level not recorded.");if(!a.startYear)flags.push("Start date not recorded.");if(!a.role)flags.push("Role not recorded.");if(!a.achievementLevel)flags.push("Achievement level not recorded.");if(!a.whatIDid)flags.push("What I Did is not recorded.");if(!a.whatILearned)flags.push("What I Learned is not recorded.");if(!a.reflection)flags.push("Reflection is not recorded.");
    const qualities=[];
    if(a.role&&["organiser","leader","team_captain","project_leader","founder","mentor","student_representative"].includes(a.role))qualities.push("leadership");
    if(a.ongoing||(months!==null&&months>=6))qualities.push("commitment");
    if(a.role&&a.role!=="participant")qualities.push("responsibility");
    if(a.whatIDid)qualities.push("initiative");
    if(a.whatILearned||a.reflection)qualities.push("reflection");
    if(["team","school_wide","community_wide","national","international"].includes(a.participationLevel))qualities.push("collaboration");
    if(["research","projects","competitions"].includes(a.category))qualities.push("thinking");
    if(["competitions","projects","internship","research"].includes(a.category))qualities.push("resilience");
    return {activity:a,categoryLabel:categoryLabel(a.category),durationMonths:months,durationBand:months===null?"Not calculated":durationBand(months),evidenceQuality:evidenceStrength(a),qualities:[...new Set(qualities)],flags};
  }
  function levelFromEvidence(count,hasSustained,hasProgression,hasReflection){if(count===0)return "Not yet evidenced";if(hasProgression&&hasSustained&&hasReflection)return "Established";if(hasSustained||hasProgression)return "Developing";return "Emerging";}
  function profile(activities){
    const list=arr(activities).map(analyze),byQuality={};TAXONOMY.qualities.forEach(q=>byQuality[q[0]]=[]);list.forEach(x=>x.qualities.forEach(q=>byQuality[q].push(x)));
    const hasProgression=(()=>{const order=["participant","member","team_member","volunteer","competitor","researcher","organiser","leader","team_captain","project_leader","founder","mentor","student_representative"],vals=list.map(x=>order.indexOf(x.activity.role)).filter(x=>x>=0);return vals.length>=2&&Math.max(...vals)>Math.min(...vals);})();
    const sustained=list.some(x=>(x.durationMonths||0)>=6||x.activity.ongoing),hasReflection=list.filter(x=>x.activity.reflection).length>0,development={};
    Object.keys(byQuality).forEach(k=>development[k]=levelFromEvidence(byQuality[k].length,sustained,hasProgression,hasReflection));
    const patterns=[];if(sustained)patterns.push("Sustained commitment is evidenced.");if(hasProgression)patterns.push("Increasing responsibility or role progression is evidenced.");if(hasReflection)patterns.push("Reflection is present in the experience record.");if(list.some(x=>x.activity.category==="service"))patterns.push("Service / community involvement is present.");if(list.some(x=>x.activity.category==="research"))patterns.push("Research exposure is present.");if(list.some(x=>x.activity.category==="internship"))patterns.push("Professional exposure is present.");if(list.some(x=>x.activity.category==="competitions"))patterns.push("Competitive experience is present.");
    return {count:list.length,activities:list,personalQualities:TAXONOMY.qualities.map(q=>({key:q[0],label:q[1],development:development[q[0]],evidenceCount:byQuality[q[0]].length})),patterns,evidenceQuality:list.length?(list.every(x=>x.evidenceQuality==="Evidenced")?"Evidenced":list.some(x=>x.evidenceQuality!=="Self-reported")?"Partially evidenced":"Self-reported"):"No experience recorded"};
  }
  function years(){const out=[];for(let y=new Date().getFullYear()-8;y<=new Date().getFullYear()+8;y++)out.push(y);return out;}
  function select(id,items,placeholder){return '<select id="'+id+'"><option value="">'+placeholder+'</option>'+items.map(x=>'<option value="'+esc(x[0])+'">'+esc(x[1])+'</option>').join("")+'</select>';}
  function inputStyle(){return 'style="width:100%;padding:13px;border:1px solid #dbe1eb;border-radius:11px"';}

  function renderUI(){
    const planner=document.getElementById("planner");if(!planner||document.getElementById("experienceProfilePanel"))return;
    const panel=document.createElement("div");panel.id="experienceProfilePanel";panel.className="planner";panel.style.marginTop="22px";
    const categoryOptions=TAXONOMY.categories.map(x=>'<option value="'+x[0]+'">'+x[1]+'</option>').join(""),yearOptions=years().map(y=>'<option value="'+y+'">'+y+'</option>').join(""),monthOptions=Array.from({length:12},(_,i)=>'<option value="'+(i+1)+'">'+(i+1)+'</option>').join("");
    panel.innerHTML=
      '<div class="section-title" style="text-align:left;margin-bottom:24px"><div class="eyebrow" style="color:#3157ff">EXPERIENCE PROFILE</div><h2 style="font-size:30px;margin-bottom:8px">Personal Background & Experience</h2><p style="margin-bottom:0">Experiences are recorded as evidence of personal development — independently of the Academic Baseline and without converting them into admission points.</p></div>'+
      '<div style="display:flex;align-items:center;gap:10px;margin:0 0 16px;padding:11px 14px;border:1px solid #e8ebf2;background:#f8f9fc;border-radius:12px"><span style="font-size:12px;font-weight:900;color:#3157ff">01</span><div><div style="font-size:13px;font-weight:850">EXPERIENCE RECORD</div><div style="font-size:11px;color:#667085">Capture the activity, context, role, evidence and reflection.</div></div></div>'+
      '<div class="formgrid">'+
      '<div><label>Category</label><select id="expCategory">'+categoryOptions+'</select></div><div><label>Activity Type</label><select id="expActivityType"><option value="">Select activity type</option></select></div>'+
      '<div><label>Organisation / Institution</label><input id="expOrg" '+inputStyle()+' placeholder="Organisation or institution"></div><div><label>Organisation Level</label>'+select("expOrgLevel",TAXONOMY.organisationLevels,"Select level")+'</div>'+
      '<div><label>Start</label><div style="display:grid;grid-template-columns:1fr 1fr;gap:8px"><select id="expStartMonth"><option value="">Month</option>'+monthOptions+'</select><select id="expStartYear"><option value="">Year</option>'+yearOptions+'</select></div></div>'+
      '<div><label>End</label><div style="display:grid;grid-template-columns:1fr 1fr;gap:8px"><select id="expEndMonth"><option value="">Month</option>'+monthOptions+'</select><select id="expEndYear"><option value="">Year</option>'+yearOptions+'</select></div><label style="margin-top:8px;font-weight:500"><input id="expOngoing" type="checkbox" style="width:auto;margin-right:6px"> Ongoing</label></div>'+
      '<div><label>Role</label>'+select("expRole",TAXONOMY.roles,"Select role")+'</div><div><label>Participation Level</label>'+select("expParticipation",TAXONOMY.participationLevels,"Select level")+'</div>'+
      '<div><label>Achievement Level</label>'+select("expAchievement",TAXONOMY.achievementLevels,"Select achievement")+'</div><div><label>Evidence</label>'+select("expEvidence",TAXONOMY.evidenceTypes,"Select evidence")+'</div>'+
      '<div><label>Relevance to Future Direction</label>'+select("expRelevance",TAXONOMY.relevance,"Select relevance")+'</div>'+
      '<div style="grid-column:1/-1"><label>What I Did</label><textarea id="expWhatDid" rows="3" '+inputStyle()+' placeholder="Describe what you actually did and the responsibility you took."></textarea></div>'+
      '<div style="grid-column:1/-1"><label>What I Learned</label><textarea id="expWhatLearned" rows="3" '+inputStyle()+' placeholder="What did you learn from the experience?"></textarea></div>'+
      '<div style="grid-column:1/-1"><label>Reflection</label><textarea id="expReflection" rows="3" '+inputStyle()+' placeholder="What changed in your thinking, behaviour or direction?"></textarea></div>'+
      '</div>'+
      '<button class="next" id="addExperienceBtn">Add experience</button>'+
      '<div style="display:flex;align-items:center;gap:10px;margin:28px 0 16px;padding:11px 14px;border:1px solid #e8ebf2;background:#f8f9fc;border-radius:12px"><span style="font-size:12px;font-weight:900;color:#3157ff">02</span><div><div style="font-size:13px;font-weight:850">PERSONAL DEVELOPMENT PROFILE</div><div style="font-size:11px;color:#667085">What the experience record suggests about personal qualities and development.</div></div></div>'+
      '<div id="experienceProfileOutput"></div>'+
      '<div style="display:flex;align-items:center;gap:10px;margin:28px 0 16px;padding:11px 14px;border:1px solid #e8ebf2;background:#f8f9fc;border-radius:12px"><span style="font-size:12px;font-weight:900;color:#3157ff">03</span><div><div style="font-size:13px;font-weight:850">DEVELOPMENT PATTERN</div><div style="font-size:11px;color:#667085">Longitudinal patterns become more meaningful as more experiences are recorded.</div></div></div>'+
      '<div id="experiencePatternOutput"></div>';
    const anchor=document.getElementById("result");planner.parentNode.insertBefore(panel,anchor||null);
    let activities=[];const typeEl=panel.querySelector("#expActivityType");
    function refreshTypes(){const cat=panel.querySelector("#expCategory").value,hit=TAXONOMY.categories.find(x=>x[0]===cat);typeEl.innerHTML='<option value="">Select activity type</option>'+(hit?hit[2]:[]).map(x=>'<option value="'+esc(x)+'">'+esc(x)+'</option>').join("");}
    panel.querySelector("#expCategory").addEventListener("change",refreshTypes);refreshTypes();

    function render(){
      const p=profile(activities);
      const qualityRows=p.personalQualities.map(x=>'<div style="display:flex;justify-content:space-between;gap:12px;padding:9px 0;border-bottom:1px solid #eef1f5"><span>'+esc(x.label)+'</span><b>'+esc(x.development)+'</b></div>').join("");
      const patterns=p.patterns.length?p.patterns.map(x=>'<div style="margin-top:6px">• '+esc(x)+'</div>').join(""):'<div style="color:#98a2b3">No pattern identified yet.</div>';
      const records=p.activities.map((x,i)=>'<div style="margin-top:10px;padding:14px;border:1px solid #e5e7eb;border-radius:12px;background:#fff"><b>'+(i+1)+'. '+esc(x.categoryLabel)+' · '+esc(x.activity.activityType||"Activity")+'</b><br><small>'+esc(x.activity.organization||"Organisation not recorded")+' · '+esc(roleMap[x.activity.role]||"Role not recorded")+' · '+esc(x.durationBand)+' · '+esc(x.evidenceQuality)+'</small></div>').join("");
      panel.querySelector("#experienceProfileOutput").innerHTML='<div style="padding:18px;border-radius:14px;background:#f8fbff;border:1px solid #dbe4f2"><div style="font-size:11px;color:#667085;margin-bottom:8px">PERSONAL QUALITIES</div>'+qualityRows+'<div style="margin-top:14px;font-size:11px;color:#475467">'+esc(p.evidenceQuality)+' · '+p.count+' experience record'+(p.count===1?"":"s")+'</div></div>'+records;
      panel.querySelector("#experiencePatternOutput").innerHTML='<div style="padding:18px;border-radius:14px;background:#fff;border:1px solid #e8ebf2">'+patterns+'</div>';
      window.APLUS_UI_ACTIVITIES=activities;window.APLUS_EXPERIENCE_PROFILE=p;
    }
    panel.querySelector("#addExperienceBtn").onclick=function(){
      const get=id=>panel.querySelector("#"+id)?.value||"";
      activities.push({category:get("expCategory"),activityType:get("expActivityType"),organization:get("expOrg"),organizationLevel:get("expOrgLevel"),startMonth:get("expStartMonth"),startYear:get("expStartYear"),endMonth:get("expEndMonth"),endYear:get("expEndYear"),ongoing:panel.querySelector("#expOngoing").checked,role:get("expRole"),participationLevel:get("expParticipation"),achievementLevel:get("expAchievement"),evidenceType:get("expEvidence"),relevance:get("expRelevance"),whatIDid:get("expWhatDid"),whatILearned:get("expWhatLearned"),reflection:get("expReflection")});render();
    };
    render();
  }
  window.APLUS_EXPERIENCE={TAXONOMY,normalize,analyze,profile,durationBand,calculatedDuration,evidenceStrength};
  window.addEventListener("DOMContentLoaded",renderUI);if(document.readyState!=="loading")renderUI();
})();