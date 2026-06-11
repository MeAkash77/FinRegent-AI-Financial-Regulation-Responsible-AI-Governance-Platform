"use client"

import React from 'react'
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from '../ui/sidebar'
import { useTheme } from 'next-themes'
import { Moon, Sun } from 'lucide-react'
import { Collapsible } from '@/components/ui/collapsible'

const ThemeComponent = () => {
    const { state } = useSidebar()
    const { theme, setTheme } = useTheme()

    const toggleTheme = () => {
        setTheme(theme === 'dark' ? 'light' : 'dark')
    }

    // When sidebar is collapsed, show only the icon button
    if (state === 'collapsed') {
        return (
            <SidebarMenu>
                <SidebarMenuItem>
                    <SidebarMenuButton
                        onClick={toggleTheme}
                        tooltip="Toggle Theme"
                    >
                        {theme === 'dark' ? (
                            <Sun className="h-4 w-4" />
                        ) : (
                            <Moon className="h-4 w-4" />
                        )}
                    </SidebarMenuButton>
                </SidebarMenuItem>
            </SidebarMenu>
        )
    }

    // When sidebar is expanded, show the full theme switcher
    return (
        <SidebarMenu>
            <Collapsible
                asChild
                className="group/collapsible"
            >
                <SidebarMenuItem>
                    <SidebarMenuButton
                        onClick={toggleTheme}
                    >
                        <div className="flex w-full justify-between items-center">
                            <div className="flex items-center gap-2">
                                {theme === 'dark' ? (
                                    <Sun className="h-4 w-4" />
                                ) : (
                                    <Moon className="h-4 w-4" />
                                )}
                                <span>Theme</span>
                            </div>
                            <span className="text-xs text-muted-foreground capitalize">
                                {theme}
                            </span>
                        </div>
                    </SidebarMenuButton>
                </SidebarMenuItem>
            </Collapsible>
        </SidebarMenu>
    )
}

export default ThemeComponent
