import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Map, Clock, Share2, Grape, Menu, X, BookOpen, GraduationCap, ChevronRight } from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { MapLegend } from '@/components/MapLegend';
import { KingdomsLegend } from '@/components/KingdomsLegend';
import { MapControls } from '@/components/MapControls';
import { RelationshipFilterPanel } from '@/components/RelationshipFilterPanel';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useRelationships } from '@/hooks/useScholars';
import { useScholarsOverlay } from '@/contexts/ScholarsOverlayContext';
import { useMapControls } from '@/contexts/MapControlsContext';

const navItems = [
  { path: '/', label: 'Map', icon: Map },
  { path: '/scholars', label: 'Scholars', icon: GraduationCap, hasOverlay: true },
  { path: '/timeline', label: 'Timeline', icon: Clock },
  { path: '/network', label: 'Network', icon: Share2 },
  { path: '/context', label: 'Historical Context', icon: BookOpen },
];

export function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();
  const { data: relationships = [] } = useRelationships();
  const { isOverlayOpen, setIsOverlayOpen } = useScholarsOverlay();
  const { 
    showBoundaries, setShowBoundaries,
    showMigrations, setShowMigrations,
    showConnections, setShowConnections,
    showPlaceNamesEnglish, setShowPlaceNamesEnglish,
    showPlaceNamesHebrew, setShowPlaceNamesHebrew,
    showScholarNamesEnglish, setShowScholarNamesEnglish,
    showScholarNamesHebrew, setShowScholarNamesHebrew,
  } = useMapControls();
  
  const isMapPage = location.pathname === '/';

  const handleScholarsClick = (e: React.MouseEvent) => {
    e.preventDefault();
    
    if (location.pathname === '/scholars') {
      // On scholars page: go back to map
      navigate('/');
    } else if (isMapPage) {
      // On map page: toggle overlay, if already open go to full page
      if (isOverlayOpen) {
        setIsOverlayOpen(false);
        navigate('/scholars');
      } else {
        setIsOverlayOpen(true);
      }
    } else {
      // On other pages: navigate to scholars
      navigate('/scholars');
    }
  };

  return (
    <div className="w-screen h-screen flex overflow-hidden bg-background text-foreground">
      {/* Sidebar */}
      <aside 
        className={cn(
          "flex flex-col z-[1001] bg-sidebar border-r border-white/10 shadow-2xl transition-all duration-300 overflow-visible",
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
        <nav className="p-3 space-y-1">
          {navItems.map(item => {
            const isActive = location.pathname === item.path;
            const isScholars = item.path === '/scholars';
            const isScholarsPage = location.pathname === '/scholars';
            const showOverlayIndicator = isScholars && (isMapPage && isOverlayOpen || isScholarsPage);
            
            if (isScholars) {
              return (
                <button
                  key={item.path}
                  onClick={handleScholarsClick}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all",
                    "hover:bg-white/10 text-white/70 hover:text-white",
                    !sidebarOpen && "justify-center px-2",
                    showOverlayIndicator && "bg-accent/20 text-accent border border-accent/30"
                  )}
                >
                  <item.icon className="w-5 h-5 shrink-0" />
                  {sidebarOpen && (
                    <>
                      <span className="font-medium text-sm flex-1 text-left">{item.label}</span>
                      <ChevronRight className={cn(
                        "w-4 h-4 transition-transform",
                        showOverlayIndicator && "rotate-90 text-accent"
                      )} />
                    </>
                  )}
                </button>
              );
            }

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

        {/* Spacer - only when not showing legends */}
        {(!isMapPage || !sidebarOpen) && <div className="flex-1" />}

        {/* Legends & Controls - Only on Map page */}
        {isMapPage && sidebarOpen && (
          <ScrollArea className="flex-1 border-t border-white/10">
            <div className="p-3 space-y-4 overflow-visible">
              <MapControls
                showBoundaries={showBoundaries}
                onShowBoundariesChange={setShowBoundaries}
                showMigrations={showMigrations}
                onShowMigrationsChange={setShowMigrations}
                showConnections={showConnections}
                onShowConnectionsChange={setShowConnections}
                showPlaceNamesEnglish={showPlaceNamesEnglish}
                onShowPlaceNamesEnglishChange={setShowPlaceNamesEnglish}
                showPlaceNamesHebrew={showPlaceNamesHebrew}
                onShowPlaceNamesHebrewChange={setShowPlaceNamesHebrew}
                showScholarNamesEnglish={showScholarNamesEnglish}
                onShowScholarNamesEnglishChange={setShowScholarNamesEnglish}
                showScholarNamesHebrew={showScholarNamesHebrew}
                onShowScholarNamesHebrewChange={setShowScholarNamesHebrew}
              />
              
              {/* Relationship Filters */}
              <RelationshipFilterPanel />
              
              <div className="overflow-visible">
                <MapLegend showConnections={showConnections} showMigrations={showMigrations} relationships={relationships} />
              </div>
              <div className="overflow-visible">
                <KingdomsLegend />
              </div>
            </div>
          </ScrollArea>
        )}

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
