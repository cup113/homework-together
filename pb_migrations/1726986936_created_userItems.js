/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const collection = new Collection({
    "id": "8a603oxewmsysr8",
    "created": "2024-09-22 06:35:36.524Z",
    "updated": "2024-09-22 06:35:36.524Z",
    "name": "userItems",
    "type": "base",
    "system": false,
    "schema": [
      {
        "system": false,
        "id": "c0tlktjd",
        "name": "publicItem",
        "type": "relation",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {
          "collectionId": "s4vdwioo98qyih1",
          "cascadeDelete": false,
          "minSelect": null,
          "maxSelect": 1,
          "displayFields": null
        }
      },
      {
        "system": false,
        "id": "sfmvkkvo",
        "name": "note",
        "type": "editor",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {
          "convertUrls": false
        }
      },
      {
        "system": false,
        "id": "2zcw6ugu",
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
      },
      {
        "system": false,
        "id": "ifhtb4n1",
        "name": "progress",
        "type": "number",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {
          "min": 0,
          "max": 1,
          "noDecimal": false
        }
      }
    ],
    "indexes": [],
    "listRule": null,
    "viewRule": null,
    "createRule": null,
    "updateRule": null,
    "deleteRule": null,
    "options": {}
  });

  return Dao(db).saveCollection(collection);
}, (db) => {
  const dao = new Dao(db);
  const collection = dao.findCollectionByNameOrId("8a603oxewmsysr8");

  return dao.deleteCollection(collection);
})
