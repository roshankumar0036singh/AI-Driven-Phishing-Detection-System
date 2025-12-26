import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Header from './components/layout/Header'
import StatsCards from './components/dashboard/StatsCards'
import URLScanner from './components/dashboard/URLScanner'
import ThreatChart from './components/dashboard/ThreatChart'
import ActivityChart from './components/dashboard/ActivityChart'
import RecentScans from './components/dashboard/RecentScans'
import ModelInfo from './components/dashboard/ModelInfo'

function App() {
    const [darkMode, setDarkMode] = useState(false)

    useEffect(() => {
        // Check system preference
        const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches
        setDarkMode(isDark)

        // Apply dark mode class
        if (isDark) {
            document.documentElement.classList.add('dark')
        }
    }, [])

    const toggleDarkMode = () => {
        setDarkMode(!darkMode)
        document.documentElement.classList.toggle('dark')
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
            <Header darkMode={darkMode} toggleDarkMode={toggleDarkMode} />

            <main className="container mx-auto px-4 py-8">
                {/* Stats Cards */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <StatsCards />
                </motion.div>

                {/* Scanner and Charts Row */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
                    {/* URL Scanner */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                        className="lg:col-span-1"
                    >
                        <URLScanner />
                    </motion.div>

                    {/* Charts */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className="lg:col-span-2 space-y-6"
                    >
                        <ThreatChart />
                        <ActivityChart />
                    </motion.div>
                </div>

                {/* Recent Scans and Model Info */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.3 }}
                        className="lg:col-span-2"
                    >
                        <RecentScans />
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.4 }}
                        className="lg:col-span-1"
                    >
                        <ModelInfo />
                    </motion.div>
                </div>
            </main>

            {/* Footer */}
            <footer className="mt-16 py-6 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
                <div className="container mx-auto px-4 text-center text-gray-600 dark:text-gray-400">
                    <p className="text-sm">
                        © 2024 PhishBlocker - Advanced Phishing Detection System
                    </p>
                    <p className="text-xs mt-2">
                        Real-time AI-driven protection | Powered by Machine Learning
                    </p>
                </div>
            </footer>
        </div>
    )
}

export default App
