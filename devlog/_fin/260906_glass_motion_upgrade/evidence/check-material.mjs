import assert from 'node:assert/strict';
import {writeFileSync} from 'node:fs';
import {connect} from './browser-probe.mjs';
const c=await connect();const rows=[];const root='devlog/_plan/260906_glass_motion_upgrade/evidence';
try {
 await c.call('Input.dispatchKeyEvent',{type:'keyUp',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});
 await c.call('Page.navigate',{url:'http://127.0.0.1:4180/index.html?qa='+Date.now()+'#refractive-glass-ui'});
 await c.wait('!!document.querySelector(".material-lab")');
 await c.evaluate(`document.fonts.ready.then(()=>Promise.all(document.querySelector('#modal-overlay').getAnimations({subtree:true}).filter(a=>a.effect?.getTiming().iterations!==Infinity).map(a=>a.finished.catch(()=>{}))))`);
 for(const width of [1440,1024,768,390,320]){
  await c.call('Emulation.setDeviceMetricsOverride',{width,height:1000,deviceScaleFactor:1,mobile:false});
  await c.evaluate(`document.querySelector('.material-lab').scrollIntoView({block:'center'})`);
  const row=await c.evaluate(`(()=>{const lab=document.querySelector('.material-lab'); const rect=lab.getBoundingClientRect();return {width:innerWidth,overflow:document.documentElement.scrollWidth>innerWidth,labOverflow:lab.scrollWidth>lab.clientWidth,labWidth:rect.width,targets:[...lab.querySelectorAll('button')].map(x=>({width:x.getBoundingClientRect().width,height:x.getBoundingClientRect().height}))}})()`);
  console.log(JSON.stringify(row));assert.equal(row.overflow,false);assert.equal(row.labOverflow,false);assert(row.targets.every(x=>x.width>=44&&x.height>=44));rows.push(row);
  await c.screenshot(`${root}/material-${width}.png`);
 }
 for(const scene of ['paper','ink','checker']){
  const state=await c.evaluate(`(()=>{const b=document.querySelector('[data-material-scene="${scene}"]');b.click();return {scene:document.querySelector('.material-lab').dataset.scene,pressed:b.getAttribute('aria-pressed'),title:document.querySelector('.material-lab-scene-title').textContent,blur:getComputedStyle(document.querySelector('.material-lab-toolbar')).backdropFilter}})()`);
  assert.equal(state.scene,scene);assert.equal(state.pressed,'true');rows.push(state);
 }
 await c.evaluate(`document.querySelector('.material-lab-option input').click()`);
 assert.equal(await c.evaluate(`getComputedStyle(document.querySelector('.material-lab-toolbar')).backdropFilter`),'none');
 await c.evaluate(`document.querySelector('.material-lab-option input').click()`);
 for(const [name,value] of [['prefers-contrast','more'],['prefers-reduced-transparency','reduce'],['forced-colors','active']]){
  await c.call('Emulation.setEmulatedMedia',{features:[{name,value}]});
  assert.equal(await c.evaluate(`getComputedStyle(document.querySelector('.material-lab-toolbar')).backdropFilter`),'none');
  rows.push({media:name,value,solid:true});
 }
 await c.call('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
 assert.equal(await c.evaluate(`getComputedStyle(document.querySelector('.material-lab-toolbar button')).transitionDuration`),'0s');
 await c.evaluate(`document.querySelector('[data-material-scene="ink"]').focus()`);
 await c.call('Input.dispatchKeyEvent',{type:'keyDown',key:'Enter',code:'Enter',windowsVirtualKeyCode:13,text:'\r'});
 await c.call('Input.dispatchKeyEvent',{type:'keyUp',key:'Enter',code:'Enter',windowsVirtualKeyCode:13});
 assert.equal(await c.evaluate(`document.querySelector('.material-lab').dataset.scene`),'ink');
 await c.call('Emulation.setEmulatedMedia',{features:[]});
 await c.call('Input.dispatchKeyEvent',{type:'keyDown',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});
 await c.call('Input.dispatchKeyEvent',{type:'keyUp',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});
 await c.wait(`!document.querySelector('#modal-overlay').classList.contains('active')`);
 await c.evaluate(`const input=document.querySelector('.search-input');input.value='Liquid Glass';input.dispatchEvent(new Event('input',{bubbles:true}));window.scrollTo(0,0)`);
 await c.wait(`!!document.querySelector('.ism-card[data-id="refractive-glass-ui"] .ism-name-btn')`);
 await c.evaluate(`const b=document.querySelector('.ism-card[data-id="refractive-glass-ui"] .ism-name-btn'); b.focus();b.click()`);
 await c.wait(`!!document.querySelector('.material-lab')`);
 await c.call('Input.dispatchKeyEvent',{type:'keyDown',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});
 await c.call('Input.dispatchKeyEvent',{type:'keyUp',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});
 assert((await c.evaluate('document.activeElement.textContent')).includes('Liquid Glass'));
 await c.call('Page.navigate',{url:'http://127.0.0.1:4180/index.html?qa=unrelated#minimalism'});
 await c.wait(`document.querySelector('#ism-modal-title')?.textContent.includes('Minimalism')`);
 assert.equal(await c.evaluate(`document.querySelectorAll('.material-lab').length`),0);
 assert.equal(c.errors.length,0);
 const result={ok:true,rows,keyboard:true,focusReturn:true,unrelatedIsm:true,errors:c.errors};
 writeFileSync(`${root}/material-qa.json`,JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result));
}finally{c.close()}
