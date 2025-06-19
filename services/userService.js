const store = require('../data/store');
const mysqlService = require('./mysqlService');

const useMysql = process.env.USE_MYSQL === 'true';

async function findByUsername(username) {
  if (useMysql) {
    const [rows] = await mysqlService.getPool().query('SELECT * FROM users WHERE username = ?', [username]);
    return rows[0] ? {
      userId: rows[0].id.toString(),
      username: rows[0].username,
      passwordHash: rows[0].passwordHash,
      role: rows[0].role
    } : null;
  }
  return store.findUserByUsername(username);
}

async function findById(id) {
  if (useMysql) {
    const [rows] = await mysqlService.getPool().query('SELECT * FROM users WHERE id = ?', [id]);
    return rows[0] ? {
      userId: rows[0].id.toString(),
      username: rows[0].username,
      passwordHash: rows[0].passwordHash,
      role: rows[0].role
    } : null;
  }
  return store.findUserById(id);
}

async function addUser(user) {
  if (useMysql) {
    const [result] = await mysqlService.getPool().query(
      'INSERT INTO users (username,passwordHash,role) VALUES (?,?,?)',
      [user.username, user.passwordHash, user.role]
    );
    return { userId: result.insertId.toString(), ...user };
  }
  return store.addUser(user);
}

module.exports = {
  findByUsername,
  findById,
  addUser
};
