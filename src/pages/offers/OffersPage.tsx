import { OffersHero } from './OffersHero';
import { UnwrapDeal } from './UnwrapDeal';
import { Combos } from './Combos';
import { GiftCalendar } from './GiftCalendar';
import { PanicButton } from './PanicButton';
import './Offers.css';

export function OffersPage() {
  return (
    <>
      <OffersHero />
      <UnwrapDeal />
      <Combos />
      <GiftCalendar />
      <PanicButton />
    </>
  );
}
