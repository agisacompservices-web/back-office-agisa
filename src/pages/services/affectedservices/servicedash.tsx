import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useService } from "../../../context/ServiceContext";
import { useServSidebar } from "../../../context/ServSidebarContext";
import { ShieldAlert, LogOut } from 'lucide-react';
import { Button } from "../../../components/ui/button";
import { useTranslation } from "react-i18next";

const ServiceDash: React.FC = () => {
    const { t } = useTranslation();
    const { enterpriseCode } = useParams();
    const { currentService } = useService();
    const navigate = useNavigate();

    const { hasHqAccess, isHqLoading } = useServSidebar();

    useEffect(() => {
        if (isHqLoading) return; // Wait for access check

        const storedUser = localStorage.getItem('agisa_user');
        if (storedUser && hasHqAccess) {
            const user = JSON.parse(storedUser);
            if (user.role?.level?.toUpperCase() === 'MANAGER_HEADQUARTER_LOCAL') {
                navigate(`/${enterpriseCode}/headquaterlocal`, { replace: true });
            }
        }
    }, [enterpriseCode, navigate, isHqLoading, hasHqAccess]);

    const handleLogout = () => {
        localStorage.removeItem('agisa_token');
        localStorage.removeItem('agisa_refresh_token');
        localStorage.removeItem('agisa_user');
        localStorage.removeItem('agisa_current_service');
        navigate('/login', { replace: true });
    };

    if (isHqLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
            </div>
        );
    }

    if (!hasHqAccess) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[80vh] text-center p-6 animate-in fade-in zoom-in duration-500">
                <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center mb-6 border border-red-500/20">
                    <ShieldAlert className="h-10 w-10 text-red-500" />
                </div>
                <h1 className="text-3xl font-black text-black uppercase tracking-tighter mb-2">{t('serviceDash.auth.restrained')}</h1>
                <p className="text-zinc-500 max-w-md mb-8 font-medium">
                    {t('serviceDash.auth.noHqMsg')}
                </p>
                <div className="flex gap-4">
                    <Button
                        variant="outline"
                        className="border-slate-200 bg-slate-50 hover:bg-slate-100 text-black font-bold"
                        onClick={() => window.location.reload()}
                    >
                        {t('serviceDash.auth.tryRefresh')}
                    </Button>
                    <Button
                        variant="ghost"
                        className="text-zinc-500 hover:text-black"
                        onClick={handleLogout}
                    >
                        <LogOut className="h-4 w-4 mr-2" />
                        {t('serviceDash.auth.logout')}
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold text-black uppercase tracking-widest">
                {currentService?.name || enterpriseCode || t('serviceDash.ui.title')}
            </h1>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                <div className="p-6 rounded-xl border border-slate-200 bg-slate-50 backdrop-blur-xl">
                    <h3 className="text-xs font-semibold text-emerald-500 uppercase tracking-widest mb-1">{t('serviceDash.ui.status')}</h3>
                    <p className="text-2xl font-bold text-black">{t('serviceDash.ui.active')}</p>
                </div>
                <div className="p-6 rounded-xl border border-slate-200 bg-slate-50 backdrop-blur-xl">
                    <h3 className="text-xs font-semibold text-emerald-500 uppercase tracking-widest mb-1">{t('serviceDash.ui.srvCode')}</h3>
                    <p className="text-2xl font-bold text-black">{enterpriseCode}</p>
                </div>
                <div className="p-6 rounded-xl border border-slate-200 bg-slate-50 backdrop-blur-xl">
                    <h3 className="text-xs font-semibold text-emerald-500 uppercase tracking-widest mb-1">{t('serviceDash.ui.entId')}</h3>
                    <p className="text-sm font-mono text-gray-400 truncate">{currentService?.id || t('serviceDash.ui.na')}</p>
                </div>
            </div>
            <p className="text-gray-400 mt-8">
                {t('serviceDash.ui.welcome')}
            </p>
        </div>
    );
};

export default ServiceDash;