/* APLUS ADMISSION ACADEMIC EVALUATION v1.1
   Separates UAS calculation from the full academic record.
   Connects verified programme academic requirements without replacing the full record.
*/
(function(){
  "use strict";
  const arr=v=>Array.isArray(v)?v:[];
  const clean=v=>String(v==null?"":v).trim();
  const norm=v=>clean(v).toLowerCase().replace(/[–—]/g,"-");
  const passGrades=new Set(["A","B","C","D","E"]);

  function requirementRows(records){
    return arr(records).filter(r=>r&&clean(r.category).toLowerCase()==="academic");
  }

  function subjectRule(subject, records){
    const s=norm(subject);
    const rows=requirementRows(records);
    const text=rows.map(r=>norm(r.requirement)+" "+norm(r.threshold)).join(" | ");
    if(!text) return {role:"unclassified",group:null,basis:"no_verified_academic_requirement_record"};

    // Explicit Medicine-style rule: Chemistry is required, while Biology/Physics
    // form an either/or academic requirement.
    const hasChem=text.includes("chemistry");
    const hasBio=text.includes("biology");
    const hasPhys=text.includes("physics");
    const hasEitherBioPhys=hasBio&&hasPhys&&(
      text.includes("biology or physics") ||
      text.includes("biology/physics") ||
      text.includes("biology / physics") ||
      text.includes("biology or") && text.includes("physics")
    );

    if(s==="chemistry" && hasChem) return {role:"required",group:null,basis:"verified_programme_academic_requirement"};
    if((s==="biology"||s==="physics") && hasEitherBioPhys)
      return {role:"required_alternative",group:"biology_or_physics",basis:"verified_programme_academic_requirement"};

    return {role:"additional_evidence",group:null,basis:"not_explicitly_required_in_verified_academic_record"};
  }

  function statusFor(subject, rule, rows, records){
    if(rule.role==="unclassified") return "not_assessed";
    const r=rows.find(x=>norm(x.subject)===norm(subject));
    if(!r || r.grade==="not_available") return "missing";
    if(!passGrades.has(r.grade)) return "not_met";
    const thresholdText=requirementRows(records).map(x=>norm(x.threshold||"")).join(" | ");
    if(rule.role==="required" && norm(subject)==="chemistry" && thresholdText.includes("good h2 pass"))
      return "threshold_check";
    return "met";
  }

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
    const records=arr(options.requirements);
    const academicRequirements=requirementRows(records);

    const classified=rows.map(x=>{
      const key=x.level+"__"+x.subject;
      const rule=subjectRule(x.subject,records);
      return Object.assign({},x,{
        uasRole:countedKeys.has(key)?"counted":"not_counted",
        admissionRole:rule.role,
        requirementGroup:rule.group,
        requirementMatch:statusFor(x.subject,rule,rows,records),
        relevanceBasis:rule.basis
      });
    });

    // Alternative-group status is evaluated at group level: one qualifying
    // Biology/Physics subject is enough to satisfy the documented either/or rule.
    const alt=classified.filter(x=>x.requirementGroup==="biology_or_physics");
    const altMet=alt.some(x=>x.requirementMatch==="met"||x.requirementMatch==="threshold_check");
    const alternativeRequirementStatus=alt.length
      ? (altMet?"met":alt.some(x=>x.grade!=="not_available")?"not_met":"missing")
      : "not_assessed";

    const nonUas=classified.filter(x=>x.uasRole==="not_counted"&&x.grade!=="not_available");
    const counted=classified.filter(x=>x.uasRole==="counted");
    const required=classified.filter(x=>x.admissionRole==="required"||x.admissionRole==="required_alternative");

    return {
      version:"1.1",
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
        gradedNonUasSubjects:nonUas.length,
        academicRequirementRecords:academicRequirements.length,
        requiredSubjects:required.length,
        alternativeRequirementStatus
      },
      uas:{
        value:uas&&uas.uas!=null?uas.uas:null,
        scale:uas&&uas.scale?uas.scale:70,
        countedSubjects:counted
      },
      academicEvidence:{
        allSubjects:classified,
        requiredSubjects:required,
        additionalGradedSubjects:nonUas
      },
      requirementAssessment:{
        records:academicRequirements,
        alternativeGroups:{
          biology_or_physics:{
            status:alternativeRequirementStatus,
            basis:"verified_programme_academic_requirement"
          }
        }
      },
      ruleStatus:{
        uasRule:"Best 3 H2 content-based subjects + General Paper",
        nonUasSubjects:"Retained as academic evidence and may be considered separately for programme admission evaluation.",
        programmeRelevance:academicRequirements.length
          ?"Connected to verified programme academic requirement records."
          :"Not assessed until verified programme academic requirement records are available."
      }
    };
  }
  window.APLUS_ADMISSION_ACADEMIC={version:"1.1",evaluate};
})();