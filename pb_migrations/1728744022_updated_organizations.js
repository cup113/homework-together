/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("nqnxckc1aigf913")

  collection.indexes = [
    "CREATE INDEX `idx_xAvAgOJ` ON `organizations` (`name`)"
  ]

  return dao.saveCollection(collection)
}, (db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("nqnxckc1aigf913")

  collection.indexes = []

  return dao.saveCollection(collection)
})
