import React, { useState, useEffect, useCallback } from "react";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import {
    Percent,
    Settings,
    ShieldHalf,
    MonitorCheck,
    RefreshCw,
    Edit3,
    Check,
    X,
    Wallet,
    Banknote,
} from "lucide-react";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "../../components/ui/dialog";
import commissionApi, { Setting, SettingKey } from "../../context/api/commission";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { cn } from "../../lib/utils";

const CommissionRates: React.FC = () => {
    const { t } = useTranslation();
    const [settings, setSettings] = useState<Setting[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);
    const [editingSetting, setEditingSetting] = useState<Setting | null>(null);
    const [newValue, setNewValue] = useState("");

    const fetchSettings = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await commissionApi.getAll();

            // Define required keys and their default labels
            const requiredKeys = [
                { key: SettingKey.SELLER_DEPOSIT_COMMISSION_RATE, label: t('settings.commission.roles.sellerDeposit') },
                { key: SettingKey.HQ_DEPOSIT_COMMISSION_RATE, label: t('settings.commission.roles.hqDeposit') },
                { key: SettingKey.SELLER_WITHDRAWAL_COMMISSION_RATE, label: t('settings.commission.roles.sellerWithdrawal') },
                { key: SettingKey.HQ_WITHDRAWAL_COMMISSION_RATE, label: t('settings.commission.roles.hqWithdrawal') },
                { key: SettingKey.ENTERPRISE_WITHDRAWAL_COMMISSION_RATE, label: t('settings.commission.roles.enterpriseWithdrawal') },
                { key: SettingKey.SELLER_FINTECH_DEPOSIT_RATE, label: t('settings.commission.roles.sellerFintechDeposit') },
                { key: SettingKey.SELLER_FINTECH_WITHDRAWAL_COMMISSION_RATE, label: t('settings.commission.roles.sellerFintechWithdrawal') }
            ];

            const existingSettings = response.data;

            // Ensure all required keys are present in the list
            const finalSettings = requiredKeys.map(req => {
                const found = existingSettings.find(s => s.key === req.key);
                if (found) return found;

                // Return a "virtual" setting if not found in DB
                // This allows the user to initialize them via the UI
                return {
                    id: `virtual-${req.key}`,
                    key: req.key,
                    value: "0",
                    label: req.label,
                    description: t('settings.commission.defaultDef', { label: req.label }),
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                } as Setting;
            });

            setSettings(finalSettings);
        } catch (error) {
            toast.error(t('settings.commission.toasts.failLoad'));
        } finally {
            setIsLoading(false);
        }
    }, [t]);

    useEffect(() => {
        fetchSettings();
    }, [fetchSettings]);

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingSetting) return;

        setIsUpdating(true);
        try {
            await commissionApi.updateByKey(editingSetting.key, {
                value: newValue,
            });
            toast.success(t('settings.commission.updateSuccess', { label: editingSetting.label }));
            setEditingSetting(null);
            fetchSettings();
        } catch (error) {
            toast.error(t('settings.commission.updateFailed'));
        } finally {
            setIsUpdating(false);
        }
    };

    const handleInitialize = async () => {
        setIsLoading(true);
        try {
            // Initialize all rates with 0 if they don't exist
            await Promise.all([
                commissionApi.updateByKey(SettingKey.SELLER_DEPOSIT_COMMISSION_RATE, { value: "0", label: t('settings.commission.roles.sellerDeposit') }),
                commissionApi.updateByKey(SettingKey.HQ_DEPOSIT_COMMISSION_RATE, { value: "0", label: t('settings.commission.roles.hqDeposit') }),
                commissionApi.updateByKey(SettingKey.SELLER_WITHDRAWAL_COMMISSION_RATE, { value: "0", label: t('settings.commission.roles.sellerWithdrawal') }),
                commissionApi.updateByKey(SettingKey.HQ_WITHDRAWAL_COMMISSION_RATE, { value: "0", label: t('settings.commission.roles.hqWithdrawal') }),
                commissionApi.updateByKey(SettingKey.ENTERPRISE_WITHDRAWAL_COMMISSION_RATE, { value: "0", label: t('settings.commission.roles.enterpriseWithdrawal') }),
                commissionApi.updateByKey(SettingKey.SELLER_FINTECH_DEPOSIT_RATE, { value: "0", label: t('settings.commission.roles.sellerFintechDeposit') }),
                commissionApi.updateByKey(SettingKey.SELLER_FINTECH_WITHDRAWAL_COMMISSION_RATE, { value: "0", label: t('settings.commission.roles.sellerFintechWithdrawal') })
            ]);
            toast.success(t('settings.commission.defaultInitMsg'));
            fetchSettings();
        } catch (error) {
            toast.error(t('settings.commission.toasts.failInit'));
        } finally {
            setIsLoading(false);
        }
    };

    const getIcon = (key: SettingKey) => {
        switch (key) {
            case SettingKey.SELLER_DEPOSIT_COMMISSION_RATE:
                return <MonitorCheck className="h-5 w-5 text-emerald-600" />;
            case SettingKey.HQ_DEPOSIT_COMMISSION_RATE:
                return <ShieldHalf className="h-5 w-5 text-indigo-600" />;
            case SettingKey.SELLER_WITHDRAWAL_COMMISSION_RATE:
                return <MonitorCheck className="h-5 w-5 text-amber-600" />;
            case SettingKey.HQ_WITHDRAWAL_COMMISSION_RATE:
                return <ShieldHalf className="h-5 w-5 text-purple-600" />;
            case SettingKey.ENTERPRISE_WITHDRAWAL_COMMISSION_RATE:
                return <Settings className="h-5 w-5 text-blue-600" />;
            case SettingKey.SELLER_FINTECH_DEPOSIT_RATE:
                return <Wallet className="h-5 w-5 text-teal-600" />;
            case SettingKey.SELLER_FINTECH_WITHDRAWAL_COMMISSION_RATE:
                return <Banknote className="h-5 w-5 text-rose-600" />;
            default:
                return <Settings className="h-5 w-5 text-slate-400" />;
        }
    };

    return (
        <div className="p-4 sm:p-6 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 mb-10">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-black tracking-tighter text-slate-800 uppercase flex items-center gap-3">
                        <Percent className="h-8 w-8 text-indigo-600" />
                        {t('settings.commission.title')}
                    </h1>
                    <p className="text-slate-400 uppercase text-[10px] font-black tracking-[0.2em] mt-1">
                        {t('settings.commission.description')}
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Button
                        variant="outline"
                        className="bg-emerald-50 border-emerald-100 text-emerald-600 hover:bg-emerald-100 h-10 px-4 font-bold uppercase tracking-widest text-[10px] shadow-sm transition-all rounded-lg"
                        onClick={handleInitialize}
                        disabled={isLoading}
                    >
                        <Settings className="h-4 w-4 mr-2" />
                        {t('settings.commission.initDefaults')}
                    </Button>
                    <Button
                        variant="outline"
                        className="bg-slate-50 border-slate-100 text-slate-600 hover:bg-slate-100 h-10 px-4 font-bold uppercase tracking-widest text-[10px] shadow-sm transition-all rounded-lg"
                        onClick={fetchSettings}
                        disabled={isLoading}
                    >
                        <RefreshCw className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")} />
                        {t('settings.commission.syncRates')}
                    </Button>
                </div>
            </div>

            {/* Content Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {isLoading && settings.length === 0 ? (
                    // Skeleton Loading
                    [1, 2].map((i) => (
                        <Card key={i} className="border-slate-100 bg-white shadow-xl shadow-slate-100/50 h-[200px] animate-pulse rounded-xl" />
                    ))
                ) : (
                    settings.map((setting) => (
                        <Card key={setting.id} className="group border-slate-200 bg-white shadow-xl shadow-slate-200/50 hover:shadow-indigo-500/10 transition-all duration-500 overflow-hidden relative border-none rounded-xl">
                            <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                                <Percent className="h-24 w-24 text-indigo-600" />
                            </div>

                            <CardHeader className="relative z-10 border-b border-slate-50 mb-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="h-12 w-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center group-hover:bg-indigo-50 group-hover:border-indigo-100 transition-colors">
                                            {getIcon(setting.key)}
                                        </div>
                                        <div>
                                            <CardTitle className="text-lg font-black text-slate-800 uppercase tracking-tight">
                                                {setting.label}
                                            </CardTitle>
                                            <CardDescription className="text-[9px] text-slate-400 font-black uppercase tracking-widest">
                                                {setting.key.replace(/_/g, " ")}
                                            </CardDescription>
                                        </div>
                                    </div>
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        className="h-9 w-9 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                                        onClick={() => {
                                            setEditingSetting(setting);
                                            setNewValue(setting.value);
                                        }}
                                    >
                                        <Edit3 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </CardHeader>

                            <CardContent className="relative z-10 pt-4">
                                <div className="flex items-baseline gap-2">
                                    <span className="text-5xl font-black text-slate-800 tracking-tighter italic">
                                        {setting.value}
                                    </span>
                                    <span className="text-2xl font-black text-indigo-600">%</span>
                                </div>
                                <p className="mt-4 text-[11px] text-slate-500 leading-relaxed font-medium">
                                    {setting.description || t('settings.commission.defaultLabel')}
                                </p>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>

            {/* Empty State */}
            {!isLoading && settings.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 opacity-20">
                    <Settings className="h-20 w-20 text-zinc-500 mb-4" />
                    <p className="font-bold uppercase tracking-[0.3em] text-zinc-500">{t('settings.commission.noRates')}</p>
                </div>
            )}

            {/* Edit Dialog */}
            <Dialog open={!!editingSetting} onOpenChange={(open) => !open && setEditingSetting(null)}>
                <DialogContent className="sm:max-w-md bg-white border-slate-200 text-slate-800 shadow-2xl rounded-2xl overflow-hidden p-0">
                    <form onSubmit={handleUpdate}>
                        <DialogHeader className="p-6 border-b border-slate-50 bg-slate-50/50">
                            <DialogTitle className="text-xl font-black flex items-center gap-3 text-indigo-600 uppercase tracking-tight">
                                <Edit3 className="h-6 w-6" />
                                {t('settings.commission.dialog.updateTitle', { label: editingSetting?.label })}
                            </DialogTitle>
                            <DialogDescription className="text-slate-500 font-medium">
                                {t('settings.commission.dialog.applyRate', { label: editingSetting?.label?.toLowerCase() })}
                            </DialogDescription>
                        </DialogHeader>

                        <div className="p-8 space-y-6">
                            <div className="grid gap-2.5">
                                <Label htmlFor="value" className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{t('settings.commission.dialog.rateLabel')}</Label>
                                <div className="relative group">
                                    <Input
                                        id="value"
                                        type="number"
                                        step="0.01"
                                        className="bg-slate-50 border-slate-100 text-slate-800 h-16 text-3xl font-black tracking-tighter focus-visible:ring-indigo-500/30 rounded-xl transition-all pl-6"
                                        value={newValue}
                                        onChange={(e) => setNewValue(e.target.value)}
                                        required
                                        autoFocus
                                    />
                                    <div className="absolute right-6 top-1/2 -translate-y-1/2 font-black text-2xl text-indigo-600 opacity-50 group-focus-within:opacity-100 transition-opacity">
                                        %
                                    </div>
                                </div>
                                <p className="text-[10px] text-slate-400 font-bold italic mt-2 uppercase tracking-tight">
                                    {t('settings.commission.dialog.immediateEffect')}
                                </p>
                            </div>
                        </div>

                        <DialogFooter className="p-6 bg-slate-50/50 border-t border-slate-50 gap-3 sm:gap-0">
                            <Button
                                type="button"
                                variant="ghost"
                                className="text-slate-400 hover:text-slate-600 font-bold uppercase tracking-widest text-[10px] hover:bg-white"
                                onClick={() => setEditingSetting(null)}
                            >
                                <X className="h-4 w-4 mr-2" />
                                {t('settings.commission.dialog.cancel')}
                            </Button>
                            <Button
                                type="submit"
                                className="bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase tracking-widest px-10 h-11 shadow-lg shadow-indigo-500/20 rounded-xl border-none"
                                disabled={isUpdating}
                            >
                                {isUpdating ? (
                                    <RefreshCw className="h-4 w-4 animate-spin" />
                                ) : (
                                    <>
                                        <Check className="h-4 w-4 mr-2" />
                                        {t('settings.commission.dialog.updateRate')}
                                    </>
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default CommissionRates;