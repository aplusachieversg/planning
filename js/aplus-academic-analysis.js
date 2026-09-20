/* APLUS Academic Analysis Engine v1.0
   Subject grades -> classification -> academic pattern -> academic readiness -> profile summary.
   Descriptive planning support only; does not make admissions or career predictions.
*/
(function(){
  "use strict";
  const arr=v=>Array.isArray(v)?v:[];
  const escText=v=>String(v==null?"":v).trim();

  function classifyGrade(grade){
    const g=escText(grade).toUpperCase();
    if(g==="A") return "strong";
    if(g==="B") return "developing";
    if(g==="C") return "needs_development";
    if(g==="D"||g==="E"||g==="S"||g==="U") return "needs_support";
    return "not_assessed";
  }

  function classifySubjects(subjects){
    return arr(subjects).map(s=>({
      level:escText(s.level), subject:escText(s.subject), category:escText(s.category)||"Other",
      grade:escText(s.grade)||"not_available", classification:classifyGrade(s.grade)
    }));
  }

  function pattern(subjects){
    const graded=arr(subjects).filter(s=>s.classification!=="not_assessed");
    if(!graded.length) return {label:"Insufficient Data",categoryScores:{},confidence:"low"};
    const scores={};
    graded.forEach(s=>{
      const weight=s.classification==="strong"?2:s.classification==="developing"?1:0;
      if(weight) scores[s.category]=(scores[s.category]||0)+weight;
    });
    const ranked=Object.entries(scores).sort((a,b)=>b[1]-a[1]);
    if(!ranked.length) return {label:"Emerging / Developing Pattern",categoryScores:scores,confidence:"low"};
    const top=ranked[0], second=ranked[1];
    let label="Balanced Academic Profile";
    if(top[1]>=4 && (!second || top[1]>=second[1]+2)){
      const map={Science:"Science-Oriented",Mathematics:"Quantitative / Mathematics-Oriented",Computing:"Computing / Quantitative-Oriented",Humanities:"Humanities-Oriented",Languages:"Language-Oriented",Business:"Business-Oriented",Arts:"Arts-Oriented"};
      label=map[top[0]]||"Mixed Academic Pattern";
    } else if(top[1]>=2) label="Mixed Academic Pattern";
    return {label,categoryScores:scores,confidence:graded.length>=3?"moderate":"low"};
  }

  function readiness(subjects, manual){
    const graded=arr(subjects).filter(s=>s.classification!=="not_assessed");
    const counts={strong:0,developing:0,needs_development:0,needs_support:0};
    graded.forEach(s=>counts[s.classification]++);
    let status="insufficient_data", label="Insufficient Academic Data", reason="Record current subject grades to assess academic readiness.";
    if(graded.length){
      const ratio=(counts.strong*2+counts.developing)/(graded.length*2);
      if(counts.needs_support>=2 || ratio<.5){status="needs_development";label="Further Development Recommended";reason="Several graded subjects indicate areas that may need focused development.";}
      else if(counts.developing>counts.strong){status="developing";label="Generally Developing";reason="The profile shows a developing academic foundation across the recorded subjects.";}
      else {status="strong_foundation";label="Strong Academic Foundation";reason="The recorded subject grades show a strong academic foundation, with some areas to continue monitoring.";}
    }
    return {status,label,reason,counts,gradedSubjects:graded.length,manualInput:escText(manual)||"unknown",derived:true};
  }

  function summary(subjects, p, r){
    const names=(cls)=>arr(subjects).filter(s=>s.classification===cls).map(s=>(s.level?s.level+" ":"")+s.subject);
    const strong=names("strong"), developing=names("developing"), nd=names("needs_development"), ns=names("needs_support");
    if(!subjects.length) return "Academic Profile is not yet complete. Add current or planned subjects and grades to generate an academic pattern and readiness summary.";
    const parts=[];
    if(strong.length) parts.push("Strong performance is recorded in "+strong.join(", ")+".");
    if(developing.length) parts.push("Developing areas include "+developing.join(", ")+".");
    if(nd.length) parts.push("Further development is indicated in "+nd.join(", ")+".");
    if(ns.length) parts.push("Additional support may be useful in "+ns.join(", ")+".");
    parts.push("The current subject profile shows a "+String(p.label).toLowerCase()+".");
    parts.push(r.reason);
    return parts.join(" ");
  }

  function analyze(subjects, manualReadiness){
    const classifications=classifySubjects(subjects);
    const p=pattern(classifications);
    const r=readiness(classifications,manualReadiness);
    return {version:"1.0",classifications,pattern:p,readiness:r,summary:summary(classifications,p,r)};
  }

  window.APLUS_ACADEMIC_ANALYSIS={classifyGrade,classifySubjects,analyze};
})();