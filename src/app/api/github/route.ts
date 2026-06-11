import { agentChat } from '@/lib/lyzrService';
import { NextRequest, NextResponse } from 'next/server';

interface TreeItem {
    path: string;
    type: string;
    sha: string;
}

interface AnalysisResult {
    repository_info: {
        owner: string;
        repo: string;
    };
    readme_summary: string;
    file_structure: string[];
    file_contents: Record<string, string>;
    analysis_prompts: string[];
}

class GitHubRepoAnalyzer {
    private owner: string;
    private repo: string;
    private baseUrl: string;
    private headers: HeadersInit;

    constructor(owner: string, repo: string, token: string) {
        this.owner = owner;
        this.repo = repo;
        this.baseUrl = `https://api.github.com/repos/${owner}/${repo}`;
        this.headers = {
            'Authorization': `token ${token}`,
            'Accept': 'application/vnd.github.v3+json',
        };
    }

    private isBinaryFile(filePath: string): boolean {
        const binaryExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.pdf', '.zip', '.tar', '.gz', '.exe', '.ico', '.woff', '.woff2', '.ttf', '.eot'];
        return binaryExtensions.some(ext => filePath.toLowerCase().endsWith(ext));
    }

    private async traverseTree(sha: string, path: string = ''): Promise<TreeItem[]> {
        const items: TreeItem[] = [];
        const stack: Array<[string, string]> = [[path, sha]];

        while (stack.length > 0) {
            const [currentPath, currentSha] = stack.pop()!;

            try {
                const response = await fetch(
                    `${this.baseUrl}/git/trees/${currentSha}`,
                    { headers: this.headers }
                );

                if (response.ok) {
                    const tree = await response.json();

                    for (const item of tree.tree) {
                        const fullPath = currentPath ? `${currentPath}/${item.path}` : item.path;
                        items.push({
                            path: fullPath,
                            type: item.type,
                            sha: item.sha,
                        });

                        if (item.type === 'tree') {
                            stack.push([fullPath, item.sha]);
                        }
                    }
                }
            } catch (error) {
                console.error(`Error traversing tree at ${currentPath}:`, error);
            }
        }

        return items;
    }

    async getReadme(): Promise<string | null> {
        try {
            const response = await fetch(`${this.baseUrl}/readme`, {
                headers: this.headers,
            });

            if (response.ok) {
                const data = await response.json();
                const content = Buffer.from(data.content, 'base64').toString('utf-8');
                return content;
            }
        } catch (error) {
            console.error('Error fetching README:', error);
        }
        return null;
    }

    async getRepoStructure(): Promise<TreeItem[] | null> {
        try {
            // Try main branch first
            let response = await fetch(`${this.baseUrl}/git/refs/heads/main`, {
                headers: this.headers,
            });

            // If main doesn't exist, try master
            if (!response.ok) {
                response = await fetch(`${this.baseUrl}/git/refs/heads/master`, {
                    headers: this.headers,
                });
            }

            if (response.ok) {
                const data = await response.json();
                const mainSha = data.object.sha;
                return await this.traverseTree(mainSha);
            }
        } catch (error) {
            console.error('Error fetching repo structure:', error);
        }
        return null;
    }

    async getFileContent(path: string): Promise<string | null> {
        try {
            const response = await fetch(
                `${this.baseUrl}/contents/${encodeURIComponent(path)}`,
                { headers: this.headers }
            );

            if (response.ok) {
                const contentData = await response.json();

                if (contentData.encoding === 'base64' && (contentData.size || 0) <= 1000000) {
                    try {
                        const content = Buffer.from(contentData.content, 'base64').toString('utf-8');
                        return content;
                    } catch {
                        // Binary file or decode error
                        return null;
                    }
                }
            }
        } catch (error) {
            console.error(`Error fetching file content for ${path}:`, error);
        }
        return null;
    }

    async analyzeRepo(includeContents: boolean = false): Promise<AnalysisResult> {
        const readme = await this.getReadme();
        const structure = await this.getRepoStructure();

        const analysis: AnalysisResult = {
            repository_info: {
                owner: this.owner,
                repo: this.repo,
            },
            // readme_summary: readme ? (readme.length > 500 ? readme.substring(0, 500) + '...' : readme) : 'No README found',
            readme_summary: readme ? readme : 'No README found',
            file_structure: structure ? structure.map(item => item.path) : [],
            file_contents: {},
            analysis_prompts: [
                'What is the main purpose of this repository based on the README?',
                'Are there any clear coding patterns or standards visible in the file structure?',
                'What programming languages are primarily used in this project?',
                'Are there any interesting or unusual files or directories in the repository structure?',
                'Based on the file contents, what are the main features or functionalities of this project?',
                'Are there any potential areas for improvement or optimization in the code?',
                'How well is the project documented? Are there comments in the code and comprehensive README instructions?',
                'Are there any security concerns visible in the repository structure or file contents?',
                'What dependencies or external libraries does this project rely on?',
                'How modular and maintainable does the codebase appear to be?',
            ],
        };

        // Optionally include file contents
        if (includeContents && structure) {
            const maxFiles = 50; // Limit to prevent timeouts
            let fileCount = 0;

            for (const item of structure) {
                if (fileCount >= maxFiles) break;

                if (item.type === 'blob' && !this.isBinaryFile(item.path)) {
                    const content = await this.getFileContent(item.path);
                    if (content) {
                        analysis.file_contents[item.path] = content;
                        fileCount++;
                    }
                }
            }
        }

        return analysis;
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { owner, repo, token, includeContents = false } = body;

        // Validate required fields
        if (!owner || !repo || !token) {
            return NextResponse.json(
                { error: 'Missing required fields: owner, repo, token' },
                { status: 400 }
            );
        }

        // Create analyzer instance
        const analyzer = new GitHubRepoAnalyzer(owner, repo, token);

        // Perform analysis
        const analysis = await analyzer.analyzeRepo(includeContents);

        return NextResponse.json(analysis, { status: 200 });
    } catch (error) {
        console.error('Error analyzing repository:', error);
        return NextResponse.json(
            { error: 'Failed to analyze repository', details: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const owner = searchParams.get('owner');
    const repo = searchParams.get('repo');
    // const token = searchParams.get('token');
    const token = process.env.GH_TOKEN!;
    const includeContents = searchParams.get('includeContents') === 'true';

    if (!owner || !repo || !token) {
        return NextResponse.json(
            { error: 'Missing required query parameters: owner, repo, token' },
            { status: 400 }
        );
    }

    try {
        const analyzer = new GitHubRepoAnalyzer(owner, repo, token);
        const analysis = await analyzer.analyzeRepo(includeContents);

        const res = await agentChat(
            "mem_123",
            "6900c402fe3c45b82238bf5e",
            process.env.LYZR_API_KEY!,
            JSON.stringify(analysis),
            "session_789"
        );

        return NextResponse.json(res, { status: 200 });
    } catch (error) {
        console.error('Error analyzing repository:', error);
        return NextResponse.json(
            { error: 'Failed to analyze repository', details: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}
