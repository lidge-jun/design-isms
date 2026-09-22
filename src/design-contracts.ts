/** Pure catalog contracts. Load before design-catalog/search/views classic scripts. */
namespace DesignCatalog {
  export const CONTRACT_VERSION = 'design-catalog/1';
  export type Domain = 'isms' | 'effects' | 'color' | 'typography' | 'layout' | 'motion';
  export interface Ref { readonly domain: Domain; readonly id: string; }
  export type Entry = Readonly<Record<string, unknown>>;
  export interface Summary {
    readonly ref: Ref;
    readonly name: string;
    readonly nameKr: string;
    readonly summary: string;
    readonly kind?: 'style' | 'anti-pattern';
  }
  export type CatalogPayload = Readonly<Record<Domain, readonly Entry[]>>;
  export interface SourceSnapshot {
    readonly contractVersion: string;
    readonly version: string;
    readonly catalogs: CatalogPayload;
    readonly recipes: unknown;
    readonly guides: unknown;
    readonly effectDocs: unknown;
    readonly effectSnippets: unknown;
  }
  export interface Snapshot extends SourceSnapshot {
    readonly guides: Readonly<Record<string, Entry>>;
    readonly effectDocs: Readonly<Record<string, Entry>>;
    readonly effectSnippets: Entry & { readonly snippets: Readonly<Record<string, Entry>> };
  }
  export type View = 'summary' | 'guide' | 'code' | 'full';
  export interface GetArgs extends Ref { readonly view?: View; }
  export interface GetResult {
    readonly version: string;
    readonly ref: Ref;
    readonly view: View;
    readonly data: Entry | Summary;
  }
  export interface SearchArgs {
    readonly query?: string;
    readonly domains?: readonly Domain[];
    readonly limit?: number;
    readonly cursor?: string;
  }
  export interface SearchPage {
    readonly version: string;
    readonly total: number;
    readonly items: readonly Summary[];
    readonly nextCursor: string | null;
    readonly complete: boolean;
  }
  export type ErrorCode = 'INVALID_ARGUMENT' | 'INVALID_SNAPSHOT' | 'DUPLICATE_REF'
    | 'UNKNOWN_REFERENCE' | 'INVALID_CURSOR' | 'STALE_CURSOR' | 'VIEW_UNAVAILABLE';
  export class CatalogError extends Error {
    constructor(readonly code: ErrorCode, message: string) {
      super(message);
      this.name = 'CatalogError';
    }
  }
  export const DOMAINS: readonly Domain[] = Object.freeze([
    'isms', 'effects', 'color', 'typography', 'layout', 'motion'
  ]);
  export const SOURCE_FILES: readonly string[] = Object.freeze([
    ...DOMAINS.map(domain => `assets/data/${domain}.json`),
    'assets/data/recipes.json', 'assets/data/dev-guides.json',
    'assets/data/effects-docs.json', 'assets/data/effects-snippets.json'
  ].sort());

  /** Shared ingress rules for the catalog's classic-script files, not retrieval APIs. */
  export namespace Boundary {
    export function fail(code: ErrorCode, message: string): never {
      throw new CatalogError(code, message);
    }
    export function record(value: unknown, label: string, code: ErrorCode): Entry {
      if (value === null || typeof value !== 'object' || Array.isArray(value)) {
        return fail(code, `${label} must be an object`);
      }
      const prototype: unknown = Object.getPrototypeOf(value);
      // Accept plain JSON records from either realm, but not class instances.
      if (prototype !== null) {
        const constructor = Object.getOwnPropertyDescriptor(prototype, 'constructor')?.value as unknown;
        if (Object.getPrototypeOf(prototype) !== null || typeof constructor !== 'function'
          || Object.getOwnPropertyDescriptor(constructor, 'name')?.value !== 'Object'
          || Object.getOwnPropertyDescriptor(constructor, 'prototype')?.value !== prototype) {
          return fail(code, `${label} must be a plain object`);
        }
      }
      // Detach own data fields so inherited values can never supply omitted arguments.
      const fields = Object.create(null) as Record<string, unknown>;
      for (const key of Reflect.ownKeys(value)) {
        const descriptor = Object.getOwnPropertyDescriptor(value, key);
        if (typeof key !== 'string' || !descriptor?.enumerable || !('value' in descriptor)) {
          return fail(code, `${label} must contain enumerable JSON data fields`);
        }
        fields[key] = descriptor.value as unknown;
      }
      return Object.freeze(fields);
    }
    export function keys(value: Entry, allowed: readonly string[], code: ErrorCode): void {
      for (const key of Reflect.ownKeys(value)) {
        if (typeof key !== 'string' || !allowed.includes(key)) fail(code, 'Unknown argument field');
        const descriptor = Object.getOwnPropertyDescriptor(value, key);
        if (!descriptor || !('value' in descriptor)) fail(code, 'Accessor fields are not supported');
      }
    }
    export function text(value: unknown, label: string, code: ErrorCode, max = Infinity): string {
      if (typeof value !== 'string' || !value.trim() || value.length > max) {
        return fail(code, `${label} must be a nonempty string within its length limit`);
      }
      return value;
    }
    export function id(value: unknown, code: ErrorCode): string {
      const result = text(value, 'id', code, 128);
      if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(result)) fail(code, 'Invalid catalog id');
      return result;
    }
    export function domain(value: unknown, code: ErrorCode): Domain {
      if (typeof value !== 'string' || !DOMAINS.includes(value as Domain)) {
        return fail(code, 'Unknown catalog domain');
      }
      return value as Domain;
    }
    export function strings(value: unknown, label: string, code: ErrorCode): void {
      if (!Array.isArray(value) || !value.every(item => typeof item === 'string' && item.trim())) {
        fail(code, `${label} must be an array of nonempty strings`);
      }
    }
  }
}
