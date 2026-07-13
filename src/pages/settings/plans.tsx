import React, { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "../../components/ui/table";
import {
    Card,
    CardContent,
    CardHeader
} from "../../components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "../../components/ui/dialog";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "../../components/ui/select";
import { Form, Loader2, Plus, RefreshCcw, Search, Edit2, Trash2 } from "lucide-react";
import plansApi, { Plan, PlanTarget, CreatePlanDto } from "../../context/api/plans";
import { cn } from "../../lib/utils";

const Plans: React.FC = () => {
    const { t } = useTranslation();
    const [plans, setPlans] = useState<Plan[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [targetFilter, setTargetFilter] = useState<PlanTarget | "ALL">("ALL");

    // Dialogs
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);

    // Form state
    const [formData, setFormData] = useState<CreatePlanDto>({
        name: "",
        target: PlanTarget.SELLER,
        startingBalance: 0,
        level: 1,
    });

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await plansApi.getAll(targetFilter === "ALL" ? undefined : targetFilter);
            setPlans(data);
        } catch (error) {
            toast.error(t("plans.toasts.loadFailed", "Error fetching plans"));
        } finally {
            setIsLoading(false);
        }
    }, [targetFilter, t]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleCreate = async () => {
        if (!formData.name || formData.startingBalance < 0) {
            toast.error(t("plans.toasts.fillRequired", "Please fill all required fields correctly"));
            return;
        }

        setIsSubmitting(true);
        try {
            await plansApi.create({ ...formData, startingBalance: Number(formData.startingBalance), level: Number(formData.level) });
            toast.success(t("plans.toasts.created", "Plan created successfully"));
            setIsAddOpen(false);
            setFormData({ name: "", target: PlanTarget.SELLER, startingBalance: 0, level: 1 });
            await fetchData();
        } catch (error) {
            toast.error(t("plans.toasts.createFailed", "Failed to create plan"));
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEdit = async () => {
        if (!selectedPlan || !formData.name || formData.startingBalance < 0) return;

        setIsSubmitting(true);
        try {
            await plansApi.update(selectedPlan.id, {
                name: formData.name,
                target: formData.target,
                startingBalance: Number(formData.startingBalance),
                level: Number(formData.level)
            });
            toast.success(t("plans.toasts.updated", "Plan updated successfully"));
            setIsEditOpen(false);
            await fetchData();
        } catch (error) {
            toast.error(t("plans.toasts.updateFailed", "Failed to update plan"));
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!selectedPlan) return;
        setIsSubmitting(true);
        try {
            await plansApi.remove(selectedPlan.id);
            toast.success(t("plans.toasts.deleted", "Plan deleted successfully"));
            setIsDeleteOpen(false);
            await fetchData();
        } catch (error) {
            toast.error(t("plans.toasts.deleteFailed", "Failed to delete plan"));
        } finally {
            setIsSubmitting(false);
        }
    };

    const openEdit = (plan: Plan) => {
        setSelectedPlan(plan);
        setFormData({
            name: plan.name,
            target: plan.target,
            startingBalance: plan.startingBalance,
            level: plan.level
        });
        setIsEditOpen(true);
    };

    const filteredPlans = plans.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('fr-HT', { style: 'currency', currency: 'HTG' }).format(val);
    };

    return (
        <div className="p-4 sm:p-6 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-black tracking-tighter text-slate-800 uppercase flex items-center gap-3">
                        <Form className="h-8 w-8 text-indigo-500" />
                        {t('plans.title', 'Plans Configuration')}
                    </h1>
                    <p className="text-slate-500 uppercase text-[10px] font-bold tracking-widest mt-1">
                        {t('plans.description', 'Configure starting balances and levels for Sellers and HQ')}
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Button
                        onClick={() => setIsAddOpen(true)}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase text-[10px] tracking-widest h-10 px-6 shadow-[0_0_20px_rgba(79,70,229,0.2)]"
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        {t('plans.addBtn', 'Add Plan')}
                    </Button>
                </div>
            </div>

            <Card className="bg-white border-slate-200">
                <CardHeader className="border-b border-slate-100 pb-4">
                    <div className="flex flex-col sm:flex-row justify-between gap-4">
                        <div className="relative group w-full sm:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                            <Input
                                placeholder={t('plans.search', 'Search plans...')}
                                className="pl-9 h-11 bg-slate-50 border-slate-200 focus:border-indigo-500/50 text-slate-800 text-sm font-medium transition-all"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <div className="flex items-center gap-3">
                            <Select value={targetFilter} onValueChange={(v: any) => setTargetFilter(v)}>
                                <SelectTrigger className="w-[140px] h-11 bg-slate-50 border-slate-200 font-bold text-[10px] uppercase tracking-widest text-slate-800">
                                    <SelectValue placeholder={t('plans.filterTarget', 'Filter by Target')} />
                                </SelectTrigger>
                                <SelectContent className="bg-white border-slate-200 font-bold uppercase text-[10px]">
                                    <SelectItem value="ALL">{t('plans.allTargets', 'All Targets')}</SelectItem>
                                    <SelectItem value={PlanTarget.SELLER}>{t('plans.sellersOnly', 'Sellers Only')}</SelectItem>
                                    <SelectItem value={PlanTarget.HQ}>{t('plans.hqOnly', 'HQ Only')}</SelectItem>
                                </SelectContent>
                            </Select>
                            <Button variant="outline" size="icon" className="h-11 w-11 border-slate-200 bg-slate-50 text-slate-500 hover:text-indigo-600" onClick={fetchData}>
                                <RefreshCcw className={cn("h-4 w-4", isLoading && "animate-spin")} />
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow className="border-slate-100 hover:bg-transparent bg-slate-50/50">
                                <TableHead className="w-[100px] text-[10px] font-black uppercase tracking-widest text-slate-500 py-4 h-auto">{t('plans.grid.colLevel', 'Level')}</TableHead>
                                <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-500 py-4 h-auto">{t('plans.grid.colName', 'Plan Name')}</TableHead>
                                <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-500 py-4 h-auto">{t('plans.grid.colTarget', 'Target')}</TableHead>
                                <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-500 py-4 h-auto text-right">{t('plans.grid.colStartingBalance', 'Starting Balance')}</TableHead>
                                <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-500 py-4 h-auto text-right">{t('plans.grid.colActions', 'Actions')}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-32 text-center">
                                        <Loader2 className="h-6 w-6 animate-spin text-indigo-500 mx-auto" />
                                    </TableCell>
                                </TableRow>
                            ) : filteredPlans.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-32 text-center text-slate-500 text-sm font-bold uppercase tracking-widest">
                                        {t('plans.grid.noPlans', 'No plans found')}
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredPlans.map((plan) => (
                                    <TableRow key={plan.id} className="border-slate-100 hover:bg-slate-50 transition-colors group">
                                        <TableCell>
                                            <Badge variant="outline" className="text-[10px] font-black bg-white border-slate-200 text-slate-600 h-6">
                                                Lvl. {plan.level}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="font-black text-sm text-slate-800 uppercase tracking-tight">
                                                {plan.name}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className={cn(
                                                "text-[9px] font-black uppercase tracking-widest py-0.5 px-2",
                                                plan.target === PlanTarget.SELLER ? "bg-emerald-50 text-emerald-600 border-emerald-200" : "bg-blue-50 text-blue-600 border-blue-200"
                                            )}>
                                                {plan.target}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="font-mono font-black text-indigo-600 tracking-tighter">
                                                {formatCurrency(Number(plan.startingBalance))}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                                    onClick={() => openEdit(plan)}
                                                >
                                                    <Edit2 className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                                    onClick={() => { setSelectedPlan(plan); setIsDeleteOpen(true); }}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Add/Edit Dialog */}
            <Dialog open={isAddOpen || isEditOpen} onOpenChange={(open) => {
                if (!open) {
                    setIsAddOpen(false);
                    setIsEditOpen(false);
                    setFormData({ name: "", target: PlanTarget.SELLER, startingBalance: 0, level: 1 });
                }
            }}>
                <DialogContent className="bg-white border-slate-200 text-slate-800 p-0 overflow-hidden sm:max-w-[425px]">
                    <div className="px-6 pt-6 pb-4 border-b border-slate-100">
                        <DialogTitle className="text-xl font-black uppercase tracking-tight text-slate-800">
                            {isEditOpen ? t('plans.editDialog.title', 'Edit Plan') : t('plans.addDialog.title', 'Create New Plan')}
                        </DialogTitle>
                        <DialogDescription className="text-slate-500 font-medium text-sm mt-1">
                            {isEditOpen ? t('plans.editDialog.desc', 'Update the configuration for this plan.') : t('plans.addDialog.desc', 'Define a new starting balance plan.')}
                        </DialogDescription>
                    </div>

                    <div className="p-6 space-y-5">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2 col-span-2">
                                <Label className="text-[10px] uppercase font-black tracking-widest text-slate-500">{t('plans.addDialog.nameLabel', 'Plan Name')}</Label>
                                <Input
                                    className="bg-slate-50 border-slate-200 focus:border-indigo-500/50 h-11 text-slate-800 font-bold uppercase transition-all"
                                    placeholder={t('plans.addDialog.namePlaceholder', 'e.g. PLATINUM')}
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value.toUpperCase() })}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label className="text-[10px] uppercase font-black tracking-widest text-slate-500">{t('plans.addDialog.targetLabel', 'Target')}</Label>
                                <Select value={formData.target} onValueChange={(v: PlanTarget) => setFormData({ ...formData, target: v })}>
                                    <SelectTrigger className="bg-slate-50 border-slate-200 h-11 text-slate-800 font-bold uppercase text-xs">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-white border-slate-200">
                                        <SelectItem value={PlanTarget.SELLER} className="font-bold uppercase text-[10px]">{t('plans.addDialog.targetSeller', 'Seller')}</SelectItem>
                                        <SelectItem value={PlanTarget.HQ} className="font-bold uppercase text-[10px]">{t('plans.addDialog.targetHQ', 'HQ')}</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-[10px] uppercase font-black tracking-widest text-slate-500">{t('plans.addDialog.levelLabel', 'Hierarchy Level')}</Label>
                                <Input
                                    type="number"
                                    className="bg-slate-50 border-slate-200 focus:border-indigo-500/50 h-11 text-slate-800 font-bold transition-all"
                                    placeholder={t('plans.addDialog.levelPlaceholder', 'integer (1, 2, 3...)')}
                                    value={formData.level}
                                    onChange={e => setFormData({ ...formData, level: Number(e.target.value) })}
                                />
                            </div>

                            <div className="space-y-2 col-span-2">
                                <Label className="text-[10px] uppercase font-black tracking-widest text-slate-500">
                                    {t('plans.addDialog.startingBalanceLabel', 'Starting Balance (HTG)')}
                                </Label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-black text-sm">G</span>
                                    <Input
                                        type="number"
                                        min={0}
                                        className="bg-slate-50 border-slate-200 focus:border-indigo-500/50 h-11 text-slate-800 font-black font-mono transition-all pl-7"
                                        placeholder="0"
                                        value={formData.startingBalance}
                                        onChange={e => setFormData({ ...formData, startingBalance: Number(e.target.value) })}
                                    />
                                </div>
                                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">
                                    {formatCurrency(Number(formData.startingBalance))}
                                </p>
                            </div>

                        </div>
                    </div>

                    <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                        <Button
                            variant="ghost"
                            className="text-slate-500 hover:text-slate-800 hover:bg-slate-200 uppercase text-[10px] font-black tracking-widest px-6"
                            onClick={() => { setIsAddOpen(false); setIsEditOpen(false); }}
                            disabled={isSubmitting}
                        >
                            {t('plans.addDialog.cancelBtn', 'Cancel')}
                        </Button>
                        <Button
                            className="bg-indigo-600 hover:bg-indigo-700 text-white uppercase text-[10px] font-black tracking-widest px-8 shadow-md"
                            onClick={isEditOpen ? handleEdit : handleCreate}
                            disabled={isSubmitting || !formData.name || formData.startingBalance < 0}
                        >
                            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : (isEditOpen ? t('plans.editDialog.saveBtn', 'Save Changes') : t('plans.addDialog.createBtn', 'Create Plan'))}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Delete Dialog */}
            <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                <DialogContent className="bg-white border-slate-200 text-slate-800 sm:max-w-[400px]">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-black uppercase tracking-tight text-slate-800 pb-2 border-b border-slate-100">
                            {t('plans.actions.deleteTitle', 'Delete Plan')}
                        </DialogTitle>
                        <DialogDescription className="text-slate-500 font-bold text-sm pt-4">
                            {t('plans.actions.deletePromptDetail', 'Are you sure you want to delete {{name}}? This action cannot be undone. Existing accounts using this plan will not be deleted, but they will no longer be linked to it.', { name: selectedPlan?.name })}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="mt-4 gap-3 sm:gap-0">
                        <Button variant="outline" className="text-slate-600 border-slate-200 hover:bg-slate-50 uppercase text-[10px] font-black tracking-widest" onClick={() => setIsDeleteOpen(false)} disabled={isSubmitting}>
                            {t('plans.addDialog.cancelBtn', 'Cancel')}
                        </Button>
                        <Button variant="destructive" className="bg-rose-600 hover:bg-rose-700 uppercase text-[10px] font-black tracking-widest" onClick={handleDelete} disabled={isSubmitting}>
                            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : t('plans.actions.deleteTitle', 'Delete Plan')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default Plans;