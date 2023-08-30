
var $indexDB = null

class IndexModel {
  database = null
  model = null
  constructor(db, modelName) {
    this.database = db
    this.model = modelName
  }
  add = (record) => {
    const store = this.database.transaction([this.model], "readwrite")
      .objectStore(this.model);
    store.add(record);
  }
  delete = (id) => {
    const store = this.database.transaction([this.model], "readwrite")
      .objectStore(this.model);
    store.delete(id);
  }
  list = () => {
    const store = this.database.transaction([this.model], "readwrite")
      .objectStore(this.model);
    const request = store.getAll();
    const records = request.result
    return records
  }
  update = (record) => {
    const store = this.database.transaction([this.model], "readwrite")
      .objectStore(this.model);
    store.put(record);
  }
}

const initIndexDB = async () => {
  const databse = await new Promise((resolve, reject) => {
    const dbName = "initDB";
    const dbConnectHandle = indexedDB.open(dbName, 1);
    dbConnectHandle.onerror = (event) => {
      // 错误处理
      reject()
    };
    dbConnectHandle.onupgradeneeded = (event) => {
      console.log('onupgradeneeded', event)
      resolve({
        type: 'upgradeneeded',
        result: event.target.result
      })
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

const initIndexDBStructure = async (db, models) => {
  for (let model in models) {
    const key = models[model].key
    const modelStore = db.createObjectStore(model, { keyPath: key });
    for (let p of models[model].properties) {
      modelStore.createIndex(p, p, { unique: p === key });
    }
  }
}
const initIndexDBFunction = (db, models) => {
  db.$tables = {}
  for (let model in models) {
    db.$tables[model] = new IndexModel(db, model)
  }
}
initIndexDB().then(({
  type, result: db
}) => {
  $indexDB = db
  if (type === 'upgradeneeded') {
    initIndexDBStructure(db, $indexDBModel)
  } else {
    initIndexDBFunction(db, $indexDBModel)
  }
})