import "../globals.css";
import React, { ReactNode } from "react";

function layout({ children }: { children: ReactNode }) {
    return (
        <div className="relative flex h-screen max-w-5xl lg:flex-row mx-auto overflow-hidden">
            {/* Left Side - Company Branding */}
            <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12">
                <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-white dark:bg-gray-800 shadow-md">
                        <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                    </div>
                    <span className="text-2xl font-bold text-gray-900 dark:text-white">FinRegent</span>
                </div>

                <div className="space-y-8">
                    {/* Feature List */}
                    <div className="space-y-6">
                        <div className="flex items-start gap-4">
                            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-white dark:bg-gray-800 shadow-lg">
                                <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Save on development time</h3>
                                <p className="text-gray-600 dark:text-gray-300 text-sm">Add authentication and user management to your app with just a few lines of code.</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-4">
                            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-white dark:bg-gray-800 shadow-lg">
                                <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Increase engagement</h3>
                                <p className="text-gray-600 dark:text-gray-300 text-sm">Add intuitive UIs designed to decrease friction for your users.</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-4">
                            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-white dark:bg-gray-800 shadow-lg">
                                <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Protect your users</h3>
                                <p className="text-gray-600 dark:text-gray-300 text-sm">Enable features like two-step verification and enjoy automatic security updates.</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-4">
                            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-white dark:bg-gray-800 shadow-lg">
                                <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Match your brand</h3>
                                <p className="text-gray-600 dark:text-gray-300 text-sm">Theme our pre-built components, or integrate with our easy-to-use APIs.</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="text-sm text-gray-500 dark:text-gray-400">
                    © 2025 FinRegent. All rights reserved.
                </div>
            </div>

            {/* Right Side - Authentication Component */}
            <div className="flex-1 flex items-center justify-center p-8">
                <div className="w-full max-w-md">
                    {children}
                </div>
            </div>
        </div>
    );
}

export default layout;
