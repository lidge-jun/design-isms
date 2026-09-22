/** Instance-owned recipe workbench. Native details/radios/selects own keyboard behavior. */
namespace RecipeChooser {
  export interface MountOptions {
    readonly root: HTMLElement;
    readonly getLang: () => DesignRecipes.Lang;
    readonly openIsm: (id: string, trigger: HTMLElement) => void;
  }
  export interface Controller { setLang(lang: DesignRecipes.Lang): void; dispose(): void; }
  type Notice = 'idle' | 'loading' | 'ready' | 'updated' | 'copying' | 'copied' | 'manual' | 'error';
  const messages: Record<Notice, DesignRecipes.Text> = {
    idle: { ko: '', en: '' },
    loading: { ko: '조합 자료를 불러오는 중입니다.', en: 'Loading composition materials.' },
    ready: { ko: '조합을 준비했습니다. 필요한 재료를 바꾸거나 가이드를 복사하세요.',
      en: 'Your composition is ready. Adjust the materials or copy the brief.' },
    updated: { ko: '선택한 재료로 조합을 바꿨습니다.', en: 'The composition now uses your selected materials.' },
    copying: { ko: '가이드를 복사하는 중입니다.', en: 'Copying the brief.' },
    copied: { ko: '가이드를 복사했습니다.', en: 'Brief copied.' },
    manual: { ko: '자동 복사를 사용할 수 없습니다. 아래 가이드를 직접 복사하세요.',
      en: 'Automatic copying is unavailable. Copy the brief manually below.' },
    error: { ko: '조합 자료를 불러오지 못했습니다. 다시 시도할 수 있습니다.',
      en: 'Composition materials could not load. You can retry.' }
  };

  function preview(snapshot: DesignCatalog.Snapshot, composition: DesignRecipes.Composition): RecipeView.Preview {
    const style = composition.slots.find(slot => slot.ref.domain === 'isms');
    const label = style ? RecipeView.name(style.item, composition.lang)
      : composition.lang === 'ko' ? '스타일 미리보기' : 'Style preview';
    if (!style || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(style.ref.id)) return { src: null, label };
    const entry = DesignCatalog.resolve(snapshot, style.ref);
    const images = entry.images;
    const first: unknown = Array.isArray(images) ? images[0] : null;
    const file: unknown = first && typeof first === 'object' && !Array.isArray(first)
      ? (first as Readonly<Record<string, unknown>>).file : null;
    if (typeof file !== 'string' || !/^[a-zA-Z0-9_-]+\.png$/.test(file)) return { src: null, label };
    return { src: 'assets/images/thumbs/' + style.ref.id + '/' + file.replace(/\.png$/, '.webp'), label };
  }

  function choices(data: RecipeData.Loaded, recipe: DesignRecipes.Recipe, lang: DesignRecipes.Lang): RecipeView.Ready['choices'] {
    return Object.fromEntries(recipe.slots.map(slot => [slot.id, [slot.default, ...slot.alternatives].map(ref => ({
      ref, name: RecipeView.name(DesignCatalog.summarize(ref.domain, DesignCatalog.resolve(data.snapshot, ref)), lang)
    }))]));
  }

