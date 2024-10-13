/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("8a603oxewmsysr8")

  collection.listRule = "@request.auth.id = user.id || @request.auth.organizations.id ?= publicItem.organization.id"
  collection.viewRule = "@request.auth.id = user.id || @request.auth.organizations.id ?= publicItem.organization.id"

  return dao.saveCollection(collection)
}, (db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("8a603oxewmsysr8")

  collection.listRule = "@request.auth.id = user.id || (confirmed = true && @request.auth.organizations.id ?= publicItem.organization.id)"
  collection.viewRule = "@request.auth.id = user.id || (confirmed = true && @request.auth.organizations.id ?= publicItem.organization.id)"

  return dao.saveCollection(collection)
})
