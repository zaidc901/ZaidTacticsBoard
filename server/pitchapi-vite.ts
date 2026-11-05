import type { Plugin } from 'vite';
// The same relay is used locally and in the deployment worker.
// @ts-ignore JavaScript worker module is tested directly in Node.
import { proxyPitchApi } from './pitchapi-proxy.mjs';
export function pitchApiProxy():Plugin {
  return {name:'pitchapi-private-relay',configureServer(server){
    server.middlewares.use('/api/pitchapi',async(req,res)=>{
      const chunks:Buffer[]=[];let size=0;
      for await(const chunk of req){size+=chunk.length;if(size>512){res.writeHead(413).end();return;}chunks.push(chunk);}
      const headers=new Headers();
      for(const [name,value] of Object.entries(req.headers))if(typeof value==='string')headers.set(name,value);
      if(!headers.has('origin'))headers.set('origin',`http://${req.headers.host}`);
      const controller=new AbortController();res.on('close',()=>controller.abort());
      const method=req.method??'POST';
      const request=new Request('http://localhost/api/pitchapi',{method,headers,body:method==='POST'?Buffer.concat(chunks):undefined,signal:controller.signal});
      const response=await proxyPitchApi(request,{ALLOW_LOCALHOST:'true'});
      res.writeHead(response.status,Object.fromEntries(response.headers));res.end(await response.text());
    });
  }};
}
