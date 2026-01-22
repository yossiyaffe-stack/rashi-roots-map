import { Calendar, MapPin, Users, BookOpen, X } from 'lucide-react';
import type { Scholar } from '@/data/scholars';
import { Button } from '@/components/ui/button';

interface ScholarDetailProps {
  scholar: Scholar;
  onClose: () => void;
}

export const ScholarDetail = ({ scholar, onClose }: ScholarDetailProps) => {
  return (
    <div className="bg-card rounded-xl p-6 shadow-card sticky top-8 max-h-[calc(100vh-4rem)] overflow-y-auto border-[3px] border-primary animate-scale-in">
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-4 right-4 text-secondary hover:text-brown-dark hover:bg-secondary/10 rounded-full"
        onClick={onClose}
      >
        <X className="w-6 h-6" />
      </Button>

      <h2 className="font-display text-2xl text-foreground mb-1 pr-8">
        {scholar.name}
      </h2>
      
      <h3 className="font-hebrew text-3xl text-secondary font-normal mb-6">
        {scholar.hebrewName}
      </h3>

      <div className="space-y-4">
        {/* Life dates */}
        <div className="flex gap-3 pb-4 border-b border-primary/20">
          <Calendar className="w-5 h-5 text-secondary flex-shrink-0 mt-0.5" />
          <span>
            <strong className="text-brown-dark">Life:</strong> {scholar.birth} – {scholar.death}
          </span>
        </div>

        {/* Period badge */}
        {scholar.period && (
          <div className="pb-4 border-b border-primary/20">
            <span className="inline-block px-4 py-2 gradient-button text-primary-foreground rounded-full font-semibold text-sm">
              {scholar.period}
            </span>
          </div>
        )}

        {/* Location */}
        <div className="flex gap-3 pb-4 border-b border-primary/20">
          <MapPin className="w-5 h-5 text-secondary flex-shrink-0 mt-0.5" />
          <div>
            <strong className="text-brown-dark block mb-1">Location:</strong>
            <span>{scholar.location.city}</span>
            <div className="text-sm text-muted-foreground mt-1">
              <em className="text-secondary font-semibold not-italic">Modern:</em> {scholar.location.modernRegion}
            </div>
            <div className="text-sm text-muted-foreground">
              <em className="text-secondary font-semibold not-italic">Historical:</em> {scholar.location.historicalContext}
            </div>
          </div>
        </div>

        {/* Relation to Rashi */}
        {scholar.relationToRashi && (
          <div className="flex gap-3 pb-4 border-b border-primary/20">
            <Users className="w-5 h-5 text-secondary flex-shrink-0 mt-0.5" />
            <span>
              <strong className="text-brown-dark">Relation to Rashi:</strong> {scholar.relationToRashi}
            </span>
          </div>
        )}

        {/* Scholarly Role */}
        {scholar.relationshipType && (
          <div className="flex gap-3 pb-4 border-b border-primary/20 bg-secondary/5 -mx-6 px-6 py-4 rounded-lg border-2 border-secondary/30">
            <span className="text-xl flex-shrink-0">🔗</span>
            <div>
              <strong className="text-brown-dark block mb-1">Scholarly Role:</strong>
              <div className="text-muted-foreground italic capitalize">
                {scholar.relationshipType.replace(/_/g, ' ')}
              </div>
            </div>
          </div>
        )}

        {/* Major Works */}
        <div className="flex gap-3 pb-4 border-b border-primary/20">
          <BookOpen className="w-5 h-5 text-secondary flex-shrink-0 mt-0.5" />
          <div>
            <strong className="text-brown-dark block mb-2">Major Works:</strong>
            <ul className="list-disc list-inside space-y-1 text-sepia">
              {scholar.works.map((work, idx) => (
                <li key={idx}>{work}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* Commentaries on Rashi */}
        {scholar.commentariesOnRashi && (
          <div className="flex gap-3 pb-4 border-b border-primary/20 gradient-card -mx-6 px-6 py-4 rounded-lg border-2 border-primary">
            <span className="text-xl flex-shrink-0">📜</span>
            <div>
              <strong className="text-brown-dark block mb-2">Commentaries on Rashi:</strong>
              <ul className="list-disc list-inside space-y-1 text-sepia">
                {scholar.commentariesOnRashi.map((comm, idx) => (
                  <li key={idx}>{comm}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Commented On */}
        {scholar.commentedOn && (
          <div className="pb-4 border-b border-primary/20">
            <strong className="text-brown-dark block mb-2">Commented On:</strong>
            <div className="flex flex-wrap gap-2">
              {scholar.commentedOn.map((text, idx) => (
                <span
                  key={idx}
                  className="gradient-button text-primary-foreground px-3 py-1 rounded-full text-sm font-medium"
                >
                  {text}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Historical Notes */}
        {scholar.notes && (
          <div className="flex gap-3 bg-primary/5 -mx-6 px-6 py-4 rounded-lg border border-primary/20">
            <span className="text-xl flex-shrink-0">📝</span>
            <div>
              <strong className="text-brown-dark block mb-2">Historical Notes:</strong>
              <p className="text-brown-dark leading-relaxed">{scholar.notes}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
