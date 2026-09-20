/* APLUS A-LEVEL SCORE ENGINE v1.2
   Singapore-Cambridge GCE A-Level -> University Admission Score (UAS).
   Rule basis: 2025 A-Level cohort / AY2026+ revised 70-point framework.
   Source: NUS revised UAS FAQ (information accurate Feb 2026).
*/
(function(){
  "use strict";
  const POINTS={
    H2:{A:20,B:17.5,C:15,D:12.5,E:10,S:5,U:0},
    H1:{A:10,B:8.75,C:7.5,D:6.25,E:5,S:2.5,U:0}
  };
  const MAX={H2:20,H1:10};
  function clean(v){return String(v==null?"":v).trim().toUpperCase();}
  function level(v){const x=clean(v);return x==="H2"?"H2":x==="H1"?"H1":x;}
  function points(l,g){const L=level(l),G=clean(g);return POINTS[L]&&Object.prototype.hasOwnProperty.call(POINTS[L],G)?POINTS[L][G]:null;}
  function scoreSubject(s){
    s=s||{}; const L=level(s.level), G=clean(s.grade);
    return {level:L,subject:String(s.subject||"").trim(),grade:G||"NOT_AVAILABLE",category:String(s.category||"").trim(),points:points(L,G)};
  }
  function calculate(subjects, options){
    options=options||{};
    const rows=(Array.isArray(subjects)?subjects:[]).map(scoreSubject).filter(x=>x.subject);
    const graded=rows.filter(x=>x.points!==null);
    const h2=graded.filter(x=>x.level==="H2" && !["General Paper","Project Work"].includes(x.subject));
    const gp=graded.find(x=>x.level==="H1" && x.subject.toLowerCase()==="general paper")||null;
    const fourthCandidates=graded.filter(x=>x!==gp && x.level==="H1" && !["Project Work","General Paper"].includes(x.subject))
      .concat(graded.filter(x=>x!==gp && x.level==="H2" && !["General Paper","Project Work"].includes(x.subject)));
    // UAS base rule: take the BEST THREE H2 content-based subjects, regardless of
    // how many H2 subjects the student has taken, then add General Paper.
    // This is essential for students taking 4 or 5 H2 subjects.
    const rankedH2=h2.slice().sort((a,b)=>b.points-a.points);
    const bestH2=rankedH2.slice(0,3);
    const excludedH2=rankedH2.slice(3);
    const baseComplete=bestH2.length===3 && !!gp;
    const baseUAS=baseComplete?bestH2.reduce((a,x)=>a+x.points,0)+gp.points:null;
    let finalUAS=baseUAS, inclusion={fourth:false,mtl:false};
    // Optional fourth subject/MTL rebasing is represented but only applied when explicitly supplied.
    // For the revised framework, an extra H1/H2 content subject and/or H1 MTL is considered
    // only if it improves the overall UAS. Each valid combination is rebased to 70.
    // The fourth content-based subject is treated at H1 weighting for the
    // revised 70-point UAS rebasing, including when that subject is offered at H2.
    // Automatically identify the strongest eligible fourth H1/H2 content subject.
    // For 4/5 H2 students this is the strongest H2 outside the base best three;
    // for 3 H2 + H1 pathways it can be the eligible H1 content subject.
    const autoFourth=fourthCandidates.slice().sort((a,b)=>b.points-a.points)[0]||null;
    const fourth=options.fourthSubject?scoreSubject(options.fourthSubject):autoFourth;
    const fourthEquivalent=fourth&&fourth.points!==null
      ?{...fourth,points:POINTS.H1[clean(fourth.grade)]}
      :null;
    const mtl=options.mtl?scoreSubject(options.mtl):null;
    if(baseComplete){
      const candidates=[{score:baseUAS,fourth:false,mtl:false}];
      if(fourthEquivalent&&fourthEquivalent.points!==null){
        candidates.push({score:(baseUAS+fourthEquivalent.points)*70/80,fourth:true,mtl:false});
      }
      if(mtl&&mtl.points!==null){
        candidates.push({score:(baseUAS+mtl.points)*70/80,fourth:false,mtl:true});
      }
      if(fourthEquivalent&&fourthEquivalent.points!==null&&mtl&&mtl.points!==null){
        candidates.push({score:(baseUAS+fourthEquivalent.points+mtl.points)*70/90,fourth:true,mtl:true});
      }
      const best=candidates.reduce((a,b)=>b.score>a.score?b:a,candidates[0]);
      finalUAS=Math.round(best.score*100)/100;
      inclusion={fourth:best.fourth,mtl:best.mtl};
    }
    return {
      version:"1.1",
      framework:"2025-A-LEVEL-AY2026-UAS-70",
      scale:70,
      gradePoints:POINTS,
      components:{h2:bestH2,excludedH2,gp},
      baseUAS:baseUAS===null?null:Math.round(baseUAS*100)/100,
      optional:{fourthSubject:fourth,mtl:mtl,included:inclusion},
      uas:finalUAS,
      complete:baseComplete,
      breakdown:rows,
      ruleSummary:"Base UAS = best 3 H2 content-based subjects + General Paper; the fourth H1/H2 content-based subject is considered at H1 weighting only if it improves the rebased UAS."
    };
  }
  window.APLUS_ALEVEL_SCORE={version:"1.0",POINTS,MAX,points,scoreSubject,calculate};
})();