/* APLUS APPLICATION ROADMAP ENGINE v1.0
   Public requirements/scholarship data + authenticated student profile.
   Official requirements remain separate from APLUS planning interpretation.
*/
(function(){
  "use strict";
  const STATUS={ELIGIBLE:"Eligible",DEVELOPING:"Developing",INFO:"Information Required",PENDING:"Requirement Pending"};

  function value(profile,key){
    if(!profile) return null;
    if(profile[key]!==undefined) return profile[key];
    if(profile.profile && profile.profile[key]!==undefined) return profile.profile[key];
    if(profile.evidence && profile.evidence[key]!==undefined) return profile.evidence[key];
    return null;
  }

  function scholarshipStatus(s,profile){
    const citizenship=value(profile,"citizenship");
    const evidence=profile&&profile.evidence_profile?profile.evidence_profile:(profile&&profile.evidence)||{};
    const gaps=[];
    const text=(s.eligibility||"").toLowerCase();
    if(/singapore citizen/.test(text) && citizenship && !/singapore citizen/i.test(String(citizenship))) gaps.push("Citizenship eligibility does not match the published requirement.");
    if(/lower-income|financial need|needs-based/.test(text) && evidence.financialNeed===undefined) gaps.push("Financial-need information is required.");
    if(/leadership/.test(text) && !evidence.leadership) gaps.push("Leadership evidence is not yet recorded.");
    if(/community service/.test(text) && !evidence.communityService) gaps.push("Community-service evidence is not yet recorded.");
    if(s.award_count_status==="not_disclosed") gaps.push("Annual new-entrant award count is not publicly disclosed.");
    let status=STATUS.ELIGIBLE;
    if(gaps.some(g=>/does not match/.test(g))) status=STATUS.INFO;
    else if(gaps.length) status=STATUS.DEVELOPING;
    return {name:s.name,status,gaps,officialRequirement:s.eligibility||"See official source",source:s.source_url||null};
  }

  function buildRoadmap(profile,requirements,scholarships,deadlines){
    const actions=[];
    (requirements||[]).forEach(r=>{
      if(r.status!=="verified") return;
      if(r.deadline) actions.push({category:"Admissions",title:"Review "+r.category+" requirement",description:r.requirement,dueDate:null,priority:"high",source:r.source});
    });
    (deadlines||[]).forEach(d=>actions.push({category:"Deadline",title:d.deadline_type,description:d.deadline_text,dueDate:d.deadline_date||null,priority:d.status==="verified"?"high":"medium",source:d.source_url||null}));
    (scholarships||[]).forEach(s=>{
      const r=scholarshipStatus(s,profile);
      if(r.status!==STATUS.ELIGIBLE) actions.push({category:"Scholarship",title:"Develop "+s.name,description:r.gaps.join(" "),dueDate:null,priority:"medium",source:s.source_url||null});
    });
    return actions;
  }

  async function evaluate(profile,options){
    options=options||{};
    const u=options.university||profile.target_university;
    const c=options.programme||profile.target_programme;
    const y=Number(options.entryYear||profile.entry_year);
    let requirements=[];
    if(window.APLUS_REQUIREMENTS&&window.APLUS_REQUIREMENTS.sync&&u&&c&&y) requirements=await window.APLUS_REQUIREMENTS.sync(u,c,y);
    const scholarships=options.scholarships||[];
    const scholarshipReview=scholarships.map(s=>scholarshipStatus(s,profile));
    const roadmap=buildRoadmap(profile,requirements,scholarships,options.deadlines||[]);
    return {status:"Ready",requirements,scholarships:scholarshipReview,roadmap,generatedAt:new Date().toISOString()};
  }

  window.APLUS_APPLICATION_ROADMAP={STATUS,scholarshipStatus,buildRoadmap,evaluate,version:"1.0"};
})();