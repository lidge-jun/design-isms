import {connect} from './browser-probe.mjs';import assert from 'node:assert/strict';import {writeFileSync,readFileSync} from 'node:fs';import {createHash} from 'node:crypto';
const c=await connect();const results=[];const manifest=JSON.parse(readFileSync('assets/data/image-pairs-manifest.json','utf8')).pairs;
const image=async(selector)=>c.evaluate(`(async()=>{const i=document.querySelector('${selector}');i.scrollIntoView({block:'center'});await i.decode();return {src:i.currentSrc,width:i.naturalWidth,height:i.naturalHeight,alt:i.alt}})()`);
async function check(row,original=false){const url=new URL(row.src);assert(url.searchParams.get('v')?.startsWith('2026-09-06'));assert.equal(row.width,original?1536:768);assert.equal(row.height,original?1024:512);const path=url.pathname.slice(1);const record=manifest.find(x=>(original?x.source:x.preview)===path);assert(record,path);const bytes=await(await fetch(row.src)).arrayBuffer();assert.equal(createHash('sha256').update(Buffer.from(bytes)).digest('hex'),original?record.sourceSha256:record.previewSha256);results.push({...row,manifestHash:true});}
try{
 await c.call('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false});
 await c.call('Page.navigate',{url:'http://127.0.0.1:4179/index.html?images='+Date.now()+'#refractive-glass-ui'});await c.wait('!!document.querySelector(".material-lab")');
 await c.evaluate(`Promise.all(document.querySelector('#modal-overlay').getAnimations({subtree:true}).filter(a=>a.effect?.getTiming().iterations!==Infinity).map(a=>a.finished.catch(()=>{})))`);
 await check(await image('.modal-image-button img'));await c.screenshot('devlog/_plan/260906_glass_motion_upgrade/evidence/final-glass-modal.png');
 await c.evaluate(`document.querySelector('.modal-image-button').click()`);await c.wait(`document.querySelector('#lightbox img')?.naturalWidth===1536`);const full=await image('#lightbox img');assert(new URL(full.src).pathname.endsWith('.png'));await check(full,true);
 for(const type of ['keyDown','keyUp'])await c.call('Input.dispatchKeyEvent',{type,key:'Escape',code:'Escape',windowsVirtualKeyCode:27});
 await c.evaluate(`document.querySelector('.modal-collapsible-header').click()`);await check(await image('.modal-collapsible .modal-image-button img'));await c.screenshot('devlog/_plan/260906_glass_motion_upgrade/evidence/final-glass-mobile-modal.png');
 for(const id of ['motion-spring','motion-back']){
 await c.call('Page.navigate',{url:`http://127.0.0.1:4179/motion.html?image=${Date.now()}#${id}`});await c.wait('!!document.querySelector(".motion-guide-image")');
 await c.evaluate(`Promise.all(document.querySelector('#motion-modal-overlay').getAnimations({subtree:true}).filter(a=>a.effect?.getTiming().iterations!==Infinity).map(a=>a.finished.catch(()=>{})))`);
 await check(await image('.motion-guide-image'));await c.screenshot(`devlog/_plan/260906_glass_motion_upgrade/evidence/final-${id}-guide.png`);
 await c.evaluate(`document.querySelector('.motion-guide-image').click()`);await c.wait(`document.querySelector('#motion-lightbox-image')?.naturalWidth===1536`);await check(await image('#motion-lightbox-image'),true);
 }
 assert.equal(c.errors.length,0);writeFileSync('devlog/_plan/260906_glass_motion_upgrade/evidence/final-image-runtime.json',JSON.stringify({ok:true,results,errors:c.errors},null,2)+'\n');console.log('final image runtime ok: versioned WebP/PNG, dimensions, served bytes match manifest, no console/runtime errors');
}finally{c.close()}
