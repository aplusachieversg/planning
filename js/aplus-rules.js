/* APLUS Rules Engine v1.0
   Purpose: deterministic gap/action generation from verified database records.
   The engine does not predict admission outcomes.
*/
(function(){
  "use strict";

  function norm(v){ return String(v||"").trim().toLowerCase(); }
  function isTrue(v){ return v===true || v==="true"; }

  function matchTarget(db, target){
    return (db.universities||[]).find(function(u){
      return norm(u.university)===norm(target.university) &&
             norm(u.course)===norm(target.course||"MBBS") &&
             Number(u.entryYear)===Number(target.entryYear);
    }) || null;
  }

  function evaluateRequirement(req, student){
    var s=student||{};
    if(req.category==="Academic"){
      var subjects=(s.subjects||[]).map(norm);
      if(req.item && subjects.some(function(x){return x.includes(norm(req.item)) || norm(req.item).includes(x)})) return "met";
      return "unknown";
    }
    if(req.category==="Admissions Test"){
      return (s.testsTaken||[]).map(norm).includes(norm(req.item)) ? "met" : "missing";
    }
    if(req.category==="References"){
      return Number(s.refereeCount||0)>=Number(req.quantity||2) ? "met" : "missing";
    }
    if(req.category==="Written"){
      return s.personalStatementReady ? "met" : "missing";
    }
    if(req.category==="Interview" || req.category==="Assessment"){
      return s.interviewReady ? "met" : "unknown";
    }
    return "unknown";
  }

  function buildGapAnalysis(db,target,student){
    var profile=matchTarget(db,target);
    if(!profile) return {status:"no_target_record",gaps:[],actions:[]};
    var gaps=(profile.requirements||[]).map(function(req,i){
      var status=evaluateRequirement(req,student);
      var priority=status==="missing" ? "high" : status==="unknown" ? "medium" : "low";
      return {
        gapId:"GAP-"+(i+1),
        requirement:req.item,
        category:req.category,
        status:status,
        priority:priority,
        reason:status==="met"?"Current profile indicates this item is covered.":
          status==="missing"?"A required item has not been recorded as completed.":
          "The available student profile is insufficient to verify this item."
      };
    });
    var actions=gaps.filter(function(g){return g.status!=="met"}).map(function(g,i){
      return {
        actionId:"ACT-"+(i+1),
        title:"Resolve: "+g.requirement,
        description:g.status==="missing"?
          "Complete and record the required item, then verify it against the official target-year source.":
          "Collect the missing student evidence needed to determine whether this item is met.",
        priority:g.priority,
        linkedGapId:g.gapId
      };
    });
    return {status:"ok",target:profile,gaps:gaps,actions:actions};
  }

  function getTimeline(db,target){
    var p=matchTarget(db,target);
    if(!p) return [];
    return p.timelineEvents || [];
  }

  window.APLUS_RULES={matchTarget:matchTarget,evaluateRequirement:evaluateRequirement,buildGapAnalysis:buildGapAnalysis,getTimeline:getTimeline};
})();