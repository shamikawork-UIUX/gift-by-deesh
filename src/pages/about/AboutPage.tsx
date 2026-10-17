import { AboutHero } from './AboutHero';
import { Scrapbook } from './Scrapbook';
import { GiftMachine } from './GiftMachine';
import { Promises } from './Promises';
import { Contact } from './Contact';
import { Faq } from './Faq';
import './About.css';

export function AboutPage() {
  return (
    <>
      <AboutHero />
      <Scrapbook />
      <GiftMachine />
      <Promises />
      <Contact />
      <Faq />
    </>
  );
}
