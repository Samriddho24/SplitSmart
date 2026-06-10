import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/login'
import Dashboard from './pages/dashboard'

function App() {

  // check if user is logged in by looking for token
  const token = localStorage.getItem('token')

  return (
    <BrowserRouter>
      <Routes>

        {/* if token exists go to dashboard, else show login */}
        <Route
          path="/"
          element={token ? <Navigate to="/dashboard" /> : <Login />}
        />

        {/* protected route — only if logged in */}
        <Route
          path="/dashboard"
          element={token ? <Dashboard /> : <Navigate to="/" />}
        />

      </Routes>
    </BrowserRouter>
  )
}

export default App