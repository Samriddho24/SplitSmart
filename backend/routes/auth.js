const express = require('express')
const router = express.Router()
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')

// temporary in-memory storage (we replace with PostgreSQL tomorrow)
// think of this as an array acting as our database for now
const users = []

// ─── REGISTER ROUTE ───────────────────────────────────────
// POST /api/auth/register
router.post('/register', async (req, res) => {

  // req.body contains whatever frontend sent us
  const { name, email, password } = req.body

  // check if all fields exist
  if (!name || !email || !password) {
    return res.status(400).json({ message: 'All fields are required' })
  }

  // check if user already exists
  const existingUser = users.find(u => u.email === email)
  if (existingUser) {
    return res.status(400).json({ message: 'Email already registered' })
  }

  // hash the password — 10 is the salt rounds (how many times to scramble)
  const hashedPassword = await bcrypt.hash(password, 10)

  // create new user object and push to our array
  const newUser = {
    id: users.length + 1,
    name,
    email,
    password: hashedPassword   // never store plain text password
  }
  users.push(newUser)

  res.status(201).json({ message: 'User registered successfully' })
})

// ─── LOGIN ROUTE ───────────────────────────────────────────
// POST /api/auth/login
router.post('/login', async (req, res) => {

  const { email, password } = req.body

  if (!email || !password) {
    return res.status(400).json({ message: 'All fields are required' })
  }

  // find user by email
  const user = users.find(u => u.email === email)
  if (!user) {
    return res.status(400).json({ message: 'Invalid email or password' })
  }

  // compare typed password with hashed password in our array
  const isMatch = await bcrypt.compare(password, user.password)
  if (!isMatch) {
    return res.status(400).json({ message: 'Invalid email or password' })
  }

  // create JWT token
  // this token proves the user is logged in
  // we sign it with our secret key from .env
  const token = jwt.sign(
    { id: user.id, email: user.email },  // data to store inside token
    process.env.JWT_SECRET,               // secret key
    { expiresIn: '7d' }                   // token expires in 7 days
  )

  res.json({
    message: 'Login successful',
    token,
    user: { id: user.id, name: user.name, email: user.email }
  })
})

module.exports = router