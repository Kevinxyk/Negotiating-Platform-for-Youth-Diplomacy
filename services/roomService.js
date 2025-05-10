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

// 根据名称查找房间
function getRoomByName(name) {
  return rooms.find(r => r.name === name);
}

// 添加用户到房间成员
function addMember(roomId, userId) {
  const room = getRoomById(roomId);
  if (room && !room.members.includes(userId)) {
    room.members.push(userId);
  }
  return room;
}

/**
 * Delete a room
 * @param {string} roomId
 * @param {string} userId - ID of the user requesting deletion
 * @returns {boolean} success status
 */
function deleteRoom(roomId, userId) {
  const roomIndex = rooms.findIndex(r => r.id === roomId);
  if (roomIndex === -1) return false;
  
  const room = rooms[roomIndex];
  // Only creator or admin can delete the room
  if (room.createdBy !== userId) return false;
  
  rooms.splice(roomIndex, 1);
  return true;
}

/**
 * Update room parameters
 * @param {string} roomId
 * @param {string} userId - ID of the user requesting update
 * @param {Object} updates - Object containing fields to update
 * @returns {Object|null} updated room or null if update failed
 */
function updateRoom(roomId, userId, updates) {
  const room = rooms.find(r => r.id === roomId);
  if (!room) return null;
  
  // Only creator or admin can update the room
  if (room.createdBy !== userId) return null;
  
  // Update allowed fields
  if (updates.name) room.name = updates.name;
  if (updates.description) room.description = updates.description;
  if (updates.maxParticipants) room.maxParticipants = updates.maxParticipants;
  if (typeof updates.isPrivate === 'boolean') room.isPrivate = updates.isPrivate;
  
  return room;
}

/**
 * Join room by invite code
 * @param {string} inviteCode
 * @param {string} userId
 * @returns {Object|null} room object or null if not found
 */
function joinRoomByInviteCode(inviteCode, userId) {
  const room = rooms.find(r => r.inviteCode === inviteCode);
  if (!room) return null;
  
  if (!room.members.includes(userId)) {
    room.members.push(userId);
  }
  
  return room;
}

module.exports = {
  getRoomsByUser,
  createRoom,
  getRoomById,
  getRoomByName,
  addMember,
  deleteRoom,
  updateRoom,
  joinRoomByInviteCode
}; 