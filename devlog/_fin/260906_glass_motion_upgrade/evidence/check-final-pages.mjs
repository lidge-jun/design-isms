import assert from 'node:assert/strict';import {writeFileSync} from 'node:fs';
import {connect} from './browser-probe.mjs';
const c=await connect();const rows=[];const base=process.argv[2]||'http://127.0.0.1:4179';
const pages=[['index','.ism-card',49],['effects','.effect-card',94],['faq','.faq-item',18],['color','.color-card',25],['typography','.typo-card',20],['layout','.layout-card',25],['motion','.motion-card',20]];
try{
 await c.call('Emulation.setEmulatedMedia',{features:[]});
 for(const width of [1440,390]){
  await c.call('Emulation.setDeviceMetricsOverride',{width,height:1000,deviceScaleFactor:1,mobile:false});
  for(const [page,selector,count] of pages){
   await c.call('Page.navigate',{url:`${base}/${page}.html?final=${Date.now()}`});
   await c.wait(`document.querySelectorAll('${selector}').length===${count}`);await c.evaluate('document.fonts.ready');
   await c.wait(`!document.querySelector('#loading-overlay')||getComputedStyle(document.querySelector('#loading-overlay')).opacity==='0'`);
   const row=await c.evaluate(`({page:'${page}',width:innerWidth,count:document.querySelectorAll('${selector}').length,overflow:document.documentElement.scrollWidth>innerWidth,badImages:[...document.images].filter(x=>x.complete&&x.currentSrc&&!x.currentSrc.startsWith('data:')&&x.naturalWidth===0).map(x=>x.currentSrc),effectTypes:new Set([...document.querySelectorAll('.effect-card')].map(x=>x.dataset.effectId)).size,motionTypes:new Set([...document.querySelectorAll('.motion-demo')].map(x=>x.dataset.motionId)).size})`);
   assert.equal(row.overflow,false,JSON.stringify(row));assert.equal(row.badImages.length,0,JSON.stringify(row));
   if(page==='effects')assert.equal(row.effectTypes,94);if(page==='motion')assert.equal(row.motionTypes,20);
   rows.push(row);console.log(page,width,count,'pass');
   if(['index','effects','motion'].includes(page))await c.screenshot(`devlog/_plan/260906_glass_motion_upgrade/evidence/final-${page}-${width}.png`);
  }
 }
 assert.equal(c.errors.length,0);const result={ok:true,base,rows,errors:c.errors};writeFileSync('devlog/_plan/260906_glass_motion_upgrade/evidence/final-pages.json',JSON.stringify(result,null,2)+'\n');
}finally{c.close()}
