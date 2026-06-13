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

function simplifyDebts(balances) {
  let debtors = []
  let creditors = []

  for (let userId in balances) {
    const amount = balances[userId]
    if (amount < -0.01) {
      debtors.push({ id: parseInt(userId), amount: -amount })
    } else if (amount > 0.01) {
      creditors.push({ id: parseInt(userId), amount: amount })
    }
  }

  let transactions = []

  while (debtors.length > 0 && creditors.length > 0) {
    debtors.sort((a, b) => b.amount - a.amount)
    creditors.sort((a, b) => b.amount - a.amount)

    let debtor = debtors[0]
    let creditor = creditors[0]

    let amount = Math.min(debtor.amount, creditor.amount)

    transactions.push({
      from: debtor.id,
      to: creditor.id,
      amount: Math.round(amount * 100) / 100
    })

    debtor.amount -= amount
    creditor.amount -= amount

    if (debtor.amount < 0.01) debtors.shift()
    if (creditor.amount < 0.01) creditors.shift()
  }

  return transactions
}

router.get('/:groupId', verifyToken, async (req, res) => {
  const { groupId } = req.params

  try {
    const expensesResult = await pool.query(
      'SELECT * FROM expenses WHERE group_id = $1',
      [groupId]
    )

    const expenses = expensesResult.rows

    if (expenses.length === 0) {
      return res.json({ transactions: [], balances: {} })
    }

    const membersResult = await pool.query(
      `SELECT users.id, users.name
       FROM users
       JOIN group_members ON users.id = group_members.user_id
       WHERE group_members.group_id = $1`,
      [groupId]
    )

    const members = membersResult.rows

    let balances = {}
    members.forEach(m => balances[m.id] = 0)

    expenses.forEach(expense => {
      const splitCount = expense.split_between.length
      const expenseAmount = parseFloat(expense.amount)
      const sharePerPerson = expenseAmount / splitCount

      const paidBy = parseInt(expense.paid_by)
      balances[paidBy] = (balances[paidBy] || 0) + expenseAmount

      expense.split_between.forEach(userId => {
        const uid = parseInt(userId)
        balances[uid] = (balances[uid] || 0) - sharePerPerson
      })
    })

    const transactions = simplifyDebts(balances)

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