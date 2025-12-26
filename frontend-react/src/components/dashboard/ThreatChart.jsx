import { useState, useEffect } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'
import { TrendingUp } from 'lucide-react'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const COLORS = {
    low: '#10b981',      // emerald-500
    medium: '#f59e0b',   // amber-500
    high: '#ef4444'      // red-500
}

export default function ThreatChart() {
    const [data, setData] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchData()
        const interval = setInterval(fetchData, 10000) // Refresh every 10s
        return () => clearInterval(interval)
    }, [])

    const fetchData = async () => {
        try {
            const response = await fetch(`${API_URL}/api/analytics/threat-distribution`)
            if (response.ok) {
                const result = await response.json()
                const chartData = [
                    { name: 'Low Risk', value: result.low, color: COLORS.low },
                    { name: 'Medium Risk', value: result.medium, color: COLORS.medium },
                    { name: 'High Risk', value: result.high, color: COLORS.high }
                ]
                setData(chartData)
            }
        } catch (error) {
            console.error('Error fetching threat distribution:', error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                    <TrendingUp className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    Threat Distribution
                </h2>
            </div>

            {loading ? (
                <div className="h-64 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
            ) : (
                <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                            outerRadius={100}
                            fill="#8884d8"
                            dataKey="value"
                        >
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                    </PieChart>
                </ResponsiveContainer>
            )}

            <div className="mt-4 grid grid-cols-3 gap-4">
                {data.map((item) => (
                    <div key={item.name} className="text-center">
                        <div className="text-2xl font-bold" style={{ color: item.color }}>
                            {item.value}
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                            {item.name}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
