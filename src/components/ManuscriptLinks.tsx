import { BookOpen, ExternalLink } from 'lucide-react';

const manuscriptLinks = [
  {
    name: 'National Library of Israel',
    url: 'https://www.nli.org.il/en/discover/manuscripts',
    description: 'Hebrew Manuscripts Collection',
  },
  {
    name: 'British Library Hebrew',
    url: 'https://www.bl.uk/hebrew-manuscripts',
    description: 'Digitized Hebrew Manuscripts',
  },
  {
    name: 'Ktiv - NLI Manuscripts',
    url: 'https://web.nli.org.il/sites/NLIS/en/ManusriptAndBooks',
    description: 'Unified Hebrew Manuscript Portal',
  },
  {
    name: 'Sefaria Library',
    url: 'https://www.sefaria.org/texts',
    description: 'Rashi & Commentaries',
  },
  {
    name: 'HebrewBooks.org',
    url: 'https://hebrewbooks.org/',
    description: 'Historic Jewish Texts',
  },
];

export function ManuscriptLinks() {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-accent font-bold">
        <BookOpen className="w-3.5 h-3.5" />
        Manuscript Resources
      </div>
      <div className="space-y-1.5">
        {manuscriptLinks.map((link) => (
          <a
            key={link.name}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-2 p-2 rounded-lg hover:bg-white/5 transition-colors"
          >
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium text-foreground group-hover:text-accent transition-colors truncate">
                {link.name}
              </div>
              <div className="text-[10px] text-muted-foreground truncate">
                {link.description}
              </div>
            </div>
            <ExternalLink className="w-3 h-3 text-muted-foreground group-hover:text-accent shrink-0" />
          </a>
        ))}
      </div>
    </div>
  );
}
