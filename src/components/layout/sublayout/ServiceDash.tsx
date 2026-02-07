import { ServSidebarProvider } from "../../../context/ServSidebarContext"
import { ServSidebar } from "../../includes/ServSidebar";
import { Outlet } from "react-router-dom"
import { Topbar } from "../../includes/Topbar";

export default function ServiceDashLayout() {
    return (
        <ServSidebarProvider>
            <div className="flex h-screen overflow-hidden bg-gradient-to-br from-black via-gray-900 to-slate-900">
                <ServSidebar />
                <div className="flex flex-col flex-1 overflow-hidden">
                    <Topbar />
                    <main className="flex-1 overflow-y-auto p-4">
                        <Outlet />
                    </main>
                    {/* <SystemsFooter /> */}
                </div>
            </div>
        </ServSidebarProvider>
    );
}