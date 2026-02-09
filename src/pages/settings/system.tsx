import React, { useState, useEffect } from "react"
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

    useEffect(() => {
        fetchSettings()
        fetchOptions()
    }, [])

    const fetchOptions = async () => {
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
    }

    const fetchSettings = async () => {
        try {
            const settings = await systemApi.getSettings()
            if (settings) {
                setMaintenanceMode(settings.maintenance_mode === 'true')
                setBroadcastMessage(settings.broadcast_message || "")
                setBroadcastSubject(settings.broadcast_subject || "Notification Système AGISA")
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
            toast.error("Error loading system configuration")
        } finally {
            setLoading(false)
        }
    }

    const handleToggleMaintenance = async (checked: boolean) => {
        const newMode = checked
        try {
            // Optimistic update
            setMaintenanceMode(newMode)
            await systemApi.updateSettings({ maintenance_mode: String(newMode) })

            toast.info(newMode ? "Maintenance Mode Enabled" : "Maintenance Mode Disabled", {
                description: newMode
                    ? "Standard users will see a maintenance page until this is disabled."
                    : "The system is now accessible to all users."
            })
        } catch (error) {
            console.error("Failed to update maintenance mode:", error);
            // Revert on error
            setMaintenanceMode(!newMode)
            toast.error("Failed to update maintenance mode")
        }
    }

    const handleSaveMaintenanceSchedule = async () => {
        setIsSavingMaintenance(true)
        try {
            await systemApi.updateSettings({
                maintenance_start: maintenanceStart,
                maintenance_end: maintenanceEnd
            })
            toast.success("Maintenance schedule updated")
        } catch (error) {
            toast.error("Failed to update maintenance schedule")
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
            toast.success("Broadcast started", {
                description: `Processing announcement for ${response.totalRecipients || 'selected'} users in the background.`
            })
            setBroadcastMessage("")
            setBroadcastScheduledAt("")
        } catch (error: any) {
            toast.error("Failed to send broadcast", {
                description: error.response?.data?.message || "An error occurred during the blast process."
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
                    <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                        <MonitorCog className="h-6 w-6 text-emerald-500" />
                        System Administration
                    </h2>
                    <p className="text-zinc-400 text-sm">
                        Global system configuration, maintenance control, and communication tools.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Maintenance Control */}
                <Card className="lg:col-span-12 border-white/10 bg-black/40 backdrop-blur-xl relative z-10">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle className="text-white flex items-center gap-2">
                                <ShieldAlert className="h-5 w-5 text-red-500" />
                                Maintenance Mode
                            </CardTitle>
                            <CardDescription className="text-zinc-400 mt-1">
                                Restrict system access for scheduled updates or critical repairs.
                            </CardDescription>
                        </div>
                        <div className="flex items-center gap-4">
                            <span className={cn("text-xs font-black uppercase tracking-widest", maintenanceMode ? "text-red-500" : "text-emerald-500")}>
                                {maintenanceMode ? "Active" : "Inactive"}
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
                                <Label className="text-zinc-500 text-[10px] uppercase font-bold">Maintenance Start</Label>
                                <Input
                                    type="datetime-local"
                                    className="bg-white/5 border-white/10 text-white h-10 [color-scheme:dark]"
                                    value={maintenanceStart}
                                    onChange={(e) => setMaintenanceStart(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-zinc-500 text-[10px] uppercase font-bold">Expected End</Label>
                                <Input
                                    type="datetime-local"
                                    className="bg-white/5 border-white/10 text-white h-10 [color-scheme:dark]"
                                    value={maintenanceEnd}
                                    onChange={(e) => setMaintenanceEnd(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="flex justify-end border-t border-white/5 pt-4">
                            <Button
                                variant="outline"
                                size="sm"
                                className="border-white/10 hover:bg-white/5 h-8 text-xs text-white"
                                onClick={handleSaveMaintenanceSchedule}
                                disabled={isSavingMaintenance}
                            >
                                {isSavingMaintenance ? <RefreshCw className="h-3 w-3 mr-2 animate-spin" /> : null}
                                Save Schedule
                            </Button>
                        </div>
                    </CardContent>
                    {maintenanceMode && (
                        <CardContent className="pt-0 pb-6 text-red-400 text-xs font-bold bg-red-500/5 px-6 py-4 flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4" />
                            WARNING: Enabling maintenance mode will force immediate logout for all non-admin users.
                        </CardContent>
                    )}
                </Card>

                {/* Broadcast Messaging */}
                <Card className="lg:col-span-7 border-white/10 bg-black/40 backdrop-blur-xl">
                    <CardHeader>
                        <CardTitle className="text-white flex items-center gap-2">
                            <Send className="h-5 w-5 text-emerald-500" />
                            Broadcast Message
                        </CardTitle>
                        <CardDescription className="text-zinc-400">
                            Send immediate push notifications to all authenticated users.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSendBroadcast} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-zinc-400 text-[10px] uppercase font-black tracking-widest flex items-center gap-1">
                                        <Users className="h-3 w-3" /> Target Role
                                    </Label>
                                    <Popover open={openRole} onOpenChange={setOpenRole}>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant="outline"
                                                role="combobox"
                                                aria-expanded={openRole}
                                                className="w-full justify-between bg-white/5 border-white/10 text-white h-11 hover:bg-white/10 hover:text-white"
                                            >
                                                <div className="flex items-center gap-2 overflow-hidden">
                                                    {targetRoleIds.length === 0 ? (
                                                        "All Roles"
                                                    ) : targetRoleIds.length === 1 ? (
                                                        (() => {
                                                            const role = allRoles.find((r) => r.id === targetRoleIds[0])
                                                            return role ? `${role.name} ${role.enterprise ? `(${role.enterprise.name})` : "(Global)"}` : "1 role selected"
                                                        })()
                                                    ) : (
                                                        <Badge variant="secondary" className="bg-white/10 text-white hover:bg-white/10 h-6">
                                                            {targetRoleIds.length} roles selected
                                                        </Badge>
                                                    )}
                                                </div>
                                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-[--radix-popover-trigger-width] p-0 bg-zinc-900 border-white/10 text-white">
                                            <Command className="bg-zinc-900 text-white">
                                                <CommandInput placeholder="Search role..." className="text-white" />
                                                <CommandList>
                                                    <CommandEmpty>No role found.</CommandEmpty>
                                                    <CommandGroup>
                                                        <CommandItem
                                                            value="all"
                                                            onSelect={() => {
                                                                setTargetRoleIds([])
                                                            }}
                                                            className="text-white hover:bg-white/10"
                                                        >
                                                            <Check
                                                                className={cn(
                                                                    "mr-2 h-4 w-4",
                                                                    targetRoleIds.length === 0 ? "opacity-100" : "opacity-0"
                                                                )}
                                                            />
                                                            All Roles
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
                                                                className="text-white hover:bg-white/10"
                                                            >
                                                                <div className={cn(
                                                                    "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-white/10 transition-colors",
                                                                    targetRoleIds.includes(role.id) ? "bg-emerald-500 border-emerald-500" : "bg-transparent"
                                                                )}>
                                                                    {targetRoleIds.includes(role.id) && (
                                                                        <Check className="h-3 w-3 text-white" />
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
                                        <Globe className="h-3 w-3" /> Target Enterprise
                                    </Label>
                                    <Popover open={openEnterprise} onOpenChange={setOpenEnterprise}>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant="outline"
                                                role="combobox"
                                                aria-expanded={openEnterprise}
                                                className="w-full justify-between bg-white/5 border-white/10 text-white h-11 hover:bg-white/10 hover:text-white"
                                            >
                                                <div className="flex items-center gap-2 overflow-hidden">
                                                    {targetEnterpriseIds.length === 0 ? (
                                                        "All Enterprises"
                                                    ) : targetEnterpriseIds.length === 1 ? (
                                                        allEnterprises.find((ent) => ent.id === targetEnterpriseIds[0])?.name || "1 enterprise selected"
                                                    ) : (
                                                        <Badge variant="secondary" className="bg-white/10 text-white hover:bg-white/10 h-6">
                                                            {targetEnterpriseIds.length} enterprises selected
                                                        </Badge>
                                                    )}
                                                </div>
                                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-[--radix-popover-trigger-width] p-0 bg-zinc-900 border-white/10 text-white">
                                            <Command className="bg-zinc-900 text-white">
                                                <CommandInput placeholder="Search enterprise..." className="text-white" />
                                                <CommandList>
                                                    <CommandEmpty>No enterprise found.</CommandEmpty>
                                                    <CommandGroup>
                                                        <CommandItem
                                                            value="all"
                                                            onSelect={() => {
                                                                setTargetEnterpriseIds([])
                                                            }}
                                                            className="text-white hover:bg-white/10"
                                                        >
                                                            <Check
                                                                className={cn(
                                                                    "mr-2 h-4 w-4",
                                                                    targetEnterpriseIds.length === 0 ? "opacity-100" : "opacity-0"
                                                                )}
                                                            />
                                                            All Enterprises
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
                                                                className="text-white hover:bg-white/10"
                                                            >
                                                                <div className={cn(
                                                                    "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-white/10 transition-colors",
                                                                    targetEnterpriseIds.includes(ent.id) ? "bg-emerald-500 border-emerald-500" : "bg-transparent"
                                                                )}>
                                                                    {targetEnterpriseIds.includes(ent.id) && (
                                                                        <Check className="h-3 w-3 text-white" />
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
                                    <UserIcon className="h-3 w-3" /> Target Specific User (Optional)
                                </Label>
                                <Popover open={openUser} onOpenChange={setOpenUser}>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            role="combobox"
                                            aria-expanded={openUser}
                                            className="w-full justify-between bg-white/5 border-white/10 text-white h-11 hover:bg-white/10 hover:text-white"
                                        >
                                            <div className="flex items-center gap-2 overflow-hidden">
                                                {targetUserIds.length === 0 ? (
                                                    "All Active Users"
                                                ) : targetUserIds.length === 1 ? (
                                                    allUsers.find(u => u.id === targetUserIds[0])?.fullName || "1 user selected"
                                                ) : (
                                                    <Badge variant="secondary" className="bg-white/10 text-white hover:bg-white/10 h-6">
                                                        {targetUserIds.length} users selected
                                                    </Badge>
                                                )}
                                            </div>
                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0 bg-zinc-900 border-white/10 text-white">
                                        <Command className="bg-zinc-900 text-white">
                                            <CommandInput placeholder="Search user..." className="text-white" />
                                            <CommandList>
                                                <CommandEmpty>No user found.</CommandEmpty>
                                                <CommandGroup>
                                                    <CommandItem
                                                        value="all"
                                                        onSelect={() => {
                                                            setTargetUserIds([])
                                                            // setOpenUser(false) // Keep popover open for multi-select
                                                        }}
                                                        className="text-white hover:bg-white/10"
                                                    >
                                                        <Check
                                                            className={cn(
                                                                "mr-2 h-4 w-4",
                                                                targetUserIds.length === 0 ? "opacity-100" : "opacity-0"
                                                            )}
                                                        />
                                                        All Active Users
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
                                                            className="text-white hover:bg-white/10"
                                                        >
                                                            <div className={cn(
                                                                "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-white/10 transition-colors",
                                                                targetUserIds.includes(user.id) ? "bg-emerald-500 border-emerald-500" : "bg-transparent"
                                                            )}>
                                                                {targetUserIds.includes(user.id) && (
                                                                    <Check className="h-3 w-3 text-white" />
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
                                <Label htmlFor="subject" className="text-zinc-400 text-[10px] uppercase font-black tracking-widest">Email Subject</Label>
                                <Input
                                    id="subject"
                                    placeholder="e.g. System Update - Maintenance Scheduled"
                                    className="bg-white/5 border-white/10 text-white h-11"
                                    value={broadcastSubject}
                                    onChange={(e) => setBroadcastSubject(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="message" className="text-zinc-400 text-[10px] uppercase font-black tracking-widest">Notification Content</Label>
                                <textarea
                                    id="message"
                                    placeholder="Type your system announcement here..."
                                    className="w-full min-h-[120px] bg-white/5 border border-white/10 rounded-md p-3 text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all resize-none text-sm placeholder:text-zinc-600"
                                    value={broadcastMessage}
                                    onChange={(e) => setBroadcastMessage(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="schedule" className="text-zinc-400 text-[10px] uppercase font-black tracking-widest">Scheduled Event Time (Optional)</Label>
                                <Input
                                    id="schedule"
                                    type="datetime-local"
                                    className="bg-white/5 border-white/10 text-white h-11"
                                    value={broadcastScheduledAt}
                                    onChange={(e) => setBroadcastScheduledAt(e.target.value)}
                                />
                                <p className="text-[10px] text-zinc-500 italic">This will be mentioned in the email to inform users about the start time.</p>
                            </div>
                            <div className="flex items-center justify-between pt-2">
                                <div className="text-[10px] text-zinc-500 font-medium whitespace-nowrap overflow-hidden text-ellipsis max-w-[200px]" title={
                                    targetRoleIds.length === 0 && targetEnterpriseIds.length === 0 && targetUserIds.length === 0 ? "All Active Users" : [
                                        targetRoleIds.length > 0 && `Roles: ${targetRoleIds.map(id => allRoles.find(r => r.id === id)?.name).join(", ")}`,
                                        targetEnterpriseIds.length > 0 && `Enterprises: ${targetEnterpriseIds.map(id => allEnterprises.find(e => e.id === id)?.name).join(", ")}`,
                                        targetUserIds.length > 0 && `Users: ${targetUserIds.length}`
                                    ].filter(Boolean).join(" | ")
                                }>
                                    Target: <span className="text-emerald-500">
                                        {targetRoleIds.length === 0 && targetEnterpriseIds.length === 0 && targetUserIds.length === 0 ? (
                                            "All Active Users"
                                        ) : (
                                            [
                                                targetRoleIds.length > 0 && `${targetRoleIds.length} Role(s)`,
                                                targetEnterpriseIds.length > 0 && `${targetEnterpriseIds.length} Enterprise(s)`,
                                                targetUserIds.length > 0 && `${targetUserIds.length} User(s)`
                                            ].filter(Boolean).join(" + ")
                                        )}
                                    </span>
                                </div>
                                <div className="text-[10px] text-zinc-500 font-medium">
                                    Length: <span className={cn(broadcastMessage.length > 2000 ? "text-red-500" : "text-zinc-400")}>
                                        {broadcastMessage.length} characters
                                    </span>
                                </div>
                                <Button
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white min-w-[120px]"
                                    disabled={sending || !broadcastMessage.trim()}
                                >
                                    {sending ? (
                                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                    ) : (
                                        <MessageSquare className="h-4 w-4 mr-2" />
                                    )}
                                    {sending ? "Sending..." : "Send Now"}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>

                {/* General Config */}
                <Card className="lg:col-span-5 border-white/10 bg-black/40 backdrop-blur-xl">
                    <CardHeader>
                        <CardTitle className="text-white flex items-center gap-2">
                            <Settings className="h-5 w-5 text-indigo-500" />
                            General Config
                        </CardTitle>
                        <CardDescription className="text-zinc-400 font-bold uppercase text-[10px]">
                            Regional & Core Parameters
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label className="text-white text-sm">System Language</Label>
                                    <p className="text-[10px] text-zinc-500">Default for new accounts</p>
                                </div>
                                <Badge variant="outline" className="border-white/10 text-zinc-400 cursor-pointer hover:bg-white/5">{systemLanguage}</Badge>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label className="text-white text-sm">Timezone Override</Label>
                                    <p className="text-[10px] text-zinc-500">GMT-05:00 Eastern Time</p>
                                </div>
                                <Badge variant="outline" className="border-white/10 text-zinc-400 cursor-pointer hover:bg-white/5">Auto (Detect)</Badge>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label className="text-white text-sm">Session Timeout</Label>
                                    <p className="text-[10px] text-zinc-500">Auto-logout after inactivity</p>
                                </div>
                                <Badge variant="outline" className="border-white/10 text-zinc-400 cursor-pointer hover:bg-white/5">120 Minutes</Badge>
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label className="text-white text-sm">Maintenance Bypass Roles</Label>
                                    <p className="text-[10px] text-zinc-500">Roles allowed during maintenance</p>
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
                                    <div className="text-xs font-bold text-white flex justify-between">
                                        <span>Regional Redundancy</span>
                                        <span className="text-emerald-500">99.9%</span>
                                    </div>
                                    <div className="h-1 w-full bg-white/5 rounded-full mt-1">
                                        <div className="h-full bg-emerald-500 w-[99.9%]" />
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <Wifi className="h-5 w-5 text-emerald-500" />
                                <div className="flex-1">
                                    <div className="text-xs font-bold text-white flex justify-between">
                                        <span>API Availability</span>
                                        <span className="text-emerald-500">Online</span>
                                    </div>
                                    <div className="h-1 w-full bg-white/5 rounded-full mt-1">
                                        <div className="h-full bg-emerald-500 w-full" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* System Logs / Meta */}
                <Card className="lg:col-span-12 border-white/10 bg-black/40 backdrop-blur-xl">
                    <CardContent className="py-4">
                        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                            <div className="flex items-center gap-4 text-xs font-bold text-zinc-500 uppercase tracking-tight">
                                <div className="flex items-center gap-2">
                                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                    Engine: React 19.x
                                </div>
                                <div className="flex items-center gap-2">
                                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                    State: Redux Toolkit
                                </div>
                                <div className="flex items-center gap-2">
                                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                    Build: v2.4.0-prod
                                </div>
                            </div>
                            <Button variant="ghost" className="text-emerald-500 hover:bg-emerald-500/10 font-bold uppercase text-[10px] tracking-widest">
                                View full system manifest
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

export default System