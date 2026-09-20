/* APLUS ADMISSION ACADEMIC EVALUATION v1.0
   Separates UAS calculation from the full academic record.
   Programme-specific relevance rules are intentionally not hard-coded here.
*/
(function(){
  "use strict";
  const arr=v=>Array.isArray(v)?v:[];
  const clean=v=>String(v==null?"":v).trim();
  function evaluate(subjects, options){
    options=options||{};
    const rows=arr(subjects).map(x=>({
      level:clean(x.level).toUpperCase(),
      subject:clean(x.subject),
      grade:clean(x.grade)||"not_available",
      category:clean(x.category),
      points:x.points==null?null:Number(x.points)
    })).filter(x=>x.subject);

    const graded=rows.filter(x=>x.grade!=="not_available");
    const uas=options.uasResult||null;
    const countedKeys=new Set(
      uas&&uas.components
        ? arr(uas.components.h2).concat(uas.components.gp?[uas.components.gp]:[]).map(x=>x.level+"__"+x.subject)
        : []
    );

    const classified=rows.map(x=>{
      const key=x.level+"__"+x.subject;
      return Object.assign({},x,{
        uasRole:countedKeys.has(key)?"counted":"not_counted",
        admissionRole:"unclassified",
        relevanceBasis:"programme_not_yet_defined"
      });
    });

    const nonUas=classified.filter(x=>x.uasRole==="not_counted"&&x.grade!=="not_available");
    const counted=classified.filter(x=>x.uasRole==="counted");

    return {
      version:"1.0",
      framework:"APLUS-ACADEMIC-ADMISSION-EVALUATION",
      target:{
        field:clean(options.field),
        university:clean(options.university),
        course:clean(options.course),
        entryYear:options.entryYear||null
      },
      summary:{
        totalSubjects:rows.length,
        gradedSubjects:graded.length,
        uasCountedSubjects:counted.length,
        gradedNonUasSubjects:nonUas.length
      },
      uas:{
        value:uas&&uas.uas!=null?uas.uas:null,
        scale:uas&&uas.scale?uas.scale:70,
        countedSubjects:counted
      },
      academicEvidence:{
        allSubjects:classified,
        additionalGradedSubjects:nonUas
      },
      ruleStatus:{
        uasRule:"Best 3 H2 content-based subjects + General Paper",
        nonUasSubjects:"Retained as academic evidence and may be considered separately for programme admission evaluation.",
        programmeRelevance:"Not yet assessed until verified programme-specific requirements are connected."
      }
    };
  }
  window.APLUS_ADMISSION_ACADEMIC={version:"1.0",evaluate};
})();