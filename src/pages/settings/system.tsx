import React, { useState, useEffect, useCallback } from "react"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "../../components/ui/card"
import { Button } from "../../components/ui/button"
import { Label } from "../../components/ui/label"
import { Switch } from "../../components/ui/switch"
import { Input } from "../../components/ui/input"
import {
    MonitorCog,
    Settings,
    ShieldAlert,
    Wifi,
    Globe,
    Send,
    MessageSquare,
    AlertTriangle,
    CheckCircle2,
    RefreshCw,
    Users,
    User as UserIcon,
    Check,
    ChevronsUpDown
} from "lucide-react"
import { cn } from "../../lib/utils"
import { toast } from "sonner"
import { useTranslation } from "react-i18next"
import { Badge } from "../../components/ui/badge"
import systemApi from "../../context/api/system"
import rolesApi, { Role } from "../../context/api/roles"
import enterpriseApi, { Enterprise as EnterpriseType } from "../../context/api/enterprise"
import usersApi, { UserProfile } from "../../context/api/users"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "../../components/ui/command"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "../../components/ui/popover"

const System: React.FC = () => {
    const { t } = useTranslation();
    const [maintenanceMode, setMaintenanceMode] = useState(false)
    const [broadcastMessage, setBroadcastMessage] = useState("")
    const [broadcastSubject, setBroadcastSubject] = useState("")
    const [systemLanguage, setSystemLanguage] = useState("fr_HT")
    const [allowedRoles, setAllowedRoles] = useState<string[]>([])
    const [sending, setSending] = useState(false)
    const [loading, setLoading] = useState(true)
    const [maintenanceStart, setMaintenanceStart] = useState("")
    const [maintenanceEnd, setMaintenanceEnd] = useState("")
    const [broadcastScheduledAt, setBroadcastScheduledAt] = useState("")
    const [isSavingMaintenance, setIsSavingMaintenance] = useState(false)
    const [allRoles, setAllRoles] = useState<Role[]>([])
    const [allEnterprises, setAllEnterprises] = useState<EnterpriseType[]>([])
    const [allUsers, setAllUsers] = useState<UserProfile[]>([])
    const [targetRoleIds, setTargetRoleIds] = useState<string[]>([])
    const [targetEnterpriseIds, setTargetEnterpriseIds] = useState<string[]>([])
    const [targetUserIds, setTargetUserIds] = useState<string[]>([])
    const [openRole, setOpenRole] = useState(false)
    const [openEnterprise, setOpenEnterprise] = useState(false)
    const [openUser, setOpenUser] = useState(false)

    const fetchOptions = useCallback(async () => {
        try {
            const [roles, enterprises, usersResult] = await Promise.all([
                rolesApi.getAll(),
                enterpriseApi.getAll(),
                usersApi.getAll({ limit: 100 })
            ])
            setAllRoles(Array.isArray(roles) ? roles : roles.data || [])
            setAllEnterprises(Array.isArray(enterprises) ? enterprises : enterprises.data || [])
            setAllUsers(usersResult.data)
        } catch (error) {
            console.error("Failed to fetch broadcast options:", error)
        }
    }, [])

    const fetchSettings = useCallback(async () => {
        try {
            const settings = await systemApi.getSettings()
            if (settings) {
                setMaintenanceMode(settings.maintenance_mode === 'true')
                setBroadcastMessage(settings.broadcast_message || "")
                setBroadcastSubject(settings.broadcast_subject || "AGISA System Notification")
                if (settings.system_language) setSystemLanguage(settings.system_language)
                setMaintenanceStart(settings.maintenance_start || "")
                setMaintenanceEnd(settings.maintenance_end || "")
                // We don't necessarily want to pre-fill the next broadcast time from the last one
                // setBroadcastScheduledAt(settings.broadcast_scheduled_time || "")

                try {
                    const roles = settings.maintenance_allowed_roles ? JSON.parse(settings.maintenance_allowed_roles) : ["SUPER_ADMIN", "ADMIN"]
                    setAllowedRoles(roles)
                } catch (e) {
                    setAllowedRoles(["SUPER_ADMIN", "ADMIN"])
                }
            }
        } catch (error) {
            console.error("Failed to load system settings:", error)
            toast.error(t('settings.system.toast.errorLoading'))
        } finally {
            setLoading(false)
        }
    }, [t])

    useEffect(() => {
        fetchSettings()
        fetchOptions()
    }, [fetchSettings, fetchOptions])

    const handleToggleMaintenance = async (checked: boolean) => {
        const newMode = checked
        try {
            // Optimistic update
            setMaintenanceMode(newMode)
            await systemApi.updateSettings({ maintenance_mode: String(newMode) })

            toast.info(newMode ? t('settings.system.toast.maintenanceEnabled') : t('settings.system.toast.maintenanceDisabled'), {
                description: newMode
                    ? t('settings.system.toast.maintenanceEnabledDesc')
                    : t('settings.system.toast.maintenanceDisabledDesc')
            })
        } catch (error) {
            console.error("Failed to update maintenance mode:", error);
            // Revert on error
            setMaintenanceMode(!newMode)
            toast.error(t('settings.system.toast.maintenanceUpdateFailed'))
        }
    }

    const handleSaveMaintenanceSchedule = async () => {
        setIsSavingMaintenance(true)
        try {
            await systemApi.updateSettings({
                maintenance_start: maintenanceStart,
                maintenance_end: maintenanceEnd
            })
            toast.success(t('settings.system.toast.scheduleUpdated'))
        } catch (error) {
            toast.error(t('settings.system.toast.scheduleUpdateFailed'))
        } finally {
            setIsSavingMaintenance(false)
        }
    }

    const handleSendBroadcast = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!broadcastMessage.trim()) return

        setSending(true)
        try {
            const rolesFilter = targetRoleIds.length === 0 ? undefined : targetRoleIds.map(id => allRoles.find(r => r.id === id)?.name).filter(Boolean) as string[]
            const enterpriseFilter = targetEnterpriseIds.length === 0 ? undefined : targetEnterpriseIds
            const userFilter = targetUserIds.length === 0 ? undefined : targetUserIds

            const response = await systemApi.sendBroadcast(
                broadcastMessage,
                broadcastSubject,
                broadcastScheduledAt,
                rolesFilter,
                enterpriseFilter,
                userFilter
            )
            toast.success(t('settings.system.toast.broadcastStarted'), {
                description: t('settings.system.toast.broadcastStartedDesc', { count: response.totalRecipients || 'selected' })
            })
            setBroadcastMessage("")
            setBroadcastScheduledAt("")
        } catch (error: any) {
            toast.error(t('settings.system.toast.broadcastFailed'), {
                description: error.response?.data?.message || t('settings.system.toast.broadcastFailedDesc')
            })
        } finally {
            setSending(false)
        }
    }

    if (loading) {
        return (
            <div className="flex h-[400px] items-center justify-center">
                <RefreshCw className="h-8 w-8 animate-spin text-emerald-500" />
            </div>
        )
    }

    return (
        <div className="space-y-6 pt-6 mb-10">
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <h2 className="text-2xl font-bold tracking-tight text-black flex items-center gap-2">
                        <MonitorCog className="h-6 w-6 text-emerald-500" />{t('settings.system.title')}
                    </h2>
                    <p className="text-zinc-400 text-sm">{t('settings.system.description')}
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Maintenance Control */}
                <Card className="lg:col-span-12 border-slate-200 bg-slate-50 backdrop-blur-xl relative z-10">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle className="text-black flex items-center gap-2">
                                <ShieldAlert className="h-5 w-5 text-red-500" />{t('settings.system.maintenance.title')}
                            </CardTitle>
                            <CardDescription className="text-zinc-400 mt-1">{t('settings.system.maintenance.description')}
                            </CardDescription>
                        </div>
                        <div className="flex items-center gap-4">
                            <span className={cn("text-xs font-black uppercase tracking-widest", maintenanceMode ? "text-red-500" : "text-emerald-500")}>
                                {maintenanceMode ? t('settings.system.maintenance.active') : t('settings.system.maintenance.inactive')}
                            </span>
                            <Switch
                                checked={maintenanceMode}
                                onCheckedChange={handleToggleMaintenance}
                                className="data-[state=checked]:bg-red-600"
                            />
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-zinc-500 text-[10px] uppercase font-bold">{t('settings.system.maintenance.start')}</Label>
                                <Input
                                    type="datetime-local"
                                    className="bg-slate-50 border-slate-200 text-black h-10 [color-scheme:dark]"
                                    value={maintenanceStart}
                                    onChange={(e) => setMaintenanceStart(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-zinc-500 text-[10px] uppercase font-bold">{t('settings.system.maintenance.end')}</Label>
                                <Input
                                    type="datetime-local"
                                    className="bg-slate-50 border-slate-200 text-black h-10 [color-scheme:dark]"
                                    value={maintenanceEnd}
                                    onChange={(e) => setMaintenanceEnd(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="flex justify-end border-t border-white/5 pt-4">
                            <Button
                                variant="outline"
                                size="sm"
                                className="border-slate-200 hover:bg-slate-50 h-8 text-xs text-black"
                                onClick={handleSaveMaintenanceSchedule}
                                disabled={isSavingMaintenance}
                            >
                                {isSavingMaintenance ? <RefreshCw className="h-3 w-3 mr-2 animate-spin" /> : null}
                                {t('settings.system.maintenance.saveSchedule')}
                            </Button>
                        </div>
                    </CardContent>
                    {maintenanceMode && (
                        <CardContent className="pt-0 pb-6 text-red-400 text-xs font-bold bg-red-500/5 px-6 py-4 flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4" />{t('settings.system.maintenance.warning')}
                        </CardContent>
                    )}
                </Card>

                {/* Broadcast Messaging */}
                <Card className="lg:col-span-7 border-slate-200 bg-slate-50 backdrop-blur-xl">
                    <CardHeader>
                        <CardTitle className="text-black flex items-center gap-2">
                            <Send className="h-5 w-5 text-emerald-500" />{t('settings.system.broadcast.title')}
                        </CardTitle>
                        <CardDescription className="text-zinc-400">{t('settings.system.broadcast.description')}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSendBroadcast} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-zinc-400 text-[10px] uppercase font-black tracking-widest flex items-center gap-1">
                                        <Users className="h-3 w-3" />{t('settings.system.broadcast.targetRole')}
                                    </Label>
                                    <Popover open={openRole} onOpenChange={setOpenRole}>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant="outline"
                                                role="combobox"
                                                aria-expanded={openRole}
                                                className="w-full justify-between bg-slate-50 border-slate-200 text-black h-11 hover:bg-slate-100 hover:text-black"
                                            >
                                                <div className="flex items-center gap-2 overflow-hidden">
                                                    {targetRoleIds.length === 0 ? (
                                                        t('settings.system.broadcast.allRoles')
                                                    ) : targetRoleIds.length === 1 ? (
                                                        (() => {
                                                            const role = allRoles.find((r) => r.id === targetRoleIds[0])
                                                            return role ? `${role.name} ${role.enterprise ? `(${role.enterprise.name})` : "(Global)"}` : t('settings.system.broadcast.oneRoleSelected')
                                                        })()
                                                    ) : (
                                                        <Badge variant="secondary" className="bg-slate-100 text-black hover:bg-slate-100 h-6">
                                                            {targetRoleIds.length} {t('settings.system.broadcast.rolesSelected')}
                                                        </Badge>
                                                    )}
                                                </div>
                                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-[--radix-popover-trigger-width] p-0 bg-zinc-900 border-slate-200 text-black">
                                            <Command className="bg-zinc-900 text-black">
                                                <CommandInput placeholder={t('settings.system.broadcast.searchRole')} className="text-black" />
                                                <CommandList>
                                                    <CommandEmpty>{t('settings.system.broadcast.noRole')}</CommandEmpty>
                                                    <CommandGroup>
                                                        <CommandItem
                                                            value="all"
                                                            onSelect={() => {
                                                                setTargetRoleIds([])
                                                            }}
                                                            className="text-black hover:bg-slate-100"
                                                        >
                                                            <Check
                                                                className={cn(
                                                                    "mr-2 h-4 w-4",
                                                                    targetRoleIds.length === 0 ? "opacity-100" : "opacity-0"
                                                                )}
                                                            />
                                                            {t('settings.system.broadcast.allRoles')}
                                                        </CommandItem>
                                                        {allRoles.map((role) => (
                                                            <CommandItem
                                                                key={role.id}
                                                                value={`${role.name} ${role.enterprise?.name || "Global"}`}
                                                                onSelect={() => {
                                                                    setTargetRoleIds(prev =>
                                                                        prev.includes(role.id)
                                                                            ? prev.filter(id => id !== role.id)
                                                                            : [...prev, role.id]
                                                                    )
                                                                }}
                                                                className="text-black hover:bg-slate-100"
                                                            >
                                                                <div className={cn(
                                                                    "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-slate-200 transition-colors",
                                                                    targetRoleIds.includes(role.id) ? "bg-emerald-500 border-emerald-500" : "bg-transparent"
                                                                )}>
                                                                    {targetRoleIds.includes(role.id) && (
                                                                        <Check className="h-3 w-3 text-black" />
                                                                    )}
                                                                </div>
                                                                {role.name} <span className="ml-1 text-[10px] text-zinc-500">{role.enterprise ? `(${role.enterprise.name})` : "(Global)"}</span>
                                                            </CommandItem>
                                                        ))}
                                                    </CommandGroup>
                                                </CommandList>
                                            </Command>
                                        </PopoverContent>
                                    </Popover>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-zinc-400 text-[10px] uppercase font-black tracking-widest flex items-center gap-1">
                                        <Globe className="h-3 w-3" />{t('settings.system.broadcast.targetEnterprise')}
                                    </Label>
                                    <Popover open={openEnterprise} onOpenChange={setOpenEnterprise}>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant="outline"
                                                role="combobox"
                                                aria-expanded={openEnterprise}
                                                className="w-full justify-between bg-slate-50 border-slate-200 text-black h-11 hover:bg-slate-100 hover:text-black"
                                            >
                                                <div className="flex items-center gap-2 overflow-hidden">
                                                    {targetEnterpriseIds.length === 0 ? (
                                                        t('settings.system.broadcast.allEnterprises')
                                                    ) : targetEnterpriseIds.length === 1 ? (
                                                        allEnterprises.find((ent) => ent.id === targetEnterpriseIds[0])?.name || t('settings.system.broadcast.oneEnterpriseSelected')
                                                    ) : (
                                                        <Badge variant="secondary" className="bg-slate-100 text-black hover:bg-slate-100 h-6">
                                                            {targetEnterpriseIds.length} {t('settings.system.broadcast.enterprisesSelected')}
                                                        </Badge>
                                                    )}
                                                </div>
                                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-[--radix-popover-trigger-width] p-0 bg-zinc-900 border-slate-200 text-black">
                                            <Command className="bg-zinc-900 text-black">
                                                <CommandInput placeholder={t('settings.system.broadcast.searchEnterprise')} className="text-black" />
                                                <CommandList>
                                                    <CommandEmpty>{t('settings.system.broadcast.noEnterprise')}</CommandEmpty>
                                                    <CommandGroup>
                                                        <CommandItem
                                                            value="all"
                                                            onSelect={() => {
                                                                setTargetEnterpriseIds([])
                                                            }}
                                                            className="text-black hover:bg-slate-100"
                                                        >
                                                            <Check
                                                                className={cn(
                                                                    "mr-2 h-4 w-4",
                                                                    targetEnterpriseIds.length === 0 ? "opacity-100" : "opacity-0"
                                                                )}
                                                            />
                                                            {t('settings.system.broadcast.allEnterprises')}
                                                        </CommandItem>
                                                        {allEnterprises.map((ent) => (
                                                            <CommandItem
                                                                key={ent.id}
                                                                value={ent.name}
                                                                onSelect={() => {
                                                                    setTargetEnterpriseIds(prev =>
                                                                        prev.includes(ent.id)
                                                                            ? prev.filter(id => id !== ent.id)
                                                                            : [...prev, ent.id]
                                                                    )
                                                                }}
                                                                className="text-black hover:bg-slate-100"
                                                            >
                                                                <div className={cn(
                                                                    "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-slate-200 transition-colors",
                                                                    targetEnterpriseIds.includes(ent.id) ? "bg-emerald-500 border-emerald-500" : "bg-transparent"
                                                                )}>
                                                                    {targetEnterpriseIds.includes(ent.id) && (
                                                                        <Check className="h-3 w-3 text-black" />
                                                                    )}
                                                                </div>
                                                                {ent.name}
                                                            </CommandItem>
                                                        ))}
                                                    </CommandGroup>
                                                </CommandList>
                                            </Command>
                                        </PopoverContent>
                                    </Popover>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-zinc-400 text-[10px] uppercase font-black tracking-widest flex items-center gap-1">
                                    <UserIcon className="h-3 w-3" />{t('settings.system.broadcast.targetUser')}
                                </Label>
                                <Popover open={openUser} onOpenChange={setOpenUser}>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            role="combobox"
                                            aria-expanded={openUser}
                                            className="w-full justify-between bg-slate-50 border-slate-200 text-black h-11 hover:bg-slate-100 hover:text-black"
                                        >
                                            <div className="flex items-center gap-2 overflow-hidden">
                                                {targetUserIds.length === 0 ? (
                                                    t('settings.system.broadcast.allUsers')
                                                ) : targetUserIds.length === 1 ? (
                                                    allUsers.find(u => u.id === targetUserIds[0])?.fullName || t('settings.system.broadcast.oneUserSelected')
                                                ) : (
                                                    <Badge variant="secondary" className="bg-slate-100 text-black hover:bg-slate-100 h-6">
                                                        {targetUserIds.length} {t('settings.system.broadcast.usersSelected')}
                                                    </Badge>
                                                )}
                                            </div>
                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0 bg-zinc-900 border-slate-200 text-black">
                                        <Command className="bg-zinc-900 text-black">
                                            <CommandInput placeholder={t('settings.system.broadcast.searchUser')} className="text-black" />
                                            <CommandList>
                                                <CommandEmpty>{t('settings.system.broadcast.noUser')}</CommandEmpty>
                                                <CommandGroup>
                                                    <CommandItem
                                                        value="all"
                                                        onSelect={() => {
                                                            setTargetUserIds([])
                                                            // setOpenUser(false) // Keep popover open for multi-select
                                                        }}
                                                        className="text-black hover:bg-slate-100"
                                                    >
                                                        <Check
                                                            className={cn(
                                                                "mr-2 h-4 w-4",
                                                                targetUserIds.length === 0 ? "opacity-100" : "opacity-0"
                                                            )}
                                                        />{t('settings.system.broadcast.allUsers')}
                                                    </CommandItem>
                                                    {allUsers.map((user) => (
                                                        <CommandItem
                                                            key={user.id}
                                                            value={user.fullName}
                                                            onSelect={() => {
                                                                setTargetUserIds(prev =>
                                                                    prev.includes(user.id)
                                                                        ? prev.filter(id => id !== user.id)
                                                                        : [...prev, user.id]
                                                                )
                                                                // setOpenUser(false) // Keep popover open for multi-select
                                                            }}
                                                            className="text-black hover:bg-slate-100"
                                                        >
                                                            <div className={cn(
                                                                "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-slate-200 transition-colors",
                                                                targetUserIds.includes(user.id) ? "bg-emerald-500 border-emerald-500" : "bg-transparent"
                                                            )}>
                                                                {targetUserIds.includes(user.id) && (
                                                                    <Check className="h-3 w-3 text-black" />
                                                                )}
                                                            </div>
                                                            <div className="flex flex-col">
                                                                <span className="text-sm">{user.fullName}</span>
                                                                <span className="text-[10px] text-zinc-500">{user.email}</span>
                                                            </div>
                                                        </CommandItem>
                                                    ))}
                                                </CommandGroup>
                                            </CommandList>
                                        </Command>
                                    </PopoverContent>
                                </Popover>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="subject" className="text-zinc-400 text-[10px] uppercase font-black tracking-widest">{t('settings.system.broadcast.subject')}</Label>
                                <Input
                                    id="subject"
                                    placeholder={t('settings.system.broadcast.subjectPlaceholder')}
                                    className="bg-slate-50 border-slate-200 text-black h-11"
                                    value={broadcastSubject}
                                    onChange={(e) => setBroadcastSubject(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="message" className="text-zinc-400 text-[10px] uppercase font-black tracking-widest">{t('settings.system.broadcast.content')}</Label>
                                <textarea
                                    id="message"
                                    placeholder={t('settings.system.broadcast.contentPlaceholder')}
                                    className="w-full min-h-[120px] bg-slate-50 border border-slate-200 rounded-md p-3 text-black focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all resize-none text-sm placeholder:text-zinc-600"
                                    value={broadcastMessage}
                                    onChange={(e) => setBroadcastMessage(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="schedule" className="text-zinc-400 text-[10px] uppercase font-black tracking-widest">{t('settings.system.broadcast.schedule')}</Label>
                                <Input
                                    id="schedule"
                                    type="datetime-local"
                                    className="bg-slate-50 border-slate-200 text-black h-11"
                                    value={broadcastScheduledAt}
                                    onChange={(e) => setBroadcastScheduledAt(e.target.value)}
                                />
                                <p className="text-[10px] text-zinc-500 italic">{t('settings.system.broadcast.scheduleNote')}</p>
                            </div>
                            <div className="flex items-center justify-between pt-2">
                                <div className="text-[10px] text-zinc-500 font-medium whitespace-nowrap overflow-hidden text-ellipsis max-w-[200px]" title={
                                    targetRoleIds.length === 0 && targetEnterpriseIds.length === 0 && targetUserIds.length === 0 ? t('settings.system.broadcast.allUsers') : [
                                        targetRoleIds.length > 0 && `${t('settings.system.broadcast.rolesLabel')}: ${targetRoleIds.map(id => allRoles.find(r => r.id === id)?.name).join(", ")}`,
                                        targetEnterpriseIds.length > 0 && `${t('settings.system.broadcast.enterprisesLabel')}: ${targetEnterpriseIds.map(id => allEnterprises.find(e => e.id === id)?.name).join(", ")}`,
                                        targetUserIds.length > 0 && `${t('settings.system.broadcast.usersLabel')}: ${targetUserIds.length}`
                                    ].filter(Boolean).join(" | ")
                                }>
                                    {t('settings.system.broadcast.target')} <span className="text-emerald-500">
                                        {targetRoleIds.length === 0 && targetEnterpriseIds.length === 0 && targetUserIds.length === 0 ? (
                                            t('settings.system.broadcast.allUsers')
                                        ) : (
                                            [
                                                targetRoleIds.length > 0 && `${targetRoleIds.length} ${t('settings.system.broadcast.rolePlural')}`,
                                                targetEnterpriseIds.length > 0 && `${targetEnterpriseIds.length} ${t('settings.system.broadcast.enterprisePlural')}`,
                                                targetUserIds.length > 0 && `${targetUserIds.length} ${t('settings.system.broadcast.userPlural')}`
                                            ].filter(Boolean).join(" + ")
                                        )}
                                    </span>
                                </div>
                                <div className="text-[10px] text-zinc-500 font-medium">
                                    {t('settings.system.broadcast.length')} <span className={cn(broadcastMessage.length > 2000 ? "text-red-500" : "text-zinc-400")}>
                                        {broadcastMessage.length} {t('settings.system.broadcast.chars')}
                                    </span>
                                </div>
                                <Button
                                    className="bg-emerald-600 hover:bg-emerald-700 text-black min-w-[120px]"
                                    disabled={sending || !broadcastMessage.trim()}
                                >
                                    {sending ? (
                                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                    ) : (
                                        <MessageSquare className="h-4 w-4 mr-2" />
                                    )}
                                    {sending ? t('settings.system.broadcast.sending') : t('settings.system.broadcast.sendNow')}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>

                {/* General Config */}
                <Card className="lg:col-span-5 border-slate-200 bg-slate-50 backdrop-blur-xl">
                    <CardHeader>
                        <CardTitle className="text-black flex items-center gap-2">
                            <Settings className="h-5 w-5 text-indigo-500" />{t('settings.system.config.title')}
                        </CardTitle>
                        <CardDescription className="text-zinc-400 font-bold uppercase text-[10px]">{t('settings.system.config.description')}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label className="text-black text-sm">{t('settings.system.config.language')}</Label>
                                    <p className="text-[10px] text-zinc-500">{t('settings.system.config.languageNote')}</p>
                                </div>
                                <Badge variant="outline" className="border-slate-200 text-zinc-400 cursor-pointer hover:bg-slate-50">{systemLanguage}</Badge>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label className="text-black text-sm">{t('settings.system.config.timezone')}</Label>
                                    <p className="text-[10px] text-zinc-500">{t('settings.system.config.timezoneLabel')}</p>
                                </div>
                                <Badge variant="outline" className="border-slate-200 text-zinc-400 cursor-pointer hover:bg-slate-50">{t('settings.system.config.autoDetect')}</Badge>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label className="text-black text-sm">{t('settings.system.config.session')}</Label>
                                    <p className="text-[10px] text-zinc-500">{t('settings.system.config.sessionNote')}</p>
                                </div>
                                <Badge variant="outline" className="border-slate-200 text-zinc-400 cursor-pointer hover:bg-slate-50">{t('settings.system.config.minutes', { count: 120 })}</Badge>
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label className="text-black text-sm">{t('settings.system.config.bypassRoles')}</Label>
                                    <p className="text-[10px] text-zinc-500">{t('settings.system.config.bypassRolesNote')}</p>
                                </div>
                                <div className="flex gap-1 flex-wrap justify-end max-w-[50%]">
                                    {allowedRoles.map(role => (
                                        <Badge key={role} variant="secondary" className="bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-[10px]">{role}</Badge>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="pt-4 border-t border-white/5 space-y-4">
                            <div className="flex items-center gap-3">
                                <Globe className="h-5 w-5 text-emerald-500" />
                                <div className="flex-1">
                                    <div className="text-xs font-bold text-black flex justify-between">
                                        <span>{t('settings.system.config.redundancy')}</span>
                                        <span className="text-emerald-500">99.9%</span>
                                    </div>
                                    <div className="h-1 w-full bg-slate-50 rounded-full mt-1">
                                        <div className="h-full bg-emerald-500 w-[99.9%]" />
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <Wifi className="h-5 w-5 text-emerald-500" />
                                <div className="flex-1">
                                    <div className="text-xs font-bold text-black flex justify-between">
                                        <span>{t('settings.system.config.api')}</span>
                                        <span className="text-emerald-500">{t('settings.system.config.online')}</span>
                                    </div>
                                    <div className="h-1 w-full bg-slate-50 rounded-full mt-1">
                                        <div className="h-full bg-emerald-500 w-full" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* System Logs / Meta */}
                <Card className="lg:col-span-12 border-slate-200 bg-slate-50 backdrop-blur-xl">
                    <CardContent className="py-4">
                        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                            <div className="flex items-center gap-4 text-xs font-bold text-zinc-500 uppercase tracking-tight">
                                <div className="flex items-center gap-2">
                                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />{t('settings.system.meta.engine')}
                                </div>
                                <div className="flex items-center gap-2">
                                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />{t('settings.system.meta.state')}
                                </div>
                                <div className="flex items-center gap-2">
                                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />{t('settings.system.meta.build')}
                                </div>
                            </div>
                            <Button variant="ghost" className="text-emerald-500 hover:bg-emerald-500/10 font-bold uppercase text-[10px] tracking-widest">{t('settings.system.meta.viewManifest')}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

export default System