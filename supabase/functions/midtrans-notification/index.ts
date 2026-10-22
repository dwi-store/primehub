import { createClient } from "npm:@supabase/supabase-js@2";
function json(body:unknown,status=200){return new Response(JSON.stringify(body),{status,headers:{"Content-Type":"application/json; charset=utf-8"}});}
async function sha512Hex(value:string){const digest=await crypto.subtle.digest("SHA-512",new TextEncoder().encode(value));return Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,"0")).join("");}
Deno.serve(async(req:Request)=>{
 if(req.method!=="POST")return json({error:"Method not allowed"},405);
 const url=Deno.env.get("SUPABASE_URL"),serviceKey=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"),serverKey=Deno.env.get("MIDTRANS_SERVER_KEY")?.trim();
 if(!url||!serviceKey||!serverKey)return json({error:"Webhook is not configured"},503);
 let payload:Record<string,unknown>;
 try{const raw=await req.text();if(raw.length>16384)return json({error:"Payload too large"},413);const parsed:unknown=JSON.parse(raw);if(!parsed||typeof parsed!=="object"||Array.isArray(parsed))throw new Error();payload=parsed as Record<string,unknown>;}catch{return json({error:"Invalid JSON"},400);}
 const orderCode=String(payload.order_id??""),statusCode=String(payload.status_code??""),grossAmount=String(payload.gross_amount??""),signature=String(payload.signature_key??"").toLowerCase();
 if(!/^PH-[A-F0-9]{10}$/.test(orderCode)||!/^\d{3}$/.test(statusCode)||!/^\d+(\.\d{1,2})?$/.test(grossAmount)||!/^[a-f0-9]{128}$/.test(signature))return json({error:"Invalid notification fields"},400);
 if(await sha512Hex(orderCode+statusCode+grossAmount+serverKey)!==signature)return json({error:"Invalid signature"},401);
 const admin=createClient(url,serviceKey,{auth:{persistSession:false}}),production=Deno.env.get("MIDTRANS_IS_PRODUCTION")==="true";
 const statusEndpoint=(production?"https://api.midtrans.com/v2/":"https://api.sandbox.midtrans.com/v2/")+encodeURIComponent(orderCode)+"/status";
 try{
  const statusResponse=await fetch(statusEndpoint,{headers:{Authorization:"Basic "+btoa(serverKey+":"),Accept:"application/json"},signal:AbortSignal.timeout(10000)}),transaction=await statusResponse.json().catch(()=>({}));
  if(!statusResponse.ok||String(transaction.order_id)!==orderCode)return json({error:"Unable to verify transaction"},502);
  const {data:order,error:orderError}=await admin.from("orders").select("id,order_code,total_idr,payment_status,payment_method").eq("order_code",orderCode).maybeSingle();
  if(orderError)return json({error:"Order lookup failed"},503);if(!order)return json({error:"Order not found"},404);
  if(order.payment_method!=="midtrans_snap")return json({error:"Payment method mismatch"},409);
  if(Math.round(Number(transaction.gross_amount))!==Number(order.total_idr))return json({error:"Amount mismatch"},409);
  const state=String(transaction.transaction_status??""),fraud=String(transaction.fraud_status??"");
  let next:"pending"|"paid"|"failed"="pending";
  if(state==="settlement"||(state==="capture"&&fraud==="accept"))next="paid";
  else if(["deny","cancel","expire"].includes(state)||(state==="capture"&&fraud==="challenge"))next="failed";
  if(order.payment_status==="paid"&&next!=="paid")return json({ok:true,duplicate:true});
  if(order.payment_status!==next){const {error:updateError}=await admin.from("orders").update({payment_status:next,updated_at:new Date().toISOString()}).eq("id",order.id).eq("payment_method","midtrans_snap");if(updateError){console.error("Payment status update failed:",updateError.message);return json({error:"Payment status update failed"},503);}}
  return json({ok:true});
 }catch(error){console.error("Midtrans status verification failed:",error instanceof Error?error.name:"unknown");return json({error:"Verification temporarily unavailable"},502);}
});
