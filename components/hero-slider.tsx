"use client";

import React, { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";

interface Slider {
  id: string;
  title: string;
  subtitle: string | null;
  image_url: string;
  link_url: string | null;
  button_text: string | null;
  order_index: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const HeroSlider = () => {
  const [sliders, setSliders] = useState<Slider[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSliders();
  }, []);

  useEffect(() => {
    if (sliders.length > 1) {
      const timer = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % sliders.length);
      }, 5000); // Auto-advance every 5 seconds

      return () => clearInterval(timer);
    }
  }, [sliders.length]);

  const fetchSliders = async () => {
    try {
      setLoading(true);
      
      const response = await fetch('/api/sliders');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      setSliders(result.sliders || []);
    } catch (err) {
      console.error('Error fetching sliders:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch sliders');
    } finally {
      setLoading(false);
    }
  };

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % sliders.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + sliders.length) % sliders.length);
  };

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  if (loading) {
    return (
      <div className="relative w-full aspect-[16/9] max-h-[60vh] bg-gray-200 animate-pulse rounded-lg">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-gray-500">Loading slider...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="relative w-full aspect-[16/9] max-h-[60vh] bg-red-50 border border-red-200 rounded-lg flex items-center justify-center">
        <div className="text-red-600">Error loading slider: {error}</div>
      </div>
    );
  }

  if (sliders.length === 0) {
    return (
      <div className="relative w-full aspect-[16/9] max-h-[60vh] bg-gray-100 rounded-lg flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-600 mb-2">No Sliders Available</h2>
          <p className="text-gray-500">Please add some sliders in the admin panel.</p>
        </div>
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
              <Image
                src={slider.image_url}
                alt={slider.title}
                fill
                className="object-cover"
                priority={index === 0}
              />
              {/* Overlay */}
              {/* <div className="absolute inset-0 bg-black bg-opacity-40" /> */}
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
};

export default HeroSlider;