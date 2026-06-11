"use client"

import * as React from "react"
import {
    BookOpen,
    File,
    LayoutDashboard,
    MessageSquareCodeIcon,
    Settings
} from "lucide-react"

import { NavMain } from "@/components/sidebar/nav-main"
import { NavUser } from "@/components/sidebar/nav-user"
import { TeamSwitcher } from "@/components/sidebar/team-switch"
import ThemeComponent from "@/components/sidebar/theme-component"
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenuButton,
    SidebarRail,
} from "@/components/ui/sidebar"
import { SignInButton, useUser } from "@clerk/nextjs"

const data = {
    navMain: [
        {
            title: "Home",
            url: "/",
            icon: LayoutDashboard,
            isActive: true
        },
        {
            title: "Workspace",
            url: "/workspace",
            icon: MessageSquareCodeIcon
        },
        {
            title: "Updates",
            url: "/updates",
            icon: BookOpen
        },
        {
            title: "Documents",
            url: "/documents",
            icon: File
        },
        {
            title: "Settings",
            url: "/settings",
            icon: Settings
        }
    ]
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
    const { isSignedIn, user } = useUser();

    const userData = {
        name: user?.fullName || '',
        email: user?.primaryEmailAddress?.emailAddress  || '',
        avatar: user?.imageUrl || '',
    }

    return (
        <Sidebar collapsible="icon" {...props}>
            <SidebarHeader>
                <TeamSwitcher />
            </SidebarHeader>
            <SidebarContent>
                <NavMain items={data.navMain} />
            </SidebarContent>
            <SidebarFooter>
                <ThemeComponent />
                {isSignedIn ? (
                    <NavUser user={userData} />
                ) : (
                    <SidebarMenuButton>
                        <SignInButton />
                    </SidebarMenuButton>
                )}
            </SidebarFooter>
            <SidebarRail />
        </Sidebar>
    )
}
