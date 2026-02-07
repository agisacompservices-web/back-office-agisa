import axios from 'axios';

/**
 * Gestion du rafraîchissement des jetons (Token Refresh)
 * Empêche plusieurs appels simultanés à /refresh-token en cas d'expiration multiple.
 */
let isRefreshing = false;
let failedQueue: Array<{
    resolve: (token: string | null) => void;
    reject: (error: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
    failedQueue.forEach((prom) => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });
    failedQueue = [];
};

const api = axios.create({
    // Utilise la variable d'environnement si disponible (Create React App utilise REACT_APP_)
    baseURL: process.env.REACT_APP_API_URL || 'https://back-office-agisa-backend-dev.up.railway.app',
    timeout: 15000, // 15 secondes avant de TimeOut
    headers: {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true', // Pour éviter l'écran d'avertissement ngrok en dev
    },
});

/**
 * Intercepteur de requête : Ajoute automatiquement le token JWT
 */
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('agisa_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        // Si on envoie du FormData (ex: upload de fichier), 
        // on laisse le navigateur définir le Content-Type avec le boundary.
        if (config.data instanceof FormData) {
            if (config.headers.set) {
                config.headers.set('Content-Type', undefined);
            } else {
                delete config.headers['Content-Type'];
            }
        }

        return config;
    },
    (error) => Promise.reject(error)
);

/**
 * Intercepteur de réponse : Gère les erreurs globales et le rafraîchissement du token
 */
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        /**
         * Cas 1 : Problème de réseau (Serveur injoignable)
         */
        if (!error.response) {
            console.error('Network/Server Error:', error);
            const { toast } = await import('sonner');
            toast.error("Erreur de connexion", {
                description: "Vérifiez votre connexion internet ou le statut du serveur."
            });
            return Promise.reject(error);
        }

        /**
         * Cas 2 : Erreur 401 (Non autorisé / Token expiré)
         */
        if (error.response.status === 401 && !originalRequest._retry) {
            // Ne pas tenter de refresh si l'erreur vient déjà d'un endpoint d'auth
            const isAuthRequest = originalRequest.url?.includes('/auth/login') ||
                originalRequest.url?.includes('/auth/2fa/login') ||
                originalRequest.url?.includes('/auth/refresh');

            if (isAuthRequest) {
                return Promise.reject(error);
            }

            // Si nous sommes déjà en train de rafraîchir le token, on met la requête en attente
            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                })
                    .then((token) => {
                        originalRequest.headers.Authorization = `Bearer ${token}`;
                        return api(originalRequest);
                    })
                    .catch((err) => Promise.reject(err));
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                const refreshToken = localStorage.getItem('agisa_refresh_token');
                if (!refreshToken) throw new Error('No refresh token available');

                // On utilise une instance axios vierge pour le refresh pour éviter les boucles infinies
                const response = await axios.post(`${api.defaults.baseURL}/auth/refresh`, {
                    refresh_token: refreshToken
                });

                const { access_token, refresh_token: newRefreshToken } = response.data;

                // Mise à jour du stockage
                localStorage.setItem('agisa_token', access_token);
                if (newRefreshToken) {
                    localStorage.setItem('agisa_refresh_token', newRefreshToken);
                }

                // Optionnel: Mettre à jour l'instance globale
                api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;

                processQueue(null, access_token);
                return api(originalRequest);

            } catch (authError) {
                processQueue(authError, null);

                // Nettoyage et redirection si le refresh échoue
                localStorage.removeItem('agisa_token');
                localStorage.removeItem('agisa_refresh_token');
                localStorage.removeItem('agisa_user');

                if (window.location.pathname !== '/') {
                    window.location.href = '/';
                }
                return Promise.reject(authError);
            } finally {
                isRefreshing = false;
            }
        }

        /**
         * Cas 3 : Erreurs serveur (500+)
         */
        if (error.response.status >= 500) {
            const { toast } = await import('sonner');
            const errorMessage = error.response.data?.message || "Une erreur interne est survenue.";

            toast.error("Erreur Serveur", {
                description: errorMessage
            });
        }

        return Promise.reject(error);
    }
);

export default api;