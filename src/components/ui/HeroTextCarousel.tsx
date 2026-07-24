"use client";

import React, { useState, useEffect } from "react";

const slides = [
  {
    title: "Your clinic deserves",
    highlight: "more patients",
    subtitle: "Automate your patient acquisition, rank higher on Google, and fill your calendar with an all-in-one practice growth engine."
  },
  {
    title: "Dominate your",
    highlight: "local search",
    subtitle: "Outrank competitors in your city. Our data-layer system puts your practice at the top of Google Maps and search results."
  },
  {
    title: "Turn happy patients into",
    highlight: "5-star reviews",
    subtitle: "Automatically capture positive feedback while privately intercepting negative experiences before they go public."
  }
];

export function HeroTextCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % slides.length);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  const slide = slides[currentIndex];

  return (
    <div className="text-center max-w-4xl mx-auto mb-12 min-h-[300px] sm:min-h-[260px] flex flex-col items-center justify-center relative">
      <div key={currentIndex} className="animate-in fade-in zoom-in-95 slide-in-from-bottom-2 duration-700 w-full flex-grow flex flex-col items-center justify-center">


        {/* Main Headline */}
        <h1 className="text-5xl sm:text-6xl md:text-7xl font-black text-slate-900 tracking-tight leading-[1.08] mb-6">
          {slide.title} <br className="hidden sm:block" />
          <span className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-600 bg-clip-text text-transparent">
            {slide.highlight}
          </span>
        </h1>

        <p className="text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed mb-6">
          {slide.subtitle}
        </p>
      </div>
      
      {/* Slide Indicators */}
      <div className="flex items-center justify-center gap-2 h-6">
        {slides.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentIndex(idx)}
            className={`h-2 rounded-full transition-all duration-500 ${
              idx === currentIndex ? "bg-blue-600 w-8" : "bg-slate-300 hover:bg-slate-400 w-2"
            }`}
            aria-label={`Go to slide ${idx + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
