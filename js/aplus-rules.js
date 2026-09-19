/* APLUS Rules Engine v2.0
   Deterministic requirement -> student evidence -> gap -> action layer.
   This engine does not predict admission outcomes.
*/
(function(){
  "use strict";
  function norm(v){return String(v==null?"":v).trim().toLowerCase();}
  function arr(v){return Array.isArray(v)?v:[];}
  function hasAny(list, terms){
    const xs=arr(list).map(norm);
    return arr(terms).some(t=>xs.some(x=>x===norm(t)||x.includes(norm(t))||norm(t).includes(x)));
  }
  function targetMatches(t, target){
    return norm(t.university)===norm(target.university) &&
      norm(t.course)===norm(target.course||"Medicine") &&
      Number(t.entryYear)===Number(target.entryYear);
  }
  function matchTarget(db,target){
    return arr(db.targets||db.universities).find(t=>targetMatches(t,target))||null;
  }
  function evidenceFor(req,s){
    s=s||{};
    const q=norm(s.qualification);
    const type=norm(req.type);
    if(type==="academic"){
      if(q && norm(req.qualification)!==q) return "not_applicable";
      const subjects=arr(s.subjects);
      if(!subjects.length) return "unknown";
      const wanted=norm(req.subject||"");
      return subjects.some(x=>norm(x).includes(wanted)||wanted.includes(norm(x))) ? "met" : "missing";
    }
    if(type==="test"){
      if(!arr(s.testsTaken).length) return "missing";
      return hasAny(s.testsTaken,[req.testName]) ? "met" : "missing";
    }
    if(type==="application"){
      if(norm(req.item)==="medicine first choice")
        return norm(s.firstChoice)==="medicine" ? "met" : "missing";
      if(norm(req.item)==="personal statement")
        return s.personalStatementReady===true ? "met" : "missing";
      if(norm(req.item)==="referee reports")
        return Number(s.refereeCount||0)>=2 ? "met" : "missing";
      if(norm(req.item)==="criminal record declaration")
        return s.criminalRecordDeclaration===true ? "met" : "missing";
      if(norm(req.item)==="health requirements")
        return s.healthRequirementsReady===true ? "met" : "unknown";
      return "unknown";
    }
    if(type==="assessment"){
      if(norm(req.item).includes("mmi")) return s.mmiReady===true ? "met" : "unknown";
      if(norm(req.item).includes("fsa")) return s.fsaReady===true ? "met" : "unknown";
      return "unknown";
    }
    return "unknown";
  }
  function buildGapAnalysis(db,target,student){
    const profile=matchTarget(db,target);
    if(!profile) return {status:"no_target_record",gaps:[],actions:[]};
    const gaps=arr(profile.requirements).map((req,i)=>{
      const status=evidenceFor(req,student);
      const priority=status==="missing"?"high":status==="unknown"?"medium":"low";
      return {gapId:"GAP-"+String(i+1).padStart(3,"0"),requirementId:req.id,
        requirement:req.subject||req.item||req.testName,category:req.type,status,priority,
        rule:req.rule||"",sourceId:req.sourceId||null,
        reason:status==="met"?"Recorded student evidence matches this requirement.":
          status==="missing"?"Required evidence has not been recorded as completed.":
          status==="not_applicable"?"This requirement is for a different qualification.":"More student evidence is needed to verify this item."};
    });
    const actions=gaps.filter(g=>g.status!=="met"&&g.status!=="not_applicable").map((g,i)=>({
      actionId:"ACT-"+String(i+1).padStart(3,"0"),
      title:g.status==="missing"?"Complete: "+g.requirement:"Verify: "+g.requirement,
      description:g.status==="missing"?"Complete the requirement and record evidence, then re-check the target-year source.":"Collect the student evidence needed to determine whether this requirement is met.",
      priority:g.priority,linkedGapId:g.gapId,sourceId:g.sourceId
    }));
    return {status:"ok",target:profile,gaps,actions,
      summary:{total:gaps.filter(g=>g.status!=="not_applicable").length,
        met:gaps.filter(g=>g.status==="met").length,
        missing:gaps.filter(g=>g.status==="missing").length,
        unknown:gaps.filter(g=>g.status==="unknown").length}};
  }
  function getTimeline(db,target){const p=matchTarget(db,target);return p?arr(p.timeline):[];}
  window.APLUS_RULES={matchTarget,evaluateRequirement:evidenceFor,buildGapAnalysis,getTimeline};
})();