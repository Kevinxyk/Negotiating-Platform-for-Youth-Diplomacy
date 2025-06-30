"use strict";
const docService = require("../services/docService");

function createDoc(req, res) {
  const doc = docService.createDoc(req.body.content || "");
  res.status(201).json(doc);
}

function getDoc(req, res) {
  const doc = docService.getDoc(req.params.id);
  if (!doc) return res.status(404).json({ error: "not found" });
  res.json(doc);
}

function updateDoc(req, res) {
  const doc = docService.updateDoc(req.params.id, req.body.content || "");
  if (!doc) return res.status(404).json({ error: "not found" });
  res.json(doc);
}

function setPermissions(req, res) {
  const doc = docService.setPermissions(req.params.id, req.body || {});
  if (!doc) return res.status(404).json({ error: "not found" });
  res.json(doc);
}

module.exports = { createDoc, getDoc, updateDoc, setPermissions };
