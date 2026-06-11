import axios from "axios";
import crypto from "crypto";

function generateUniqueId(): string {
    const timestamp = Date.now().toString(36);
    const randomStr = crypto.randomBytes(5).toString("hex");
    return `${timestamp}-${randomStr}`;
}

// Upload assets to Lyzr API
export async function uploadAsset(
    lyzrApiKey: string,
    file: File
) {
    try {
        const formData = new FormData();
        formData.append("files", file);

        const response = await axios.post(
            "https://agent-prod.studio.lyzr.ai/v3/assets/upload",
            formData,
            {
                headers: {
                    accept: "application/json",
                    "x-api-key": lyzrApiKey,
                },
            }
        );

        return response.data;
    } catch (error) {
        console.error("Error uploading asset:", error);
        throw new Error("Failed to upload file");
    }
}

export async function agentChat(
    userId: string,
    agentId: string,
    lyzrApiKey: string,
    message: string,
    sessionId?: string,
    assets?: string[]
) {
    const chatSessionId = sessionId || generateUniqueId();

    try {
        const requestBody: {
            user_id: string;
            agent_id: string;
            session_id: string;
            message: string;
            assets?: string[];
        } = {
            user_id: userId,
            agent_id: agentId,
            session_id: chatSessionId,
            message: message,
        };

        // Add assets only if provided
        if (assets && assets.length > 0) {
            requestBody.assets = assets;
        }

        const response = await axios.post(
            "https://agent-prod.studio.lyzr.ai/v3/inference/chat/",
            requestBody,
            {
                headers: {
                    accept: "application/json",
                    "Content-Type": "application/json",
                    "x-api-key": lyzrApiKey,
                },
            }
        );

        return {
            ...response.data,
            user_id: userId,
            session_id: chatSessionId,
        };
    } catch (error) {
        console.error("Error calling Lyzr API:", error);
        throw new Error("An error occurred while processing your request");
    }
}

// Train RAG with PDF file
export async function trainRagWithPDF(
    ragId: string,
    lyzrApiKey: string,
    file: File
) {
    try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("data_parser", "llmsherpa");
        formData.append("chunk_size", "1000");
        formData.append("chunk_overlap", "100");
        formData.append("extra_info", "{}");

        const response = await axios.post(
            `https://rag-prod.studio.lyzr.ai/v3/train/pdf/?rag_id=${ragId}`,
            formData,
            {
                headers: {
                    accept: "application/json",
                    "x-api-key": lyzrApiKey,
                },
            }
        );

        return response.data;
    } catch (error) {
        console.error("Error training RAG with PDF:", error);
        throw new Error("Failed to upload PDF document");
    }
}

// Train RAG with DOCX file
export async function trainRagWithDOCX(
    ragId: string,
    lyzrApiKey: string,
    file: File
) {
    try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("data_parser", "docx2txt");
        formData.append("chunk_size", "1000");
        formData.append("chunk_overlap", "100");
        formData.append("extra_info", "{}");

        const response = await axios.post(
            `https://rag-prod.studio.lyzr.ai/v3/train/docx/?rag_id=${ragId}`,
            formData,
            {
                headers: {
                    accept: "application/json",
                    "x-api-key": lyzrApiKey,
                },
            }
        );

        return response.data;
    } catch (error) {
        console.error("Error training RAG with DOCX:", error);
        throw new Error("Failed to upload DOCX document");
    }
}

// Train RAG with TXT file
export async function trainRagWithTXT(
    ragId: string,
    lyzrApiKey: string,
    file: File
) {
    try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("data_parser", "simple");
        formData.append("chunk_size", "1000");
        formData.append("chunk_overlap", "100");
        formData.append("extra_info", "{}");

        const response = await axios.post(
            `https://rag-prod.studio.lyzr.ai/v3/train/txt/?rag_id=${ragId}`,
            formData,
            {
                headers: {
                    accept: "application/json",
                    "x-api-key": lyzrApiKey,
                },
            }
        );

        return response.data;
    } catch (error) {
        console.error("Error training RAG with TXT:", error);
        throw new Error("Failed to upload TXT document");
    }
}

// Train RAG with Website URL
export async function trainRagWithWebsite(
    ragId: string,
    lyzrApiKey: string,
    urls: string
) {
    try {
        const response = await axios.post(
            `https://rag-prod.studio.lyzr.ai/v3/train/website/?rag_id=${ragId}`,
            {
                urls: [urls],
                source: "website",
                max_crawl_pages: 2,
                max_crawl_depth: 0,
                dynamic_content_wait_secs: 5,
                actor: "apify/website-content-crawler",
                crawler_type: "cheerio",
                chunk_size: 1000,
                chunk_overlap: 100
            },
            {
                headers: {
                    accept: "application/json",
                    "Content-Type": "application/json",
                    "x-api-key": lyzrApiKey,
                },
            }
        );

        return response.data;
    } catch (error) {
        console.error("Error training RAG with Website:", error);
        throw new Error("Failed to add website content");
    }
}

