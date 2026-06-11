"use server"

export async function secret_keys() {
    try {
        return {
            lyzr_api_key: process.env.LYZR_API_KEY || '',
            lyzr_agent_id: process.env.LYZR_AGENT_ID || '',
            signature_key: process.env.API_SIGNATURE_SECRET || '',
            lyzr_rag_id: process.env.LYZR_RAG_ID || '',
            lyzr_updates_agent_id: process.env.LYZR_UPDATES_AGENT_ID || '',
        }
    } catch (error) {
        console.error('Keys not found in env:', error);
        throw new Error('Keys not found in Env');
    }
}