-- Finalyzed demo controls: reusable Lagos City Polytechnic test templates + admin manual wallet transfers.
-- Demo seed is intentionally idempotent and uses role/name lookups instead of hard-coded UUIDs.

create or replace function public.admin_manual_wallet_transfer(
  p_recipient_id uuid,
  p_asset text,
  p_amount bigint,
  p_note text default 'Manual administrator wallet adjustment'
)
returns jsonb
language plpgsql
security definer
set search_path=public
as $$
declare
  actor public.profiles;
  recipient public.profiles;
  admin_wallet public.wallets;
  recipient_wallet public.wallets;
  ref text := 'ADMIN-MANUAL-'||replace(gen_random_uuid()::text,'-','');
  normalized_asset text := lower(trim(p_asset));
begin
  select * into actor from public.profiles where id=auth.uid();
  if actor.role<>'admin' or actor.account_status<>'approved' or coalesce(actor.access_state,'active')<>'active' then raise exception 'ADMIN_REQUIRED'; end if;
  if p_recipient_id is null or p_recipient_id=auth.uid() then raise exception 'INVALID_RECIPIENT'; end if;
  if p_amount<=0 then raise exception 'AMOUNT_MUST_BE_POSITIVE'; end if;
  if normalized_asset not in ('cash','points') then raise exception 'INVALID_ASSET'; end if;

  select * into recipient from public.profiles where id=p_recipient_id;
  if recipient.id is null or recipient.role not in ('writer','editor') or recipient.account_status<>'approved' or coalesce(recipient.access_state,'active')<>'active' then raise exception 'RECIPIENT_MUST_BE_AN_ACTIVE_APPROVED_SPECIALIST'; end if;

  select * into admin_wallet from public.wallets where user_id=auth.uid() for update;
  if admin_wallet.user_id is null then
    insert into public.wallets(user_id,balance_ngn,points_balance) values(auth.uid(),0,0) returning * into admin_wallet;
  end if;
  if normalized_asset='cash' and admin_wallet.balance_ngn<p_amount then raise exception 'INSUFFICIENT_ADMIN_CASH'; end if;
  if normalized_asset='points' and admin_wallet.points_balance<p_amount then raise exception 'INSUFFICIENT_ADMIN_POINTS'; end if;

  insert into public.wallets(user_id,balance_ngn,points_balance) values(recipient.id,0,0) on conflict(user_id) do nothing;
  select * into recipient_wallet from public.wallets where user_id=recipient.id for update;

  if normalized_asset='cash' then
    update public.wallets set balance_ngn=balance_ngn-p_amount,updated_at=now() where user_id=auth.uid();
    update public.wallets set balance_ngn=balance_ngn+p_amount,updated_at=now() where user_id=recipient.id;
    insert into public.wallet_transactions(user_id,transaction_type,amount_ngn,points,reference,metadata)
    values(auth.uid(),'admin_manual_transfer_debit',-p_amount,0,ref,jsonb_build_object('recipient_id',recipient.id,'recipient_name',recipient.full_name,'note',p_note,'demo_or_production_manual_adjustment',true));
    insert into public.wallet_transactions(user_id,transaction_type,amount_ngn,points,reference,metadata)
    values(recipient.id,'admin_manual_transfer_credit',p_amount,0,ref||'-CREDIT',jsonb_build_object('admin_id',auth.uid(),'admin_name',actor.full_name,'note',p_note,'demo_or_production_manual_adjustment',true));
  else
    update public.wallets set points_balance=points_balance-p_amount,updated_at=now() where user_id=auth.uid();
    update public.wallets set points_balance=points_balance+p_amount,updated_at=now() where user_id=recipient.id;
    insert into public.wallet_transactions(user_id,transaction_type,amount_ngn,points,reference,metadata)
    values(auth.uid(),'admin_manual_points_debit',0,-p_amount,ref,jsonb_build_object('recipient_id',recipient.id,'recipient_name',recipient.full_name,'note',p_note,'demo_or_production_manual_adjustment',true));
    insert into public.wallet_transactions(user_id,transaction_type,amount_ngn,points,reference,metadata)
    values(recipient.id,'admin_manual_points_credit',0,p_amount,ref||'-CREDIT',jsonb_build_object('admin_id',auth.uid(),'admin_name',actor.full_name,'note',p_note,'demo_or_production_manual_adjustment',true));
  end if;

  insert into public.audit_logs(actor_id,action,entity_type,entity_id,metadata)
  values(auth.uid(),'ADMIN_MANUAL_WALLET_TRANSFER','wallet',recipient.id,jsonb_build_object('asset',normalized_asset,'amount',p_amount,'recipient_id',recipient.id,'note',p_note,'reference',ref));

  return jsonb_build_object('reference',ref,'recipient_id',recipient.id,'asset',normalized_asset,'amount',p_amount);
