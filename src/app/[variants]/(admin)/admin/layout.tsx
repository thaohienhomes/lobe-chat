import { auth, clerkClient } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { PropsWithChildren } from 'react';

import { AdminSidebar } from '@/features/Admin/Sidebar';
import { CommandPaletteClient } from '@/features/Admin/CommandPalette/CommandPaletteClient';

export default async function AdminLayout({ children }: PropsWithChildren) {
    const { userId } = await auth();

    if (!userId) {
        redirect('/login');
    }

    const client = await clerkClient();
    const user = await client.users.getUser(userId);

    // Collect ALL email addresses from the user's Clerk profile
    const userEmails = user.emailAddresses.map((e) => e.emailAddress.toLowerCase());

    // Admin emails: hardcoded founder + env var for flexibility
    const envAdminEmails = process.env.ADMIN_EMAILS?.split(',').map((e) => e.trim().toLowerCase()) || [];
    const adminEmails = new Set([
        'thaohienhomes@gmail.com',
        ...envAdminEmails,
    ]);

    // Admin check: metadata role, email match, or local dev
    const hasAdminRole = (user.publicMetadata as Record<string, string>)?.role === 'admin';
    const hasAdminEmail = userEmails.some((email) => adminEmails.has(email));
    const isDev = process.env.NODE_ENV === 'development';
    const isAdmin = hasAdminRole || hasAdminEmail || isDev;

    // Debug logging for production troubleshooting
    if (!isAdmin) {
        console.warn('[Admin Layout] Access denied:', {
            emails: userEmails,
            hasAdminEmail,
            hasAdminRole,
            isDev,
            publicMetadata: user.publicMetadata,
            userId,
        });
        redirect('/'); // Redirect non-admins to home
    }

    return (
        <>
            {/* Dark scrollbar for admin area */}
            <style>{`
                .admin-scroll::-webkit-scrollbar {
                    width: 6px;
                }
                .admin-scroll::-webkit-scrollbar-track {
                    background: transparent;
                }
                .admin-scroll::-webkit-scrollbar-thumb {
                    background: rgba(255, 255, 255, 0.08);
                    border-radius: 3px;
                }
                .admin-scroll::-webkit-scrollbar-thumb:hover {
                    background: rgba(255, 255, 255, 0.16);
                }
                .admin-scroll {
                    scrollbar-width: thin;
                    scrollbar-color: rgba(255, 255, 255, 0.08) transparent;
                }
            `}</style>
            <div style={{ backgroundColor: '#0A0A0F', color: '#ECECF1', display: 'flex', minHeight: '100vh', width: '100%' }}>
                <AdminSidebar />
                <div className="admin-scroll md:pl-[260px]" style={{ display: 'flex', flex: 1, flexDirection: 'column', height: '100vh', overflowX: 'hidden', overflowY: 'auto' }}>
                    <main className="max-md:px-4 max-md:pt-20" style={{ flex: 1, padding: '32px 40px', paddingBottom: '80px' }}>
                        {children}
                    </main>
                </div>
            </div>
            <CommandPaletteClient />
        </>
    );
}
