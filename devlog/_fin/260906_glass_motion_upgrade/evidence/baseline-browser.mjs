export default async function(ctx) {
 const p=ctx.page; const errors=[]; p.on('pageerror',e=>errors.push(e.message));
 await p.setViewportSize({width:1440,height:1000});
 await p.goto('http://127.0.0.1:4180/motion.html');
 await p.waitForSelector('.motion-card');
 const cards=await p.locator('.motion-card').count();
 await p.screenshot({path:'devlog/_plan/260906_glass_motion_upgrade/evidence/baseline-motion.png'});
 return {cards,errors,viewport:p.viewportSize(),overflow:await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth)};
}
