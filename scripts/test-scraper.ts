import { scrapeAmazonProduct } from "../lib/scraper";

const testUrls = [
  "https://www.amazon.com/dp/B075CYMYK6", // Echo Dot
  "https://www.amazon.com/dp/B08J65DST5", // iPad Air
  "https://www.amazon.com/dp/B07ZGLLWBT", // AirPods Pro
];

async function runTests() {
  console.log("Starting scraper tests...\n");

  for (const url of testUrls) {
    console.log(`Testing URL: ${url}`);
    console.time(`Scrape time for ${url}`);
    
    try {
      const result = await scrapeAmazonProduct(url);
      console.timeEnd(`Scrape time for ${url}`);
      
      console.log("Result:", {
        title: result?.title,
        currentPrice: result?.currentPrice,
        isOutOfStock: result?.isOutOfStock,
      });
    } catch (error: any) {
      console.timeEnd(`Scrape time for ${url}`);
      console.error(`Error scraping ${url}:`, error.message);
    }
    
    console.log("\n-------------------\n");
    
    // Wait 2 seconds between requests to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
}

runTests().catch(console.error); 