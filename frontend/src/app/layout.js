"use client";
import './globals.css';
import { AuthProvider } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';
import { usePathname } from 'next/navigation';

export default function RootLayout({ children }) {
  const pathname = usePathname();
  const isAuthPage = pathname === '/' || pathname === '/register';

  return (
    <html lang="en" className="dark">
      <head>
        <title>Team Dashboard</title>
      </head>
      <body>
        <AuthProvider>
          <div className="flex min-h-screen">
            {!isAuthPage && <Sidebar />}
            <main className="flex-1 bg-background overflow-y-auto">
              {children}
            </main>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
