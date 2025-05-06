"use strict";
const express = require('express');
const cors = require('cors');
const routes = require('./routes/index');
const bodyParser = require("body-parser");
const path = require("path");

const app = express();

app.use(cors());
app.use(bodyParser.json());

// **增加这一行**：把 public 目录暴露为静态文件
app.use(express.static(path.join(__dirname, "public")));

// 在 /api 之前加一个根路由
app.get("/", (req, res) => {
  res.json({ status: "OK", message: "API is running" });
});

app.use('/api', routes);

// 404 & 错误中间件
app.use((req, res) => res.status(404).json({ error: "Not found" }));
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

module.exports = app; 