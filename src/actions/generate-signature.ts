'use server';

import { generateApiSignature } from '@/lib/security';

/**
 * Server action to generate API signature
 * @param payload - Stringified JSON payload (without signature field)
 * @returns Generated signature
 */
export async function generateSignatureAction(payload: string): Promise<string> {
    try {
        const signature = generateApiSignature(payload);
        return signature;
    } catch (error) {
        console.error('Signature generation error:', error);
        throw new Error('Failed to generate signature');
    }
}
