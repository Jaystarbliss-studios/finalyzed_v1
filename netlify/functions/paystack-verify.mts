import type { Config } from "@netlify/functions";
import { createClient } from "@supabase/supabase-js";
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const paystackSecret = process.env.PAYSTACK_SECRET_KEY;
const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{"content-type":"application/json","cache-control":"no-store"}});
export default async (req: Request) => {
 if(req.method!=="POST") return json({error:"Method not allowed"},405);
 if(!supabaseUrl||!supabaseAnonKey||!paystackSecret) return json({error:"Payment service is not configured on the server."},500);
 const auth=req.headers.get("authorization")||""; const token=auth.startsWith("Bearer ")?auth.slice(7):"";
 if(!token) return json({error:"Authentication required."},401);
 const client=createClient(supabaseUrl,supabaseAnonKey,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false},global:{headers:{Authorization:`Bearer ${token}`}}});
 const {data:{user},error:userError}=await client.auth.getUser(token);
 if(userError||!user) return json({error:"Invalid or expired session."},401);
 let body:any; try{body=await req.json()}catch{return json({error:"Invalid JSON body."},400)}
 const reference=String(body?.reference||"").trim(); const projectId=String(body?.projectId||"").trim();
 if(!reference||!projectId) return json({error:"Payment reference and project are required."},400);
 const {data:project,error:projectError}=await client.from("projects").select("id,student_id,price_ngn,status").eq("id",projectId).eq("student_id",user.id).maybeSingle();
 if(projectError||!project) return json({error:"Project not found or not owned by this account."},404);
 if(!["payment_pending","draft"].includes(project.status)){const {data:existing}=await client.from("payments").select("id,reference,status,amount_ngn").eq("project_id",projectId).eq("reference",reference).maybeSingle(); if(existing?.status==="completed") return json({ok:true,payment:existing,alreadyProcessed:true}); return json({error:"This project is no longer awaiting payment."},409);}
 const paystackResponse=await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,{headers:{Authorization:`Bearer ${paystackSecret}`}});
 const paystack=await paystackResponse.json().catch(()=>null);
 if(!paystackResponse.ok||!paystack?.status||paystack?.data?.status!=="success") return json({error:paystack?.message||"Paystack could not verify this transaction."},402);
 const amountNgn=Math.round(Number(paystack.data.amount||0)/100); if(amountNgn!==Number(project.price_ngn)) return json({error:"Verified payment amount does not match the project price."},409);
 const {data:payment,error}=await client.rpc("record_verified_project_payment",{p_project_id:projectId,p_student_id:user.id,p_reference:reference,p_amount_ngn:amountNgn,p_metadata:{paystack_transaction_id:paystack.data.id,channel:paystack.data.channel,paid_at:paystack.data.paid_at,currency:paystack.data.currency}});
 if(error) return json({error:error.message},400); return json({ok:true,payment});
};
export const config:Config={path:"/api/paystack/verify",method:["POST"]};