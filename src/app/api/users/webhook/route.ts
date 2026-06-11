/* eslint-disable @typescript-eslint/no-explicit-any */
// src/app/api/users/webhook/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { verifyClerkWebhook } from "@/lib/security";

// Zod Schema for Clerk User Webhook Data (for create/update events)
const clerkUserSchema = z.object({
    id: z.string(),
    email_addresses: z.array(
        z.object({
            email_address: z.string().email(),
            id: z.string(),
            linked_to: z.array(z.any()).optional(),
            object: z.string().optional(),
            reserved: z.boolean().optional(),
            verification: z.object({
                status: z.string(),
                strategy: z.string().optional(),
                attempts: z.number().nullable().optional(),
                expire_at: z.number().nullable().optional(),
            }).optional(),
        })
    ),
    primary_email_address_id: z.string().nullable().optional(),
    first_name: z.string().optional().nullable(),
    last_name: z.string().optional().nullable(),
    image_url: z.string().optional().nullable(),
    profile_image_url: z.string().optional().nullable(),
    username: z.string().optional().nullable(),
    created_at: z.number().optional(),
    updated_at: z.number().optional(),
    object: z.string().optional(),
    
    // Additional fields from update payload
    birthday: z.string().optional(),
    gender: z.string().optional(),
    last_sign_in_at: z.number().nullable().optional(),
    password_enabled: z.boolean().optional(),
    phone_numbers: z.array(z.any()).optional(),
    primary_phone_number_id: z.string().nullable().optional(),
    primary_web3_wallet_id: z.string().nullable().optional(),
    private_metadata: z.record(z.string(), z.any()).optional(),
    public_metadata: z.record(z.string(), z.any()).optional(),
    unsafe_metadata: z.record(z.string(), z.any()).optional(),
    two_factor_enabled: z.boolean().optional(),
    external_accounts: z.array(z.any()).optional(),
    external_id: z.string().nullable().optional(),
    web3_wallets: z.array(z.any()).optional(),
});

// Zod Schema for Clerk User Delete Event (simplified payload)
const clerkUserDeleteSchema = z.object({
    id: z.string(),
    deleted: z.boolean(),
    object: z.literal("user"),
});

// Webhook Event Schema - discriminated union based on event type
const webhookEventSchema = z.discriminatedUnion("type", [
    z.object({
        data: clerkUserSchema,
        type: z.literal("user.created"),
        object: z.literal("event"),
        timestamp: z.number().optional(),
        event_attributes: z.any().optional(),
    }),
    z.object({
        data: clerkUserSchema,
        type: z.literal("user.updated"),
        object: z.literal("event"),
        timestamp: z.number().optional(),
        event_attributes: z.any().optional(),
    }),
    z.object({
        data: clerkUserDeleteSchema,
        type: z.literal("user.deleted"),
        object: z.literal("event"),
        timestamp: z.number().optional(),
        event_attributes: z.any().optional(),
    }),
]);

