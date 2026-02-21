import React, { useEffect, useState, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "../../components/ui/card"
import { Overview } from "../../components/dashboard/Overview"
import { ShieldHalf, Users, Loader2, Database, Globe, Clock } from "lucide-react"
import { RecentRequests } from "../../components/dashboard/RecentRequest"
import requestApi, { Request, RequestStatus } from "../../context/api/request"
import usersApi from "../../context/api/users"
import enterpriseApi from "../../context/api/enterprise"
import systemApi from "../../context/api/system"

const Dashboard: React.FC = () => {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(true);
    const [stats, setStats] = useState({
        pendingApprovals: 0,
        userCount: 0,
        enterpriseCount: 0,
        litigationCount: 0
    });
    const [recentRequests, setRecentRequests] = useState<Request[]>([]);
    const [monitoring, setMonitoring] = useState<any>(null);
    const [overviewData, setOverviewData] = useState<{ name: string; total: number }[]>([]);

    const fetchData = useCallback(async () => {
        try {
            // Fetch everything independently to avoid one failure blocking all
            const [requestRes, usersRes, enterprisesRes, monitorRes] = await Promise.allSettled([
                requestApi.getAll({ limit: 100 }), // Reduced limit for better performance and safety
                usersApi.getAll({ limit: 1 }),
                enterpriseApi.getAll({ limit: 1 }),
                systemApi.getMonitoring()
            ]);

            // Extract values with safe fallbacks
            // Check if requestRes.value has a data property (paginated) or is the array itself (legacy/fallback)
            const requests = requestRes.status === 'fulfilled'
                ? (Array.isArray(requestRes.value) ? requestRes.value : (requestRes.value as any).data || [])
                : [];

            const users = usersRes.status === 'fulfilled' ? usersRes.value : { data: [], total: 0, meta: { total: 0 } };
            const enterprises = enterprisesRes.status === 'fulfilled' ? enterprisesRes.value : { data: [], meta: { total: 0 } };
            const monitor = monitorRes.status === 'fulfilled' ? monitorRes.value : null;

            const pending = requests.filter((r: Request) => r.status === RequestStatus.PENDING).length;
            const litigations = requests.filter((r: Request) => r.status === RequestStatus.IN_LITIGATION).length;

            setStats({
                pendingApprovals: pending,
                userCount: users.meta?.total || users.total || 0,
                enterpriseCount: enterprises.meta?.total || enterprises.data?.length || 0,
                litigationCount: litigations
            });

            setRecentRequests(requests.slice(0, 5).map((r: any) => ({
                ...r,
                // Ensure requester is mapped if missing but user exists, or vice versa
                requester: r.requester || r.user
            })));

            setMonitoring(monitor);

            // Group transactions by month for Overview
            const months = Array.from({ length: 12 }, (_, i) => {
                return new Intl.DateTimeFormat(i18n.language, { month: 'short' }).format(new Date(2024, i, 1));
            });
            const monthlyData = months.map(month => ({ name: month, total: 0 }));

            requests.forEach((req: Request) => {
                const date = new Date(req.createdAt);
                monthlyData[date.getMonth()].total += 1;
            });

            setOverviewData(monthlyData);

        } catch (error) {
            console.error("Failed to fetch dashboard data:", error);
        } finally {
            setIsLoading(false);
        }
    }, [i18n.language]);

    useEffect(() => {
        const userStr = localStorage.getItem("agisa_user");
        if (userStr) {
            const user = JSON.parse(userStr);
            const roleLevel = user.role?.level?.toUpperCase();

            // Role-based redirection for global dashboard
            if (roleLevel === 'FINANCE') {
                navigate("/finance", { replace: true });
                return;
            }
            if (roleLevel === 'ACCOUNTING') {
                navigate("/accounting", { replace: true });
                return;
            }
            if (roleLevel === 'LITIGATION') {
                navigate("/litigation", { replace: true });
                return;
            }

            // If manager HQ, they don't have access to global dashboard
            if (roleLevel === 'MANAGER_HEADQUARTER' || roleLevel === 'MANAGER_HEADQUARTER_LOCAL') {
                const memberships = user.memberships || [];
                if (memberships.length > 0) {
                    const firstService = memberships[0].enterprise;
                    navigate(`/${firstService.enterpriseCode}/`, { replace: true });
                } else {
                    navigate("/", { replace: true });
                }
                return;
            }
        }
        fetchData();
        const interval = setInterval(fetchData, 60000);
        return () => clearInterval(interval);
    }, [navigate, fetchData]);

    if (isLoading && !monitoring) {
        return (
            <div className="flex h-[400px] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            </div>
        );
    }

    const dbHealth = monitoring?.servicesStatus?.find((s: any) => s.name === "Database")?.status === "up";

    return (
        <div className="flex-1 space-y-4 pt-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="bg-slate-50 border-slate-200 text-black backdrop-blur-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-[10px] font-bold text-black uppercase tracking-widest">
                            {t('dashboard.stats.pending')}
                        </CardTitle>
                        <Clock className="h-4 w-4 text-emerald-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-black">{stats.pendingApprovals}</div>
                        <p className="text-[10px] text-emerald-500 font-bold uppercase mt-1">
                            {t('dashboard.stats.pendingDesc')}
                        </p>
                    </CardContent>
                </Card>
                <Card className="bg-slate-50 border-slate-200 text-black backdrop-blur-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-[10px] font-bold text-black uppercase tracking-widest">
                            {t('dashboard.stats.users')}
                        </CardTitle>
                        <Users className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-black">{stats.userCount.toLocaleString()}</div>
                        <p className="text-[10px] text-blue-500 font-bold uppercase mt-1">
                            {t('dashboard.stats.usersDesc')}
                        </p>
                    </CardContent>
                </Card>
                <Card className="bg-slate-50 border-slate-200 text-black backdrop-blur-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-[10px] font-bold text-black uppercase tracking-widest">{t('dashboard.stats.litigations')}</CardTitle>
                        <ShieldHalf className="h-4 w-4 text-orange-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-black">{stats.litigationCount}</div>
                        <p className="text-[10px] text-orange-500 font-bold uppercase mt-1">
                            {t('dashboard.stats.litigationsDesc')}
                        </p>
                    </CardContent>
                </Card>
                <Card className="bg-slate-50 border-slate-200 text-black backdrop-blur-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-[10px] font-bold text-black uppercase tracking-widest">
                            {t('dashboard.stats.enterprises')}
                        </CardTitle>
                        <Globe className="h-4 w-4 text-purple-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-black">{stats.enterpriseCount}</div>
                        <p className="text-[10px] text-purple-500 font-bold uppercase mt-1">
                            {t('dashboard.stats.enterprisesDesc')}
                        </p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4 bg-slate-50 border-slate-200 text-black backdrop-blur-sm">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div className="space-y-1">
                            <CardTitle className="text-xs font-bold uppercase tracking-widest text-black">{t('dashboard.charts.requestVolume')}</CardTitle>
                            <CardDescription className="text-[10px] text-black font-medium">{t('dashboard.charts.requestVolumeDesc')}</CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-emerald-500/10 border border-emerald-500/20">
                                <Database className="h-3 w-3 text-emerald-500" />
                                <span className={`text-[10px] font-black uppercase ${dbHealth ? 'text-emerald-500' : 'text-red-500'}`}>
                                    {dbHealth ? t('dashboard.charts.dbHealthy') : t('dashboard.charts.dbError')}
                                </span>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="pl-2">
                        <Overview data={overviewData} />
                    </CardContent>
                </Card>
                <Card className="col-span-3 bg-slate-50 border-slate-200 text-black backdrop-blur-sm">
                    <CardHeader>
                        <CardTitle className="text-xs font-bold uppercase tracking-widest text-black">{t('dashboard.activity.title')}</CardTitle>
                        <CardDescription className="text-[10px] text-black font-medium">
                            {t('dashboard.activity.description')}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <RecentRequests requests={recentRequests} />
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
export default Dashboard;