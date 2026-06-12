require('dotenv').config()
const express = require('express')
const router = express.Router()
const pool = require('../db')
const jwt = require('jsonwebtoken')

function verifyToken(req, res, next) {
  const authHeader = req.headers['authorization']
  if (!authHeader) return res.status(401).json({ message: 'No token provided' })
  try {
    const decoded = jwt.verify(authHeader.split(' ')[1], process.env.JWT_SECRET)
    req.user = decoded
    next()
  } catch (err) {
    return res.status(401).json({ message: 'Invalid token' })
  }
}

router.post('/create', verifyToken, async (req, res) => {
  const { name } = req.body
  const userId = req.user.id

  if (!name) {
    return res.status(400).json({ message: 'Group name is required' })
  }

  try {
    const newGroup = await pool.query(
      'INSERT INTO groups (name, created_by) VALUES ($1, $2) RETURNING *',
      [name, userId]
    )
    const group = newGroup.rows[0]
    await pool.query(
      'INSERT INTO group_members (group_id, user_id) VALUES ($1, $2)',
      [group.id, userId]
    )
    res.status(201).json({ message: 'Group created', group })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error' })
  }
})

router.get('/', verifyToken, async (req, res) => {
  const userId = req.user.id
  try {
    const result = await pool.query(
      `SELECT groups.id, groups.name, groups.created_at
       FROM groups
       JOIN group_members ON groups.id = group_members.group_id
       WHERE group_members.user_id = $1
       ORDER BY groups.created_at DESC`,
      [userId]
    )
    res.json({ groups: result.rows })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error' })
  }
})

router.post('/addmember', verifyToken, async (req, res) => {
  const { group_id, user_email } = req.body
  try {
    const userResult = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [user_email]
    )
    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' })
    }
    const user = userResult.rows[0]
    await pool.query(
      'INSERT INTO group_members (group_id, user_id) VALUES ($1, $2)',
      [group_id, user.id]
    )
    res.json({ message: 'Member added', user: { id: user.id, name: user.name } })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error' })
  }
})

router.get('/:groupId/members', verifyToken, async (req, res) => {
  const { groupId } = req.params
  try {
    const result = await pool.query(
      `SELECT users.id, users.name, users.email
       FROM users
       JOIN group_members ON users.id = group_members.user_id
       WHERE group_members.group_id = $1`,
      [groupId]
    )
    res.json({ members: result.rows })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error' })
  }
})

module.exports = router