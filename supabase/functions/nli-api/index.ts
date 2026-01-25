import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// NLI API base URL
const NLI_BASE = "https://api.nli.org.il/openlibrary/v1";

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const action = url.searchParams.get('action');
    const query = url.searchParams.get('query');
    const id = url.searchParams.get('id');
    
    // Get NLI API key from secrets
    const apiKey = Deno.env.get('NLI_API_KEY');

    let result: any;

    switch (action) {
      case 'search':
        // Search for manuscripts/items
        if (!query) {
          return new Response(
            JSON.stringify({ error: 'Query parameter required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        result = await searchNLI(query, apiKey);
        break;

      case 'item':
        // Get specific item details
        if (!id) {
          return new Response(
            JSON.stringify({ error: 'ID parameter required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        result = await getItem(id, apiKey);
        break;

      case 'iiif':
        // Get IIIF manifest for a manuscript
        if (!id) {
          return new Response(
            JSON.stringify({ error: 'ID parameter required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        result = await getIIIFManifest(id);
        break;

      case 'scholar-manuscripts':
        // Search manuscripts by scholar/author
        if (!query) {
          return new Response(
            JSON.stringify({ error: 'Query parameter required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        result = await searchScholarManuscripts(query, apiKey);
        break;

      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action. Use: search, item, iiif, or scholar-manuscripts' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (err) {
    const error = err as Error;
    console.error('NLI API error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function searchNLI(query: string, apiKey?: string) {
  const searchUrl = `https://www.nli.org.il/en/search?keyword=${encodeURIComponent(query)}`;
  
  // Always return a graceful response with a link to search NLI directly
  // The NLI Open Library API has been unreliable, so we provide manual search links
  return {
    query,
    totalResults: 0,
    results: [],
    searchUrl,
    notice: "Browse the NLI collection directly for manuscripts related to this scholar.",
    instructions: "Click the link below to search the National Library of Israel catalog.",
  };
}

async function getItem(id: string, apiKey?: string) {
  if (!apiKey) {
    return {
      notice: "NLI API key not configured",
      id,
      viewerUrl: `https://www.nli.org.il/en/manuscripts/${id}`,
    };
  }

  try {
    const response = await fetch(`${NLI_BASE}/items/${id}?apikey=${apiKey}`);
    
    if (!response.ok) {
      throw new Error(`Failed to get item: ${response.status}`);
    }
    
    const data = await response.json();
    
    return {
      id: data.recordid || id,
      title: data.title,
      creator: data.creator,
      date: data.date,
      description: data.description,
      physicalDescription: data.physicalDescription,
      language: data.language,
      subjects: data.subjects,
      collection: data.collection,
      repository: data.repository,
      shelfmark: data.shelfmark,
      viewerUrl: `https://www.nli.org.il/en/manuscripts/${id}`,
      iiifManifest: data.iiifManifest,
      images: data.images,
    };
  } catch (err) {
    const error = err as Error;
    return {
      id,
      error: error.message,
      viewerUrl: `https://www.nli.org.il/en/manuscripts/${id}`,
    };
  }
}

async function getIIIFManifest(id: string) {
  // NLI IIIF manifest URL pattern
  const manifestUrl = `https://iiif.nli.org.il/IIIFv21/${id}/manifest`;
  
  try {
    const response = await fetch(manifestUrl);
    
    if (!response.ok) {
      // Try alternative pattern
      const altUrl = `https://www.nli.org.il/iiif/presentation/2.0/${id}/manifest.json`;
      const altResponse = await fetch(altUrl);
      
      if (!altResponse.ok) {
        return {
          id,
          error: 'IIIF manifest not found',
          manifestUrl,
          viewerUrl: `https://www.nli.org.il/en/manuscripts/${id}`,
        };
      }
      
      return await altResponse.json();
    }
    
    return await response.json();
  } catch (err) {
    const error = err as Error;
    return {
      id,
      error: error.message,
      manifestUrl,
      viewerUrl: `https://www.nli.org.il/en/manuscripts/${id}`,
    };
  }
}

async function searchScholarManuscripts(scholarName: string, apiKey?: string) {
  // Common scholar name variants for better search
  const nameVariants: Record<string, string[]> = {
    'rashi': ['Rashi', 'רש"י', 'Shlomo Yitzchaki', 'שלמה יצחקי'],
    'rashbam': ['Rashbam', 'רשב"ם', 'Samuel ben Meir'],
    'ibn ezra': ['Ibn Ezra', 'אבן עזרא', 'Abraham ibn Ezra'],
    'rambam': ['Rambam', 'רמב"ם', 'Maimonides'],
    'ramban': ['Ramban', 'רמב"ן', 'Nachmanides'],
    'mizrachi': ['Mizrachi', 'מזרחי', 'Elijah Mizrachi'],
  };
  
  const normalizedName = scholarName.toLowerCase().replace(/[()]/g, '').trim();
  const matchingKey = Object.keys(nameVariants).find(key => normalizedName.includes(key));
  const searchTerms = matchingKey ? nameVariants[matchingKey] : [scholarName];
  
  // Provide NLI search URL for manual exploration
  const searchUrl = `https://www.nli.org.il/en/search?keyword=${encodeURIComponent(searchTerms[0])}`;
  
  return {
    scholar: scholarName,
    searchTerms,
    totalFound: 0,
    manuscripts: [],
    allItems: [],
    notice: "Browse the NLI collection directly for manuscripts.",
    searchUrl,
  };
}
