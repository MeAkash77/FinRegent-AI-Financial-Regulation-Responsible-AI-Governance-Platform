/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useRef, useState, useEffect } from "react";
import hark from "hark";
import { Mic, MicOff } from "lucide-react";
import MultiLineCircularVisualizer from "./voice-visulizer";
import { Message } from "@/components/chat";

// Polyfill webkitAudioContext for hark library
if (typeof window !== 'undefined' && !('webkitAudioContext' in window)) {
    (window as any).webkitAudioContext = window.AudioContext || (window as any).AudioContext;
}

interface VoiceChatProps {
    session_id: string;
    user_id: string;
    agent_id: string;
    api_key?: string;
    setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
    setIsResponseLoading: (value: boolean) => void;
    setIsVoiceChatActive: (value: boolean) => void;
    isStreaming: boolean;
}

const VoiceChat: React.FC<VoiceChatProps> = ({
    session_id,
    user_id,
    agent_id,
    api_key,
    setMessages,
    setIsResponseLoading,
    setIsVoiceChatActive,
    isStreaming,
}) => {
    const wsRef = useRef<WebSocket | null>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const harkRef = useRef<any>(null);
    const silenceTimeoutRef = useRef<number | null>(null);
    const autoStopTimeoutRef = useRef<number | null>(null);
    const isSpeakingRef = useRef(false);
    const currentStreamRef = useRef<MediaStream | null>(null);
    const isConnectingRef = useRef(false); // Prevent concurrent connection attempts
    const connectionUrlRef = useRef<string>(""); // Track current connection URL

    const [connectionStatus, setConnectionStatus] = useState<
        "disconnected" | "connecting" | "connected"
    >("disconnected");
    const [isRecording, setIsRecording] = useState(false);
    const [shouldStartRecording, setShouldStartRecording] = useState(false);
    const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);

    const audioRef = useRef<HTMLAudioElement>(null);
    const mediaSourceRef = useRef<MediaSource | null>(null);
    const sourceBufferRef = useRef<SourceBuffer | null>(null);
    const queueRef = useRef<Uint8Array[]>([]);
    const isBufferUpdatingRef = useRef(false);
    const shouldSendLastChunkRef = useRef(true);

    const log = (message: string, category: string = "App") => {
        const timestamp = new Date().toISOString().slice(11, 23);
        console.log(`[${timestamp}] [${category}] ${message}`);
    };

    const connectWebSocket = async () => {
        if (!api_key) {
            console.error("API key is required for VoiceChat");
            return;
        }
        
        const wsUrl = `wss://agent-prod.studio.lyzr.ai/ws/listen_audio/${session_id}?x-api-key=${encodeURIComponent(api_key)}`;
        
        // If already connected to the same URL, don't reconnect
        if (wsRef.current && 
            wsRef.current.readyState === WebSocket.OPEN && 
            connectionUrlRef.current === wsUrl) {
            log("WebSocket already connected to this session", "WebSocket");
            return;
        }
        
        // If connecting is in progress, don't start another connection
        if (isConnectingRef.current) {
            log("Connection already in progress, skipping...", "WebSocket");
            return;
        }
        
        // Close existing connection if URL changed
        if (wsRef.current && connectionUrlRef.current !== wsUrl) {
            log("Closing existing connection for new session", "WebSocket");
            wsRef.current.close();
            wsRef.current = null;
        }
        
        isConnectingRef.current = true;
        setConnectionStatus("connecting");
        
        try {
            wsRef.current = new WebSocket(wsUrl);
            wsRef.current.binaryType = "arraybuffer";
            connectionUrlRef.current = wsUrl;

            wsRef.current.onopen = () => {
                log("WebSocket connection established", "WebSocket");
                setConnectionStatus("connected");
                isConnectingRef.current = false;
            };

            wsRef.current.onmessage = (event) => {
                if (typeof event.data === "string") {
                    // Check for plain text error messages first
                    if (event.data.includes("ERROR") || event.data.includes("error")) {
                        console.error("WebSocket error response:", event.data);
                        log(`Error response received: ${event.data}`, "WebSocket");
                        return;
                    }
                    
                    try {
                        const parsed = JSON.parse(event.data);
                        log(`WebSocket message type: ${parsed.type}`, "WebSocket");
                        
                        // Handle error responses
                        if (parsed.type === "error" || parsed.error) {
                            console.error("WebSocket error response:", parsed);
                            log(`Error received: ${JSON.stringify(parsed)}`, "WebSocket");
                            return;
                        }

                        if (parsed.type === "transcript") {
                            if (parsed.text == "" || !parsed.text) {
                                setMessages((prev) => {
                                    const newMessages = [...prev];
                                    if (
                                        newMessages.length > 0 &&
                                        newMessages[newMessages.length - 1].role === "loading"
                                    ) {
                                        newMessages.pop();
                                    }
                                    return [...newMessages];
                                });
                                return;
                            }

                            log(`Transcript received: ${parsed.text}`, "WebSocket");

                            // Add user message to chat with unique ID
                            const userMessage = {
                                id: `voice-user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                                role: "user" as const,
                                content: parsed.text,
                                timestamp: new Date()
                            };

                            // Add loading message to show AI is processing
                            const loadingMessage = {
                                id: `loading-${Date.now()}`,
                                role: "loading" as const,
                                content: "AI is thinking...",
                                timestamp: new Date()
                            };

                            setMessages((prev) => {
                                const newMessages = [...prev];
                                // Remove any existing loading messages
                                if (
                                    newMessages.length > 0 &&
                                    newMessages[newMessages.length - 1].role === "loading"
                                ) {
                                    newMessages.pop();
                                }
                                return [...newMessages, userMessage, loadingMessage];
                            });

                            setIsResponseLoading(true);
                            log(`User message and loading indicator added`, "WebSocket");
                        }

                        if (parsed.type === "response_text") {
                            log(`Response text received: ${parsed.text.substring(0, 100)}...`, "WebSocket");
                            
                            const assistantMessage = {
                                id: `voice-assistant-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                                role: "assistant" as const,
                                content: parsed.text,
                                timestamp: new Date()
                            };

                            setMessages((prev) => {
                                const updated = [...prev];
                                // Remove loading message if exists
                                if (updated.length > 0 && updated[updated.length - 1]?.role === "loading") {
                                    updated.pop();
                                    log("Removed loading message", "WebSocket");
                                }
                                
                                // Check if this message already exists (prevent duplicates)
                                const existingMessageIndex = updated.findIndex(
                                    msg => msg.role === "assistant" && 
                                    msg.content === parsed.text &&
                                    Date.now() - new Date(msg.timestamp).getTime() < 2000 // Within 2 seconds
                                );
                                
                                if (existingMessageIndex !== -1) {
                                    log("Duplicate message detected, skipping", "WebSocket");
                                    return updated;
                                }
                                
                                const newMessages = [...updated, assistantMessage];
                                log(`Added assistant message, total messages: ${newMessages.length}`, "WebSocket");
                                return newMessages;
                            });

                            setIsResponseLoading(false);
                            log(`Response processing complete`, "WebSocket");
                        }

                        if (parsed.type === "audio_start") {
                            mediaSourceRef.current = new MediaSource();
                            queueRef.current = [];

                            audioRef.current!.src = URL.createObjectURL(
                                mediaSourceRef.current
                            );
                            audioRef.current!.play().catch(console.error);

                            mediaSourceRef.current.onsourceopen = () => {
                                const mime = "audio/webm;codecs=opus";
                                const sourceBuffer =
                                    mediaSourceRef.current!.addSourceBuffer(mime);
                                sourceBuffer.mode = "sequence";
                                sourceBufferRef.current = sourceBuffer;

                                sourceBuffer.addEventListener("updateend", () => {
                                    isBufferUpdatingRef.current = false;
                                    processQueue();
                                });

                                log("MediaSource opened, SourceBuffer created", "AudioPlayer");
                            };
                        }

                        if (parsed.type === "audio_end") {
                            try {
                                // Wait for any pending buffer updates before ending stream
                                if (mediaSourceRef.current?.readyState === "open") {
                                    if (isBufferUpdatingRef.current || queueRef.current.length > 0) {
                                        // Wait for updates to complete
                                        const waitForBufferReady = () => {
                                            if (!isBufferUpdatingRef.current && queueRef.current.length === 0) {
                                                if (mediaSourceRef.current?.readyState === "open") {
                                                    mediaSourceRef.current.endOfStream();
                                                    log("Audio stream ended", "AudioPlayer");
                                                }
                                            } else {
                                                setTimeout(waitForBufferReady, 50);
                                            }
                                        };
                                        waitForBufferReady();
                                    } else {
                                        mediaSourceRef.current.endOfStream();
                                        log("Audio stream ended", "AudioPlayer");
                                    }
                                }
                            } catch (e) {
                                console.error("Error ending MediaSource stream:", e);
                            }
                        }
                    } catch (err) {
                        console.error("Error parsing WebSocket text message:", err);
                    }
                } else if (
                    event.data instanceof ArrayBuffer &&
                    sourceBufferRef.current
                ) {
                    queueRef.current.push(new Uint8Array(event.data));
                    processQueue();
                }
            };

            wsRef.current.onclose = () => {
                log("WebSocket connection closed", "WebSocket");

                if (audioRef.current) {
                    audioRef.current.pause();
                    audioRef.current.currentTime = 0;
                    audioRef.current.src = "";
                }

                // Stop recording properly before cleanup
                if (isRecording) {
                    stopRecording();
                }

                // ✅ Remove all trailing loading messages on close
                setMessages((prev) => {
                    const newMessages = [...prev];
                    while (
                        newMessages.length > 0 &&
                        newMessages[newMessages.length - 1].role === "loading"
                    ) {
                        newMessages.pop();
                    }
                    return newMessages;
                });

                cleanupAudioStream();
                setConnectionStatus("disconnected");
                isConnectingRef.current = false;
                wsRef.current = null;
                connectionUrlRef.current = "";
            };
        } catch (error) {
            console.error("WebSocket connection error:", error);
            setConnectionStatus("disconnected");
            isConnectingRef.current = false;
        }
    };

    const processQueue = () => {
        if (
            !sourceBufferRef.current ||
            isBufferUpdatingRef.current ||
            queueRef.current.length === 0
        )
            return;
        const chunk = queueRef.current.shift();
        if (!chunk) return;
        try {
            // Normalize to ArrayBuffer to satisfy SourceBuffer.appendBuffer BufferSource typing
            const buffer = chunk instanceof Uint8Array ? (chunk.buffer as ArrayBuffer) : new Uint8Array(chunk).buffer;
            sourceBufferRef.current.appendBuffer(buffer);
            isBufferUpdatingRef.current = true;
        } catch (err) {
            console.error("Error appending buffer:", err);
        }
    };

    const sendAudioBlob = (audioBlob: Blob) => {
        const metadata = {
            user_id,
            // TODO: need to make it dynamic
            agent_id: "68e952748d106b3b3ab6d75b",
            session_id,
            audio_format: "webm;codecs=opus",
            "x-api-key": api_key,
            is_streaming: isStreaming,
        };

        const metaStr = JSON.stringify(metadata);
        const encoder = new TextEncoder();
        const metaBytes = encoder.encode(metaStr);
        const header = new DataView(new ArrayBuffer(4));
        header.setUint32(0, metaBytes.length, true);

        audioBlob.arrayBuffer().then((audioBuffer) => {
            const combined = new Uint8Array(
                header.byteLength + metaBytes.length + audioBuffer.byteLength
            );
            combined.set(new Uint8Array(header.buffer), 0);
            combined.set(metaBytes, header.byteLength);
            combined.set(
                new Uint8Array(audioBuffer),
                header.byteLength + metaBytes.length
            );
            wsRef.current?.send(combined.buffer);
            log(`Sent audio blob of size ${audioBlob.size}`, "Sender");
        });
    };

    const startNewRecorder = (stream: MediaStream) => {
        const recorder = new MediaRecorder(stream, {
            mimeType: "audio/webm;codecs=opus",
        });

        recorder.ondataavailable = (event) => {
            if (event.data.size > 0 && shouldSendLastChunkRef.current) {
                sendAudioBlob(event.data);
            } else {
                log("Discarded final stale audio chunk", "Recorder");
            }
        };

        recorder.onstop = () => {
            if (isSpeakingRef.current) {
                mediaRecorderRef.current = startNewRecorder(stream);
                mediaRecorderRef.current.start();
                log("Recorder restarted after silence", "Recorder");
            }
        };

        return recorder;
    };

    const startRecording = async () => {
        if (!wsRef.current || connectionStatus !== "connected") {
            log("Cannot start recording: WebSocket not connected", "Recorder");
            return;
        }

        try {
            log("Requesting microphone access...", "Recorder");
            const stream = await navigator.mediaDevices.getUserMedia({ 
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    sampleRate: 44100
                } 
            });
            
            log("Microphone access granted", "Recorder");
            setMediaStream(stream);
            currentStreamRef.current = stream;

            harkRef.current = hark(stream, { interval: 40, threshold: -68 });

            harkRef.current.on("speaking", () => {
                log("Started speaking", "VAD");

                isSpeakingRef.current = true;

                if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);
                if (autoStopTimeoutRef.current)
                    clearTimeout(autoStopTimeoutRef.current);
            });

            harkRef.current.on("stopped_speaking", () => {
                log("Stopped speaking, stopping recorder after 1000ms", "VAD");

                if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);
                silenceTimeoutRef.current = window.setTimeout(() => {
                    isSpeakingRef.current = true;
                    shouldSendLastChunkRef.current = true;
                    mediaRecorderRef.current?.stop();
                }, 1000);

                if (autoStopTimeoutRef.current)
                    clearTimeout(autoStopTimeoutRef.current);
                autoStopTimeoutRef.current = window.setTimeout(() => {
                    log("Silence lasted 30s, auto-stopping recording", "VAD");
                    shouldSendLastChunkRef.current = false;
                    stopRecording();
                }, 30000);
            });

            mediaRecorderRef.current = startNewRecorder(stream);
            mediaRecorderRef.current.start();
            setIsRecording(true);
            setIsVoiceChatActive(true);
            log("MediaRecorder started successfully", "Recorder");
        } catch (error) {
            console.error("Recording setup error:", error);
            log(`Recording setup failed: ${error}`, "Recorder");
            
            // Clean up on error
            if (currentStreamRef.current) {
                currentStreamRef.current.getTracks().forEach((track) => track.stop());
            }
            setMediaStream(null);
            setIsRecording(false);
            setIsVoiceChatActive(false);
        }
    };

    const stopRecording = () => {
        log("Stopping recording and cleaning up...", "Recorder");
        
        if (silenceTimeoutRef.current) {
            clearTimeout(silenceTimeoutRef.current);
            silenceTimeoutRef.current = null;
        }
        if (autoStopTimeoutRef.current) {
            clearTimeout(autoStopTimeoutRef.current);
            autoStopTimeoutRef.current = null;
        }
        
        // Stop MediaRecorder
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
            mediaRecorderRef.current.stop();
        }
        mediaRecorderRef.current = null;

        // Stop all media tracks
        if (currentStreamRef.current) {
            currentStreamRef.current.getTracks().forEach((track) => {
                track.stop();
                log(`Stopped track: ${track.kind}`, "Recorder");
            });
            currentStreamRef.current = null;
        }
        
        // Stop hark properly
        if (harkRef.current) {
            try {
                // Hark doesn't have a stop() method, we need to remove listeners and clean up
                harkRef.current.off("speaking");
                harkRef.current.off("stopped_speaking");
                harkRef.current = null;
                log("Hark cleanup completed", "VAD");
            } catch (error) {
                console.error("Error cleaning up hark:", error);
            }
        }
        
        setIsRecording(false);
        setIsVoiceChatActive(false);
        isSpeakingRef.current = false;
        setMediaStream(null);
        log("Recording stopped successfully", "Recorder");
    };

    const cleanupAudioStream = () => {
        sourceBufferRef.current = null;
        mediaSourceRef.current = null;
        queueRef.current = [];
        isBufferUpdatingRef.current = false;
    };

    useEffect(() => {
        if (
            shouldStartRecording &&
            connectionStatus === "connected" &&
            !isRecording
        ) {
            startRecording();
            setShouldStartRecording(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [shouldStartRecording, connectionStatus, isRecording]);

    // Cleanup on unmount only - don't recreate on prop changes
    useEffect(() => {
        return () => {
            log("Component unmounting, cleaning up...", "Lifecycle");
            if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
                wsRef.current.close();
            }
            stopRecording();
            cleanupAudioStream();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <div className="flex flex-col items-center space-y-4">
            <div className="flex items-center space-x-2 relative">
                <button
                    className={`rounded-md flex items-center justify-center p-0 m-0 focus:ring-0 focus:outline-none
            ${isRecording ? "h-16 w-16 bg-transparent" : "h-8 w-8 bg-black"}`}
                    onClick={async () => {
                        if (connectionStatus === "disconnected") {
                            log("Connecting to WebSocket...", "App");
                            setShouldStartRecording(true);
                            await connectWebSocket();
                        } else if (!isRecording) {
                            log("Starting recording...", "App");
                            await startRecording();
                        } else {
                            log("Stopping recording...", "App");
                            stopRecording();
                        }
                    }}
                    disabled={connectionStatus === "connecting"}
                    title={
                        connectionStatus === "connecting" 
                            ? "Connecting..." 
                            : isRecording 
                                ? "Stop recording" 
                                : "Start voice chat"
                    }
                >
                    {connectionStatus === "connecting" ? (
                        <span className="text-white text-xs">...</span>
                    ) : isRecording ? (
                        mediaStream ? (
                            <MultiLineCircularVisualizer
                                mediaStream={mediaStream}
                                isActive={isRecording}
                                size={64}
                            />
                        ) : (
                            <Mic className="h-4 w-4 text-white animate-pulse" />
                        )
                    ) : connectionStatus === "disconnected" ? (
                        <Mic className="h-4 w-4 text-white" />
                    ) : (
                        <MicOff className="h-4 w-4 text-white" />
                    )}
                </button>

                {connectionStatus === "connected" && (
                    <button
                        className="w-6 h-6 text-red-500 text-xs bg-red-500/10 rounded-full flex items-center justify-center ml-4"
                        onClick={() => {
                            log("Disconnect button clicked", "App");
                            stopRecording();
                            if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
                                wsRef.current.close();
                            }
                            setConnectionStatus("disconnected");
                        }}
                        title="Disconnect and stop recording"
                    >
                        X
                    </button>
                )}
            </div>

            <audio
                ref={audioRef}
                controls
                hidden
                className="mt-4 w-full max-w-md"
                onPlay={() => log("User initiated playback", "AudioPlayer")}
            />
        </div>
    );
};

// Memoize the component to prevent unnecessary re-renders
export default React.memo(VoiceChat, (prevProps, nextProps) => {
    // Only re-render if these critical props change
    return (
        prevProps.session_id === nextProps.session_id &&
        prevProps.api_key === nextProps.api_key &&
        prevProps.user_id === nextProps.user_id &&
        prevProps.agent_id === nextProps.agent_id &&
        prevProps.isStreaming === nextProps.isStreaming
    );
});