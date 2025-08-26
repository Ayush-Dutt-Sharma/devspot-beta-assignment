import { clerkMiddleware } from '@clerk/nextjs/server';
import { paymentMiddleware } from 'x402-next';
import { NextResponse } from 'next/server';
import type { NextRequest, NextFetchEvent } from 'next/server';
import { Address } from 'viem';
import { createAdminClient } from '@/lib/supabase/admin';

const x402Handler = paymentMiddleware(
  process.env.RESOURCE_WALLET_ADDRESS as Address,
  {
    "/api/hackathons/:hackathonId/publish": {
      price: "100",
      network: "base-sepolia",
      config: {
        description: "Publish hackathon and fund prizes with USDC",
      },
    },
  },
  {
    url: "https://x402.org/facilitator",
  }
);

export default clerkMiddleware(async (auth, req: NextRequest, event: NextFetchEvent) => {
  if (req.nextUrl.pathname.match(/\/api\/hackathons\/[^\/]+\/publish/)) {
    const pathname = req.nextUrl.pathname;
    const hackathonId = pathname.match(/\/api\/hackathons\/([^\/]+)\/publish/)?.[1];
    
    // if (hackathonId) {
    //   const paymentResponse = await x402Handler(req);
    //   if (paymentResponse) {
    //     return paymentResponse;
    //   }
    // }
  }
  
  return NextResponse.next();
});

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};