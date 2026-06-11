require('dotenv').config()
const express = require('express')
const router = express.Router()
const pool = require('../db')

// ─── MIDDLEWARE: verify JWT token ──────────────────────────
// This runs before any route that needs authentication
function verifyToken(req, res, next) {
  const token = req.headers['authorization']

  if (!token) {
    return res.status(401).json({ message: 'No token provided' })
  }

  try {
    const jwt = require('jsonwebtoken')
    // token comes as "Bearer eyJ..." so we split and take second part
    const decoded = jwt.verify(token.split(' ')[1], process.env.JWT_SECRET)
    req.user = decoded  // attach user info to request
    next()  // move to the actual route
  } catch (err) {
    return res.status(401).json({ message: 'Invalid token' })
  }
}

// ─── CREATE GROUP ──────────────────────────────────────────
// POST /api/groups/create
router.post('/create', verifyToken, async (req, res) => {
  const { name } = req.body
  const userId = req.user.id  // from decoded token

  if (!name) {
    return res.status(400).json({ message: 'Group name is required' })
  }

  try {
    // create the group
    const newGroup = await pool.query(
      'INSERT INTO groups (name, created_by) VALUES ($1, $2) RETURNING *',
      [name, userId]
    )

    const group = newGroup.rows[0]

    // automatically add creator as a member
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

// ─── GET MY GROUPS ─────────────────────────────────────────
// GET /api/groups
router.get('/', verifyToken, async (req, res) => {
  const userId = req.user.id

  try {
    // get all groups where this user is a member
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

module.exports = router