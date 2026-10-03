import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { MotionConfig } from 'framer-motion'
import { Navbar } from './components/Layout/Navbar'
import { ToastProvider } from './components/UI/Toast'
import { ErrorBoundary } from './components/UI/ErrorBoundary'
import { HomePage } from './pages/HomePage'
import { ResultPage } from './pages/ResultPage'
import { HistoryPage } from './pages/HistoryPage'
import { DashboardPage } from './pages/DashboardPage'
import { NotFoundPage } from './pages/NotFoundPage'

export default function App() {
  return (
    <MotionConfig reducedMotion="user">
      <BrowserRouter>
        <ToastProvider>
          <ErrorBoundary>
            <div className="min-h-screen bg-bg">
              <Navbar />
              <main id="main" tabIndex={-1} className="outline-none">
                <Routes>
                  <Route path="/" element={<ErrorBoundary><HomePage /></ErrorBoundary>} />
                  <Route path="/result/:id" element={<ErrorBoundary><ResultPage /></ErrorBoundary>} />
                  <Route path="/history" element={<ErrorBoundary><HistoryPage /></ErrorBoundary>} />
                  <Route path="/dashboard" element={<ErrorBoundary><DashboardPage /></ErrorBoundary>} />
                  <Route path="*" element={<NotFoundPage />} />
                </Routes>
              </main>
            </div>
          </ErrorBoundary>
        </ToastProvider>
      </BrowserRouter>
    </MotionConfig>
  )
}
