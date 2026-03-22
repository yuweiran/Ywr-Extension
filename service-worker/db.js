/**
 * Service Worker 端 IndexedDB 懒初始化模块
 * 复用 tab 页的 IndexedModel 类和模型定义
 */

class IndexedModel {
  constructor(db, modelName) {
    this.database = db;
    this.model = modelName;
  }

  add(record) {
    return new Promise((resolve, reject) => {
      const store = this.database
        .transaction([this.model], "readwrite")
        .objectStore(this.model);
      record.id = Date.now();
      const req = store.add(record);
      req.onsuccess = () => resolve(record);
      req.onerror = () => reject(req.error);
    });
  }

  delete(id) {
    return new Promise((resolve, reject) => {
      const store = this.database
        .transaction([this.model], "readwrite")
        .objectStore(this.model);
      const req = store.delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  clearAll() {
    return new Promise((resolve, reject) => {
      const store = this.database
        .transaction([this.model], "readwrite")
        .objectStore(this.model);
      const req = store.clear();
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  list(condition = null) {
    return new Promise((resolve, reject) => {
      const store = this.database
        .transaction([this.model], "readonly")
        .objectStore(this.model);

      if (!condition) {
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      } else {
        const req = store.openCursor();
        const records = [];
        req.onsuccess = (e) => {
          const cursor = e.target.result;
          if (cursor) {
            let valid = true;
            for (const key in condition) {
              if (cursor.value[key] !== condition[key]) {
                valid = false;
                break;
              }
            }
            if (valid) records.push(cursor.value);
            cursor.continue();
          } else {
            resolve(records);
          }
        };
        req.onerror = () => reject(req.error);
      }
    });
  }
}

const DB_NAME = "initDB";
const DB_VERSION = 1;
const MODELS = {
  collections: { key: "id", properties: ["id", "name", "order"] },
  links: { key: "id", properties: ["id", "name", "url", "remark", "order", "collection", "icon"] },
};

let _db = null;
let _tables = null;

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      for (const name in MODELS) {
        if (!db.objectStoreNames.contains(name)) {
          const store = db.createObjectStore(name, { keyPath: MODELS[name].key });
          for (const p of MODELS[name].properties) {
            store.createIndex(p, p, { unique: p === MODELS[name].key });
          }
        }
      }
    };
    req.onsuccess = (e) => resolve(e.target.result);
    req.onerror = () => reject(req.error);
  });
}

export async function getDB() {
  if (!_db) {
    _db = await openDB();
    _tables = {};
    for (const name in MODELS) {
      _tables[name] = new IndexedModel(_db, name);
    }
  }
  return _tables;
}
