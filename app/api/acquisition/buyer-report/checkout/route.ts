import { buyerCommand } from '@/lib/acquisition/buyer-http';
export const runtime = 'nodejs';
export const maxDuration = 30;
export const POST = (request: Request) => buyerCommand(request,'checkout');
