import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SEFARIA_BASE = "https://www.sefaria.org/api";

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const action = url.searchParams.get('action');
    const query = url.searchParams.get('query');
    const ref = url.searchParams.get('ref');

    let result: any;

    switch (action) {
      case 'search':
        // Search Sefaria for texts by author/title
        if (!query) {
          return new Response(
            JSON.stringify({ error: 'Query parameter required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        result = await searchSefaria(query);
        break;

      case 'text':
        // Get specific text content
        if (!ref) {
          return new Response(
            JSON.stringify({ error: 'Ref parameter required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        result = await getText(ref);
        break;

      case 'links':
        // Get links/citations for a text
        if (!ref) {
          return new Response(
            JSON.stringify({ error: 'Ref parameter required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        result = await getLinks(ref);
        break;

      case 'rashi-lineage':
        // Get Rashi commentary structure and supercommentaries
        result = await getRashiLineage();
        break;

      case 'author-works':
        // Get works by a specific author
        if (!query) {
          return new Response(
            JSON.stringify({ error: 'Query parameter required for author' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        result = await getAuthorWorks(query);
        break;

      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action. Use: search, text, links, rashi-lineage, or author-works' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (err) {
    const error = err as Error;
    console.error('Sefaria API error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function searchSefaria(query: string) {
  const response = await fetch(
    `${SEFARIA_BASE}/search-wrapper?query=${encodeURIComponent(query)}&type=text&field=naive_lemmatizer&size=20`
  );
  
  if (!response.ok) {
    throw new Error(`Sefaria search failed: ${response.status}`);
  }
  
  const data = await response.json();
  
  // Transform to a cleaner format
  return {
    total: data.hits?.total || 0,
    results: (data.hits?.hits || []).map((hit: any) => ({
      ref: hit._source?.ref,
      title: hit._source?.ref?.split(',')[0] || hit._source?.ref,
      heRef: hit._source?.heRef,
      text: hit._source?.naive_lemmatizer,
      categories: hit._source?.path?.split('/').filter(Boolean) || [],
      score: hit._score,
    })),
  };
}

async function getText(ref: string) {
  const response = await fetch(
    `${SEFARIA_BASE}/texts/${encodeURIComponent(ref.replace(/ /g, '_'))}`
  );
  
  if (!response.ok) {
    throw new Error(`Failed to get text: ${response.status}`);
  }
  
  const data = await response.json();
  
  return {
    ref: data.ref,
    heRef: data.heRef,
    text: data.text,
    he: data.he,
    categories: data.categories,
    book: data.book,
    indexTitle: data.indexTitle,
    sectionRef: data.sectionRef,
    heSectionRef: data.heSectionRef,
    versions: data.versions,
  };
}

async function getLinks(ref: string) {
  const response = await fetch(
    `${SEFARIA_BASE}/links/${encodeURIComponent(ref.replace(/ /g, '_'))}`
  );
  
  if (!response.ok) {
    throw new Error(`Failed to get links: ${response.status}`);
  }
  
  const links = await response.json();
  
  // Group by type and category
  const grouped: Record<string, any[]> = {};
  
  for (const link of links) {
    const type = link.type || 'commentary';
    if (!grouped[type]) {
      grouped[type] = [];
    }
    grouped[type].push({
      ref: link.ref,
      heRef: link.heRef,
      category: link.category,
      text: link.text,
      he: link.he,
      sourceRef: link.sourceRef,
      anchorRef: link.anchorRef,
    });
  }
  
  return {
    ref,
    totalLinks: links.length,
    byType: grouped,
  };
}

async function getRashiLineage() {
  // Get Rashi on Torah index
  const rashiResponse = await fetch(`${SEFARIA_BASE}/v2/index/Rashi_on_Genesis`);
  
  if (!rashiResponse.ok) {
    throw new Error(`Failed to get Rashi index: ${rashiResponse.status}`);
  }
  
  const rashiData = await rashiResponse.json();
  
  // Search for supercommentaries on Rashi
  const supercommResponse = await fetch(
    `${SEFARIA_BASE}/search-wrapper?query=Rashi&type=text&field=naive_lemmatizer&filters[category]=Commentary&size=50`
  );
  
  let supercommentaries: any[] = [];
  if (supercommResponse.ok) {
    const superData = await supercommResponse.json();
    supercommentaries = (superData.hits?.hits || [])
      .filter((hit: any) => {
        const ref = hit._source?.ref || '';
        return ref.toLowerCase().includes('rashi') && 
               (ref.toLowerCase().includes('on rashi') || 
                hit._source?.categories?.includes('Commentary'));
      })
      .map((hit: any) => ({
        ref: hit._source?.ref,
        title: hit._source?.ref?.split(',')[0],
        categories: hit._source?.categories,
      }));
  }
  
  // Known supercommentaries on Rashi
  const knownSupercommentaries = [
    { title: "Mizrachi", heTitle: "מזרחי", author: "Elijah Mizrachi" },
    { title: "Gur Aryeh", heTitle: "גור אריה", author: "Maharal of Prague" },
    { title: "Siftei Chakhamim", heTitle: "שפתי חכמים", author: "Shabbethai Bass" },
    { title: "Be'er Yitzchak", heTitle: "באר יצחק", author: "Isaac Horowitz" },
    { title: "Divrei David", heTitle: "דברי דוד", author: "David ben Samuel HaLevi" },
    { title: "Nachalat Yaakov", heTitle: "נחלת יעקב", author: "Jacob ben Moses Lorberbaum" },
  ];
  
  return {
    baseText: {
      title: "Rashi on Torah",
      heTitle: "רש\"י על התורה",
      author: "Rashi",
      categories: rashiData.categories,
      books: ["Genesis", "Exodus", "Leviticus", "Numbers", "Deuteronomy"],
    },
    supercommentaries: knownSupercommentaries,
    relatedTexts: supercommentaries.slice(0, 20),
  };
}

async function getAuthorWorks(authorName: string) {
  // Map scholar names to known Sefaria work titles
  const authorData: Record<string, { works: string[] }> = {
    'rashi': {
      works: [
        'Rashi on Genesis', 'Rashi on Exodus', 'Rashi on Leviticus', 
        'Rashi on Numbers', 'Rashi on Deuteronomy', 'Rashi on Berakhot',
        'Rashi on Shabbat', 'Rashi on Pesachim', 'Rashi on Megillah'
      ]
    },
    'rashbam': {
      works: ['Rashbam on Genesis', 'Rashbam on Exodus', 'Rashbam on Leviticus', 'Rashbam on Bava Batra']
    },
    'ibn ezra': {
      works: ['Ibn Ezra on Genesis', 'Ibn Ezra on Exodus', 'Ibn Ezra on Psalms', 'Ibn Ezra on Isaiah']
    },
    'abraham ibn ezra': {
      works: ['Ibn Ezra on Genesis', 'Ibn Ezra on Exodus', 'Ibn Ezra on Psalms']
    },
    'ramban': {
      works: ['Ramban on Genesis', 'Ramban on Exodus', 'Ramban on Leviticus', 'Ramban on Numbers', 'Ramban on Deuteronomy']
    },
    'nachmanides': {
      works: ['Ramban on Genesis', 'Ramban on Exodus']
    },
    'mizrachi': {
      works: ['Mizrachi']
    },
    'sforno': {
      works: ['Sforno on Genesis', 'Sforno on Exodus', 'Sforno on Leviticus']
    },
    'ohr hachaim': {
      works: ['Or HaChaim on Genesis', 'Or HaChaim on Exodus']
    },
  };

  const normalizedName = authorName.toLowerCase();
  const authorInfo = authorData[normalizedName];
  const works: any[] = [];

  try {
    if (authorInfo) {
      // Fetch index info for each known work
      for (const workTitle of authorInfo.works) {
        try {
          const indexUrl = `${SEFARIA_BASE}/v2/index/${encodeURIComponent(workTitle.replace(/ /g, '_'))}`;
          const response = await fetch(indexUrl);
          if (response.ok) {
            const data = await response.json();
            works.push({
              title: data.title || workTitle,
              hebrewTitle: data.heTitle,
              categories: data.categories || [],
              description: data.enDesc || data.enShortDesc,
              sefariaUrl: `https://www.sefaria.org/${encodeURIComponent(workTitle.replace(/ /g, '_'))}`,
            });
          }
        } catch {
          // Continue on individual errors
        }
      }
    } else {
      // Fallback: search for the author name
      const searchUrl = `${SEFARIA_BASE}/search-wrapper?query=${encodeURIComponent(authorName)}&type=text&field=naive_lemmatizer&size=20`;
      const response = await fetch(searchUrl);
      if (response.ok) {
        const data = await response.json();
        const seen = new Set<string>();
        for (const hit of (data.hits?.hits || [])) {
          const ref = hit._source?.ref;
          const title = ref?.split(',')[0];
          if (title && !seen.has(title.toLowerCase())) {
            seen.add(title.toLowerCase());
            works.push({
              title,
              hebrewTitle: hit._source?.heRef?.split(',')[0],
              categories: hit._source?.path?.split('/').filter(Boolean) || [],
              sefariaUrl: `https://www.sefaria.org/${encodeURIComponent(ref.replace(/ /g, '_'))}`,
            });
          }
        }
      }
    }

    return {
      author: authorName,
      totalFound: works.length,
      works,
    };
  } catch (err) {
    const error = err as Error;
    console.error('Sefaria author works error:', error);
    return {
      author: authorName,
      totalFound: 0,
      works: [],
      error: error.message,
    };
  }
}
