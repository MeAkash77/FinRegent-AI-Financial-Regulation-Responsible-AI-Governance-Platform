"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Hammer,
    CheckCircle2,
    Circle,
    ChevronDown,
    ChevronUp,
    ChevronLeft,
    ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ActivityItem } from "@/components/chat";

interface TimelineProps {
    activities: ActivityItem[];
    isOpen: boolean;
    onToggle: () => void;
}

export default function Timeline({ activities, isOpen, onToggle }: TimelineProps) {
    const [expandedActivityId, setExpandedActivityId] = useState<string | null>(null);

    const toggleActivityExpand = (activityId: string) => {
        setExpandedActivityId(expandedActivityId === activityId ? null : activityId);
    };

    const formatTimestamp = (timestamp: string) => {
        try {
            const date = new Date(timestamp);
            return date.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: true
            });
        } catch {
            return timestamp;
        }
    };

    const getEventIcon = (eventType: string, toolName?: string) => {
        if (eventType === "tool_called") {
            return <Hammer className="h-3 w-3" />;
        }
        if (eventType === "tool_response") {
            return <CheckCircle2 className="h-3 w-3" />;
        }
        if (toolName) {
            return <Hammer className="h-3 w-3" />;
        }
        return <Circle className="h-3 w-3" />;
    };

    const getEventColor = (status: string, eventType: string) => {
        if (status === "in_progress") {
            return "text-blue-500";
        }
        if (eventType === "tool_called") {
            return "text-orange-400";
        }
        if (eventType === "tool_response") {
            return "text-green-400";
        }
        if (status === "completed") {
            return "text-green-500";
        }
        return "text-muted-foreground";
    };

    const getStatusBadge = (status: string): "default" | "secondary" | "outline" | "destructive" => {
        const variants: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
            in_progress: "default",
            completed: "secondary",
            error: "destructive",
            pending: "outline"
        };
        return variants[status] || "secondary";
    };

    const getLevelBadge = (level: string): "default" | "secondary" | "outline" | "destructive" => {
        const variants: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
            DEBUG: "outline",
            INFO: "secondary",
            WARNING: "default",
            ERROR: "destructive"
        };
        return variants[level] || "secondary";
    };

    const liveEventCount = activities.filter(e => e.status === "in_progress").length;

    return (
        <>
            {/* Toggle Button */}
            <AnimatePresence>
                {!isOpen && activities.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className="fixed right-0 top-1/2 -translate-y-1/2 z-50"
                    >
                        <Button
                            onClick={onToggle}
                            size="sm"
                            className="rounded-l-lg rounded-r-none shadow-lg h-16 px-3 bg-primary hover:bg-primary/90"
                        >
                            <div className="flex flex-col items-center gap-1">
                                <ChevronLeft className="h-5 w-5" />
                                {liveEventCount > 0 && (
                                    <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                                )}
                            </div>
                        </Button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Sliding Timeline Panel */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ x: "100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "100%" }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        className="fixed right-0 top-0 h-full w-96 bg-background border-l border-border/50 shadow-2xl z-50"
                    >
                        <div className="w-full h-full flex flex-col">
                            {/* Timeline Header */}
                            <div className="p-4 border-b border-border/50">
                                <div className="flex items-center justify-between mb-1">
                                    <h3 className="text-sm font-semibold">Timeline</h3>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={onToggle}
                                        className="h-8 w-8 p-0 hover:bg-muted"
                                    >
                                        <ChevronRight className="h-4 w-4" />
                                    </Button>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    {liveEventCount > 0 && (
                                        <>
                                            <div className="flex items-center gap-1">
                                                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                                                <span className="font-medium">Live</span>
                                            </div>
                                            <span>•</span>
                                        </>
                                    )}
                                    <span>{activities.length} events</span>
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Real-time activity for MANAGER AGENT
                                </p>
                            </div>

                            {/* Timeline Events */}
                            <div className="flex-1 overflow-hidden">
                                <ScrollArea className="h-full px-4">
                                    <div className="py-4 space-y-0">
                                        {activities.map((activity, index) => {
                                        const isLast = index === activities.length - 1;
                                        const isLive = activity.status === "in_progress";
                                        const isExpanded = expandedActivityId === activity.log_id;

                                        return (
                                            <div key={activity.log_id} className="relative flex gap-3 group">
                                                {/* Timeline line and dot */}
                                                <div className="relative flex flex-col items-center">
                                                    <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${isLive ? 'bg-blue-500/10' : 'bg-transparent'
                                                        }`}>
                                                        <div className={getEventColor(activity.status, activity.event_type)}>
                                                            {getEventIcon(activity.event_type, activity.tool_name)}
                                                        </div>
                                                    </div>
                                                    {!isLast && (
                                                        <div className="w-px h-full bg-border/50 absolute top-6" />
                                                    )}
                                                </div>

                                                {/* Event content */}
                                                <div className="flex-1 pb-6">
                                                    <div className="flex items-start justify-between gap-2">
                                                        <div className="flex-1">
                                                            <span className={`text-sm ${isLive ? 'font-medium' : ''
                                                                }`}>
                                                                {activity.feature}
                                                            </span>
                                                            {activity.tool_name && !isExpanded && (
                                                                <p className="text-xs text-muted-foreground mt-0.5">
                                                                    {activity.tool_name}
                                                                </p>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center gap-1">
                                                            <span className="text-xs text-muted-foreground whitespace-nowrap">
                                                                {formatTimestamp(activity.timestamp)}
                                                            </span>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => toggleActivityExpand(activity.log_id)}
                                                                className="h-5 w-5 p-0 hover:bg-muted"
                                                            >
                                                                {isExpanded ? (
                                                                    <ChevronUp className="h-3 w-3" />
                                                                ) : (
                                                                    <ChevronDown className="h-3 w-3" />
                                                                )}
                                                            </Button>
                                                        </div>
                                                    </div>

                                                    {/* Expanded Details */}
                                                    <AnimatePresence>
                                                        {isExpanded && (
                                                            <motion.div
                                                                initial={{ height: 0, opacity: 0 }}
                                                                animate={{ height: "auto", opacity: 1 }}
                                                                exit={{ height: 0, opacity: 0 }}
                                                                transition={{ duration: 0.2 }}
                                                                className="mt-3 space-y-2 text-xs border-t pt-2 border-border/50"
                                                            >
                                                                <div className="grid grid-cols-2 gap-2">
                                                                    <div>
                                                                        <span className="font-medium text-muted-foreground">Event:</span>
                                                                        <p className="mt-0.5">{activity.event_type}</p>
                                                                    </div>
                                                                    <div>
                                                                        <span className="font-medium text-muted-foreground">Level:</span>
                                                                        <div className="mt-0.5">
                                                                            <Badge variant={getLevelBadge(activity.level)} className="text-xs h-5">
                                                                                {activity.level}
                                                                            </Badge>
                                                                        </div>
                                                                    </div>
                                                                    <div>
                                                                        <span className="font-medium text-muted-foreground">Status:</span>
                                                                        <div className="mt-0.5">
                                                                            <Badge variant={getStatusBadge(activity.status)} className="text-xs h-5">
                                                                                {activity.status}
                                                                            </Badge>
                                                                        </div>
                                                                    </div>
                                                                    <div>
                                                                        <span className="font-medium text-muted-foreground">Agent:</span>
                                                                        <p className="mt-0.5 truncate" title={activity.agent_name}>{activity.agent_name}</p>
                                                                    </div>
                                                                </div>

                                                                {activity.tool_name && (
                                                                    <div>
                                                                        <span className="font-medium text-muted-foreground">Tool Name:</span>
                                                                        <p className="mt-0.5 font-mono text-xs bg-muted px-2 py-1 rounded break-all">
                                                                            {activity.tool_name}
                                                                        </p>
                                                                    </div>
                                                                )}

                                                                {activity.tool_input && (
                                                                    <div>
                                                                        <span className="font-medium text-muted-foreground">Tool Input:</span>
                                                                        <pre className="mt-0.5 font-mono text-xs bg-muted px-2 py-1 rounded overflow-x-auto whitespace-pre-wrap break-all">
                                                                            {activity.tool_input}
                                                                        </pre>
                                                                    </div>
                                                                )}

                                                                {activity.message && (
                                                                    <div>
                                                                        <span className="font-medium text-muted-foreground">Message:</span>
                                                                        <p className="mt-0.5">{activity.message}</p>
                                                                    </div>
                                                                )}

                                                                <div className="grid grid-cols-1 gap-2 pt-2 border-t border-border/50">
                                                                    <div>
                                                                        <span className="font-medium text-muted-foreground">Run ID:</span>
                                                                        <p className="mt-0.5 font-mono text-[10px] break-all" title={activity.run_id}>
                                                                            {activity.run_id}
                                                                        </p>
                                                                    </div>
                                                                    <div>
                                                                        <span className="font-medium text-muted-foreground">Trace ID:</span>
                                                                        <p className="mt-0.5 font-mono text-[10px] break-all" title={activity.trace_id}>
                                                                            {activity.trace_id}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            </motion.div>
                                                        )}
                                                    </AnimatePresence>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                                </ScrollArea>
                            </div>

                            {/* Timeline Footer */}
                            <div className="p-3 border-t border-border/50 bg-muted/30">
                                <div className="text-xs text-muted-foreground">
                                    Powered by Lyzr.ai
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
