"use client";

import { useState } from "react";
import { Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import AiChat from "@/components/chat";
import HistoryModal from "@/components/history-modal";

export default function Workspace() {
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [selectedSessionId, setSelectedSessionId] = useState<string | undefined>();

  const handleSelectSession = (sessionId: string) => {
    setSelectedSessionId(sessionId);
  };

  return (
    <div className="flex h-full w-full">
      {/* Main Chat Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Topbar */}
        <div className="flex items-center justify-between border-b border-border/50 px-6 py-4">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => setIsHistoryOpen(true)}
            >
              <Clock className="h-4 w-4" />
              History
            </Button>
          </div>
        </div>

        {/* Chat Interface */}
        <div className="flex-1 flex items-center justify-center p-6 overflow-y-auto">
          <AiChat
            initialSessionId={selectedSessionId}
            onSessionChange={(sessionId) => setSelectedSessionId(sessionId)}
          />
        </div>
      </div>

      {/* History Modal */}
      <HistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        onSelectSession={handleSelectSession}
      />
    </div>
  );
}
