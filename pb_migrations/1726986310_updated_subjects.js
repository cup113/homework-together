/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("fnwjws3xx2yk8pp")

  // add
  collection.schema.addField(new SchemaField({
    "system": false,
    "id": "va0psfke",
    "name": "abbr",
    "type": "text",
    "required": false,
    "presentable": false,
    "unique": false,
    "options": {
      "min": null,
      "max": null,
      "pattern": ""
    }
  }))

  return dao.saveCollection(collection)
}, (db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("fnwjws3xx2yk8pp")

  // remove
  collection.schema.removeField("va0psfke")

  return dao.saveCollection(collection)
})
