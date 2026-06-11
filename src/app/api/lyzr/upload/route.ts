import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/lyzr/upload
 * Handles file uploads to Lyzr API
 */
export async function POST(req: NextRequest) {
    try {
        // Get Lyzr API key from environment
        const lyzrApiKey = process.env.LYZR_API_KEY;
        
        if (!lyzrApiKey) {
            console.error("LYZR_API_KEY is not set in environment variables");
            return NextResponse.json(
                { error: "Server configuration error" },
                { status: 500 }
            );
        }

        // Get the form data from request
        const formData = await req.formData();
        
        // Create new FormData to forward to Lyzr API
        const lyzrFormData = new FormData();
        const file = formData.get("files");
        
        if (!file) {
            return NextResponse.json(
                { error: "No file provided" },
                { status: 400 }
            );
        }

        lyzrFormData.append("files", file);

        // Upload to Lyzr API
        const response = await fetch(
            "https://agent-prod.studio.lyzr.ai/v3/assets/upload",
            {
                method: "POST",
                headers: {
                    "accept": "application/json",
                    "x-api-key": lyzrApiKey,
                },
                body: lyzrFormData,
            }
        );

        if (!response.ok) {
            const errorText = await response.text();
            console.error("Lyzr upload error:", errorText);
            throw new Error("Failed to upload to Lyzr API");
        }

        const data = await response.json();

        return NextResponse.json(data, { status: 200 });
    } catch (error) {
        console.error("Error in upload API:", error);
        
        const errorMessage = error instanceof Error ? error.message : "Internal server error";
        
        return NextResponse.json(
            { error: errorMessage },
            { status: 500 }
        );
    }
}
