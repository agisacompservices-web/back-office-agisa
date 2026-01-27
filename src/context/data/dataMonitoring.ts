export interface SystemMetric {
    name: string
    value: number
    unit: string
    status: "healthy" | "warning" | "critical"
    trend: number // percentage change
}

export interface ServiceStatus {
    name: string
    status: "up" | "down" | "degraded"
    uptime: string
    latency: number // ms
}

export interface PerformanceData {
    timestamp: string
    requestCount: number
    responseTime: number
}

export const systemMetrics: SystemMetric[] = [
    { name: "CPU Usage", value: 42, unit: "%", status: "healthy", trend: -5 },
    { name: "Memory Usage", value: 68, unit: "%", status: "healthy", trend: 2 },
    { name: "Storage space", value: 89, unit: "%", status: "warning", trend: 1 },
    { name: "Active Sessions", value: 124, unit: "", status: "healthy", trend: 12 }
]

export const servicesStatus: ServiceStatus[] = [
    { name: "Core API", status: "up", uptime: "99.99%", latency: 45 },
    { name: "Finance Gateway", status: "up", uptime: "99.95%", latency: 85 },
    { name: "Accounting Worker", status: "up", uptime: "100%", latency: 120 },
    { name: "Litigation Storage", status: "degraded", uptime: "98.5%", latency: 450 },
    { name: "Analytics Engine", status: "up", uptime: "99.9%", latency: 210 }
]

export const performanceHistory: PerformanceData[] = [
    { timestamp: "08:00", requestCount: 450, responseTime: 120 },
    { timestamp: "09:00", requestCount: 820, responseTime: 150 },
    { timestamp: "10:00", requestCount: 1200, responseTime: 180 },
    { timestamp: "11:00", requestCount: 1500, responseTime: 210 },
    { timestamp: "12:00", requestCount: 1350, responseTime: 195 },
    { timestamp: "13:00", requestCount: 1100, responseTime: 170 },
    { timestamp: "14:00", requestCount: 950, responseTime: 160 },
    { timestamp: "15:00", requestCount: 1400, responseTime: 200 },
    { timestamp: "16:00", requestCount: 1650, responseTime: 230 },
    { timestamp: "17:00", requestCount: 1300, responseTime: 190 },
    { timestamp: "18:00", requestCount: 900, responseTime: 150 }
]
