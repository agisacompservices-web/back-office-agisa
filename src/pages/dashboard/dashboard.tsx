import React, { useEffect } from "react"
import { useNavigate } from "react-router-dom"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "../../components/ui/card"
import { Overview } from "../../components/dashboard/Overview"
import { DollarSign, MonitorCloud, ShieldHalf, Users } from "lucide-react"
import { RecentRequests } from "../../components/dashboard/RecentRequest"

const Dashboard: React.FC = () => {
    const navigate = useNavigate();

    useEffect(() => {
        const userStr = localStorage.getItem("agisa_user");
        if (userStr) {
            const user = JSON.parse(userStr);
            const roleLevel = user.role?.level?.toUpperCase();

            // If manager HQ, they don't have access to global dashboard
            if (roleLevel === 'MANAGER_HEADQUARTER' || roleLevel === 'MANAGER_HEADQUARTER_LOCAL') {
                const memberships = user.memberships || [];
                if (memberships.length > 0) {
                    const firstService = memberships[0].enterprise;
                    navigate(`/${firstService.enterpriseCode}/`, { replace: true });
                } else {
                    // Fallback or error
                    navigate("/", { replace: true });
                }
            }
        }
    }, [navigate]);
    return (
        <div className="flex-1 space-y-4 pt-6">
            {/* <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight text-white">Dashboard</h2>
            </div> */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="bg-white/5 border-white/10 text-white">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Total Revenue
                        </CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">$45,231.89</div>
                        <p className="text-xs text-muted-foreground">
                            +20.1% from last month
                        </p>
                    </CardContent>
                </Card>
                <Card className="bg-white/5 border-white/10 text-white">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Users
                        </CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">+2350</div>
                        <p className="text-xs text-muted-foreground">
                            +180.1% from last month
                        </p>
                    </CardContent>
                </Card>
                <Card className="bg-white/5 border-white/10 text-white">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Litigations</CardTitle>
                        <ShieldHalf className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">+12,234</div>
                        <p className="text-xs text-muted-foreground">
                            +19% from last month
                        </p>
                    </CardContent>
                </Card>
                <Card className="bg-white/5 border-white/10 text-white">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Services
                        </CardTitle>
                        <MonitorCloud className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">+573</div>
                        <p className="text-xs text-muted-foreground">
                            +201 since last hour
                        </p>
                    </CardContent>
                </Card>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4 bg-white/5 border-white/10 text-white">
                    <CardHeader>
                        <CardTitle>Overview</CardTitle>
                    </CardHeader>
                    <CardContent className="pl-2">
                        <Overview />
                    </CardContent>
                </Card>
                <Card className="col-span-3 bg-white/5 border-white/10 text-white">
                    <CardHeader>
                        <CardTitle>Recent Requests</CardTitle>
                        <CardDescription>
                            You made 265 requests this month.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <RecentRequests />
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
export default Dashboard;