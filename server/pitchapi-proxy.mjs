/** Stateless BYOK relay. Never log, persist, or cache credentials/responses. */
const ORIGINS = new Set(['https://zaidtacticsboard.com','https://www.zaidtacticsboard.com']);
export function allowedPath(path) {
  if(typeof path!=='string'||path.length>200)return false;
  if(path==='/v1/leagues')return true;
  if(/^\/v1\/matches\/m_[a-zA-Z0-9]{6}\/(players|advanced\/players|lineups|shots|heatmaps)$/.test(path))return true;
  return /^\/v1\/leagues\/l_[a-zA-Z0-9]{6}\/matches\?season=\d{4}(?:%2F\d{4})?$/.test(path);
}
export async function proxyPitchApi(request, env={}, upstreamFetch=fetch) {
  const origin=request.headers.get('origin')??'';
  const allowed=ORIGINS.has(origin)||(env.ALLOW_LOCALHOST==='true'&&/^http:\/\/(127\.0\.0\.1|localhost):\d+$/.test(origin));
  const headers={'Content-Type':'application/json','Cache-Control':'no-store','Vary':'Origin','Access-Control-Allow-Origin':allowed?origin:'null','Access-Control-Allow-Methods':'POST, OPTIONS','Access-Control-Allow-Headers':'Content-Type, X-PitchAPI-Key'};
  const reply=(data,status)=>new Response(JSON.stringify(data),{status,headers});
  if(!allowed)return reply({error:{message:'This origin is not allowed.'}},403);
  if(request.method==='OPTIONS')return new Response(null,{status:204,headers});
  if(request.method!=='POST')return reply({error:{message:'Use POST.'}},405);
  const key=request.headers.get('x-pitchapi-key');
  if(!key || !/^pk_(test|live)_[A-Za-z0-9_-]{16,200}$/.test(key))return reply({error:{message:'Enter a valid PitchAPI key.'}},401);
  let body;
  try{const text=await request.text();if(text.length>512)return reply({error:{message:'Request too large.'}},413);body=JSON.parse(text);}catch{return reply({error:{message:'Invalid request.'}},400);}
  if(!body || !allowedPath(body.path))return reply({error:{message:'Unsupported data request.'}},400);
  try {
    // Workers does not implement redirect:'error'. Manual mode keeps keys on
    // the fixed provider host; reject every redirect without following it.
    const response=await upstreamFetch('https://api.pitchapi.dev'+body.path,{headers:{'X-API-KEY':key,Accept:'application/json'},signal:AbortSignal.any([request.signal,AbortSignal.timeout(25000)]),redirect:'manual'});
    if(response.status>=300&&response.status<400)return reply({error:{code:'UPSTREAM_REDIRECT_BLOCKED',message:'PitchAPI returned an unexpected redirect. Please try again.'}},502);
    if(!response.ok) {
      let error;try{error=(await response.json()).error;}catch{}
      const code=['ANALYTICS_UNAVAILABLE','RESOURCE_NOT_FOUND','RATE_LIMIT_EXCEEDED'].includes(error?.code)?error.code:undefined;
      const message=response.status===401||response.status===403?'PitchAPI did not accept this key. Check your key and account access.':response.status===429?'PitchAPI is busy. Please wait and try again.':response.status===404?'Data is unavailable for this match.':'PitchAPI could not complete the request. Please try again.';
      return reply({error:{code,message}},response.status);
    }
    const data=await response.json();
    if(!Object.hasOwn(data,'data'))return reply({error:{message:'Unexpected PitchAPI response.'}},502);
    return reply({data:data.data},200);
  }catch{return reply({error:{message:'Could not reach PitchAPI. Check your connection and try again.'}},502);}
}
export default {fetch(request, env) { return proxyPitchApi(request, env); }};
