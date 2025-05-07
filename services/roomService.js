"use strict";
const { v4: uuidv4 } = require('uuid');

// In-memory storage for rooms
const rooms = [];

/**
 * List rooms for a given user (membership)
 * @param {string} userId
 * @returns {Array}
 */
function getRoomsByUser(userId) {
  // Return all rooms where user is a member
  return rooms.filter(r => r.members.includes(userId));
}

/**
 * Create a new room with initial settings
 * @param {Object} params
 * @param {string} params.name
 * @param {string} params.description
 * @param {string} params.createdBy
 * @param {number} [params.maxParticipants]
 * @param {boolean} [params.isPrivate]
 * @returns {Object} created room
 */
function createRoom({ name, description, createdBy, maxParticipants = 50, isPrivate = false }) {
  const id = uuidv4();
  const inviteCode = Math.random().toString(36).substr(2, 8);
  const room = {
    id,
    name,
    description,
    createdBy,
    createdAt: new Date().toISOString(),
    maxParticipants,
    isPrivate,
    inviteCode,
    members: [createdBy],
    settings: {}
  };
  rooms.push(room);
  return room;
}

/**
 * Get room by ID
 */
function getRoomById(roomId) {
  return rooms.find(r => r.id === roomId);
}

module.exports = {
  getRoomsByUser,
  createRoom,
  getRoomById
}; 