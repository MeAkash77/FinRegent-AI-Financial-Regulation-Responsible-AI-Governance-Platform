"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, MessageSquare, Calendar, Clock } from "lucide-react";
import { toast } from "sonner";

interface ChatSession {
    id: string;
    userId: string;
    sessionId: string;
    createdAt: string;
    updatedAt: string;
}

interface HistoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelectSession: (sessionId: string) => void;
}

export default function HistoryModal({ isOpen, onClose, onSelectSession }: HistoryModalProps) {
    const [sessions, setSessions] = useState<ChatSession[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            fetchSessions();
        }
    }, [isOpen]);

    const fetchSessions = async () => {
        setIsLoading(true);
        try {
            const response = await fetch("/api/chat/session");

            if (!response.ok) {
                throw new Error("Failed to fetch chat sessions");
            }

            const data = await response.json();
            setSessions(data.chats || []);
        } catch (error) {
            console.error("Error fetching sessions:", error);
            toast.error("Error", {
                description: "Failed to load chat history",
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleSelectSession = (sessionId: string) => {
        onSelectSession(sessionId);
        onClose();
    };

    const formatDate = (dateString: string) => {
        try {
            return format(new Date(dateString), "PPP");
        } catch {
            return "Unknown date";
        }
    };

    const formatTime = (dateString: string) => {
        try {
            return format(new Date(dateString), "p");
        } catch {
            return "Unknown time";
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl max-h-[80vh]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <MessageSquare className="h-5 w-5 text-primary" />
                        Chat History
                    </DialogTitle>
                    <DialogDescription>
                        Select a previous chat session to continue the conversation
                    </DialogDescription>
                </DialogHeader>

                {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : sessions.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                        <MessageSquare className="h-16 w-16 text-muted-foreground/50 mb-4" />
                        <p className="text-lg font-medium mb-2">No chat history yet</p>
                        <p className="text-sm text-muted-foreground">
                            Start a new conversation to see it here
                        </p>
                    </div>
                ) : (
                    <ScrollArea className="h-[500px] pr-4">
                        <div className="space-y-3">
                            {sessions.map((session) => (
                                <Card
                                    key={session.id}
                                    className="cursor-pointer hover:border-primary transition-colors"
                                    onClick={() => handleSelectSession(session.sessionId)}
                                >
                                    <CardHeader className="pb-3">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <CardTitle className="text-base flex items-center gap-2">
                                                    <MessageSquare className="h-4 w-4 text-primary" />
                                                    Chat Session
                                                </CardTitle>
                                                <CardDescription className="text-xs font-mono mt-1">
                                                    {session.sessionId}
                                                </CardDescription>
                                            </div>
                                            <Badge variant="secondary" className="ml-2">
                                                Active
                                            </Badge>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="pt-0">
                                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                            <div className="flex items-center gap-1">
                                                <Calendar className="h-3 w-3" />
                                                <span>{formatDate(session.createdAt)}</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Clock className="h-3 w-3" />
                                                <span>{formatTime(session.createdAt)}</span>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </ScrollArea>
                )}

                <div className="flex justify-end gap-2 pt-4 border-t">
                    <Button variant="outline" onClick={onClose}>
                        Close
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
