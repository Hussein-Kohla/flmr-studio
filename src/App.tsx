import { Suspense, lazy } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { ToastProvider } from '@/components/ui/Toast'
import { Spinner } from '@/components/ui/Spinner'
import { AuthProvider, useAuth } from '@/hooks/useAuth'

const Login      = lazy(() => import('@/features/auth/LoginPage'))
const Dashboard  = lazy(() => import('@/features/dashboard/DashboardPage'))
const Analytics  = lazy(() => import('@/features/analytics/AnalyticsPage'))
const Clients    = lazy(() => import('@/features/clients/ClientsPage'))
const ClientAnalytics = lazy(() => import('@/features/clients/ClientAnalyticsPage'))
const Projects   = lazy(() => import('@/features/projects/ProjectsPage'))
const Calendar   = lazy(() => import('@/features/calendar/CalendarPage'))
const Payments   = lazy(() => import('@/features/payments/PaymentsPage'))
const Settings   = lazy(() => import('@/features/settings/SettingsPage'))
const Tasks      = lazy(() => import('@/features/tasks/TasksPage'))
const NotFound   = lazy(() => import('@/features/shared/NotFoundPage'))

function PageLoader() {
  return (
    <div className="h-screen w-full flex items-center justify-center bg-[var(--bg-base)]">
      <Spinner size="lg" />
    </div>
  )
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { token, user } = useAuth()
  
  if (!token) return <Navigate to="/login" replace />
  if (user === undefined) return <PageLoader /> // Loading session from Convex
  
  return <AppShell>{children}</AppShell>
}

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              {/* Public Route */}
              <Route path="/login" element={<Login />} />

              {/* Protected Routes inside AppShell */}
              <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
              <Route path="/clients" element={<ProtectedRoute><Clients /></ProtectedRoute>} />
              <Route path="/clients/analytics" element={<ProtectedRoute><ClientAnalytics /></ProtectedRoute>} />
              <Route path="/projects" element={<ProtectedRoute><Projects /></ProtectedRoute>} />
              <Route path="/calendar" element={<ProtectedRoute><Calendar /></ProtectedRoute>} />
              <Route path="/payments" element={<ProtectedRoute><Payments /></ProtectedRoute>} />
              <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
              <Route path="/tasks" element={<ProtectedRoute><Tasks /></ProtectedRoute>} />

              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  )
}
