import Typewriter from "../components/Typewriter";
import { Link } from "react-router";

function Home() {
  return (
    <main className="home-page">
      <section className="hero">
        <video
          className="hero-video"
          autoPlay
          muted
          loop
          playsInline
          poster="/image/coffee.jpg"
          aria-hidden="true"
        >
          <source src="/video.mp4" type="video/mp4" />
        </video>
        <div className="overlay" aria-hidden="true" />

        <div className="hero-content">
          <div className="hero-copy">
            <p className="hero-kicker">
              <span aria-hidden="true" />
              Coffee, comfort &amp; good company
            </p>
            <Typewriter text="Welcome to Wings Cafe" speed={75} />
            <p className="hero-description">
              Crafted coffee. Fresh bites. A warm little pause in your day.
            </p>
            <div className="hero-actions">
              <Link className="hero-button hero-button-primary" to="/menu">
                Explore the menu
                <span aria-hidden="true">→</span>
              </Link>
              <a className="hero-button hero-button-secondary" href="#cafe-favourites">
                Find your favourite
              </a>
            </div>
            <p className="hero-footnote">
              Made fresh each day, served with a little extra care.
            </p>
          </div>

          <div className="hero-visual" aria-label="Freshly brewed coffee at Wings Cafe">
            <img src="/image/coffee.jpg" alt="Freshly brewed coffee" />
            <div className="hero-image-shade" />
            <div className="hero-image-caption">
              <span>Take a moment</span>
              <strong>Make it a good one.</strong>
            </div>
            <div className="hero-image-stamp" aria-hidden="true">W</div>
          </div>
        </div>
        <a className="hero-scroll-cue" href="#cafe-favourites">
          <span aria-hidden="true" />
          Discover Wings Cafe
        </a>
      </section>

      <section className="home-favourites" id="cafe-favourites">
        <div className="home-section-heading">
          <p>Something for every kind of day</p>
          <h2>Find your new favourite</h2>
        </div>
        <div className="home-category-grid">
          {[
            { name: "Coffee", image: "/image/coffee.jpg" },
            { name: "Cool drinks", image: "/image/drinks.jpg" },
            { name: "Fresh food", image: "/image/food%20(2).jpg" },
            { name: "Pastries", image: "/image/pastries.jpg" },
          ].map((category) => (
            <Link className="home-category-card" to="/menu" key={category.name}>
              <img src={category.image} alt="" loading="lazy" />
              <span>
                <strong>{category.name}</strong>
                <span aria-hidden="true">↗</span>
              </span>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}

export default Home;
