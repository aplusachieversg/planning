/* APLUS JC / GCE A-LEVEL SUBJECT TAXONOMY v1.1
   Source basis: SEAB 2027 GCE A-Level syllabuses for school candidates.
   Purpose: structured student selection; no free-text subject entry required.
*/
(function(){
  "use strict";
  const levels={
    H1:[
      ["Bengali","Languages"],["Gujarati","Languages"],["Hindi","Languages"],["French","Languages"],
      ["Literature in English","Humanities"],["German","Languages"],["Geography","Humanities"],["Japanese","Languages"],
      ["Panjabi","Languages"],["Urdu","Languages"],["History","Humanities"],["Economics","Humanities"],
      ["Mathematics","Mathematics"],["Physics","Science"],["Chemistry","Science"],["Biology","Science"],
      ["Art","Arts"],["General Paper","Core"],["Chinese Language","Languages"],["Malay Language","Languages"],["Tamil Language","Languages"]
    ],
    H2:[
      ["Geography","Humanities"],["History","Humanities"],["Art","Arts"],["Chemistry","Science"],["Biology","Science"],
      ["Physics","Science"],["English Language and Linguistics","Languages"],["Theatre Studies and Drama","Arts"],
      ["Literature in English","Humanities"],["Computing","Computing"],["Economics","Humanities"],["Spanish","Languages"],
      ["Management of Business","Business"],["Principles of Accounting","Business"],["China Studies in English","Humanities"],
      ["Further Mathematics","Mathematics"],["French","Languages"],["German","Languages"],["Japanese","Languages"],
      ["Music","Arts"],["Mathematics","Mathematics"],["Knowledge and Inquiry","Humanities"],
      ["Translation (Chinese)","Languages"],["Chinese Language and Literature","Languages"],
      ["China Studies in Chinese","Humanities"],["Malay Language and Literature","Languages"],
      ["Tamil Language and Literature","Languages"]
    ],
    H3:[
      ["Literature in English","Humanities"],["Economics","Humanities"],["Chemistry","Science"],["Physics","Science"],
      ["Biology","Science"],["Art","Arts"],["Music","Arts"],["Mathematics","Mathematics"],
      ["Geography","Humanities"],["History","Humanities"],["Chinese Language and Literature","Languages"],
      ["Malay Language and Literature","Languages"],["Tamil Language and Literature","Languages"]
    ],
    CORE:[
      ["Project Work","Core"],["Chinese B","Languages"],["Malay B","Languages"],["Tamil B","Languages"]
    ]
  };
  const codes={
    "General Paper":"8881","Project Work":"8882","Chemistry":"9476","Biology":"9477","Physics":"9478",
    "Computing":"9569","Economics":"9570","Further Mathematics":"9649","Mathematics":"9758"
  };
  const gradeOptions=["A","B","C","D","E","S","U"];
  function key(level,subject){return String(level)+"::"+String(subject);}
  function list(level){return (levels[level]||[]).map(x=>({level,subject:x[0],category:x[1],code:codes[x[0]]||null,canonicalId:key(level,x[0])}));}
  function all(){return Object.keys(levels).flatMap(list);}
  function normalizeOne(x){
    if(x&&typeof x==="object"){
      const level=String(x.level||"").toUpperCase();
      const subject=String(x.subject||x.name||"").trim();
      if(subject){
        const found=all().find(a=>a.level===level&&a.subject.toLowerCase()===subject.toLowerCase());
        return found
          ?Object.assign({},found,{grade:x.grade||"not_available",canonicalId:x.canonicalId||found.canonicalId})
          :{level:level||"OTHER",subject,category:x.category||"Other",code:x.code||null,grade:x.grade||"not_available",canonicalId:x.canonicalId||key(level,subject)};
      }
    }
    const s=String(x||"").trim();
    const m=s.match(/^(H[123]|H1|H2|H3)\s+(.+)$/i);
    if(m){
      const level=m[1].toUpperCase(), subject=m[2].trim();
      const found=all().find(a=>a.level===level&&a.subject.toLowerCase()===subject.toLowerCase());
      return found?Object.assign({},found,{grade:"not_available"}):{level,subject,category:"Other",code:null,grade:"not_available",canonicalId:key(level,subject)};
    }
    const found=all().find(a=>a.subject.toLowerCase()===s.toLowerCase());
    return found?Object.assign({},found,{grade:"not_available"}):{level:"OTHER",subject:s,category:"Other",code:null,grade:"not_available",canonicalId:key("OTHER",s)};
  }
  function normalizeList(v){return Array.isArray(v)?v.filter(Boolean).map(normalizeOne):[];}
  function has(listValue,level,subject){return normalizeList(listValue).some(x=>x.level===level&&x.subject.toLowerCase()===subject.toLowerCase());}
  function countH2Content(v){return normalizeList(v).filter(x=>x.level==="H2"&&!["General Paper","Project Work"].includes(x.subject)).length;}
  function h3(v){return normalizeList(v).filter(x=>x.level==="H3");}
  window.APLUS_SUBJECT_TAXONOMY={version:"1.0",levels,gradeOptions,list,all,normalizeOne,normalizeList,has,countH2Content,h3,codes};
})();