/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("8a603oxewmsysr8")

  // add
  collection.schema.addField(new SchemaField({
    "system": false,
    "id": "7sh13pne",
    "name": "confirmed",
    "type": "bool",
    "required": false,
    "presentable": false,
    "unique": false,
    "options": {}
  }))

  return dao.saveCollection(collection)
}, (db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("8a603oxewmsysr8")

  // remove
  collection.schema.removeField("7sh13pne")

  return dao.saveCollection(collection)
})
