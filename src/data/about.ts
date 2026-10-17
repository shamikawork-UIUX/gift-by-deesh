import { site } from './site';

export const chapters = [
  { short: 'The first bouquet', when: '[YEAR]', title: 'It started with one bouquet', tint: '#FCE6CF', photo: 'Photo — the very first Kinder bouquet', body: '[Founder story: who made the first bouquet, who it was for, and what happened when they saw it. Keep it to two or three warm sentences.]' },
  { short: 'Friends asked', when: '[YEAR]', title: '"Can you make one for me too?"', tint: '#F7D3DE', photo: 'Photo — orders piling up on the table', body: '[How word spread: friends, family, then friends of friends. Mention Instagram if that is where it took off.]' },
  { short: 'House of Deesh', when: '[YEAR]', title: 'A little studio becomes a company', tint: '#DCE4F3', photo: 'Photo — the studio or wrapping corner', body: 'The hobby grew up and became House of Deesh (Pvt) Ltd. [Add a line about the studio, the team or the first big order.]' },
  { short: 'Today', when: 'Now', title: 'Gifts, all across Sri Lanka', tint: '#D8EDE2', photo: 'Photo — a delivery on its way', body: 'Today we hand-wrap chocolate bouquets, teddies and toy gifts and send them islandwide — still one bow at a time, still with a little note of love.' },
];

export const machineStages = [
  { label: 'Pick', msg: 'Picking their favourites…' },
  { label: 'Wrap', msg: 'Wrapping it up nice and snug…' },
  { label: 'Ribbon', msg: 'Tying the bow (the best part)…' },
  { label: 'Deliver', msg: 'Off it goes! Vroom!' },
];

export const promises = [
  { title: 'Hand-wrapped', tint: '#FDE7EE', color: '#D6245F', icon: 'hand', back: 'Every gift is wrapped by hand in our studio — no machines, no shortcuts, just care (and a lot of ribbon).' },
  { title: 'Islandwide delivery', tint: '#E6EEFA', color: '#3B6CC0', icon: 'pin', back: 'From [CITY] to wherever they are in Sri Lanka. We keep you posted until it lands in their hands.' },
  { title: 'Real humans', tint: '#E3F6EA', color: '#17663A', icon: 'chat', back: 'Questions, custom ideas or a last-minute panic? Message us on WhatsApp and a real person replies.' },
] as const;

export const contactCards = [
  { id: 'g', kind: 'gift', title: site.contacts.gifts.label, sub: 'Bouquets, teddies, toys and custom boxes', number: site.contacts.gifts.number, wa: site.contacts.gifts.wa, tint: '#FDE7EE', color: '#D6245F', msg: "Hi GiftsByDeesh! I'd like to ask about a gift." },
  { id: 'c', kind: 'choc', title: site.contacts.chocolate.label, sub: 'Chocolate bouquets and hampers', number: site.contacts.chocolate.number, wa: site.contacts.chocolate.wa, tint: '#F6E7D3', color: '#7A4528', msg: "Hi GiftsByDeesh! I'd like to ask about a chocolate bouquet." },
] as const;
