import assert from 'node:assert/strict';
import {writeFileSync} from 'node:fs';
import {connect} from './browser-probe.mjs';
const c=await connect();const report={previews:{},interactions:[],viewports:[],errors:[]};
const out='devlog/_plan/260906_glass_motion_upgrade/evidence';
const open=async(id)=>{await c.call('Page.navigate',{url:`http://127.0.0.1:4180/motion.html?qa=${Date.now()}#${id}`});await c.wait(`document.querySelector('#motion-modal-overlay')?.getAttribute('aria-hidden')==='false' && !!document.querySelector('.motion-modal-stage')`);await c.evaluate(`document.fonts.ready`)};
const reduce=async value=>{await c.call('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value}]});await c.evaluate(`new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))`)};
const key=async(key,code,number,text)=>{await c.call('Input.dispatchKeyEvent',{type:'keyDown',key,code,windowsVirtualKeyCode:number,...(text?{text}:{})});await c.call('Input.dispatchKeyEvent',{type:'keyUp',key,code,windowsVirtualKeyCode:number})};
try{
 await c.call('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false});
 await reduce('no-preference');await open('motion-linear');
 await c.evaluate(`document.querySelector('.motion-play-toggle').click()`);
 await c.wait(`document.querySelector('.motion-modal-stage .motion-demo').getAnimations({subtree:true})[0]?.currentTime>70`);
 const paused=await c.evaluate(`(async()=>{const d=document.querySelector('.motion-modal-stage .motion-demo');document.querySelector('.motion-play-toggle').click();const a=d.getAnimations({subtree:true})[0];await a.ready;const before={time:a.currentTime,transform:getComputedStyle(a.effect.target).transform};await new Promise(r=>{let n=0;function f(){if(++n===6)r();else requestAnimationFrame(f)}requestAnimationFrame(f)});return {before,after:{time:a.currentTime,transform:getComputedStyle(a.effect.target).transform},state:d.dataset.playback,pressed:document.querySelector('.motion-play-toggle').getAttribute('aria-pressed')}})()`);
 assert.equal(paused.state,'paused');assert.equal(paused.pressed,'false');assert.equal(paused.before.time,paused.after.time);assert.equal(paused.before.transform,paused.after.transform);
 await c.evaluate(`document.querySelector('.motion-play-toggle').click()`);await c.wait(`document.querySelector('.motion-modal-stage .motion-demo').getAnimations({subtree:true})[0].currentTime>${paused.after.time+25}`);
 const replay=await c.evaluate(`(()=>{document.querySelector('.motion-replay').click();const d=document.querySelector('.motion-modal-stage .motion-demo');return {time:d.getAnimations({subtree:true})[0].currentTime,state:d.dataset.playback}})()`);assert(replay.time<25);assert.equal(replay.state,'running');
 await c.evaluate(`document.querySelector('.motion-play-toggle').click()`);await reduce('reduce');assert.equal(await c.evaluate(`document.querySelector('.motion-play-toggle').disabled`),true);await reduce('no-preference');assert.equal(await c.evaluate(`document.querySelector('.motion-modal-stage .motion-demo').dataset.playback`),'paused');
 const hiddenTab=await c.call('Target.createTarget',{url:'about:blank',background:false});
 try{await c.call('Target.activateTarget',{targetId:hiddenTab.targetId});await c.wait('document.hidden');await c.call('Page.bringToFront');await c.wait('!document.hidden');assert.equal(await c.evaluate(`document.querySelector('.motion-modal-stage .motion-demo').dataset.playback`),'paused')}finally{await c.call('Target.closeTarget',{targetId:hiddenTab.targetId})}
 report.previews={paused,replay,manualPauseAfterPreferences:true,manualPauseAfterVisibility:true};
 await open('motion-progress');await c.wait('!!document.querySelector(".mi-range")');await c.evaluate(`document.querySelector('.mi-range').focus()`);await key('End','End',35);assert.equal(await c.evaluate(`document.querySelector('[role=progressbar]').getAttribute('aria-valuenow')`),'100');await reduce('reduce');assert.equal(await c.evaluate(`document.querySelector('output').textContent`),'100%');await reduce('no-preference');report.interactions.push('progress value/ARIA/reduced state');
 await open('motion-scroll-reveal');await c.wait('!!document.querySelector(".mi-scroll")');
 const beforeReveal=await c.evaluate(`[...document.querySelectorAll('.mi-reveal-item')].map(x=>x.dataset.revealed)`);
 await c.evaluate(`document.querySelector('.mi-scroll').scrollTop=1000`);await c.wait(`document.querySelector('.mi-reveal-item:last-child').dataset.revealed==='true'`);
 assert(await c.evaluate(`document.querySelector('.mi-scroll').scrollTop>0`));await reduce('reduce');assert.equal(await c.evaluate(`document.querySelectorAll('.mi-reveal-item[data-revealed="true"]').length`),5);await reduce('no-preference');report.interactions.push({scrollReveal:true,before:beforeReveal});
 await open('motion-expand-collapse');await c.wait('!!document.querySelector(".mi-disclosure-toggle")');
 const collapsed=await c.evaluate(`document.querySelector('.mi-disclosure-shell').getBoundingClientRect().height`);
 await c.evaluate(`document.querySelector('.mi-disclosure-toggle').click()`);assert.equal(await c.evaluate(`document.querySelector('.mi-disclosure-body').hidden`),false);
 await c.evaluate(`Promise.all(document.querySelector('.mi-disclosure-shell').getAnimations().map(a=>a.finished.catch(()=>{})))`);
 assert((await c.evaluate(`document.querySelector('.mi-disclosure-shell').getBoundingClientRect().height`))>collapsed);
 await c.evaluate(`document.querySelector('.mi-disclosure-toggle').click()`);assert.equal(await c.evaluate(`document.querySelector('.mi-disclosure-body').hidden`),true);report.interactions.push('disclosure changes layout and hidden/expanded state');
 await open('motion-tab-transition');await c.wait('!!document.querySelector(".mi-tabs")');await c.evaluate(`document.querySelector('.mi-tabs [role=tab]').focus()`);await key('ArrowRight','ArrowRight',39);
 const tabs=await c.evaluate(`({selected:[...document.querySelectorAll('.mi-tabs [role=tab]')].map(x=>[x.getAttribute('aria-selected'),x.tabIndex]),hidden:[...document.querySelectorAll('.mi-tab-panel')].map(x=>x.hidden),focus:document.activeElement.textContent})`);
 assert.deepEqual(tabs.selected,[['false',-1],['true',0]]);assert.deepEqual(tabs.hidden,[true,false]);await key('Home','Home',36);assert.equal(await c.evaluate(`document.querySelector('.mi-tabs [role=tab]').getAttribute('aria-selected')`),'true');report.interactions.push({tabs});
 await open('motion-list-reorder');await c.wait('!!document.querySelector(".mi-reorder-toggle")');
 await c.evaluate(`document.querySelector('.mi-reorder-toggle').click();document.querySelector('.mi-reorder-toggle').click()`);
 assert.deepEqual(await c.evaluate(`[...document.querySelectorAll('.mi-reorder-list li')].map(x=>x.dataset.item)`),['space','type','color']);assert.equal(await c.evaluate(`document.activeElement.className`),'mi-reorder-toggle');await reduce('reduce');assert.equal(await c.evaluate(`document.querySelector('.motion-interaction').getAnimations({subtree:true}).length`),0);await reduce('no-preference');report.interactions.push('reorder DOM/rapid input/focus/reduced state');
 for(const width of [1440,1024,768,390,320]){
  await c.call('Emulation.setDeviceMetricsOverride',{width,height:1000,deviceScaleFactor:1,mobile:false});
  await c.evaluate(`document.querySelector('.motion-interaction').scrollIntoView({block:'center'})`);
  const row=await c.evaluate(`({width:innerWidth,overflow:document.documentElement.scrollWidth>innerWidth,stageOverflow:document.querySelector('.motion-modal-stage').scrollWidth>document.querySelector('.motion-modal-stage').clientWidth})`);assert.equal(row.overflow,false);assert.equal(row.stageOverflow,false);report.viewports.push(row);await c.screenshot(`${out}/motion-reorder-${width}.png`);
 }
 const fixture=await c.evaluate(`(()=>{const host=document.createElement('div');document.querySelector('#motion-modal-content').append(host);const life=MotionInteractions.mount(host,'motion-list-reorder');const button=host.querySelector('button');button.click();life.dispose();life.dispose();const before=host.textContent;button.click();const pass=before===host.textContent&&host.getAnimations({subtree:true}).length===0;host.remove();return pass})()`);assert(fixture);report.interactions.push('idempotent dispose cancels effects and listeners');
 const injection=await c.call('Page.addScriptToEvaluateOnNewDocument',{source:'delete window.IntersectionObserver;'});
 try{await open('motion-scroll-reveal');await c.wait('document.querySelectorAll(".mi-reveal-item").length===5');assert.equal(await c.evaluate(`document.querySelectorAll('.mi-reveal-item[data-revealed="true"]').length`),5)}finally{await c.call('Page.removeScriptToEvaluateOnNewDocument',{identifier:injection.identifier})}
 report.interactions.push('missing IntersectionObserver exposes all content');
 assert.equal(c.errors.length,0);report.errors=c.errors;report.ok=true;writeFileSync(`${out}/motion-qa.json`,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
}finally{c.close()}
