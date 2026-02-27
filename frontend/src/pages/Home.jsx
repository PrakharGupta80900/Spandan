import { Link } from "react-router-dom";
import { useState, useEffect } from "react";

import img1 from "../../img/1.png";
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
  const heroWord = "UTSARGA";
  const [current, setCurrent] = useState(0);
  const [prev, setPrev] = useState(null);
  const [transitioning, setTransitioning] = useState(false);
  const [typedTitle, setTypedTitle] = useState("");

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

  useEffect(() => {
    let i = 0;
    const timer = setInterval(() => {
      i += 1;
      setTypedTitle(heroWord.slice(0, i));
      if (i >= heroWord.length) clearInterval(timer);
    }, 160);

    return () => clearInterval(timer);
  }, []);

  return (
    <>
      <section className="text-white min-h-[calc(100vh-4rem)] flex items-center px-4 text-center relative overflow-hidden">
        {prev !== null && (
          <div
            key={`prev-${prev}`}
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: `url(${slideshowImages[prev]})`,
              opacity: 0.7,
              animation: "bgFadeOut 1.6s ease-in-out forwards",
              zIndex: 0,
            }}
          />
        )}
        <div
          key={`curr-${current}`}
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url(${slideshowImages[current]})`,
            opacity: 0.7,
            animation: transitioning ? "bgFadeIn 1.6s ease-in-out forwards" : "none",
            zIndex: 1,
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#F8F3E1]/55 via-[#F8F3E1]/40 to-[#E3DBBB]/58" style={{ zIndex: 2 }} />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white/20 via-transparent to-transparent" style={{ zIndex: 3 }} />
        <div className="relative max-w-4xl mx-auto py-16" style={{ zIndex: 4 }}>
          <span className="badge !bg-transparent !text-black text-[20px] mb-4 inline-block">
            March 27-28, 2026
          </span>
          <h1 className="text-6xl md:text-8xl font-black mb-4 tracking-tight hero-glow utsarga-font text-white">
            {typedTitle}
            {typedTitle.length < heroWord.length && (
              <span className="inline-block w-[0.08em] h-[0.9em] ml-1 align-[-0.08em] bg-accent-300 animate-pulse" />
            )}
          </h1>
          <p
            className="text-accent-300 text-xl italic mb-6"
            style={{ fontFamily: '"Georgia", "Times New Roman", serif' }}
          >
            where heart performs and soul offers
          </p>
          <p className="text-gray-100 text-lg md:text-xl max-w-2xl mx-auto mb-8">
            The Annual Cultural Fest is here. Register for events, compete, connect, and celebrate.
          </p>
          <Link to="/events" className="btn-primary text-base px-8 py-3 inline-block">
            Explore Events
          </Link>
        </div>
      </section>

      <footer className="border-t border-jewel-500/20 text-center py-8 text-gray-400 text-sm">
        <p>Copyright 2026 Spandan. All rights reserved.</p>
      </footer>
    </>
  );
}
