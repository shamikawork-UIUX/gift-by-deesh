import { Link } from 'react-router-dom';

export function Hero() {
  return (
    <section id="top" className="home-hero">
      <img
        className="home-hero-img"
        src="/images/hero.webp"
        srcSet="/images/hero-960.webp 960w, /images/hero.webp 1942w"
        sizes="(max-width: 900px) 720px, 100vw"
        alt="Kinder Joy chocolate bouquet wrapped in pink with a ribbon, next to a cream teddy bear"
        width={1942}
        height={809}
        {...{ fetchpriority: 'high' }}
      />
      <div className="container home-hero-in">
        <div className="home-hero-copy">
          <h1>Gifts that make them <span>smile.</span></h1>
          <p>From delicious chocolate bouquets to cuddly teddy bears, find the perfect little surprise for every special moment.</p>
          <div className="home-hero-ctas">
            <Link to="/shop" className="btn btn-pink">Shop Gifts</Link>
            <a href="#favourites" className="btn btn-white">Explore Bestsellers</a>
          </div>
        </div>
      </div>
    </section>
  );
}
