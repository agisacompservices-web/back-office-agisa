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
    RefreshCw
} from "lucide-react"
import { cn } from "../../lib/utils"
import { toast } from "sonner"
import { Badge } from "../../components/ui/badge"
import systemApi from "../../context/api/system"

const System: React.FC = () => {
    const [maintenanceMode, setMaintenanceMode] = useState(false)
    const [broadcastMessage, setBroadcastMessage] = useState("")
    const [systemLanguage, setSystemLanguage] = useState("fr_HT")
    const [allowedRoles, setAllowedRoles] = useState<string[]>([])
    const [sending, setSending] = useState(false)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchSettings()
    }, [])

    const fetchSettings = async () => {
        try {
            const settings = await systemApi.getSettings()
            if (settings) {
                setMaintenanceMode(settings.maintenance_mode === 'true')
                setBroadcastMessage(settings.broadcast_message || "")
                if (settings.system_language) setSystemLanguage(settings.system_language)

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

    const handleSendBroadcast = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!broadcastMessage.trim()) return

        setSending(true)
        try {
            await systemApi.updateSettings({ broadcast_message: broadcastMessage })
            toast.success("Broadcast Sent", {
                description: `Message sent to all active sessions.`
            })
            // setBroadcastMessage("") // Optionally clear or keep it
        } catch (error) {
            toast.error("Failed to send broadcast")
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
                            <div className="space-y-2">
                                <Label htmlFor="message" className="text-zinc-400 text-xs uppercase font-black tracking-widest">Notification Content</Label>
                                <textarea
                                    id="message"
                                    placeholder="Type your system announcement here..."
                                    className="w-full min-h-[120px] bg-white/5 border border-white/10 rounded-md p-3 text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all resize-none text-sm placeholder:text-zinc-600"
                                    value={broadcastMessage}
                                    onChange={(e) => setBroadcastMessage(e.target.value)}
                                />
                            </div>
                            <div className="flex items-center justify-between pt-2">
                                <div className="text-[10px] text-zinc-500 font-medium">
                                    Target: <span className="text-emerald-500">All Connected Clients ({broadcastMessage.length}/256)</span>
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