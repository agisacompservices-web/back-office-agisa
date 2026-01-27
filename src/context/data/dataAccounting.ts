export type RequestStatus = "received" | "sent_to_litigation" | "rejected" | "processed"

export interface AccountingRequest {
    id: string
    customerName: string
    type: "deposit" | "withdrawal" | "transfer"
    amount: number
    status: RequestStatus
    date: string
    agent: string
    description: string
}

export const accountingData: AccountingRequest[] = [
    {
        id: "REQ-2001",
        customerName: "Marie Jean",
        type: "withdrawal",
        amount: 3200.00,
        status: "received",
        date: "2024-01-26",
        agent: "Paul Pierre",
        description: "Standard cash withdrawal request."
    },
    {
        id: "REQ-2002",
        customerName: "Jean Baptiste",
        type: "transfer",
        amount: 8500.00,
        status: "sent_to_litigation",
        date: "2024-01-25",
        agent: "Sarah Louis",
        description: "Internal transfer to a new account."
    },
    {
        id: "REQ-2003",
        customerName: "Lucie Marthe",
        type: "deposit",
        amount: 12000.00,
        status: "received",
        date: "2024-01-26",
        agent: "Paul Pierre",
        description: "Large cash deposit from business operations."
    },
    {
        id: "REQ-2004",
        customerName: "Pierre Noel",
        type: "withdrawal",
        amount: 450.00,
        status: "processed",
        date: "2024-01-24",
        agent: "Sarah Louis",
        description: "ATM withdrawal limit increase request."
    },
    {
        id: "REQ-2005",
        customerName: "Esther Fortune",
        type: "transfer",
        amount: 25000.00,
        status: "rejected",
        date: "2024-01-23",
        agent: "Paul Pierre",
        description: "International transfer without proper documentation."
    },
    {
        id: "REQ-2006",
        customerName: "Gregory Petit",
        type: "deposit",
        amount: 1500.00,
        status: "received",
        date: "2024-01-26",
        agent: "Sarah Louis",
        description: "Regular savings deposit."
    }
]
