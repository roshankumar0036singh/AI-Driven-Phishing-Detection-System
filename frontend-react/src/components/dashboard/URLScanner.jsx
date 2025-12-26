import { useState } from 'react'
import { Search, Zap, AlertTriangle, CheckCircle, Loader } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export default function URLScanner() {
    const [url, setUrl] = useState('')
    const [scanning, setScanning] = useState(false)
    const [result, setResult] = useState(null)

    const handleScan = async (e) => {
        e.preventDefault()
        if (!url) return

        setScanning(true)
        setResult(null)

        try {
            const response = await fetch(`${API_URL}/api/scan`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url, user_id: 'dashboard_user' })
            })

            if (response.ok) {
                const data = await response.json()
                setResult(data)
            } else {
                setResult({ error: 'Scan failed. Please try again.' })
            }
        } catch (error) {
            console.error('Scan error:', error)
            setResult({ error: 'Network error. Make sure the API is running.' })
        } finally {
            setScanning(false)
        }
    }

    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <Search className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    URL Scanner
                </h2>
            </div>

            <form onSubmit={handleScan} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Enter URL to scan
                    </label>
                    <input
                        type="url"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        placeholder="https://example.com"
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                    />
                </div>

                <button
                    type="submit"
                    disabled={scanning || !url}
                    className={`w-full py-3 px-4 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all ${scanning || !url
                            ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed'
                            : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg shadow-blue-500/30'
                        }`}
                >
                    {scanning ? (
                        <>
                            <Loader className="w-5 h-5 animate-spin" />
                            Scanning...
                        </>
                    ) : (
                        <>
                            <Zap className="w-5 h-5" />
                            Scan URL
                        </>
                    )}
                </button>
            </form>

            {/* Scan Result */}
            <AnimatePresence>
                {result && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="mt-6"
                    >
                        {result.error ? (
                            <div className="p-4 bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-xl">
                                <div className="flex items-start gap-3">
                                    <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <h4 className="text-sm font-bold text-red-900 dark:text-red-100">
                                            Error
                                        </h4>
                                        <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                                            {result.error}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className={`p-4 rounded-xl border-2 ${result.is_phishing
                                    ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                                    : 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                                }`}>
                                <div className="flex items-start gap-3">
                                    {result.is_phishing ? (
                                        <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400 flex-shrink-0" />
                                    ) : (
                                        <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400 flex-shrink-0" />
                                    )}
                                    <div className="flex-1">
                                        <h4 className={`text-sm font-bold ${result.is_phishing
                                                ? 'text-red-900 dark:text-red-100'
                                                : 'text-green-900 dark:text-green-100'
                                            }`}>
                                            {result.is_phishing ? '⚠️ Phishing Detected!' : '✅ Safe Site'}
                                        </h4>
                                        <div className={`text-xs mt-2 space-y-1 ${result.is_phishing
                                                ? 'text-red-700 dark:text-red-300'
                                                : 'text-green-700 dark:text-green-300'
                                            }`}>
                                            <p>Confidence: {(result.confidence * 100).toFixed(1)}%</p>
                                            <p>Threat Level: {result.threat_level}</p>
                                            {result.risk_factors && result.risk_factors.length > 0 && (
                                                <div className="mt-2">
                                                    <p className="font-semibold">Risk Factors:</p>
                                                    <ul className="list-disc list-inside ml-2 mt-1">
                                                        {result.risk_factors.slice(0, 3).map((factor, i) => (
                                                            <li key={i}>{factor}</li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
