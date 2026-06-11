import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";

// Get chat history for a specific session from Lyzr API
export async function GET(request: Request) {
    try {
        const user = await currentUser();

        if (!user) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const { searchParams } = new URL(request.url);
        const sessionId = searchParams.get("sessionId");
        const apiKey = searchParams.get("apiKey");

        if (!sessionId || !apiKey) {
            return NextResponse.json(
                { error: "sessionId and apiKey are required" },
                { status: 400 }
            );
        }

        // Fetch chat history from Lyzr API
        const lyzrResponse = await fetch(
            `https://agent-prod.studio.lyzr.ai/v1/sessions/${sessionId}/history`,
            {
                method: "GET",
                headers: {
                    "x-api-key": apiKey,
                    "Content-Type": "application/json",
                },
            }
        );

        if (!lyzrResponse.ok) {
            const errorText = await lyzrResponse.text();
            console.error(`Lyzr API error: ${lyzrResponse.status} - ${errorText}`);
            throw new Error(`Lyzr API error: ${lyzrResponse.statusText}`);
        }

        const history = await lyzrResponse.json();

        // Lyzr returns an array directly, not nested in an object
        return NextResponse.json({
            history: Array.isArray(history) ? history : [],
        });
    } catch (error) {
        console.error("Error fetching chat history:", error);
        return NextResponse.json(
            { error: "Failed to fetch chat history" },
            { status: 500 }
        );
    }
}
