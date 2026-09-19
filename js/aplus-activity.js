/* APLUS Activity Intelligence Schema v1.0
   Structured extracurricular / leadership evidence model.
   This records evidence; it does not score students or predict admissions.
*/
(function(){
  "use strict";

  const OPTIONS = {
    organizationLevels:[
      ["L1","Individual / informal"],["L2","Class / small group"],["L3","School"],
      ["L4","Inter-school"],["L5","Community"],["L6","National"],["L7","International"]
    ],
    leadershipRoles:[
      ["R1","Participation"],["R2","Task ownership"],["R3","Team coordination"],
      ["R4","Project management"],["R5","Multi-team leadership"],["R6","Strategic leadership"]
    ],
    teamSizes:[
      ["T1","1–3"],["T2","4–10"],["T3","11–20"],["T4","21–50"],["T5","51–100"],["T6","100+"]
    ],
    durations:[
      ["D1","< 1 month"],["D2","1–3 months"],["D3","3–6 months"],["D4","6–12 months"],
      ["D5","1–2 years"],["D6","2+ years"]
    ],
    initiative:[
      ["I1","Assigned"],["I2","Invited"],["I3","Elected"],["I4","Self-initiated"],["I5","Founded"]
    ],
    decisionMaking:[
      ["M1","Execute predefined plan"],["M2","Propose suggestions"],["M3","Independent decisions on part of project"],
      ["M4","Responsible for key project decisions"],["M5","Organization-level strategic decisions"]
    ],
    peopleManagement:["recruitment","delegation","training","conflictResolution","motivation","performanceManagement","mentoring","successionPlanning"],
    impactTypes:["People","Academic","Community","Environment","Fundraising","Inclusion","Innovation","Operational improvement"]
  };

  function clean(v){ return String(v==null?"":v).trim(); }
  function num(v){ const n=Number(v); return Number.isFinite(n)&&n>=0?n:0; }

  function normalize(raw){
    raw=raw||{};
    return {
      activityId:clean(raw.activityId)||("ACT-"+Date.now()),
      organization:clean(raw.organization),
      organizationType:clean(raw.organizationType),
      organizationLevel:clean(raw.organizationLevel),
      position:clean(raw.position),
      leadershipRole:clean(raw.leadershipRole),
      project:clean(raw.project),
      projectScale:clean(raw.projectScale||raw.organizationLevel),
      directTeamSize:num(raw.directTeamSize),
      indirectReach:num(raw.indirectReach),
      schoolsInvolved:num(raw.schoolsInvolved),
      countriesInvolved:num(raw.countriesInvolved),
      durationMonths:num(raw.durationMonths),
      initiative:clean(raw.initiative),
      decisionMaking:clean(raw.decisionMaking),
      peopleManagement:Array.isArray(raw.peopleManagement)?raw.peopleManagement:[],
      responsibilities:Array.isArray(raw.responsibilities)?raw.responsibilities:[],
      impactType:clean(raw.impactType),
      before:clean(raw.before),
      action:clean(raw.action),
      result:clean(raw.result),
      evidence:Array.isArray(raw.evidence)?raw.evidence:[],
      reflection:clean(raw.reflection),
      frequency:clean(raw.frequency),
      budget:num(raw.budget),
      verified:!!raw.verified
    };
  }

  function durationBand(months){
    if(months<1) return "D1"; if(months<3) return "D2"; if(months<6) return "D3";
    if(months<12) return "D4"; if(months<24) return "D5"; return "D6";
  }

  function leadershipDepth(a){
    const role={R1:1,R2:2,R3:3,R4:4,R5:5,R6:6}[a.leadershipRole]||0;
    const decision={M1:1,M2:2,M3:3,M4:4,M5:5}[a.decisionMaking]||0;
    const people=Math.min(8,a.peopleManagement.length);
    return {role,decision,people,depth:role+decision+people};
  }

  function evidenceCompleteness(a){
    const fields=["organization","position","project","organizationLevel","leadershipRole","durationMonths","initiative","decisionMaking","action","result","reflection"];
    const present=fields.filter(k=>clean(a[k])!=="" && !(k==="durationMonths"&&a[k]===0)).length;
    const proof=a.evidence.length;
    return {present,total:fields.length,proof,quality:proof===0?"self_reported":proof<2?"partially_evidenced":"evidenced"};
  }

  function analyze(raw){
    const a=normalize(raw), d=leadershipDepth(a), e=evidenceCompleteness(a);
    const flags=[];
    if(!a.organization) flags.push("Organization not recorded.");
    if(!a.project) flags.push("Project / initiative not recorded.");
    if(!a.durationMonths) flags.push("Duration not recorded.");
    if(!a.action) flags.push("Leadership actions are not yet described.");
    if(!a.result) flags.push("Outcome / impact is not yet described.");
    if(!a.reflection) flags.push("Reflection is not yet recorded.");
    return {
      activity:a,
      durationBand:durationBand(a.durationMonths),
      leadershipDepth:d,
      evidence:e,
      flags,
      summary:{
        organizationLevel:a.organizationLevel||"unknown",
        projectScale:a.projectScale||"unknown",
        teamSize:a.directTeamSize,
        reach:a.indirectReach,
        durationMonths:a.durationMonths,
        leadershipRole:a.leadershipRole||"unknown",
        initiative:a.initiative||"unknown",
        decisionMaking:a.decisionMaking||"unknown",
        impactType:a.impactType||"unknown"
      }
    };
  }

  function profile(activities){
    const list=(Array.isArray(activities)?activities:[]).map(analyze);
    const by={}; list.forEach(x=>{ const k=x.activity.organizationLevel||"unknown"; by[k]=(by[k]||0)+1; });
    const roles=list.map(x=>x.leadershipDepth.role).filter(Boolean);
    const maxRole=roles.length?Math.max.apply(null,roles):0;
    const totalMonths=list.reduce((s,x)=>s+x.activity.durationMonths,0);
    return {
      activities:list,
      count:list.length,
      totalDurationMonths:totalMonths,
      highestLeadershipRole:maxRole,
      organizationLevels:by,
      verifiedActivities:list.filter(x=>x.activity.verified).length,
      evidenceGaps:list.reduce((s,x)=>s+x.flags.length,0)
    };
  }

  window.APLUS_ACTIVITY={
    OPTIONS, normalize, analyze, profile, durationBand, leadershipDepth, evidenceCompleteness
  };
})();