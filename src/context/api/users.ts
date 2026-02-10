import api from './axios';

/**
 * Interfaces pour les données utilisateur
 */
export interface UserProfile {
    id: string;
    fullName: string;
    email: string;
    phone?: string;
    avatarUrl?: string;
    userCode: string;
    bio?: string;
    role: {
        id: string;
        name: string;
        level: string;
    };
    roleId?: string;
    isActive: boolean;
    isVerified: boolean;
    loginAttempts: number;
    lockoutUntil?: string | null;
    createdAt: string;
    updatedAt: string;
    memberships?: {
        membershipRoles: {
            role: { id: string; name: string; level: string };
        }[];
        enterprise: {
            id: string;
            name: string;
            enterpriseCode: string;
            isActive: boolean;
            isMaintenance: boolean;
            createdAt: string;
            updatedAt: string;
        };
        headquarter?: {
            id: string;
            name: string;
            address?: string;
        };
    }[];
}

export interface TrustedDevice {
    id: string;
    userAgent: string;
    ipAddress: string;
    location?: string;
    lastUsedAt: string;
    expiresAt: string;
}

export interface CreateUserRequest {
    fullName: string;
    email: string;
    role?: string;
    roleId?: string;
    phone?: string;
    password?: string;
    confirmPassword?: string;
    headquarterId?: string;
}

export interface UpdateProfileRequest {
    fullName?: string;
    phone?: string;
    bio?: string;
    avatar?: File;
}

export interface UpdatePasswordRequest {
    currentPassword: string;
    newPassword: string;
    confirmNewPassword: string;
}

/**
 * Service API pour la gestion des utilisateurs
 */
const usersApi = {
    /**
     * Récupérer le profil de l'utilisateur connecté
     */
    getMe: async (): Promise<UserProfile> => {
        const response = await api.get('/users/me');
        return response.data;
    },

    /**
     * Mettre à jour le profil de l'utilisateur connecté (supporte multipart pour l'avatar)
     */
    updateMe: async (data: UpdateProfileRequest): Promise<UserProfile> => {
        const formData = new FormData();
        if (data.fullName) formData.append('fullName', data.fullName);
        if (data.phone) formData.append('phone', data.phone);
        if (data.bio) formData.append('bio', data.bio);
        if (data.avatar) formData.append('avatar', data.avatar);

        const response = await api.patch('/users/me', formData);
        return response.data;
    },

    /**
     * Créer un nouvel utilisateur (Admin seulement)
     */
    addUser: async (userData: CreateUserRequest): Promise<UserProfile> => {
        const response = await api.post('/users/add-user', userData);
        return response.data;
    },

    /**
     * Récupérer tous les utilisateurs (Admin seulement)
     */
    getAll: async (params?: { page?: number; limit?: number; search?: string }): Promise<{ data: UserProfile[]; total: number; meta?: any }> => {
        const response = await api.get('/users', { params });
        return response.data;
    },

    /**
     * Récupérer un utilisateur spécifique (Admin seulement)
     */
    getById: async (id: string): Promise<UserProfile> => {
        const response = await api.get(`/users/${id}`);
        return response.data;
    },

    /**
     * Supprimer un utilisateur (Admin seulement)
     */
    delete: async (id: string): Promise<void> => {
        await api.delete(`/users/${id}`);
    },

    /**
     * Débloquer un compte (Admin seulement)
     */
    unlock: async (id: string): Promise<{ message: string }> => {
        const response = await api.post(`/users/${id}/unlock`);
        return response.data;
    },

    /**
     * Récupérer les appareils de confiance de l'utilisateur connecté
     */
    getTrustedDevices: async (): Promise<TrustedDevice[]> => {
        const response = await api.get('/users/me/trusted-devices');
        return response.data;
    },

    /**
     * Supprimer un appareil de confiance spécifique
     */
    removeTrustedDevice: async (deviceId: string): Promise<TrustedDevice[]> => {
        const response = await api.delete(`/users/me/trusted-devices/${deviceId}`);
        return response.data;
    },

    /**
     * Supprimer tous les appareils de confiance
     */
    clearTrustedDevices: async (): Promise<void> => {
        await api.delete('/users/me/trusted-devices');
    },

    /**
     * Mettre à jour le mot de passe de l'utilisateur connecté
     */
    updateMyPassword: async (data: UpdatePasswordRequest): Promise<{ message: string }> => {
        const response = await api.patch('/users/me/password', data);
        return response.data;
    },

    /**
     * Mettre à jour un utilisateur (Admin seulement)
     */
    update: async (id: string, data: Partial<UserProfile>): Promise<UserProfile> => {
        const response = await api.patch(`/users/${id}`, data);
        return response.data;
    },
};

export default usersApi;

