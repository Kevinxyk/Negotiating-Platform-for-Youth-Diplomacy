"use strict";
const { v4: uuidv4 } = require("uuid");

const docs = {};

function createDoc(initialContent = "") {
  const id = uuidv4();
  docs[id] = { id, content: initialContent, permissions: {} };
  return docs[id];
}

function getDoc(id) {
  return docs[id];
}

function updateDoc(id, content) {
  if (docs[id]) docs[id].content = content;
  return docs[id];
}

function setPermissions(id, perms) {
  if (!docs[id]) return null;
  docs[id].permissions = { ...docs[id].permissions, ...perms };
  return docs[id];
}

module.exports = { createDoc, getDoc, updateDoc, setPermissions };
