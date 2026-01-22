import { useState } from 'react';
import { WorksNetworkView } from '@/components/WorksNetworkView';
import { useWorksWithAuthors, useTextualRelationshipsWithWorks, type WorkWithAuthor } from '@/hooks/useWorks';
import { Skeleton } from '@/components/ui/skeleton';

const WorksNetwork = () => {
  const [selectedWork, setSelectedWork] = useState<WorkWithAuthor | null>(null);

  const { data: works = [], isLoading: worksLoading } = useWorksWithAuthors();
  const { data: relationships = [], isLoading: relationshipsLoading } = useTextualRelationshipsWithWorks();

  const isLoading = worksLoading || relationshipsLoading;

  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-background">
        <Skeleton className="w-[80%] h-[80%] rounded-xl" />
      </div>
    );
  }

  return (
    <div className="w-full h-full relative bg-background">
      <WorksNetworkView
        works={works}
        relationships={relationships}
        selectedWork={selectedWork}
        onSelectWork={setSelectedWork}
      />
    </div>
  );
};

export default WorksNetwork;
