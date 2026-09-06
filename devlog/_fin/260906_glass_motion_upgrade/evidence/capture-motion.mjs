import {connect} from './browser-probe.mjs';
const c=await connect();try{
 for(const width of [390,1440]){
 await c.call('Emulation.setDeviceMetricsOverride',{width,height:1000,deviceScaleFactor:1,mobile:false});
 for(const id of ['motion-progress','motion-scroll-reveal','motion-expand-collapse','motion-tab-transition','motion-list-reorder']){
 await c.call('Page.navigate',{url:`http://127.0.0.1:4180/motion.html?visual=${Date.now()}#${id}`});await c.wait(`document.querySelector('.motion-interaction')?.dataset.interaction==='${id}'`);
 await c.evaluate(`document.fonts.ready.then(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))).then(()=>Promise.all(document.querySelector('#motion-modal-overlay').getAnimations({subtree:true}).filter(a=>a.effect?.getTiming().iterations!==Infinity).map(a=>a.finished.catch(()=>{}))))`);
 if(id==='motion-expand-collapse')await c.evaluate(`document.querySelector('.mi-disclosure-toggle').click()`);
 await c.evaluate(`Promise.all(document.querySelector('.motion-interaction').getAnimations({subtree:true}).map(a=>a.finished.catch(()=>{})))`);
 const geometry=await c.evaluate(`(()=>{const s=document.querySelector('.motion-modal-stage'),line=document.querySelector('.motion-curve-line');return {width:innerWidth,overflow:document.documentElement.scrollWidth>innerWidth,stageOverflow:s.scrollWidth>s.clientWidth,fill:getComputedStyle(line).fill,stroke:getComputedStyle(line).stroke}})()`);
 if(geometry.overflow||geometry.stageOverflow||geometry.fill!=='none'||geometry.stroke==='none')throw Error(JSON.stringify({id,...geometry}));
 await c.screenshot(`devlog/_plan/260906_glass_motion_upgrade/evidence/${id}-${width}.png`);console.log(id,width,'stable screenshot; line curve; no overflow');
 }
 }
}finally{c.close()}
