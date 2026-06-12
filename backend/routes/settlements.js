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

// ─── DEBT SIMPLIFICATION ALGORITHM ────────────────────────
function simplifyDebts(balances) {
  // separate into who owes (negative) and who is owed (positive)
  let debtors = []   // people who owe money
  let creditors = [] // people who are owed money

  for (let userId in balances) {
    if (balances[userId] < 0) {
      debtors.push({ id: parseInt(userId), amount: -balances[userId] })
    } else if (balances[userId] > 0) {
      creditors.push({ id: parseInt(userId), amount: balances[userId] })
    }
  }

  let transactions = []

  // greedy algorithm
  while (debtors.length > 0 && creditors.length > 0) {
    // sort to always pick largest first
    debtors.sort((a, b) => b.amount - a.amount)
    creditors.sort((a, b) => b.amount - a.amount)

    let debtor = debtors[0]
    let creditor = creditors[0]

    // settle minimum of what debtor owes and creditor is owed
    let amount = Math.min(debtor.amount, creditor.amount)

    transactions.push({
      from: debtor.id,
      to: creditor.id,
      amount: Math.round(amount * 100) / 100
    })

    // update balances
    debtor.amount -= amount
    creditor.amount -= amount

    // remove if fully settled
    if (debtor.amount < 0.01) debtors.shift()
    if (creditor.amount < 0.01) creditors.shift()
  }

  return transactions
}

// ─── GET SETTLEMENTS FOR A GROUP ──────────────────────────
// GET /api/settlements/:groupId
router.get('/:groupId', verifyToken, async (req, res) => {
  const { groupId } = req.params

  try {
    // get all expenses for this group
    const expensesResult = await pool.query(
      'SELECT * FROM expenses WHERE group_id = $1',
      [groupId]
    )

    const expenses = expensesResult.rows

    if (expenses.length === 0) {
      return res.json({ transactions: [] })
    }

    // get all members of this group
    const membersResult = await pool.query(
      `SELECT users.id, users.name
       FROM users
       JOIN group_members ON users.id = group_members.user_id
       WHERE group_members.group_id = $1`,
      [groupId]
    )

    const members = membersResult.rows

    // calculate net balance for each member
    // positive = owed money, negative = owes money
    let balances = {}
    members.forEach(m => balances[m.id] = 0)

    expenses.forEach(expense => {
      const splitCount = expense.split_between.length
      const sharePerPerson = expense.amount / splitCount

      // person who paid gets credit
      balances[expense.paid_by] += expense.amount

      // each person in split owes their share
      expense.split_between.forEach(userId => {
        balances[userId] -= sharePerPerson
      })
    })

    // run the algorithm
    const transactions = simplifyDebts(balances)

    // attach names to transactions
    const memberMap = {}
    members.forEach(m => memberMap[m.id] = m.name)

    const namedTransactions = transactions.map(t => ({
      from: memberMap[t.from],
      to: memberMap[t.to],
      amount: t.amount
    }))

    res.json({ transactions: namedTransactions, balances })

  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error' })
  }
})

module.exports = router