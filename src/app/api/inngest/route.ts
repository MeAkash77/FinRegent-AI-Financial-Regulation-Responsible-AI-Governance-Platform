import { serve } from "inngest/next";
import { inngest } from "@/lib/inngest/client";
import {
    extractAndTrainKB,
    // trainKBWithLinks
} from "@/lib/inngest/functions";

export const { GET, POST, PUT } = serve({
    client: inngest,
    functions: [
        extractAndTrainKB,
        // trainKBWithLinks
    ],
})