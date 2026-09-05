import type { Metadata } from 'next';
import BuyerReportApp from './report-app';
export const metadata: Metadata = { title: 'Acquisition Lens — Buyer Assessment', description: 'Ella applies Mike Ye’s acquisition judgment to your target, competitive landscape, economics, and next decision.', robots: { index: false, follow: false }, referrer: 'no-referrer' };
export default function Page() { return <BuyerReportApp />; }
