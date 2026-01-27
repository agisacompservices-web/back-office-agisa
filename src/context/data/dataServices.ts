export type ServiceStatus = "active" | "inactive" | "maintenance"

export interface AgisaService {
    id: string
    name: string
    description: string
    status: ServiceStatus
    category: string
    manager: string
    totalVolume: number
    createdAt: string
}

export const servicesData: AgisaService[] = [
    {
        id: "SRV-001",
        name: "KiskeyA Betting",
        description: "Betting service for the Agisa group.",
        status: "active",
        category: "Betting",
        manager: "Robert Brown",
        totalVolume: 1250000.00,
        createdAt: "2023-01-15"
    },
    {
        id: "SRV-002",
        name: "KiskeyA Logistics",
        description: "Supply chain and transport management for regional operations.",
        status: "active",
        category: "Logistics",
        manager: "Jane Smith",
        totalVolume: 850000.00,
        createdAt: "2023-03-20"
    },
    {
        id: "SRV-003",
        name: "KiskeyA Tech",
        description: "Internal software development and IT infrastructure support.",
        status: "maintenance",
        category: "Technology",
        manager: "Alice Johnson",
        totalVolume: 0.00,
        createdAt: "2023-06-10"
    },
    {
        id: "SRV-004",
        name: "KiskeyA Insurance",
        description: "Risk management and insurance services for group assets.",
        status: "inactive",
        category: "Insurance",
        manager: "Michael Green",
        totalVolume: 450000.00,
        createdAt: "2023-08-05"
    },
    {
        id: "SRV-005",
        name: "KiskeyA Real Estate",
        description: "Property management and real estate investment portfolio.",
        status: "active",
        category: "Real Estate",
        manager: "Emily White",
        totalVolume: 3200000.00,
        createdAt: "2023-11-12"
    }
]
