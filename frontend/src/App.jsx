import { Routes, Route } from 'react-router-dom'
import Landing from './pages/Landing.jsx'
import Login from './pages/Login.jsx'
import Signup from './pages/Signup.jsx'
import Dashboard from './pages/Dashboard.jsx'
import HrSearch from './pages/HrSearch.jsx'
import SheetsImport from './pages/SheetsImport.jsx'
import MyEmails from './pages/MyEmails.jsx'
import Profile from './pages/Profile.jsx'
import ProfileComplete from './pages/ProfileComplete.jsx'
import NotFound from './pages/NotFound.jsx'
import {
  ProtectedRoute,
  RequireAuthOnly,
  PublicOnlyRoute,
} from './components/RouteGuards.jsx'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />

      <Route
        path="/login"
        element={
          <PublicOnlyRoute>
            <Login />
          </PublicOnlyRoute>
        }
      />
      <Route
        path="/signup"
        element={
          <PublicOnlyRoute>
            <Signup />
          </PublicOnlyRoute>
        }
      />

      <Route
        path="/profile/complete"
        element={
          <RequireAuthOnly redirectCompleted>
            <ProfileComplete />
          </RequireAuthOnly>
        }
      />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/hr/search"
        element={
          <ProtectedRoute>
            <HrSearch />
          </ProtectedRoute>
        }
      />
      <Route
        path="/hr/import"
        element={
          <ProtectedRoute>
            <SheetsImport />
          </ProtectedRoute>
        }
      />
      <Route
        path="/emails"
        element={
          <ProtectedRoute>
            <MyEmails />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}
