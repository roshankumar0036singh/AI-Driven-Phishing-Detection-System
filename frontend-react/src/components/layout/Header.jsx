import { Shield, Moon, Sun } from 'lucide-react'
import { motion } from 'framer-motion'

export default function Header({ darkMode, toggleDarkMode }) {
    return (
        <header className="bg-white dark:bg-gray-800 shadow-lg border-b border-gray-200 dark:border-gray-700">
            <div className="container mx-auto px-4 py-4">
                <div className="flex items-center justify-between">
                    {/* Logo and Title */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center gap-3"
                    >
                        <div className="p-2 bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg">
                            <Shield className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold gradient-text">
                                PhishBlocker
                            </h1>
                            <p className="text-xs text-gray-600 dark:text-gray-400">
                                Advanced Threat Detection
                            </p>
                        </div>
                    </motion.div>

                    {/* Actions */}
                    <div className="flex items-center gap-4">
                        {/* API Status */}
                        <div className="hidden sm:flex items-center gap-2">
                            <div className="w-2 h-2 bg-success-500 rounded-full animate-pulse"></div>
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                                API Connected
                            </span>
                        </div>

                        {/* Dark Mode Toggle */}
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={toggleDarkMode}
                            className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                            aria-label="Toggle dark mode"
                        >
                            {darkMode ? (
                                <Sun className="w-5 h-5 text-yellow-500" />
                            ) : (
                                <Moon className="w-5 h-5 text-gray-700" />
                            )}
                        </motion.button>
                    </div>
                </div>
            </div>
        </header>
    )
}
