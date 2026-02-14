import api from "./axios";

export interface Transaction {
    id: string;
    type: TransactionType;
    status: TransactionStatus;
    amount: number;
    description?: string;
    userId: string;
    enterpriseId: string;
    headquarterId?: string;
    sellerId?: string;
    createdAt: string;
    user?: { fullName: string };
    headquarter?: { name: string };
    seller?: { name: string };
}

export enum TransactionType {
    DEPOSIT = "deposit",
    WITHDRAWAL = "withdrawal",
}

export enum TransactionStatus {
    PENDING = "pending",
    COMPLETED = "completed",
    FAILED = "failed",
}

export interface CreateTransactionDto {
    type: TransactionType;
    amount: number;
    enterpriseId: string;
    headquarterId?: string;
    sellerId?: string;
    description?: string;
}

const transactionApi = {
    getAll: (enterpriseId?: string, headquarterId?: string, sellerId?: string) =>
        api.get<Transaction[]>('/transactions', { params: { enterpriseId, headquarterId, sellerId } }).then(res => res.data),

    create: (data: CreateTransactionDto) =>
        api.post<Transaction>('/transactions', data).then(res => res.data),

    getById: (id: string) =>
        api.get<Transaction>(`/transactions/${id}`).then(res => res.data),
}

export default transactionApi