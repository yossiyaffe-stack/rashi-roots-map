import { useState } from 'react';
import { NetworkView } from '@/components/NetworkView';
import { useScholars, useMultiDimensionalRelationships, type DbScholar } from '@/hooks/useScholars';
import { Skeleton } from '@/components/ui/skeleton';
import { ScholarDetailPanel } from '@/components/ScholarDetailPanel';
import { RelationshipFilterPanel } from '@/components/RelationshipFilterPanel';

const Network = () => {
  const [selectedScholar, setSelectedScholar] = useState<DbScholar | null>(null);

  const { data: scholars = [], isLoading: scholarsLoading } = useScholars();
  const { 
    biographical, 
    textual, 
    intellectual, 
    isLoading: relationshipsLoading 
  } = useMultiDimensionalRelationships();

  const isLoading = scholarsLoading || relationshipsLoading;

  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-background">
        <Skeleton className="w-[80%] h-[80%] rounded-xl" />
      </div>
    );
  }

  return (
    <div className="w-full h-full relative bg-background flex">
      {/* Filters Panel */}
      <div className="w-64 shrink-0 bg-sidebar border-r border-white/10 p-4 overflow-y-auto">
        <RelationshipFilterPanel />
      </div>
      
      {/* Network View */}
      <div className="flex-1 relative">
        <NetworkView
          scholars={scholars}
          biographicalRelationships={biographical}
          textualRelationships={textual}
          intellectualRelationships={intellectual}
          selectedScholar={selectedScholar}
          onSelectScholar={setSelectedScholar}
        />

        {selectedScholar && (
          <ScholarDetailPanel
            scholar={selectedScholar}
            onClose={() => setSelectedScholar(null)}
          />
        )}
      </div>
    </div>
  );
};

export default Network;
