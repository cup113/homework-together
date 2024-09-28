/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("s4vdwioo98qyih1")

  collection.createRule = ""

  return dao.saveCollection(collection)
}, (db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("s4vdwioo98qyih1")

  collection.createRule = "@request.auth.id = author.id"

  return dao.saveCollection(collection)
})
