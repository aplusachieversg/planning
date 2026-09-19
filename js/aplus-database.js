/* APLUS DATABASE CONNECTOR v1.0
   Central submission storage for APLUS Academic Planner.
   Configure Supabase URL + anon key here after creating the project.
*/
(function(){
  const CONFIG = window.APLUS_DB_CONFIG || {
    url: "YOUR_SUPABASE_PROJECT_URL",
    anonKey: "YOUR_SUPABASE_ANON_KEY"
  };
  window.APLUS_DB_CONFIG = CONFIG;
  const ready = !!CONFIG.url && !!CONFIG.anonKey &&
    CONFIG.url.indexOf("YOUR_") !== 0 && CONFIG.anonKey.indexOf("YOUR_") !== 0;

  function client(){
    if(!ready || !window.supabase) return null;
    if(!window.__APLUS_SUPABASE) window.__APLUS_SUPABASE = window.supabase.createClient(CONFIG.url, CONFIG.anonKey);
    return window.__APLUS_SUPABASE;
  }
  function clean(v){ return v == null ? "" : String(v); }

  async function submit(master, extra, gapAnalysis, roadmap){
    const sb=client();
    if(!sb) return {ok:false, code:"not_configured", message:"APLUS central database is not configured yet."};
    if(!extra || extra.consentGiven !== true) return {ok:false, code:"consent_required", message:"Consent is required before submission."};
    const payload={
      student_id:clean(master.studentId),
      student_name:clean(extra.studentName),
      parent_name:clean(extra.parentName),
      email:clean(extra.email),
      phone:clean(extra.phone),
      current_level:clean(master.profile.currentLevel),
      qualification:clean(master.profile.qualification),
      target_field:clean(master.target.field),
      target_university:clean(master.target.university),
      target_course:clean(master.target.course),
      entry_year:Number(master.target.entryYear)||null,
      academic_profile:clean(master.profile.academicProfile),
      subjects:master.profile.subjects||[],
      activities:master.evidence.activities||[],
      master_profile:master,
      gap_analysis:gapAnalysis||{},
      roadmap:roadmap||[],
      application_status:"New",
      scholarship_interest:!!master.target.scholarship,
      consent_given:true
    };
    const {data,error}=await sb.from("student_submissions").upsert(payload,{onConflict:"student_id"}).select("id,student_id,created_at,updated_at").single();
    if(error) return {ok:false,code:"db_error",message:error.message};
    return {ok:true,data};
  }
  async function list(filters){
    const sb=client();
    if(!sb) return {ok:false,code:"not_configured"};
    let q=sb.from("student_submissions").select("*").order("updated_at",{ascending:false});
    if(filters && filters.status) q=q.eq("application_status",filters.status);
    if(filters && filters.search){
      const s=filters.search.replace(/,/g," ");
      q=q.or("student_name.ilike.%"+s+"%,student_id.ilike.%"+s+"%,target_university.ilike.%"+s+"%,target_course.ilike.%"+s+"%");
    }
    const {data,error}=await q;
    if(error) return {ok:false,code:"db_error",message:error.message};
    return {ok:true,data:data||[]};
  }
  async function get(id){
    const sb=client(); if(!sb) return {ok:false,code:"not_configured"};
    const {data,error}=await sb.from("student_submissions").select("*").eq("student_id",id).single();
    if(error) return {ok:false,code:"db_error",message:error.message};
    return {ok:true,data};
  }
  async function updateStatus(id,status){
    const sb=client(); if(!sb) return {ok:false,code:"not_configured"};
    const {data,error}=await sb.from("student_submissions").update({application_status:status}).eq("student_id",id).select("student_id,application_status,updated_at").single();
    if(error) return {ok:false,code:"db_error",message:error.message};
    return {ok:true,data};
  }
  async function signIn(email,password){
    const sb=client(); if(!sb) return {ok:false,code:"not_configured"};
    const {data,error}=await sb.auth.signInWithPassword({email,password});
    if(error) return {ok:false,code:"auth_error",message:error.message};
    return {ok:true,data};
  }
  async function signOut(){
    const sb=client(); if(sb) await sb.auth.signOut();
    return {ok:true};
  }
  window.APLUS_DATABASE={ready,submit,list,get,updateStatus,signIn,signOut};
})();