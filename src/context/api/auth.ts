import api from './axios';

export interface LoginResponse {
    access_token: string;
    refresh_token: string;
    enterpriseCode?: string;
}

export interface ServiceSelectionRequiredResponse {
    serviceSelectionRequired: boolean;
    userId: string;
    services: {
        id: string;
        name: string;
        enterpriseCode: string;
        isMaintenance: boolean;
        isActive: boolean;
        canBypass: boolean;
    }[];
}

const authApi = {
    /**
     * Connecter un utilisateur
     */
    login: async (email: string, password: string): Promise<LoginResponse | { twoFactorRequired: boolean; userId: string } | ServiceSelectionRequiredResponse> => {
        const response = await api.post('/auth/login', { email, password });
        return response.data;
    },

    /**
     * Finaliser la connexion en sélectionnant un service
     */
    selectService: async (userId: string, enterpriseId: string): Promise<LoginResponse> => {
        const response = await api.post('/auth/login/select-service', { userId, enterpriseId });
        return response.data;
    },

    /**
     * Finaliser la connexion avec le code 2FA
     */
    twoFactorLogin: async (userId: string, twoFactorCode: string): Promise<LoginResponse | ServiceSelectionRequiredResponse> => {
        const response = await api.post('/auth/2fa/login', { userId, twoFactorCode });
        return response.data;
    },

    /**
     * Rafraîchir le token
     */
    refresh: async (refreshToken: string): Promise<{ access_token: string; refresh_token: string }> => {
        const response = await api.post('/auth/refresh', { refresh_token: refreshToken });
        return response.data;
    },

    /**
     * Terminer la session (Déconnexion côté client)
     */
    logout: () => {
        localStorage.removeItem('agisa_token');
        localStorage.removeItem('agisa_refresh_token');
        localStorage.removeItem('agisa_user');
        window.location.href = '/';
    },

    /**
     * Générer un QR code pour la configuration 2FA
     */
    setup2FA: async (): Promise<{ qrCodeDataUrl: string; backupCodes: string[] }> => {
        const response = await api.get('/auth/2fa/setup');
        return response.data;
    },

    /**
     * Activer la 2FA pour un utilisateur
     */
    enable2FA: async (twoFactorCode: string): Promise<{ message: string }> => {
        const response = await api.post('/auth/2fa/enable', { twoFactorCode });
        return response.data;
    },

    /**
     * Désactiver la 2FA pour un utilisateur
     */
    disable2FA: async (): Promise<{ message: string }> => {
        const response = await api.post('/auth/2fa/disable');
        return response.data;
    },

    /**
     * Envoyer un email de réinitialisation de mot de passe
     */
    forgotPassword: async (email: string): Promise<{ message: string }> => {
        const response = await api.post('/auth/forgot-password', { email });
        return response.data;
    },

    /**
     * Réinitialiser le mot de passe avec un token
     */
    resetPassword: async (token: string, newPassword: string): Promise<{ message: string }> => {
        const response = await api.post('/auth/reset-password', { token, newPassword });
        return response.data;
    },

    /**
     * Vérifier l'adresse email
     */
    verifyEmail: async (token: string): Promise<{ message: string }> => {
        const response = await api.get(`/auth/verify-email?token=${token}`);
        return response.data;
    },
};

export default authApi;
