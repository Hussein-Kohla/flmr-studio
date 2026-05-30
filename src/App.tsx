import { Suspense, lazy } from 'react'
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { ToastProvider } from '@/components/ui/Toast'
import { Spinner } from '@/components/ui/Spinner'
import { AuthProvider, useAuth } from '@/hooks/useAuth'

import { SettingsProvider } from '@/hooks/useSettings'

const Login      = lazy(() => import('@/features/auth/LoginPage'))
const Dashboard  = lazy(() => import('@/features/dashboard/DashboardPage'))
const Analytics  = lazy(() => import('@/features/analytics/AnalyticsPage'))
const Clients    = lazy(() => import('@/features/clients/ClientsPage'))
const ClientDetails = lazy(() => import('@/features/clients/ClientDetailsPage'))
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

function ProtectedRoute() {
  const { token, user } = useAuth()
  
  if (!token) return <Navigate to="/login" replace />
  if (user === undefined) return <PageLoader /> // Loading session from Convex
  
  return (
    <AppShell>
      <Outlet />
    </AppShell>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <SettingsProvider>
            <Suspense fallback={<PageLoader />}>
            <Routes>
              {/* Public Route */}
              <Route path="/login" element={<Login />} />

              {/* Protected Routes inside AppShell */}
              <Route element={<ProtectedRoute />}>
                <Route path="/" element={<Dashboard />} />
                <Route path="/analytics" element={<Analytics />} />
                <Route path="/clients" element={<Clients />} />
                <Route path="/clients/:id" element={<ClientDetails />} />
                <Route path="/clients/analytics" element={<ClientAnalytics />} />
                <Route path="/projects" element={<Projects />} />
                <Route path="/calendar" element={<Calendar />} />
                <Route path="/payments" element={<Payments />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/tasks" element={<Tasks />} />
              </Route>

              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
          </SettingsProvider>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  )
}
