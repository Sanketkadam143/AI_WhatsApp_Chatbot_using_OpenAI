import { BaseEntityStore } from "../../../schema/index.js";
export class InMemoryEntityStore extends BaseEntityStore {
    constructor() {
        super();
        Object.defineProperty(this, "lc_namespace", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: ["langchain", "stores", "entity", "in_memory"]
        });
        Object.defineProperty(this, "store", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.store = Object.create(null);
    }
    async get(key, defaultValue) {
        return key in this.store ? this.store[key] : defaultValue;
    }
    async set(key, value) {
        this.store[key] = value;
    }
    async delete(key) {
        delete this.store[key];
    }
    async exists(key) {
        return key in this.store;
    }
    async clear() {
        this.store = Object.create(null);
    }
}