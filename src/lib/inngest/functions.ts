import { inngest } from "@/lib/inngest/client";
import { extractLinksFromSource, trainRagWithMultipleWebsites } from "@/lib/lyzrService";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import { generateCronJobEmailHTML, generateCronJobEmailText } from "./email-template";

// Extract links from source and train KB - runs daily at 12:00 PM IST
export const extractAndTrainKB = inngest.createFunction(
    { id: "extract-and-train-kb" },
    { cron: "*/5 * * * *" }, // Runs every 5 minutes
    async ({ step }) => {
        // Step 1: Get all users with cron job enabled
        const enabledUsers = await step.run("get-enabled-users", async () => {
            try {
                const users = await prisma.systemSettings.findMany({
                    where: { cronJobEnabled: true },
                    select: {
                        userId: true,
                        email: true,
                        sourceUrl: true,
                    },
                });
                return users;
            } catch (error) {
                console.error("Error fetching enabled users:", error);
                return [];
            }
        });

        // If no users have cron job enabled, skip execution
        if (enabledUsers.length === 0) {
            return {
                success: false,
                message: "No users have cron job enabled",
                processedUsers: 0,
            };
        }

        // Configuration - these should ideally come from environment variables or database
        const config = {
            linkExtractionAgentId: process.env.LYZR_LINK_EXTRACTION_AGENT_ID || '690123a7de7c6b951adfb4c8',
            ragId: process.env.LYZR_AUTO_RAG_ID || '69012147a8183b569886f67d',
            lyzrApiKey: process.env.LYZR_API_KEY || "",
        };

        // Step 2: Process each user
        const results = [];
        for (const user of enabledUsers) {
            const result = await step.run(`process-user-${user.userId}`, async () => {
                const executionTime = new Date().toLocaleString('en-US', {
                    dateStyle: 'full',
                    timeStyle: 'long',
                });

                // Use user's specific source URL or fallback to default
                const userSourceUrl = user.sourceUrl || "";

                try {
                    // Extract links from source
                    const extractionResult = await extractLinksFromSource(
                        user.userId,
                        config.linkExtractionAgentId,
                        config.lyzrApiKey,
                        userSourceUrl
                    );

                    // If links extracted, train KB
                    if (extractionResult.links && extractionResult.links.length > 0) {
                        const trainingResult = await trainRagWithMultipleWebsites(
                            config.ragId,
                            config.lyzrApiKey,
                            extractionResult.links
                        );

                        // Send success email
                        await sendEmail({
                            to: user.email,
                            subject: '✅ Knowledge Base Updated Successfully',
                            html: generateCronJobEmailHTML({
                                userName: user.email.split('@')[0],
                                success: true,
                                linksExtracted: extractionResult.links.length,
                                links: extractionResult.links,
                                sourceUrl: userSourceUrl,
                                executionTime,
                            }),
                            text: generateCronJobEmailText({
                                userName: user.email.split('@')[0],
                                success: true,
                                linksExtracted: extractionResult.links.length,
                                links: extractionResult.links,
                                sourceUrl: userSourceUrl,
                                executionTime,
                            }),
                        });

                        return {
                            userId: user.userId,
                            email: user.email,
                            success: true,
                            linksExtracted: extractionResult.links.length,
                            trainingResult,
                        };
                    } else {
                        // Send email for no links found
                        await sendEmail({
                            to: user.email,
                            subject: '⚠️ No Links Extracted',
                            html: generateCronJobEmailHTML({
                                userName: user.email.split('@')[0],
                                success: false,
                                linksExtracted: 0,
                                errorMessage: 'No links were extracted from the source URL',
                                sourceUrl: userSourceUrl,
                                executionTime,
                            }),
                            text: generateCronJobEmailText({
                                userName: user.email.split('@')[0],
                                success: false,
                                linksExtracted: 0,
                                errorMessage: 'No links were extracted from the source URL',
                                sourceUrl: userSourceUrl,
                                executionTime,
                            }),
                        });

                        return {
                            userId: user.userId,
                            email: user.email,
                            success: false,
                            message: "No links extracted",
                        };
                    }
                } catch (error) {
                    console.error(`Failed to process user ${user.userId}:`, error);
                    
                    // Send error email
                    await sendEmail({
                        to: user.email,
                        subject: '❌ Knowledge Base Update Failed',
                        html: generateCronJobEmailHTML({
                            userName: user.email.split('@')[0],
                            success: false,
                            linksExtracted: 0,
                            errorMessage: String(error),
                            sourceUrl: userSourceUrl,
                            executionTime,
                        }),
                        text: generateCronJobEmailText({
                            userName: user.email.split('@')[0],
                            success: false,
                            linksExtracted: 0,
                            errorMessage: String(error),
                            sourceUrl: userSourceUrl,
                            executionTime,
                        }),
                    });

                    return {
                        userId: user.userId,
                        email: user.email,
                        success: false,
                        error: String(error),
                    };
                }
            });

            results.push(result);
        }

        return {
            success: true,
            processedUsers: enabledUsers.length,
            results,
            message: `Processed ${enabledUsers.length} user(s)`,
        };
    }
);

// Train KB with multiple links - can be triggered by cron or manually
// export const trainKBWithLinks = inngest.createFunction(
//     { id: "train-kb-with-links" },
//     { event: "app/train.kb" },
//     async ({ step }) => {
//         // const { links, ragId, lyzrApiKey, source, sourceUrl } = event.data;

//         const config = {
//             userId: 'mem_1234567890abcdef',
//             linkExtractionAgentId: '690123a7de7c6b951adfb4c8',
//             ragId: '69012147a8183b569886f67d',
//             lyzrApiKey: process.env.LYZR_API_KEY || "",
//             sourceUrl: "https://www.inngest.com/docs",
//         };

//         const test = await extractLinksFromSource(
//                                 config.userId,
//                                 config.linkExtractionAgentId,
//                                 config.lyzrApiKey,
//                                 config.sourceUrl
//                             );

//         // console.log(test);

//         // Validate input
//         if (!test.links || !Array.isArray(test.links) || test.links.length === 0) {
//             return {
//                 success: false,
//                 message: "No links provided for training",
//             };
//         }

//         if (!config.ragId || !config.lyzrApiKey) {
//             return {
//                 success: false,
//                 message: "Missing ragId or lyzrApiKey",
//             };
//         }

//         // // Train KB with all links at once
//         const trainingResult = await step.run("train-kb-with-all-links", async () => {
//             try {
//                 return await trainRagWithMultipleWebsites(
//                     config.ragId,
//                     config.lyzrApiKey,
//                     test.links
//                 );
//             } catch (error) {
//                 console.error("Failed to train KB with extracted links:", error);
//                 return { success: false, error: String(error) };
//             }
//         });

//         return {
//             success: true,
//             linksProcessed: test.links.length,
//             links: test.links,
//             trainingResult,
//             source: config.sourceUrl,
//             sourceUrl: config.sourceUrl || "unknown",
//         };
//     }
// );