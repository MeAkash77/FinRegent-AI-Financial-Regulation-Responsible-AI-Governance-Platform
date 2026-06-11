/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import {
  IconAlertTriangle,
  IconArrowUp,
  IconFile,
  IconFileSpark,
  IconGauge,
  IconPhotoScan,
  IconSparkles,
  IconUser,
  IconX
} from "@tabler/icons-react";
import { Streamdown } from "streamdown";
import { generateSignatureAction } from "@/actions/generate-signature";
import { toast } from "sonner";
import Timeline from "@/components/shared/timeline";
import { secret_keys } from "@/actions/api-key";
import VoiceChat from "@/components/shared/voice-chat";

const PROMPTS = [
  {
    icon: IconFileSpark,
    text: "RBI Guidelines",
    prompt:
      "What are the latest RBI guidelines for KYC and customer onboarding in financial institutions?",
  },
  {
    icon: IconGauge,
    text: "Compliance Check",
    prompt:
      "Help me understand the SEBI compliance requirements for disclosure and reporting.",
  },
  {
    icon: IconAlertTriangle,
    text: "Risk Assessment",
    prompt:
      "Analyze potential compliance risks in our current banking procedures.",
  },
];

export interface Message {
  id: string;
  role: "user" | "assistant" | "loading";
  content: string;
  timestamp: Date;
  attachments?: Array<{ id: string; name: string }>;
}

interface AiChatProps {
  onSendMessage?: (message: string) => void;
}

export interface ActivityItem {
  id: string;
  agent_id: string;
  agent_name: string;
  event_type: string;
  feature: string;
  level: string;
  log_id: string;
  message: string;
  run_id: string;
  session_id: string;
  status: string;
  timestamp: string;
  tool_input?: string;
  tool_name?: string;
  trace_id: string;
}

export interface Keys {
  lyzr_api_key: string;
  lyzr_agent_id: string;
  signature_key: string;
}

interface AiChatProps {
  onSendMessage?: (message: string) => void;
  onSessionChange?: (sessionId: string) => void;
  initialSessionId?: string;
}

