/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("s4vdwioo98qyih1")

  collection.updateRule = "@request.auth.id = author.id || organization.leader.id = @request.auth.id || organization.managers.id ?= @request.auth.id"
  collection.deleteRule = "@request.auth.id = author.id || organization.leader.id = @request.auth.id || organization.managers.id ?= @request.auth.id"

  return dao.saveCollection(collection)
}, (db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("s4vdwioo98qyih1")

  collection.updateRule = "@request.auth.id = author.id"
  collection.deleteRule = "@request.auth.id = author.id"

  return dao.saveCollection(collection)
})
