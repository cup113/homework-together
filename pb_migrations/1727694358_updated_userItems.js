/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("8a603oxewmsysr8")

  collection.listRule = "@request.auth.id = user.id"
  collection.viewRule = "@request.auth.id = user.id"
  collection.updateRule = "@request.auth.id = user.id"
  collection.deleteRule = "@request.auth.id = user.id"

  return dao.saveCollection(collection)
}, (db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("8a603oxewmsysr8")

  collection.listRule = ""
  collection.viewRule = ""
  collection.updateRule = ""
  collection.deleteRule = ""

  return dao.saveCollection(collection)
})
