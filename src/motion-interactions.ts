namespace MotionInteractions {
  export interface Controller { dispose(): void }

  const EXIT_EASE = 'cubic-bezier(.22,1,.36,1)';
  let instance = 0;

  // Logical state lives in the controls/DOM. Effects never hold a pending state change.
  class Lifetime implements Controller {
    readonly events = new AbortController();
    readonly media = window.matchMedia('(prefers-reduced-motion: reduce)');
    readonly animations = new Map<HTMLElement, Animation>();
    readonly cleanup: (() => void)[] = [];
    disposed = false;
    onReduce = (): void => {};

    constructor() {
      this.media.addEventListener('change', () => {
        if (!this.media.matches) return;
        this.cancelAll();
        this.onReduce();
      }, { signal: this.events.signal });
    }

    listen(target: EventTarget, type: string, action: (event: Event) => void): void {
      target.addEventListener(type, action, { signal: this.events.signal });
    }

    cancel(node: HTMLElement): void {
      const animation = this.animations.get(node);
      if (!animation) return;
      animation.onfinish = null;
      animation.cancel();
      this.animations.delete(node);
    }

    cancelAll(): void {
      [...this.animations.keys()].forEach(node => this.cancel(node));
    }

    animate(node: HTMLElement, frames: Keyframe[], duration: number, easing = EXIT_EASE): void {
      this.cancel(node);
      if (this.disposed || this.media.matches) return;
      const animation = node.animate(frames, { duration, easing });
      this.animations.set(node, animation);
      animation.onfinish = () => this.cancel(node);
    }

    dispose(): void {
      if (this.disposed) return;
      this.disposed = true;
      this.events.abort();
      this.cleanup.forEach(disconnect => disconnect());
      this.cleanup.length = 0;
      this.cancelAll();
      this.onReduce = (): void => {};
      // No timers or animation frames are scheduled; WAAPI owns effect timing.
    }
  }

  function progress(root: HTMLElement, life: Lifetime, uid: string): void {
    root.innerHTML = `<h3 class="mi-title">읽기 목표</h3>
      <p class="mi-hint">슬라이더를 움직여 목표 진행률을 바꿔 보세요.</p>
      <div class="mi-value-row"><label for="${uid}-range">진행률</label>
        <output class="mi-value" for="${uid}-range" aria-live="off">35%</output></div>
      <div class="mi-progress" role="progressbar" aria-label="목표 진행률" aria-valuemin="0" aria-valuemax="100" aria-valuenow="35">
        <span class="mi-progress-fill" aria-hidden="true"></span></div>
      <input id="${uid}-range" class="mi-range" type="range" min="0" max="100" step="1" value="35">
      <div class="mi-range-ends" aria-hidden="true"><span>0%</span><span>100%</span></div>`;
    const range = root.querySelector<HTMLInputElement>('.mi-range')!;
    const output = root.querySelector<HTMLOutputElement>('output')!;
    const bar = root.querySelector<HTMLElement>('[role="progressbar"]')!;
    const fill = root.querySelector<HTMLElement>('.mi-progress-fill')!;
    fill.style.transform = 'scaleX(0.35)';
    life.listen(range, 'input', () => {
      const from = getComputedStyle(fill).transform;
      const value = range.valueAsNumber;
      output.textContent = `${value}%`;
      bar.setAttribute('aria-valuenow', String(value));
      const to = `scaleX(${value / 100})`;
      fill.style.transform = to;
      life.animate(fill, [{ transform: from }, { transform: to }], 1600, 'cubic-bezier(.65,0,.35,1)');
    });
  }

  function scrollReveal(root: HTMLElement, life: Lifetime, uid: string): void {
    const entries = [
      ['관찰', '누가 어떤 상황에서 사용하는지 기록합니다.'],
      ['질문', '사용자가 멈추는 지점과 그 이유를 찾습니다.'],
      ['시안', '가장 중요한 흐름부터 화면으로 옮깁니다.'],
      ['검증', '실제 조작을 관찰하고 막히는 부분을 고칩니다.'],
      ['기록', '선택한 방법과 남은 질문을 함께 남깁니다.']
    ];
    root.innerHTML = `<h3 class="mi-title" id="${uid}-title">디자인 과정</h3>
      <p class="mi-hint" id="${uid}-hint">아래 영역을 스크롤하세요. 키보드로는 영역에 초점을 둔 뒤 방향키를 누르세요.</p>
      <div class="mi-scroll" role="region" tabindex="0" aria-labelledby="${uid}-title" aria-describedby="${uid}-hint">
        <ol class="mi-reveal-list" role="list">${entries.map(([title, body], i) => `<li class="mi-reveal-item" data-revealed="true">
          <span class="mi-step">0${i + 1}</span><div><strong>${title}</strong><p>${body}</p></div></li>`).join('')}</ol>
      </div>`;
    const viewport = root.querySelector<HTMLElement>('.mi-scroll')!;
    const items = [...root.querySelectorAll<HTMLElement>('.mi-reveal-item')];
    if (life.media.matches || typeof IntersectionObserver === 'undefined') return;
    items.forEach(item => { item.dataset.revealed = 'false'; });
    const observer = new IntersectionObserver(entries => {
      if (life.disposed || life.media.matches) return;
      entries.forEach(entry => {
        const item = entry.target as HTMLElement;
        if (!entry.isIntersecting || item.dataset.revealed === 'true') return;
        item.dataset.revealed = 'true';
        observer.unobserve(item);
        life.animate(item, [
          { opacity: 0, transform: 'translateY(18px)' },
          { opacity: 1, transform: 'translateY(0)' }
        ], 420);
      });
    }, { root: viewport, threshold: 0.12 });
    items.forEach(item => observer.observe(item));
    life.onReduce = () => {
      observer.disconnect();
      items.forEach(item => { item.dataset.revealed = 'true'; });
    };
    life.cleanup.push(() => observer.disconnect());
  }

  function disclosure(root: HTMLElement, life: Lifetime, uid: string): void {
    root.innerHTML = `<h3 class="mi-title">방문 안내</h3>
      <p class="mi-hint">전시 관람에 필요한 정보를 펼쳐 보세요.</p>
      <button type="button" class="mi-disclosure-toggle" aria-expanded="false" aria-controls="${uid}-details">
        <span>관람 정보</span><span class="mi-disclosure-action">펼치기</span></button>
      <div class="mi-disclosure-shell"><div class="mi-disclosure-body" id="${uid}-details" hidden>
        <dl><div><dt>관람 시간</dt><dd>화–일 10:00–18:00</dd></div>
          <div><dt>쉬는 날</dt><dd>매주 월요일</dd></div>
          <div><dt>입장 마감</dt><dd>종료 30분 전</dd></div></dl>
      </div></div>`;
    const button = root.querySelector<HTMLButtonElement>('.mi-disclosure-toggle')!;
    const action = root.querySelector<HTMLElement>('.mi-disclosure-action')!;
    const shell = root.querySelector<HTMLElement>('.mi-disclosure-shell')!;
    const body = root.querySelector<HTMLElement>('.mi-disclosure-body')!;
    life.listen(button, 'click', () => {
      const from = shell.getBoundingClientRect().height;
      life.cancel(shell);
      body.hidden = !body.hidden;
      button.setAttribute('aria-expanded', String(!body.hidden));
      action.textContent = body.hidden ? '펼치기' : '접기';
      const to = shell.getBoundingClientRect().height;
      // Local height interpolation is intentional: this recipe changes real layout.
      life.animate(shell, [{ height: `${from}px` }, { height: `${to}px` }], 280, 'cubic-bezier(.42,0,.58,1)');
    });
  }

  function tabs(root: HTMLElement, life: Lifetime, uid: string): void {
    root.innerHTML = `<h3 class="mi-title">전시 노트</h3>
      <p class="mi-hint">탭을 선택해 소개와 관람 안내를 확인하세요.</p>
      <div class="mi-tabs" role="tablist" aria-label="전시 노트">
        <button type="button" role="tab" id="${uid}-tab-0" aria-controls="${uid}-panel-0" aria-selected="true" tabindex="0">전시 소개</button>
        <button type="button" role="tab" id="${uid}-tab-1" aria-controls="${uid}-panel-1" aria-selected="false" tabindex="-1">관람 안내</button>
      </div>
      <div class="mi-tab-panel" role="tabpanel" id="${uid}-panel-0" aria-labelledby="${uid}-tab-0" tabindex="0">
        <strong>일상의 형태</strong><p>사물의 비례와 재료를 살펴보는 디자인 전시입니다. 익숙한 물건을 새로운 시선으로 만나 보세요.</p></div>
      <div class="mi-tab-panel" role="tabpanel" id="${uid}-panel-1" aria-labelledby="${uid}-tab-1" tabindex="0" hidden>
        <strong>천천히 둘러보세요</strong><p>관람에는 약 40분이 걸립니다. 작품 사이의 통로를 비워 두고, 사진은 플래시 없이 촬영해 주세요.</p></div>`;
    const buttons = [...root.querySelectorAll<HTMLButtonElement>('[role="tab"]')];
    const panels = [...root.querySelectorAll<HTMLElement>('[role="tabpanel"]')];
    const select = (index: number): void => {
      const target = buttons[index]!;
      target.focus({ preventScroll: true });
      if (target.getAttribute('aria-selected') === 'true') return;
      buttons.forEach((button, i) => {
        button.setAttribute('aria-selected', String(i === index));
        button.tabIndex = i === index ? 0 : -1;
        life.cancel(panels[i]!);
        panels[i]!.hidden = i !== index;
      });
      life.animate(panels[index]!, [
        { opacity: 0.35, transform: 'translateY(8px)' },
        { opacity: 1, transform: 'translateY(0)' }
      ], 220);
    };
    buttons.forEach((button, i) => {
      life.listen(button, 'click', () => select(i));
      life.listen(button, 'keydown', event => {
        const key = (event as KeyboardEvent).key;
        let next: number;
        if (key === 'ArrowRight') next = (i + 1) % buttons.length;
        else if (key === 'ArrowLeft') next = (i + buttons.length - 1) % buttons.length;
        else if (key === 'Home') next = 0;
        else if (key === 'End') next = buttons.length - 1;
        else return;
        event.preventDefault();
        select(next);
      });
    });
  }

  function reorder(root: HTMLElement, life: Lifetime): void {
    root.innerHTML = `<h3 class="mi-title">이번 주 읽을거리</h3>
      <p class="mi-hint">다음 글을 맨 앞으로 옮겨 읽는 순서를 바꿔 보세요.</p>
      <button type="button" class="mi-reorder-toggle">다음 글 먼저 보기</button>
      <ol class="mi-reorder-list" role="list" aria-label="읽는 순서">
        <li data-item="type"><strong>글자의 표정</strong><span>타이포그래피 · 5분</span></li>
        <li data-item="color"><strong>색의 온도</strong><span>컬러 · 3분</span></li>
        <li data-item="space"><strong>여백의 역할</strong><span>레이아웃 · 4분</span></li>
      </ol><p class="mi-status" role="status" aria-atomic="true">첫 번째 글: 글자의 표정</p>`;
    const button = root.querySelector<HTMLButtonElement>('.mi-reorder-toggle')!;
    const list = root.querySelector<HTMLOListElement>('.mi-reorder-list')!;
    const status = root.querySelector<HTMLElement>('.mi-status')!;
    life.listen(button, 'click', () => {
      const items = [...list.querySelectorAll<HTMLElement>('li')];
      // Read painted positions before cancelling, so rapid input continues from this frame.
      const before = new Map(items.map(item => [item, item.getBoundingClientRect()]));
      items.forEach(item => life.cancel(item));
      list.append(items[0]!);
      items.forEach(item => {
        const old = before.get(item)!;
        const now = item.getBoundingClientRect();
        life.animate(item, [
          { transform: `translate(${old.left - now.left}px, ${old.top - now.top}px)` },
          { transform: 'translate(0, 0)' }
        ], 300);
      });
      status.textContent = `첫 번째 글: ${list.querySelector('strong')!.textContent}`;
      button.focus({ preventScroll: true });
    });
  }

  export function mount(container: HTMLElement, id: string): Controller | null {
    const builders: Record<string, (root: HTMLElement, life: Lifetime, uid: string) => void> = {
      'motion-progress': progress,
      'motion-scroll-reveal': scrollReveal,
      'motion-expand-collapse': disclosure,
      'motion-tab-transition': tabs,
      'motion-list-reorder': reorder
    };
    if (!Object.prototype.hasOwnProperty.call(builders, id)) return null;
    const root = document.createElement('section');
    root.className = 'motion-interaction';
    root.dataset.interaction = id;
    container.replaceChildren(root);
    const life = new Lifetime();
    builders[id]!(root, life, `mi-${++instance}`);
    return life;
  }
}
