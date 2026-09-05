import { buyerCommand } from '@/lib/acquisition/buyer-http';
export const runtime = 'nodejs';
export const maxDuration = 300;
export const POST = (request: Request) => buyerCommand(request,'pdf');
