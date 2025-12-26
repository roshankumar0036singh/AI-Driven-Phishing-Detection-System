import { useState, useEffect } from 'react'
import { Cpu, CheckCircle, XCircle } from 'lucide-react'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export default function ModelInfo() {
    const [modelInfo, setModelInfo] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchModelInfo()
        const interval = setInterval(fetchModelInfo, 30000) // Refresh every 30s
        return () => clearInterval(interval)
    }, [])

    const fetchModelInfo = async () => {
        try {
            const response = await fetch(`${API_URL}/api/model/info`)
            if (response.ok) {
                const data = await response.json()
                setModelInfo(data)
            }
        } catch (error) {
            console.error('Error fetching model info:', error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                    <Cpu className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    ML Model Status
                </h2>
            </div>

            {loading ? (
                <div className="space-y-3">
                    <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                    <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                    <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                </div>
            ) : modelInfo ? (
                <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Status
                        </span>
                        <div className="flex items-center gap-2">
                            {modelInfo.status === 'loaded' ? (
                                <>
                                    <CheckCircle className="w-4 h-4 text-green-600" />
                                    <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                                        Active
                                    </span>
                                </>
                            ) : (
                                <>
                                    <XCircle className="w-4 h-4 text-red-600" />
                                    <span className="text-sm font-semibold text-red-600 dark:text-red-400">
                                        Inactive
                                    </span>
                                </>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Model Type
                        </span>
                        <span className="text-sm font-semibold text-gray-900 dark:text-white">
                            {modelInfo.model_type || 'N/A'}
                        </span>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Version
                        </span>
                        <span className="text-sm font-semibold text-gray-900 dark:text-white">
                            {modelInfo.version || 'N/A'}
                        </span>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Features
                        </span>
                        <span className="text-sm font-semibold text-gray-900 dark:text-white">
                            {modelInfo.features || 0}
                        </span>
                    </div>

                    {modelInfo.models && (
                        <div className="mt-4">
                            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                Active Models
                            </h3>
                            <div className="space-y-2">
                                {modelInfo.models.map((model, index) => (
                                    <div
                                        key={index}
                                        className="flex items-center gap-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg"
                                    >
                                        <CheckCircle className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                        <span className="text-sm text-gray-900 dark:text-white">
                                            {model}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <XCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Model information unavailable</p>
                </div>
            )}
        </div>
    )
}
