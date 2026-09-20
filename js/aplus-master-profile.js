/* APLUS Student Master Profile v1.5
   Canonical student state + structured readiness model.
*/
(function(){
  "use strict";
  function arr(v){return Array.isArray(v)?v:[];}
  function n(v){const x=Number(v);return Number.isFinite(x)?x:null;}
  function clean(v){return String(v==null?"":v).trim();}
  function create(raw){
    raw=raw||{};
    const subjects=window.APLUS_SUBJECT_TAXONOMY?window.APLUS_SUBJECT_TAXONOMY.normalizeList(raw.subjects):arr(raw.subjects);
    const aLevelScore=window.APLUS_ALEVEL_SCORE?window.APLUS_ALEVEL_SCORE.calculate(subjects):null;
    const university=clean(raw.university), course=clean(raw.course), entryYear=n(raw.entryYear);
    const requirementRecords=window.APLUS_REQUIREMENTS&&window.APLUS_REQUIREMENTS.get
      ?window.APLUS_REQUIREMENTS.get(university,course,entryYear)
      :[];
    const admissionAcademic=window.APLUS_ADMISSION_ACADEMIC?window.APLUS_ADMISSION_ACADEMIC.evaluate(subjects,{
      uasResult:aLevelScore,
      requirements:requirementRecords,
      field:clean(raw.field),university,course,entryYear
    }):null;
    return {
      schemaVersion:"1.5",
      studentId:clean(raw.studentId)||("STU-"+Date.now()),
      updatedAt:new Date().toISOString(),
      target:{
        field:clean(raw.field), university, course,
        country:clean(raw.country), entryYear, scholarship:clean(raw.scholarship),
        applications:arr(raw.applications)
      },
      profile:{
        currentLevel:clean(raw.currentLevel), qualification:clean(raw.qualification),
        academicProfile:clean(raw.academicProfile), subjects,
        strengths:arr(raw.strengths), weakTopics:arr(raw.weakTopics),
        academicAnalysis:(window.APLUS_ACADEMIC_ANALYSIS?window.APLUS_ACADEMIC_ANALYSIS.analyze(subjects,(raw.readiness&&raw.readiness.academic)||raw.academicReadiness):null),
        aLevelScore,
        admissionAcademic,
        subjectGrades:subjects.map(x=>({level:x.level,subject:x.subject,grade:x.grade||"not_available"}))
      },
      readiness:{
        academic:clean((raw.readiness&&raw.readiness.academic)||raw.academicReadiness)||"unknown",
        test:clean((raw.readiness&&raw.readiness.test)||raw.testReadiness)||"unknown",
        communication:clean((raw.readiness&&raw.readiness.communication)||raw.communicationReadiness)||"unknown",
        leadership:clean((raw.readiness&&raw.readiness.leadership)||raw.leadershipReadiness)||"unknown",
        service:clean((raw.readiness&&raw.readiness.service)||raw.serviceReadiness)||"unknown",
        application:clean((raw.readiness&&raw.readiness.application)||raw.applicationReadiness)||"unknown"
      },
      evidence:{activities:arr(raw.activities),activityCount:arr(raw.activities).length,experienceProfile:(window.APLUS_EXPERIENCE_PROFILE?window.APLUS_EXPERIENCE_PROFILE:((window.APLUS_EXPERIENCE&&window.APLUS_EXPERIENCE.profile)?window.APLUS_EXPERIENCE.profile(raw.activities):null))},
      application:{
        firstChoice:clean(raw.firstChoice), testsTaken:arr(raw.testsTaken),
        refereeCount:n(raw.refereeCount)||0, personalStatementReady:!!raw.personalStatementReady,
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
    if(!s.target.university&&!s.target.course)issues.push("Target is not yet defined.");
    if(!s.target.entryYear)issues.push("Target entry year is not yet defined.");
    if(!s.profile.currentLevel)issues.push("Current education level is not yet defined.");
    if(!s.profile.qualification)issues.push("Qualification pathway is not yet defined.");
    if(!s.profile.subjects.length)issues.push("Academic subjects are not yet recorded.");
    if(!s.evidence.activityCount)issues.push("No activities have been recorded yet.");
    return {ok:issues.length===0,issues};
  }
  function readiness(s){
    const r=s.readiness||{},items=[["Academic",r.academic],["Test / Assessment",r.test],["Communication",r.communication],["Leadership",r.leadership],["Service",r.service],["Application",r.application]];
    const known=items.filter(x=>x[1]&&x[1]!=="unknown"),level={strong:2,developing:1,needs_work:0},points=known.reduce((a,x)=>a+(level[x[1]]??0),0),max=known.length*2;
    return {items,known:known.length,score:points,max,status:!known.length?"not_started":points>=max*.75?"developing_strength":points>=max*.45?"developing":"priority_build"};
  }
  function summary(s){
    return {studentId:s.studentId,target:(s.target.university||"Target not selected")+" · "+(s.target.course||"Course not selected"),entryYear:s.target.entryYear||"—",currentLevel:s.profile.currentLevel||"—",qualification:s.profile.qualification||"—",activities:s.evidence.activityCount,evidenceQuality:s.metadata.evidenceQuality,readiness:readiness(s),academicAnalysis:s.profile.academicAnalysis||null,admissionAcademic:s.profile.admissionAcademic||null};
  }
  window.APLUS_MASTER_PROFILE={create,validate,summary,readiness};
})();