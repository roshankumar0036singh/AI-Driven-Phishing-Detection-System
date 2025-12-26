import { useState, useEffect } from 'react'
import { Activity, Shield, TrendingUp, Users } from 'lucide-react'
import { motion } from 'framer-motion'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export default function StatsCards() {
    const [stats, setStats] = useState({
        total_scans: 0,
        threats_blocked: 0,
        active_users: 0,
        detection_rate: 0
    })
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchStats()
        // Refresh every 5 seconds
        const interval = setInterval(fetchStats, 5000)
        return () => clearInterval(interval)
    }, [])

    const fetchStats = async () => {
        try {
            const response = await fetch(`${API_URL}/api/analytics/global/stats`)
            if (response.ok) {
                const data = await response.json()
                setStats(data)
            }
        } catch (error) {
            console.error('Error fetching stats:', error)
        } finally {
            setLoading(false)
        }
    }

    const cards = [
        {
            title: 'Total Scans',
            value: stats.total_scans,
            icon: Activity,
            color: 'from-blue-500 to-cyan-500',
            bgColor: 'bg-blue-50 dark:bg-blue-900/20',
            change: '+12%'
        },
        {
            title: 'Threats Blocked',
            value: stats.threats_blocked,
            icon: Shield,
            color: 'from-red-500 to-pink-500',
            bgColor: 'bg-red-50 dark:bg-red-900/20',
            change: '+8%'
        },
        {
            title: 'Detection Rate',
            value: `${stats.detection_rate}%`,
            icon: TrendingUp,
            color: 'from-emerald-500 to-teal-500',
            bgColor: 'bg-emerald-50 dark:bg-emerald-900/20',
            change: '+2.3%'
        },
        {
            title: 'Active Users',
            value: stats.active_users,
            icon: Users,
            color: 'from-purple-500 to-indigo-500',
            bgColor: 'bg-purple-50 dark:bg-purple-900/20',
            change: '+5%'
        }
    ]

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {cards.map((card, index) => {
                const Icon = card.icon
                return (
                    <motion.div
                        key={card.title}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                        className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <div className={`p-3 rounded-xl ${card.bgColor}`}>
                                <div className={`w-10 h-10 bg-gradient-to-br ${card.color} rounded-lg flex items-center justify-center`}>
                                    <Icon className="w-5 h-5 text-white" />
                                </div>
                            </div>
                            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                                {card.change}
                            </span>
                        </div>

                        <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                            {card.title}
                        </h3>

                        {loading ? (
                            <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                        ) : (
                            <p className="text-3xl font-bold text-gray-900 dark:text-white">
                                {card.value.toLocaleString()}
                            </p>
                        )}
                    </motion.div>
                )
            })}
        </div>
    )
}
