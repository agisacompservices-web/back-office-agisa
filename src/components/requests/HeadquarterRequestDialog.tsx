import React, { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "../ui/select";
import { Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import requestApi, { RequestType } from "../../context/api/request";
import { cn } from "../../lib/utils";

interface HeadquarterRequestDialogProps {
    headquarterId: string;
    enterpriseId: string;
    isActive?: boolean;
    maxWithdrawalBalance?: number;
    onSuccess?: () => void;
    children?: React.ReactNode;
}

export function HeadquarterRequestDialog({
    headquarterId,
    enterpriseId,
    isActive = true,
    maxWithdrawalBalance = 0,
    onSuccess,
    children
}: HeadquarterRequestDialogProps) {
    const { t } = useTranslation();
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [type, setType] = useState<RequestType | "">("");
    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');
    const [receiptFile, setReceiptFile] = useState<File | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!type) {
            toast.error(t('hqReqDialog.errNoType'));
            return;
        }

        if ((type === RequestType.DEPOSIT || type === RequestType.WITHDRAWAL) && !amount) {
            toast.error(t('hqReqDialog.errNoAmount'));
            return;
        }

        if (type === RequestType.WITHDRAWAL && Number(amount) > maxWithdrawalBalance) {
            toast.error(t('hqReqDialog.errInsuffBal', { amount: maxWithdrawalBalance.toLocaleString() }));
            return;
        }

        if (type === RequestType.DEPOSIT && !receiptFile) {
            toast.error(t('hqReqDialog.errNoReceipt'));
            return;
        }

        try {
            setLoading(true);
            const formData = new FormData();
            formData.append('type', type);
            if (amount) formData.append('amount', amount.toString());
            if (description) formData.append('description', description);
            formData.append('headquarterId', headquarterId);
            formData.append('enterpriseId', enterpriseId);
            if (type === RequestType.DEPOSIT && receiptFile) {
                formData.append('receipt', receiptFile);
            }

            // The backend endpoint requires multipart/form-data for all request creations.
            await requestApi.createWithReceipt(formData);

            toast.success(t('hqReqDialog.successMsg'));
            setOpen(false);
            resetForm();
            if (onSuccess) onSuccess();
        } catch (error: any) {
            toast.error(error.response?.data?.message || t('hqReqDialog.errMsg'));
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setType("");
        setAmount('');
        setDescription('');
        setReceiptFile(null);
    };

    const showAmount = type === RequestType.DEPOSIT || type === RequestType.WITHDRAWAL;

    return (
        <Dialog open={open} onOpenChange={(val) => {
            setOpen(val);
            if (!val) resetForm();
        }}>
            <DialogTrigger asChild>
                {children || (
                    <Button variant="outline" size="sm" className="gap-2">
                        <Plus className="h-4 w-4" />
                        {t('hqReqDialog.newRequest')}
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] bg-white border-slate-200 text-black">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold text-black">{t('hqReqDialog.title')}</DialogTitle>
                        <DialogDescription className="text-slate-600">
                            {t('hqReqDialog.desc')}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-6 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="type" className="text-slate-700">{t('hqReqDialog.reqType')}</Label>
                            <Select
                                value={type}
                                onValueChange={(v) => setType(v as RequestType)}
                                disabled={loading}
                            >
                                <SelectTrigger className="bg-slate-50 border-slate-200 text-black">
                                    <SelectValue placeholder={t('hqReqDialog.chooseType')} />
                                </SelectTrigger>
                                <SelectContent className="bg-slate-50 border-slate-200 text-black">
                                    <SelectItem value={RequestType.DEPOSIT}>{t('hqReqDialog.typeDeposit')}</SelectItem>
                                    <SelectItem value={RequestType.WITHDRAWAL}>{t('hqReqDialog.typeWithdrawal')}</SelectItem>
                                    {!isActive ? (
                                        <SelectItem value={RequestType.ACTIVATION}>{t('hqReqDialog.typeActivate')}</SelectItem>
                                    ) : (
                                        <SelectItem value={RequestType.DEACTIVATION}>{t('hqReqDialog.typeDeactivate')}</SelectItem>
                                    )}
                                </SelectContent>
                            </Select>
                        </div>

                        {showAmount && (
                            <div className="grid gap-2">
                                <Label htmlFor="amount" className="text-slate-700">{t('hqReqDialog.amount')}</Label>
                                <Input
                                    id="amount"
                                    type="number"
                                    placeholder="0.00"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    className="bg-slate-50 border-slate-200 text-black focus:ring-orange-500/50"
                                    disabled={loading}
                                    min="0"
                                    step="0.01"
                                />
                            </div>
                        )}

                        {type === RequestType.DEPOSIT && (
                            <div className="grid gap-2">
                                <Label htmlFor="receipt" className="text-slate-700">{t('hqReqDialog.receipt')}</Label>
                                <Input
                                    id="receipt"
                                    type="file"
                                    accept="image/*,.pdf"
                                    onChange={(e) => setReceiptFile(e.target.files?.[0] || null)}
                                    className="bg-slate-50 border-slate-200 text-black focus:ring-orange-500/50 file:bg-slate-200 file:text-black file:border-0 file:mr-4 file:py-1 file:px-3 file:rounded-md cursor-pointer file:cursor-pointer"
                                    disabled={loading}
                                />
                            </div>
                        )}

                        <div className="grid gap-2">
                            <Label htmlFor="description" className="text-slate-700">{t('hqReqDialog.reason')}</Label>
                            <textarea
                                id="description"
                                placeholder={t('hqReqDialog.reasonPlaceholder')}
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className={cn(
                                    "flex min-h-[100px] w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm",
                                    "ring-offset-background placeholder:text-slate-500 focus-visible:outline-none",
                                    "focus-visible:ring-2 focus-visible:ring-orange-500/50 focus-visible:ring-offset-2",
                                    "disabled:cursor-not-allowed disabled:opacity-50 text-black"
                                )}
                                disabled={loading}
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => setOpen(false)}
                            disabled={loading}
                            className="text-slate-600 hover:text-black hover:bg-slate-50"
                        >
                            {t('hqReqDialog.cancel')}
                        </Button>
                        <Button
                            type="submit"
                            disabled={loading}
                            className="bg-orange-600 hover:bg-orange-700 text-black font-bold"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    {t('hqReqDialog.sending')}
                                </>
                            ) : (
                                t('hqReqDialog.send')
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
