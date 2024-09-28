/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("s4vdwioo98qyih1")

  // update
  collection.schema.addField(new SchemaField({
    "system": false,
    "id": "1thethxp",
    "name": "description",
    "type": "editor",
    "required": true,
    "presentable": true,
    "unique": false,
    "options": {
      "convertUrls": false
    }
  }))

  return dao.saveCollection(collection)
}, (db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("s4vdwioo98qyih1")

  // update
  collection.schema.addField(new SchemaField({
    "system": false,
    "id": "1thethxp",
    "name": "description",
    "type": "editor",
    "required": true,
    "presentable": false,
    "unique": false,
    "options": {
      "convertUrls": false
    }
  }))

  return dao.saveCollection(collection)
})
