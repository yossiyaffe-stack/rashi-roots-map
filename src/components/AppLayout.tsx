import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Map, Clock, Share2, Grape, Menu, X, BookOpen, GraduationCap, ChevronRight, ChevronLeft, Filter, Settings2, Library, Crown, Palette, Route, ScrollText, Link2, ExternalLink, FileImage, Calendar, MapPin } from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { MapLegend } from '@/components/MapLegend';
import { KingdomsLegend } from '@/components/KingdomsLegend';
import { MapControlsPanel } from '@/components/MapControlsPanel';
import { RelationshipFilterPanel } from '@/components/RelationshipFilterPanel';
import { TextualRelationshipsPanel } from '@/components/TextualRelationshipsPanel';
import { ScholarJourneysPanel } from '@/components/ScholarJourneysPanel';
import { FilterPanel } from '@/components/filters';
import { useRelationships } from '@/hooks/useScholars';
import { useScholarsOverlay } from '@/contexts/ScholarsOverlayContext';
import { useMapControls } from '@/contexts/MapControlsContext';
import { useFilters } from '@/contexts/FilterContext';

export function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [relationshipsPanelOpen, setRelationshipsPanelOpen] = useState(false);
  const [mapControlsPanelOpen, setMapControlsPanelOpen] = useState(false);
  const [legendsPanelOpen, setLegendsPanelOpen] = useState(false);
  const [kingdomsPanelOpen, setKingdomsPanelOpen] = useState(false);
  const [journeysPanelOpen, setJourneysPanelOpen] = useState(false);
  const [periodRegionPanelOpen, setPeriodRegionPanelOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { data: relationships = [] } = useRelationships();
  const { isOverlayOpen, setIsOverlayOpen, clearSelection } = useScholarsOverlay();
  const { 
    showBoundaries, setShowBoundaries,
    showMigrations, setShowMigrations,
    showConnections, setShowConnections,
    showPlaceNamesEnglish, setShowPlaceNamesEnglish,
    showPlaceNamesHebrew, setShowPlaceNamesHebrew,
    showScholarNamesEnglish, setShowScholarNamesEnglish,
    showScholarNamesHebrew, setShowScholarNamesHebrew,
    showTextNamesEnglish, setShowTextNamesEnglish,
    showTextNamesHebrew, setShowTextNamesHebrew,
    cityFilter, setCityFilter,
    showOnlyScholarCities, setShowOnlyScholarCities,
    showJourneyMarkers, setShowJourneyMarkers,
    journeyReasonFilter, setJourneyReasonFilter,
    showBoundaryShading, setShowBoundaryShading,
    mapEntityMode, setMapEntityMode,
  } = useMapControls();
  
  const {
    selectedPeriods,
    setSelectedPeriods,
    periodMode,
    setPeriodMode,
    setDerivedTimeRange,
    selectedRegions,
    setSelectedRegions,
    regionMode,
    setRegionMode,
    hasActiveFilters,
  } = useFilters();
  
  const isMapPage = location.pathname === '/';
  const isNetworkPage = location.pathname === '/network';
  const isWorksPage = location.pathname === '/works';

  // Removed handleScholarsClick - now using NavLink for consistent page navigation

  return (
    <div className="w-screen h-screen flex overflow-hidden bg-background text-foreground">
      {/* Sidebar + Slide-out Panel Container */}
      <div className="relative flex h-full z-[1001]">
        {/* Sidebar */}
        <aside 
          className={cn(
            "flex flex-col bg-sidebar border-r border-white/10 shadow-2xl transition-all duration-300 h-full",
            sidebarOpen ? "w-64" : "w-16"
          )}
        >
          {/* Header */}
          <header className="p-4 bg-gradient-to-b from-[hsl(245_50%_28%)] to-sidebar shrink-0">
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

          {/* Navigation - Three Sections */}
          <nav className="p-3 space-y-1 shrink-0 flex-1 overflow-y-auto">
            {/* ========== SECTION 1: MAP ========== */}
            <div className="space-y-1">
              {sidebarOpen && (
                <div className="px-3 py-1 text-[10px] uppercase tracking-wider text-white/40 font-semibold">
                  Map
                </div>
              )}
              
              {/* Map */}
              <button
                onClick={() => {
                  clearSelection();
                  if (location.pathname !== '/') {
                    navigate('/');
                  }
                }}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all",
                  "hover:bg-white/10 text-white/70 hover:text-white",
                  !sidebarOpen && "justify-center px-2",
                  location.pathname === '/' && "bg-accent/20 text-accent border border-accent/30"
                )}
              >
                <Map className="w-5 h-5 shrink-0" />
                {sidebarOpen && <span className="font-medium text-sm">Map</span>}
              </button>

              {/* Map Controls */}
              <button
                onClick={() => {
                  if (!isMapPage) {
                    navigate('/');
                    setTimeout(() => setMapControlsPanelOpen(true), 100);
                  } else {
                    setMapControlsPanelOpen(!mapControlsPanelOpen);
                    if (!mapControlsPanelOpen) {
                      setRelationshipsPanelOpen(false);
                      setLegendsPanelOpen(false);
                      setKingdomsPanelOpen(false);
                      setJourneysPanelOpen(false);
                    }
                  }
                }}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all",
                  "hover:bg-white/10 text-white/70 hover:text-white",
                  !sidebarOpen && "justify-center px-2",
                  mapControlsPanelOpen && isMapPage && "bg-accent/20 text-accent border border-accent/30"
                )}
              >
                <Settings2 className="w-5 h-5 shrink-0" />
                {sidebarOpen && (
                  <>
                    <span className="font-medium text-sm flex-1 text-left">Map Controls</span>
                    <ChevronRight className={cn(
                      "w-5 h-5 transition-transform duration-300 ease-out",
                      mapControlsPanelOpen && isMapPage ? "rotate-180 text-accent" : "text-white/50"
                    )} />
                  </>
                )}
              </button>

              {/* Legends */}
              <button
                onClick={() => {
                  if (!isMapPage) {
                    navigate('/');
                    setTimeout(() => setLegendsPanelOpen(true), 100);
                  } else {
                    setLegendsPanelOpen(!legendsPanelOpen);
                    if (!legendsPanelOpen) {
                      setMapControlsPanelOpen(false);
                      setRelationshipsPanelOpen(false);
                      setKingdomsPanelOpen(false);
                      setJourneysPanelOpen(false);
                    }
                  }
                }}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all",
                  "hover:bg-white/10 text-white/70 hover:text-white",
                  !sidebarOpen && "justify-center px-2",
                  legendsPanelOpen && isMapPage && "bg-accent/20 text-accent border border-accent/30"
                )}
              >
                <Palette className="w-5 h-5 shrink-0" />
                {sidebarOpen && (
                  <>
                    <span className="font-medium text-sm flex-1 text-left">Legends</span>
                    <ChevronRight className={cn(
                      "w-5 h-5 transition-transform duration-300 ease-out",
                      legendsPanelOpen && isMapPage ? "rotate-180 text-accent" : "text-white/50"
                    )} />
                  </>
                )}
              </button>

              {/* Kingdoms */}
              <button
                onClick={() => {
                  if (!isMapPage) {
                    navigate('/');
                    setTimeout(() => setKingdomsPanelOpen(true), 100);
                  } else {
                    setKingdomsPanelOpen(!kingdomsPanelOpen);
                    if (!kingdomsPanelOpen) {
                      setMapControlsPanelOpen(false);
                      setRelationshipsPanelOpen(false);
                      setLegendsPanelOpen(false);
                      setJourneysPanelOpen(false);
                    }
                  }
                }}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all",
                  "hover:bg-white/10 text-white/70 hover:text-white",
                  !sidebarOpen && "justify-center px-2",
                  kingdomsPanelOpen && isMapPage && "bg-accent/20 text-accent border border-accent/30"
                )}
              >
                <Crown className="w-5 h-5 shrink-0" />
                {sidebarOpen && (
                  <>
                    <span className="font-medium text-sm flex-1 text-left">Kingdoms</span>
                    <ChevronRight className={cn(
                      "w-5 h-5 transition-transform duration-300 ease-out",
                      kingdomsPanelOpen && isMapPage ? "rotate-180 text-accent" : "text-white/50"
                    )} />
                  </>
                )}
              </button>

              {/* Period & Region Filters */}
              <button
                onClick={() => {
                  if (!isMapPage) {
                    navigate('/');
                    setTimeout(() => setPeriodRegionPanelOpen(true), 100);
                  } else {
                    setPeriodRegionPanelOpen(!periodRegionPanelOpen);
                    if (!periodRegionPanelOpen) {
                      setMapControlsPanelOpen(false);
                      setRelationshipsPanelOpen(false);
                      setLegendsPanelOpen(false);
                      setKingdomsPanelOpen(false);
                      setJourneysPanelOpen(false);
                    }
                  }
                }}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all",
                  "hover:bg-white/10 text-white/70 hover:text-white",
                  !sidebarOpen && "justify-center px-2",
                  (periodRegionPanelOpen && isMapPage) && "bg-accent/20 text-accent border border-accent/30"
                )}
              >
                <Calendar className="w-5 h-5 shrink-0" />
                {sidebarOpen && (
                  <>
                    <span className="font-medium text-sm flex-1 text-left">Period & Region</span>
                    {hasActiveFilters && (
                      <span className="px-1.5 py-0.5 bg-primary/30 text-primary text-xs rounded-full mr-1">
                        {selectedPeriods.length + selectedRegions.length}
                      </span>
                    )}
                    <ChevronRight className={cn(
                      "w-5 h-5 transition-transform duration-300 ease-out",
                      periodRegionPanelOpen && isMapPage ? "rotate-180 text-accent" : "text-white/50"
                    )} />
                  </>
                )}
              </button>
            </div>

            {/* Divider */}
            <div className="border-t border-white/10 my-3" />

            {/* ========== SECTION 2: SCHOLARS ========== */}
            <div className="space-y-1">
              {sidebarOpen && (
                <div className="px-3 py-1 text-[10px] uppercase tracking-wider text-white/40 font-semibold">
                  Scholars
                </div>
              )}

              {/* Scholars - Page navigation, no arrow */}
              <NavLink
                to="/scholars"
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all",
                  "hover:bg-white/10 text-white/70 hover:text-white",
                  !sidebarOpen && "justify-center px-2"
                )}
                activeClassName="bg-accent/20 text-accent border border-accent/30"
              >
                <GraduationCap className="w-5 h-5 shrink-0" />
                {sidebarOpen && <span className="font-medium text-sm">Scholars</span>}
              </NavLink>

              {/* Relationships - shown on Map, Network, and Works pages */}
              {(isMapPage || isNetworkPage || isWorksPage) && (
                <button
                  onClick={() => {
                    setRelationshipsPanelOpen(!relationshipsPanelOpen);
                    if (!relationshipsPanelOpen) {
                      setMapControlsPanelOpen(false);
                      setLegendsPanelOpen(false);
                      setKingdomsPanelOpen(false);
                      setJourneysPanelOpen(false);
                    }
                  }}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all",
                    "hover:bg-white/10 text-white/70 hover:text-white",
                    !sidebarOpen && "justify-center px-2",
                    relationshipsPanelOpen && "bg-accent/20 text-accent border border-accent/30"
                  )}
                >
                  <Filter className="w-5 h-5 shrink-0" />
                  {sidebarOpen && (
                    <>
                      <span className="font-medium text-sm flex-1 text-left">Relationships</span>
                      <ChevronRight className={cn(
                        "w-5 h-5 transition-transform duration-300 ease-out",
                        relationshipsPanelOpen ? "rotate-180 text-accent" : "text-white/50"
                      )} />
                    </>
                  )}
                </button>
              )}

              {/* Scholars Network */}
              <NavLink
                to="/network"
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all",
                  "hover:bg-white/10 text-white/70 hover:text-white",
                  !sidebarOpen && "justify-center px-2"
                )}
                activeClassName="bg-accent/20 text-accent border border-accent/30"
              >
                <Share2 className="w-5 h-5 shrink-0" />
                {sidebarOpen && <span className="font-medium text-sm">Scholars Network</span>}
              </NavLink>
            </div>

            {/* Divider */}
            <div className="border-t border-white/10 my-3" />

            {/* ========== SECTION 3: TEXTS ========== */}
            <div className="space-y-1">
              {sidebarOpen && (
                <div className="px-3 py-1 text-[10px] uppercase tracking-wider text-white/40 font-semibold">
                  Texts
                </div>
              )}

              {/* Texts - Page navigation, no arrow */}
              <NavLink
                to="/texts"
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all",
                  "hover:bg-white/10 text-white/70 hover:text-white",
                  !sidebarOpen && "justify-center px-2"
                )}
                activeClassName="bg-accent/20 text-accent border border-accent/30"
              >
                <BookOpen className="w-5 h-5 shrink-0" />
                {sidebarOpen && <span className="font-medium text-sm">Texts</span>}
              </NavLink>

              {/* Works Network (renamed to Texts Network) */}
              <NavLink
                to="/works"
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all",
                  "hover:bg-white/10 text-white/70 hover:text-white",
                  !sidebarOpen && "justify-center px-2"
                )}
                activeClassName="bg-accent/20 text-accent border border-accent/30"
              >
                <Library className="w-5 h-5 shrink-0" />
                {sidebarOpen && <span className="font-medium text-sm">Texts Network</span>}
              </NavLink>

            </div>

            {/* Divider */}
            <div className="border-t border-white/10 my-3" />

            {/* ========== SECTION 3: HISTORY ========== */}
            <div className="space-y-1">
              {sidebarOpen && (
                <div className="px-3 py-1 text-[10px] uppercase tracking-wider text-white/40 font-semibold">
                  History
                </div>
              )}

              {/* Timeline */}
              <NavLink
                to="/timeline"
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all",
                  "hover:bg-white/10 text-white/70 hover:text-white",
                  !sidebarOpen && "justify-center px-2"
                )}
                activeClassName="bg-accent/20 text-accent border border-accent/30"
              >
                <Clock className="w-5 h-5 shrink-0" />
                {sidebarOpen && <span className="font-medium text-sm">Timeline</span>}
              </NavLink>

              {/* Historical Context */}
              <NavLink
                to="/context"
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all",
                  "hover:bg-white/10 text-white/70 hover:text-white",
                  !sidebarOpen && "justify-center px-2"
                )}
                activeClassName="bg-accent/20 text-accent border border-accent/30"
              >
                <BookOpen className="w-5 h-5 shrink-0" />
                {sidebarOpen && <span className="font-medium text-sm">Historical Context</span>}
              </NavLink>

              {/* Scholar Journeys */}
              <button
                onClick={() => {
                  if (!isMapPage) {
                    navigate('/');
                    setTimeout(() => setJourneysPanelOpen(true), 100);
                  } else {
                    setJourneysPanelOpen(!journeysPanelOpen);
                    if (!journeysPanelOpen) {
                      setMapControlsPanelOpen(false);
                      setRelationshipsPanelOpen(false);
                      setLegendsPanelOpen(false);
                      setKingdomsPanelOpen(false);
                    }
                  }
                }}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all",
                  "hover:bg-white/10 text-white/70 hover:text-white",
                  !sidebarOpen && "justify-center px-2",
                  journeysPanelOpen && isMapPage && "bg-accent/20 text-accent border border-accent/30"
                )}
              >
                <Route className="w-5 h-5 shrink-0" />
                {sidebarOpen && (
                  <>
                    <span className="font-medium text-sm flex-1 text-left">Scholar Journeys</span>
                    <ChevronRight className={cn(
                      "w-5 h-5 transition-transform duration-300 ease-out",
                      journeysPanelOpen && isMapPage ? "rotate-180 text-accent" : "text-white/50"
                    )} />
                  </>
                )}
              </button>

              {/* Work Journey - navigates to main map in works mode */}
              <button
                onClick={() => {
                  setMapEntityMode('works');
                  navigate('/');
                }}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all w-full text-left",
                  "hover:bg-white/10 text-white/70 hover:text-white",
                  isMapPage && mapEntityMode === 'works' 
                    ? "bg-accent/20 text-accent border border-accent/30" 
                    : "",
                  !sidebarOpen && "justify-center px-2"
                )}
              >
                <ScrollText className="w-5 h-5 shrink-0" />
                {sidebarOpen && <span className="font-medium text-sm">Work Journey</span>}
              </button>
            </div>
          </nav>

          {/* Spacer */}
          <div className="flex-shrink-0" />

          {/* Footer */}
        </aside>

        {/* Slide-out Panel for Scholar Relationships - Map and Network pages */}
        {(isMapPage || isNetworkPage) && relationshipsPanelOpen && (
          <div className={cn(
            "h-full bg-sidebar/95 backdrop-blur-md border-r border-white/10 shadow-xl transition-all duration-300",
            "flex flex-col"
          )}>
            <RelationshipFilterPanel onClose={() => setRelationshipsPanelOpen(false)} />
          </div>
        )}

        {/* Slide-out Panel for Text Relationships - Works page only */}
        {isWorksPage && relationshipsPanelOpen && (
          <div className={cn(
            "h-full bg-sidebar/95 backdrop-blur-md border-r border-white/10 shadow-xl transition-all duration-300",
            "flex flex-col"
          )}>
            <TextualRelationshipsPanel onClose={() => setRelationshipsPanelOpen(false)} />
          </div>
        )}

        {/* Slide-out Panel for Map Controls - Full height */}
        {isMapPage && mapControlsPanelOpen && (
          <div className={cn(
            "h-full bg-sidebar/95 backdrop-blur-md border-r border-white/10 shadow-xl transition-all duration-300",
            "flex flex-col"
          )}>
            <MapControlsPanel
              showBoundaries={showBoundaries}
              onShowBoundariesChange={setShowBoundaries}
              showBoundaryShading={showBoundaryShading}
              onShowBoundaryShadingChange={setShowBoundaryShading}
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
              showTextNamesEnglish={showTextNamesEnglish}
              onShowTextNamesEnglishChange={setShowTextNamesEnglish}
              showTextNamesHebrew={showTextNamesHebrew}
              onShowTextNamesHebrewChange={setShowTextNamesHebrew}
              cityFilter={cityFilter}
              onCityFilterChange={setCityFilter}
              showOnlyScholarCities={showOnlyScholarCities}
              onShowOnlyScholarCitiesChange={setShowOnlyScholarCities}
              mapEntityMode={mapEntityMode}
              onMapEntityModeChange={setMapEntityMode}
              onClose={() => setMapControlsPanelOpen(false)}
            />
          </div>
        )}

        {/* Slide-out Panel for Legends - Full height */}
        {isMapPage && legendsPanelOpen && (
          <div className={cn(
            "h-full bg-sidebar/95 backdrop-blur-md border-r border-white/10 shadow-xl transition-all duration-300",
            "flex flex-col w-72"
          )}>
            <div className="p-4 border-b border-white/10 shrink-0">
              <button 
                onClick={() => setLegendsPanelOpen(false)}
                className="flex items-center gap-2 text-accent font-bold hover:text-accent/80 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                <Palette className="w-4 h-4" />
                <span className="text-xs uppercase tracking-widest">Map Legend</span>
              </button>
            </div>
            <div className="p-4 flex-1 overflow-auto">
              <MapLegend showConnections={showConnections} showMigrations={showMigrations} relationships={relationships} isEmbedded />
            </div>
          </div>
        )}

        {/* Slide-out Panel for Kingdoms - Full height */}
        {isMapPage && kingdomsPanelOpen && (
          <div className={cn(
            "h-full bg-sidebar/95 backdrop-blur-md border-r border-white/10 shadow-xl transition-all duration-300",
            "flex flex-col w-72"
          )}>
            <div className="p-4 border-b border-white/10 shrink-0">
              <button 
                onClick={() => setKingdomsPanelOpen(false)}
                className="flex items-center gap-2 text-accent font-bold hover:text-accent/80 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                <Crown className="w-4 h-4" />
                <span className="text-xs uppercase tracking-widest">Medieval Kingdoms</span>
              </button>
            </div>
            <div className="p-4 flex-1 overflow-auto">
              <KingdomsLegend isEmbedded />
            </div>
          </div>
        )}

        {/* Slide-out Panel for Scholar Journeys - Full height */}
        {isMapPage && journeysPanelOpen && (
          <div className={cn(
            "h-full bg-sidebar/95 backdrop-blur-md border-r border-white/10 shadow-xl transition-all duration-300",
            "flex flex-col"
          )}>
            <ScholarJourneysPanel
              showJourneyMarkers={showJourneyMarkers}
              onShowJourneyMarkersChange={setShowJourneyMarkers}
              journeyReasonFilter={journeyReasonFilter}
              onJourneyReasonFilterChange={setJourneyReasonFilter}
              onClose={() => setJourneysPanelOpen(false)}
            />
          </div>
        )}

        {/* Slide-out Panel for Period & Region Filters - Full height */}
        {isMapPage && periodRegionPanelOpen && (
          <div className={cn(
            "h-full bg-sidebar/95 backdrop-blur-md border-r border-white/10 shadow-xl transition-all duration-300",
            "flex flex-col w-80"
          )}>
            <div className="p-4 border-b border-white/10 shrink-0">
              <button 
                onClick={() => setPeriodRegionPanelOpen(false)}
                className="flex items-center gap-2 text-accent font-bold hover:text-accent/80 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                <Calendar className="w-4 h-4" />
                <span className="text-xs uppercase tracking-widest">Period & Region</span>
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              <FilterPanel
                isOpen={true}
                onClose={() => setPeriodRegionPanelOpen(false)}
                selectedPeriods={selectedPeriods}
                onPeriodsChange={setSelectedPeriods}
                periodMode={periodMode}
                onPeriodModeChange={setPeriodMode}
                onTimeRangeChange={setDerivedTimeRange}
                selectedRegions={selectedRegions}
                onRegionsChange={setSelectedRegions}
                regionMode={regionMode}
                onRegionModeChange={setRegionMode}
              />
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <main className="flex-1 relative bg-background overflow-hidden">
        <Outlet />
      </main>
    </div>
  );
}
