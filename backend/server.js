const express = require('express')
const cors = require('cors')
require('dotenv').config()   // loads .env file
const pool = require('./db')
const groupRoutes = require('./routes/groups')
const expenseRoutes = require('./routes/expenses')
const settlementRoutes = require('./routes/settlements')




const authRoutes = require('./routes/auth')

const app = express()

// middleware - explained below
app.use(cors())
app.use(express.json())



// all auth routes will start with /api/auth
app.use('/api/auth', authRoutes)
app.use('/api/groups', groupRoutes)
app.use('/api/expenses', expenseRoutes)
app.use('/api/settlements', settlementRoutes)

// test route
app.get('/', (req, res) => {
  res.send('SplitSmart backend is running')
})

app.listen(5000, () => {
  console.log('Server running on port 5000')
})