  export function mount({ root, getLang, openIsm }: MountOptions): Controller {
    if (!(root instanceof HTMLDetailsElement) || root.id !== 'recipe-workbench') {
      throw new Error('RecipeChooser requires details#recipe-workbench');
    }
    const workbench = root;
    const body = root.querySelector<HTMLElement>('.recipe-body');
    if (!body) throw new Error('RecipeChooser requires .recipe-body');
    const content = body;
    let lang = getLang();
    let state: RecipeView.State = 'idle';
    let notice: Notice = 'idle';
    let data: RecipeData.Loaded | null = null;
    let pending: Promise<void> | null = null;
    let aborter: AbortController | null = null;
    let generation = 0;
    let copyGeneration = 0;
    let disposed = false;
    let copying = false;
    let manual = false;
    let selectedRecipe = '';
    let composition: DesignRecipes.Composition | null = null;
    let guidanceOpen = false;
    const selections = new Map<string, Record<string, DesignCatalog.Ref>>();

    function focusTarget(key: string): HTMLElement | undefined {
      return Array.from(workbench.querySelectorAll<HTMLElement>('[data-focus]'))
        .find(node => node.dataset.focus === key);
    }

    function paint(): void {
      if (disposed) return;
      const active = document.activeElement;
      const focused = active instanceof HTMLElement && content.contains(active) ? active.dataset.focus : undefined;
      const range = active instanceof HTMLTextAreaElement && content.contains(active)
        ? { start: active.selectionStart, end: active.selectionEnd, scroll: active.scrollTop } : null;
      const disclosure = content.querySelector<HTMLDetailsElement>('[data-detail="guidance"]');
      if (disclosure) guidanceOpen = disclosure.open;
      let ready: RecipeView.Ready | null = null;
      if (state === 'ready' && data) {
        const recipe = DesignRecipes.detail(data.recipes, selectedRecipe);
        composition = DesignRecipes.compose(data.snapshot, data.recipes, {
          recipeId: selectedRecipe, lang, selections: selections.get(selectedRecipe) ?? {}
        });
        ready = { recipe, recipes: data.recipes, composition,
          choices: choices(data, recipe, lang), preview: preview(data.snapshot, composition) };
        workbench.dataset.version = composition.version;
      } else {
        composition = null;
        delete workbench.dataset.version;
      }
      workbench.dataset.state = state;
      RecipeView.localizeSummary(workbench, lang);
      RecipeView.render(content, { state, lang, ready, status: messages[notice][lang], copying,
        guidanceOpen, manualCopy: manual && composition ? DesignRecipes.formatBrief(composition) : null });
      // A language button outside this component keeps focus; only replaced controls
      // inside the open workbench are restored by their stable key.
      if (focused && workbench.open) {
        const target = focusTarget(focused) ?? focusTarget('workbench');
        target?.focus({ preventScroll: true });
        if (target instanceof HTMLTextAreaElement && range) {
          target.setSelectionRange(range.start, range.end); target.scrollTop = range.scroll;
        }
      }
    }

    function invalidateCopy(): void {
      copyGeneration++;
      copying = false;
      notice = manual ? 'manual' : state === 'ready' ? 'ready' : state;
    }

    function load(): Promise<void> {
      if (disposed || data) return Promise.resolve();
      if (pending) return pending;
      aborter?.abort();
      const request = new AbortController();
      aborter = request;
      const token = ++generation;
      invalidateCopy();
      state = 'loading'; notice = 'loading'; paint();
      pending = RecipeData.load({ signal: request.signal }).then(loaded => {
        if (disposed || token !== generation) return;
        data = loaded;
        selectedRecipe = data.recipes.some(recipe => recipe.id === selectedRecipe)
          ? selectedRecipe : data.recipes[0]?.id ?? '';
        state = 'ready'; notice = 'ready'; paint();
      }).catch(() => {
        if (disposed || token !== generation || request.signal.aborted) return;
        data = null; composition = null;
        state = 'error'; notice = 'error'; paint();
      }).finally(() => {
        if (token === generation) { pending = null; aborter = null; }
      });
      return pending;
    }

    function onToggle(event: Event): void {
      if (disposed || event.target !== workbench) return;
      RecipeView.localizeSummary(workbench, lang);
      if (workbench.open) { void load(); return; }
      // Closing does not discard the successful/pending data, but invalidates a
      // clipboard result so a later reopen cannot show a stale confirmation.
      if (copying) { invalidateCopy(); paint(); }
    }

    function onChange(event: Event): void {
      if (disposed || state !== 'ready' || !data) return;
      const target = event.target;
      if (target instanceof HTMLInputElement && target.name === 'recipe-choice') {
        if (!target.checked || !data.recipes.some(recipe => recipe.id === target.value)) return;
        selectedRecipe = target.value;
      } else if (target instanceof HTMLSelectElement && target.dataset.slot) {
        const recipe = DesignRecipes.detail(data.recipes, selectedRecipe);
        const slot = recipe.slots.find(item => item.id === target.dataset.slot);
        const allowed = slot && [slot.default, ...slot.alternatives].find(ref => RecipeView.refKey(ref) === target.value);
        if (!slot || !allowed) { paint(); return; }
        const previous = selections.get(selectedRecipe) ?? {};
        selections.set(selectedRecipe, { ...previous, [slot.id]: allowed });
      } else return;
      invalidateCopy(); notice = manual ? 'manual' : 'updated'; paint();
    }

    async function copy(): Promise<void> {
      if (disposed || copying || !composition || !workbench.open) return;
      const token = ++copyGeneration;
      const brief = DesignRecipes.formatBrief(composition);
      copying = true; notice = 'copying';
      RecipeView.feedback(content, messages[notice][lang], copying);
      try {
        if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
        await navigator.clipboard.writeText(brief);
        if (disposed || token !== copyGeneration || !workbench.open) return;
        copying = false; notice = 'copied';
        RecipeView.feedback(content, messages[notice][lang], copying);
      } catch {
        if (disposed || token !== copyGeneration || !workbench.open) return;
        const mayFocus = workbench.contains(document.activeElement);
        copying = false; manual = true; notice = 'manual'; paint();
        const textarea = content.querySelector<HTMLTextAreaElement>('.recipe-manual-copy textarea');
        if (mayFocus && textarea) { textarea.focus({ preventScroll: true }); textarea.select(); }
      }
    }

    function onClick(event: MouseEvent): void {
      if (disposed || !(event.target instanceof Element)) return;
      const action = event.target.closest<HTMLButtonElement>('button[data-action]');
      if (action && content.contains(action)) {
        if (action.dataset.action === 'copy') void copy();
        if (action.dataset.action === 'retry' && state === 'error') {
          generation++; aborter?.abort(); pending = null; data = null;
          void load();
        }
        return;
      }
      const link = event.target.closest<HTMLAnchorElement>('a[data-domain="isms"][data-id]');
      if (!link || !content.contains(link) || !data || event.defaultPrevented || event.button !== 0
        || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey
        || link.hasAttribute('download') || (link.target && link.target !== '_self')) return;
      const id = link.dataset.id;
      if (!id || !composition?.slots.some(slot => slot.ref.domain === 'isms' && slot.ref.id === id)) return;
      if (copying) {
        invalidateCopy();
        RecipeView.feedback(content, messages[notice][lang], copying);
      }
      event.preventDefault(); openIsm(id, link);
    }

    function onImageError(event: Event): void {
      const image = event.target;
      if (!disposed && image instanceof HTMLImageElement && content.contains(image)
        && image.closest('.recipe-preview')) RecipeView.imageFailed(image, lang);
    }

    function setLang(next: DesignRecipes.Lang): void {
      if (disposed || next === lang || (next !== 'ko' && next !== 'en')) return;
      lang = next; invalidateCopy(); paint();
    }

    function dispose(): void {
      if (disposed) return;
      disposed = true; generation++; copyGeneration++;
      aborter?.abort(); aborter = null; pending = null; data = null; composition = null;
      selections.clear();
      workbench.removeEventListener('toggle', onToggle);
      workbench.removeEventListener('change', onChange);
      workbench.removeEventListener('click', onClick);
      workbench.removeEventListener('error', onImageError, true);
    }

    workbench.addEventListener('toggle', onToggle);
    workbench.addEventListener('change', onChange);
    workbench.addEventListener('click', onClick);
    workbench.addEventListener('error', onImageError, true);
    paint();
    // A user can open the static disclosure before app.js finishes mounting.
    if (workbench.open) void load();
    return { setLang, dispose };
  }
}
