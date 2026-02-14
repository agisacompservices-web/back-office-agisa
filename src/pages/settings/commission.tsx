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
import { cn } from "../../lib/utils";

const CommissionRates: React.FC = () => {
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
                { key: SettingKey.SELLER_DEPOSIT_COMMISSION_RATE, label: "Seller Deposit" },
                { key: SettingKey.HQ_DEPOSIT_COMMISSION_RATE, label: "HQ Deposit" },
                { key: SettingKey.SELLER_WITHDRAWAL_COMMISSION_RATE, label: "Seller Withdrawal" },
                { key: SettingKey.HQ_WITHDRAWAL_COMMISSION_RATE, label: "HQ Withdrawal" }
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
                    description: `Define global transaction percentage for ${req.label}.`,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                } as Setting;
            });

            setSettings(finalSettings);
        } catch (error) {
            toast.error("Failed to load commission settings");
        } finally {
            setIsLoading(false);
        }
    }, []);

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
            toast.success(`${editingSetting.label} updated successfully`);
            setEditingSetting(null);
            fetchSettings();
        } catch (error) {
            toast.error("Update failed");
        } finally {
            setIsUpdating(false);
        }
    };

    const handleInitialize = async () => {
        setIsLoading(true);
        try {
            // Initialize all 4 rates with 0 if they don't exist
            await Promise.all([
                commissionApi.updateByKey(SettingKey.SELLER_DEPOSIT_COMMISSION_RATE, { value: "0", label: "Seller Deposit Commission" }),
                commissionApi.updateByKey(SettingKey.HQ_DEPOSIT_COMMISSION_RATE, { value: "0", label: "HQ Deposit Commission" }),
                commissionApi.updateByKey(SettingKey.SELLER_WITHDRAWAL_COMMISSION_RATE, { value: "0", label: "Seller Withdrawal Commission" }),
                commissionApi.updateByKey(SettingKey.HQ_WITHDRAWAL_COMMISSION_RATE, { value: "0", label: "HQ Withdrawal Commission" })
            ]);
            toast.success("Default commission rates initialized");
            fetchSettings();
        } catch (error) {
            toast.error("Failed to initialize rates");
        } finally {
            setIsLoading(false);
        }
    };

    const getIcon = (key: SettingKey) => {
        switch (key) {
            case SettingKey.SELLER_DEPOSIT_COMMISSION_RATE:
                return <MonitorCheck className="h-5 w-5 text-emerald-500" />;
            case SettingKey.HQ_DEPOSIT_COMMISSION_RATE:
                return <ShieldHalf className="h-5 w-5 text-blue-500" />;
            case SettingKey.SELLER_WITHDRAWAL_COMMISSION_RATE:
                return <MonitorCheck className="h-5 w-5 text-amber-500" />;
            case SettingKey.HQ_WITHDRAWAL_COMMISSION_RATE:
                return <ShieldHalf className="h-5 w-5 text-purple-500" />;
            default:
                return <Settings className="h-5 w-5 text-zinc-500" />;
        }
    };

    return (
        <div className="p-4 sm:p-6 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-black tracking-tighter text-white uppercase flex items-center gap-3">
                        <Percent className="h-8 w-8 text-emerald-500" />
                        Commission Rates
                    </h1>
                    <p className="text-zinc-500 uppercase text-[10px] font-black tracking-[0.2em] mt-1">
                        Configure global transaction fees and distributions
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        className="bg-emerald-500/10 border-emerald-500/20 text-emerald-500 hover:bg-emerald-500/20 h-10 px-4 font-bold uppercase tracking-widest text-[10px]"
                        onClick={handleInitialize}
                        disabled={isLoading}
                    >
                        <Settings className="h-4 w-4 mr-2" />
                        Init Defaults
                    </Button>
                    <Button
                        variant="outline"
                        className="bg-white/5 border-white/10 text-white hover:bg-white/10 h-10 px-4 font-bold uppercase tracking-widest text-[10px]"
                        onClick={fetchSettings}
                        disabled={isLoading}
                    >
                        <RefreshCw className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")} />
                        Sync Rates
                    </Button>
                </div>
            </div>

            {/* Content Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {isLoading && settings.length === 0 ? (
                    // Skeleton Loading
                    [1, 2].map((i) => (
                        <Card key={i} className="border-white/10 bg-black/40 backdrop-blur-xl h-[200px] animate-pulse">
                            <CardHeader>
                                <div className="h-6 w-32 bg-white/5 rounded" />
                            </CardHeader>
                        </Card>
                    ))
                ) : (
                    settings.map((setting) => (
                        <Card key={setting.id} className="group border-white/10 bg-black/40 backdrop-blur-xl hover:bg-white/[0.02] transition-all duration-500 overflow-hidden relative">
                            <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                                <Percent className="h-24 w-24 text-white" />
                            </div>

                            <CardHeader className="relative z-10">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                                            {getIcon(setting.key)}
                                        </div>
                                        <div>
                                            <CardTitle className="text-lg font-bold text-white uppercase tracking-tight">
                                                {setting.label}
                                            </CardTitle>
                                            <CardDescription className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">
                                                {setting.key.replace(/_/g, " ")}
                                            </CardDescription>
                                        </div>
                                    </div>
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        className="h-8 w-8 text-zinc-500 hover:text-emerald-500 hover:bg-emerald-500/10 rounded-full"
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
                                    <span className="text-4xl font-black text-white tracking-tighter italic">
                                        {setting.value}
                                    </span>
                                    <span className="text-xl font-bold text-emerald-500">%</span>
                                </div>
                                <p className="mt-4 text-xs text-zinc-400 leading-relaxed max-w-[80%]">
                                    {setting.description || "Percentage applied to transactions for this level."}
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
                    <p className="font-bold uppercase tracking-[0.3em] text-zinc-500">No rates detected</p>
                </div>
            )}

            {/* Edit Dialog */}
            <Dialog open={!!editingSetting} onOpenChange={(open) => !open && setEditingSetting(null)}>
                <DialogContent className="sm:max-w-[425px] bg-zinc-950 border-white/10 text-white">
                    <form onSubmit={handleUpdate}>
                        <DialogHeader>
                            <DialogTitle className="text-xl font-bold flex items-center gap-2">
                                <Edit3 className="h-5 w-5 text-emerald-500" />
                                Update {editingSetting?.label}
                            </DialogTitle>
                            <DialogDescription className="text-zinc-500">
                                Apply a new global percentage rate for {editingSetting?.label.toLowerCase()}.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="grid gap-4 py-6">
                            <div className="grid gap-2">
                                <Label htmlFor="value" className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                                    Percentage Rate (%)
                                </Label>
                                <div className="relative">
                                    <Input
                                        id="value"
                                        type="number"
                                        step="0.01"
                                        className="bg-white/5 border-white/10 text-white h-12 text-lg font-black tracking-widest focus-visible:ring-emerald-500/50"
                                        value={newValue}
                                        onChange={(e) => setNewValue(e.target.value)}
                                        required
                                        autoFocus
                                    />
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-emerald-500">
                                        %
                                    </div>
                                </div>
                                <p className="text-[9px] text-zinc-600 font-medium italic mt-1 uppercase">
                                    Changes will take effect immediately across all system calculations.
                                </p>
                            </div>
                        </div>

                        <DialogFooter className="gap-2 sm:gap-0">
                            <Button
                                type="button"
                                variant="ghost"
                                className="text-zinc-500 hover:text-white"
                                onClick={() => setEditingSetting(null)}
                            >
                                <X className="h-4 w-4 mr-2" />
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold uppercase tracking-widest px-8"
                                disabled={isUpdating}
                            >
                                {isUpdating ? (
                                    <RefreshCw className="h-4 w-4 animate-spin" />
                                ) : (
                                    <>
                                        <Check className="h-4 w-4 mr-2" />
                                        Update Rate
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