end;
$$;
grant execute on function public.admin_manual_wallet_transfer(uuid,text,bigint,text) to authenticated;

-- Idempotent demo funding for the first approved administrator. The funds are deliberately
-- represented as wallet credits so testers can spend/transfer them and see ledger entries.
do $$
declare admin_id uuid; ref text:='DEMO-ADMIN-FUND-20260829';
begin
  select id into admin_id from public.profiles where role='admin' and account_status='approved' and coalesce(access_state,'active')='active' order by created_at asc limit 1;
  if admin_id is not null and not exists(select 1 from public.wallet_transactions where reference=ref) then
    insert into public.wallets(user_id,balance_ngn,points_balance) values(admin_id,5000000,500000) on conflict(user_id) do update set balance_ngn=public.wallets.balance_ngn+5000000,points_balance=public.wallets.points_balance+500000,updated_at=now();
    insert into public.wallet_transactions(user_id,transaction_type,amount_ngn,points,reference,metadata)
    values(admin_id,'demo_fund_credit',5000000,500000,ref,jsonb_build_object('demo',true,'purpose','Finalyzed tester wallet','cash_ngn',5000000,'points',500000));
  end if;
end $$;

-- Three clearly labelled tester templates. These use common academic project conventions,
-- not a claim that they are an official Lagos City Polytechnic handbook.
do $$
declare inst uuid; admin_id uuid;
  schema jsonb := jsonb_build_array(
    jsonb_build_object('title','Student Information','description','Academic identity and submission context.','fields',jsonb_build_array(
      jsonb_build_object('key','fullName','label','Full name','type','text','required',true),jsonb_build_object('key','matricNumber','label','Matriculation / registration number','type','text','required',true),jsonb_build_object('key','institution','label','Institution','type','select','required',true),jsonb_build_object('key','faculty','label','Faculty / school','type','text','required',true),jsonb_build_object('key','department','label','Department','type','text','required',true),jsonb_build_object('key','degree','label','Degree / award','type','select','required',true,'options',jsonb_build_array('ND','HND','Other')),jsonb_build_object('key','supervisor','label','Project supervisor','type','text'),jsonb_build_object('key','submissionMonth','label','Submission month','type','select','options',jsonb_build_array('January','February','March','April','May','June','July','August','September','October','November','December')),jsonb_build_object('key','submissionYear','label','Submission year','type','select','options',jsonb_build_array('2026','2027','2028','2029','2030')))),
    jsonb_build_object('title','Project Identity','description','Define the approved project and intended deliverable.','fields',jsonb_build_array(jsonb_build_object('key','projectTitle','label','Exact approved project title','type','text','required',true),jsonb_build_object('key','projectType','label','Project type','type','select','required',true,'options',jsonb_build_array('Research Study','Software Development','Design & Construction','Case Study','Business Plan','Other')),jsonb_build_object('key','subjectArea','label','Core subject matter / technology','type','text'),jsonb_build_object('key','problemStatement','label','Problem being addressed','type','textarea'),jsonb_build_object('key','aimObjectives','label','Aim and objectives','type','textarea'),jsonb_build_object('key','expectedOutcome','label','Expected outcome','type','textarea'),jsonb_build_object('key','topicApproved','label','Topic officially approved?','type','checkbox'))),
    jsonb_build_object('title','Institution Requirements','description','Department and school-specific rules.','fields',jsonb_build_array(jsonb_build_object('key','hasPrescribedFormat','label','Prescribed project format?','type','select','options',jsonb_build_array('Yes','No','Unknown')),jsonb_build_object('key','preliminaryPages','label','Required preliminary pages','type','textarea'),jsonb_build_object('key','institutionStructure','label','Required chapter structure','type','textarea'),jsonb_build_object('key','standardsBodies','label','Relevant standards / regulatory bodies','type','textarea'))),
    jsonb_build_object('title','Formatting','description','Formatting rules for the final document.','fields',jsonb_build_array(jsonb_build_object('key','fontFamily','label','Font family','type','select','options',jsonb_build_array('Times New Roman','Arial','Calibri','Institution Standard')),jsonb_build_object('key','bodyFontSize','label','Body font size (pt)','type','select','options',jsonb_build_array('11','12','13','14')),jsonb_build_object('key','lineSpacing','label','Line spacing','type','select','options',jsonb_build_array('1.0','1.15','1.5','2.0','Institution Standard')),jsonb_build_object('key','alignment','label','Body alignment','type','select','options',jsonb_build_array('Justified','Left','Institution Standard')),jsonb_build_object('key','marginLeft','label','Left margin (inch)','type','select','options',jsonb_build_array('1','1.25','1.5')),jsonb_build_object('key','marginRight','label','Right margin (inch)','type','select','options',jsonb_build_array('1','1.25','1.5')),jsonb_build_object('key','marginTop','label','Top margin (inch)','type','select','options',jsonb_build_array('1','1.25','1.5')),jsonb_build_object('key','marginBottom','label','Bottom margin (inch)','type','select','options',jsonb_build_array('1','1.25','1.5')),jsonb_build_object('key','preliminaryNumbering','label','Preliminary numbering','type','select','options',jsonb_build_array('Roman numerals','Arabic numerals','Institution Standard')),jsonb_build_object('key','chapterNumbering','label','Chapter numbering','type','select','options',jsonb_build_array('Arabic numerals','Institution Standard')))),
    jsonb_build_object('title','Page & Length','description','Set the expected document length.','fields',jsonb_build_array(jsonb_build_object('key','minPages','label','Minimum pages','type','number'),jsonb_build_object('key','targetPages','label','Target pages','type','number','required',true),jsonb_build_object('key','maxPages','label','Maximum pages','type','number'),jsonb_build_object('key','countPrelim','label','Count preliminary pages?','type','checkbox'),jsonb_build_object('key','countReferences','label','Count references?','type','checkbox'))),
    jsonb_build_object('title','Structure','description','Chapter architecture and mandatory sections.','fields',jsonb_build_array(jsonb_build_object('key','chapterCount','label','Number of chapters','type','select','options',jsonb_build_array('3','4','5','6','7')),jsonb_build_object('key','mandatorySubsections','label','Mandatory sections / subsections','type','textarea'))),
    jsonb_build_object('title','Citation & References','description','Source and citation rules.','fields',jsonb_build_array(jsonb_build_object('key','citationStyle','label','Citation style','type','select','required',true,'options',jsonb_build_array('APA 7th','IEEE','Harvard','MLA','Vancouver','Institution Standard')),jsonb_build_object('key','minReferences','label','Minimum references','type','number'),jsonb_build_object('key','sourceRequirements','label','Source requirements','type','textarea'))),
    jsonb_build_object('title','Methodology / Design','description','How the work will be conducted, built or analysed.','fields',jsonb_build_array(jsonb_build_object('key','methodology','label','Methodology / design approach','type','textarea','required',true),jsonb_build_object('key','technologies','label','Required technologies / tools','type','text'),jsonb_build_object('key','scope','label','Scope / population / system boundary','type','textarea'),jsonb_build_object('key','dataCollectionMethod','label','Data collection method','type','textarea'),jsonb_build_object('key','analysisMethod','label','Analysis / testing method','type','textarea'))),
    jsonb_build_object('title','Data & Results','description','Expected evidence, outputs and validation.','fields',jsonb_build_array(jsonb_build_object('key','hasRealData','label','Real project data available?','type','select','options',jsonb_build_array('Yes','No','Partial')),jsonb_build_object('key','availableData','label','Available data / results','type','textarea'),jsonb_build_object('key','resultRequirements','label','Expected tables, charts, diagrams or drawings','type','textarea'),jsonb_build_object('key','testingRequirements','label','Testing / validation requirements','type','textarea'))),
    jsonb_build_object('title','Appendices','description','Supporting material.','fields',jsonb_build_array(jsonb_build_object('key','appendices','label','Appendices required','type','multiselect','options',jsonb_build_array('Questionnaire','Interview Questions','Test Log','Bill of Materials','Budget','Code Listing','Technical Drawings','Reference Tables')),jsonb_build_object('key','otherAppendices','label','Other appendices','type','text'))),
    jsonb_build_object('title','Presentation','description','Final defence/presentation requirements.','fields',jsonb_build_array(jsonb_build_object('key','presentationRequired','label','Presentation required?','type','checkbox'),jsonb_build_object('key','slideCount','label','Expected slide count','type','select','options',jsonb_build_array('10–15','15–20','20–25','25–30')),jsonb_build_object('key','presentationStyle','label','Presentation style','type','select','options',jsonb_build_array('Academic defence','Institution template','Minimal professional')),jsonb_build_object('key','presentationGuideRequired','label','Simplified presentation guide required?','type','checkbox'))),
    jsonb_build_object('title','Special Instructions','description','Anything else the writer must know.','fields',jsonb_build_array(jsonb_build_object('key','specialInstructions','label','Special instructions','type','textarea'),jsonb_build_object('key','doNotChange','label','Things the writer must NOT change','type','textarea'),jsonb_build_object('key','otherNotes','label','Supervisor / department notes','type','textarea')))
  );
