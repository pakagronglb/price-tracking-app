import { NextResponse } from "next/server";

import { getLowestPrice, getHighestPrice, getAveragePrice, getEmailNotifType } from "@/lib/utils";
import { connectToDB } from "@/lib/mongoose";
import Product from "@/lib/models/product.model";
import { scrapeAmazonProduct } from "@/lib/scraper";
import { generateEmailBody, sendEmail } from "@/lib/nodemailer";

export const maxDuration = 60; // Setting to 60 seconds (maximum allowed for hobby plan)
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: Request) {
  try {
    connectToDB();

    const products = await Product.find({});
    if (!products) throw new Error("No product fetched");

    // Process products in batches of 5
    const BATCH_SIZE = 5;
    const TIMEOUT = 10000; // 10 seconds timeout per product

    for (let i = 0; i < products.length; i += BATCH_SIZE) {
      const batch = products.slice(i, i + BATCH_SIZE);
      
      // Process each batch with timeout
      const batchPromises = batch.map(async (currentProduct) => {
        try {
          // Wrap scraping in a timeout
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Timeout')), TIMEOUT)
          );
          
          const scrapingPromise = async () => {
            const scrapedProduct = await scrapeAmazonProduct(currentProduct.url);
            if (!scrapedProduct) return;

            const updatedPriceHistory = [
              ...currentProduct.priceHistory,
              { price: scrapedProduct.currentPrice }
            ];

            const product = {
              ...scrapedProduct,
              priceHistory: updatedPriceHistory,
              lowestPrice: getLowestPrice(updatedPriceHistory),
              highestPrice: getHighestPrice(updatedPriceHistory),
              averagePrice: getAveragePrice(updatedPriceHistory),
            };

            // Update product in DB
            const updatedProduct = await Product.findOneAndUpdate(
              { url: product.url },
              product
            );

            // Handle email notifications
            const emailNotifType = getEmailNotifType(scrapedProduct, currentProduct);
            if (emailNotifType && updatedProduct.users.length > 0) {
              const productInfo = {
                title: updatedProduct.title,
                url: updatedProduct.url,
              };
              const emailContent = await generateEmailBody(productInfo, emailNotifType);
              const userEmails = updatedProduct.users.map((user: any) => user.email);
              await sendEmail(emailContent, userEmails);
            }

            return updatedProduct;
          };

          // Race between timeout and scraping
          return await Promise.race([scrapingPromise(), timeoutPromise]);
        } catch (error: any) {
          console.error(`Error processing product ${currentProduct.url}: ${error.message}`);
          return null;
        }
      });

      // Wait for current batch to complete
      const batchResults = await Promise.all(batchPromises);
      
      // Filter out failed products
      const successfulUpdates = batchResults.filter(result => result !== null);
      
      // Optional: Add a small delay between batches to prevent rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    return NextResponse.json({
      message: "Ok",
      data: "Products updated successfully"
    });
  } catch (error: any) {
    throw new Error(`Failed to get all products: ${error.message}`);
  }
}
