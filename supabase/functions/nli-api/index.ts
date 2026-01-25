import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// NLI API base URL - correct endpoint
const NLI_SEARCH_URL = "https://api.nli.org.il/openlibrary/search";

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
    
    console.log('NLI API called:', { action, query, id, hasApiKey: !!apiKey });

    let result: any;

    switch (action) {
      case 'search':
        if (!query) {
          return new Response(
            JSON.stringify({ error: 'Query parameter required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        result = await searchNLI(query, apiKey);
        break;

      case 'item':
        if (!id) {
          return new Response(
            JSON.stringify({ error: 'ID parameter required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        result = await getItem(id, apiKey);
        break;

      case 'iiif':
        if (!id) {
          return new Response(
            JSON.stringify({ error: 'ID parameter required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        result = await getIIIFManifest(id);
        break;

      case 'scholar-manuscripts':
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
  
  if (!apiKey) {
    console.log('No API key, returning fallback');
    return {
      query,
      totalResults: 0,
      results: [],
      searchUrl,
      notice: "NLI API key not configured. Browse the NLI collection directly.",
    };
  }

  try {
    // NLI Search API format: query=keyword,contains,{term}
    const searchQuery = `keyword,contains,${query}`;
    const apiUrl = `${NLI_SEARCH_URL}?api_key=${apiKey}&query=${encodeURIComponent(searchQuery)}&items_per_page=20`;
    console.log('Fetching from NLI API:', apiUrl.replace(apiKey, '[REDACTED]'));
    
    const response = await fetch(apiUrl, {
      headers: {
        'Accept': 'application/json',
      },
    });
    
    console.log('NLI API response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('NLI API error response:', errorText);
      
      return {
        query,
        totalResults: 0,
        results: [],
        searchUrl,
        notice: `NLI API returned ${response.status}. Browse the collection directly.`,
        apiError: errorText.substring(0, 200),
      };
    }
    
    const data = await response.json();
    console.log('NLI API returned data keys:', Object.keys(data));
    
    // Parse the response - NLI returns array-like object with numeric keys
    let results: any[] = [];
    if (Array.isArray(data)) {
      results = data;
    } else if (data.result) {
      results = data.result;
    } else if (data.results) {
      results = data.results;
    } else {
      // Convert object with numeric keys to array
      const keys = Object.keys(data).filter(k => !isNaN(Number(k)));
      results = keys.map(k => data[k]);
    }
    
    const totalCount = data.total_count || data.totalRecords || results.length;
    
    return {
      query,
      totalResults: totalCount,
      results: results.slice(0, 20).map((item: any) => ({
        id: item.record_id || item.recordid || item.id,
        title: item.title,
        creator: item.creator,
        date: item.date || item.creation_date,
        description: item.description,
        type: item.type || item.material_type,
        thumbnail: item.thumbnail,
        viewerUrl: `https://www.nli.org.il/en/manuscripts/${item.record_id || item.recordid || item.id}`,
      })),
      searchUrl,
    };
  } catch (err) {
    const error = err as Error;
    console.error('NLI search error:', error);
    return {
      query,
      totalResults: 0,
      results: [],
      searchUrl,
      notice: "Error connecting to NLI API. Browse the collection directly.",
      error: error.message,
    };
  }
}

async function getItem(id: string, apiKey?: string) {
  const viewerUrl = `https://www.nli.org.il/en/manuscripts/${id}`;
  
  if (!apiKey) {
    return {
      notice: "NLI API key not configured",
      id,
      viewerUrl,
    };
  }

  try {
    // Search by record ID
    const apiUrl = `${NLI_SEARCH_URL}?api_key=${apiKey}&query=recordid,exact,${id}`;
    const response = await fetch(apiUrl);
    
    if (!response.ok) {
      throw new Error(`Failed to get item: ${response.status}`);
    }
    
    const data = await response.json();
    const items = data.result || data.results || [];
    const item = items[0];
    
    if (!item) {
      return {
        id,
        error: 'Item not found',
        viewerUrl,
      };
    }
    
    return {
      id: item.record_id || id,
      title: item.title,
      creator: item.creator,
      date: item.date || item.creation_date,
      description: item.description,
      physicalDescription: item.physical_description,
      language: item.language,
      subjects: item.subjects,
      collection: item.collection,
      repository: item.repository,
      shelfmark: item.shelfmark,
      viewerUrl,
      iiifManifest: item.iiif_manifest,
      images: item.images,
    };
  } catch (err) {
    const error = err as Error;
    return {
      id,
      error: error.message,
      viewerUrl,
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
  
  const searchUrl = `https://www.nli.org.il/en/search?keyword=${encodeURIComponent(searchTerms[0])}`;
  
  if (!apiKey) {
    console.log('No API key for scholar manuscripts search');
    return {
      scholar: scholarName,
      searchTerms,
      totalFound: 0,
      manuscripts: [],
      searchUrl,
      notice: "NLI API key not configured. Browse the collection directly.",
    };
  }

  try {
    // Search for manuscripts using primary search term with material_type filter
    const primaryTerm = searchTerms[0];
    // NLI format: query=creator,contains,{name} with material_type=manuscript
    const searchQuery = `creator,contains,${primaryTerm}`;
    const apiUrl = `${NLI_SEARCH_URL}?api_key=${apiKey}&query=${encodeURIComponent(searchQuery)}&material_type=manuscript&items_per_page=50`;
    console.log('Searching scholar manuscripts:', apiUrl.replace(apiKey, '[REDACTED]'));
    
    const response = await fetch(apiUrl, {
      headers: {
        'Accept': 'application/json',
      },
    });
    
    console.log('Scholar manuscripts response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Scholar manuscripts error:', errorText);
      
      return {
        scholar: scholarName,
        searchTerms,
        totalFound: 0,
        manuscripts: [],
        searchUrl,
        notice: `NLI API returned ${response.status}. Browse the collection directly.`,
        apiError: errorText.substring(0, 200),
      };
    }
    
    const data = await response.json();
    console.log('Scholar manuscripts data keys:', Object.keys(data));
    
    // Parse the response - NLI returns array-like object with numeric keys
    let items: any[] = [];
    if (Array.isArray(data)) {
      items = data;
    } else if (data.result) {
      items = data.result;
    } else if (data.results) {
      items = data.results;
    } else {
      // Convert object with numeric keys to array
      const keys = Object.keys(data).filter(k => !isNaN(Number(k)));
      items = keys.map(k => data[k]);
    }
    
    const totalCount = data.total_count || data.totalRecords || items.length;
    console.log('Parsed manuscripts count:', items.length, 'First item:', JSON.stringify(items[0])?.substring(0, 500));
    
    // Helper to extract values from JSON-LD format
    const getValue = (obj: any, key: string): string | undefined => {
      if (!obj) return undefined;
      // Try direct key
      if (obj[key]) return typeof obj[key] === 'string' ? obj[key] : obj[key][0]?.['@value'];
      // Try Dublin Core namespace
      const dcKey = `http://purl.org/dc/elements/1.1/${key}`;
      if (obj[dcKey]) return obj[dcKey][0]?.['@value'] || obj[dcKey];
      // Try DC terms namespace
      const dcTermsKey = `http://purl.org/dc/terms/${key}`;
      if (obj[dcTermsKey]) return obj[dcTermsKey][0]?.['@value'] || obj[dcTermsKey];
      return undefined;
    };
    
    // Extract record ID from @id URL
    const extractRecordId = (item: any): string => {
      const atId = item['@id'] || '';
      // Extract from URL like https://www.nli.org.il/en/manuscripts/NNL_ALEPH990000861770205171
      const match = atId.match(/NNL_ALEPH(\d+)/);
      return match ? match[1] : atId.split('/').pop() || '';
    };
    
    return {
      scholar: scholarName,
      searchTerms,
      totalFound: totalCount,
      manuscripts: items.slice(0, 20).map((item: any) => {
        const recordId = extractRecordId(item);
        return {
          id: recordId,
          title: getValue(item, 'title') || 'Untitled manuscript',
          creator: getValue(item, 'creator'),
          date: getValue(item, 'date') || getValue(item, 'created'),
          repository: getValue(item, 'publisher') || getValue(item, 'source'),
          shelfmark: getValue(item, 'identifier'),
          description: getValue(item, 'description') || getValue(item, 'format'),
          thumbnail: getValue(item, 'thumbnail'),
          viewerUrl: item['@id'] || `https://www.nli.org.il/en/manuscripts/${recordId}`,
        };
      }),
      searchUrl,
    };
  } catch (err) {
    const error = err as Error;
    console.error('Scholar manuscripts search error:', error);
    return {
      scholar: scholarName,
      searchTerms,
      totalFound: 0,
      manuscripts: [],
      searchUrl,
      notice: "Error connecting to NLI API. Browse the collection directly.",
      error: error.message,
    };
  }
}
