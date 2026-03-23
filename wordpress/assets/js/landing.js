/**
 * Digital Stride Landing Page – landing.js
 *
 * Handles:
 *  1. Sticky header shrink on scroll
 *  2. Mobile navigation toggle
 *  3. Logo carousel: dot indicators synced to CSS animation progress
 *  4. Services cards: touch/keyboard hover parity
 *  5. Autoplay video fallback
 */

( function () {
  'use strict';

  /* =====================================================================
     Utilities
     ===================================================================== */
  const $  = ( sel, ctx = document ) => ctx.querySelector( sel );
  const $$ = ( sel, ctx = document ) => Array.from( ctx.querySelectorAll( sel ) );

  /* =====================================================================
     1. Sticky Header – shrink on scroll
     ===================================================================== */
  function initStickyHeader() {
    const header = $( '.site-header' );
    if ( ! header ) return;

    let lastY = 0;

    const onScroll = () => {
      const y = window.scrollY;
      if ( y > 80 ) {
        header.style.setProperty( '--header-height', '60px' );
        header.style.boxShadow = '0 4px 20px rgba(0,0,0,0.10)';
      } else {
        header.style.removeProperty( '--header-height' );
        header.style.boxShadow = '';
      }
      lastY = y;
    };

    window.addEventListener( 'scroll', onScroll, { passive: true } );
  }

  /* =====================================================================
     2. Mobile Navigation Toggle
     ===================================================================== */
  function initMobileNav() {
    const toggle  = $( '.site-header__mobile-toggle' );
    const mobileNav = $( '.site-header__mobile-nav' );
    if ( ! toggle || ! mobileNav ) return;

    toggle.addEventListener( 'click', () => {
      const isExpanded = toggle.getAttribute( 'aria-expanded' ) === 'true';
      toggle.setAttribute( 'aria-expanded', String( ! isExpanded ) );
      mobileNav.hidden = isExpanded;

      // Animate hamburger → X
      const spans = $$( 'span', toggle );
      if ( ! isExpanded ) {
        spans[0].style.transform = 'rotate(45deg) translate(5px, 5px)';
        spans[1].style.opacity   = '0';
        spans[2].style.transform = 'rotate(-45deg) translate(5px, -5px)';
      } else {
        spans.forEach( s => { s.style.transform = ''; s.style.opacity = ''; } );
      }
    } );

    // Close on outside click
    document.addEventListener( 'click', ( e ) => {
      if ( ! toggle.contains( e.target ) && ! mobileNav.contains( e.target ) ) {
        toggle.setAttribute( 'aria-expanded', 'false' );
        mobileNav.hidden = true;
        $$( 'span', toggle ).forEach( s => { s.style.transform = ''; s.style.opacity = ''; } );
      }
    } );
  }

  /* =====================================================================
     3. Logo Carousel – Dot Indicators
     =====================================================================
     The scrolling is handled purely by a CSS animation (logoScroll).
     We synchronise the dot indicators by calculating which "slide" the
     animated track is currently showing based on elapsed time.
     ===================================================================== */
  function initLogoCarousel() {
    $$( '[data-logo-carousel]' ).forEach( carousel => {
      const track = $( '[data-carousel-track]', carousel );
      const dots  = $$( '[data-carousel-dots] .logo-carousel__dot', carousel );
      if ( ! track || dots.length === 0 ) return;

      const totalSlides    = dots.length;          // original (non-duplicated) count
      const ANIM_DURATION  = 30000;               // must match CSS (30s)
      let   animStartTime  = performance.now();
      let   raf;

      // Allow pausing via hover (CSS handles animation-play-state,
      // here we just freeze the dot calculation)
      let isPaused = false;
      let pausedAt = 0;

      track.addEventListener( 'mouseenter', () => {
        isPaused  = true;
        pausedAt  = performance.now();
      } );

      track.addEventListener( 'mouseleave', () => {
        if ( isPaused ) {
          animStartTime += performance.now() - pausedAt;
        }
        isPaused = false;
      } );

      function updateDots( now ) {
        if ( ! isPaused ) {
          const elapsed = now - animStartTime;
          const progress = ( elapsed % ANIM_DURATION ) / ANIM_DURATION; // 0 → 1
          const activeIndex = Math.floor( progress * totalSlides ) % totalSlides;

          dots.forEach( ( dot, i ) => {
            const active = i === activeIndex;
            dot.classList.toggle( 'is-active', active );
            dot.setAttribute( 'aria-selected', String( active ) );
          } );
        }
        raf = requestAnimationFrame( updateDots );
      }

      raf = requestAnimationFrame( updateDots );

      // Dot click: jump to slide by manipulating the CSS animation delay
      dots.forEach( ( dot, i ) => {
        dot.addEventListener( 'click', () => {
          const targetProgress = i / totalSlides;
          // Offset animStartTime so the desired slide shows immediately
          animStartTime = performance.now() - targetProgress * ANIM_DURATION;
          // Sync the CSS animation offset via animation-delay (negative = jump ahead)
          const offsetMs = targetProgress * ANIM_DURATION;
          track.style.animationDelay = `-${ offsetMs }ms`;
        } );
      } );
    } );
  }

  /* =====================================================================
     4. Services Cards – Keyboard & Touch parity
     =====================================================================
     CSS :hover handles mouse. We add `is-active` for keyboard focus and
     touch press to ensure accessibility and mobile usability.
     ===================================================================== */
  function initServiceCards() {
    $$( '.service-card' ).forEach( card => {
      // Make focusable for keyboard navigation
      if ( ! card.hasAttribute( 'tabindex' ) ) {
        card.setAttribute( 'tabindex', '0' );
        card.setAttribute( 'role', 'article' );
      }

      // Touch: toggle active state on tap
      card.addEventListener( 'touchstart', () => {
        // Deactivate any other active cards first
        $$( '.service-card.is-active' ).forEach( c => {
          if ( c !== card ) c.classList.remove( 'is-active' );
        } );
        card.classList.toggle( 'is-active' );
      }, { passive: true } );

      // Keyboard: Enter / Space activates the card
      card.addEventListener( 'keydown', ( e ) => {
        if ( e.key === 'Enter' || e.key === ' ' ) {
          e.preventDefault();
          card.classList.toggle( 'is-active' );
        }
      } );
    } );

    // Deactivate on tap outside
    document.addEventListener( 'touchstart', ( e ) => {
      if ( ! e.target.closest( '.service-card' ) ) {
        $$( '.service-card.is-active' ).forEach( c => c.classList.remove( 'is-active' ) );
      }
    }, { passive: true } );
  }

  /* =====================================================================
     5. Autoplay Video Fallback
     =====================================================================
     Some browsers/contexts block autoplay. If the video element fails
     to play, add a CSS class so the poster image is shown cleanly.
     ===================================================================== */
  function initResultsVideo() {
    $$( '.section-results__video' ).forEach( video => {
      const playPromise = video.play();
      if ( playPromise !== undefined ) {
        playPromise.catch( () => {
          video.classList.add( 'autoplay-blocked' );
          // Show play button overlay
          const overlay = document.createElement( 'button' );
          overlay.className     = 'results-video-play-btn';
          overlay.setAttribute( 'aria-label', 'Play video' );
          overlay.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="48" height="48" fill="white"><circle cx="12" cy="12" r="11" fill="rgba(0,0,0,0.45)"/><polygon points="10,8 18,12 10,16" fill="white"/></svg>`;
          video.parentElement.style.position = 'relative';
          video.parentElement.appendChild( overlay );

          overlay.addEventListener( 'click', () => {
            video.play();
            overlay.remove();
          } );
        } );
      }
    } );
  }

  /* =====================================================================
     Kick everything off once the DOM is ready
     ===================================================================== */
  function init() {
    initStickyHeader();
    initMobileNav();
    initLogoCarousel();
    initServiceCards();
    initResultsVideo();
  }

  if ( document.readyState === 'loading' ) {
    document.addEventListener( 'DOMContentLoaded', init );
  } else {
    init();
  }

} )();
