/* APLUS Academic Analysis Engine v1.6
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
    return arr(subjects).map(s=>{
      const level=escText(s.level), subject=escText(s.subject);
      let category=escText(s.category);
      if((!category||category==="Other")&&window.APLUS_SUBJECT_TAXONOMY&&window.APLUS_SUBJECT_TAXONOMY.normalizeOne){
        const tax=window.APLUS_SUBJECT_TAXONOMY.normalizeOne({level,subject});
        category=escText(tax&&tax.category)||"Other";
      }
      return {level,subject,category:category||"Other",
        grade:escText(s.grade)||"not_available", classification:classifyGrade(s.grade)};
    });
  }

  function domainWeight(s){
    const g=escText(s.grade).toUpperCase();
    const l=escText(s.level).toUpperCase();
    const h2={A:4,B:3,C:2,D:1,E:1,S:0,U:0};
    const h1={A:2,B:1.5,C:1,D:.5,E:.5,S:0,U:0};
    return (l==="H2"?h2:h1)[g]||0;
  }

  function domainProfile(subjects){
    const graded=arr(subjects).filter(s=>s.classification!=="not_assessed");
    const domains={};
    graded.forEach(s=>{
      const category=escText(s.category);
      /* Core subjects such as General Paper / Project Work are tracked elsewhere.
         They should not be treated as an academic subject domain. */
      if(!category||category==="Core")return;
      const weight=domainWeight(s);
      if(weight<=0)return;
      if(!domains[category])domains[category]={score:0,max:0};
      const level=escText(s.level).toUpperCase();
      domains[category].score+=weight;
      domains[category].max+=level==="H2"?4:2;
    });
    const labels={Science:"Science",Mathematics:"Mathematics / Quantitative",Computing:"Computing / Quantitative",Humanities:"Humanities",Languages:"Language",Business:"Business",Arts:"Arts"};
    const ranked=Object.entries(domains).sort((a,b)=>b[1].score-a[1].score).map(([category,x])=>{
      const ratio=x.max?x.score/x.max:0;
      const strength=ratio>=.85?"Strong":ratio>=.65?"Developing":ratio>=.4?"Needs Development":"Needs Support";
      return {
        category,
        label:labels[category]||category,
        score:Math.round(x.score*10)/10,
        coverage:Math.round(ratio*100),
        strength
      };
    });
    return {domains:ranked};
  }

  function pattern(subjects){
    const graded=arr(subjects).filter(s=>s.classification!=="not_assessed");
    if(!graded.length) return {label:"Insufficient Data",categoryScores:{},confidence:"low"};
    const scores={};
    graded.forEach(s=>{
      const category=escText(s.category);
      /* Core subjects are evidence for UAS / requirements, not academic-domain patterning. */
      if(!category||category==="Core")return;
      const weight=domainWeight(s);
      if(weight) scores[category]=(scores[category]||0)+weight;
    });
    const ranked=Object.entries(scores).sort((a,b)=>b[1]-a[1]);
    if(!ranked.length) return {label:"Emerging / Developing Pattern",categoryScores:scores,confidence:"low"};
    const top=ranked[0], second=ranked[1];
    const map={Science:"Science-Oriented",Mathematics:"Quantitative / Mathematics-Oriented",Computing:"Computing / Quantitative-Oriented",Humanities:"Humanities-Oriented",Languages:"Language-Oriented",Business:"Business-Oriented",Arts:"Arts-Oriented"};
    let label="Balanced Academic Profile";
    if(top[1]>=6 && (!second || top[1]>=second[1]+2)) label=map[top[0]]||"Mixed Academic Pattern";
    else if(top[1]>=3) label="Mixed Academic Pattern";
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
      else {status="strong";label="Strong Academic Foundation";reason="The recorded subject grades show a strong academic foundation, with some areas to continue monitoring.";}
    }
    return {status,label,reason,counts,gradedSubjects:graded.length,manualInput:escText(manual)||"unknown",derived:true};
  }

  function patternPhrase(label){
    const phrases={
      "Science-Oriented":"a science-oriented pattern",
      "Quantitative / Mathematics-Oriented":"a quantitative and mathematics-oriented pattern",
      "Computing / Quantitative-Oriented":"a computing and quantitative-oriented pattern",
      "Humanities-Oriented":"a humanities-oriented pattern",
      "Language-Oriented":"a language-oriented pattern",
      "Business-Oriented":"a business-oriented pattern",
      "Arts-Oriented":"an arts-oriented pattern",
      "Mixed Academic Pattern":"a mixed academic pattern",
      "Balanced Academic Profile":"a balanced academic profile",
      "Emerging / Developing Pattern":"an emerging and developing pattern",
      "Insufficient Data":"an insufficient academic pattern"
    };
    return phrases[label]||("a "+String(label||"mixed academic pattern").toLowerCase());
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
    parts.push("The current subject profile shows "+patternPhrase(p.label)+".");
    parts.push(r.reason);
    return parts.join(" ");
  }

  function analyze(subjects, manualReadiness){
    const classifications=classifySubjects(subjects);
    const p=pattern(classifications);
    const d=domainProfile(classifications);
    const r=readiness(classifications,manualReadiness);
    return {version:"1.1",classifications,pattern:p,domainProfile:d,readiness:r,summary:summary(classifications,p,r)};
  }

  window.APLUS_ACADEMIC_ANALYSIS={classifyGrade,classifySubjects,analyze};
})();