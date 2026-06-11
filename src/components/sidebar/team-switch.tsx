"use client"

import * as React from "react"
import { Sparkles } from "lucide-react"

import {
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem
} from "@/components/ui/sidebar"

export function TeamSwitcher() {
    return (
        <SidebarMenu>
            <SidebarMenuItem>
                <SidebarMenuButton
                    size="lg"
                    className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground p-5"
                >
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary shrink-0">
                        <Sparkles className="h-5 w-5 text-primary-foreground" />
                    </div>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                        <span className="truncate font-medium">FinRegent</span>
                        <span className="truncate text-xs">Finance App</span>
                    </div>
                </SidebarMenuButton>
            </SidebarMenuItem>
        </SidebarMenu>
    )
}