begin
  select id into inst from public.institutions where lower(name)='lagos city polytechnic' limit 1;
  select id into admin_id from public.profiles where role='admin' and account_status='approved' order by created_at asc limit 1;
  if inst is null then raise exception 'Lagos City Polytechnic institution record is required before demo template seeding'; end if;
  insert into public.institution_templates(institution_id,name,description,specification_defaults,specification_schema,verified,created_by,is_student_derived)
  select inst,'Lagos City Polytechnic — HND Business Administration Research','Tester guide: common HND business/research project specification defaults. Demo template; verify against the student handbook before production use.',jsonb_build_object('degree','HND','projectType','Research Study','citationStyle','APA 7th','fontFamily','Times New Roman','bodyFontSize','12','lineSpacing','2.0','alignment','Justified','marginLeft','1.5','marginRight','1','marginTop','1','marginBottom','1','chapterCount','5','targetPages','60'),schema,true,admin_id,false
  where not exists(select 1 from public.institution_templates where institution_id=inst and name='Lagos City Polytechnic — HND Business Administration Research');
  insert into public.institution_templates(institution_id,name,description,specification_defaults,specification_schema,verified,created_by,is_student_derived)
  select inst,'Lagos City Polytechnic — HND Computer Science Software Project','Tester guide: common HND software-development project specification defaults for a Finalyzed demo.',jsonb_build_object('degree','HND','projectType','Software Development','citationStyle','IEEE','fontFamily','Times New Roman','bodyFontSize','12','lineSpacing','1.5','alignment','Justified','marginLeft','1.5','marginRight','1','marginTop','1','marginBottom','1','chapterCount','5','targetPages','70','technologies','HTML, CSS, JavaScript, relational database'),schema,true,admin_id,false
  where not exists(select 1 from public.institution_templates where institution_id=inst and name='Lagos City Polytechnic — HND Computer Science Software Project');
  insert into public.institution_templates(institution_id,name,description,specification_defaults,specification_schema,verified,created_by,is_student_derived)
  select inst,'Lagos City Polytechnic — ND Electrical/Electronics Design Project','Tester guide: common ND engineering/design project specification defaults for a Finalyzed demo.',jsonb_build_object('degree','ND','projectType','Design & Construction','citationStyle','IEEE','fontFamily','Times New Roman','bodyFontSize','12','lineSpacing','1.5','alignment','Justified','marginLeft','1.5','marginRight','1','marginTop','1','marginBottom','1','chapterCount','5','targetPages','50','technologies','Circuit simulation, measurement and technical drawing tools'),schema,true,admin_id,false
  where not exists(select 1 from public.institution_templates where institution_id=inst and name='Lagos City Polytechnic — ND Electrical/Electronics Design Project');
end $$;
