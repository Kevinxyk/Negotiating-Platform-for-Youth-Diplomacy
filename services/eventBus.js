// File: my-backend/services/eventBus.js
"use strict";

const EventEmitter = require('events');
class EventBus extends EventEmitter {}
module.exports = new EventBus();