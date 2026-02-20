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
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [type, setType] = useState<RequestType | "">("");
    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');
    const [receiptFile, setReceiptFile] = useState<File | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!type) {
            toast.error("Please select a request type");
            return;
        }

        if ((type === RequestType.DEPOSIT || type === RequestType.WITHDRAWAL) && !amount) {
            toast.error("Please enter an amount");
            return;
        }

        if (type === RequestType.WITHDRAWAL && Number(amount) > maxWithdrawalBalance) {
            toast.error(`Insufficient withdrawal balance. Available: ${maxWithdrawalBalance.toLocaleString()} USD`);
            return;
        }

        if (type === RequestType.DEPOSIT && !receiptFile) {
            toast.error("Please upload a receipt file for the deposit");
            return;
        }

        try {
            setLoading(true);
            if (type === RequestType.DEPOSIT) {
                const formData = new FormData();
                formData.append('type', type);
                if (amount) formData.append('amount', amount.toString());
                if (description) formData.append('description', description);
                formData.append('headquarterId', headquarterId);
                formData.append('enterpriseId', enterpriseId);
                if (receiptFile) formData.append('receipt', receiptFile);

                await requestApi.createWithReceipt(formData);
            } else {
                await requestApi.create({
                    type: type as RequestType,
                    amount: amount ? Number(amount) : undefined,
                    description,
                    headquarterId,
                    enterpriseId
                });
            }

            toast.success("Request sent successfully! An administrator will review it.");
            setOpen(false);
            resetForm();
            if (onSuccess) onSuccess();
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Error sending request");
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
                        New Request
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] bg-zinc-950 border-zinc-800 text-zinc-100">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold text-zinc-100">Make a request</DialogTitle>
                        <DialogDescription className="text-zinc-400">
                            Choose the request type and fill all field
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-6 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="type" className="text-zinc-300">Request Type</Label>
                            <Select
                                value={type}
                                onValueChange={(v) => setType(v as RequestType)}
                                disabled={loading}
                            >
                                <SelectTrigger className="bg-zinc-900 border-zinc-800 text-zinc-100">
                                    <SelectValue placeholder="Choose a type" />
                                </SelectTrigger>
                                <SelectContent className="bg-zinc-900 border-zinc-800 text-zinc-100">
                                    <SelectItem value={RequestType.DEPOSIT}>Deposit (Refill)</SelectItem>
                                    <SelectItem value={RequestType.WITHDRAWAL}>Withdrawal</SelectItem>
                                    {!isActive ? (
                                        <SelectItem value={RequestType.ACTIVATION}>Activate HQ</SelectItem>
                                    ) : (
                                        <SelectItem value={RequestType.DEACTIVATION}>Deactivate HQ</SelectItem>
                                    )}
                                </SelectContent>
                            </Select>
                        </div>

                        {showAmount && (
                            <div className="grid gap-2">
                                <Label htmlFor="amount" className="text-zinc-300">Amount (USD)</Label>
                                <Input
                                    id="amount"
                                    type="number"
                                    placeholder="0.00"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    className="bg-zinc-900 border-zinc-800 text-zinc-100 focus:ring-orange-500/50"
                                    disabled={loading}
                                    min="0"
                                    step="0.01"
                                />
                            </div>
                        )}

                        {type === RequestType.DEPOSIT && (
                            <div className="grid gap-2">
                                <Label htmlFor="receipt" className="text-zinc-300">Transaction Receipt</Label>
                                <Input
                                    id="receipt"
                                    type="file"
                                    accept="image/*,.pdf"
                                    onChange={(e) => setReceiptFile(e.target.files?.[0] || null)}
                                    className="bg-zinc-900 border-zinc-800 text-zinc-100 focus:ring-orange-500/50 file:bg-zinc-800 file:text-white file:border-0 file:mr-4 file:py-1 file:px-3 file:rounded-md cursor-pointer file:cursor-pointer"
                                    disabled={loading}
                                />
                            </div>
                        )}

                        <div className="grid gap-2">
                            <Label htmlFor="description" className="text-zinc-300">Reason / Description</Label>
                            <textarea
                                id="description"
                                placeholder="Tell us more about this request..."
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className={cn(
                                    "flex min-h-[100px] w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm",
                                    "ring-offset-background placeholder:text-zinc-500 focus-visible:outline-none",
                                    "focus-visible:ring-2 focus-visible:ring-orange-500/50 focus-visible:ring-offset-2",
                                    "disabled:cursor-not-allowed disabled:opacity-50 text-zinc-100"
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
                            className="text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={loading}
                            className="bg-orange-600 hover:bg-orange-700 text-white font-bold"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Sending...
                                </>
                            ) : (
                                "Send Request"
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
