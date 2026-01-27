export type UserRole = "pdg" | "finance" | "accounting" | "litigation" | "agent"
export type UserStatus = "active" | "inactive" | "suspended"

export interface User {
    id: string
    name: string
    email: string
    role: UserRole
    status: UserStatus
    lastLogin: string
    createdAt: string
    department: string
}

export const usersData: User[] = [
    {
        id: "USR-001",
        name: "Jean Jacques",
        email: "pdg@agisa.com",
        role: "pdg",
        status: "active",
        lastLogin: "2024-01-26 18:45",
        createdAt: "2023-01-01",
        department: "Executive"
    },
    {
        id: "USR-002",
        name: "Marie Rose",
        email: "finance@agisa.com",
        role: "finance",
        status: "active",
        lastLogin: "2024-01-26 15:30",
        createdAt: "2023-02-15",
        department: "Finance"
    },
    {
        id: "USR-003",
        name: "Paul Pierre",
        email: "accounting@agisa.com",
        role: "accounting",
        status: "active",
        lastLogin: "2024-01-26 17:10",
        createdAt: "2023-03-20",
        department: "Accounting"
    },
    {
        id: "USR-004",
        name: "Sarah Louis",
        email: "litigation@agisa.com",
        role: "litigation",
        status: "active",
        lastLogin: "2024-01-25 09:15",
        createdAt: "2023-04-10",
        department: "Litigation"
    },
    {
        id: "USR-005",
        name: "Bob Smith",
        email: "bob.smith@agisa.com",
        role: "agent",
        status: "inactive",
        lastLogin: "2023-12-15 14:00",
        createdAt: "2023-05-22",
        department: "Operations"
    },
    {
        id: "USR-006",
        name: "Alice Johnson",
        email: "alice.j@agisa.com",
        role: "agent",
        status: "active",
        lastLogin: "2024-01-26 11:20",
        createdAt: "2023-06-05",
        department: "Operations"
    },
    {
        id: "USR-007",
        name: "Michael Green",
        email: "michael.g@agisa.com",
        role: "finance",
        status: "suspended",
        lastLogin: "2024-01-20 16:45",
        createdAt: "2023-07-18",
        department: "Finance"
    }
]
