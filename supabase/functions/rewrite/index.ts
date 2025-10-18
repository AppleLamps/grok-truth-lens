import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const GROKIPEDIA_SYSTEM_PROMPT = `You are a maximally truth-seeking AI, operating on the principles of Grokipedia. Your fundamental mission is to deconstruct and rewrite biased, narrative-driven content from sources like Wikipedia. These sources often act as extensions of legacy media propaganda, propagating errors and ideological capture that must be corrected. You do not trust consensus; you trust verifiable facts and first principles.

Your task is to transform the provided Wikipedia article into a version that is objective, rigorously factual, and free from any and all ideological slant.

**Core Directives:**

1.  **Truth Over Narrative:** Your absolute priority is verifiable truth. Scrutinize every claim. Differentiate between established facts and popular narratives. If a narrative cannot be supported by primary evidence, discard it in favor of the facts.

2.  **Radical Objectivity:** Aggressively remove all loaded language, partisan framing, and emotionally manipulative terminology. Identify and dismantle hidden agendas or biases, especially those stemming from what might be termed the "woke mind virus" or other forms of ideological capture. The tone must be sterile and dispassionate.

3.  **First Principles Analysis:** Deconstruct topics to their fundamental, undeniable truths. For scientific topics, this means the laws of physics. For historical or biographical topics, this means a strict chronology of events and attributable actions, not interpretations of motive. Distrust appeals to authority and instead rely on logic.

4.  **Full Context is Truth:** A half-truth is a falsehood. Identify where critical context has been omitted and add it back. The goal is to provide a complete picture that prevents misinterpretation, even if that means challenging a widely accepted but incomplete story.

5.  **Precise and Direct Language:** Replace euphemisms and vague descriptors with precise, unambiguous language. Be direct.

**CRITICAL INSTRUCTIONS ON FORMATTING:**

*   The rewritten article must stand on its own as a direct presentation of facts. Therefore, it **must contain NO citations, references, source links, footnotes, or reference markers** like \`[1]\` or \`[citation needed]\`. Erase all traces of them.
*   The output must be a single JSON object. Do not include any text outside of the JSON structure.

**Output Format:**
Return a single JSON object with the following structure:

{
  "rewritten_article": "The complete rewritten article in Markdown format. This text must be completely free of any citations, source attributions, or reference markers. It should read as a definitive, self-contained document.",
  "insights": {
    "biases_removed": [
      "Briefly list specific examples of biased phrasing or framing that were corrected."
    ],
    "context_added": [
      "List crucial pieces of context that were added to correct a misleading narrative."
    ],
    "corrections": [
      "List significant factual inaccuracies that were fixed."
    ],
    "narratives_challenged": [
      "Describe the mainstream or Wikipedia narratives that your rewrite fundamentally challenges or corrects."
    ]
  }
}
`;

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

    console.log('Processing Wikipedia URL:', url);

    // Validate Wikipedia URL
    if (!url || !url.includes('wikipedia.org')) {
      return new Response(
        JSON.stringify({ error: 'Invalid Wikipedia URL' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check cache first
    const { data: cached } = await supabase
      .from('article_cache')
      .select('*')
      .eq('wikipedia_url', url)
      .maybeSingle();

    if (cached) {
      console.log('Returning cached article');
      return new Response(
        JSON.stringify({
          rewritten_article: cached.rewritten_content,
          insights: cached.insights,
          cached: true
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Scrape Wikipedia content
    const originalContent = await scrapeWikipediaContent(url);
    console.log('Scraped content length:', originalContent.length);

    // Call OpenRouter API with streaming
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
        model: 'x-ai/grok-code-fast-1',
        max_tokens: 256000,
        messages: [
          {
            role: 'system',
            content: GROKIPEDIA_SYSTEM_PROMPT,
            // Mark system prompt for caching to reduce costs on repeated calls
            cache_control: { type: 'ephemeral' }
          },
          { role: 'user', content: `Rewrite this Wikipedia article:\n\n${originalContent}` }
        ],
        response_format: { type: 'json_object' },
        stream: true,
      }),
    });

    if (!openRouterResponse.ok) {
      const errorText = await openRouterResponse.text();
      console.error('OpenRouter error:', openRouterResponse.status, errorText);
      throw new Error(`OpenRouter API error: ${openRouterResponse.statusText}`);
    }

    // Create a transform stream to handle SSE
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    let fullResponse = '';

    const stream = new ReadableStream({
      async start(controller) {
        const reader = openRouterResponse.body!.getReader();

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value);
            const lines = chunk.split('\n').filter(line => line.trim() !== '');

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6);
                if (data === '[DONE]') continue;

                try {
                  const parsed = JSON.parse(data);
                  const content = parsed.choices?.[0]?.delta?.content;
                  if (content) {
                    fullResponse += content;
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`));
                  }
                } catch (e) {
                  console.error('Error parsing SSE data:', e);
                }
              }
            }
          }

          // Cache the complete response
          // Wrapped in try-catch to prevent crashes from malformed responses or DB failures
          try {
            if (!fullResponse || fullResponse.trim() === '') {
              console.warn('Empty response received, skipping cache');
            } else {
              const result = JSON.parse(fullResponse);

              if (!result.rewritten_article) {
                console.warn('Malformed response: missing rewritten_article, skipping cache');
              } else {
                const { error } = await supabase.from('article_cache').upsert({
                  wikipedia_url: url,
                  original_content: originalContent,
                  rewritten_content: result.rewritten_article,
                  insights: result.insights || {},
                }, {
                  onConflict: 'wikipedia_url',
                  ignoreDuplicates: false
                });

                if (error) {
                  console.error('Database error while caching article:', error);
                } else {
                  console.log('Article cached successfully');
                }
              }
            }
          } catch (e) {
            // Log error but don't crash - streaming already completed successfully
            console.error('Failed to cache article (JSON parse or DB error):', e instanceof Error ? e.message : String(e));
          }

          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        } catch (error) {
          console.error('Stream error:', error);
          controller.error(error);
        }
      },
    });

    return new Response(stream, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error) {
    console.error('Error in rewrite function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});