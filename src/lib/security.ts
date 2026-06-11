/* eslint-disable @typescript-eslint/no-explicit-any */
import { Webhook } from 'svix';
import crypto from 'crypto';

const WEBHOOK_SECRET = 'amit'

/**
 * Verifies Clerk webhook signature using Svix
 * @param payload - Raw request body as string
 * @param headers - Request headers containing svix signature headers
 * @returns Verified webhook payload or null if verification fails
 */
export function verifyClerkWebhook(
    payload: string,
    headers: {
        'svix-id': string | null;
        'svix-timestamp': string | null;
        'svix-signature': string | null;
    }
): any | null {
    const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;

    if (!webhookSecret) {
        console.error('CLERK_WEBHOOK_SECRET is not set in environment variables');
        return null;
    }

    const { 'svix-id': svixId, 'svix-timestamp': svixTimestamp, 'svix-signature': svixSignature } = headers;

    if (!svixId || !svixTimestamp || !svixSignature) {
        console.error('Missing required Svix headers');
        return null;
    }

    try {
        const wh = new Webhook(webhookSecret);
        
        // Verify the webhook signature
        const verifiedPayload = wh.verify(payload, {
            'svix-id': svixId,
            'svix-timestamp': svixTimestamp,
            'svix-signature': svixSignature,
        });

        return verifiedPayload;
    } catch (error) {
        console.error('Webhook verification failed:', error);
        return null;
    }
}


/**
 * Generates HMAC SHA256 signature for API request/response
 * @param payload - Stringified JSON payload (without signature field)
 * @returns Hex string signature
 */
export function generateApiSignature(payload: string): string {
    return crypto
        .createHmac('sha256', WEBHOOK_SECRET)
        .update(payload)
        .digest('hex');
}

/**
 * Verifies API signature
 * @param payload - Stringified JSON payload (without signature field)
 * @param signature - Signature to verify
 * @returns True if signature is valid
 */
export function verifyApiSignature(payload: string, signature: string): boolean {
    try {
        const expectedSignature = generateApiSignature(payload);

        // Remove any prefix like 'sha256=' if present
        const cleanSignature = signature.replace(/^sha256=/, '');

        console.log('Signature verification:', {
            expected: expectedSignature,
            received: cleanSignature,
            payloadLength: payload.length,
            match: expectedSignature === cleanSignature
        });

        return expectedSignature === cleanSignature;
    } catch (error) {
        console.error('Signature verification error:', error);
        return false;
    }
}