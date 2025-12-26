import React from 'react'
import ReactDOM from 'react-dom/client'
import { useState, useEffect } from 'react'
import {
    Shield,
    Search,
    Clock,
    TrendingUp,
    AlertTriangle,
    CheckCircle,
    Settings,
    Activity,
    Zap,
    List,
    Home,
    BarChart3,
    Plus,
    Trash2,
    RefreshCw,
    ExternalLink,
    Bell,
    X
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import './popup.css'

function Popup() {
    const [activeTab, setActiveTab] = useState('home')
    const [isScanning, setIsScanning] = useState(false)
    const [scanUrl, setScanUrl] = useState('')
    const [currentUrl, setCurrentUrl] = useState('')
    const [showSettings, setShowSettings] = useState(false)
    const [newDomain, setNewDomain] = useState('')
    const [scanResult, setScanResult] = useState(null)

    const [settings, setSettings] = useState({
        enabled: true,
        blockPhishing: true,
        showWarnings: true,
    })

    const [stats, setStats] = useState({
        scansToday: 0,
        threatsBlocked: 0,
    })

    const [recentScans, setRecentScans] = useState([])
    const [whitelist, setWhitelist] = useState([])

    useEffect(() => {
        // Get current tab URL
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0]?.url) {
                try {
                    const url = new URL(tabs[0].url)
                    setCurrentUrl(url.hostname)
                    setScanUrl(tabs[0].url)
                } catch (e) {
                    setCurrentUrl('Unknown')
                }
            }
        })

        // Load settings
        chrome.storage.sync.get(['settings'], (result) => {
            if (result.settings) {
                setSettings(result.settings)
            }
        })

        // Load stats
        chrome.storage.local.get(['stats'], (result) => {
            if (result.stats) {
                setStats(result.stats)
            }
        })

        // Load recent scans
        chrome.storage.local.get(['recentScans'], (result) => {
            if (result.recentScans) {
                setRecentScans(result.recentScans)
            }
        })

        // Load whitelist
        chrome.storage.sync.get(['whitelist'], (result) => {
            if (result.whitelist) {
                setWhitelist(result.whitelist)
            }
        })
    }, [])

    const handleScan = async () => {
        if (!scanUrl) return
        setIsScanning(true)

        try {
            const response = await fetch('http://localhost:8000/scan', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: scanUrl, user_id: 'extension_user' })
            })

            const result = await response.json()
            setScanResult(result)

            // Add to recent scans
            const newScan = {
                url: scanUrl,
                is_phishing: result.is_phishing,
                threat_level: result.threat_level,
                confidence: result.confidence,
                timestamp: new Date().toISOString()
            }

            const updatedScans = [newScan, ...recentScans].slice(0, 10)
            setRecentScans(updatedScans)
            chrome.storage.local.set({ recentScans: updatedScans })

            // Update stats
            const newStats = {
                scansToday: stats.scansToday + 1,
                threatsBlocked: stats.threatsBlocked + (result.is_phishing ? 1 : 0)
            }
            setStats(newStats)
            chrome.storage.local.set({ stats: newStats })

        } catch (error) {
            console.error('Scan error:', error)
            alert('Failed to scan URL. Make sure the API is running.')
        } finally {
            setIsScanning(false)
        }
    }

    const updateSettings = (key, value) => {
        const newSettings = { ...settings, [key]: value }
        setSettings(newSettings)
        chrome.storage.sync.set({ settings: newSettings })
    }

    const addToWhitelist = () => {
        if (newDomain && !whitelist.includes(newDomain)) {
            const updated = [...whitelist, newDomain]
            setWhitelist(updated)
            chrome.storage.sync.set({ whitelist: updated })
            setNewDomain('')
        }
    }

    const removeFromWhitelist = (domain) => {
        const updated = whitelist.filter(d => d !== domain)
        setWhitelist(updated)
        chrome.storage.sync.set({ whitelist: updated })
    }

    const clearHistory = () => {
        setRecentScans([])
        chrome.storage.local.set({ recentScans: [] })
    }

    const openDashboard = () => {
        chrome.tabs.create({ url: 'http://localhost:3000' })
    }

    const refreshRules = () => {
        chrome.runtime.sendMessage({ action: 'refreshProtection' })
        alert('Protection rules refreshed!')
    }

    const clearCache = () => {
        chrome.storage.local.clear()
        setRecentScans([])
        setStats({ scansToday: 0, threatsBlocked: 0 })
        alert('Cache cleared!')
    }

    const tabs = [
        { id: 'home', icon: Home, label: 'Home' },
        { id: 'history', icon: Clock, label: 'History' },
        { id: 'whitelist', icon: List, label: 'Trusted' },
        { id: 'stats', icon: BarChart3, label: 'Stats' },
    ]

    return (
        <div className="h-full flex flex-col bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
            {/* Header */}
            <header className="px-5 py-4 border-b border-white/50 bg-white/80 backdrop-blur-sm">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <div className="w-11 h-11 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
                                <Shield className="w-6 h-6 text-white" />
                            </div>
                            {settings.enabled && (
                                <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-white animate-pulse"></div>
                            )}
                        </div>
                        <div>
                            <h1 className="text-base font-bold text-slate-900">PhishBlocker</h1>
                            <p className="text-xs text-slate-600">{currentUrl}</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setShowSettings(!showSettings)}
                        className={`p-2.5 rounded-xl transition-all ${showSettings
                                ? 'bg-indigo-100 text-indigo-600'
                                : 'hover:bg-slate-100 text-slate-600'
                            }`}
                    >
                        <Settings className="w-4 h-4" />
                    </button>
                </div>

                {/* Tab Navigation */}
                <div className="flex gap-2 mt-4">
                    {tabs.map((tab) => {
                        const Icon = tab.icon
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-semibold transition-all ${activeTab === tab.id
                                        ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/30'
                                        : 'bg-white/60 text-slate-600 hover:bg-white'
                                    }`}
                            >
                                <Icon className="w-4 h-4" />
                                {tab.label}
                            </button>
                        )
                    })}
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto px-5 py-4">
                <AnimatePresence mode="wait">
                    {/* Home Tab */}
                    {activeTab === 'home' && (
                        <motion.div
                            key="home"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="space-y-4"
                        >
                            {/* Status Banner */}
                            <div className={`p-4 rounded-2xl shadow-lg ${settings.enabled
                                    ? 'bg-gradient-to-r from-emerald-500 to-teal-500'
                                    : 'bg-gradient-to-r from-orange-500 to-amber-500'
                                }`}>
                                <div className="flex items-center gap-3 text-white">
                                    <CheckCircle className="w-6 h-6" />
                                    <div>
                                        <h3 className="text-sm font-bold">
                                            {settings.enabled ? 'Protection Active' : 'Protection Inactive'}
                                        </h3>
                                        <p className="text-xs opacity-90">
                                            {settings.enabled ? 'Real-time monitoring enabled' : 'Click settings to enable'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Quick Stats */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="p-4 rounded-2xl bg-white shadow-lg">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-xs font-medium text-slate-600">Scans Today</span>
                                        <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                                            <Activity className="w-4 h-4 text-white" />
                                        </div>
                                    </div>
                                    <div className="text-3xl font-bold text-slate-900">{stats.scansToday}</div>
                                </div>

                                <div className="p-4 rounded-2xl bg-white shadow-lg">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-xs font-medium text-slate-600">Threats Blocked</span>
                                        <div className="w-9 h-9 bg-gradient-to-br from-red-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg shadow-red-500/20">
                                            <Shield className="w-4 h-4 text-white" />
                                        </div>
                                    </div>
                                    <div className="text-3xl font-bold text-slate-900">{stats.threatsBlocked}</div>
                                </div>
                            </div>

                            {/* URL Scanner */}
                            <div className="p-5 rounded-2xl bg-white shadow-lg">
                                <div className="flex items-center gap-2 mb-4">
                                    <Search className="w-5 h-5 text-indigo-600" />
                                    <h2 className="text-sm font-bold text-slate-900">Quick Scan</h2>
                                </div>

                                <div className="space-y-3">
                                    <input
                                        type="url"
                                        value={scanUrl}
                                        onChange={(e) => setScanUrl(e.target.value)}
                                        placeholder="https://example.com"
                                        className="w-full px-4 py-3 rounded-xl text-sm bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 border focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    />

                                    <button
                                        onClick={handleScan}
                                        disabled={!scanUrl || isScanning}
                                        className={`w-full py-3 px-4 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${!scanUrl || isScanning
                                                ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                                : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg shadow-indigo-500/30'
                                            }`}
                                    >
                                        {isScanning ? (
                                            <>
                                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                                Scanning...
                                            </>
                                        ) : (
                                            <>
                                                <Zap className="w-4 h-4" />
                                                Scan This Page
                                            </>
                                        )}
                                    </button>
                                </div>

                                {/* Scan Result */}
                                {scanResult && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className={`mt-4 p-4 rounded-xl ${scanResult.is_phishing
                                                ? 'bg-red-50 border-2 border-red-200'
                                                : 'bg-green-50 border-2 border-green-200'
                                            }`}
                                    >
                                        <div className="flex items-start gap-3">
                                            {scanResult.is_phishing ? (
                                                <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
                                            ) : (
                                                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                                            )}
                                            <div className="flex-1">
                                                <h4 className={`text-sm font-bold ${scanResult.is_phishing ? 'text-red-900' : 'text-green-900'
                                                    }`}>
                                                    {scanResult.is_phishing ? '⚠️ Phishing Detected!' : '✅ Safe Site'}
                                                </h4>
                                                <p className={`text-xs mt-1 ${scanResult.is_phishing ? 'text-red-700' : 'text-green-700'
                                                    }`}>
                                                    Confidence: {(scanResult.confidence * 100).toFixed(1)}%
                                                </p>
                                                <p className={`text-xs ${scanResult.is_phishing ? 'text-red-700' : 'text-green-700'
                                                    }`}>
                                                    Threat Level: {scanResult.threat_level}
                                                </p>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </div>

                            {/* Quick Actions */}
                            <div className="grid grid-cols-3 gap-2">
                                <button
                                    onClick={openDashboard}
                                    className="p-3 bg-white rounded-xl shadow-lg hover:shadow-xl transition-all flex flex-col items-center gap-2"
                                >
                                    <ExternalLink className="w-5 h-5 text-blue-600" />
                                    <span className="text-xs font-semibold text-slate-700">Dashboard</span>
                                </button>
                                <button
                                    onClick={refreshRules}
                                    className="p-3 bg-white rounded-xl shadow-lg hover:shadow-xl transition-all flex flex-col items-center gap-2"
                                >
                                    <RefreshCw className="w-5 h-5 text-green-600" />
                                    <span className="text-xs font-semibold text-slate-700">Refresh</span>
                                </button>
                                <button
                                    onClick={clearCache}
                                    className="p-3 bg-white rounded-xl shadow-lg hover:shadow-xl transition-all flex flex-col items-center gap-2"
                                >
                                    <Trash2 className="w-5 h-5 text-red-600" />
                                    <span className="text-xs font-semibold text-slate-700">Clear</span>
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {/* History Tab */}
                    {activeTab === 'history' && (
                        <motion.div
                            key="history"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="space-y-3"
                        >
                            <div className="flex items-center justify-between">
                                <h3 className="text-sm font-bold text-slate-900">Recent Scans</h3>
                                {recentScans.length > 0 && (
                                    <button
                                        onClick={clearHistory}
                                        className="text-xs text-red-600 hover:text-red-700 font-semibold"
                                    >
                                        Clear All
                                    </button>
                                )}
                            </div>

                            {recentScans.length === 0 ? (
                                <div className="text-center py-8 text-slate-500">
                                    <Clock className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                    <p className="text-sm">No scans yet</p>
                                </div>
                            ) : (
                                recentScans.map((scan, i) => (
                                    <div key={i} className="p-4 rounded-xl bg-white shadow-lg">
                                        <div className="flex items-start gap-3">
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${scan.is_phishing ? 'bg-red-100' : 'bg-green-100'
                                                }`}>
                                                {scan.is_phishing ? (
                                                    <AlertTriangle className="w-5 h-5 text-red-600" />
                                                ) : (
                                                    <CheckCircle className="w-5 h-5 text-green-600" />
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-semibold text-slate-900 truncate">
                                                    {scan.is_phishing ? 'Threat detected' : 'Safe site'}
                                                </p>
                                                <p className="text-xs text-slate-600 mt-0.5 truncate">{scan.url}</p>
                                                <p className="text-xs text-slate-500 mt-1">
                                                    {new Date(scan.timestamp).toLocaleString()}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </motion.div>
                    )}

                    {/* Whitelist Tab */}
                    {activeTab === 'whitelist' && (
                        <motion.div
                            key="whitelist"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="space-y-3"
                        >
                            <h3 className="text-sm font-bold text-slate-900">Trusted Sites</h3>

                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={newDomain}
                                    onChange={(e) => setNewDomain(e.target.value)}
                                    placeholder="example.com"
                                    className="flex-1 px-4 py-2.5 rounded-xl text-sm bg-white border-slate-200 text-slate-900 border focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                                <button
                                    onClick={addToWhitelist}
                                    className="px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold shadow-lg"
                                >
                                    <Plus className="w-4 h-4" />
                                </button>
                            </div>

                            {whitelist.length === 0 ? (
                                <div className="text-center py-8 text-slate-500">
                                    <List className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                    <p className="text-sm">No trusted sites yet</p>
                                </div>
                            ) : (
                                whitelist.map((domain, i) => (
                                    <div key={i} className="p-3 rounded-xl flex items-center justify-between bg-white shadow-lg">
                                        <span className="text-sm text-slate-900">{domain}</span>
                                        <button
                                            onClick={() => removeFromWhitelist(domain)}
                                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))
                            )}
                        </motion.div>
                    )}

                    {/* Stats Tab */}
                    {activeTab === 'stats' && (
                        <motion.div
                            key="stats"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="space-y-4"
                        >
                            <h3 className="text-sm font-bold text-slate-900">Statistics</h3>

                            <div className="grid grid-cols-2 gap-3">
                                {[
                                    { label: 'Total Scans', value: stats.scansToday, icon: Search, color: 'from-blue-500 to-cyan-500' },
                                    { label: 'Threats Blocked', value: stats.threatsBlocked, icon: Shield, color: 'from-red-500 to-pink-500' },
                                    { label: 'Safe Sites', value: stats.scansToday - stats.threatsBlocked, icon: CheckCircle, color: 'from-emerald-500 to-teal-500' },
                                    { label: 'Detection Rate', value: stats.scansToday > 0 ? `${((stats.threatsBlocked / stats.scansToday) * 100).toFixed(1)}%` : '0%', icon: TrendingUp, color: 'from-purple-500 to-indigo-500' },
                                ].map((stat, i) => {
                                    const Icon = stat.icon
                                    return (
                                        <div key={i} className="p-4 rounded-2xl bg-white shadow-lg">
                                            <div className={`w-10 h-10 bg-gradient-to-br ${stat.color} rounded-xl flex items-center justify-center mb-3 shadow-lg`}>
                                                <Icon className="w-5 h-5 text-white" />
                                            </div>
                                            <div className="text-2xl font-bold text-slate-900">{stat.value}</div>
                                            <div className="text-xs text-slate-600 mt-1">{stat.label}</div>
                                        </div>
                                    )
                                })}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>

            {/* Settings Overlay */}
            <AnimatePresence>
                {showSettings && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/50 backdrop-blur-sm z-50"
                        onClick={() => setShowSettings(false)}
                    >
                        <motion.div
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            onClick={(e) => e.stopPropagation()}
                            className="absolute bottom-0 left-0 right-0 rounded-t-3xl bg-white p-6 max-h-[80%] overflow-y-auto"
                        >
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-lg font-bold text-slate-900">Settings</h2>
                                <button
                                    onClick={() => setShowSettings(false)}
                                    className="p-2 hover:bg-slate-100 rounded-lg"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="space-y-4">
                                {[
                                    { key: 'enabled', label: 'Enable Protection', desc: 'Turn on real-time phishing detection', icon: Shield },
                                    { key: 'blockPhishing', label: 'Block Phishing Sites', desc: 'Automatically block detected threats', icon: AlertTriangle },
                                    { key: 'showWarnings', label: 'Show Warnings', desc: 'Display warning notifications', icon: Bell },
                                ].map((setting) => {
                                    const Icon = setting.icon
                                    return (
                                        <div key={setting.key} className="p-4 rounded-xl bg-slate-50">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${settings[setting.key] ? 'bg-indigo-100' : 'bg-slate-200'
                                                        }`}>
                                                        <Icon className={`w-5 h-5 ${settings[setting.key] ? 'text-indigo-600' : 'text-slate-400'
                                                            }`} />
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-semibold text-slate-900">{setting.label}</div>
                                                        <div className="text-xs text-slate-600">{setting.desc}</div>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => updateSettings(setting.key, !settings[setting.key])}
                                                    className={`relative w-12 h-7 rounded-full transition-colors ${settings[setting.key] ? 'bg-indigo-600' : 'bg-slate-300'
                                                        }`}
                                                >
                                                    <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-transform ${settings[setting.key] ? 'translate-x-6' : 'translate-x-1'
                                                        }`} />
                                                </button>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Footer */}
            <footer className="px-5 py-3 border-t border-white/50 bg-white/80 backdrop-blur-sm">
                <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-600">v2.0.0</span>
                    <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                        <span className="text-slate-600">Protected</span>
                    </div>
                </div>
            </footer>
        </div>
    )
}

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <Popup />
    </React.StrictMode>
)
