"use client";
import Link from 'next/link';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, FileText, FolderKanban, LogOut, MessageSquare } from 'lucide-react';
import { usePathname } from 'next/navigation';

export default function Sidebar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  if (!user) return null;

  const isActive = (path) => pathname === path;

  return (
    <div className="w-64 bg-primary text-primary-foreground flex flex-col min-h-screen p-4 border-r border-border">
      <div className="mb-8 flex items-center gap-2 px-2">
        <div className="w-8 h-8 rounded-md bg-accent flex items-center justify-center font-bold text-accent-foreground">
          TD
        </div>
        <h1 className="text-xl font-bold tracking-tight">TeamDash</h1>
      </div>

      <nav className="flex-1 space-y-2">
        {user.role === 'Manager' && (
          <>
            <Link href="/dashboard" className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${isActive('/dashboard') ? 'bg-accent text-accent-foreground' : 'hover:bg-primary-foreground/10'}`}>
              <LayoutDashboard size={20} />
              Dashboard
            </Link>
            <Link href="/projects" className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${isActive('/projects') ? 'bg-accent text-accent-foreground' : 'hover:bg-primary-foreground/10'}`}>
              <FolderKanban size={20} />
              Projects
            </Link>
          </>
        )}
        
        <Link href="/reports" className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${isActive('/reports') ? 'bg-accent text-accent-foreground' : 'hover:bg-primary-foreground/10'}`}>
          <FileText size={20} />
          My Reports
        </Link>
        
        {/* Bonus AI Chat link */}
        <Link href="/chat" className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${isActive('/chat') ? 'bg-accent text-accent-foreground' : 'hover:bg-primary-foreground/10'}`}>
          <MessageSquare size={20} />
          AI Assistant
        </Link>
      </nav>

      <div className="mt-auto border-t border-border/20 pt-4">
        <div className="px-3 py-2 mb-2">
          <p className="text-sm font-medium truncate">{user.name}</p>
          <p className="text-xs text-muted-foreground truncate">{user.email}</p>
          <span className="inline-block mt-1 text-[10px] font-semibold bg-accent text-accent-foreground px-2 py-0.5 rounded-full">
            {user.role}
          </span>
        </div>
        <button 
          onClick={logout}
          className="flex items-center gap-3 w-full px-3 py-2 text-left text-sm text-red-400 hover:bg-red-950/30 rounded-md transition-colors"
        >
          <LogOut size={18} />
          Sign Out
        </button>
      </div>
    </div>
  );
}
