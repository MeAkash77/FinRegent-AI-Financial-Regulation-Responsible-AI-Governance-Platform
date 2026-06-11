import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

// Get cron job status for the current user
export async function GET() {
    try {
        const user = await currentUser();

        if (!user) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        // Get user-specific settings
        const settings = await prisma.systemSettings.findUnique({
            where: { userId: user.id },
        });

        return NextResponse.json({
            cronJobEnabled: settings?.cronJobEnabled ?? false,
            email: settings?.email ?? user.emailAddresses[0]?.emailAddress,
            sourceUrl: settings?.sourceUrl ?? "",
        });
    } catch (error) {
        console.error("Error fetching cron job settings:", error);
        return NextResponse.json(
            { error: "Failed to fetch settings" },
            { status: 500 }
        );
    }
}

// Update cron job status for the current user
export async function POST(request: Request) {
    try {
        const user = await currentUser();

        if (!user) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const { cronJobEnabled, sourceUrl } = await request.json();

        if (typeof cronJobEnabled !== "boolean") {
            return NextResponse.json(
                { error: "Invalid request body" },
                { status: 400 }
            );
        }

        if (sourceUrl && typeof sourceUrl !== "string") {
            return NextResponse.json(
                { error: "Invalid sourceUrl" },
                { status: 400 }
            );
        }

        // Get primary email address
        const email = user.emailAddresses[0]?.emailAddress;
        
        if (!email) {
            return NextResponse.json(
                { error: "User email not found" },
                { status: 400 }
            );
        }

        // Update or create user-specific settings
        const settings = await prisma.systemSettings.upsert({
            where: { userId: user.id },
            update: {
                cronJobEnabled,
                email,
                ...(sourceUrl && { sourceUrl }),
            },
            create: {
                userId: user.id,
                email,
                cronJobEnabled,
                sourceUrl: sourceUrl || "",
            },
        });

        return NextResponse.json({
            cronJobEnabled: settings.cronJobEnabled,
            email: settings.email,
            sourceUrl: settings.sourceUrl,
            message: `Cron job ${cronJobEnabled ? "enabled" : "disabled"} successfully`,
        });
    } catch (error) {
        console.error("Error updating cron job settings:", error);
        return NextResponse.json(
            { error: "Failed to update settings" },
            { status: 500 }
        );
    }
}
