# Grok Truth Lens

A truth-seeking application that reanalyzes Wikipedia articles to identify and remove biases, add missing context, and challenge misleading narratives. Powered by Grok 4 Fast AI, this tool provides a more balanced perspective on topics by examining articles through a lens of radical objectivity and first-principles analysis.

## Overview

Grok Truth Lens transforms Wikipedia articles by:

- **Removing Biases**: Identifies and eliminates loaded language, partisan framing, and emotionally manipulative terminology
- **Adding Context**: Restores critical information that has been omitted, providing a complete picture to prevent misinterpretation
- **Correcting Inaccuracies**: Identifies and fixes significant factual errors
- **Challenging Narratives**: Highlights mainstream narratives that may be incomplete or misleading

The application provides detailed insights into what was changed and why, helping readers understand the differences between the original and reanalyzed content.

## Key Features

- **Wikipedia Article Analysis**: Submit any Wikipedia article URL for reanalysis
- **Real-time Processing**: Stream-based processing with progress tracking and ETA estimates
- **Detailed Insights**: View specific biases removed, context added, corrections made, and narratives challenged
- **Article Comparison**: Side-by-side comparison of original and rewritten content with highlighted differences
- **Bookmarking System**: Save articles for later reference with tagging support
- **Search History**: Track previously analyzed articles
- **Analytics Dashboard**: View statistics on articles processed, biases identified, and context added
- **Reading Enhancements**:
  - Adjustable font sizes for comfortable reading
  - Text-to-speech (TTS) support for audio playback
  - Table of contents for easy navigation
  - Reading progress tracking
- **Export Options**: Download articles as PDF or other formats
- **Dark/Light Theme**: Toggle between dark and light modes
- **Responsive Design**: Works seamlessly on desktop and mobile devices

## Technology Stack

### Frontend
- **React 18**: UI framework
- **TypeScript**: Type-safe development
- **Vite**: Fast build tool and dev server
- **Tailwind CSS**: Utility-first CSS framework
- **shadcn-ui**: High-quality React components
- **React Router**: Client-side routing
- **React Query**: Data fetching and caching
- **React Markdown**: Markdown rendering with GitHub Flavored Markdown support

### Backend & Services
- **Supabase**: Backend-as-a-service for database and authentication
- **Deno**: Runtime for serverless functions
- **OpenRouter API**: Access to Grok 4 Fast AI model
- **Firecrawl**: Web scraping for Wikipedia content extraction

### Additional Libraries
- **jsPDF & html2canvas**: PDF export functionality
- **Recharts**: Data visualization for analytics
- **Sonner**: Toast notifications
- **Lucide React**: Icon library

## Installation

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn package manager

### Setup Instructions

1. **Clone the repository**:
   ```sh
   git clone https://github.com/AppleLamps/grok-truth-lens.git
   cd grok-truth-lens
   ```

2. **Install dependencies**:
   ```sh
   npm install
   ```

3. **Configure environment variables**:
   Create a `.env.local` file in the root directory with the following variables:
   ```
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   OPENROUTER_API_KEY=your_openrouter_api_key
   FIRECRAWL_API_KEY=your_firecrawl_api_key
   ```

4. **Start the development server**:
   ```sh
   npm run dev
   ```

   The application will be available at `http://localhost:5173`

## Usage

### Basic Workflow

1. **Enter a Wikipedia URL**: Paste any Wikipedia article URL into the search bar
2. **Wait for Processing**: The application will fetch, analyze, and rewrite the article
3. **Review Insights**: Examine the truth analysis showing biases removed, context added, corrections, and narratives challenged
4. **Compare Content**: Use the comparison view to see specific changes between original and rewritten versions
5. **Bookmark Articles**: Save important articles for future reference
6. **Track Analytics**: Visit the analytics page to see your usage statistics

### Features in Detail

- **Search History**: Access previously analyzed articles from the sidebar
- **Bookmarks**: Organize saved articles with tags and timestamps
- **Analytics**: Monitor your truth-seeking activity with detailed statistics
- **Export**: Download articles as PDF for offline reading
- **Share**: Share articles with others via link

## Project Structure

```
grok-truth-lens/
├── src/
│   ├── components/          # React components
│   │   ├── Actions/         # Bookmark and share buttons
│   │   ├── Article/         # Reading controls (TTS, font size, TOC)
│   │   ├── Compare/         # Diff view for article comparison
│   │   ├── Insights/        # Truth analysis display
│   │   ├── Loading/         # Progress indicators
│   │   ├── Theme/           # Theme toggle
│   │   └── ui/              # shadcn-ui components
│   ├── pages/               # Page components
│   │   ├── Index.tsx        # Main article analysis page
│   │   ├── Analytics.tsx    # Analytics dashboard
│   │   ├── Bookmarks.tsx    # Bookmarks management
│   │   └── NotFound.tsx     # 404 page
│   ├── hooks/               # Custom React hooks
│   ├── lib/                 # Utility functions
│   ├── integrations/        # External service integrations
│   └── App.tsx              # Main app component
├── supabase/
│   ├── functions/           # Serverless functions
│   │   └── rewrite/         # Article rewriting function
│   ├── migrations/          # Database migrations
│   └── config.toml          # Supabase configuration
├── public/                  # Static assets
├── index.html               # HTML entry point
├── package.json             # Dependencies and scripts
├── tsconfig.json            # TypeScript configuration
├── tailwind.config.ts       # Tailwind CSS configuration
└── vite.config.ts           # Vite configuration
```

## Configuration

### Environment Variables

The application requires the following environment variables to function:

- `VITE_SUPABASE_URL`: Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY`: Your Supabase anonymous key
- `OPENROUTER_API_KEY`: API key for OpenRouter (Grok 4 Fast access)
- `FIRECRAWL_API_KEY`: API key for Firecrawl web scraping service

### Supabase Setup

The application uses Supabase for:
- Article caching (to reduce processing costs)
- Analytics data storage
- User data persistence

Database tables are automatically created through migrations in the `supabase/migrations/` directory.

## Development

### Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm run build:dev` - Build in development mode
- `npm run lint` - Run ESLint to check code quality
- `npm run preview` - Preview production build locally

### Code Quality

The project uses ESLint for code quality checks. Run `npm run lint` to identify and fix issues.

## How It Works

1. **Article Fetching**: When a Wikipedia URL is submitted, Firecrawl extracts the article content
2. **AI Analysis**: The content is sent to Grok 4 Fast via OpenRouter API with a specialized system prompt
3. **Rewriting**: The AI rewrites the article focusing on truth, objectivity, and completeness
4. **Insights Generation**: The AI provides detailed insights about changes made
5. **Caching**: Results are cached in Supabase to avoid reprocessing the same articles
6. **Display**: The rewritten article and insights are displayed with interactive features

## Attribution

Created by **Apple Lamps**

## License

This project is provided as-is for educational and research purposes.

## Support

For issues, questions, or suggestions, please open an issue on the GitHub repository.
