/* APLUS Platform Architecture Engine v1.0
   Unifies the planning layers without replacing deterministic rules.
*/
(function(){
  "use strict";

  const MODULES = [
    {id:"target", name:"Target Intelligence", layer:"01", output:"Target university, course, country, entry year and scholarship"},
    {id:"requirements", name:"Requirements Intelligence", layer:"02", output:"Atomic, source-linked and target-year requirements"},
    {id:"profile", name:"Student Profile", layer:"03", output:"Current stage, qualification, academics and subjects"},
    {id:"evidence", name:"Evidence Intelligence", layer:"04", output:"Activities, leadership, service, teamwork, reflection"},
    {id:"gap", name:"Gap Intelligence", layer:"05", output:"Requirement → evidence → gap → priority → action"},
    {id:"development", name:"Development Intelligence", layer:"06", output:"Stage-appropriate development opportunities"},
    {id:"roadmap", name:"Roadmap Intelligence", layer:"07", output:"Year-by-year milestones backward from entry"},
    {id:"application", name:"Application & Scholarship", layer:"08", output:"Combined applications, deadlines, assessments and funding"}
  ];

  function clean(v){ return String(v==null ? "" : v).trim(); }

  function build(raw){
    raw=raw||{};
    const db=raw.db||window.APLUS_DB||{};
    const activities=Array.isArray(raw.activities)?raw.activities:[];
    const activityProfile=window.APLUS_EXPERIENCE_PROFILE
      ? window.APLUS_EXPERIENCE_PROFILE.profile(activities)
      : {count:activities.length,verifiedActivities:0,evidenceGaps:0,totalDurationMonths:0};

    const target={
      university:clean(raw.university),
      course:clean(raw.course),
      country:clean(raw.country),
      entryYear:Number(raw.entryYear)||null,
      scholarship:clean(raw.scholarship)
    };

    const profile={
      currentLevel:clean(raw.currentLevel),
      qualification:clean(raw.qualification),
      academicProfile:clean(raw.academicProfile),
      subjects:Array.isArray(raw.subjects)?raw.subjects:[]
    };

    return {
      version:"1.0",
      modules:MODULES,
      target,
      profile,
      evidence:{
        activityCount:activityProfile.count,
        verifiedActivities:activityProfile.activities
          ? activityProfile.activities.filter(x=>x.evidenceQuality==="Evidenced").length
          : 0,
        evidenceGaps:activityProfile.activities
          ? activityProfile.activities.filter(x=>x.flags&&x.flags.length).length
          : 0,
        totalDurationMonths:activityProfile.activities
          ? activityProfile.activities.reduce((sum,x)=>sum+(x.durationMonths||0),0)
          : 0,
        experienceProfile:activityProfile
      },
      dataStatus:db.loaded ? "database_loaded" : "database_not_loaded",
      principles:[
        "Official requirements are the source of truth.",
        "Self-reported evidence is distinct from verified evidence.",
        "Unknown is not the same as missing.",
        "A planning gap is not an admission prediction.",
        "Longitudinal updates should recalculate the plan."
      ]
    };
  }

  function moduleStatus(id,snapshot){
    if(id==="requirements") return snapshot.dataStatus==="database_loaded" ? "ready" : "needs_data";
    if(id==="target") return snapshot.target.course && snapshot.target.entryYear ? "ready" : "incomplete";
    if(id==="profile") return snapshot.profile.currentLevel ? "ready" : "incomplete";
    if(id==="evidence") return snapshot.evidence.activityCount ? "ready" : "needs_evidence";
    if(id==="gap") return snapshot.dataStatus==="database_loaded" && snapshot.target.course ? "ready" : "waiting";
    if(id==="development" || id==="roadmap") return snapshot.target.entryYear ? "ready" : "waiting";
    if(id==="application") return snapshot.target.entryYear ? "ready" : "waiting";
    return "unknown";
  }

  window.APLUS_PLATFORM={
    MODULES,
    build,
    moduleStatus
  };
})();