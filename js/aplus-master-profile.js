/* APLUS Student Master Profile v1.0
   Canonical student state shared by all planning engines.
*/
(function(){
  "use strict";
  function arr(v){return Array.isArray(v)?v:[];}
  function n(v){const x=Number(v);return Number.isFinite(x)?x:null;}
  function clean(v){return String(v==null?"":v).trim();}

  function create(raw){
    raw=raw||{};
    return {
      schemaVersion:"1.0",
      studentId:clean(raw.studentId)||("STU-"+Date.now()),
      updatedAt:new Date().toISOString(),
      target:{
        field:clean(raw.field),
        university:clean(raw.university),
        course:clean(raw.course),
        country:clean(raw.country),
        entryYear:n(raw.entryYear),
        scholarship:clean(raw.scholarship),
        applications:arr(raw.applications)
      },
      profile:{
        currentLevel:clean(raw.currentLevel),
        qualification:clean(raw.qualification),
        academicProfile:clean(raw.academicProfile),
        subjects:arr(raw.subjects),
        strengths:arr(raw.strengths),
        weakTopics:arr(raw.weakTopics)
      },
      evidence:{
        activities:arr(raw.activities),
        activityCount:arr(raw.activities).length
      },
      application:{
        firstChoice:clean(raw.firstChoice),
        testsTaken:arr(raw.testsTaken),
        refereeCount:n(raw.refereeCount)||0,
        personalStatementReady:!!raw.personalStatementReady,
        assessmentReady:clean(raw.assessmentReady)
      },
      metadata:{
        evidenceQuality:clean(raw.evidenceQuality)||"self_reported",
        lastReview:clean(raw.lastReview)||new Date().toISOString().slice(0,10)
      }
    };
  }

  function validate(s){
    const issues=[];
    if(!s.target.university && !s.target.course) issues.push("Target is not yet defined.");
    if(!s.target.entryYear) issues.push("Target entry year is not yet defined.");
    if(!s.profile.currentLevel) issues.push("Current education level is not yet defined.");
    if(!s.profile.qualification) issues.push("Qualification pathway is not yet defined.");
    if(!s.profile.subjects.length) issues.push("Academic subjects are not yet recorded.");
    if(!s.evidence.activityCount) issues.push("No activities have been recorded yet.");
    return {ok:issues.length===0,issues};
  }

  function summary(s){
    return {
      studentId:s.studentId,
      target:(s.target.university||"Target not selected")+" · "+(s.target.course||"Course not selected"),
      entryYear:s.target.entryYear||"—",
      currentLevel:s.profile.currentLevel||"—",
      qualification:s.profile.qualification||"—",
      activities:s.evidence.activityCount,
      evidenceQuality:s.metadata.evidenceQuality
    };
  }

  window.APLUS_MASTER_PROFILE={create,validate,summary};
})();