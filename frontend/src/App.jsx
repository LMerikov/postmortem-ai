import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Navbar } from './components/Layout/Navbar'
import { ToastProvider } from './components/UI/Toast'
import { ErrorBoundary } from './components/UI/ErrorBoundary'
import { HomePage } from './pages/HomePage'
import { SimulatePage } from './pages/SimulatePage'
import { ResultPage } from './pages/ResultPage'
import { HistoryPage } from './pages/HistoryPage'
import { DashboardPage } from './pages/DashboardPage'

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <ErrorBoundary>
          <div className="min-h-screen bg-bg">
            <Navbar />
            <main>
              <Routes>
                <Route path="/" element={<ErrorBoundary><HomePage /></ErrorBoundary>} />
                <Route path="/simulate" element={<ErrorBoundary><SimulatePage /></ErrorBoundary>} />
                <Route path="/result/:id" element={<ErrorBoundary><ResultPage /></ErrorBoundary>} />
                <Route path="/history" element={<ErrorBoundary><HistoryPage /></ErrorBoundary>} />
                <Route path="/dashboard" element={<ErrorBoundary><DashboardPage /></ErrorBoundary>} />
              </Routes>
            </main>
          </div>
        </ErrorBoundary>
      </ToastProvider>
    </BrowserRouter>
  )
}
