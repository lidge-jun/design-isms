namespace EffectsDocs {
  const DATA_VERSION = '2026-05-10-ism43-curated-ui';
  const DATA_URL = `./assets/data/effects-docs.json?v=${DATA_VERSION}`;

  export interface EffectDocs {
    background: string;
    history: string;
    useWhen: string[];
    examples: Array<{ context: string; description: string }>;
    anatomy: string[];
    misuse: string[];
    implementationNotes: string[];
    researchRefs: Array<{ label: string; url: string }>;
  }

  export type DocsMap = Map<string, EffectDocs>;

  export async function load(): Promise<DocsMap> {
    try {
      const response = await fetch(DATA_URL);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const raw: unknown = await response.json();
      return parseDocs(raw);
    } catch (error) {
      console.error('[effects-docs] load failed', error);
      return new Map();
    }
  }

  export function render(effectId: string, docs: EffectDocs | null): string {
    if (!docs) {
      return `<section class="effect-docs-missing" data-effect-doc-id="${escapeAttr(effectId)}">상세 해설 문서가 아직 연결되지 않았습니다.</section>`;
    }

    return `<section class="effect-docs-panel" aria-label="Effect background guide">
      <div class="effect-docs-header"><span>Docs</span><h3>배경과 사용 맥락</h3></div>
      <div class="effect-docs-block"><h4>Background</h4><p>${escapeHtml(docs.background)}</p></div>
      <div class="effect-docs-block"><h4>Short history</h4><p>${escapeHtml(docs.history)}</p></div>
      <div class="effect-docs-columns">
        ${renderListBlock('When to use', docs.useWhen)}
        ${renderListBlock('Misuse', docs.misuse)}
      </div>
      <div class="effect-docs-block"><h4>Examples</h4>${renderExamples(docs.examples)}</div>
      <div class="effect-docs-columns">
        ${renderListBlock('Anatomy', docs.anatomy)}
        ${renderListBlock('Implementation notes', docs.implementationNotes)}
      </div>
      <div class="effect-docs-block"><h4>Research references</h4>${renderRefs(docs.researchRefs)}</div>
    </section>`;
  }

  function parseDocs(raw: unknown): DocsMap {
    if (!isRecord(raw)) throw new Error('effects-docs.json must be an object');
    const docs = new Map<string, EffectDocs>();
    for (const [id, value] of Object.entries(raw)) {
      docs.set(id, parseDoc(value, id));
    }
    return docs;
  }

  function parseDoc(value: unknown, id: string): EffectDocs {
    const record = asRecord(value, id);
    return {
      background: readString(record, 'background'),
      history: readString(record, 'history'),
      useWhen: readStringArray(record, 'useWhen'),
      examples: readExamples(record.examples, id),
      anatomy: readStringArray(record, 'anatomy'),
      misuse: readStringArray(record, 'misuse'),
      implementationNotes: readStringArray(record, 'implementationNotes'),
      researchRefs: readRefs(record.researchRefs, id)
    };
  }

  function readExamples(value: unknown, id: string): Array<{ context: string; description: string }> {
    if (!Array.isArray(value)) throw new Error(`${id}.examples must be an array`);
    return value.map((item, index) => {
      const record = asRecord(item, `${id}.examples[${index}]`);
      return { context: readString(record, 'context'), description: readString(record, 'description') };
    });
  }

  function readRefs(value: unknown, id: string): Array<{ label: string; url: string }> {
    if (!Array.isArray(value)) throw new Error(`${id}.researchRefs must be an array`);
    return value.map((item, index) => {
      const record = asRecord(item, `${id}.researchRefs[${index}]`);
      return { label: readString(record, 'label'), url: readString(record, 'url') };
    });
  }

  function renderListBlock(title: string, items: string[]): string {
    return `<div class="effect-docs-block"><h4>${escapeHtml(title)}</h4><ul>${items.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul></div>`;
  }

  function renderExamples(items: Array<{ context: string; description: string }>): string {
    return `<div class="effect-docs-examples">${items.map((item) => `<article><strong>${escapeHtml(item.context)}</strong><p>${escapeHtml(item.description)}</p></article>`).join('')}</div>`;
  }

  function renderRefs(items: Array<{ label: string; url: string }>): string {
    return `<div class="effect-docs-refs">${items.map((item) => `<a href="${escapeAttr(item.url)}" target="_blank" rel="noopener">${escapeHtml(item.label)}</a>`).join('')}</div>`;
  }

  function asRecord(value: unknown, context: string): Record<string, unknown> {
    if (!isRecord(value)) throw new Error(`${context} must be an object`);
    return value;
  }

  function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
  }

  function readString(record: Record<string, unknown>, key: string): string {
    const value = record[key];
    if (typeof value !== 'string' || value.trim() === '') throw new Error(`${key} must be a non-empty string`);
    return value;
  }

  function readStringArray(record: Record<string, unknown>, key: string): string[] {
    const value = record[key];
    if (!Array.isArray(value) || value.some((item) => typeof item !== 'string' || item.trim() === '')) {
      throw new Error(`${key} must be a string array`);
    }
    return value;
  }

  function escapeHtml(value: string): string {
    return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
  }

  function escapeAttr(value: string): string {
    return escapeHtml(value);
  }
}
