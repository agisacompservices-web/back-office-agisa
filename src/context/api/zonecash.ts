import api from './axios';

export interface ZoneCashReportingQuery {
    startDate?: string;
    endDate?: string;
}

export interface ZoneCashDepositRequest {
    accountNumber: string;
    amount: number;
    currency: 'HTG' | 'USD';
    enterpriseId: string;
    description?: string;
    isRemote?: boolean;
    otpCode?: string;
}

const zonecashApi = {
    requestDepositOtp: async (data: { accountNumber: string, amount: number, currency: string, sellerCode?: string }) => {
        const response = await api.post('/integrations/fintech/deposit/request-otp', data);
        return response.data;
    },
    cancelDepositOtp: async (data: { accountNumber: string, amount: number, sellerCode?: string }) => {
        const response = await api.post('/integrations/fintech/deposit/cancel', data);
        return response.data;
    },
    lookupAccount: async (accountNumber: string) => {
        const response = await api.get(`/integrations/fintech/account/${accountNumber}`);
        return response.data;
    },

    initiateDeposit: async (data: ZoneCashDepositRequest) => {
        const response = await api.post('/integrations/fintech/deposit', data);
        return response.data;
    },

    getExchangeRate: async () => {
        const response = await api.get('/integrations/fintech/exchange-rate');
        return response.data;
    },
 
    updateExchangeRate: async (data: { vente: number; achat: number; reference: number }) => {
        const response = await api.patch('/integrations/fintech/exchange-rate', data);
        return response.data;
    },

    getUsers: async (page?: number, limit?: number, search?: string) => {
        const response = await api.get('/integrations/fintech/users', {
            params: { page, limit, search }
        });
        return response.data;
    },

    getUserAccounts: async (userId: string) => {
        const response = await api.get(`/integrations/fintech/users/${userId}/accounts`);
        return response.data;
    },

    getUserTransactions: async (userId: string, page?: number, limit?: number, accountId?: string) => {
        const response = await api.get(`/integrations/fintech/users/${userId}/transactions`, {
            params: { page, limit, accountId }
        });
        return response.data;
    },

    getTotalDeposits: async (query?: ZoneCashReportingQuery) => {
        const response = await api.get('/integrations/fintech/reporting/total-deposit', { params: query });
        return response.data;
    },

    getTotalWithdrawals: async (query?: ZoneCashReportingQuery) => {
        const response = await api.get('/integrations/fintech/reporting/total-withdrawal', { params: query });
        return response.data;
    },

    getTotalUsers: async (query?: ZoneCashReportingQuery) => {
        const response = await api.get('/integrations/fintech/reporting/total-users', { params: query });
        return response.data;
    },

    getTotalMoney: async (query?: ZoneCashReportingQuery) => {
        const response = await api.get('/integrations/fintech/reporting/total-money', { params: query });
        return response.data;
    },
    
    getTotalProfits: async (query?: ZoneCashReportingQuery) => {
        const response = await api.get('/integrations/fintech/reporting/total-profits', { params: query });
        return response.data;
    },

    getProfitDetails: async (query?: ZoneCashReportingQuery & { page?: number; limit?: number }) => {
        const response = await api.get('/integrations/fintech/reporting/profit-details', { params: query });
        return response.data;
    },
    
    getGlobalChangeFees: async () => {
        const response = await api.get('/integrations/fintech/global-change/fees');
        return response.data;
    },

    updateGlobalChangeFees: (dto: { 
        personalFee: number; 
        businessFee: number;
        personalLimit: number;
        businessLimit: number;
    }) => 
        api.patch('/integrations/fintech/global-change/fees', dto).then(res => res.data),

    getGlobalChangeRegistrations: async () => {
        const response = await api.get('/integrations/fintech/global-change/registrations');
        return response.data;
    },

    getGlobalChangeRequests: async () => {
        const response = await api.get('/integrations/fintech/global-change/requests');
        return response.data;
    },

    approveGlobalChangeRegistration: async (id: string) => {
        const response = await api.post('/integrations/fintech/global-change/approve', { id });
        return response.data;
    },

    rejectGlobalChangeRegistration: async (id: string) => {
        const response = await api.post('/integrations/fintech/global-change/reject', { id });
        return response.data;
    },

    getGlobalChangeBasket: async () => {
        const response = await api.get('/integrations/fintech/global-change/basket');
        return response.data;
    },

    getFintechFees: async () => {
        const response = await api.get('/integrations/fintech/fees');
        return response.data;
    },

    updateFintechFees: async (dto: {
        remoteDepositFeeValue: number;
        remoteDepositFeeType: string;
        businessAccountFee: number;
        limits?: Array<{
            accountType: string;
            monthlyLimit: number;
            transactionLimit: number;
        }>;
    }) => {
        const response = await api.patch('/integrations/fintech/fees', dto);
        return response.data;
    },

    getPendingBusinessAccounts: async () => {
        const response = await api.get('/integrations/fintech/accounts/pending-business');
        return response.data;
    },

    validateBusinessAccount: async (
        accountId: string, 
        status: 'ACTIVE' | 'REJECTED', 
        rejectionReason?: string,
        rejectName?: boolean,
        rejectDocument?: boolean
    ) => {
        const response = await api.patch(`/integrations/fintech/accounts/${accountId}/validate`, { 
            status, 
            rejectionReason,
            rejectName,
            rejectDocument
        });
        return response.data;
    },

    getWithdrawalFeeTiers: async () => {
        const response = await api.get('/integrations/fintech/withdrawal-fee-tiers');
        return response.data;
    },

    updateWithdrawalFeeTiers: async (tiers: { minAmount: number; maxAmount: number | null; fee: number }[]) => {
        const response = await api.put('/integrations/fintech/withdrawal-fee-tiers', { tiers });
        return response.data;
    },

    getDepositFeeTiers: async () => {
        const response = await api.get('/integrations/fintech/deposit-fee-tiers');
        return response.data;
    },

    updateDepositFeeTiers: async (tiers: { minAmount: number; maxAmount: number | null; fee: number }[]) => {
        const response = await api.put('/integrations/fintech/deposit-fee-tiers', { tiers });
        return response.data;
    },

    blockAccount: async (
        accountId: string,
        isBlocked: boolean,
        blockReason?: string,
        blockedAmount?: number,
        isDefinitivelyBlocked?: boolean,
        unblockAt?: string
    ) => {
        const response = await api.patch(`/integrations/fintech/accounts/${accountId}/block`, {
            isBlocked,
            blockReason,
            blockedAmount,
            isDefinitivelyBlocked,
            unblockAt
        });
        return response.data;
    },

    getPrivacyPolicy: async (lang: string) => {
        const response = await api.get('/integrations/fintech/privacy-policy', {
            params: { lang }
        });
        return response.data;
    },

    updatePrivacyPolicy: async (data: { lang: string; title: string; lastUpdated: string; sections: any[] }) => {
        const response = await api.post('/integrations/fintech/privacy-policy', data);
        return response.data;
    },
};

export default zonecashApi;
