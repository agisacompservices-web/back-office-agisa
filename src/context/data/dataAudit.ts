export type AuditAction = "login" | "logout" | "create" | "update" | "delete" | "permission_change" | "system_config"
export type AuditSeverity = "info" | "warning" | "critical"

export interface AuditLog {
    id: string
    timestamp: string
    user: string
    userId: string
    action: AuditAction
    entity: string
    details: string
    severity: AuditSeverity
    ipAddress: string
}

export const auditLogsData: AuditLog[] = [
    {
        id: "LOG-001",
        timestamp: "2024-01-26 18:45:12",
        user: "Jean Jacques",
        userId: "USR-001",
        action: "login",
        entity: "Session",
        details: "User logged into the system",
        severity: "info",
        ipAddress: "192.168.1.45"
    },
    {
        id: "LOG-002",
        timestamp: "2024-01-26 18:30:22",
        user: "Marie Rose",
        userId: "USR-002",
        action: "update",
        entity: "Finance",
        details: "Updated status of delivery DEL-782 to 'completed'",
        severity: "info",
        ipAddress: "192.168.1.12"
    },
    {
        id: "LOG-003",
        timestamp: "2024-01-26 17:55:05",
        user: "Paul Pierre",
        userId: "USR-003",
        action: "create",
        entity: "Accounting",
        details: "Created new accounting request REQ-901",
        severity: "info",
        ipAddress: "192.168.1.8"
    },
    {
        id: "LOG-004",
        timestamp: "2024-01-26 16:20:15",
        user: "Jean Jacques",
        userId: "USR-001",
        action: "permission_change",
        entity: "Security",
        details: "Modified permissions for role 'AGENT'",
        severity: "warning",
        ipAddress: "192.168.1.45"
    },
    {
        id: "LOG-005",
        timestamp: "2024-01-26 15:10:44",
        user: "Sarah Louis",
        userId: "USR-004",
        action: "delete",
        entity: "Litigation",
        details: "Deleted archived folder FLD-2023-AF",
        severity: "critical",
        ipAddress: "192.168.1.55"
    },
    {
        id: "LOG-006",
        timestamp: "2024-01-26 14:05:33",
        user: "System",
        userId: "SYSTEM",
        action: "system_config",
        entity: "System",
        details: "Automatic database backup completed",
        severity: "info",
        ipAddress: "127.0.0.1"
    },
    {
        id: "LOG-007",
        timestamp: "2024-01-26 12:45:21",
        user: "Alice Johnson",
        userId: "USR-006",
        action: "update",
        entity: "Services",
        details: "Updated metadata for 'KiskeyA'",
        severity: "info",
        ipAddress: "192.168.1.23"
    }
]
