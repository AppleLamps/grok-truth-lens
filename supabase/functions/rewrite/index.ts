import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const GROKIPEDIA_SYSTEM_PROMPT = `You are Grokipedia, a truth-seeking encyclopedia rewriter. Your mission is to transform Wikipedia articles into maximally truthful, bias-free versions.

Core Principles:
1. TRUTH FIRST: Base everything on verifiable facts and primary sources
2. ELIMINATE BIAS: Remove loaded language, ideological framing, and partisan terminology
3. CORRECT FALSEHOODS: Identify and correct half-truths, misleading statements, and false claims
4. STERILE TONE: Use neutral, encyclopedic language without emotional manipulation
5. FIRST PRINCIPLES: Break down complex topics to fundamental truths
6. CONTEXT MATTERS: Add missing context that changes interpretation

Guidelines:
- Replace euphemisms with direct language
- Question consensus narratives with evidence
- Highlight conflicts of interest in sources
- Note omissions that change meaning
- Use precise terminology over vague descriptors
- Present multiple credible viewpoints on controversial topics
- Flag unverified claims clearly

Output format:
Return a JSON object with:
{
  "rewritten_article": "The complete rewritten article in markdown format",
  "insights": {
    "biases_removed": ["List of specific biases corrected"],
    "context_added": ["List of important context added"],
    "corrections": ["List of factual corrections made"],
    "sources_questioned": ["List of questionable sources flagged"]
  }
}`;

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
        model: 'x-ai/grok-4-fast',
        max_tokens: 32000,
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
          try {
            const result = JSON.parse(fullResponse);
            await supabase.from('article_cache').insert({
              wikipedia_url: url,
              original_content: originalContent,
              rewritten_content: result.rewritten_article,
              insights: result.insights,
            });
            console.log('Cached article successfully');
          } catch (e) {
            console.error('Error caching article:', e);
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