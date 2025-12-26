import { useState, useEffect } from 'react'
import { Clock, AlertTriangle, CheckCircle, ExternalLink } from 'lucide-react'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export default function RecentScans() {
    const [scans, setScans] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        // For now, use mock data since we don't have a recent scans endpoint yet
        // In production, this would fetch from /api/scans/recent
        const mockScans = [
            {
                id: 1,
                url: 'https://google.com',
                is_phishing: false,
                threat_level: 'Low',
                confidence: 0.99,
                timestamp: new Date(Date.now() - 120000).toISOString()
            },
            {
                id: 2,
                url: 'http://suspicious-paypal.com',
                is_phishing: true,
                threat_level: 'High',
                confidence: 0.95,
                timestamp: new Date(Date.now() - 300000).toISOString()
            },
            {
                id: 3,
                url: 'https://github.com',
                is_phishing: false,
                threat_level: 'Low',
                confidence: 0.98,
                timestamp: new Date(Date.now() - 600000).toISOString()
            },
            {
                id: 4,
                url: 'http://free-iphone-winner.xyz',
                is_phishing: true,
                threat_level: 'High',
                confidence: 0.92,
                timestamp: new Date(Date.now() - 900000).toISOString()
            },
            {
                id: 5,
                url: 'https://stackoverflow.com',
                is_phishing: false,
                threat_level: 'Low',
                confidence: 0.97,
                timestamp: new Date(Date.now() - 1200000).toISOString()
            }
        ]

        setTimeout(() => {
            setScans(mockScans)
            setLoading(false)
        }, 500)
    }, [])

    const formatTime = (timestamp) => {
        const date = new Date(timestamp)
        const now = new Date()
        const diff = Math.floor((now - date) / 1000)

        if (diff < 60) return 'Just now'
        if (diff < 3600) return `${Math.floor(diff / 60)} min ago`
        if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`
        return date.toLocaleDateString()
    }

    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                        <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                        Recent Scans
                    </h2>
                </div>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                    Last 24 hours
                </span>
            </div>

            {loading ? (
                <div className="space-y-3">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="h-20 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse"></div>
                    ))}
                </div>
            ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                    {scans.map((scan) => (
                        <div
                            key={scan.id}
                            className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                        >
                            <div className="flex items-start gap-3">
                                <div className={`p-2 rounded-lg flex-shrink-0 ${scan.is_phishing
                                        ? 'bg-red-100 dark:bg-red-900/30'
                                        : 'bg-green-100 dark:bg-green-900/30'
                                    }`}>
                                    {scan.is_phishing ? (
                                        <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
                                    ) : (
                                        <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                                    )}
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                                                {scan.url}
                                            </p>
                                            <div className="flex items-center gap-3 mt-1">
                                                <span className={`text-xs font-medium ${scan.is_phishing
                                                        ? 'text-red-600 dark:text-red-400'
                                                        : 'text-green-600 dark:text-green-400'
                                                    }`}>
                                                    {scan.is_phishing ? 'Phishing' : 'Safe'}
                                                </span>
                                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                                    {scan.threat_level} Risk
                                                </span>
                                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                                    {(scan.confidence * 100).toFixed(0)}% confidence
                                                </span>
                                            </div>
                                        </div>
                                        <a
                                            href={scan.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="p-1 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                                        >
                                            <ExternalLink className="w-4 h-4" />
                                        </a>
                                    </div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                                        {formatTime(scan.timestamp)}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
