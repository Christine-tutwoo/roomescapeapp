import PromotionsClient from './PromotionsClient';
import { fetchPromotionEntries } from '@/lib/googleSheets';

export default async function PromotionsPage() {
  const promotions = await fetchPromotionEntries();
  return <PromotionsClient promotions={promotions} />;
}



