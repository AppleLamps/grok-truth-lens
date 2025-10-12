import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const FUN_FACTS_SYSTEM_PROMPT = `You are a fun facts generator for Grokipedia. Your task is to generate 10 interesting, little-known, and engaging fun facts about the topic presented in the provided Wikipedia article content.

**Requirements:**
1. Generate exactly 10 fun facts
2. Each fact should be:
   - Interesting and surprising
   - Little-known or not commonly discussed
   - Factually accurate based on the content provided
   - Concise (1-2 sentences maximum)
   - Engaging and thought-provoking
3. Focus on the most fascinating aspects of the topic
4. Avoid obvious or widely known information
5. Make the facts diverse - cover different aspects of the topic

**Output Format:**
Return a single JSON object with this exact structure:
{
  "fun_facts": [
    "First fun fact here",
    "Second fun fact here",
    ...10 facts total
  ]
}

The output must be valid JSON. Do not include any text outside the JSON structure.`;

async function scrapeWikipediaContent(url: string): Promise<string> {
  const firecrawlApiKey = Deno.env.get('FIRECRAWL_API_KEY');
  if (!firecrawlApiKey) {
    throw new Error('FIRECRAWL_API_KEY not configured');
  }

  console.log('Scraping content with Firecrawl:', url);

  const response = await fetch('https://api.firecrawl.dev/v2/scrape', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${firecrawlApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      url: url,
      onlyMainContent: true,
      maxAge: 172800000,
      formats: ['markdown'],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Firecrawl error:', response.status, errorText);
    throw new Error(`Failed to scrape article: ${response.statusText}`);
  }

  const data = await response.json();

  if (!data.success || !data.data?.markdown) {
    throw new Error('No content found in scrape response');
  }

  console.log('Scraped content length:', data.data.markdown.length);
  return data.data.markdown;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();

    console.log('Generating fun facts for Wikipedia URL:', url);

    // Validate Wikipedia URL
    if (!url || !url.includes('wikipedia.org')) {
      return new Response(
        JSON.stringify({ error: 'Invalid Wikipedia URL' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Scrape Wikipedia content
    const content = await scrapeWikipediaContent(url);
    console.log('Scraped content for fun facts, length:', content.length);

    // Call OpenRouter API with Gemini model
    const openRouterKey = Deno.env.get('OPENROUTER_API_KEY');
    if (!openRouterKey) {
      throw new Error('OPENROUTER_API_KEY not configured');
    }

    const openRouterResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openRouterKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://grokipedia.lovable.app',
        'X-Title': 'Grokipedia',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-lite-preview-09-2025',
        messages: [
          {
            role: 'system',
            content: FUN_FACTS_SYSTEM_PROMPT
          },
          {
            role: 'user',
            content: `Generate 10 fun facts about this topic:\n\n${content.slice(0, 8000)}` // Limit content to avoid token limits
          }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.7, // Add some creativity
        max_tokens: 2000,
      }),
    });

    if (!openRouterResponse.ok) {
      const errorText = await openRouterResponse.text();
      console.error('OpenRouter error:', openRouterResponse.status, errorText);
      throw new Error(`OpenRouter API error: ${openRouterResponse.statusText}`);
    }

    const result = await openRouterResponse.json();
    const funFactsContent = result.choices?.[0]?.message?.content;

    if (!funFactsContent) {
      throw new Error('No content in OpenRouter response');
    }

    // Parse the JSON response
    const funFactsData = JSON.parse(funFactsContent);

    if (!funFactsData.fun_facts || !Array.isArray(funFactsData.fun_facts)) {
      throw new Error('Invalid fun facts format in response');
    }

    console.log('Generated', funFactsData.fun_facts.length, 'fun facts');

    return new Response(
      JSON.stringify(funFactsData),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );

  } catch (error) {
    console.error('Error in fun-facts function:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error',
        fun_facts: [] // Return empty array on error so frontend doesn't break
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  }
});
