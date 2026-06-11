/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextRequest, NextResponse } from "next/server";
import { agentChat } from "@/lib/lyzrService";
import { generateApiSignature, verifyApiSignature } from "@/lib/security";

/**
 * POST /api/lyzr/chat
 * Handles chat requests to Lyzr AI agent with signature verification
 * Client provides: user_id, agent_id, session_id, message
 */
export async function POST(req: NextRequest) {
    try {
        // Parse request body
        const rawBody = await req.text();
        let payload;
        
        try {
            payload = JSON.parse(rawBody);
        } catch (error) {
            return NextResponse.json(
                { error: "Invalid JSON format" },
                { status: 400 }
            );
        }

        const { message, sessionId, agentId, userId, signature, assets } = payload;

        // Check if signature is present
        if (!signature) {
            return NextResponse.json(
                { error: "Missing signature in request body" },
                { status: 400 }
            );
        }

        // Remove signature from payload and verify
        const { signature: _, ...payloadWithoutSignature } = payload;
        const payloadForVerification = JSON.stringify(payloadWithoutSignature);
        
        const isValidSignature = verifyApiSignature(payloadForVerification, signature);
        
        if (!isValidSignature) {
            console.error('Signature verification failed:', {
                receivedSignature: signature,
                payloadLength: payloadForVerification.length
            });
            return NextResponse.json(
                { error: "Invalid signature" },
                { status: 403 }
            );
        }

        // Validate required fields
        if (!message || typeof message !== "string") {
            return NextResponse.json(
                { error: "Message is required and must be a string" },
                { status: 400 }
            );
        }

        if (!userId || typeof userId !== "string") {
            return NextResponse.json(
                { error: "userId is required and must be a string" },
                { status: 400 }
            );
        }

        if (!agentId || typeof agentId !== "string") {
            return NextResponse.json(
                { error: "agentId is required and must be a string" },
                { status: 400 }
            );
        }

        // Get Lyzr API key from environment
        const lyzrApiKey = process.env.LYZR_API_KEY;
        
        if (!lyzrApiKey) {
            console.error("LYZR_API_KEY is not set in environment variables");
            return NextResponse.json(
                { error: "Server configuration error" },
                { status: 500 }
            );
        }

        // Call Lyzr chat service
        const response = await agentChat(
            userId,
            agentId,
            lyzrApiKey,
            message,
            sessionId,
            assets // Pass assets array if present
        );

        // Generate response signature
        const responseBody = JSON.stringify(response);
        const responseSignature = generateApiSignature(responseBody);

        // Return response with signature
        return new NextResponse(responseBody, {
            status: 200,
            headers: {
                "Content-Type": "application/json",
                "x-signature": responseSignature,
            },
        });
    } catch (error) {
        console.error("Error in Lyzr chat API:", error);
        
        const errorMessage = error instanceof Error ? error.message : "Internal server error";
        const errorBody = JSON.stringify({ error: errorMessage });
        const errorSignature = generateApiSignature(errorBody);
        
        return new NextResponse(errorBody, {
            status: 500,
            headers: {
                "Content-Type": "application/json",
                "x-signature": errorSignature,
            },
        });
    }
}
