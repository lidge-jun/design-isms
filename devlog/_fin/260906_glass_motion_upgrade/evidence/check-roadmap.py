from pathlib import Path
import json,subprocess
root=Path.cwd(); unit=root/'devlog/_plan/260906_glass_motion_upgrade'
required=['000_plan.md','001_design.md','002_research.md','003_baseline.md','010_material.md','011_editorial_contract.md','012_content.md','020_motion.md','030_images.md','031_image_successor.md']
for name in required:
 p=unit/name
 assert p.is_file() and len(p.read_text())>500,name
for name in ['010_material.md','020_motion.md','030_images.md']:
 text=(unit/name).read_text()
 assert 'MODIFY' in text and 'NEW' in text and ('Verification' in text or 'verification' in text),name
for path in ['src/app.ts','src/app-guides.ts','src/motion.ts','src/motion-demos.ts','assets/css/motion-demos.css','scripts/verify-image-quality.mjs','scripts/finalize-image-quality.mjs','scripts/image-attempt.mjs']:
 assert (root/path).is_file(),path
assert json.loads((root/'assets/data/isms.json').read_text()) and len(json.loads((root/'assets/data/isms.json').read_text()))==49
assert len(json.loads((root/'assets/data/motion.json').read_text()))==20
changed=subprocess.check_output(['git','diff','--name-only'],text=True).splitlines()
assert not [p for p in changed if not p.startswith('devlog/')],changed
assert 'lines ok:' in (unit/'evidence/baseline-verify.log').read_text()
print('roadmap ok: 10 nonempty numbered plans, owning files exist, baseline verify captured, docs-only tracked delta')
