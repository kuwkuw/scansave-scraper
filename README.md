# Supermarket Price Scraper

A Node.js/TypeScript backend service that scrapes and aggregates product prices from major Ukrainian supermarket chains.

## Features

- 🤖 Automated web scraping using Puppeteer
- 🏪 Multi-store support (Silpo, with ATB and others planned)
- 🔄 Configurable scraping intervals
- 📊 Structured product data extraction
- 🔍 Price monitoring and tracking
- ⚡ TypeScript for type safety and better development experience

## Environment Variables

Copy `.env.example` to `.env` and fill in your database credentials:

```
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASS=yourpassword
DB_NAME=scansave
```

## Project Structure

```
scraper/
├── src/
│   ├── index.ts           # Application entry point
│   ├── db/                # Database logic (entities, connection, save logic)
│   │   ├── connection.ts  # Centralized TypeORM connection helper
│   │   ├── product.entity.ts # Product entity definition
│   │   └── products.ts    # Product save logic
│   └── scrapers/          # Store-specific scrapers
│       └── silpoScraper.ts  # Silpo supermarket scraper
├── config.ts              # Configuration settings
├── package.json           # Project dependencies
├── tsconfig.json          # TypeScript configuration
├── .env.example           # Example environment variables
└── README.md              # Project documentation
```

## Prerequisites

- Node.js (LTS version recommended)
- npm or yarn
- TypeScript

## Installation

1. Install dependencies:
```bash
npm install
```

## Development

Start the scraper in development mode with hot reloading:
```bash
npm run dev
```

## Building

Build the TypeScript code:
```bash
npm run build
```

## Production

Run the production build:
```bash
npm run start
```

## Scripts

- `npm run dev` - Run in development mode using ts-node
- `npm run build` - Compile TypeScript to JavaScript
- `npm start` - Run the compiled JavaScript

## Dependencies

### Production
- `puppeteer` - Headless Chrome automation library

### Development
- `typescript` - TypeScript language support
- `ts-node` - TypeScript execution engine
- `@types/node` - Node.js type definitions

## Configuration

The scraper can be configured through `config.ts`. Configuration options include:

- Scraping intervals
- Target stores
- Request timeouts
- Rate limiting parameters
- Product categories to scrape

## Adding New Scrapers

1. Create a new scraper file in `src/scrapers/`
2. Implement the scraping logic using Puppeteer
3. Export the scraper interface
4. Register the scraper in the main application

Example structure for a new scraper:

```typescript
import puppeteer from 'puppeteer';

export async function scrapeProducts() {
    const browser = await puppeteer.launch();
    try {
        // Scraping implementation
    } finally {
        await browser.close();
    }
}
```

## Error Handling

The scraper implements several error handling mechanisms:

- Automatic retries for failed requests
- Rate limiting to prevent IP blocking
- Error logging and monitoring
- Graceful shutdown handling

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

ISC
