'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { HeroImage } from '@/components/ui/optimized-image';

interface Slider {
  id: string;
  title: string;
  subtitle?: string;
  description?: string;
  image_url: string;
  link_url?: string;
  button_text?: string;
  is_active: boolean;
  order_index: number;
  created_at: string;
  updated_at: string;
}

interface HeroSliderClientProps {
  sliders: Slider[];
}

export default function HeroSliderClient({ sliders }: HeroSliderClientProps) {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    if (sliders.length > 1) {
      const timer = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % sliders.length);
      }, 5000); // Auto-advance every 5 seconds

      return () => clearInterval(timer);
    }
  }, [sliders.length]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % sliders.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + sliders.length) % sliders.length);
  };

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  if (sliders.length === 0) {
    return (
      <div className="relative w-full aspect-[16/9] max-h-[60vh] bg-gray-100 rounded-lg flex items-center justify-center">
        <div className="text-gray-500">No sliders available</div>
      </div>
    );
  }

  const currentSliderData = sliders[currentSlide];

  return (
    <div className="relative w-full aspect-[16/9] max-h-[60vh] overflow-hidden rounded-lg shadow-lg">
      {/* Slider Images */}
      <div className="relative w-full h-full">
        {sliders.map((slider, index) => (
          <div
            key={slider.id}
            className={`absolute inset-0 transition-opacity duration-500 ${
              index === currentSlide ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <div className="relative w-full h-full">
              <HeroImage
              src={slider.image_url}
              alt={slider.title}
              fill
            />
            </div>
          </div>
        ))}
      </div>

      {/* Content Overlay */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center text-white px-4 sm:px-6 max-w-4xl">
          <h1 className="text-2xl sm:text-3xl md:text-5xl lg:text-6xl font-bold mb-2 sm:mb-4 drop-shadow-lg">
            {currentSliderData.title}
          </h1>
          {currentSliderData.subtitle && (
            <p className="text-sm sm:text-lg md:text-xl lg:text-2xl mb-4 sm:mb-8 drop-shadow-lg opacity-90">
              {currentSliderData.subtitle}
            </p>
          )}
          {currentSliderData.link_url && currentSliderData.button_text && (
            <Link href={currentSliderData.link_url}>
              <Button size="sm" className="sm:size-lg text-sm sm:text-lg px-6 sm:px-8 py-2 sm:py-3">
                {currentSliderData.button_text}
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Navigation Arrows - Hidden on mobile for better touch experience */}
      {sliders.length > 1 && (
        <>
          <Button
            variant="ghost"
            size="icon"
            className="absolute left-2 sm:left-4 top-1/2 transform -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white border-0 hidden sm:flex"
            onClick={prevSlide}
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-2 sm:right-4 top-1/2 transform -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white border-0 hidden sm:flex"
            onClick={nextSlide}
          >
            <ChevronRight className="h-6 w-6" />
          </Button>
        </>
      )}

      {/* Dots Indicator */}
      {sliders.length > 1 && (
        <div className="absolute bottom-3 sm:bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-1.5 sm:space-x-2">
          {sliders.map((_, index) => (
            <button
              key={index}
              className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full transition-all duration-300 ${
                index === currentSlide
                  ? 'bg-white scale-125'
                  : 'bg-white/60 hover:bg-white/80'
              }`}
              onClick={() => goToSlide(index)}
            />
          ))}
        </div>
      )}
    </div>
  );
}