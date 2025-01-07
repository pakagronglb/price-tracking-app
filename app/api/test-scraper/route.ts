import { NextResponse } from "next/server";
import { scrapeAmazonProduct } from "@/lib/scraper";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const { url } = await request.json();
    
    console.time('scraping');
    const scrapedProduct = await scrapeAmazonProduct(url);
    console.timeEnd('scraping');

    if (!scrapedProduct) {
      return NextResponse.json({ error: "Failed to scrape product" }, { status: 400 });
    }

    return NextResponse.json({ 
      message: "Success",
      data: scrapedProduct,
      timings: {
        total: process.hrtime(),
      }
    });
  } catch (error: any) {
    return NextResponse.json({ 
      error: error.message,
      stack: error.stack 
    }, { 
      status: 500 
    });
  }
} 