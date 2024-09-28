/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("s4vdwioo98qyih1")

  collection.listRule = "range != \"private\" || @request.auth.id = author.id"
  collection.viewRule = "range != \"private\" || @request.auth.id = author.id"
  collection.createRule = "@request.auth.id = author.id"
  collection.updateRule = "@request.auth.id = author.id"
  collection.deleteRule = "@request.auth.id = author.id"

  // add
  collection.schema.addField(new SchemaField({
    "system": false,
    "id": "f2hsijhv",
    "name": "subject",
    "type": "relation",
    "required": true,
    "presentable": false,
    "unique": false,
    "options": {
      "collectionId": "fnwjws3xx2yk8pp",
      "cascadeDelete": false,
      "minSelect": null,
      "maxSelect": 1,
      "displayFields": null
    }
  }))

  // add
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

  // add
  collection.schema.addField(new SchemaField({
    "system": false,
    "id": "bbqz6gpp",
    "name": "range",
    "type": "select",
    "required": true,
    "presentable": false,
    "unique": false,
    "options": {
      "maxSelect": 1,
      "values": [
        "all",
        "some",
        "private"
      ]
    }
  }))

  // add
  collection.schema.addField(new SchemaField({
    "system": false,
    "id": "atc0tcqf",
    "name": "estimateMinutes",
    "type": "number",
    "required": true,
    "presentable": false,
    "unique": false,
    "options": {
      "min": 1,
      "max": 99999,
      "noDecimal": false
    }
  }))

  // update
  collection.schema.addField(new SchemaField({
    "system": false,
    "id": "3bgk8lxn",
    "name": "author",
    "type": "relation",
    "required": true,
    "presentable": false,
    "unique": false,
    "options": {
      "collectionId": "_pb_users_auth_",
      "cascadeDelete": false,
      "minSelect": null,
      "maxSelect": 1,
      "displayFields": null
    }
  }))

  return dao.saveCollection(collection)
}, (db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("s4vdwioo98qyih1")

  collection.listRule = null
  collection.viewRule = null
  collection.createRule = null
  collection.updateRule = null
  collection.deleteRule = null

  // remove
  collection.schema.removeField("f2hsijhv")

  // remove
  collection.schema.removeField("1thethxp")

  // remove
  collection.schema.removeField("bbqz6gpp")

  // remove
  collection.schema.removeField("atc0tcqf")

  // update
  collection.schema.addField(new SchemaField({
    "system": false,
    "id": "3bgk8lxn",
    "name": "author",
    "type": "relation",
    "required": false,
    "presentable": false,
    "unique": false,
    "options": {
      "collectionId": "_pb_users_auth_",
      "cascadeDelete": false,
      "minSelect": null,
      "maxSelect": 1,
      "displayFields": null
    }
  }))

  return dao.saveCollection(collection)
})
