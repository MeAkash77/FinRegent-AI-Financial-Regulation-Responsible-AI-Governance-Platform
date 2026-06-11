import { NextRequest, NextResponse } from "next/server";
import {
    trainRagWithPDF,
    trainRagWithDOCX,
    trainRagWithTXT,
    trainRagWithWebsite,
    trainRagWithText,
    getRagDocuments,
    deleteRagDocuments,
} from "@/lib/lyzrService";

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const type = formData.get("type") as string;
        const ragId = formData.get("ragId") as string;
        const apiKey = formData.get("apiKey") as string;

        if (!ragId || !apiKey) {
            return NextResponse.json(
                { error: "Missing ragId or apiKey" },
                { status: 400 }
            );
        }

        let result;

        switch (type) {
            case "pdf": {
                const file = formData.get("file") as File;
                if (!file) {
                    return NextResponse.json(
                        { error: "No file provided" },
                        { status: 400 }
                    );
                }
                result = await trainRagWithPDF(ragId, apiKey, file);
                break;
            }

            case "docx": {
                const file = formData.get("file") as File;
                if (!file) {
                    return NextResponse.json(
                        { error: "No file provided" },
                        { status: 400 }
                    );
                }
                result = await trainRagWithDOCX(ragId, apiKey, file);
                break;
            }

            case "txt": {
                const file = formData.get("file") as File;
                if (!file) {
                    return NextResponse.json(
                        { error: "No file provided" },
                        { status: 400 }
                    );
                }
                result = await trainRagWithTXT(ragId, apiKey, file);
                break;
            }

            case "website": {
                const url = formData.get("url") as string;
                if (!url) {
                    return NextResponse.json(
                        { error: "No URL provided" },
                        { status: 400 }
                    );
                }
                result = await trainRagWithWebsite(ragId, apiKey, url);
                break;
            }

            case "text": {
                const text = formData.get("text") as string;
                if (!text) {
                    return NextResponse.json(
                        { error: "No text provided" },
                        { status: 400 }
                    );
                }
                result = await trainRagWithText(ragId, apiKey, text);
                break;
            }

            default:
                return NextResponse.json(
                    { error: "Invalid training type" },
                    { status: 400 }
                );
        }

        return NextResponse.json(result);
    } catch (error) {
        console.error("Error training RAG:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed to train RAG" },
            { status: 500 }
        );
    }
}

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const ragId = searchParams.get("ragId");
        const apiKey = searchParams.get("apiKey");

        if (!ragId || !apiKey) {
            return NextResponse.json(
                { error: "Missing ragId or apiKey" },
                { status: 400 }
            );
        }

        const documents = await getRagDocuments(ragId, apiKey);
        return NextResponse.json(documents);
    } catch (error) {
        console.error("Error fetching documents:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed to fetch documents" },
            { status: 500 }
        );
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const ragId = searchParams.get("ragId");
        const apiKey = searchParams.get("apiKey");

        if (!ragId || !apiKey) {
            return NextResponse.json(
                { error: "Missing ragId or apiKey" },
                { status: 400 }
            );
        }

        const body = await request.json();
        const documentNames = body.documentNames as string[];

        if (!documentNames || !Array.isArray(documentNames) || documentNames.length === 0) {
            return NextResponse.json(
                { error: "Missing or invalid documentNames array" },
                { status: 400 }
            );
        }

        const result = await deleteRagDocuments(ragId, apiKey, documentNames);
        return NextResponse.json(result);
    } catch (error) {
        console.error("Error deleting documents:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed to delete documents" },
            { status: 500 }
        );
    }
}
