export type CaseStatus = "under_review" | "validated" | "rejected" | "investigating"

export interface LitigationCase {
    id: string
    title: string
    description: string
    status: CaseStatus
    service: string
    amount: number
    date: string
    agent: string
    customerEmail: string
}

export const litigationData: LitigationCase[] = [
    {
        id: "CASE-1001",
        title: "Large Cash Withdrawal",
        description: "Customer requested a withdrawal of $5000 which exceeds daily limit.",
        status: "under_review",
        service: "KISKEYA 1",
        amount: 5000.00,
        date: "2024-01-25",
        agent: "Alice Johnson",
        customerEmail: "customer1@example.com"
    },
    {
        id: "CASE-1002",
        title: "Suspicious Activity",
        description: "Multiple failed login attempts followed by a transaction request.",
        status: "investigating",
        service: "KISKEYA 3",
        amount: 1200.00,
        date: "2024-01-25",
        agent: "Bob Smith",
        customerEmail: "user22@yahoo.com"
    },
    {
        id: "CASE-1003",
        title: "Duplicate Transaction",
        description: "System detected a duplicate transaction for the same amount within 5 minutes.",
        status: "validated",
        service: "KISKEYA 2",
        amount: 350.00,
        date: "2024-01-24",
        agent: "John Doe",
        customerEmail: "sarah88@gmail.com"
    },
    {
        id: "CASE-1004",
        title: "Incorrect Beneficiary",
        description: "Beneficiary name does not match account number on record.",
        status: "rejected",
        service: "Bank Transfer",
        amount: 2100.00,
        date: "2024-01-24",
        agent: "Jane Smith",
        customerEmail: "mike.t@corp.com"
    },
    {
        id: "CASE-1005",
        title: "High Risk Region",
        description: "Transaction originated from a region flagged as high risk for fraud.",
        status: "under_review",
        service: "KISKEYA 5",
        amount: 4500.00,
        date: "2024-01-26",
        agent: "Alice Johnson",
        customerEmail: "geo.h@gmail.com"
    },
    {
        id: "CASE-1006",
        title: "Account Takeover Attempt",
        description: "Unusual activity detected from a new device in a different country.",
        status: "investigating",
        service: "KISKEYA 6",
        amount: 150.00,
        date: "2024-01-26",
        agent: "Bob Smith",
        customerEmail: "attack@alert.com"
    },
    {
        id: "CASE-1007",
        title: "Identity Verification Failure",
        description: "Submitted documents appear to be forged or tampered with.",
        status: "rejected",
        service: "Verification",
        amount: 0.00,
        date: "2024-01-26",
        agent: "Alice Johnson",
        customerEmail: "fake@user.com"
    },
    {
        id: "CASE-1008",
        title: "Large Transfer Approval",
        description: "Approval required for transfer exceeding $10,000.",
        status: "under_review",
        service: "Wire Transfer",
        amount: 12500.00,
        date: "2024-01-26",
        agent: "John Doe",
        customerEmail: "whales@ocean.com"
    }
]