export default function AiChat({ onSendMessage, onSessionChange, initialSessionId }: AiChatProps) {
  const [inputValue, setInputValue] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [sessionId, setSessionId] = useState<string>("");
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [secret, setSecret] = useState<Keys | null>(null);
  const [isTimelineOpen, setIsTimelineOpen] = useState(false);
  const [isVoiceChatActive, setIsVoiceChatActive] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [uploadedAssets, setUploadedAssets] = useState<Array<{ id: string; name: string }>>([]);
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const hasLoadedSecrets = useRef(false);
  const hasSavedSession = useRef(false);
  const { user } = useUser();

  // Memoize callbacks to prevent VoiceChat re-renders
  const handleSetIsTyping = useCallback((value: boolean) => {
    setIsTyping(value);
  }, []);

  const handleSetIsVoiceChatActive = useCallback((value: boolean) => {
    setIsVoiceChatActive(value);
  }, []);

  // Generate session ID on mount or use provided initial session
  useEffect(() => {
    if (initialSessionId) {
      setSessionId(initialSessionId);
      loadChatHistory(initialSessionId);
    } else {
      const sid = `session-${Date.now()}`;
      setSessionId(sid);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialSessionId]);

  // Fetch secret keys only once when needed
  useEffect(() => {
    if (hasLoadedSecrets.current) return;

    let isMounted = true;

    const fetchSecretKeys = async () => {
      try {
        const keys = await secret_keys();
        if (isMounted && !hasLoadedSecrets.current) {
          setSecret(keys);
          hasLoadedSecrets.current = true;
          console.log('Secret keys loaded:', { loaded: true });
        }
      } catch (error) {
        console.error('Failed to load secret keys:', error);
      }
    };

    fetchSecretKeys();

    return () => {
      isMounted = false;
    };
  }, []);

  // WebSocket connection for activity tracking
  useEffect(() => {
    if (!sessionId || !secret?.lyzr_api_key) return;

    let isMounted = true;
    const wsUrl = `wss://metrics.studio.lyzr.ai/ws/${sessionId}?x-api-key=${secret.lyzr_api_key}`;

    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        if (isMounted) {
          console.log('WebSocket connected for activity tracking');
        }
      };

      ws.onmessage = (event) => {
        if (!isMounted) return;
        
        try {
          const activityData: ActivityItem = JSON.parse(event.data);
          setActivities(prev => {
            // Check if this activity already exists (prevent duplicates)
            const exists = prev.some(activity => activity.log_id === activityData.log_id);
            if (exists) {
              // Update existing activity instead of adding duplicate
              return prev.map(activity => 
                activity.log_id === activityData.log_id ? activityData : activity
              );
            }
            
            // Add new activity without auto-opening timeline
            return [activityData, ...prev];
          });
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

      ws.onclose = () => {
        if (isMounted) {
          console.log('WebSocket disconnected');
        }
      };

      return () => {
        isMounted = false;
        if (ws.readyState === WebSocket.OPEN) {
          ws.close();
        }
      };
    } catch (error) {
      console.error('Error establishing WebSocket connection:', error);
    }
  }, [sessionId, secret?.lyzr_api_key, isTimelineOpen]);

  const scrollToBottom = () => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // Load chat history from Lyzr API
  const loadChatHistory = async (sid: string) => {
    if (!secret?.lyzr_api_key) return;

    setIsLoadingHistory(true);
    try {
      const response = await fetch(
        `/api/chat/history?sessionId=${sid}&apiKey=${secret.lyzr_api_key}`
      );

      if (!response.ok) {
        throw new Error("Failed to load chat history");
      }

      const data = await response.json();
      const history = data.history || [];

      // Convert Lyzr history format to Message format
      const loadedMessages: Message[] = history.map((msg: { role: string; content: string; created_at: string }, index: number) => ({
        id: `${Date.now()}-${index}`,
        role: msg.role as "user" | "assistant",
        content: msg.content || "",
        timestamp: msg.created_at ? new Date(msg.created_at) : new Date(),
      }));

      setMessages(loadedMessages);
      
      if (onSessionChange) {
        onSessionChange(sid);
      }

      toast.success("History loaded", {
        description: `Loaded ${loadedMessages.length} messages`,
      });
    } catch (error) {
      console.error("Error loading chat history:", error);
      toast.error("Error", {
        description: "Failed to load chat history",
      });
    } finally {
      setIsLoadingHistory(false);
    }
  };

  // Save chat session to database
  const saveSessionToDb = async (sid: string) => {
    if (hasSavedSession.current) return;

    try {
      const response = await fetch("/api/chat/session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ sessionId: sid }),
      });

      if (response.ok) {
        hasSavedSession.current = true;
        console.log("Chat session saved to database");
      }
    } catch (error) {
      console.error("Error saving session to database:", error);
    }
  };

  const handlePromptClick = (prompt: string) => {
    setInputValue(prompt);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check if secrets are loaded
    if (!secret?.lyzr_api_key) {
      toast.error("Configuration Error", {
        description: "API key is not loaded. Please refresh the page.",
      });
      return;
    }

    setIsUploadingFile(true);
    
    try {
      const formData = new FormData();
      formData.append("files", file);

      const response = await fetch("/api/lyzr/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to upload file");
      }

      const data = await response.json();
      
      if (data.results && data.results.length > 0 && data.results[0].success) {
        const assetId = data.results[0].asset_id;
        const fileName = data.results[0].file_name;
        setUploadedAssets(prev => [...prev, { id: assetId, name: fileName }]);
        
        toast.success("File uploaded", {
          description: `${fileName} uploaded successfully`,
        });
      } else {
        throw new Error(data.results?.[0]?.error || "Upload failed");
      }
    } catch (error) {
      console.error("Error uploading file:", error);
      toast.error("Upload Error", {
        description: error instanceof Error ? error.message : "Failed to upload file",
      });
    } finally {
      setIsUploadingFile(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemoveAsset = (assetId: string) => {
    setUploadedAssets(prev => prev.filter(asset => asset.id !== assetId));
    toast.success("File removed", {
      description: "File attachment removed from chat",
    });
  };

  const handleSend = async () => {
    if (!inputValue.trim()) return;

    // Check if user is logged in
    if (!user?.primaryEmailAddress?.emailAddress) {
      toast.error("Authentication Required", {
        description: "Please sign in to chat with the AI agent.",
      });
      return;
    }

    // Check if secrets are loaded
    if (!secret?.lyzr_agent_id) {
      toast.error("Configuration Error", {
        description: "AI agent configuration is not loaded. Please refresh the page.",
      });
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: inputValue,
      timestamp: new Date(),
      attachments: uploadedAssets.length > 0 ? [...uploadedAssets] : undefined
    };

    setMessages(prev => [...prev, userMessage]);
    const currentMessage = inputValue;
    setInputValue("");
    setIsTyping(true);

    // Save session to database on first message
    if (!hasSavedSession.current && sessionId) {
      await saveSessionToDb(sessionId);
    }

    // Notify parent component if callback exists
    if (onSendMessage) {
      onSendMessage(currentMessage);
    }

    try {
      // Prepare payload without signature
      const payloadWithoutSignature: {
        userId: string;
        agentId: string;
        message: string;
        sessionId: string;
        assets?: string[];
      } = {
        userId: user.primaryEmailAddress.emailAddress,
        agentId: secret.lyzr_agent_id,
        message: currentMessage,
        sessionId: sessionId,
      };

      // Add assets if any are uploaded
      if (uploadedAssets.length > 0) {
        payloadWithoutSignature.assets = uploadedAssets.map(asset => asset.id);
      }

      // Generate signature using server action
      const payloadString = JSON.stringify(payloadWithoutSignature);
      const signature = await generateSignatureAction(payloadString);

      // Add signature to payload
      const fullPayload = {
        ...payloadWithoutSignature,
        signature,
      };

      // Make API request
      const response = await fetch('/api/lyzr/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(fullPayload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to send message');
      }

      const data = await response.json();

      // Extract the response message from Lyzr API
      const aiResponse = data.response || "I received your message but couldn't generate a response.";

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: aiResponse,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
      
      // Clear uploaded assets after successful send
      setUploadedAssets([]);
    } catch (error) {
      console.error('Error sending message:', error);

      toast.error("Error", {
        description: error instanceof Error ? error.message : "Failed to send message. Please try again.",
      });

      // Add error message to chat
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "I apologize, but I encountered an error processing your request. Please try again.",
        timestamp: new Date()
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const hasUserMessages = messages.length > 0;

  return (
    <div className={cn(
      "flex flex-col h-full w-full mx-auto transition-all duration-300",
      hasUserMessages ? "max-w-full" : "max-w-4xl"
    )}>
      {/* Header - Only show when no user messages */}
      {!hasUserMessages && (
        <div className="text-center mb-8 px-4">
          <div className="flex items-center justify-center gap-3 mb-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
              <IconSparkles className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-4xl font-bold bg-linear-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              FinRegent
            </h1>
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Your AI-powered compliance assistant
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Get instant answers about regulatory requirements, policy analysis, and compliance guidance
          </p>
        </div>
      )}

      {/* Messages Area */}
      {hasUserMessages && (
        <div className="flex-1 mb-4 min-h-0">
          <ScrollArea ref={scrollAreaRef} className="h-full pr-4">
            <div className="space-y-6 pb-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    "flex gap-3",
                    message.role === "user" ? "justify-end" : "justify-start"
                  )}
                >
                  {message.role === "assistant" && (
                    <Avatar className="h-8 w-8 mt-1 shrink-0">
                      <AvatarFallback className="bg-primary/10">
                        <IconSparkles className="h-4 w-4 text-primary" />
                      </AvatarFallback>
                    </Avatar>
                  )}

                  <div
                    className={cn(
                      "rounded-2xl px-4 py-3 max-w-[85%] bg-card border border-border",
                    )}
                  >
                    {/* Display attachments if present */}
                    {message.attachments && message.attachments.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-3 pb-3 border-b border-border">
                        {message.attachments.map((attachment) => (
                          <div
                            key={attachment.id}
                            className="flex items-center gap-2 px-2.5 py-1 bg-primary/10 text-primary rounded-md text-xs border border-primary/20"
                          >
                            <IconFile className="h-3 w-3" />
                            <span className="max-w-[120px] truncate">{attachment.name}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {message.role === "assistant" ? (
                      <Streamdown
                        parseIncompleteMarkdown={true}
                        components={{
                          a: ({ ...props }) => (
                            <a
                              {...props}
                              className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 underline decoration-blue-600/50 dark:decoration-blue-400/50 underline-offset-4 transition-colors"
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              {props.children}
                              <span className="inline-block ml-1 align-middle">
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  width="14"
                                  height="14"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                >
                                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                                </svg>
                              </span>
                            </a>
                          ),
                        }}
                      >
                        {message.content}
                      </Streamdown>
                    ) : (
                      <Streamdown
                        parseIncompleteMarkdown={true}
                        components={{
                          a: ({ ...props }) => (
                            <a
                              {...props}
                              className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 underline decoration-blue-600/50 dark:decoration-blue-400/50 underline-offset-4 transition-colors"
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              {props.children}
                              <span className="inline-block ml-1 align-middle">
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  width="14"
                                  height="14"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                >
                                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                                </svg>
                              </span>
                            </a>
                          ),
                        }}
                      >
                        {message.content}
                      </Streamdown>
                    )}
                    <p className="text-xs opacity-70 mt-2">
                      {message.timestamp.toLocaleTimeString('en-IN', {
                        timeZone: 'Asia/Kolkata',
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true
                      })}
                    </p>
                  </div>

                  {message.role === "user" && (
                    <Avatar className="h-8 w-8 mt-1 shrink-0">
                      <AvatarFallback>
                        <IconUser className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                  )}
                </div>
              ))}

              {isTyping && (
                <div className="flex gap-3">
                  <Avatar className="h-8 w-8 mt-1 shrink-0">
                    <AvatarFallback className="bg-primary/10">
                      <IconSparkles className="h-4 w-4 text-primary" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="rounded-2xl px-4 py-3 bg-card border border-border">
                    <div className="flex gap-1">
                      <div className="h-2 w-2 animate-bounce rounded-full bg-primary" />
                      <div className="h-2 w-2 animate-bounce rounded-full bg-primary [animation-delay:150ms]" />
                      <div className="h-2 w-2 animate-bounce rounded-full bg-primary [animation-delay:300ms]" />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      )}

      {/* Input Area */}
      <div className="flex flex-col gap-4">
        <div className="flex min-h-[120px] flex-col rounded-2xl cursor-text border border-border shadow-lg">
          {/* Attached Files Display */}
          {uploadedAssets.length > 0 && (
            <div className="flex flex-wrap gap-2 p-3 pb-0">
              {uploadedAssets.map((asset) => (
                <div
                  key={asset.id}
                  className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 text-primary rounded-lg text-sm border border-primary/20"
                >
                  <IconFile className="h-4 w-4" />
                  <span className="max-w-[150px] truncate">{asset.name}</span>
                  <button
                    onClick={() => handleRemoveAsset(asset.id)}
                    className="hover:bg-primary/20 rounded-full p-0.5 transition-colors"
                    aria-label="Remove file"
                  >
                    <IconX className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex-1 relative overflow-y-auto max-h-[258px]">
            <Textarea
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder={isVoiceChatActive ? "Voice mode active - text input disabled" : "Ask about RBI, SEBI regulations, or compliance requirements..."}
              disabled={isVoiceChatActive}
              className="bg-transparent w-full border-0 p-3 transition-[padding] duration-200 ease-in-out max-h-[258px] outline-none text-[16px] resize-none shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 whitespace-pre-wrap wrap-break-word disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>

          <div className="flex min-h-10 items-center gap-2 p-2 pb-1">
            {/* Voice Chat Component */}
            <div className="flex items-center gap-2">
              {secret?.lyzr_agent_id && secret?.lyzr_api_key && user?.primaryEmailAddress?.emailAddress && sessionId && (
                <VoiceChat
                  session_id={sessionId}
                  user_id={user.primaryEmailAddress.emailAddress}
                  agent_id={secret.lyzr_agent_id}
                  api_key={secret.lyzr_api_key}
                  setMessages={setMessages}
                  setIsResponseLoading={handleSetIsTyping}
                  setIsVoiceChatActive={handleSetIsVoiceChatActive}
                  isStreaming={false}
                />
              )}
            </div>

            <div className="ml-auto flex items-center gap-3">
              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={handleFileUpload}
                accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
                aria-label="Upload file"
              />
              
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-muted-foreground hover:text-foreground transition-all duration-100"
                title="Attach documents"
                disabled={isVoiceChatActive || isUploadingFile}
                onClick={() => fileInputRef.current?.click()}
              >
                {isUploadingFile ? (
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                ) : (
                  <IconFile className="h-5 w-5" />
                )}
              </Button>

              <Button
                variant="ghost"
                size="icon"
                onClick={handleSend}
                className={cn(
                  "h-6 w-6 rounded-full transition-all duration-100 cursor-pointer",
                  !isVoiceChatActive ? "bg-primary hover:bg-primary/90" : "bg-muted cursor-not-allowed"
                )}
                disabled={!inputValue || isVoiceChatActive}
              >
                <IconArrowUp className="h-4 w-4 text-primary-foreground" />
              </Button>
            </div>
          </div>
        </div>

        {/* Prompt Suggestions - Only show when no user messages */}
        {!hasUserMessages && (
          <div className="flex flex-wrap justify-center gap-2">
            {PROMPTS.map((button) => {
              const IconComponent = button.icon;
              return (
                <Button
                  key={button.text}
                  variant="ghost"
                  className="group flex items-center gap-2 rounded-full border px-3 py-2 text-sm text-foreground transition-all duration-200 hover:bg-muted/30 h-auto bg-transparent dark:bg-muted"
                  onClick={() => handlePromptClick(button.prompt)}
                >
                  <IconComponent className="h-4 w-4 text-muted-foreground transition-colors group-hover:text-foreground" />
                  <span>{button.text}</span>
                </Button>
              );
            })}
          </div>
        )}
      </div>

      <Timeline 
        activities={activities} 
        isOpen={isTimelineOpen} 
        onToggle={() => setIsTimelineOpen(!isTimelineOpen)}
      />
    </div>
  );
}
