"use client"

import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom"
import { useSelector } from "react-redux"
import HomePage from "./pages/HomePage"
// import AdminDashboard from "./pages/Dashboard"
import AdminAssignTask from "./pages/RequestVisit"
import AccountDataPage from "./pages/ClosePass"
import AdminLogin from "./pages/AdminLogin"
import License from "./pages/ApprovelPage"
import EmployeeStatusPage from "./pages/EmployeeStatusPage"
// import AllVisitorsPage from "./pages/AllVisitorsPage"
import Settings from "./pages/Settings"
import AdminLayout from "./components/AdminLayout"

// 🔒 Auth wrapper
const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { isLoggedIn, userData } = useSelector((state) => state.login)
  const role = userData?.role

  // ❌ Block if not logged in — redirect to login
  if (!isLoggedIn) {
    return <Navigate to="/login" replace />
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(role)) {
    return <Navigate to="/dashboard" replace />
  }

  return children
}

function App() {
  return (
    <Router>
      <Routes>

        <Route path="/" element={<Navigate to="/login" replace />} />

        <Route path="/login" element={<AdminLogin />} />
        
        {/* Public route for QR code scans */}
        <Route path="/public/request-gate-pass" element={<AdminAssignTask />} />

        <Route
          element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/request-gate-pass" element={<AdminAssignTask />} />
          <Route path="/close-gate-pass" element={<AccountDataPage />} />
          <Route path="/dashboard" element={<HomePage />} />
          <Route path="/approval-request" element={<License />} />
          <Route path="/employee" element={<EmployeeStatusPage />} />
          <Route path="/settings" element={<Settings />} />
          {/* <Route path="/reports" element={<AllVisitorsPage />} /> */}
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />

      </Routes>
    </Router>
  )
}

export default App