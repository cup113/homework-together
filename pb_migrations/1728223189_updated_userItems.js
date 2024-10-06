/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("8a603oxewmsysr8")

  collection.updateRule = "@request.auth.id = user.id || publicItem.organization.leader.id = @request.auth.id || publicItem.organization.managers.id ?= @request.auth.id"
  collection.deleteRule = "@request.auth.id = user.id || publicItem.organization.leader.id = @request.auth.id || publicItem.organization.managers.id ?= @request.auth.id"

  return dao.saveCollection(collection)
}, (db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("8a603oxewmsysr8")

  collection.updateRule = "@request.auth.id = user.id"
  collection.deleteRule = "@request.auth.id = user.id"

  return dao.saveCollection(collection)
})
