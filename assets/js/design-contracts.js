"use strict";
/** Pure catalog contracts. Load before design-catalog/search/views classic scripts. */
var DesignCatalog;
(function (DesignCatalog) {
    DesignCatalog.CONTRACT_VERSION = 'design-catalog/2';
    class CatalogError extends Error {
        constructor(code, message) {
            super(message);
            this.code = code;
            this.name = 'CatalogError';
        }
    }
    DesignCatalog.CatalogError = CatalogError;
    DesignCatalog.DOMAINS = Object.freeze([
        'isms', 'effects', 'color', 'typography', 'layout', 'motion'
    ]);
    DesignCatalog.SOURCE_FILES = Object.freeze([
        ...DesignCatalog.DOMAINS.map(domain => `assets/data/${domain}.json`),
        'assets/data/recipes.json', 'assets/data/dev-guides.json',
        'assets/data/effects-docs.json', 'assets/data/effects-snippets.json'
    ].sort());
    /** Shared ingress rules for the catalog's classic-script files, not retrieval APIs. */
    let Boundary;
    (function (Boundary) {
        function fail(code, message) {
            throw new CatalogError(code, message);
        }
        Boundary.fail = fail;
        function record(value, label, code) {
            if (value === null || typeof value !== 'object' || Array.isArray(value)) {
                return fail(code, `${label} must be an object`);
            }
            const prototype = Object.getPrototypeOf(value);
            // Accept plain JSON records from either realm, but not class instances.
            if (prototype !== null) {
                const constructor = Object.getOwnPropertyDescriptor(prototype, 'constructor')?.value;
                if (Object.getPrototypeOf(prototype) !== null || typeof constructor !== 'function'
                    || Object.getOwnPropertyDescriptor(constructor, 'name')?.value !== 'Object'
                    || Object.getOwnPropertyDescriptor(constructor, 'prototype')?.value !== prototype) {
                    return fail(code, `${label} must be a plain object`);
                }
            }
            // Detach own data fields so inherited values can never supply omitted arguments.
            const fields = Object.create(null);
            for (const key of Reflect.ownKeys(value)) {
                const descriptor = Object.getOwnPropertyDescriptor(value, key);
                if (typeof key !== 'string' || !descriptor?.enumerable || !('value' in descriptor)) {
                    return fail(code, `${label} must contain enumerable JSON data fields`);
                }
                fields[key] = descriptor.value;
            }
            return Object.freeze(fields);
        }
        Boundary.record = record;
        function keys(value, allowed, code) {
            for (const key of Reflect.ownKeys(value)) {
                if (typeof key !== 'string' || !allowed.includes(key))
                    fail(code, 'Unknown argument field');
                const descriptor = Object.getOwnPropertyDescriptor(value, key);
                if (!descriptor || !('value' in descriptor))
                    fail(code, 'Accessor fields are not supported');
            }
        }
        Boundary.keys = keys;
        function text(value, label, code, max = Infinity) {
            if (typeof value !== 'string' || !value.trim() || value.length > max) {
                return fail(code, `${label} must be a nonempty string within its length limit`);
            }
            return value;
        }
        Boundary.text = text;
        function id(value, code) {
            const result = text(value, 'id', code, 128);
            if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(result))
                fail(code, 'Invalid catalog id');
            return result;
        }
        Boundary.id = id;
        function domain(value, code) {
            if (typeof value !== 'string' || !DesignCatalog.DOMAINS.includes(value)) {
                return fail(code, 'Unknown catalog domain');
            }
            return value;
        }
        Boundary.domain = domain;
        function strings(value, label, code) {
            if (!Array.isArray(value) || !value.every(item => typeof item === 'string' && item.trim())) {
                fail(code, `${label} must be an array of nonempty strings`);
            }
        }
        Boundary.strings = strings;
    })(Boundary = DesignCatalog.Boundary || (DesignCatalog.Boundary = {}));
})(DesignCatalog || (DesignCatalog = {}));
