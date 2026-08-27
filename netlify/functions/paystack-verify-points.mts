import type { Config } from "@netlify/functions";
import { createClient } from "@supabase/supabase-js";
const supabaseUrl=process.env.SUPABASE_URL||process.env.VITE_SUPABASE_URL;
const supabaseAnonKey=process.env.SUPABASE_ANON_KEY||process.env.VITE_SUPABASE_ANON_KEY;
const paystackSecret=process.env.PAYSTACK_SECRET_KEY;
const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{"content-type":"application/json","cache-control":"no-store"}});
export default async (req:Request)=>{
 if(req.method!=="POST") return json({error:"Method not allowed"},405);
 if(!supabaseUrl||!supabaseAnonKey||!paystackSecret) return json({error:"Payment service is not configured on the server."},500);
 const auth=req.headers.get("authorization")||""; const token=auth.startsWith("Bearer ")?auth.slice(7):""; if(!token) return json({error:"Authentication required."},401);
 const client=createClient(supabaseUrl,supabaseAnonKey,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false},global:{headers:{Authorization:`Bearer ${token}`}}});
 const {data:{user},error:userError}=await client.auth.getUser(token); if(userError||!user) return json({error:"Invalid or expired session."},401);
 let body:any; try{body=await req.json()}catch{return json({error:"Invalid JSON body."},400)}
 const points=Number(body?.points); const reference=String(body?.reference||"").trim();
 if(!Number.isInteger(points)||points<=0||!reference) return json({error:"Valid points and payment reference are required."},400);
 const paystackResponse=await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,{headers:{Authorization:`Bearer ${paystackSecret}`}});
 const paystack=await paystackResponse.json().catch(()=>null); if(!paystackResponse.ok||!paystack?.status||paystack?.data?.status!=="success") return json({error:paystack?.message||"Paystack could not verify this transaction."},402);
 const amountNgn=Math.round(Number(paystack.data.amount||0)/100); if(amountNgn!==points*10) return json({error:"Verified payment amount does not match the requested points."},409);
 const {data:wallet,error}=await client.rpc("credit_purchased_points",{p_user_id:user.id,p_points:points,p_amount_ngn:amountNgn,p_reference:reference});
 if(error) return json({error:error.message},400); return json({ok:true,wallet});
};
export const config:Config={path:"/api/paystack/verify-points",method:["POST"]};