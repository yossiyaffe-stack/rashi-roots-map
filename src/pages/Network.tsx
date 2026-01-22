import { useState } from 'react';
import { NetworkView } from '@/components/NetworkView';
import { useScholars, useRelationships, type DbScholar } from '@/hooks/useScholars';
import { Skeleton } from '@/components/ui/skeleton';
import { ScholarDetailPanel } from '@/components/ScholarDetailPanel';

const Network = () => {
  const [selectedScholar, setSelectedScholar] = useState<DbScholar | null>(null);

  const { data: scholars = [], isLoading: scholarsLoading } = useScholars();
  const { data: relationships = [], isLoading: relationshipsLoading } = useRelationships();

  const isLoading = scholarsLoading || relationshipsLoading;

  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-background">
        <Skeleton className="w-[80%] h-[80%] rounded-xl" />
      </div>
    );
  }

  return (
    <div className="w-full h-full relative bg-background">
      <NetworkView
        scholars={scholars}
        relationships={relationships}
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
  );
};

export default Network;
