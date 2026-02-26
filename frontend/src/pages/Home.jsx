import { Link } from "react-router-dom";
import { useState, useEffect } from "react";

import img1 from "../../img/1.JPG";
import img2 from "../../img/2.JPG";
import img3 from "../../img/3.JPG";
import img4 from "../../img/4.JPG";
import img5 from "../../img/5.JPG";
import img6 from "../../img/6.JPG";
import img7 from "../../img/7.JPG";
import img8 from "../../img/8.JPG";
import img9 from "../../img/9.JPG";
import img10 from "../../img/10.JPG";

const slideshowImages = [img1, img2, img3, img4, img5, img6, img7, img8, img9, img10];

export default function Home() {
  const [current, setCurrent] = useState(0);
  const [prev, setPrev] = useState(null);
  const [transitioning, setTransitioning] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setPrev(current);
      setTransitioning(true);
      setCurrent((c) => (c + 1) % slideshowImages.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [current]);

  useEffect(() => {
    if (transitioning) {
      const t = setTimeout(() => {
        setPrev(null);
        setTransitioning(false);
      }, 1200);
      return () => clearTimeout(t);
    }
  }, [transitioning]);

  return (
    <>
      {/* Hero */}
      <section className="text-white min-h-[calc(100vh-4rem)] flex items-center px-4 text-center relative overflow-hidden">
        {/* Slideshow backgrounds */}
        {prev !== null && (
          <div
            key={`prev-${prev}`}
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${slideshowImages[prev]})`, opacity: 1, transition: "none", zIndex: 0 }}
          />
        )}
        <div
          key={`curr-${current}`}
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url(${slideshowImages[current]})`,
            opacity: transitioning ? 1 : 1,
            animation: transitioning ? "bgFadeIn 1.2s ease-in-out forwards" : "none",
            zIndex: 1,
          }}
        />
        {/* Dark overlay for text readability */}
        <div className="absolute inset-0 bg-black/80" style={{ zIndex: 2 }} />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary-800/20 via-transparent to-transparent" style={{ zIndex: 3 }} />
        <div className="relative max-w-4xl mx-auto py-16" style={{ zIndex: 4 }}>
          <span className="badge bg-primary-900/80 text-primary-300 text-sm mb-4 inline-block">
            📅 February 26–28, 2026
          </span>
          <h1 className="text-6xl md:text-8xl font-black mb-4 tracking-tight hero-glow hero-calligraphy text-white">
            UTSARGA
          </h1>
          <p
            className="text-primary-200 text-xl italic mb-6"
            style={{ fontFamily: '"Georgia", "Times New Roman", serif' }}
          >
            where heart performs & soul offers
          </p>
          <p className="text-gray-300 text-lg md:text-xl max-w-2xl mx-auto mb-8">
            The Annual Cultural Fest is here. Register for events, compete, connect, and celebrate.
          </p>
          <Link to="/events" className="btn-primary text-base px-8 py-3 inline-block">
            Explore Events
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800 text-center py-8 text-gray-500 text-sm">
        <p>© 2026 Spandan. All rights reserved.</p>
      </footer>
    </>
  );
}
