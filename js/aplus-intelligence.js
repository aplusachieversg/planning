/* APLUS Student Intelligence Engine v1.0
   Converts student evidence + target + verified gaps into planning intelligence.
   This layer describes planning readiness only; it does not predict admission outcomes.
*/
(function(){
  "use strict";
  const norm=v=>String(v==null?"":v).trim().toLowerCase();
  const arr=v=>Array.isArray(v)?v:[];
  const levelRank={"Primary":1,"Secondary 1–2":2,"Secondary 3–4":3,"JC 1–2":4,"Polytechnic":4};

  function normalizeProfile(raw){
    raw=raw||{};
    const level=raw.currentLevel||"";
    return {
      currentLevel:level,
      currentLevelRank:levelRank[level]||0,
      qualification:raw.qualification||null,
      targetYear:Number(raw.targetYear)||null,
      targetUniversity:raw.targetUniversity||null,
      targetCourse:raw.targetCourse||"Medicine",
      academicProfile:raw.academicProfile||"unknown",
      subjects:arr(raw.subjects),
      testsTaken:arr(raw.testsTaken),
      firstChoice:raw.firstChoice||null,
      refereeCount:Number(raw.refereeCount||0),
      personalStatementReady:!!raw.personalStatementReady,
      assessmentReady:raw.assessmentReady||"Not yet",
      leadershipLevel:raw.leadershipLevel||"unknown",
      serviceLevel:raw.serviceLevel||"unknown",
      teamworkLevel:raw.teamworkLevel||"unknown",
      reflectionLevel:raw.reflectionLevel||"unknown",
      medicineExposureLevel:raw.medicineExposureLevel||"unknown",
      weakTopics:arr(raw.weakTopics),
      strongTopics:arr(raw.strongTopics),
      evidenceQuality:raw.evidenceQuality||"self_reported"
    };
  }

  function trajectory(p){
    const academic=p.academicProfile;
    const direction=academic==="Strong"?"stable_strong":
      academic==="On track"?"stable_on_track":
      academic==="Needs improvement"?"needs_improvement":"unknown";
    return {
      direction,
      implication:direction==="needs_improvement"?
        "Academic improvement should be protected as a first-order planning task.":
        direction==="stable_strong"?
        "Maintain academic performance while allocating time to non-academic development.":
        "Collect more academic evidence before making a high-confidence trajectory judgment."
    };
  }

  function developmentMap(p){
    const map=[
      ["leadership","Leadership",p.leadershipLevel],
      ["service","Service / community",p.serviceLevel],
      ["teamwork","Teamwork",p.teamworkLevel],
      ["reflection","Reflection / communication",p.reflectionLevel],
      ["medicineExposure","Medicine exposure",p.medicineExposureLevel]
    ];
    return map.map(x=>({key:x[0],label:x[1],status:x[2],
      priority:x[2]==="unknown"||x[2]==="not_yet_developed"?"medium":
        x[2]==="developing"?"medium":"low"}));
  }

  function yearsToEntry(p){
    if(!p.targetYear) return null;
    const nowYear=new Date().getFullYear();
    return p.targetYear-nowYear;
  }

  function roadmap(p, analysis){
    const entry=p.targetYear;
    if(!entry) return [];
    const currentYear=new Date().getFullYear();
    const unresolved=arr(analysis&&analysis.gaps).filter(g=>g.status!=="met"&&g.status!=="not_applicable");
    const tasks=[];
    function add(year,phase,title,detail,priority,dependsOn){
      tasks.push({year,phase,title,detail,priority:priority||"medium",dependsOn:dependsOn||[]});
    }
    const isSenior=p.currentLevel==="JC 1–2"||p.currentLevel==="Polytechnic";
    if(p.academicProfile==="Needs improvement")
      add(currentYear,"ACADEMIC","Stabilise academic performance","Set subject-level targets, identify weak topics and review progress each term.","critical");
    else
      add(currentYear,"ACADEMIC","Protect academic trajectory","Track grades by subject and intervene early when a trend declines.","high");

    if(["Primary","Secondary 1–2"].includes(p.currentLevel))
      add(currentYear,"FOUNDATION","Build broad foundations","Strengthen English, Mathematics, Science, communication and learning habits; do not over-specialise.","medium");
    if(p.currentLevel==="Secondary 3–4")
      add(currentYear,"PATHWAY","Choose the post-secondary route deliberately","Compare JC / Poly pathways against the target course's verified qualification requirements.","high");
    if(isSenior)
      add(currentYear,"ELIGIBILITY","Confirm target-year eligibility","Check qualification, subjects, grades and target-year rules against the verified database.","critical");

    const u=norm(p.targetUniversity);
    if(u==="ntu" && p.targetCourse==="Medicine"){
      const testYear=entry-1;
      add(Math.max(currentYear,testYear-1),"UCAT","Plan UCAT eligibility window","Work backward from the admission year; NTU's published rule limits consideration to results within the 12 months before admission.","high");
      add(entry-1,"APPLICATION","Build the application evidence pack","Prepare the first-choice decision, Personal Statement, referee plan and supporting evidence before the application window.","high");
      add(entry-1,"MMI","Develop MMI readiness","Practice structured communication, teamwork, ethical reasoning and reflection before the assessment period.","high");
      add(entry,"OUTCOME","Track application outcomes","Monitor offer / waitlist / acceptance milestones separately from preparation tasks.","high");
    } else if(u==="nus" && p.targetCourse==="Medicine"){
      add(entry-1,"APPLICATION","Build the NUS Medicine portfolio","Organise academic record, CCA/activity evidence, testimonial/referee information and written materials according to the target-year official requirements.","high");
      add(entry-1,"FSA","Prepare for the medical admissions assessment","Develop communication, values alignment and station-based reasoning skills; use only target-year published assessment information.","high");
      add(entry,"OUTCOME","Track NUS Medicine outcome","Track assessment, offer and acceptance dates from the target-year official source.","high");
    } else {
      add(entry-1,"APPLICATION","Verify target-specific application rules","Create the final checklist only after the target-year official requirements are verified.","high");
    }

    // Convert unresolved verified gaps into explicit tasks.
    unresolved.forEach(g=>{
      if(g.priority==="critical"||g.priority==="high")
        add(Math.min(entry,Math.max(currentYear,entry-1)),"GAP","Resolve: "+g.requirement,
          g.reason+" Rule: "+(g.rule||"See verified source."),g.priority,[g.gapId]);
    });

    // Deduplicate same year/phase/title.
    const seen={};
    return tasks.filter(t=>{
      const k=[t.year,t.phase,t.title].join("|");
      if(seen[k]) return false; seen[k]=true; return true;
    }).sort((a,b)=>a.year-b.year || ["CRITICAL","HIGH","MEDIUM","LOW"].indexOf(a.priority.toUpperCase())-["CRITICAL","HIGH","MEDIUM","LOW"].indexOf(b.priority.toUpperCase()));
  }

  function build(raw,analysis){
    const profile=normalizeProfile(raw);
    return {
      profile,
      trajectory:trajectory(profile),
      developmentMap:developmentMap(profile),
      yearsToEntry:yearsToEntry(profile),
      roadmap:roadmap(profile,analysis),
      planningPrinciples:[
        "Verified requirements come from the database, not from generated text.",
        "A planning gap is not an admission prediction.",
        "Earlier-stage students receive foundation and pathway tasks; application-year students receive deadline-sensitive tasks.",
        "Unknown evidence remains unknown until the student provides enough evidence to verify it."
      ]
    };
  }

  window.APLUS_INTELLIGENCE={normalizeProfile,trajectory,developmentMap,roadmap,build};
})();