import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { agentChat } from "@/lib/lyzrService";

export async function GET() {
    try {
        // Get current user
        const user = await currentUser();

        if (!user) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        // Get API keys from environment
        const lyzrApiKey = process.env.LYZR_API_KEY;
        const lyzrUpdatesAgentId = process.env.LYZR_UPDATES_AGENT_ID;

        if (!lyzrApiKey || !lyzrUpdatesAgentId) {
            return NextResponse.json(
                { error: "Missing API configuration" },
                { status: 500 }
            );
        }

        // Call Lyzr agent to get regulatory updates
        const response = await agentChat(
            user.id,
            lyzrUpdatesAgentId,
            lyzrApiKey,
            "Provide the latest regulatory updates in the financial industry in India"
        );

        // Parse the response to extract updates
        let updates = [];

        try {
            // Try to parse the response as JSON
            const responseText = response.response || JSON.stringify(response);

            // Check if response contains a JSON array
            if (responseText.includes("[") && responseText.includes("]")) {
                // Extract JSON array from response
                const jsonMatch = responseText.match(/\[[\s\S]*\]/);
                if (jsonMatch) {
                    updates = JSON.parse(jsonMatch[0]);
                }
            }
        } catch (error) {
            console.error("Error parsing updates response:", error);
            return NextResponse.json(
                { error: "Failed to parse updates", rawResponse: response },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            updates,
            count: updates.length
        });

    } catch (error) {
        console.error("Error fetching regulatory updates:", error);
        return NextResponse.json(
            { error: "Failed to fetch regulatory updates" },
            { status: 500 }
        );
    }
}