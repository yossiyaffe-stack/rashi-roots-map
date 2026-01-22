import { Outlet, useLocation } from 'react-router-dom';
import { Map, Clock, Users, Grape, Menu, X } from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { useState } from 'react';
import { cn } from '@/lib/utils';

const navItems = [
  { path: '/', label: 'Map', icon: Map },
  { path: '/timeline', label: 'Timeline', icon: Clock },
  { path: '/network', label: 'Network', icon: Users },
];

export function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();

  return (
    <div className="w-screen h-screen flex overflow-hidden bg-background text-foreground">
      {/* Sidebar */}
      <aside 
        className={cn(
          "flex flex-col z-[1001] bg-sidebar border-r border-white/10 shadow-2xl transition-all duration-300",
          sidebarOpen ? "w-64" : "w-16"
        )}
      >
        {/* Header */}
        <header className="p-4 bg-gradient-to-b from-[hsl(245_50%_28%)] to-sidebar">
          <div className="flex items-center justify-between">
            <div className={cn("flex items-center gap-3", !sidebarOpen && "justify-center w-full")}>
              <Grape className="w-6 h-6 text-accent shrink-0" />
              {sidebarOpen && (
                <div>
                  <span className="text-[10px] uppercase tracking-[0.2em] text-accent/80 font-bold block">
                    The Vine of Wisdom
                  </span>
                  <h1 className="text-xl font-black leading-tight italic">
                    Rashi <span className="text-accent">Map</span>
                  </h1>
                </div>
              )}
            </div>
            <button 
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-1.5 rounded-lg hover:bg-white/10 transition-colors text-white/60 hover:text-white"
            >
              {sidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </header>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map(item => {
            const isActive = location.pathname === item.path;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all",
                  "hover:bg-white/10 text-white/70 hover:text-white",
                  !sidebarOpen && "justify-center px-2"
                )}
                activeClassName="bg-accent/20 text-accent border border-accent/30"
              >
                <item.icon className="w-5 h-5 shrink-0" />
                {sidebarOpen && (
                  <span className="font-medium text-sm">{item.label}</span>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Footer */}
        {sidebarOpen && (
          <footer className="p-4 border-t border-white/10 text-xs text-white/40">
            Medieval Jewish Scholarship
          </footer>
        )}
      </aside>

      {/* Main Content */}
      <main className="flex-1 relative bg-background overflow-hidden">
        <Outlet />
      </main>
    </div>
  );
}
