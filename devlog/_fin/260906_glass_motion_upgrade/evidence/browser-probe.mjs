// Local QA transport follows the repository's existing run-final-browser-qa.mjs CDP approach.
import { writeFileSync } from 'node:fs';
export async function connect() {
 const tabs=await (await fetch('http://127.0.0.1:9222/json/list')).json();
 const tab=tabs.find(t=>t.id==='910E265507BA12FD84559C12D72A4D05');
 if(!tab) throw Error('Owned QA tab absent');
 const ws=new WebSocket(tab.webSocketDebuggerUrl); let id=0; const pending=new Map(); const errors=[];
 await new Promise((resolve,reject)=>{ws.onopen=resolve;ws.onerror=reject});
 ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.id){const p=pending.get(m.id);if(p){pending.delete(m.id);m.error?p.reject(Error(JSON.stringify(m.error))):p.resolve(m.result)}}else if(m.method==='Runtime.exceptionThrown'||m.method==='Runtime.consoleAPICalled'&&m.params.type==='error'||m.method==='Log.entryAdded'&&m.params.entry.level==='error') errors.push(m.params)};
 const call=(method,params={})=>new Promise((resolve,reject)=>{const n=++id;pending.set(n,{resolve,reject});ws.send(JSON.stringify({id:n,method,params}))});
 await call('Runtime.enable');await call('Page.enable');await call('Log.enable');await call('Log.clear');errors.length=0;
 const evaluate=async expression=>{const r=await call('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value};
 const wait=async expression=>{const until=Date.now()+15000;while(Date.now()<until){if(await evaluate(expression))return;await new Promise(r=>setTimeout(r,100))}throw Error('Timed out '+expression)};
 const screenshot=async path=>{const r=await call('Page.captureScreenshot',{format:'png'});writeFileSync(path,Buffer.from(r.data,'base64'))};
 return {call,evaluate,wait,screenshot,errors,close:()=>ws.close()};
}
if(process.argv[2]==='baseline'){
 const c=await connect();try{
 await c.call('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false});
 await c.call('Page.navigate',{url:'http://127.0.0.1:4180/motion.html'});await c.wait('document.querySelectorAll(".motion-card").length===20');
 await c.screenshot('devlog/_plan/260906_glass_motion_upgrade/evidence/baseline-motion.png');
 console.log(JSON.stringify({cards:await c.evaluate('document.querySelectorAll(".motion-card").length'),width:await c.evaluate('innerWidth'),errors:c.errors}));
 }finally{c.close()}
}
