'use client';

import { DM_Sans } from 'next/font/google';
import Image from 'next/image';
import Link from 'next/link';
import React, { useEffect, useLayoutEffect, useState, useRef, useCallback } from 'react';
import {
  ArrowRight,
  BarChart3,
  Play,
  Settings,
  Shield,
  Sun,
  Wifi,
  Activity,
  Menu,
  X,
  Search,
  ShoppingBag,
} from 'lucide-react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ScrollSmoother } from 'gsap/ScrollSmoother';
import BookDemoModal from '@/components/landing/BookDemoModal';
import VideoHero from '@/components/landing/VideoHero';
import KronisFarmSection from '@/components/landing/KronisFarmSection';
import TerraecoHero from '@/components/landing/TerraecoHero';
import TwoSolutionsSection from '@/components/landing/TwoSolutionsSection';
import SunToSoilSection from '@/components/landing/SunToSoilSection';
import { preferNativeLandingScroll } from '@/lib/landingMotion';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
  try {
    if (ScrollSmoother) gsap.registerPlugin(ScrollSmoother);
  } catch {
    /* club plugin missing — CSS fallback below */
  }
}

const dmSans = DM_Sans({ 
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-dm-sans',
});

export default function LandingHome() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);
  const smootherRef = useRef(null);

  useEffect(() => {
    if (preferNativeLandingScroll()) return undefined;
    const refresh = () => ScrollTrigger.refresh();
    const t1 = window.setTimeout(refresh, 160);
    const t2 = window.setTimeout(refresh, 700);
    window.addEventListener('load', refresh);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.removeEventListener('load', refresh);
    };
  }, []);

  // GSAP smooth scroll to section function using ScrollSmoother
  const scrollToSection = useCallback((sectionId, e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    const element = document.getElementById(sectionId);
    if (!element) return;
    
    // Use ScrollSmoother's scrollTo method if available and properly initialized
    if (smootherRef.current && typeof smootherRef.current.scrollTo === 'function') {
      try {
        smootherRef.current.scrollTo(element, true, 'top top');
      } catch (error) {
        // If ScrollSmoother fails, fallback to native scroll
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    } else {
      // Fallback to native smooth scroll (works on desktop/web)
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  useLayoutEffect(() => {
    if (preferNativeLandingScroll()) return undefined;
    if (!document.getElementById('smooth-wrapper') || !document.getElementById('smooth-content')) {
      return undefined;
    }
    if (!ScrollSmoother || typeof ScrollSmoother.create !== 'function') return undefined;

    document.documentElement.style.scrollBehavior = 'auto';
    document.body.style.scrollBehavior = 'auto';

    const smoother = ScrollSmoother.create({
      wrapper: '#smooth-wrapper',
      content: '#smooth-content',
      smooth: 2,
      normalizeScroll: true,
      ignoreMobileResize: true,
      effects: true,
      smoothTouch: 0.1,
    });
    smootherRef.current = smoother;
    ScrollTrigger.refresh();
    return () => {
      smoother.kill();
      if (smootherRef.current === smoother) smootherRef.current = null;
    };
  }, []);

  useEffect(() => {
    // Detect mobile device - only disable smooth scroll on actual mobile devices
    // Check for mobile user agent AND touch capability (not just screen width)
    const isMobileDevice = preferNativeLandingScroll();

    // On mobile, use normal scroll - don't initialize smooth scroll
    if (isMobileDevice) {
      // Ensure normal scroll behavior on mobile
      document.documentElement.style.scrollBehavior = 'auto';
      document.body.style.scrollBehavior = 'auto';
      
      // Create a simple wrapper for scrollToSection to work
      smootherRef.current = {
        scrollTo: (target, smooth) => {
          if (typeof target === 'number') {
            window.scrollTo({ top: target, behavior: smooth ? 'smooth' : 'auto' });
            return;
          }
          if (typeof target === 'string') {
            target = document.getElementById(target);
          }
          if (target) {
            target.scrollIntoView({ behavior: 'auto', block: 'start' });
          }
        },
        scrollTop: () => window.pageYOffset || document.documentElement.scrollTop,
        kill: () => {}
      };
      return;
    }

    // Initialize smooth scroll only for desktop/web
    const initSmoothScroll = () => {
      if (typeof window === 'undefined') return;
      
      // Wait for DOM to be ready
      if (!document.getElementById('smooth-wrapper') || !document.getElementById('smooth-content')) {
        return;
      }
      
      try {
        if (ScrollSmoother && typeof ScrollSmoother.create === 'function') {
          if (smootherRef.current && typeof smootherRef.current.progress === 'function') {
            ScrollTrigger.refresh();
            return;
          }
          if (smootherRef.current) {
            smootherRef.current.kill();
            smootherRef.current = null;
          }

          document.documentElement.style.scrollBehavior = 'auto';
          document.body.style.scrollBehavior = 'auto';

          smootherRef.current = ScrollSmoother.create({
            wrapper: '#smooth-wrapper',
            content: '#smooth-content',
            smooth: 2,
            normalizeScroll: true,
            ignoreMobileResize: true,
            effects: true,
            smoothTouch: 0.1,
          });
          ScrollTrigger.refresh();
        } else {
          document.documentElement.style.scrollBehavior = 'smooth';
          document.body.style.scrollBehavior = 'smooth';
          smootherRef.current = {
            scrollTo: (target, smooth) => {
              if (typeof target === 'number') {
                window.scrollTo({ top: target, behavior: smooth ? 'smooth' : 'auto' });
                return;
              }
              if (typeof target === 'string') {
                target = document.getElementById(target);
              }
              if (target) {
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }
            },
            scrollTop: () => window.pageYOffset || document.documentElement.scrollTop,
            kill: () => {},
          };
        }
      } catch (error) {
        console.warn('Smooth scroll initialization failed:', error);
        // Enable native smooth scroll as last resort
        document.documentElement.style.scrollBehavior = 'smooth';
        document.body.style.scrollBehavior = 'smooth';
        
        // Create fallback wrapper even on error
        smootherRef.current = {
          scrollTo: (target, smooth) => {
            if (typeof target === 'number') {
              window.scrollTo({ top: target, behavior: smooth ? 'smooth' : 'auto' });
              return;
            }
            if (typeof target === 'string') {
              target = document.getElementById(target);
            }
            if (target) {
              target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
          },
          scrollTop: () => window.pageYOffset || document.documentElement.scrollTop,
          kill: () => {}
        };
      }
    };

    // Initialize when DOM is ready (only for desktop)
    if (document.readyState === 'complete') {
      setTimeout(initSmoothScroll, 100);
    } else {
      window.addEventListener('load', () => {
        setTimeout(initSmoothScroll, 100);
      });
    }
    
    // Also try after a short delay (only for desktop)
    const timeoutId = setTimeout(initSmoothScroll, 500);

    // Keyboard: arrows/page keys scroll incrementally (so pinned VideoHero scrubs like the wheel).
    // Home/End still jump to first/last section.
    const sections = ['home', 'about', 'pump-showcase', 'platform', 'features', 'resources', 'company'];

    const handleKeyDown = (e) => {
      if (!smootherRef.current) return;

      const tag = document.activeElement?.tagName;
      if (
        tag === 'INPUT' ||
        tag === 'TEXTAREA' ||
        tag === 'SELECT' ||
        document.activeElement?.isContentEditable
      ) {
        return;
      }

      const scrollByDelta = (delta) => {
        e.preventDefault();
        const current = smootherRef.current.scrollTop?.() ?? window.pageYOffset;
        const next = Math.max(0, current + delta);
        try {
          // Numeric scrollTo — same scroll path the wheel uses with ScrollSmoother
          smootherRef.current.scrollTo(next, true);
        } catch {
          window.scrollTo({ top: next, behavior: 'smooth' });
        }
      };

      if (e.key === 'ArrowDown') {
        scrollByDelta(window.innerHeight * 0.14);
      } else if (e.key === 'ArrowUp') {
        scrollByDelta(-window.innerHeight * 0.14);
      } else if (e.key === 'PageDown') {
        scrollByDelta(window.innerHeight * 0.85);
      } else if (e.key === 'PageUp') {
        scrollByDelta(-window.innerHeight * 0.85);
      } else if (e.key === 'Home') {
        e.preventDefault();
        scrollToSection('home', e);
      } else if (e.key === 'End') {
        e.preventDefault();
        scrollToSection(sections[sections.length - 1], e);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('keydown', handleKeyDown);
      
      if (smootherRef.current && typeof smootherRef.current.progress !== 'function') {
        smootherRef.current.kill?.();
        smootherRef.current = null;
      }
    };
  }, [scrollToSection]);

  return (
    <>
    <div id="smooth-wrapper" className={`landing-page min-h-screen bg-black md:overflow-x-clip ${dmSans.variable}`}>
      <div id="smooth-content">
      {/* Navigation — transparent over assemble hero */}
      <nav className="absolute left-0 right-0 top-0 z-50 px-4 pt-4 sm:px-6 sm:pt-6" style={{ margin: 0 }}>
        <div className="mx-auto max-w-7xl px-2 py-2.5 sm:px-3 sm:py-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 flex-1 items-center gap-4 sm:gap-5 lg:gap-7 xl:gap-9">
              <button
                type="button"
                onClick={(e) => {
                  scrollToSection('home', e);
                  setIsMobileMenuOpen(false);
                }}
                className="flex min-w-0 shrink-0 items-center rounded-lg outline-none transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-orange-500/70"
                aria-label="Kronis home"
              >
                <Image
                  src="/kronis-logo.svg"
                  alt="Kronis"
                  width={112}
                  height={41}
                  priority
                  className="h-7 w-auto max-w-[9rem] object-contain object-left sm:h-8 sm:max-w-[10rem]"
                />
              </button>

              <div className="hidden min-w-0 items-center gap-4 lg:flex lg:gap-5 xl:gap-7">
                <button
                  type="button"
                  onClick={(e) => {
                    scrollToSection('home', e);
                    setIsMobileMenuOpen(false);
                  }}
                  className="shrink-0 text-sm font-medium text-zinc-900 transition-colors hover:text-orange-600 xl:text-base"
                  style={{ fontFamily: dmSans.style.fontFamily }}
                >
                  Home
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    scrollToSection('about', e);
                    setIsMobileMenuOpen(false);
                  }}
                  className="shrink-0 text-sm font-medium text-zinc-900 transition-colors hover:text-orange-600 xl:text-base"
                  style={{ fontFamily: dmSans.style.fontFamily }}
                >
                  About
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    scrollToSection('pump-showcase', e);
                    setIsMobileMenuOpen(false);
                  }}
                  className="shrink-0 text-sm font-medium text-zinc-900 transition-colors hover:text-orange-600 xl:text-base"
                  style={{ fontFamily: dmSans.style.fontFamily }}
                >
                  Pump
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    scrollToSection('platform', e);
                    setIsMobileMenuOpen(false);
                  }}
                  className="shrink-0 text-sm font-medium text-zinc-900 transition-colors hover:text-orange-600 xl:text-base"
                  style={{ fontFamily: dmSans.style.fontFamily }}
                >
                  Platform
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    scrollToSection('features', e);
                    setIsMobileMenuOpen(false);
                  }}
                  className="shrink-0 text-sm font-medium text-zinc-900 transition-colors hover:text-orange-600 xl:text-base"
                  style={{ fontFamily: dmSans.style.fontFamily }}
                >
                  Features
                </button>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-1 sm:gap-2">
              <button
                type="button"
                className="relative hidden rounded-full p-2 text-zinc-900 transition-colors hover:bg-black/5 hover:text-orange-600 sm:block"
                aria-label="Cart"
              >
                <ShoppingBag className="h-5 w-5" />
                <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-orange-500" aria-hidden />
              </button>
              <button
                type="button"
                onClick={() => scrollToSection('resources')}
                className="hidden rounded-full p-2 text-zinc-900 transition-colors hover:bg-black/5 hover:text-orange-600 sm:block"
                aria-label="Search site sections"
              >
                <Search className="h-5 w-5" />
              </button>
              <Link
                href="/login"
                className="text-sm font-medium text-zinc-900 transition-colors hover:text-orange-600"
                style={{ fontFamily: dmSans.style.fontFamily }}
              >
                Login
              </Link>
              <button
                type="button"
                onClick={() => setIsDemoModalOpen(true)}
                className="hidden rounded-full bg-gradient-to-r from-orange-500 to-red-600 px-4 py-2 text-xs font-semibold text-white transition hover:brightness-110 sm:inline xl:text-sm"
                style={{ fontFamily: dmSans.style.fontFamily }}
              >
                Book a demo
              </button>
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-black bg-gradient-to-br from-orange-500 to-red-600 text-white shadow-md shadow-orange-900/30 transition hover:brightness-110 lg:hidden"
                aria-label="Toggle menu"
              >
                {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>

          {isMobileMenuOpen && (
            <div className="mt-3 space-y-1 rounded-2xl border border-black/10 bg-[#d7d1ca]/95 p-4 shadow-lg backdrop-blur-sm lg:hidden">
              <button
                type="button"
                onClick={(e) => {
                  scrollToSection('home', e);
                  setIsMobileMenuOpen(false);
                }}
                className="block w-full rounded-lg py-2.5 text-left text-zinc-900 transition hover:bg-black/5 hover:text-orange-600"
                style={{ fontFamily: dmSans.style.fontFamily }}
              >
                Home
              </button>
              <button
                type="button"
                onClick={(e) => {
                  scrollToSection('about', e);
                  setIsMobileMenuOpen(false);
                }}
                className="block w-full rounded-lg py-2.5 text-left text-zinc-900 transition hover:bg-black/5 hover:text-orange-600"
                style={{ fontFamily: dmSans.style.fontFamily }}
              >
                About
              </button>
              <button
                type="button"
                onClick={(e) => {
                  scrollToSection('pump-showcase', e);
                  setIsMobileMenuOpen(false);
                }}
                className="block w-full rounded-lg py-2.5 text-left text-zinc-900 transition hover:bg-black/5 hover:text-orange-600"
                style={{ fontFamily: dmSans.style.fontFamily }}
              >
                Pump
              </button>
              <button
                type="button"
                onClick={(e) => {
                  scrollToSection('platform', e);
                  setIsMobileMenuOpen(false);
                }}
                className="block w-full rounded-lg py-2.5 text-left text-zinc-900 transition hover:bg-black/5 hover:text-orange-600"
                style={{ fontFamily: dmSans.style.fontFamily }}
              >
                Platform
              </button>
              <button
                type="button"
                onClick={(e) => {
                  scrollToSection('features', e);
                  setIsMobileMenuOpen(false);
                }}
                className="block w-full rounded-lg py-2.5 text-left text-zinc-900 transition hover:bg-black/5 hover:text-orange-600"
                style={{ fontFamily: dmSans.style.fontFamily }}
              >
                Features
              </button>
              <button
                type="button"
                onClick={(e) => {
                  scrollToSection('resources', e);
                  setIsMobileMenuOpen(false);
                }}
                className="block w-full rounded-lg py-2.5 text-left text-zinc-900 transition hover:bg-black/5 hover:text-orange-600"
                style={{ fontFamily: dmSans.style.fontFamily }}
              >
                Resources
              </button>
              <button
                type="button"
                onClick={(e) => {
                  scrollToSection('company', e);
                  setIsMobileMenuOpen(false);
                }}
                className="block w-full rounded-lg py-2.5 text-left text-zinc-900 transition hover:bg-black/5 hover:text-orange-600"
                style={{ fontFamily: dmSans.style.fontFamily }}
              >
                Company
              </button>
              <div className="mt-2 space-y-2 border-t border-black/10 pt-3">
                <Link
                  href="/login"
                  className="block py-2 text-zinc-900 transition hover:text-orange-600"
                  style={{ fontFamily: dmSans.style.fontFamily }}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Login
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setIsDemoModalOpen(true);
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full rounded-full bg-gradient-to-r from-orange-500 to-red-600 py-3 text-center text-sm font-bold text-white transition hover:brightness-110"
                  style={{ fontFamily: dmSans.style.fontFamily }}
                >
                  Book a demo
                </button>
              </div>
            </div>
          )}
        </div>
      </nav>


      <VideoHero dmSansFamily={dmSans.style.fontFamily} />

      <KronisFarmSection
        dmSansFamily={dmSans.style.fontFamily}
        onExplore={(e) => scrollToSection('product', e)}
      />

      <TerraecoHero
        dmSansFamily={dmSans.style.fontFamily}
        onBookDemo={() => setIsDemoModalOpen(true)}
        scrollToSection={scrollToSection}
      />

      <TwoSolutionsSection
        dmSansFamily={dmSans.style.fontFamily}
        scrollToSection={scrollToSection}
      />

      <SunToSoilSection dmSansFamily={dmSans.style.fontFamily} />
      
      {/* Stats & About Section - Modern Two-Column Layout */}
      <section id="about" className="bg-black relative z-10 flex min-h-0 items-center py-12 sm:py-16 md:min-h-screen md:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 w-full">
          <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 border border-gray-800/50">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 items-center">
              
              {/* Left Column - About Us */}
              <div className="space-y-4 sm:space-y-6 md:space-y-8 pl-0 sm:pl-4">
                {/* Header */}
                <div className="flex items-center space-x-3 mb-3 sm:mb-4">
                  <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                  <span className="text-white/80 text-xs sm:text-sm font-medium tracking-widest uppercase">About Us</span>
                </div>
                
                {/* Main Title */}
                <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-4xl font-bold leading-tight" 
                    style={{ 
                        background: 'radial-gradient(circle closest-corner at 50% 50%, #ffffff, #fff6)',
                        backgroundClip: 'text',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        color: 'transparent'
                    }}>
                  We are <span className="bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text text-transparent">Kronis</span>, a cutting-edge agricultural technology company that gets results
                </h2>
                
                {/* Description */}
                <p className="text-sm sm:text-lg text-gray-300 leading-relaxed">
                  We improve our clients&apos; agricultural productivity with a data-driven approach and we are hell-bent on making it awesome. Our goal is to create a new, technology-oriented quality of farming experience by leveraging powerful real-time IoT analytics and precision agriculture solutions.
                </p>
              </div>
              
              {/* Right Column - Statistics */}
              <div className="space-y-4 sm:space-y-6">
                {/* Clicks */}
                <div className="space-y-2">
                  <h3 className="text-white/80 text-xs sm:text-sm font-medium tracking-widest uppercase">Devices Deployed</h3>
                  <div className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-orange-500">10K+</div>
                  <div className="w-full h-px bg-gradient-to-r from-orange-500/50 to-transparent"></div>
                </div>
                
                {/* Conversions */}
                <div className="space-y-2">
                  <h3 className="text-white/80 text-xs sm:text-sm font-medium tracking-widest uppercase">Water Saved</h3>
                  <div className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-orange-500">500M+</div>
                  <div className="w-full h-px bg-gradient-to-r from-orange-500/50 to-transparent"></div>
                </div>
                
                {/* Our Possibilities */}
                <div className="space-y-2">
                  <h3 className="text-white/80 text-xs sm:text-sm font-medium tracking-widest uppercase">Our Possibilities</h3>
                  <div className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-orange-500">∞</div>
                  <div className="w-full h-px bg-gradient-to-r from-orange-500/50 to-transparent"></div>
                </div>
              </div>
            </div>
            
            {/* Right Edge Vertical Text - Hidden on mobile */}
            <div className="hidden lg:block absolute top-1/2 -right-8 transform -translate-y-1/2 rotate-90 origin-center">
              <div className="text-white/60 text-sm font-medium tracking-widest uppercase">
                TerraEco Honors
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Precision Engineering Section */}
      <section id="pump-showcase" className="bg-black relative z-10 flex min-h-0 items-center py-8 sm:py-12 md:min-h-screen md:py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 w-full">
          <div className="text-center mb-6 sm:mb-8 md:mb-10">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-3 sm:mb-4 md:mb-5"  style={{ 
                        background: 'radial-gradient(circle closest-corner at 50% 50%, #ffffff, #fff6)',
                        backgroundClip: 'text',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        color: 'transparent',
                        lineHeight:1.5,
                    }}>
              Precision Engineering
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-gray-300 max-w-2xl lg:max-w-3xl mx-auto px-4">
              Every component of our solar pump is meticulously designed and engineered for maximum efficiency and durability.
            </p>
          </div>
          
          <div className="relative flex justify-center items-center">
            {/* 3D Device Rendering with Callouts */}
            <div className="relative">
              <Image 
                src="/pump-prototype.png" 
                alt="TerraEco Solar Pump Prototype" 
                width={400}
                height={100}
                className="h-auto w-full max-w-sm object-contain sm:max-w-md md:max-w-lg lg:max-w-xl"
              />
              
              {/* Callout 1 - Top Right Annotation */}
              {/* <div className="absolute top-4" style={{ right: '144px' }}>
                <div className="absolute w-6 h-6 bg-orange-500 rounded-full shadow-lg" style={{ left: '-82px', bottom: '-120px' }}></div>
                <div className="absolute top-3 -right-6 w-32 h-1 bg-white transform -rotate-45 origin-right"></div>
                <div className="absolute top-0 -right-40 text-white w-48" style={{ left: '64px' }}>
                  <div className="text-sm font-semibold text-white">Device Box 1</div>
                  <div className="text-xs text-gray-300 mt-2 leading-relaxed">
                    It is a long established fact that a reader will be distracted by the readable content of a page when looking at its layout.
                  </div>
                </div>
              </div> */}
              
              {/* Callout 2 - Mid-Left Annotation */}
              {/* <div className="absolute top-1/2 -left-4">
                <div className="absolute left-48 w-6 h-6 bg-orange-500 rounded-full shadow-lg"></div>
                <div className="absolute top-3 left-48 w-32 h-1 bg-white transform rotate-45 origin-left"></div>
                <div className="absolute top-0 left-6 text-white w-48">
                  <div className="text-sm font-semibold text-white">Device Box 1</div>
                  <div className="text-xs text-gray-300 mt-2 leading-relaxed">
                    It is a long established fact that a reader will be distracted by the readable content of a page when looking at its layout.
                  </div>
                </div>
              </div> */}
              
              {/* Callout 3 - Bottom-Left Annotation */}
              {/* <div className="absolute bottom-4 -left-4">
                <div className="absolute left-48 w-6 h-6 bg-orange-500 rounded-full shadow-lg"></div>
                <div className="absolute top-3 left-48 w-32 h-1 bg-white transform rotate-45 origin-left"></div>
                <div className="absolute top-0 left-6 text-white w-48">
                  <div className="text-sm font-semibold text-white">Device Box 1</div>
                  <div className="text-xs text-gray-300 mt-2 leading-relaxed">
                    It is a long established fact that a reader will be distracted by the readable content of a page when looking at its layout.
                  </div>
                </div>
              </div> */}
              
              {/* Callout 4 - Mid-Right Annotation */}
              {/* <div className="absolute top-1/2 -right-4">
                <div className="w-6 h-6 bg-orange-500 rounded-full shadow-lg"></div>
                <div className="absolute top-3 -right-6 w-32 h-1 bg-white transform -rotate-45 origin-right"></div>
                <div className="absolute top-0 -right-40 text-white w-48">
                  <div className="text-sm font-semibold text-white">Device Box 1</div>
                  <div className="text-xs text-gray-300 mt-2 leading-relaxed">
                    It is a long established fact that a reader will be distracted by the readable content of a page when looking at its layout.
                  </div>
                </div>
              </div> */}
            </div>
          </div>
        </div>
      </section>
      

      {/* Platform Section - TerraEco IoT Integration */}
      <section id="platform" className="flex min-h-0 items-center bg-black py-12 sm:py-16 md:min-h-screen md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 w-full flex items-center">
          <div className="w-full">
            <div className="text-center mb-2 sm:mb-8 md:mb-2">
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white  sm:mb-4" style={{ 
                        background: 'radial-gradient(circle closest-corner at 50% 50%, #ffffff, #fff6)',
                        backgroundClip: 'text',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        color: 'transparent',
                        
                    }}>
                The TerraEco Platform
              </h2>
              <p className="text-sm sm:text-base text-gray-300 max-w-3xl mb-4 mx-auto px-4">
                Solar-powered irrigation systems with intelligent IoT technology.
              </p>
            </div>

            {/* Main Platform Visualization */}
            <div className="relative">
              <div className="bg-gradient-to-br from-gray-900 to-black rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-gray-800 overflow-hidden max-w-2xl mx-auto">
                <div className="relative">
                  {/* Solar Pump with IoT Connection Image */}
                  <div className="flex justify-center mb-4">
                    <div className="relative group">
                      <Image 
                        src="/solar-pump-with-web.png" 
                        alt="TerraEco Solar Pump with IoT Web Technology Integration" 
                        width={500}
                        height={100}
                        className="h-auto w-full rounded-xl shadow-2xl sm:rounded-2xl"
                      />
                      {/* Overlay with connection indicators */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-2xl"></div>
                      
                      {/* IoT Connection Indicators - Responsive */}
                      <div className="absolute top-2 right-2 sm:top-4 sm:right-4 bg-green-500/90 backdrop-blur-sm rounded-full p-2 sm:p-3 animate-pulse">
                        <Wifi className="text-white text-sm sm:text-xl" />
                      </div>
                      <div className="absolute bottom-2 left-2 sm:bottom-4 sm:left-4 bg-blue-500/90 backdrop-blur-sm rounded-full p-2 sm:p-3 animate-pulse">
                        <Activity className="text-white text-sm sm:text-xl" />
                      </div>
                      <div className="absolute top-1/2 left-2 sm:left-4 bg-orange-500/90 backdrop-blur-sm rounded-full p-2 sm:p-3 animate-pulse">
                        <Sun className="text-white text-sm sm:text-xl" />
                      </div>
                    </div>
                  </div>

                  {/* Connection Flow Description */}
                  <div className="text-center">
                    {/* <h3 className="text-lg font-bold text-white mb-2">
                      Seamless IoT Integration
                    </h3> */}
                    <p className="text-gray-300 text-xs sm:text-sm md:text-base max-w-4xl mx-auto leading-relaxed px-2">
                      Advanced sensors transmit real-time data to our cloud-based platform. Monitor water levels, soil moisture, and energy production from anywhere.
                    </p>
                  </div>
                </div>
              </div>
            </div>

          
          </div>
        </div>
      </section>

      {/* Platform Features Section */}
      <section 
        id="features" 
        className="flex min-h-0 items-center bg-black py-12 sm:py-16 md:min-h-screen md:py-20"
        style={{
          backgroundImage: 'url(/pump-glow-view.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          backgroundAttachment: 'scroll',
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 w-full">
          <div className="text-center mb-8 sm:mb-12 md:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 sm:mb-6 px-4">
              Comprehensive IoT Platform Features
            </h2>
            <p className="text-sm text-base sm:text-base md:text-base text-gray-300 max-w-3xl mx-auto px-4">
              Our integrated platform provides everything you need to monitor, control, and optimize your solar-powered irrigation systems 
              with advanced IoT technology and real-time data analytics.
            </p>
          </div>

          {/* Features Grid - Responsive Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 items-center">
            {/* Empty left side to maintain positioning - Hidden on mobile */}
            <div className="hidden lg:block"></div>
            
            {/* Features Grid - Responsive 1x4 on mobile, 2x2 on desktop */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {/* Real-time Monitoring */}
              <div className="bg-gray-900 rounded-2xl p-4 border border-gray-800 hover:border-blue-500 transition-all duration-300 group">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-white">Real-time Monitoring</h3>
                  <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <Activity className="text-white text-sm" />
                  </div>
                </div>
                <p className="text-gray-300 leading-relaxed mb-3 text-xs">
                  Monitor pump performance, water flow rates, soil moisture levels, and energy production in real-time.
                </p>
                <div className="inline-flex items-center gap-1 text-blue-400 hover:text-blue-300 transition-colors font-semibold cursor-pointer text-xs">
                  <span>View Dashboard</span>
                  <ArrowRight className="text-xs" />
                </div>
              </div>

              {/* Smart Control */}
              <div className="bg-gray-900 rounded-2xl p-4 border border-gray-800 hover:border-green-500 transition-all duration-300 group">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-white">Smart Control</h3>
                  <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <Settings className="text-white text-sm" />
                  </div>
                </div>
                <p className="text-gray-300 leading-relaxed mb-3 text-xs">
                  Remotely control your irrigation systems, set automated schedules, and optimize water usage.
                </p>
                <div className="inline-flex items-center gap-1 text-green-400 hover:text-green-300 transition-colors font-semibold cursor-pointer text-xs">
                  <span>Control System</span>
                  <ArrowRight className="text-xs" />
                </div>
              </div>

              {/* Data Analytics */}
              <div className="bg-gray-900 rounded-2xl p-4 border border-gray-800 hover:border-purple-500 transition-all duration-300 group">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-white">Data Analytics</h3>
                  <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <BarChart3 className="text-white text-sm" />
                  </div>
                </div>
                <p className="text-gray-300 leading-relaxed mb-3 text-xs">
                  Gain insights into your irrigation efficiency, energy consumption patterns, and crop yield optimization.
                </p>
                <div className="inline-flex items-center gap-1 text-purple-400 hover:text-purple-300 transition-colors font-semibold cursor-pointer text-xs">
                  <span>View Analytics</span>
                  <ArrowRight className="text-xs" />
                </div>
              </div>

              {/* IoT Integration */}
              <div className="bg-gray-900 rounded-2xl p-4 border border-gray-800 hover:border-orange-500 transition-all duration-300 group">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-white">IoT Integration</h3>
                  <div className="w-8 h-8 bg-orange-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <Wifi className="text-white text-sm" />
                  </div>
                </div>
                <p className="text-gray-300 leading-relaxed mb-3 text-xs">
                  Seamless connectivity with advanced sensors and cloud-based platform for comprehensive monitoring.
                </p>
                <div className="inline-flex items-center gap-1 text-orange-400 hover:text-orange-300 transition-colors font-semibold cursor-pointer text-xs">
                  <span>Learn More</span>
                  <ArrowRight className="text-xs" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section - TerraEco IoT Platform */}
      <section id="resources" className="flex min-h-0 items-center bg-black py-12 sm:py-16 md:min-h-screen md:py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center w-full">
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 sm:mb-6">
            Transform Your Agriculture with Smart IoT
          </h2>
          <p className="text-base sm:text-lg text-gray-300 mb-6 sm:mb-8 max-w-2xl lg:max-w-3xl mx-auto">
            Join the future of sustainable agriculture with our solar-powered irrigation systems and intelligent IoT platform. 
            Monitor, control, and optimize your operations from anywhere in the world.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center">
            <Link
              href="/login"
              className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white py-3 px-6 sm:py-4 sm:px-8 rounded-lg text-base sm:text-lg font-semibold flex items-center gap-3 transition-all duration-300 transform hover:scale-105 shadow-xl w-full sm:w-auto justify-center"
            >
              Start Your IoT Journey
              <ArrowRight className="text-lg sm:text-xl" />
            </Link>
            <Link
              href="#platform"
              className="border border-gray-600 hover:border-white text-white py-3 px-6 sm:py-4 sm:px-8 rounded-lg text-base sm:text-lg font-semibold flex items-center gap-3 transition-all duration-300 transform hover:scale-105 w-full sm:w-auto justify-center"
            >
              Learn More
              <Play className="text-lg sm:text-xl" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="company" className="flex min-h-0 items-center border-t border-gray-800 bg-black py-12 text-white sm:py-16 md:min-h-screen md:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 w-full">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            <div className="sm:col-span-2 lg:col-span-1">
              <div className="flex items-center space-x-3 mb-4 sm:mb-6">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-red-600 to-red-500 rounded-lg flex items-center justify-center">
                  <Shield className="text-white text-lg sm:text-xl" />
                </div>
                <span className="text-xl sm:text-2xl font-bold">Kronis</span>
              </div>
              <p className="text-sm sm:text-base text-gray-400 leading-relaxed mb-6 sm:mb-8">
                Powering the future of sustainable agriculture with solar-powered irrigation systems and intelligent IoT technology. 
                Monitor, control, and optimize your agricultural infrastructure through our comprehensive web platform.
              </p>
            </div>
            <div>
              <h4 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Platform</h4>
              <ul className="space-y-2 text-sm sm:text-base text-gray-400">
                <li><button className="hover:text-white transition-colors text-left">IoT Dashboard</button></li>
                <li><button className="hover:text-white transition-colors text-left">Device Management</button></li>
                <li><button className="hover:text-white transition-colors text-left">Analytics & Reports</button></li>
              </ul>
            </div>
            <div>
              <h4 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Company</h4>
              <ul className="space-y-2 text-sm sm:text-base text-gray-400">
                <li><button className="hover:text-white transition-colors text-left">About us</button></li>
                <li><button className="hover:text-white transition-colors text-left">Partners</button></li>
                <li><button className="hover:text-white transition-colors text-left">Careers</button></li>
              </ul>
            </div>
            <div>
              <h4 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Resources</h4>
              <ul className="space-y-2 text-sm sm:text-base text-gray-400">
                <li><button className="hover:text-white transition-colors text-left">Blog</button></li>
                <li><button className="hover:text-white transition-colors text-left">Documentation</button></li>
                <li><button className="hover:text-white transition-colors text-left">Support</button></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-6 sm:pt-8 flex flex-col sm:flex-row justify-between items-center gap-4 mt-6 sm:mt-8">
            <p className="text-gray-400 text-xs sm:text-sm text-center sm:text-left">
              © 2025 TerraEco. All rights reserved.
            </p>
            <div className="flex flex-wrap justify-center sm:justify-end gap-4 sm:gap-6">
              <button className="text-gray-400 hover:text-white transition-colors text-xs sm:text-sm">Privacy Policy</button>
              <button className="text-gray-400 hover:text-white transition-colors text-xs sm:text-sm">Terms of Service</button>
              <button className="text-gray-400 hover:text-white transition-colors text-xs sm:text-sm">Cookie Policy</button>
            </div>
          </div>
        </div>
      </footer>
      </div>
    </div>
    {/* Outside smooth-content so position:fixed is viewport-relative (ScrollSmoother uses transforms) */}
    <BookDemoModal
      isOpen={isDemoModalOpen}
      onClose={() => setIsDemoModalOpen(false)}
    />
    </>
  );
}
