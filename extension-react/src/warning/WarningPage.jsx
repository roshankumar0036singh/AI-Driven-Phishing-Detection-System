import { useState, useEffect } from 'react'
import { AlertTriangle, ArrowLeft, Shield, XCircle, Flag } from 'lucide-react'
import { motion } from 'framer-motion'

export default function WarningPage() {
    const [urlData, setUrlData] = useState(null)
    const [blockedUrl, setBlockedUrl] = useState('')

    useEffect(() => {
        // Get URL from query parameters
        const params = new URLSearchParams(window.location.search)
        const url = params.get('url')
        setBlockedUrl(url || '')

        // Get scan data from storage
        chrome.storage.local.get(['lastScanResult'], (result) => {
            if (result.lastScanResult) {
                setUrlData(result.lastScanResult)
            }
        })
    }, [])

    const goBack = () => {
        window.history.back()
    }

    const proceedAnyway = () => {
        if (blockedUrl) {
            // Add to whitelist temporarily
            chrome.storage.local.set({ tempBypass: blockedUrl })
            window.location.href = blockedUrl
        }
    }

    const reportFalsePositive = () => {
        chrome.runtime.sendMessage({
            action: 'reportFalsePositive',
            url: blockedUrl
        })
        alert('Thank you for reporting! We will review this site.')
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="max-w-2xl w-full"
            >
                {/* Warning Icon */}
                <motion.div
                    animate={{
                        scale: [1, 1.1, 1],
                        rotate: [0, -5, 5, 0]
                    }}
                    transition={{
                        repeat: Infinity,
                        duration: 2,
                        ease: "easeInOut"
                    }}
                    className="flex justify-center mb-6"
                >
                    <div className="w-24 h-24 bg-gradient-to-br from-red-500 to-red-700 rounded-full flex items-center justify-center shadow-2xl">
                        <AlertTriangle className="w-12 h-12 text-white" />
                    </div>
                </motion.div>

                {/* Main Card */}
                <div className="bg-white rounded-2xl shadow-2xl p-8">
                    <h1 className="text-4xl font-bold text-gray-900 text-center mb-2">
                        ⚠️ Phishing Warning
                    </h1>
                    <p className="text-center text-gray-600 mb-6">
                        PhishBlocker has detected a potential threat
                    </p>

                    {/* Blocked URL */}
                    <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 mb-6">
                        <div className="flex items-start gap-3">
                            <XCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
                            <div className="flex-1">
                                <h3 className="font-bold text-red-900 mb-1">Blocked Website</h3>
                                <p className="text-sm text-red-700 break-all font-mono bg-white px-3 py-2 rounded">
                                    {blockedUrl || 'Unknown URL'}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Threat Details */}
                    {urlData && (
                        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-6">
                            <h3 className="font-bold text-orange-900 mb-3 flex items-center gap-2">
                                <Shield className="w-5 h-5" />
                                Threat Analysis
                            </h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-xs text-gray-600 mb-1">Threat Level</p>
                                    <span className={`inline-block px-3 py-1 rounded-full text-sm font-bold ${urlData.threat_level === 'High'
                                            ? 'bg-red-100 text-red-700'
                                            : urlData.threat_level === 'Medium'
                                                ? 'bg-orange-100 text-orange-700'
                                                : 'bg-yellow-100 text-yellow-700'
                                        }`}>
                                        {urlData.threat_level}
                                    </span>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-600 mb-1">Confidence</p>
                                    <span className="text-lg font-bold text-gray-900">
                                        {(urlData.confidence * 100).toFixed(1)}%
                                    </span>
                                </div>
                            </div>

                            {urlData.risk_factors && urlData.risk_factors.length > 0 && (
                                <div className="mt-4">
                                    <p className="text-xs font-semibold text-gray-700 mb-2">Risk Factors:</p>
                                    <ul className="space-y-1">
                                        {urlData.risk_factors.slice(0, 5).map((factor, index) => (
                                            <li key={index} className="text-sm text-gray-700 flex items-start gap-2">
                                                <span className="text-red-500 mt-0.5">•</span>
                                                <span>{factor}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Warning Message */}
                    <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
                        <p className="text-sm text-gray-700 leading-relaxed">
                            <strong>⚠️ Warning:</strong> This website may be attempting to steal your personal information,
                            passwords, or financial data. We strongly recommend not proceeding to this site.
                        </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-3">
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={goBack}
                            className="flex-1 py-4 px-6 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
                        >
                            <ArrowLeft className="w-5 h-5" />
                            Go Back to Safety
                        </motion.button>

                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={reportFalsePositive}
                            className="sm:w-auto py-4 px-6 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-all flex items-center justify-center gap-2"
                        >
                            <Flag className="w-5 h-5" />
                            Report False Positive
                        </motion.button>
                    </div>

                    {/* Proceed Anyway (Small, Less Prominent) */}
                    <div className="mt-4 text-center">
                        <button
                            onClick={proceedAnyway}
                            className="text-sm text-gray-500 hover:text-gray-700 underline"
                        >
                            I understand the risks, proceed anyway
                        </button>
                    </div>
                </div>

                {/* Footer */}
                <div className="text-center mt-6 text-gray-600 text-sm">
                    <p>Protected by <strong>PhishBlocker</strong></p>
                    <p className="text-xs mt-1">Advanced AI-driven phishing detection</p>
                </div>
            </motion.div>
        </div>
    )
}
