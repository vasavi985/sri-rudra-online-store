import { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import heroSlide1 from '../assets/hero-slide-1.jpg';
import heroSlide2 from '../assets/hero-slide-2.jpg';
import heroSlide3 from '../assets/hero-slide-3.jpg';
import heroSlide4 from '../assets/hero-slide-4.jpg';
import './HeroCarousel.css';

const SLIDES = [
  {
    id: 1,
    image: heroSlide1,
    alt: 'Sri Rudra product collection - Toor Dal, Moong Dal, Gram Flour, Ragi Flour, Rice Flour, Ravva - Munaga Anilkumar Traders',
  },
  {
    id: 2,
    image: heroSlide2,
    alt: 'Sri Rudra Dal and Pulses collection - Toor Dal and Moong Dal - Munaga Anilkumar Traders',
  },
  {
    id: 3,
    image: heroSlide3,
    alt: 'Sri Rudra Traditional Flours collection - Ragi Flour, Gram Flour, Rice Flour, Ravva - Munaga Anilkumar Traders',
  },
  {
    id: 4,
    image: heroSlide4,
    alt: 'Sri Rudra South Indian food and traditional grocery products scene - Munaga Anilkumar Traders',
  },
];

const HeroCarousel = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef(null);

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % SLIDES.length);
  }, []);

  const prevSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev - 1 + SLIDES.length) % SLIDES.length);
  }, []);

  const goToSlide = (idx) => {
    setCurrentSlide(idx);
  };

  useEffect(() => {
    if (isPaused) return;

    timerRef.current = setInterval(() => {
      nextSlide();
    }, 5000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPaused, nextSlide]);

  return (
    <div
      className="hero-carousel-container"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      aria-label="Sri Rudra Product Carousel"
      role="region"
    >
      {/* Image Frame with Navigation Controls */}
      <div className="carousel-frame">
        <div className="carousel-track">
          {SLIDES.map((slide, index) => {
            const isActive = index === currentSlide;
            return (
              <div
                key={slide.id}
                className={`carousel-slide ${isActive ? 'active' : ''}`}
                aria-hidden={!isActive}
              >
                <img
                  src={slide.image}
                  alt={slide.alt}
                  className="slide-image"
                  loading={index === 0 ? 'eager' : 'lazy'}
                />
              </div>
            );
          })}
        </div>

        {/* Navigation Arrows on Left and Right of Image */}
        <button
          type="button"
          className="carousel-control prev"
          onClick={prevSlide}
          aria-label="Previous Slide"
        >
          <ChevronLeft size={22} />
        </button>
        <button
          type="button"
          className="carousel-control next"
          onClick={nextSlide}
          aria-label="Next Slide"
        >
          <ChevronRight size={22} />
        </button>
      </div>

      {/* Pagination Dots below image */}
      <div className="carousel-indicators" role="tablist" aria-label="Slide selectors">
        {SLIDES.map((slide, index) => (
          <button
            key={slide.id}
            type="button"
            role="tab"
            aria-selected={index === currentSlide}
            className={`indicator-dot ${index === currentSlide ? 'active' : ''}`}
            onClick={() => goToSlide(index)}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
};

export default HeroCarousel;
