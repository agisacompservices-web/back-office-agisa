export type PaymentStatus = "pending" | "processing" | "success" | "failed"

export interface FinanceData {
    id: string
    amount: number
    status: PaymentStatus
    email: string
    service: string
    date: string
    agent: string
}

export const financeData: FinanceData[] = [
    {
        id: "TRX-9871",
        amount: 450.00,
        status: "success",
        email: "ken99@yahoo.com",
        service: "KISKEYA ",
        date: "2024-01-20",
        agent: "John Doe"
    },
    {
        id: "TRX-5621",
        amount: 1200.00,
        status: "processing",
        email: "abe45@gmail.com",
        service: "KISKEYA 2",
        date: "2024-01-21",
        agent: "Jane Smith"
    },
    {
        id: "TRX-1234",
        amount: 800.00,
        status: "success",
        email: "monsieur@example.com",
        service: "KISKEYA 3",
        date: "2024-01-22",
        agent: "Robert Brown"
    },
    {
        id: "TRX-8765",
        amount: 150.00,
        status: "failed",
        email: "lisa.w@hotmail.com",
        service: "KISKEYA 4",
        date: "2024-01-23",
        agent: "Emily White"
    },
    {
        id: "TRX-4321",
        amount: 2500.00,
        status: "pending",
        email: "business@corp.com",
        service: "Bank Transfer",
        date: "2024-01-24",
        agent: "Michael Green"
    },
    {
        id: "TRX-6969",
        amount: 300.00,
        status: "success",
        email: "sarah@gmail.com",
        service: "KISKEYA 5",
        date: "2024-01-24",
        agent: "John Doe"
    },
    {
        id: "TRX-1111",
        amount: 550.00,
        status: "success",
        email: "test@user.com",
        service: "KISKEYA 6",
        date: "2024-01-25",
        agent: "Jane Smith"
    }
]
