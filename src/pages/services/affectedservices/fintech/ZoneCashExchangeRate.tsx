import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/ui/card';
import { Button } from '../../../../components/ui/button';
import { Input } from '../../../../components/ui/input';
import { Label } from '../../../../components/ui/label';
import { RefreshCw, Save, Loader2, TrendingUp, History } from 'lucide-react';
import { toast } from 'sonner';
import zonecashApi from '../../../../context/api/zonecash';

const ZoneCashExchangeRate: React.FC = () => {
    const { t } = useTranslation();
    const [vente, setVente] = useState('');
    const [achat, setAchat] = useState('');
    const [reference, setReference] = useState('');
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [lastUpdated, setLastUpdated] = useState<string | null>(null);

    const fetchRate = useCallback(async () => {
        setLoading(true);
        try {
            const data = await zonecashApi.getExchangeRate();
            setVente(data.vente.toString());
            setAchat(data.achat.toString());
            setReference(data.reference?.toString() || '');
            setLastUpdated(data.updatedAt);
        } catch (err) {
            toast.error(t('zonecashRates.errors.fetchFailed') || 'Failed to fetch exchange rate');
        } finally {
            setLoading(false);
        }
    }, [t]);

    useEffect(() => {
        fetchRate();
    }, [fetchRate]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const v = parseFloat(vente);
        const a = parseFloat(achat);
        const r = parseFloat(reference);

        if (isNaN(v) || v <= 0 || isNaN(a) || a <= 0 || isNaN(r) || r <= 0) {
            toast.error(t('zonecashRates.errors.invalidRates') || 'Please enter valid rates');
            return;
        }

        setIsSubmitting(true);
        try {
            await zonecashApi.updateExchangeRate({ vente: v, achat: a, reference: r });
            toast.success(t('zonecashRates.toasts.updateSuccess') || 'Exchange rates updated successfully!');
            fetchRate();
        } catch (err: any) {
            toast.error(err?.response?.data?.message || t('zonecashRates.errors.updateFailed') || 'Failed to update rates');
        } finally {
            setIsSubmitting(false);
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
            <div>
                <h2 className="text-3xl font-black tracking-tight text-black uppercase">
                    {t('zonecashRates.title') || 'ZoneCash — Taux de Change'}
                </h2>
                <p className="text-muted-foreground text-xs font-bold uppercase tracking-wider">
                    {t('zonecashRates.description') || 'Configurer les taux de change pour les conversions USD/HTG'}
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="bg-slate-50 border-slate-200 border-t-2 border-t-emerald-500">
                    <CardHeader className="pb-4 border-b border-slate-200/50">
                        <CardTitle className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                            <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
                            {t('zonecashRates.card.title') || 'Mise à jour des taux'}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 gap-6">
                                <div className="space-y-2">
                                    <Label className="text-[10px] uppercase font-black text-zinc-500 tracking-widest">
                                        {t('zonecashRates.achat') || 'Taux d\'Achat (USD ➔ HTG)'}
                                    </Label>
                                    <div className="relative">
                                        <Input
                                            type="number"
                                            step="0.01"
                                            value={achat}
                                            onChange={e => setAchat(e.target.value)}
                                            className="bg-slate-100 border-slate-300 text-black h-12 font-black text-lg focus-visible:ring-blue-500/50"
                                            placeholder="0.00"
                                        />
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-black text-zinc-400">HTG</div>
                                    </div>
                                    <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">
                                        {t('zonecashRates.achat_desc') || 'Taux utilisé pour convertir les dollars en gourdes'}
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-[10px] uppercase font-black text-zinc-500 tracking-widest">
                                        {t('zonecashRates.reference') || 'Taux de Référence (Mache)'}
                                    </Label>
                                    <div className="relative">
                                        <Input
                                            type="number"
                                            step="0.01"
                                            value={reference}
                                            onChange={e => setReference(e.target.value)}
                                            className="bg-slate-100 border-slate-300 text-black h-12 font-black text-lg focus-visible:ring-blue-500/50"
                                            placeholder="0.00"
                                        />
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-black text-zinc-400">HTG</div>
                                    </div>
                                    <p className="text-[10px] text-blue-600 font-bold uppercase tracking-widest">
                                        {t('zonecashRates.reference_desc') || 'Taux réel du marché pour le calcul du profit'}
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-[10px] uppercase font-black text-zinc-500 tracking-widest">
                                        {t('zonecashRates.vente') || 'Taux de Vente (HTG ➔ USD)'}
                                    </Label>
                                    <div className="relative">
                                        <Input
                                            type="number"
                                            step="0.01"
                                            value={vente}
                                            onChange={e => setVente(e.target.value)}
                                            className="bg-slate-100 border-slate-300 text-black h-12 font-black text-lg focus-visible:ring-blue-500/50"
                                            placeholder="0.00"
                                        />
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-black text-zinc-400">HTG</div>
                                    </div>
                                    <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">
                                        {t('zonecashRates.vente_desc') || 'Taux utilisé pour convertir les gourdes en dollars'}
                                    </p>
                                </div>
                            </div>

                            <Button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full bg-emerald-600 hover:bg-emerald-700 text-black font-black uppercase tracking-widest h-12 transition-all active:scale-95"
                            >
                                {isSubmitting ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <>
                                        <Save className="h-4 w-4 mr-2" />
                                        {t('zonecashRates.save') || 'Enregistrer les modifications'}
                                    </>
                                )}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                <div className="space-y-6">
                    <Card className="bg-slate-50 border-slate-200">
                        <CardHeader className="pb-4 border-b border-slate-200/50">
                            <CardTitle className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                                <History className="h-3.5 w-3.5 text-zinc-500" />
                                {t('zonecashRates.status.title') || 'État Actuel'}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6 space-y-4">
                            <div className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-lg">
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
                                        {t('zonecashRates.status.last_updated') || 'Dernière mise à jour'}
                                    </p>
                                    <p className="text-sm font-bold text-black mt-1">
                                        {lastUpdated ? new Date(lastUpdated).toLocaleString() : (t('zonecashRates.status.never') || 'Jamais')}
                                    </p>
                                </div>
                                <Button size="icon" variant="ghost" onClick={fetchRate} className="hover:bg-slate-100">
                                    <RefreshCw className="h-4 w-4 text-emerald-500" />
                                </Button>
                            </div>

                            <div className="grid grid-cols-1 gap-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-emerald-700">
                                            {t('zonecashRates.achat') || 'Taux Achte'}
                                        </p>
                                        <p className="text-lg font-black text-black mt-1">{achat} HTG</p>
                                    </div>
                                    <div className="p-4 bg-zinc-100 border border-zinc-200 rounded-lg">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
                                            {t('zonecashRates.vente') || 'Taux Vann'}
                                        </p>
                                        <p className="text-lg font-black text-black mt-1">{vente} HTG</p>
                                    </div>
                                </div>
                                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-blue-700">
                                        {t('zonecashRates.reference') || 'Taux Referans'}
                                    </p>
                                    <p className="text-lg font-black text-black mt-1">{reference} HTG</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default ZoneCashExchangeRate;
