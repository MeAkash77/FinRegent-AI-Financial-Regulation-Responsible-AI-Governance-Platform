// Email template for cron job notifications

export interface CronJobEmailData {
    userName: string;
    success: boolean;
    linksExtracted: number;
    links?: string[];
    errorMessage?: string;
    sourceUrl?: string;
    executionTime: string;
}

export function generateCronJobEmailHTML(data: CronJobEmailData): string {
    const statusColor = data.success ? '#10b981' : '#ef4444';
    const statusText = data.success ? 'Success' : 'Failed';
    const statusIcon = data.success ? '✅' : '❌';

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Cron Job Notification</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
    <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
            <td style="padding: 40px 0; text-align: center;">
                <table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);">
                    <!-- Header -->
                    <tr>
                        <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 8px 8px 0 0;">
                            <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">FinRegent</h1>
                            <p style="margin: 10px 0 0; color: #e0e7ff; font-size: 14px;">Knowledge Base Update Notification</p>
                        </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                        <td style="padding: 40px;">
                            <p style="margin: 0 0 20px; font-size: 16px; color: #374151;">Hello ${data.userName},</p>
                            
                            <!-- Status Badge -->
                            <div style="margin: 20px 0; padding: 15px; background-color: ${statusColor}15; border-left: 4px solid ${statusColor}; border-radius: 4px;">
                                <p style="margin: 0; font-size: 18px; font-weight: 600; color: ${statusColor};">
                                    ${statusIcon} Status: ${statusText}
                                </p>
                            </div>
                            
                            <p style="margin: 20px 0; font-size: 14px; line-height: 1.6; color: #6b7280;">
                                Your scheduled knowledge base update has been executed.
                            </p>
                            
                            <!-- Execution Details -->
                            <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                                <tr>
                                    <td style="padding: 10px; background-color: #f9fafb; border-bottom: 1px solid #e5e7eb;">
                                        <strong style="color: #374151;">Execution Time:</strong>
                                    </td>
                                    <td style="padding: 10px; background-color: #f9fafb; border-bottom: 1px solid #e5e7eb; color: #6b7280;">
                                        ${data.executionTime}
                                    </td>
                                </tr>
                                ${data.sourceUrl ? `
                                <tr>
                                    <td style="padding: 10px; background-color: #ffffff; border-bottom: 1px solid #e5e7eb;">
                                        <strong style="color: #374151;">Source URL:</strong>
                                    </td>
                                    <td style="padding: 10px; background-color: #ffffff; border-bottom: 1px solid #e5e7eb; color: #6b7280; word-break: break-all;">
                                        <a href="${data.sourceUrl}" style="color: #667eea; text-decoration: none;">${data.sourceUrl}</a>
                                    </td>
                                </tr>
                                ` : ''}
                                ${data.success ? `
                                <tr>
                                    <td style="padding: 10px; background-color: #f9fafb; border-bottom: 1px solid #e5e7eb;">
                                        <strong style="color: #374151;">Links Extracted:</strong>
                                    </td>
                                    <td style="padding: 10px; background-color: #f9fafb; border-bottom: 1px solid #e5e7eb; color: #6b7280;">
                                        ${data.linksExtracted}
                                    </td>
                                </tr>
                                ` : ''}
                            </table>
                            
                            ${data.success && data.links && data.links.length > 0 ? `
                            <!-- Links List -->
                            <div style="margin: 20px 0;">
                                <h3 style="margin: 0 0 10px; font-size: 16px; color: #374151;">Extracted Links:</h3>
                                <ul style="margin: 0; padding-left: 20px; font-size: 13px; color: #6b7280; line-height: 1.8;">
                                    ${data.links.slice(0, 10).map(link => `<li style="word-break: break-all;"><a href="${link}" style="color: #667eea; text-decoration: none;">${link}</a></li>`).join('')}
                                    ${data.links.length > 10 ? `<li style="color: #9ca3af;">... and ${data.links.length - 10} more</li>` : ''}
                                </ul>
                            </div>
                            ` : ''}
                            
                            ${!data.success && data.errorMessage ? `
                            <!-- Error Message -->
                            <div style="margin: 20px 0; padding: 15px; background-color: #fef2f2; border-left: 4px solid #ef4444; border-radius: 4px;">
                                <h3 style="margin: 0 0 10px; font-size: 16px; color: #991b1b;">Error Details:</h3>
                                <p style="margin: 0; font-size: 13px; color: #7f1d1d; font-family: monospace;">${data.errorMessage}</p>
                            </div>
                            ` : ''}
                            
                            ${data.success ? `
                            <p style="margin: 20px 0; font-size: 14px; line-height: 1.6; color: #6b7280;">
                                The extracted links have been successfully added to your knowledge base and are now available for querying.
                            </p>
                            ` : ''}
                            
                            <!-- CTA Button -->
                            <div style="margin: 30px 0; text-align: center;">
                                <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/settings" 
                                   style="display: inline-block; padding: 12px 30px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px;">
                                    Manage Settings
                                </a>
                            </div>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="padding: 30px 40px; text-align: center; background-color: #f9fafb; border-radius: 0 0 8px 8px; border-top: 1px solid #e5e7eb;">
                            <p style="margin: 0 0 10px; font-size: 12px; color: #9ca3af;">
                                This is an automated notification from your FinRegent cron job.
                            </p>
                            <p style="margin: 0; font-size: 12px; color: #9ca3af;">
                                You can disable these notifications in your <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/settings" style="color: #667eea; text-decoration: none;">settings</a>.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
    `.trim();
}

export function generateCronJobEmailText(data: CronJobEmailData): string {
    const statusText = data.success ? 'SUCCESS' : 'FAILED';
    
    let text = `
FinRegent - Knowledge Base Update Notification

Hello ${data.userName},

Status: ${statusText}

Your scheduled knowledge base update has been executed.

Execution Details:
- Execution Time: ${data.executionTime}
${data.sourceUrl ? `- Source URL: ${data.sourceUrl}` : ''}
${data.success ? `- Links Extracted: ${data.linksExtracted}` : ''}

`;

    if (data.success && data.links && data.links.length > 0) {
        text += `\nExtracted Links:\n`;
        data.links.slice(0, 10).forEach(link => {
            text += `- ${link}\n`;
        });
        if (data.links.length > 10) {
            text += `... and ${data.links.length - 10} more\n`;
        }
    }

    if (!data.success && data.errorMessage) {
        text += `\nError Details:\n${data.errorMessage}\n`;
    }

    text += `\n---\nThis is an automated notification from your FinRegent cron job.
You can manage these settings at: ${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/settings
`;

    return text.trim();
}
