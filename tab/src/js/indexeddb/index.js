var $indexedDB = null;

class IndexedModel {
  database = null;
  model = null;
  constructor(db, modelName) {
    this.database = db;
    this.model = modelName;
  }
  add = async (record) => {
    const id = new Date().getTime();
    const transaction = this.database.transaction([this.model], "readwrite");
    const store = transaction.objectStore(this.model);
    record.id = id;
    return await new Promise((res, rej) => {
      const request = store.add(record);
      request.onsuccess = () => res(record);
      request.onerror = () => rej(request.error);
    });
  };
  addMany = async (records, useOrder = false) => {
    const transaction = this.database.transaction([this.model], "readwrite");
    const store = transaction.objectStore(this.model);
    records.forEach((record, ind) => {
      if (useOrder) {
        record.order = ind;
      }
      store.add(record);
    });
    return await new Promise((res, rej) => {
      transaction.oncomplete = () => res(records);
      transaction.onerror = () => rej(transaction.error);
      transaction.onabort = () => rej(transaction.error);
    });
  };
  delete = async (id) => {
    const store = this.database.transaction([this.model], "readwrite").objectStore(this.model);
    return await new Promise((res, rej) => {
      const request = store.delete(id);
      request.onsuccess = () => res();
      request.onerror = () => rej(request.error);
    });
  };
  deleteWithCondition = async (condition) => {
    const transaction = this.database.transaction([this.model], "readwrite");
    const store = transaction.objectStore(this.model);
    return await new Promise((res, rej) => {
      const request = store.openCursor();
      request.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
          let isValid = true;
          for (let property in condition) {
            if (cursor.value[property] !== condition[property]) {
              isValid = false;
              break;
            }
          }
          if (isValid) {
            cursor.delete();
          }
          cursor.continue();
        }
      };
      request.onerror = () => {
        rej(request.error);
      };
      transaction.oncomplete = () => res();
      transaction.onerror = () => rej(transaction.error);
      transaction.onabort = () => rej(transaction.error);
    });
  };
  list = async (condition = null) => {
    const store = this.database
      .transaction([this.model], "readonly")
      .objectStore(this.model);

    return await new Promise((res, rej) => {
      if (!condition) {
        const request = store.getAll();
        request.onsuccess = (event) => {
          res(request.result);
        };
        request.onerror = () => {
          rej();
        };
      } else {
        //条件查
        const request = store.openCursor();
        const records = [];
        request.onsuccess = (event) => {
          const cursor = event.target.result;
          if (cursor) {
            let isValid = true;
            for (let property in condition) {
              if (cursor.value[property] !== condition[property]) {
                isValid = false;
                break;
              }
            }
            if (isValid) {
              records.push(cursor.value);
            }
            cursor.continue();
          } else {
            res(records);
          }
        };
        request.onerror = () => {
          rej();
        };
      }
    });
  };
  update = async (data) => {
    const transaction = this.database.transaction([this.model], "readwrite");
    const store = transaction.objectStore(this.model);
    const record = await new Promise((res, rej) => {
      const request = store.get(data.id);
      request.onsuccess = () => {
        res(request.result);
      };
      request.onerror = () => {
        res(request.result);
      };
    });
    if (record) {
      for (let property in data) {
        record[property] = data[property];
      }
      return await new Promise((res, rej) => {
        const request = store.put(record);
        request.onsuccess = () => res(record);
        request.onerror = () => rej(request.error);
      });
    }
  };
  clear = async () => {
    const store = this.database.transaction([this.model], "readwrite").objectStore(this.model);
    return await new Promise((res, rej) => {
      const request = store.clear();
      request.onsuccess = () => res();
      request.onerror = () => rej(request.error);
    });
  };
}

const initIndexedDB = async () => {
  const database = await new Promise((resolve, reject) => {
    const dbName = "initDB";
    const dbConnectHandle = indexedDB.open(dbName, 1);
    dbConnectHandle.onerror = (event) => {
      // 错误处理
      reject();
    };
    dbConnectHandle.onupgradeneeded = (event) => {
      //第一次时执行
      initIndexedDBStructure(event.target.result, $indexedDBModel);
    };
    dbConnectHandle.onsuccess = (event) => {
      resolve(event.target.result);
    };
  });
  return database;
};

const initIndexedDBStructure = async (db, models) => {
  for (let model in models) {
    const key = models[model].key;
    const modelStore = db.createObjectStore(model, { keyPath: key });
    for (let p of models[model].properties) {
      modelStore.createIndex(p, p, { unique: p === key });
    }
  }
};
const initIndexedDBFunction = async (db, models) => {
  db.$tables = {};
  for (let model in models) {
    db.$tables[model] = new IndexedModel(db, model);
  }
};
