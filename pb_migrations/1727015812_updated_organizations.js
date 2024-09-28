/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("nqnxckc1aigf913")

  collection.viewRule = ""
  collection.createRule = ""
  collection.updateRule = "@request.auth.id = leader.id || managers.id ?= @request.auth.id"
  collection.deleteRule = "@request.auth.id = leader.id"

  return dao.saveCollection(collection)
}, (db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("nqnxckc1aigf913")

  collection.viewRule = null
  collection.createRule = null
  collection.updateRule = null
  collection.deleteRule = null

  return dao.saveCollection(collection)
})
