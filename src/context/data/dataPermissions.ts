export type PermissionCategory = "Finance" | "Accounting" | "Litigation" | "Services" | "Administration"

export interface Permission {
    id: string
    name: string
    description: string
    category: PermissionCategory
}

export interface RolePermissions {
    role: string
    permissions: string[] // Array of permission IDs
}

export const allPermissions: Permission[] = [
    // Finance
    { id: "fin_view", name: "View Transactions", description: "Ability to view all financial transactions", category: "Finance" },
    { id: "fin_create", name: "Create Delivery", description: "Create new cash delivery requests", category: "Finance" },
    { id: "fin_export", name: "Export Reports", description: "Export financial reports to CSV/PDF", category: "Finance" },

    // Accounting
    { id: "acc_view", name: "View Requests", description: "View inbound accounting requests", category: "Accounting" },
    { id: "acc_process", name: "Process Demands", description: "Accept or reject accounting demands", category: "Accounting" },
    { id: "acc_route", name: "Route to Litigation", description: "Send complex cases to litigation department", category: "Accounting" },

    // Litigation
    { id: "lit_view", name: "View Legal Cases", description: "Access all legal and litigation folders", category: "Litigation" },
    { id: "lit_validate", name: "Validate Settlements", description: "Final validation on legal settlements", category: "Litigation" },

    // Services
    { id: "ser_view", name: "View All Services", description: "View group conglomerate services", category: "Services" },
    { id: "ser_manage", name: "Manage Entities", description: "Register or deactivate service entities", category: "Services" },

    // Administration
    { id: "adm_users", name: "Manage Users", description: "Create, edit and suspend user accounts", category: "Administration" },
    { id: "adm_roles", name: "Manage Roles", description: "Modify role permissions and hierarchy", category: "Administration" },
    { id: "adm_logs", name: "View Audit Logs", description: "Access system-wide activity logs", category: "Administration" },
]

export const rolesData: RolePermissions[] = [
    {
        role: "pdg",
        permissions: allPermissions.map(p => p.id) // Full access
    },
    {
        role: "finance",
        permissions: ["fin_view", "fin_create", "fin_export", "ser_view", "acc_view"]
    },
    {
        role: "accounting",
        permissions: ["acc_view", "acc_process", "acc_route", "ser_view", "fin_view"]
    },
    {
        role: "litigation",
        permissions: ["lit_view", "lit_validate", "ser_view", "acc_view"]
    },
    {
        role: "agent",
        permissions: ["fin_view", "acc_view", "ser_view"]
    }
]
