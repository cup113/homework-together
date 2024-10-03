/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("s4vdwioo98qyih1")

  collection.listRule = "(range != \"private\" && @request.auth.organizations.id ?= organization.id) || @request.auth.id = author.id"
  collection.viewRule = "(range != \"private\" && @request.auth.organizations.id ?= organization.id) || @request.auth.id = author.id"

  return dao.saveCollection(collection)
}, (db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("s4vdwioo98qyih1")

  collection.listRule = "range != \"private\" || @request.auth.id = author.id"
  collection.viewRule = "range != \"private\" || @request.auth.id = author.id"

  return dao.saveCollection(collection)
})
