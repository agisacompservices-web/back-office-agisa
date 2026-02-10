import React from "react";
import { servicesData } from "../../context/data/dataServices";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
} from 'recharts';
import { Building2, TrendingUp, PieChart as PieChartIcon, Activity, Globe } from "lucide-react";

const ServicesReport: React.FC = () => {
    // Summary Statistics
    const totalServices = servicesData.length;
    const activeServices = servicesData.filter(s => s.status === "active").length;
    const totalVolume = servicesData.reduce((acc, curr) => acc + curr.totalVolume, 0);
    const avgVolume = totalVolume / totalServices;

    // Status Distribution
    const statusCounts = servicesData.reduce((acc, curr) => {
        acc[curr.status] = (acc[curr.status] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const statusData = Object.keys(statusCounts).map(status => ({
        name: status.charAt(0).toUpperCase() + status.slice(1),
        value: statusCounts[status]
    }));

    const COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444'];

    // Volume by Service
    const volumeData = servicesData.map(s => ({
        name: s.name,
        volume: s.totalVolume
    })).sort((a, b) => b.volume - a.volume);

    // Categories Breakdown
    const categoryCounts = servicesData.reduce((acc, curr) => {
        acc[curr.category] = (acc[curr.category] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const categoryData = Object.keys(categoryCounts).map(cat => ({
        name: cat,
        count: categoryCounts[cat]
    }));

    return (
        <div className="flex-1 space-y-4 pt-6">
            <h2 className="text-3xl font-bold tracking-tight text-white mb-4 flex items-center gap-3">
                <Globe className="h-8 w-8 text-indigo-500" />
                Conglomerate Analytics
            </h2>

            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="bg-white/5 border-white/10 text-white backdrop-blur-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-slate-400">Total Services</CardTitle>
                        <Building2 className="h-4 w-4 text-indigo-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalServices}</div>
                        <p className="text-xs text-slate-500">Entities across 5 sectors</p>
                    </CardContent>
                </Card>
                <Card className="bg-white/5 border-white/10 text-white backdrop-blur-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-slate-400">Active Entities</CardTitle>
                        <Activity className="h-4 w-4 text-emerald-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{activeServices}</div>
                        <p className="text-xs text-slate-500">{((activeServices / totalServices) * 100).toFixed(0)}% operational rate</p>
                    </CardContent>
                </Card>
                <Card className="bg-white/5 border-white/10 text-white backdrop-blur-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-slate-400">Total Volume</CardTitle>
                        <TrendingUp className="h-4 w-4 text-emerald-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">${(totalVolume / 1000000).toFixed(1)}M</div>
                        <p className="text-xs text-slate-500">Group consolidated YTD</p>
                    </CardContent>
                </Card>
                <Card className="bg-white/5 border-white/10 text-white backdrop-blur-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-slate-400">Avg Market Penetration</CardTitle>
                        <PieChartIcon className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">${(avgVolume / 1000).toFixed(0)}k</div>
                        <p className="text-xs text-slate-500">Average volume per service</p>
                    </CardContent>
                </Card>
            </div>

            {/* Charts Section */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4 bg-white/5 border-white/10 text-white backdrop-blur-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <TrendingUp className="h-5 w-5 text-emerald-400" />
                            Revenue Contribution by Service
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pl-2">
                        <ResponsiveContainer width="100%" height={350}>
                            <BarChart data={volumeData}>
                                <XAxis
                                    dataKey="name"
                                    stroke="#64748b"
                                    fontSize={10}
                                    tickLine={false}
                                    axisLine={false}
                                />
                                <YAxis
                                    stroke="#64748b"
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                    tickFormatter={(value) => `$${value / 1000}k`}
                                />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#f8fafc' }}
                                    itemStyle={{ color: '#f8fafc' }}
                                    formatter={(value: any) => [`$${Number(value).toLocaleString()}`, 'Volume']}
                                />
                                <Bar dataKey="volume" fill="#6366f1" radius={[4, 4, 0, 0]} opacity={0.8} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card className="col-span-3 bg-white/5 border-white/10 text-white backdrop-blur-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <PieChartIcon className="h-5 w-5 text-indigo-400" />
                            Sector Distribution
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={categoryData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="count"
                                >
                                    {categoryData.map((_entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#f8fafc' }}
                                    itemStyle={{ color: '#f8fafc' }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="mt-4 grid grid-cols-2 gap-2">
                            {categoryData.map((item, i) => (
                                <div key={item.name} className="flex items-center gap-2 text-xs">
                                    <div className="h-3 w-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                                    <span className="text-slate-400">{item.name}:</span>
                                    <span className="font-bold">{item.count}</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card className="bg-white/5 border-white/10 text-white backdrop-blur-sm">
                <CardHeader>
                    <CardTitle>Operating Status Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {statusData.map((status, i) => (
                            <div key={status.name} className="flex flex-col items-center justify-center p-6 bg-white/5 rounded-xl border border-white/5">
                                <p className="text-sm text-slate-500 font-medium uppercase tracking-widest mb-1">{status.name}</p>
                                <p className="text-4xl font-black" style={{ color: COLORS[i % COLORS.length] }}>{status.value}</p>
                                <p className="text-[10px] text-slate-400 mt-2">Entities in this state</p>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

export default ServicesReport;