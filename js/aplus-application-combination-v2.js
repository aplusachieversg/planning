/* APLUS APPLICATION COMBINATION ENGINE v2.0
   Coordinates multiple application pathways, deadlines, tests and preparation overlaps.
   This is a planning tool, not an admissions prediction.
*/
(function(){
  "use strict";
  const esc=v=>String(v==null?"":v).replace(/[&<>"]/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[m]));
  const DATA={
    "NUS Medicine":{
      country:"Singapore", course:"Medicine", route:"NUS MBBS",
      application:"NUS application + Medicine portfolio",
      test:"FSA",
      windows:[
        {label:"Portfolio",start:"Late Jan",end:"Mid Mar"},
        {label:"Shortlisting",start:"Late Mar",end:"Late Mar"},
        {label:"FSA",start:"Late Mar",end:"Mid Apr"},
        {label:"Offers",start:"Late Apr",end:"Early May"}
      ],
      preparation:["Academic eligibility","Medicine portfolio","FSA readiness"]
    },
    "NTU Medicine":{
      country:"Singapore", course:"Medicine", route:"LKCMedicine MBBS",
      application:"NTU undergraduate application",
      test:"UCAT + MMI",
      windows:[
        {label:"UCAT",start:"May",end:"Sep"},
        {label:"Application",start:"Oct",end:"Mar"},
        {label:"MMI",start:"Late Mar",end:"Apr"},
        {label:"Offers / waitlist",start:"Late Apr",end:"Jul"}
      ],
      preparation:["Academic eligibility","UCAT","Personal Statement","Referee Reports","MMI"]
    },
    "UK Medicine":{
      country:"United Kingdom", course:"Medicine", route:"UCAS Medicine",
      application:"UCAS",
      test:"University-specific / UCAT where required",
      windows:[
        {label:"UCAS submission",start:"Sep",end:"15 Oct"},
        {label:"University assessment",start:"Oct",end:"Spring"},
        {label:"Interviews",start:"Nov",end:"Mar"}
      ],
      preparation:["Academic eligibility","UCAT planning where required","UCAS application","Reference","Interview preparation"]
    }
  };

  function selected(){
    return Array.from(document.querySelectorAll(".acChoice:checked")).map(x=>x.value);
  }

  function build(){
    const names=selected();
    const master=(()=>{try{return JSON.parse(localStorage.getItem("APLUS_MASTER_PROFILE")||"null")}catch(e){return null}})();
    const entry=Number(master&&master.target&&master.target.entryYear)||2027;
    const targets=names.map(n=>({name:n,...DATA[n]}));
    if(!targets.length)return {ok:false,message:"Select at least one application pathway."};

    const tests=[...new Set(targets.map(x=>x.test))];
    const prep=[...new Set(targets.flatMap(x=>x.preparation))];

    const flags=[];
    if(names.includes("NTU Medicine")&&names.includes("UK Medicine"))
      flags.push("UCAT planning must be coordinated across NTU and UK Medicine applications. Confirm the applicable test cycle and university rules for the target entry year.");
    if(names.includes("NUS Medicine")&&names.includes("NTU Medicine"))
      flags.push("NUS FSA and NTU MMI occur in a similar late-March/April period. Keep assessment preparation and travel availability flexible.");
    if(names.includes("UK Medicine")&&names.includes("NUS Medicine"))
      flags.push("UK Medicine UCAS submission is typically much earlier than the Singapore Medicine assessment period. Build the UK application before the Singapore assessment season.");

    return {ok:true,entry,targets,tests,prep,flags,generatedAt:new Date().toISOString()};
  }

  function render(result,out){
    out.style.display="block";
    if(!result.ok){out.innerHTML="<b>"+esc(result.message)+"</b>";return;}
    const rows=result.targets.map(t=>'<tr><td><b>'+esc(t.name)+'</b><br><small>'+esc(t.country)+' · '+esc(t.route)+'</small></td><td>'+esc(t.application)+'</td><td><b>'+esc(t.test)+'</b></td><td>'+t.windows.map(w=>'<span class="datepill">'+esc(w.label)+': '+esc(w.start)+'–'+esc(w.end)+'</span>').join(" ")+'</td></tr>').join("");
    out.innerHTML='<h3>Application Combination Plan</h3>'+
      '<p style="color:#647084">Target Entry Year: <b>'+esc(result.entry)+'</b>. Dates shown here are planning windows; target-year university sources must be re-verified before submission.</p>'+
      '<div class="combo-table"><table><thead><tr><th>Pathway</th><th>Application Route</th><th>Assessment / Test</th><th>Planning Windows</th></tr></thead><tbody>'+rows+'</tbody></table></div>'+
      '<div class="pgrid" style="margin-top:18px">'+
      '<div class="pbox"><h3>Shared Preparation</h3><ul>'+result.prep.map(x=>'<li>'+esc(x)+'</li>').join("")+'</ul></div>'+
      '<div class="pbox"><h3>Coordination Alerts</h3><ul>'+result.flags.map(x=>'<li>'+esc(x)+'</li>').join("")+'</ul></div></div>'+
      '<p style="font-size:12px;color:#7b8495">This tool identifies preparation and timing relationships. It does not rank applications or predict admission outcomes.</p>';
    try{localStorage.setItem("APLUS_APPLICATION_COMBINATION",JSON.stringify(result));}catch(e){}
  }

  function run(){
    const result=build();
    render(result,document.getElementById("applicationCombinationResult"));
  }

  function inject(){
    const target=document.getElementById("combination");
    if(!target||document.getElementById("applicationCombinationV2"))return;
    const box=document.createElement("div");
    box.id="applicationCombinationV2";
    box.className="combo";
    box.style.marginTop="22px";
    box.innerHTML='<div class="section-title" style="text-align:left;margin-bottom:18px"><div class="eyebrow" style="color:#2563eb">APPLICATION COMBINATION ENGINE · V2</div><h2 style="font-size:28px">Coordinate multiple application pathways</h2><p>Compare application routes, assessment requirements, preparation overlaps and timing relationships in one planning view.</p></div>'+
      '<div class="combo-controls"><div><label>Target Entry Year</label><div id="acEntryInherited" style="padding:13px 14px;border:1px solid #dbe1eb;border-radius:11px;background:#f8fbff;font-weight:800;color:#3157ff">Inherited from Diagnostic 01</div></div><div><label>Application Pathways</label><div style="padding:12px;border:1px solid #dbe1eb;border-radius:11px;background:#f8fbff"><label><input class="acChoice" type="checkbox" value="NUS Medicine" checked> NUS Medicine</label><label><input class="acChoice" type="checkbox" value="NTU Medicine" checked> NTU Medicine</label><label><input class="acChoice" type="checkbox" value="UK Medicine"> UK Medicine</label></div></div></div>'+
      '<button class="next" onclick="APLUS_RUN_APPLICATION_COMBINATION()">Build Application Combination →</button><div id="applicationCombinationResult" class="result"></div>';
    target.appendChild(box);
  }
  window.APLUS_APPLICATION_COMBINATION={build,run,render};
  window.APLUS_RUN_APPLICATION_COMBINATION=run;
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",inject);else inject();
})();