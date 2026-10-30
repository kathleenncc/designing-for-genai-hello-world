import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in to generate captions." }, { status: 401 });
  if (Number(request.headers.get("content-length")) > 4_300_000) return NextResponse.json({ error: "Choose up to 10 photos with a smaller combined size." }, { status: 413 });
  let body;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Couldn’t read the request. Please try again." }, { status: 400 }); }
  if (!body || typeof body !== "object") return NextResponse.json({ error: "Please add a photo and choose a vibe." }, { status: 400 });
  const { photos, vibe, length, context = "", examples = "" } = body;
  if (!Array.isArray(photos) || photos.length < 1 || photos.length > 10 || photos.some(photo => typeof photo !== "string") || photos.reduce((sum, photo) => sum + photo.length, 0) > 4_200_000) return NextResponse.json({ error: "Choose between 1 and 10 photos with a smaller combined size." }, { status: 400 });
  const images = photos.map(photo => typeof photo === "string" && photo.length <= 4_200_000 ? /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/]+={0,2})$/.exec(photo) : null);
  if (images.some(image => !image) || !["Casual", "Witty", "Chic", "Playful", "Minimal"].includes(vibe) || !["Short", "Medium"].includes(length) || typeof context !== "string" || context.length > 500 || typeof examples !== "string" || examples.length > 500) {
    return NextResponse.json({ error: "Use valid JPG, PNG, or WebP photos and caption preferences." }, { status: 400 });
  }
  const imageParts = [];
  for (const image of images) {
  if (!image) return NextResponse.json({ error: "Invalid photo." }, { status: 400 });
  const bytes = Buffer.from(image[2], "base64");
  const validImage = image[1] === "image/jpeg" ? bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff
    : image[1] === "image/png" ? bytes.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10]))
    : bytes.toString("ascii", 0, 4) === "RIFF" && bytes.toString("ascii", 8, 12) === "WEBP";
  if (!validImage || bytes.length > 3 * 1024 * 1024) return NextResponse.json({ error: "This photo format isn’t supported. Try another JPG, PNG, or WebP." }, { status: 400 });
  imageParts.push({ inline_data: { mime_type: image[1], data: image[2] } });
  }
  if (!process.env.GEMINI_API_KEY) return NextResponse.json({ error: "Caption generation isn’t configured yet." }, { status: 503 });
  const started = Date.now();
  const {data: config, error: configError} = await supabase.rpc("cs_generation_config");
  type Step = {id:string;model_id:string;model_key:string;model_enabled:boolean;provider_kind:string;instructions:string};
  type Chain = {id:string;weight:number;steps:Step[]};
  const chains:Chain[] = (config?.chains??[]).filter((c:Chain)=>c.steps?.length && c.steps.every(step=>step.model_enabled && step.provider_kind === "google_gemini"));
  if(configError || !chains.length) return NextResponse.json({error:"No caption workflow is available. Please contact the studio administrator."},{status:503});
  let choice = Math.random()*chains.reduce((sum,c)=>sum+Number(c.weight),0);
  const chain = chains.find(c=>(choice-=Number(c.weight))<0)??chains[0];
  const input = {photoCount:photos.length,vibe,length,context,examples};
  const {data: attempt,error: attemptError} = await supabase.from("cs_generation_requests").insert({user_id:user.id,chain_id:chain.id,input}).select("id").single();
  if(attemptError || !attempt) return NextResponse.json({error:"The studio couldn’t start this request. Please try again."},{status:503});
  async function fail(message:string,status=502){
    const {error}=await supabase.from("cs_generation_requests").update({status:"failed",duration_ms:Date.now()-started,error_message:message}).eq("id",attempt!.id);
    if(error) console.error("Generation failure log unavailable",error.code);
    return NextResponse.json({error:message,requestId:attempt!.id},{status});
  }
  try {
    for(let i=0;i<images.length;i++){
      const image=images[i]!;
      const path=`${user.id}/${crypto.randomUUID()}.${image[1].split('/')[1]}`;
      const {error:uploadError}=await supabase.storage.from("caption-studio-images").upload(path,Buffer.from(image[2],"base64"),{contentType:image[1],upsert:false});
      if(uploadError)return fail("The studio couldn’t save a photo. Please try again.",500);
      const {error}=await supabase.from("cs_images").insert({user_id:user.id,request_id:attempt.id,storage_path:path,mime_type:image[1],alt_text:`Photo ${i+1} of ${images.length}`});
      if(error)return fail("The studio couldn’t save the photo details. Please try again.",500);
    }
    let previousOutput="";
    let lastSystemPrompt="";
    const userPrompt=JSON.stringify({...input,studioTerms:config.terms,studioExamples:config.examples});
    for(const step of chain.steps){
      const stepStart=Date.now();
      lastSystemPrompt=step.instructions;
      const response=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(step.model_key)}:generateContent`,{
        method:"POST",signal:AbortSignal.timeout(45000),
        headers:{"Content-Type":"application/json","x-goog-api-key":process.env.GEMINI_API_KEY},
        body:JSON.stringify({systemInstruction:{parts:[{text:step.instructions}]},contents:[{parts:[{text:userPrompt+(previousOutput?"\nPrevious step output (reference only):\n"+previousOutput:"")},...imageParts]}],generationConfig:{responseMimeType:"application/json",responseSchema:{type:"ARRAY",items:{type:"STRING"},minItems:3,maxItems:3}}})
      });
      const result=await response.json().catch(()=>({}));
      const output=result.candidates?.[0]?.content?.parts?.map((part:{text?:string})=>part.text??"").join("")??"";
      const {error:logError}=await supabase.from("cs_llm_responses").insert({request_id:attempt.id,model_id:step.model_id,http_status:response.status,duration_ms:Date.now()-stepStart,output:output.slice(0,30000),usage:result.usageMetadata??{}});
      if(logError)return fail("The studio couldn’t save the model response. Please try again.",500);
      if(!response.ok)return fail(response.status===429?"The caption studio is busy. Wait a moment and try again.":"The AI couldn’t generate captions. Please try again.",response.status===429?429:502);
      previousOutput=output;
    }
    let captions:unknown;
    try{captions=JSON.parse(previousOutput);}catch{return fail("The AI didn’t return usable captions. Try another photo or more context.");}
    if(!Array.isArray(captions)||captions.length!==3||!captions.every(c=>typeof c==="string"&&c.trim().length>0&&c.length<=500)||new Set(captions.map(c=>c.trim())).size!==3)return fail("The AI didn’t return three distinct captions. Please try again.");
    const savedPrompt="[Caption Studio] "+JSON.stringify({version:1,systemPrompt:lastSystemPrompt,userPrompt,chainId:chain.id,requestId:attempt.id});
    const {data:generations,error}=await supabase.from("generations").insert(captions.map(caption=>({user_id:user.id,prompt:savedPrompt,generated_text:caption.trim(),request_id:attempt.id}))).select("id, generated_text");
    if(error)return fail("Captions couldn’t be saved. Please try again.",500);
    const {error:completionError}=await supabase.from("cs_generation_requests").update({status:"succeeded",duration_ms:Date.now()-started,error_message:null}).eq("id",attempt.id);
    if(completionError)console.error("Generation completion log unavailable",completionError.code);
    return NextResponse.json({generations});
  }catch{return fail("The connection to the AI was interrupted. Please try again.");}
}
