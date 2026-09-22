/** Safe DOM projection only. IO, composition, selection and lifecycle live elsewhere. */
namespace RecipeView {
  export type State = 'idle' | 'loading' | 'ready' | 'error';
  export interface Choice { readonly ref: DesignCatalog.Ref; readonly name: string; }
  export interface Preview { readonly src: string | null; readonly label: string; }
  export interface Ready {
    readonly recipe: DesignRecipes.Recipe;
    readonly recipes: readonly DesignRecipes.Recipe[];
    readonly composition: DesignRecipes.Composition;
    readonly choices: Readonly<Record<string, readonly Choice[]>>;
    readonly preview: Preview;
  }
  export interface Model {
    readonly state: State;
    readonly lang: DesignRecipes.Lang;
    readonly ready: Ready | null;
    readonly status: string;
    readonly copying: boolean;
    readonly manualCopy: string | null;
    readonly guidanceOpen: boolean;
  }

  function element<K extends keyof HTMLElementTagNameMap>(tag: K, className = '', text = ''): HTMLElementTagNameMap[K] {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text) node.textContent = text;
    return node;
  }
  export function refKey(ref: DesignCatalog.Ref): string { return ref.domain + '/' + ref.id; }
  export function name(item: DesignCatalog.Summary, lang: DesignRecipes.Lang): string {
    return lang === 'ko' ? item.nameKr || item.name : item.name;
  }
  function button(action: 'copy' | 'retry', text: string): HTMLButtonElement {
    const node = element('button', 'recipe-' + action, text);
    node.type = 'button';
    node.dataset.action = action;
    node.dataset.focus = action;
    return node;
  }
  function catalogLink(ref: DesignCatalog.Ref, text: string, focus: string): HTMLAnchorElement {
    const pages: Record<DesignCatalog.Domain, string> = {
      isms: 'index.html', effects: 'effects.html', color: 'color.html',
      typography: 'typography.html', layout: 'layout.html', motion: 'motion.html'
    };
    const link = element('a', 'recipe-source-link', text);
    link.href = pages[ref.domain] + '#' + encodeURIComponent(ref.id);
    link.dataset.domain = ref.domain;
    link.dataset.id = ref.id;
    link.dataset.focus = focus;
    return link;
  }

  export function localizeSummary(root: HTMLDetailsElement, lang: DesignRecipes.Lang): void {
    const ko = lang === 'ko';
    const title = ko ? '화면에 맞는 조합 찾기' : 'Find a composition for your screen';
    root.setAttribute('aria-label', title);
    const copy: Record<string, string> = {
      '.recipe-summary-title': title,
      '.recipe-summary-text': ko ? '제품 소개, 읽기, 설정 화면에 쓸 재료를 골라보세요.'
        : 'Choose materials for product stories, reading, and settings.',
      '.recipe-summary-action': root.open ? (ko ? '닫기' : 'Close') : (ko ? '열기' : 'Open')
    };
    for (const [selector, text] of Object.entries(copy)) {
      const target = root.querySelector(selector);
      if (target) target.textContent = text;
    }
    const summary = root.querySelector('summary');
    if (summary) summary.dataset.focus = 'workbench';
  }

  function options(ready: Ready, lang: DesignRecipes.Lang): HTMLFieldSetElement {
    const fieldset = element('fieldset', 'recipe-options');
    fieldset.append(element('legend', '', lang === 'ko' ? '화면의 목적' : 'Screen purpose'));
    for (const recipe of ready.recipes) {
      const label = element('label', 'recipe-option');
      const input = element('input');
      input.type = 'radio'; input.name = 'recipe-choice'; input.value = recipe.id;
      input.checked = recipe.id === ready.recipe.id;
      input.dataset.focus = 'recipe:' + recipe.id;
      label.append(input, element('span', 'recipe-option-title', recipe.title[lang]),
        element('span', 'recipe-option-summary', recipe.summary[lang]));
      fieldset.append(label);
    }
    return fieldset;
  }

  function preview(value: Preview, lang: DesignRecipes.Lang): HTMLElement {
    const figure = element('figure', 'recipe-preview');
    // Only the fixed thumbnail namespace is accepted; never fall back to a PNG.
    const valid = value.src !== null && /^assets\/images\/thumbs\/[a-z0-9]+(?:-[a-z0-9]+)*\/[a-zA-Z0-9_-]+\.webp$/.test(value.src);
    if (valid && value.src !== null) {
      const image = element('img');
      image.alt = value.label; image.width = 1536; image.height = 1024;
      image.loading = 'lazy'; image.decoding = 'async'; image.src = value.src;
      figure.append(image);
    }
    figure.append(element('figcaption', '', valid
      ? value.label + (lang === 'ko' ? ' 스타일 참고' : ' style reference')
      : unavailable(value.label, lang)));
    return figure;
  }
  function unavailable(label: string, lang: DesignRecipes.Lang): string {
    return label + (lang === 'ko' ? ' — 이미지를 불러올 수 없습니다.' : ' — Image unavailable.');
  }
  export function imageFailed(image: HTMLImageElement, lang: DesignRecipes.Lang): void {
    const figure = image.closest('.recipe-preview');
    const caption = figure?.querySelector('figcaption');
    if (caption) caption.textContent = unavailable(image.alt, lang);
    image.remove();
  }

  function slots(ready: Ready, lang: DesignRecipes.Lang): HTMLElement {
    const list = element('div', 'recipe-slots');
    const roles: Record<DesignRecipes.Role, string> = lang === 'ko'
      ? { essential: '필수', helper: '보조', substitutable: '교체 가능' }
      : { essential: 'Essential', helper: 'Supporting', substitutable: 'Substitutable' };
    for (const slot of ready.recipe.slots) {
      const selected = ready.composition.slots.find(item => item.id === slot.id);
      if (!selected) continue;
      const row = element('div', 'recipe-slot');
      const label = element('label', 'recipe-slot-label', slot.label[lang]);
      const select = element('select', 'recipe-slot-select');
      select.id = 'recipe-select-' + ready.recipe.id + '-' + slot.id;
      label.htmlFor = select.id;
      select.dataset.slot = slot.id; select.dataset.focus = 'slot:' + slot.id;
      for (const choice of ready.choices[slot.id] ?? []) {
        const option = element('option', '', choice.name);
        option.value = refKey(choice.ref);
        option.selected = option.value === refKey(selected.ref);
        select.append(option);
      }
      const source = catalogLink(selected.ref, lang === 'ko' ? '상세 보기' : 'View reference', 'source:' + slot.id);
      source.setAttribute('aria-label', name(selected.item, lang) + (lang === 'ko' ? ' 상세 보기' : ' reference'));
      row.append(label, element('span', 'recipe-slot-role', roles[slot.role]), select, source);
      list.append(row);
    }
    return list;
  }

  function guidance(ready: Ready, lang: DesignRecipes.Lang, open: boolean): HTMLDetailsElement {
    const details = element('details', 'recipe-more');
    details.dataset.detail = 'guidance'; details.open = open;
    const summary = element('summary', '', lang === 'ko' ? '구현 제약과 출처' : 'Implementation notes and sources');
    summary.dataset.focus = 'guidance';
    const body = element('div', 'recipe-guidance');
    body.append(element('p', '', lang === 'ko'
      ? '설계 가이드입니다. 구현을 마친 뒤 실제 화면과 동작을 확인하세요.'
      : 'Design guidance. Check the actual screen and behavior after implementation.'));
    for (const section of [
      { title: lang === 'ko' ? '구현 제약' : 'Constraints', values: ready.composition.constraints },
      { title: lang === 'ko' ? '구현 후 확인할 항목' : 'Checks to run', values: ready.composition.checks }
    ]) {
      const list = element('ul');
      for (const text of section.values) list.append(element('li', '', text));
      body.append(element('h3', '', section.title), list);
    }
    const sources = element('ul');
    for (const [index, source] of ready.composition.sources.entries()) {
      let url: URL;
      try { url = new URL(source.url); } catch { continue; }
      if (url.protocol !== 'https:') continue;
      const link = element('a', 'recipe-source-link', url.hostname + ' · ' + source.license);
      link.href = url.href; link.rel = 'noopener noreferrer'; link.dataset.focus = 'citation:' + index;
      const item = element('li');
      item.append(link, element('p', '', source.note));
      sources.append(item);
    }
    body.append(element('h3', '', lang === 'ko' ? '출처' : 'Sources'), sources);
    details.append(summary, body);
    return details;
  }

  function detail(ready: Ready, model: Model): HTMLElement {
    const lang = model.lang;
    const panel = element('div', 'recipe-detail');
    const heading = element('div', 'recipe-detail-heading');
    heading.append(element('h2', 'recipe-title', ready.recipe.title[lang]),
      element('p', 'recipe-description', ready.recipe.summary[lang]));
    const actions = element('div', 'recipe-actions');
    const copy = button('copy', lang === 'ko' ? '구현 가이드 복사' : 'Copy brief');
    copy.setAttribute('aria-disabled', String(model.copying));
    actions.append(copy);
    heading.append(actions);
    panel.append(heading, preview(ready.preview, lang), slots(ready, lang));
    if (model.manualCopy !== null) {
      const manual = element('div', 'recipe-manual-copy');
      const label = element('label', '', lang === 'ko'
        ? '아래 가이드를 선택해 직접 복사하세요.' : 'Select and copy the brief below.');
      const textarea = element('textarea');
      textarea.id = 'recipe-manual-' + ready.recipe.id; label.htmlFor = textarea.id;
      textarea.readOnly = true; textarea.rows = 8; textarea.value = model.manualCopy;
      textarea.dataset.focus = 'manual-copy'; manual.append(label, textarea); panel.append(manual);
    }
    panel.append(guidance(ready, lang, model.guidanceOpen));
    return panel;
  }

  /** Update asynchronous copy feedback without replacing modal return-focus links. */
  export function feedback(body: HTMLElement, message: string, copying: boolean): void {
    const status = body.querySelector<HTMLElement>(':scope > .recipe-status');
    if (status) status.textContent = message;
    body.querySelector('[data-action="copy"]')?.setAttribute('aria-disabled', String(copying));
  }

  export function render(body: HTMLElement, model: Model): void {
    body.dataset.state = model.state;
    body.setAttribute('aria-busy', String(model.state === 'loading'));
    let status = body.querySelector<HTMLElement>(':scope > .recipe-status');
    if (!status) {
      status = element('p', 'recipe-status');
      status.setAttribute('role', 'status'); status.setAttribute('aria-live', 'polite');
      status.setAttribute('aria-atomic', 'true'); body.append(status);
    }
    // Keep the live region attached while its neighboring content changes.
    for (const child of Array.from(body.children)) if (child !== status) child.remove();
    if (model.state === 'ready' && model.ready) {
      const layout = element('div', 'recipe-layout');
      layout.append(options(model.ready, model.lang), detail(model.ready, model));
      body.insertBefore(layout, status);
    } else if (model.state === 'error') {
      const error = element('div', 'recipe-error');
      error.append(element('p', '', model.lang === 'ko'
        ? '조합 자료를 불러오지 못했습니다. 다시 시도해주세요.'
        : 'The composition materials could not load. Please try again.'),
      button('retry', model.lang === 'ko' ? '다시 시도' : 'Retry'));
      body.insertBefore(error, status);
    }
    feedback(body, model.status, model.copying);
  }
}