export async function POST(req: NextRequest) {
    try {
        // Get raw body as text
        const body = await req.text();

        // Get Svix headers
        const svixId = req.headers.get("svix-id");
        const svixTimestamp = req.headers.get("svix-timestamp");
        const svixSignature = req.headers.get("svix-signature");

        // Verify webhook signature
        const payload = verifyClerkWebhook(body, {
            "svix-id": svixId,
            "svix-timestamp": svixTimestamp,
            "svix-signature": svixSignature,
        });

        if (!payload) {
            return NextResponse.json(
                { success: false, error: "Invalid webhook signature" },
                { status: 401 }
            );
        }

        // Parse and validate webhook event
        const parsed = webhookEventSchema.safeParse(payload);
        if (!parsed.success) {
            console.error("Webhook validation error:", parsed.error.format());
            return NextResponse.json(
                { success: false, error: "Invalid webhook payload", details: parsed.error.format() },
                { status: 400 }
            );
        }

        const { data: userData, type: eventType } = parsed.data;

        // Extract user information - handle based on event type
        const clerkId = userData.id;

        // Handle user.deleted separately as it has a different payload structure
        if (eventType === "user.deleted") {
            try {
                // First, get the user and count related records before deletion
                const userToDelete = await prisma.user.findUnique({
                    where: { clerkId },
                    include: {
                        _count: {
                            select: {
                                documents: true,
                                chats: true,
                            }
                        }
                    }
                });

                if (!userToDelete) {
                    console.warn("User not found for deletion:", clerkId);
                    return NextResponse.json(
                        { success: true, message: "User already deleted or not found" },
                        { status: 200 }
                    );
                }

                // Delete the user - Prisma will automatically cascade delete related records
                // due to onDelete: Cascade in the schema
                await prisma.user.delete({
                    where: { clerkId },
                });

                console.log("User deleted successfully:", {
                    clerkId,
                    email: userToDelete.email,
                    deletedRelations: {
                        documents: userToDelete._count.documents,
                        chats: userToDelete._count.chats,
                        // reviews: userToDelete._count.reviews,
                    }
                });

                return NextResponse.json({
                    success: true,
                    message: "User and all related data deleted successfully",
                    deletedCounts: {
                        documents: userToDelete._count.documents,
                        chats: userToDelete._count.chats,
                        // reviews: userToDelete._count.reviews,
                    }
                }, { status: 200 });
            } catch (error: any) {
                if (error.code === 'P2025') {
                    console.warn("User not found for deletion:", clerkId);
                    return NextResponse.json(
                        { success: true, message: "User already deleted or not found" },
                        { status: 200 }
                    );
                }
                throw error;
            }
        }

        // For user.created and user.updated, extract full user data
        // Type guard: we know userData is not the delete type here
        if (!('email_addresses' in userData)) {
            return NextResponse.json(
                { success: false, error: "Invalid user data for create/update event" },
                { status: 400 }
            );
        }
        
        // Get primary email or first available email
        const primaryEmail = userData.email_addresses.find(
            (email: any) => email.id === userData.primary_email_address_id
        );
        const email = primaryEmail?.email_address || userData.email_addresses[0]?.email_address;

        if (!email) {
            return NextResponse.json(
                { success: false, error: "No email address found" },
                { status: 400 }
            );
        }

        const firstName = userData.first_name || undefined;
        const lastName = userData.last_name || undefined;
        const avatar = userData.image_url || userData.profile_image_url || undefined;

        // Handle user.created event
        if (eventType === "user.created") {
            try {
                const user = await prisma.user.create({
                    data: {
                        clerkId,
                        email,
                        firstName,
                        lastName,
                        avatar,
                    },
                });

                console.log("User created successfully:", { id: user.id, clerkId: user.clerkId, email: user.email });
                return NextResponse.json({ success: true, data: user }, { status: 201 });
            } catch (error: any) {
                if (error.code === 'P2002') {
                    console.warn("User already exists:", clerkId);
                    // Try to update instead
                    const user = await prisma.user.update({
                        where: { clerkId },
                        data: {
                            email,
                            firstName,
                            lastName,
                            avatar,
                        },
                    });
                    return NextResponse.json({ success: true, data: user, message: "User already existed, updated instead" }, { status: 200 });
                }
                throw error;
            }
        }

        // Handle user.updated event
        if (eventType === "user.updated") {
            try {
                const user = await prisma.user.update({
                    where: { clerkId },
                    data: {
                        email,
                        firstName,
                        lastName,
                        avatar,
                    },
                });

                console.log("User updated successfully:", { id: user.id, clerkId: user.clerkId, email: user.email });
                return NextResponse.json({ success: true, data: user }, { status: 200 });
            } catch (error: any) {
                if (error.code === 'P2025') {
                    console.warn("User not found for update, creating instead:", clerkId);
                    // User doesn't exist, create it
                    const user = await prisma.user.create({
                        data: {
                            clerkId,
                            email,
                            firstName,
                            lastName,
                            avatar,
                        },
                    });
                    return NextResponse.json({ success: true, data: user, message: "User didn't exist, created instead" }, { status: 201 });
                }
                throw error;
            }
        }

        return NextResponse.json(
            { success: false, error: "Unhandled event type" },
            { status: 400 }
        );
    } catch (error: any) {
        console.error("User Webhook Error:", error);
        
        // Handle Prisma errors specifically
        if (error.code === 'P2002') {
            return NextResponse.json(
                { success: false, error: "User already exists with this email or clerkId" },
                { status: 409 }
            );
        }

        if (error.code === 'P2025') {
            return NextResponse.json(
                { success: false, error: "User not found in database" },
                { status: 404 }
            );
        }

        // MongoDB connection errors
        if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
            return NextResponse.json(
                { success: false, error: "Database connection failed" },
                { status: 503 }
            );
        }

        return NextResponse.json(
            { success: false, error: error.message || "Internal Server Error" },
            { status: 500 }
        );
    }
}