// Train RAG with plain text
export async function trainRagWithText(
    ragId: string,
    lyzrApiKey: string,
    text: string
) {
    try {
        const response = await axios.post(
            `https://rag-prod.studio.lyzr.ai/v3/train/text/?rag_id=${ragId}`,
            {
                data: [
                    {
                        text: text,
                        source: "text",
                        extra_info: {}
                    }
                ],
                chunk_size: 1000,
                chunk_overlap: 100
            },
            {
                headers: {
                    accept: "application/json",
                    "Content-Type": "application/json",
                    "x-api-key": lyzrApiKey,
                },
            }
        );

        return response.data;
    } catch (error) {
        console.error("Error training RAG with Text:", error);
        throw new Error("Failed to add text content");
    }
}

// Fetch all documents from RAG
export async function getRagDocuments(
    ragId: string,
    lyzrApiKey: string
) {
    try {
        const response = await axios.get(
            `https://rag-prod.studio.lyzr.ai/v3/rag/documents/${ragId}/`,
            {
                headers: {
                    accept: "application/json",
                    "x-api-key": lyzrApiKey,
                },
            }
        );

        return response.data;
    } catch (error) {
        console.error("Error fetching RAG documents:", error);
        throw new Error("Failed to fetch documents");
    }
}

// Delete documents from RAG
export async function deleteRagDocuments(
    ragId: string,
    lyzrApiKey: string,
    documentNames: string[]
) {
    try {
        const response = await axios.delete(
            `https://rag-prod.studio.lyzr.ai/v3/rag/${ragId}/docs/`,
            {
                headers: {
                    accept: "application/json",
                    "Content-Type": "application/json",
                    "x-api-key": lyzrApiKey,
                },
                data: documentNames,
            }
        );

        return response.data;
    } catch (error) {
        console.error("Error deleting RAG documents:", error);
        throw new Error("Failed to delete documents");
    }
}

// Call Lyzr agent to extract links from a source
export async function extractLinksFromSource(
    userId: string,
    agentId: string,
    lyzrApiKey: string,
    sourceUrl: string,
    sessionId?: string
) {
    const chatSessionId = sessionId || generateUniqueId();

    try {
        const response = await axios.post(
            "https://agent-prod.studio.lyzr.ai/v3/inference/chat/",
            {
                user_id: userId,
                agent_id: agentId,
                session_id: chatSessionId,
                message: `Extract all relevant links from this source: ${sourceUrl}`,
            },
            {
                headers: {
                    accept: "application/json",
                    "Content-Type": "application/json",
                    "x-api-key": lyzrApiKey,
                },
            }
        );

        // Parse the response to extract links JSON
        const responseData = response.data;
        let links: string[] = [];

        // Try to parse the response as JSON
        try {
            // The agent returns response in responseData.response as a JSON string
            if (responseData.response) {
                // Try to parse the response string as JSON
                const parsedResponse = JSON.parse(responseData.response);
                
                // Check if it has links array in the format: {"links":["url1", "url2"]}
                if (parsedResponse.links && Array.isArray(parsedResponse.links)) {
                    links = parsedResponse.links;
                }
            } else if (responseData.links && Array.isArray(responseData.links)) {
                // Fallback: check if links are directly in responseData
                links = responseData.links;
            }
        } catch {
            // If parsing fails, try to extract links from the response text using regex
            console.warn("Could not parse JSON response, attempting text extraction");
            const responseText = responseData.response || JSON.stringify(responseData);
            const linkPattern = /(https?:\/\/[^\s",\]]+)/g;
            const matches = responseText.match(linkPattern) || [];
            links = matches;
        }

        // Filter out any empty or invalid links
        links = links.filter(link => link && link.startsWith('http'));

        console.log(`Extracted ${links.length} links from agent response`);

        return {
            links,
            session_id: chatSessionId,
            raw_response: responseData,
        };
    } catch (error) {
        console.error("Error calling Lyzr agent for link extraction:", error);
        throw new Error("Failed to extract links from source");
    }
}

// Train RAG with multiple website URLs at once
export async function trainRagWithMultipleWebsites(
    ragId: string,
    lyzrApiKey: string,
    urls: string[]
) {
    try {
        const response = await axios.post(
            `https://rag-prod.studio.lyzr.ai/v3/train/website/?rag_id=${ragId}`,
            {
                urls: urls,
                source: "website",
                max_crawl_pages: 2,
                max_crawl_depth: 0,
                dynamic_content_wait_secs: 5,
                actor: "apify/website-content-crawler",
                crawler_type: "cheerio",
                chunk_size: 1000,
                chunk_overlap: 100
            },
            {
                headers: {
                    accept: "application/json",
                    "Content-Type": "application/json",
                    "x-api-key": lyzrApiKey,
                },
            }
        );

        return response.data;
    } catch (error) {
        console.error("Error training RAG with multiple websites:", error);
        throw new Error("Failed to add website content");
    }
}

export async function getChatBySessionId(
    lyzrApiKey: string,
    sessionId: string
) {
    try {
        const response = await axios.get(
            `https://agent-prod.studio.lyzr.ai/v1/sessions/${sessionId}/history`,
            {
                headers: {
                    accept: "application/json",
                    "x-api-key": lyzrApiKey,
                },
            }
        );
        return response.data;
    } catch (error) {
        console.error("Error fetching chat history from Lyzr API:", error);
        throw new Error("An error occurred while fetching chat history");
    }
}
