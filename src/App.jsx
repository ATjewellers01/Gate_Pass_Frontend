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
const ProtectedRoute = ({ children, requiredPage }) => {
  const { isLoggedIn, userData } = useSelector((state) => state.login)
  const role = userData?.role
  const pageAccess = userData?.page_access || ""

  // ❌ Block if not logged in — redirect to login
  if (!isLoggedIn) {
    return <Navigate to="/login" replace />
  }

  // Check page access permission
  if (requiredPage) {
    const isAll = pageAccess.toLowerCase() === "all"
    const hasAccess = isAll || pageAccess.toLowerCase().split(",").map(p => p.trim()).includes(requiredPage.toLowerCase())

    if (!hasAccess) {
      // Find the first allowed page that the user has access to
      const allowedPages = isAll
        ? ["dashboard"]
        : pageAccess.toLowerCase().split(",").map(p => p.trim())

      if (allowedPages.includes("dashboard")) {
        return <Navigate to="/dashboard" replace />
      } else if (allowedPages.includes("close gate pass")) {
        return <Navigate to="/close-gate-pass" replace />
      } else if (allowedPages.includes("request gate pass")) {
        return <Navigate to="/request-gate-pass" replace />
      } else if (allowedPages.includes("approval requests")) {
        return <Navigate to="/approval-request" replace />
      } else if (allowedPages.includes("employee status")) {
        return <Navigate to="/employee" replace />
      } else if (allowedPages.includes("settings")) {
        return <Navigate to="/settings" replace />
      }
      return <Navigate to="/login" replace />
    }
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
          <Route path="/request-gate-pass" element={<ProtectedRoute requiredPage="Request Gate Pass"><AdminAssignTask /></ProtectedRoute>} />
          <Route path="/close-gate-pass" element={<ProtectedRoute requiredPage="Close Gate Pass"><AccountDataPage /></ProtectedRoute>} />
          <Route path="/dashboard" element={<ProtectedRoute requiredPage="Dashboard"><HomePage /></ProtectedRoute>} />
          <Route path="/approval-request" element={<ProtectedRoute requiredPage="Approval Requests"><License /></ProtectedRoute>} />
          <Route path="/employee" element={<ProtectedRoute requiredPage="Employee Status"><EmployeeStatusPage /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute requiredPage="Settings"><Settings /></ProtectedRoute>} />
          {/* <Route path="/reports" element={<AllVisitorsPage />} /> */}
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />

      </Routes>
    </Router>
  )
}

export default App