
var $indexedDB = null

class IndexedModel {
  database = null
  model = null
  constructor(db, modelName) {
    this.database = db
    this.model = modelName
  }
  add = async (record) => {
    const id = (new Date()).getTime()
    const store = this.database.transaction([this.model], "readwrite")
      .objectStore(this.model);
    record.id = id
    store.add(record);
  }
  addMuch = async (records) => {
    const store = this.database.transaction([this.model], "readwrite")
      .objectStore(this.model);
    records.forEach(record => {
      store.add(record);
    })
  }
  delete = async (id) => {
    const store = this.database.transaction([this.model], "readwrite")
      .objectStore(this.model);
    store.delete(id);
  }
  list = async (condition = null) => {
    const store = this.database.transaction([this.model], "readwrite")
      .objectStore(this.model);

    return await new Promise((res, rej) => {
      if (!condition) {
        const request = store.getAll();
        request.onsuccess = (event) => {
          res(request.result)
        }
        request.onerror = () => {
          rej()
        }
      } else {
        //条件查
        const request = store.openCursor();
        const records = []
        request.onsuccess = (event) => {
          const cursor = event.target.result;
          if (cursor) {
            let isValid = true
            for (let property in condition) {
              if (cursor.value[property] !== condition[property]) {
                isValid = false
                break
              }
            }
            if (isValid) {
              records.push(cursor.value)
            }
            cursor.continue();
          } else {
            res(records)
          }
        }
        request.onerror = () => {
          rej()
        }
      }
    })
  }
  update = async (data) => {
    const store = this.database.transaction([this.model], "readwrite")
      .objectStore(this.model);
    const record = await new Promise((res, rej) => {
      const request = store.get(data.id)
      request.onsuccess = () => {
        res(request.result)
      }
      request.onerror = () => {
        res(request.result)
      }
    })
    if (record) {
      for (let property in data) {
        record[property] = data[property]
      }
      store.put(record);
    }
  }
}

const initIndexedDB = async () => {
  const databse = await new Promise((resolve, reject) => {
    const dbName = "initDB";
    const dbConnectHandle = indexedDB.open(dbName, 1);
    dbConnectHandle.onerror = (event) => {
      // 错误处理
      reject()
    };
    dbConnectHandle.onupgradeneeded = (event) => {
      //第一次时执行
      initIndexedDBStructure(event.target.result, $indexedDBModel)
    };
    dbConnectHandle.onsuccess = (event) => {
      console.log('onsuccess', event)
      resolve({
        type: 'success',
        result: event.target.result
      })
    }
  })
  return databse
}

const initIndexedDBStructure = async (db, models) => {
  for (let model in models) {
    const key = models[model].key
    const modelStore = db.createObjectStore(model, { keyPath: key });
    for (let p of models[model].properties) {
      modelStore.createIndex(p, p, { unique: p === key });
    }
  }
}
const initIndexedDBFunction = async (db, models) => {
  db.$tables = {}
  for (let model in models) {
    db.$tables[model] = new IndexedModel(db, model)
  }
}

