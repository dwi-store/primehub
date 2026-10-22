import { createClient } from "npm:@supabase/supabase-js@2";
const allowedOrigins = new Set(["https://dwi-store.github.io", "http://localhost:3000"]);
function reply(req: Request, body: unknown, status = 200) {
 const origin=req.headers.get("origin"), headers=new Headers({"Content-Type":"application/json; charset=utf-8","Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type","Access-Control-Allow-Methods":"POST, OPTIONS","Access-Control-Max-Age":"86400","Vary":"Origin"});
 if(origin&&allowedOrigins.has(origin))headers.set("Access-Control-Allow-Origin",origin);
 return new Response(JSON.stringify(body),{status,headers});
}
Deno.serve(async(req:Request)=>{
 const origin=req.headers.get("origin");
 if(origin&&!allowedOrigins.has(origin))return reply(req,{error:"Origin tidak diizinkan"},403);
 if(req.method==="OPTIONS")return new Response(null,{status:204,headers:{"Access-Control-Allow-Origin":origin&&allowedOrigins.has(origin)?origin:"","Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type","Access-Control-Allow-Methods":"POST, OPTIONS","Vary":"Origin"}});
 if(req.method!=="POST")return reply(req,{error:"Method tidak diizinkan"},405);
 const supabaseUrl=Deno.env.get("SUPABASE_URL"),serviceKey=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"),serverKey=Deno.env.get("MIDTRANS_SERVER_KEY")?.trim();
 if(!supabaseUrl||!serviceKey)return reply(req,{error:"Backend belum dikonfigurasi"},503);
 if(!serverKey)return reply(req,{error:"Pembayaran otomatis belum diaktifkan. Pesanan sudah tercatat; simpan kode pesanan dan hubungi admin untuk instruksi pembayaran.",code:"PAYMENT_GATEWAY_NOT_CONFIGURED"},503);
 let body:Record<string,unknown>;
 try{const raw=await req.text();if(raw.length>8192)return reply(req,{error:"Permintaan terlalu besar"},413);const parsed:unknown=JSON.parse(raw);if(!parsed||typeof parsed!=="object"||Array.isArray(parsed))throw new Error();body=parsed as Record<string,unknown>;}catch{return reply(req,{error:"JSON tidak valid"},400);}
 const orderCode=typeof body.order_code==="string"?body.order_code.trim():"",contact=typeof body.customer_contact==="string"?body.customer_contact.trim():"";
 if(!/^PH-[A-F0-9]{10}$/.test(orderCode)||contact.length<3||contact.length>160)return reply(req,{error:"Kode pesanan atau kontak tidak valid"},400);
 const admin=createClient(supabaseUrl,serviceKey,{auth:{persistSession:false}});
 const {data:order,error:orderError}=await admin.from("orders").select("id,order_code,customer_name,customer_contact,total_idr,payment_status,order_status").eq("order_code",orderCode).maybeSingle();
 if(orderError){console.error("Order lookup failed:",orderError.message);return reply(req,{error:"Pesanan belum dapat diverifikasi"},503);}
 if(!order||order.customer_contact!==contact)return reply(req,{error:"Pesanan tidak ditemukan. Periksa kode dan kontak."},404);
 if(order.payment_status!=="pending"||order.order_status!=="pending_payment")return reply(req,{error:"Pesanan ini tidak lagi menunggu pembayaran"},409);
 if(!Number.isSafeInteger(Number(order.total_idr))||Number(order.total_idr)<1)return reply(req,{error:"Total pesanan tidak valid untuk pembayaran"},400);
 const production=Deno.env.get("MIDTRANS_IS_PRODUCTION")==="true",endpoint=production?"https://app.midtrans.com/snap/v1/transactions":"https://app.sandbox.midtrans.com/snap/v1/transactions";
 try{
  const response=await fetch(endpoint,{method:"POST",headers:{Authorization:"Basic "+btoa(serverKey+":"),"Content-Type":"application/json",Accept:"application/json"},body:JSON.stringify({transaction_details:{order_id:order.order_code,gross_amount:Number(order.total_idr)},customer_details:{first_name:String(order.customer_name).slice(0,50),phone:String(order.customer_contact).replace(/[^+0-9]/g,"").slice(0,20)||undefined},callbacks:{finish:"https://dwi-store.github.io/upprime/"}}),signal:AbortSignal.timeout(10000)});
  const result=await response.json().catch(()=>({}));
  if(!response.ok||typeof result.redirect_url!=="string"||typeof result.token!=="string"){console.error("Midtrans Snap create failed:",response.status,String(result.error_messages?.[0]??"unknown"));return reply(req,{error:"Tagihan belum berhasil dibuat. Pesanan tetap tercatat; hubungi admin dengan kode pesanan."},502);}
  const {error:updateError}=await admin.from("orders").update({payment_method:"midtrans_snap",payment_reference:result.token,updated_at:new Date().toISOString()}).eq("id",order.id).eq("payment_status","pending");
  if(updateError){console.error("Could not save payment reference:",updateError.message);return reply(req,{error:"Tagihan dibuat tetapi belum dapat ditautkan ke pesanan. Hubungi admin sebelum membayar."},503);}
  return reply(req,{payment:{redirect_url:result.redirect_url,token:result.token,environment:production?"production":"sandbox"}});
 }catch(error){console.error("Midtrans request failed:",error instanceof Error?error.name:"unknown");return reply(req,{error:"Penyedia pembayaran sedang tidak dapat dihubungi. Hubungi admin dengan kode pesanan."},502);}
});
