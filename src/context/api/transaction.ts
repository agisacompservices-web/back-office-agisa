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
    EXTERNAL_DEPOSIT = "external_deposit",
    EXTERNAL_WITHDRAWAL = "external_withdrawal",
}

export enum TransactionStatus {
    PENDING = "pending",
    COMPLETED = "completed",
    FAILED = "failed",
    CANCELLED = "cancelled",
}

export interface CreateTransactionDto {
    type: TransactionType;
    amount: number;
    enterpriseId: string;
    headquarterId?: string;
    sellerId?: string;
    description?: string;
    otp?: string;
}

export interface PaginatedResponse<T> {
    data: T[];
    meta: {
        total: number;
        page: number;
        limit: number;
        lastPage: number;
    };
}

const transactionApi = {
    getAll: (enterpriseId?: string, headquarterId?: string, sellerId?: string, page?: number, limit?: number, scope?: 'seller' | 'headquarter') =>
        api.get<PaginatedResponse<Transaction>>('/transactions', { params: { enterpriseId, headquarterId, sellerId, page, limit, scope } }).then(res => res.data),

    create: (data: CreateTransactionDto) =>
        api.post<Transaction>('/transactions', data).then(res => res.data),

    getById: (id: string) =>
        api.get<Transaction>(`/transactions/${id}`).then(res => res.data),
}

export default transactionApi