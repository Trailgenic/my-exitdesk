import { buyerQuote, buyerCommand } from '@/lib/acquisition/buyer-http';
export const runtime = 'nodejs';
export const maxDuration = 300;
export const dynamic = 'force-dynamic';
export const GET = buyerQuote;
export const POST = (request: Request) => buyerCommand(request,'report');
