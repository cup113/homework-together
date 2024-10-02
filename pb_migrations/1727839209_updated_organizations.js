/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("nqnxckc1aigf913")

  collection.listRule = ""
  collection.createRule = "@request.auth.id != \"\""

  return dao.saveCollection(collection)
}, (db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("nqnxckc1aigf913")

  collection.listRule = null
  collection.createRule = ""

  return dao.saveCollection(collection)
})
