import { SidebarProvider } from "../../context/SidebarContext"
import { Sidebar } from "../includes/Sidebar";
import { Outlet } from "react-router-dom"
import { Topbar } from "../includes/Topbar";

export default function DashboardLayout() {
    return (
        <SidebarProvider>
            <div className="flex h-screen overflow-hidden 
            bg-gradient-to-br from-emerald-500 via-emerald-950 to-slate-950
            ">
                <Sidebar />
                <div className="flex flex-col flex-1 overflow-hidden">
                    <Topbar />
                    <main className="flex-1 overflow-y-auto p-4">
                        <Outlet />
                    </main>
                    {/* <SystemsFooter /> */}
                </div>
            </div>
        </SidebarProvider>
    );
}