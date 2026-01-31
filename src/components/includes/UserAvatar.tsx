import React, { useEffect, useState } from "react"
import {
    Avatar,
    AvatarFallback,
    AvatarImage,
} from "../ui/avatar"
import { Button } from "../ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "../ui/dropdown-menu"

import { useSidebar } from "../../context/SidebarContext"
import { cn } from "../../lib/utils"
import authApi from "../../context/api/auth"
import { Link } from "react-router-dom"

export function UserNav() {
    const { isSidebarOpen } = useSidebar()
    const [user, setUser] = useState<{ fullName: string; email: string; avatarUrl?: string } | null>(null)

    const fetchUserFromStorage = () => {
        const storedUser = localStorage.getItem('agisa_user')
        if (storedUser) {
            try {
                setUser(JSON.parse(storedUser))
            } catch (e) {
                console.error("Failed to parse user from localStorage", e)
            }
        }
    }

    useEffect(() => {
        fetchUserFromStorage()

        // Listen for profile updates from other components (like Profile.tsx)
        window.addEventListener('user-profile-updated', fetchUserFromStorage)

        return () => {
            window.removeEventListener('user-profile-updated', fetchUserFromStorage)
        }
    }, [])

    const handleLogout = () => {
        authApi.logout()
    }

    // Get initials for fallback
    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .substring(0, 2)
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className={cn("relative", isSidebarOpen ? "w-full justify-between px-2" : "h-8 w-8 rounded-full justify-center")}>
                    {isSidebarOpen && <p className="text-sm font-medium leading-none text-white whitespace-nowrap overflow-hidden text-ellipsis mr-2">
                        {user?.fullName || "Utilisateur"}
                    </p>}
                    <Avatar className="h-8 w-8 border border-white/10 shrink-0">
                        {user?.avatarUrl ? (
                            <AvatarImage src={user.avatarUrl} alt={user.fullName} className="object-cover" />
                        ) : (
                            <AvatarImage src="" alt={user?.fullName || "User"} />
                        )}
                        <AvatarFallback className="bg-emerald-500/10 text-emerald-500 font-bold">
                            {user ? getInitials(user.fullName) : "AG"}
                        </AvatarFallback>
                    </Avatar>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
                className="w-56 bg-black/80 backdrop-blur-xl border-white/10 text-slate-400 [&_[role=menuitem]]:text-slate-400 [&_[role=menuitem]:focus]:bg-white/10 [&_[role=menuitem]:focus]:text-white"
                side="right"
                align="end"
                sideOffset={8}
                forceMount
            >
                <DropdownMenuLabel className="font-normal text-slate-400">
                    <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none text-white">{user?.fullName || "Itilizatè"}</p>
                        <p className="text-xs leading-none text-slate-500">
                            {user?.email || ""}
                        </p>
                    </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-white/10" />
                <DropdownMenuGroup>
                    <DropdownMenuItem asChild>
                        <Link to="/profile">
                            Profile
                        </Link>
                    </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator className="bg-white/10" />
                <DropdownMenuItem onClick={handleLogout} className="text-red-400 focus:text-red-400 focus:bg-red-400/10">
                    Log out
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}