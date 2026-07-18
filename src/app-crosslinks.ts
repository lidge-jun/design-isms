// AppCrosslinks — reverse "related catalog" section for ISM modals.
// Lazily loads the four catalog data files once, builds an ISM-id reverse
// index, and hydrates the modal mount without blocking modal open.
namespace AppCrosslinks {
  interface CatalogLink { domain: string; page: string; id: string; name: string; nameKr: string; }

  const DOMAINS: Array<{ domain: string; label: string; page: string; data: string }> = [
    { domain: 'color', label: 'Color', page: 'color.html', data: './assets/data/color.json' },
    { domain: 'typography', label: 'Typography', page: 'typography.html', data: './assets/data/typography.json' },
    { domain: 'layout', label: 'Layout', page: 'layout.html', data: './assets/data/layout.json' },
    { domain: 'motion', label: 'Motion', page: 'motion.html', data: './assets/data/motion.json' }
  ];

  let loadPromise: Promise<Map<string, CatalogLink[]>> | null = null;

  function escapeHtml(value: string): string {
    return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
  }

  async function buildIndex(): Promise<Map<string, CatalogLink[]>> {
    const index = new Map<string, CatalogLink[]>();
    const payloads = await Promise.all(DOMAINS.map(async (domain) => {
      const response = await fetch(domain.data);
      if (!response.ok) throw new Error(`${domain.domain}: HTTP ${response.status}`);
      return { domain, items: await response.json() as Array<Record<string, unknown>> };
    }));
    for (const { domain, items } of payloads) {
      for (const item of items) {
        const related = item.relatedIsms;
        if (!Array.isArray(related)) continue;
        for (const ismId of related) {
          if (typeof ismId !== 'string' || ismId === 'ai-slop') continue;
          const list = index.get(ismId) ?? [];
          list.push({ domain: domain.domain, page: domain.page, id: String(item.id), name: String(item.name), nameKr: String(item.nameKr) });
          index.set(ismId, list);
        }
      }
    }
    return index;
  }

  function load(): Promise<Map<string, CatalogLink[]>> {
    if (!loadPromise) {
      loadPromise = buildIndex().catch((error) => {
        loadPromise = null;
        throw error;
      });
    }
    return loadPromise;
  }

  export function renderMount(ismId: string): string {
    return `<div id="ism-catalog-links" data-crosslinks-state="loading" data-ism-id="${escapeHtml(ismId)}"></div>`;
  }

  export async function hydrate(content: HTMLElement, ismId: string): Promise<void> {
    const mount = content.querySelector<HTMLElement>('#ism-catalog-links');
    if (!mount) return;
    try {
      const index = await load();
      if (mount.dataset.ismId !== ismId || !mount.isConnected) return;
      const links = index.get(ismId) ?? [];
      if (links.length === 0) { mount.remove(); return; }
      const byDomain = new Map<string, CatalogLink[]>();
      for (const link of links) {
        const list = byDomain.get(link.domain) ?? [];
        list.push(link);
        byDomain.set(link.domain, list);
      }
      const groups = DOMAINS.filter((domain) => byDomain.has(domain.domain)).map((domain) => {
        const chips = (byDomain.get(domain.domain) ?? []).map((link) =>
          `<a class="crosslink-chip" href="./${link.page}#${escapeHtml(link.id)}">${escapeHtml(link.name)}</a>`).join('');
        return `<div class="crosslink-group"><span class="crosslink-domain">${domain.label}</span>${chips}</div>`;
      }).join('');
      mount.outerHTML = `<section class="ism-catalog-links" id="ism-catalog-links" data-crosslinks-state="ready" data-ism-id="${escapeHtml(ismId)}" aria-label="관련 카탈로그">
        <div class="modal-section-title">관련 카탈로그</div>${groups}</section>`;
    } catch (error) {
      console.error('[crosslinks] hydrate failed', error);
      if (mount.isConnected) mount.setAttribute('data-crosslinks-state', 'error');
    }
  }
}
