/**
 * Type definitions for Clerk webhook payloads
 */

export interface ClerkEmailAddress {
    id: string;
    email_address: string;
    verification?: {
        status: string;
        strategy?: string;
        attempts?: number | null;
        expire_at?: number | null;
    };
    linked_to?: string[];
    object?: string;
    reserved?: boolean;
}

export interface ClerkUserData {
    id: string;
    email_addresses: ClerkEmailAddress[];
    primary_email_address_id: string | null;
    first_name: string | null;
    last_name: string | null;
    image_url?: string | null;
    profile_image_url?: string | null;
    username?: string | null;
    created_at?: number;
    updated_at?: number;
    last_sign_in_at?: number | null;
    last_active_at?: number | null;

    // Additional optional fields
    banned?: boolean;
    locked?: boolean;
    password_enabled?: boolean;
    two_factor_enabled?: boolean;
    totp_enabled?: boolean;
    backup_code_enabled?: boolean;
    mfa_enabled_at?: number | null;
    mfa_disabled_at?: number | null;

    // Metadata
    public_metadata?: Record<string, unknown>;
    private_metadata?: Record<string, unknown>;
    unsafe_metadata?: Record<string, unknown>;

    // External accounts
    external_accounts?: unknown[];
    phone_numbers?: unknown[];
    web3_wallets?: unknown[];
    passkeys?: unknown[];
    saml_accounts?: unknown[];
    enterprise_accounts?: unknown[];

    // Organization settings
    create_organization_enabled?: boolean;
    create_organizations_limit?: number | null;
    delete_self_enabled?: boolean;

    // Other
    external_id?: string | null;
    has_image?: boolean;
    legal_accepted_at?: number | null;
    lockout_expires_in_seconds?: number | null;
    verification_attempts_remaining?: number | null;
    object?: string;
}

export interface ClerkHttpRequest {
    client_ip: string;
    user_agent: string;
}

export interface ClerkEventAttributes {
    http_request: ClerkHttpRequest;
}

export interface ClerkWebhookEvent {
    data: ClerkUserData;
    type: 'user.created' | 'user.updated' | 'user.deleted';
    object: 'event';
    timestamp?: number;
    instance_id?: string;
    event_attributes?: ClerkEventAttributes;
}

/**
 * Svix webhook headers
 */
export interface SvixHeaders {
    'svix-id': string;
    'svix-timestamp': string;
    'svix-signature': string;
}

/**
 * Extracted user data for database operations
 */
export interface ExtractedUserData {
    clerkId: string;
    email: string;
    firstName?: string;
    lastName?: string;
    avatar?: string;
}

/**
 * Webhook response types
 */
export interface WebhookSuccessResponse {
    success: true;
    data?: unknown;
    message?: string;
}

export interface WebhookErrorResponse {
    success: false;
    error: string;
    details?: unknown;
}

export type WebhookResponse = WebhookSuccessResponse | WebhookErrorResponse;
