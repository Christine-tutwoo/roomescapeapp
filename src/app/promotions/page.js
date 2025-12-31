import PromotionsClient from './PromotionsClient';
import { reader } from '@/lib/keystatic-reader';

export default async function PromotionsPage() {
  const all = await reader.collections.promotions.all();
  const promotions = all.map(({ slug, entry }) => ({ slug, ...entry }));
  return <PromotionsClient promotions={promotions} />;
}



