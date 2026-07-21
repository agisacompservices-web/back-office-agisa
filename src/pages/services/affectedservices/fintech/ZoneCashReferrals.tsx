import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/ui/card';
import { Button } from '../../../../components/ui/button';
import { Input } from '../../../../components/ui/input';
import { Label } from '../../../../components/ui/label';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '../../../../components/ui/table';
import { Gift, Save, Loader2, Users, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import zonecashApi from '../../../../context/api/zonecash';

interface ReferrerReferredUser {
    id: string;
    fullName: string;
    phone: string;
    email: string;
}

interface ReferralRecord {
    id: string;
    status: 'PENDING' | 'COMPLETED' | 'CANCELLED';
    rewardAmount: number;
    minTxAmount: number;
    triggeredTxId?: string;
    createdAt: string;
    updatedAt: string;
    referrer: ReferrerReferredUser;
    referred: ReferrerReferredUser;
}

const ZoneCashReferrals: React.FC = () => {
    const { t } = useTranslation();
    const [rewardAmount, setRewardAmount] = useState('');
    const [minTxAmount, setMinTxAmount] = useState('');
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [referrals, setReferrals] = useState<ReferralRecord[]>([]);

    const fetchConfigAndList = useCallback(async () => {
        setLoading(true);
        try {
            const [configData, referralsList] = await Promise.all([
                zonecashApi.getReferralsConfig(),
                zonecashApi.getReferralsList(),
            ]);
            setRewardAmount(configData.rewardAmount.toString());
            setMinTxAmount(configData.minTxAmount.toString());
            setReferrals(referralsList);
        } catch (err) {
            toast.error(t('zonecashReferrals.toasts.fetchFailed') || 'Failed to fetch referral details');
        } finally {
            setLoading(false);
        }
    }, [t]);

    useEffect(() => {
        fetchConfigAndList();
    }, [fetchConfigAndList]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const reward = parseFloat(rewardAmount);
        const minTx = parseFloat(minTxAmount);

        if (isNaN(reward) || reward < 0 || isNaN(minTx) || minTx < 0) {
            toast.error(t('zonecashReferrals.errors.invalidValues') || 'Veuillez entrer des valeurs valides.');
            return;
        }

        setIsSubmitting(true);
        try {
            await zonecashApi.updateReferralsConfig({ rewardAmount: reward, minTxAmount: minTx });
            toast.success(t('zonecashReferrals.toasts.updateSuccess') || 'Configuration des invitations mise à jour !');
            fetchConfigAndList();
        } catch (err: any) {
            toast.error(err?.response?.data?.message || t('zonecashReferrals.errors.updateFailed') || 'Failed to update referral configuration');
        } finally {
            setIsSubmitting(false);
        }
    };

    const getStatusBadgeClass = (status: string) => {
        switch (status) {
            case 'COMPLETED':
                return 'bg-emerald-100 text-emerald-800 border-emerald-200';
            case 'CANCELLED':
                return 'bg-red-100 text-red-800 border-red-200';
            default:
                return 'bg-amber-100 text-amber-800 border-amber-200';
        }
    };

    if (loading) {
        return (
            <div className="flex h-[400px] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
            </div>
        );
    }

    return (
        <div className="flex-1 space-y-6 p-4 md:p-8 pt-6 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-black tracking-tight text-black uppercase">
                        {t('zonecashReferrals.title') || 'ZoneCash — Invitations & Parrainage'}
                    </h2>
                    <p className="text-muted-foreground text-xs font-bold uppercase tracking-wider">
                        {t('zonecashReferrals.description') || 'Gérer les récompenses de parrainage et suivre les invitations'}
                    </p>
                </div>
                <Button variant="outline" size="sm" onClick={fetchConfigAndList} className="gap-2">
                    <RefreshCw className="h-3.5 w-3.5" />
                    {t('zonecashReferrals.refresh') || 'Rafraîchir'}
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-slate-50 border-slate-200 border-t-2 border-t-emerald-500 md:col-span-1">
                    <CardHeader className="pb-4 border-b border-slate-200/50">
                        <CardTitle className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                            <Gift className="h-3.5 w-3.5 text-emerald-500" />
                            {t('zonecashReferrals.configTitle') || 'Configuration des bonus'}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label className="text-[10px] uppercase font-black text-zinc-500 tracking-widest">
                                        {t('zonecashReferrals.bonusAmount') || 'Montant Bonus (HTG)'}
                                    </Label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        value={rewardAmount}
                                        onChange={(e) => setRewardAmount(e.target.value)}
                                        className="bg-white"
                                        placeholder="Ex: 50.00"
                                    />
                                    <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider mt-1">
                                        {t('zonecashReferrals.bonusAmountDesc') || 'Montant que le parrain reçoit en récompense'}
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-[10px] uppercase font-black text-zinc-500 tracking-widest">
                                        {t('zonecashReferrals.minTxAmount') || 'Tranzaksyon Min (HTG)'}
                                    </Label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        value={minTxAmount}
                                        onChange={(e) => setMinTxAmount(e.target.value)}
                                        className="bg-white"
                                        placeholder="Ex: 100.00"
                                    />
                                    <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider mt-1">
                                        {t('zonecashReferrals.minTxAmountDesc') || 'Montant minimal de la 1ère transaction pour libérer le kado'}
                                    </p>
                                </div>
                            </div>

                            <Button type="submit" disabled={isSubmitting} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold uppercase text-[10px] tracking-widest gap-2 py-5 rounded-md shadow-sm">
                                {isSubmitting ? (
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                    <Save className="h-3 w-3" />
                                )}
                                {t('zonecashReferrals.save') || 'Enregistrer'}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                <Card className="bg-white border-slate-200 md:col-span-2">
                    <CardHeader className="pb-4 border-b border-slate-200/50">
                        <CardTitle className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                            <Users className="h-3.5 w-3.5 text-zinc-500" />
                            {t('zonecashReferrals.historyTitle') || 'Historique des invitations'}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader className="bg-slate-50">
                                    <TableRow>
                                        <TableHead className="text-[10px] font-black uppercase tracking-widest">{t('zonecashReferrals.referrer') || 'Parrain (Referrer)'}</TableHead>
                                        <TableHead className="text-[10px] font-black uppercase tracking-widest">{t('zonecashReferrals.referred') || 'Filleul (Referred)'}</TableHead>
                                        <TableHead className="text-[10px] font-black uppercase tracking-widest">{t('zonecashReferrals.bonusMinTx') || 'Bonus / Min Tx'}</TableHead>
                                        <TableHead className="text-[10px] font-black uppercase tracking-widest">{t('zonecashReferrals.status') || 'Statut'}</TableHead>
                                        <TableHead className="text-[10px] font-black uppercase tracking-widest">{t('zonecashReferrals.createdAt') || 'Créé le'}</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {referrals.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="h-24 text-center text-xs text-zinc-500 font-bold uppercase">
                                                {t('zonecashReferrals.noReferrals') || 'Aucune invitation trouvée'}
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        referrals.map((ref) => (
                                            <TableRow key={ref.id} className="hover:bg-slate-50/50">
                                                <TableCell className="py-3">
                                                    <div className="font-bold text-xs text-black">{ref.referrer.fullName}</div>
                                                    <div className="text-[10px] text-zinc-500">{ref.referrer.phone || ref.referrer.email}</div>
                                                </TableCell>
                                                <TableCell className="py-3">
                                                    <div className="font-bold text-xs text-black">{ref.referred.fullName}</div>
                                                    <div className="text-[10px] text-zinc-500">{ref.referred.phone || ref.referred.email}</div>
                                                </TableCell>
                                                <TableCell className="py-3 text-xs">
                                                    <div className="font-bold text-emerald-600">{ref.rewardAmount} HTG</div>
                                                    <div className="text-[10px] text-zinc-500">Min: {ref.minTxAmount} HTG</div>
                                                </TableCell>
                                                <TableCell className="py-3">
                                                    <span className={`px-2 py-0.5 rounded-full border text-[9px] font-black uppercase tracking-wider ${getStatusBadgeClass(ref.status)}`}>
                                                        {ref.status}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="py-3 text-[10px] text-zinc-500 font-medium">
                                                    {new Date(ref.createdAt).toLocaleDateString('fr-FR', {
                                                        year: 'numeric',
                                                        month: 'short',
                                                        day: 'numeric',
                                                        hour: '2-digit',
                                                        minute: '2-digit',
                                                    })}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default ZoneCashReferrals;
