require('dotenv').config()
const express = require('express')
const router = express.Router()
const pool = require('../db')
const jwt = require('jsonwebtoken')

// reusing verifyToken middleware
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

// ─── ADD EXPENSE ───────────────────────────────────────────
// POST /api/expenses/add
router.post('/add', verifyToken, async (req, res) => {
  const { group_id, description, amount, split_between } = req.body
  const paid_by = req.user.id

  if (!group_id || !description || !amount || !split_between) {
    return res.status(400).json({ message: 'All fields are required' })
  }

  try {
    const newExpense = await pool.query(
      `INSERT INTO expenses (group_id, paid_by, description, amount, split_between)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [group_id, paid_by, description, amount, split_between]
    )

    res.status(201).json({ message: 'Expense added', expense: newExpense.rows[0] })

  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error' })
  }
})

// ─── GET EXPENSES FOR A GROUP ──────────────────────────────
// GET /api/expenses/group/:groupId
router.get('/group/:groupId', verifyToken, async (req, res) => {
  const { groupId } = req.params

  try {
    const result = await pool.query(
      `SELECT expenses.*, users.name as paid_by_name
       FROM expenses
       JOIN users ON expenses.paid_by = users.id
       WHERE expenses.group_id = $1
       ORDER BY expenses.created_at DESC`,
      [groupId]
    )

    res.json({ expenses: result.rows })

  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error' })
  }
})

module.exports = router