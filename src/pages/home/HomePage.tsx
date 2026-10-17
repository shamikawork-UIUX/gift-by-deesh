import { Hero } from './Hero';
import { Bento } from './Bento';
import { Favourites } from './Favourites';
import { Occasions } from './Occasions';
import { CustomBand } from './CustomBand';
import { BoxBuilder } from './BoxBuilder';
import { Reels } from './Reels';
import { Steps } from './Steps';
import './Home.css';

export function HomePage() {
  return (
    <>
      <Hero />
      <Bento />
      <Favourites />
      <Occasions />
      <CustomBand />
      <BoxBuilder />
      <Reels />
      <Steps />
    </>
  );
}
