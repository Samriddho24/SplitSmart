import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import API from '../api'

function GroupDetail() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [expenses, setExpenses] = useState([])
  const [settlements, setSettlements] = useState([])
  const [members, setMembers] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [memberEmail, setMemberEmail] = useState('')
  const [message, setMessage] = useState('')
  const user = JSON.parse(localStorage.getItem('user')) || {}

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    try {
      const expRes = await API.get(`/expenses/group/${id}`)
      setExpenses(expRes.data.expenses)

      const settleRes = await API.get(`/settlements/${id}`)
      setSettlements(settleRes.data.transactions)

      const membersRes = await API.get(`/groups/${id}/members`)
      setMembers(membersRes.data.members)
    } catch (err) {
      console.error(err)
    }
  }

  async function handleAddExpense() {
    if (!description || !amount) return
    try {
      const allMemberIds = members.map(m => m.id)
      await API.post('/expenses/add', {
        group_id: parseInt(id),
        description,
        amount: parseFloat(amount),
        split_between: allMemberIds
      })
      setDescription('')
      setAmount('')
      setShowModal(false)
      fetchData()
    } catch (err) {
      console.error(err)
    }
  }

  async function handleAddMember() {
    if (!memberEmail) return
    try {
      await API.post('/groups/addmember', {
        group_id: parseInt(id),
        user_email: memberEmail
      })
      setMemberEmail('')
      setMessage('Member added successfully!')
      fetchData()
    } catch (err) {
      setMessage('User not found or already added')
    }
  }

  return (
    <div className="dashboard-container">
      <div className="sidebar">
        <h2 className="logo">SplitSmart</h2>
        <nav className="nav-links">
          <button className="nav-item" onClick={() => navigate('/dashboard')}>
            ← Back
          </button>
        </nav>
      </div>

      <div className="main-content">
        <div className="top-bar">
          <h1>Group Expenses</h1>
        </div>

        {members.length > 0 && (
          <div className="stat-card" style={{marginBottom: '24px'}}>
            <p className="stat-label" style={{marginBottom: '12px'}}>👥 Members</p>
            <div style={{display: 'flex', gap: '8px', flexWrap: 'wrap'}}>
              {members.map(m => (
                <div key={m.id} style={{
                  background: '#2a2a2a',
                  padding: '6px 14px',
                  borderRadius: '20px',
                  fontSize: '13px',
                  color: '#fff'
                }}>
                  {m.name}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="stat-card" style={{marginBottom: '24px'}}>
          <p className="stat-label" style={{marginBottom: '12px'}}>Add Member by Email</p>
          <div style={{display: 'flex', gap: '12px'}}>
            <input
              type="email"
              placeholder="friend@gmail.com"
              className="input"
              value={memberEmail}
              onChange={(e) => setMemberEmail(e.target.value)}
              style={{flex: 1}}
            />
            <button className="btn-primary" onClick={handleAddMember}>Add</button>
          </div>
          {message && <p style={{color: '#4ade80', fontSize: '13px', marginTop: '8px'}}>{message}</p>}
        </div>

        {settlements.length > 0 && (
          <div className="stat-card" style={{marginBottom: '24px'}}>
            <p className="stat-label" style={{marginBottom: '12px'}}>💰 Who Owes What</p>
            {settlements.map((s, i) => (
              <div key={i} style={{padding: '8px 0', borderBottom: '1px solid #2a2a2a', color: '#fff'}}>
                <span style={{color: '#f87171'}}>{s.from}</span>
                {' owes '}
                <span style={{color: '#4ade80'}}>{s.to}</span>
                {' '}<strong>₹{s.amount}</strong>
              </div>
            ))}
          </div>
        )}

        <div className="section-header">
          <h2>Expenses</h2>
          <button className="btn-primary" onClick={() => setShowModal(true)}>+ Add Expense</button>
        </div>

        {expenses.length === 0 ? (
          <div className="empty-state"><p>No expenses yet. Add one!</p></div>
        ) : (
          <div className="groups-list" style={{marginTop: '16px'}}>
            {expenses.map(exp => (
              <div key={exp.id} className="group-card">
                <h3>{exp.description}</h3>
                <p style={{color: '#4ade80', fontSize: '16px', margin: '4px 0'}}>₹{exp.amount}</p>
                <p>Paid by {exp.paid_by_name}</p>
              </div>
            ))}
          </div>
        )}

        {showModal && (
          <div className="modal-overlay">
            <div className="modal">
              <h2>Add Expense</h2>
              <input
                type="text"
                placeholder="Description e.g. Dinner"
                className="input"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
              <input
                type="number"
                placeholder="Amount"
                className="input"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
              <p style={{color: '#888', fontSize: '13px'}}>Split equally between all members</p>
              <div className="modal-buttons">
                <button className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button className="btn-primary" onClick={handleAddExpense}>Add</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default GroupDetail