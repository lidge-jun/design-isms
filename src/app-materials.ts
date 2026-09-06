// Classic-script specimen owner. All state and listeners live in the modal subtree.
namespace AppMaterials {
  type Language = 'ko' | 'en';
  const SCENES = [
    {
      id: 'paper', label: { ko: '밝게', en: 'Light' },
      title: { ko: '밝은 바탕 위의 재질', en: 'Material over a light field' },
      body: { ko: '원과 선이 툴바 뒤로 이어집니다. 배경의 윤곽과 버튼 글자가 어떻게 구분되는지 살펴보세요.',
        en: 'The circle and rule continue behind the toolbar. Compare the softened shapes with the sharp button labels.' }
    },
    {
      id: 'ink', label: { ko: '어둡게', en: 'Dark' },
      title: { ko: '어두운 바탕 위의 재질', en: 'Material over a dark field' },
      body: { ko: '배경을 어둡게 바꿔도 툴바는 밝은 표면을 유지합니다. 불투명 옵션을 켜서 배경의 비침을 비교하세요.',
        en: 'The toolbar keeps a light surface over the dark field. Turn on solid material to compare how much of the background shows through.' }
    },
    {
      id: 'checker', label: { ko: '패턴', en: 'Pattern' },
      title: { ko: '복잡한 바탕에서 비교하기', en: 'Compare over a busy field' },
      body: { ko: '밝고 어두운 줄무늬가 툴바 아래를 가로지릅니다. 흐림 효과만으로 글자의 대비를 확보할 수는 없습니다.',
        en: 'Light and dark stripes cross beneath the toolbar. Blur alone cannot guarantee readable text contrast.' }
    }
  ] as const;

  function render(lang: Language): string {
    const en = lang === 'en';
    return `<h3 class="material-lab-heading" id="material-lab-title">${en ? 'Try the material' : '재질 직접 비교하기'}</h3>
      <p class="material-lab-intro">${en
        ? 'A CSS approximation of Liquid Glass, not Apple’s native optics. Change the background beneath the controls.'
        : 'CSS로 표현한 Liquid Glass 근사 예시이며 Apple의 네이티브 광학 효과와는 다릅니다. 버튼으로 툴바 아래의 배경을 바꿔 보세요.'}</p>
      <div class="material-lab-stage" id="material-lab-canvas">
        <div class="material-lab-copy">
          <h4 class="material-lab-scene-title"></h4>
          <p class="material-lab-scene-body"></p>
        </div>
        <div class="material-lab-field">
          <div class="material-lab-shapes" aria-hidden="true"><span></span><span></span></div>
          <div class="material-lab-toolbar" role="group" aria-label="${en ? 'Specimen background' : '재질 비교 배경'}">
            ${SCENES.map(scene => `<button type="button" data-material-scene="${scene.id}" aria-pressed="false" aria-controls="material-lab-canvas">${scene.label[lang]}</button>`).join('')}
          </div>
        </div>
      </div>
      <label class="material-lab-option"><input type="checkbox"> <span>${en ? 'Use solid material' : '불투명 재질로 보기'}</span></label>
      <p class="material-lab-status" role="status" aria-live="polite" aria-atomic="true">
        <span class="material-lab-selection"></span>
        <span class="material-lab-mode-glass">${en ? 'Translucent toolbar.' : '반투명 툴바입니다.'}</span>
        <span class="material-lab-mode-solid">${en ? 'Solid toolbar; background blur is off.' : '불투명 툴바이며 배경 흐림은 꺼져 있습니다.'}</span>
      </p>
      <p class="material-lab-note">${en
        ? 'The toolbar alone uses glass. A solid surface is used when blur is unsupported or contrast / transparency preferences require it.'
        : '툴바에만 유리 재질을 적용했습니다. 흐림 효과를 지원하지 않거나 대비·투명도 접근성 설정이 켜져 있으면 불투명 표면으로 표시합니다.'}</p>
      <p class="material-lab-sources"><a href="https://developer.apple.com/design/human-interface-guidelines/materials" target="_blank" rel="noopener">Apple · Materials</a>
        <a href="https://www.apple.com/os/ios/?os=ios" target="_blank" rel="noopener">${en ? 'Apple · iOS 27 Preview' : 'Apple · iOS 27 미리보기'}</a></p>`;
  }

  export function mount(root: HTMLElement, ismId: string, lang: Language): void {
    if (ismId !== 'refractive-glass-ui') return;
    const guide = root.querySelector<HTMLElement>('.modal-dev-guide');
    if (!guide) return;
    const lab = document.createElement('section');
    lab.className = 'material-lab';
    lab.setAttribute('aria-labelledby', 'material-lab-title');
    lab.dataset.solid = 'false';
    lab.innerHTML = render(lang);
    guide.before(lab);

    const title = lab.querySelector<HTMLElement>('.material-lab-scene-title')!;
    const body = lab.querySelector<HTMLElement>('.material-lab-scene-body')!;
    const selection = lab.querySelector<HTMLElement>('.material-lab-selection')!;
    const buttons = lab.querySelectorAll<HTMLButtonElement>('[data-material-scene]');
    const solid = lab.querySelector<HTMLInputElement>('input')!;
    // These nodes are owned by render() above; no catalog strings enter its HTML.
    const select = (scene: typeof SCENES[number]): void => {
      lab.dataset.scene = scene.id;
      title.textContent = scene.title[lang];
      body.textContent = scene.body[lang];
      selection.textContent = `${scene.label[lang]}${lang === 'en' ? ' background. ' : ' 배경. '}`;
      buttons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.materialScene === scene.id)));
    };
    buttons.forEach((button, index) => {
      const scene = SCENES[index]!;
      button.addEventListener('click', () => select(scene));
    });
    solid.addEventListener('change', () => { lab.dataset.solid = String(solid.checked); });
    select(SCENES[0]);
  }
}
