import type { Config } from "@netlify/functions";
import crypto from "node:crypto";
import { createClient } from "@supabase/supabase-js";
const secret=process.env.PAYSTACK_SECRET_KEY;
const url=process.env.SUPABASE_URL||process.env.VITE_SUPABASE_URL;
const serviceKey=process.env.SUPABASE_SERVICE_ROLE_KEY;
const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{"content-type":"application/json"}});
export default async(req:Request)=>{
 if(req.method!=="POST") return json({error:"Method not allowed"},405);
 if(!secret||!url||!serviceKey) return json({error:"Webhook service is not configured."},500);
 const raw=await req.text(); const signature=req.headers.get("x-paystack-signature")||"";
 const expected=crypto.createHmac("sha512",secret).update(raw).digest("hex");
 if(!signature||!crypto.timingSafeEqual(Buffer.from(expected),Buffer.from(signature))) return json({error:"Invalid signature"},401);
 let event:any; try{event=JSON.parse(raw)}catch{return json({error:"Invalid JSON"},400)}
 if(event?.event!=="charge.success") return json({received:true});
 const data=event.data||{}; const metadata=data.metadata||{};
 const projectId=metadata.projectId||metadata.project_id; const studentId=metadata.studentId||metadata.student_id;
 if(!projectId||!studentId||!data.reference) return json({received:true,ignored:"missing project metadata"});
 const amountNgn=Math.round(Number(data.amount||0)/100);
 const admin=createClient(url,serviceKey,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}});
 const {error}=await admin.rpc("record_webhook_project_payment",{p_project_id:projectId,p_student_id:studentId,p_reference:String(data.reference),p_amount_ngn:amountNgn,p_metadata:{source:"paystack_webhook",paystack_transaction_id:data.id,channel:data.channel,paid_at:data.paid_at,currency:data.currency}});
 if(error) return json({error:error.message},400);
 return json({received:true});
};
export const config:Config={path:"/api/paystack/webhook",method:["POST"]};