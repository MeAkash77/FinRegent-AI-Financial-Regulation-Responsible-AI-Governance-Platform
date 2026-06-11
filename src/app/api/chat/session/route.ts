import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

// Save a new chat session
export async function POST(request: Request) {
    try {
        const user = await currentUser();

        if (!user) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const { sessionId } = await request.json();

        if (!sessionId) {
            return NextResponse.json(
                { error: "sessionId is required" },
                { status: 400 }
            );
        }

        // Check if session already exists
        const existingSession = await prisma.chat.findFirst({
            where: {
                userId: user.id,
                sessionId: sessionId,
            },
        });

        if (existingSession) {
            return NextResponse.json({
                message: "Session already exists",
                chat: existingSession,
            });
        }

        // Create new chat session
        const chat = await prisma.chat.create({
            data: {
                userId: user.id,
                sessionId: sessionId,
            },
        });

        return NextResponse.json({
            message: "Chat session created successfully",
            chat,
        });
    } catch (error) {
        console.error("Error creating chat session:", error);
        return NextResponse.json(
            { error: "Failed to create chat session" },
            { status: 500 }
        );
    }
}

// Get all chat sessions for the current user
export async function GET() {
    try {
        const user = await currentUser();

        if (!user) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const chats = await prisma.chat.findMany({
            where: { userId: user.id },
            orderBy: { createdAt: "desc" },
        });

        return NextResponse.json({
            chats,
        });
    } catch (error) {
        console.error("Error fetching chat sessions:", error);
        return NextResponse.json(
            { error: "Failed to fetch chat sessions" },
            { status: 500 }
        );
    }
}
