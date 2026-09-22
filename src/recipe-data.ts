/** Browser IO for the shared catalog. The mounting controller owns cache and lifetime. */
namespace RecipeData {
  export interface Loaded {
    readonly snapshot: DesignCatalog.Snapshot;
    readonly recipes: readonly DesignRecipes.Recipe[];
  }
  export interface LoadOptions { readonly signal?: AbortSignal; }

  async function sha256(bytes: ArrayBuffer | Uint8Array<ArrayBuffer>): Promise<string> {
    const digest = await crypto.subtle.digest('SHA-256', bytes);
    return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
  }

  export async function load({ signal }: LoadOptions = {}): Promise<Loaded> {
    const controller = new AbortController();
    const abort = (): void => controller.abort();
    signal?.addEventListener('abort', abort, { once: true });
    if (signal?.aborted) controller.abort();
    const checkAborted = (): void => {
      if (controller.signal.aborted) throw new DOMException('Recipe load aborted', 'AbortError');
    };
    try {
      checkAborted();
      // Hash the exact fetched bytes, not a parse/stringify approximation. Raw buffers
      // are released after each digest and parse; no second snapshot lives in a cache.
      const records = await Promise.all(DesignCatalog.SOURCE_FILES.map(async path => {
        const response = await fetch(path, { signal: controller.signal });
        if (!response.ok) throw new Error('Unable to load recipe source: ' + path);
        const bytes = await response.arrayBuffer();
        checkAborted();
        const hash = await sha256(bytes);
        checkAborted();
        const value: unknown = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
        return { path, hash, value };
      }));
      checkAborted();
      // SOURCE_FILES is the same sorted allowlist used by snapshotFromFiles in Node.
      const pairs = records.map(({ path, hash }) => [path, hash]);
      const version = await sha256(new TextEncoder().encode(JSON.stringify([
        DesignCatalog.CONTRACT_VERSION, ...pairs
      ])));
      checkAborted();
      const values = new Map(records.map(({ path, value }) => [path, value]));
      // create() validates the JSON payload and detaches/freeze-copies it before use.
      const catalogs = Object.fromEntries(DesignCatalog.DOMAINS.map(domain => [
        domain, values.get('assets/data/' + domain + '.json')
      ])) as DesignCatalog.CatalogPayload;
      const snapshot = DesignCatalog.create({
        contractVersion: DesignCatalog.CONTRACT_VERSION, version, catalogs,
        recipes: values.get('assets/data/recipes.json'),
        guides: values.get('assets/data/dev-guides.json'),
        effectDocs: values.get('assets/data/effects-docs.json'),
        effectSnippets: values.get('assets/data/effects-snippets.json')
      });
      const recipes = DesignRecipes.parse(snapshot.recipes, snapshot);
      checkAborted();
      return Object.freeze({ snapshot, recipes });
    } catch (error: unknown) {
      // A failed sibling must not leave the other nine requests running.
      controller.abort();
      throw error;
    } finally {
      signal?.removeEventListener('abort', abort);
    }
  }
}
