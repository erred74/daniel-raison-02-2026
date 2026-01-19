"use client";
import { useEffect, useRef } from "react";
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";
import Lenis from "lenis";
import Image from "next/image";
import LogoTitle from "@/components/LogoTitle";
import LatestWorks from "@/components/LatestWorks";
import styles from "./page.module.css";

export default function Home() {
  const heroRef = useRef<HTMLElement | null>(null);
  const videoWrapRef = useRef<HTMLDivElement | null>(null);
  const videoSlotRef = useRef<HTMLSpanElement | null>(null);
  const headlineRef = useRef<HTMLHeadingElement | null>(null);
  const titleInnerRef = useRef<HTMLSpanElement | null>(null);
  const portfolioRef = useRef<HTMLElement | null>(null);
  const marqueeRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // Prevent browser from restoring scroll position on refresh
    if ("scrollRestoration" in history) {
      history.scrollRestoration = "manual";
    }

    // Block scroll immediately and reset position
    document.documentElement.classList.add("no-scroll");
    window.scrollTo(0, 0);

    gsap.registerPlugin(ScrollTrigger);

    const lenis = new Lenis({
      duration: 1.1,
      smoothWheel: true,
    });

    function raf(time: number) {
      lenis.raf(time);
    }

    const ticker = (t: number) => raf(t * 1000);
    gsap.ticker.add(ticker);
    gsap.ticker.lagSmoothing(0);
    lenis.on("scroll", ScrollTrigger.update);

    // Stop scroll during intro
    lenis.stop();

    const ctx = gsap.context(() => {
      const cards = gsap.utils.toArray<HTMLDivElement>("[data-card]");
      const videoSlot = videoSlotRef.current!;
      const videoWrap = videoWrapRef.current!;
      const hero = heroRef.current!;
      const headline = headlineRef.current!;
      const titleInner = titleInnerRef.current!;
      const portfolio = portfolioRef.current!;
      let isVideoInSlot = false;

      // Dynamic measurements
      const vw = window.innerWidth;
      const vh = window.innerHeight;

      // Get headline font size to calculate slot dimensions dynamically
      const headlineFontSize = parseFloat(getComputedStyle(headline).fontSize);

      // Final video dimensions based on headline font size (aspect ratio 3:2)
      const slotH = headlineFontSize * 1.1; // Match CSS height: 1.1em
      const slotW = slotH * 1.5; // 3:2 aspect ratio

      // Calculate intermediate size (more vertical/portrait crop like the reference)
      const intermediateW = vw * 0.32;
      const intermediateH = vh * 0.85;

      // Clip-path values for intermediate state (centered)
      const clipTopIntermediate = ((vh - intermediateH) / 2 / vh) * 100;
      const clipSideIntermediate = ((vw - intermediateW) / 2 / vw) * 100;

      // Set initial states
      gsap.set(cards, {
        x: (i) => (i <= 1 ? "-35vw" : "35vw")
      });

      // Video starts small and centered (CSS handles initial size 600x400)
      gsap.set(videoWrap, {
        zIndex: 1,
      });

      // Function to setup scroll animations (called after intro completes)
      const setupScrollAnimations = () => {
        // Re-enable scroll and remove overflow lock
        document.documentElement.classList.remove("no-scroll");
        lenis.start();

        // Make cards visible now that intro is complete
        const imageRail = document.querySelector(`.${styles.imageRail}`) as HTMLElement;
        if (imageRail) {
          imageRail.style.visibility = "visible";
        }

        // PHASE 1: Hero pinned - video shrinks partially, cards enter
        const heroTl = gsap.timeline({
          scrollTrigger: {
            trigger: hero,
            start: "top top",
            end: `+=${vh * 0.8}`,
            pin: true,
            scrub: 0.5,
          },
        });

        // Video wrapper shrinks to intermediate size (clips both video and content)
        heroTl.to(videoWrap, {
          clipPath: `inset(${clipTopIntermediate}% ${clipSideIntermediate}% ${clipTopIntermediate}% ${clipSideIntermediate}% round 12px)`,
          ease: "none",
        }, 0);

        // Title fades out during phase 1
        heroTl.to(titleInner, {
          opacity: 0,
          ease: "none",
        }, 0);

        // Cards slide in
        heroTl.to(cards, {
          x: 0,
          ease: "none",
          stagger: 0.08,
        }, 0.15);

        // PHASE 2: Video shrinks to final size and moves to slot position
        ScrollTrigger.create({
          trigger: headline,
          start: "top bottom",
          end: "top 30%",
          scrub: 0.5,
          onUpdate: (self) => {
            if (isVideoInSlot) return;
            const p = self.progress;

            // Accelerate vertical clip (top/bottom close faster)
            const pVertical = Math.min(1, p * 1.4);

            // Current video size (interpolate from intermediate to final)
            const currentW = intermediateW + (slotW - intermediateW) * p;
            const currentH = intermediateH + (slotH - intermediateH) * pVertical;

            // Get current slot position (updates as slot expands and page scrolls)
            const slotRect = videoSlot.getBoundingClientRect();

            // Final position is center of the slot
            const finalX = slotRect.left + slotRect.width / 2;
            const finalY = slotRect.top + slotRect.height / 2;

            // Start position is center of viewport
            const startX = vw / 2;
            const startY = vh / 2;

            // Interpolate position from center to slot center
            const currentX = startX + (finalX - startX) * p;
            const currentY = startY + (finalY - startY) * p;

            // Convert to clip-path inset values
            const clipTop = (currentY - currentH / 2) / vh * 100;
            const clipBottom = (vh - (currentY + currentH / 2)) / vh * 100;
            const clipLeft = (currentX - currentW / 2) / vw * 100;
            const clipRight = (vw - (currentX + currentW / 2)) / vw * 100;

            gsap.set(videoWrap, {
              clipPath: `inset(${clipTop}% ${clipRight}% ${clipBottom}% ${clipLeft}% round 12px)`,
            });

            // Expand the slot width only - CSS flexbox gap handles text spacing automatically
            gsap.set(videoSlot, { width: slotW * p });
          },
          onLeaveBack: () => {
            if (isVideoInSlot) return;
            gsap.set(videoWrap, {
              clipPath: `inset(${clipTopIntermediate}% ${clipSideIntermediate}% ${clipTopIntermediate}% ${clipSideIntermediate}% round 12px)`,
            });
            gsap.set(videoSlot, { width: 0 });
          },
        });

        // Cards fade out smoothly (no movement, only opacity)
        ScrollTrigger.create({
          trigger: headline,
          start: "top bottom",
          end: "top 70%",
          scrub: 0.5,
          onUpdate: (self) => {
            const p = self.progress;
            cards.forEach((card) => {
              gsap.set(card, {
                opacity: 1 - p,
              });
            });
          },
          onLeaveBack: () => {
            cards.forEach((card) => {
              gsap.set(card, { opacity: 1 });
            });
          },
        });

        // When animation completes (headline top reaches 30%), snap video into slot
        ScrollTrigger.create({
          trigger: headline,
          start: "top 30%",
          onEnter: () => {
            if (isVideoInSlot) return;
            isVideoInSlot = true;

            // Move video into the slot DOM
            videoSlot.appendChild(videoWrap);

            // Position video inside slot
            gsap.set(videoWrap, {
              position: "absolute",
              top: 0,
              left: 0,
              width: slotW,
              height: slotH,
              xPercent: 0,
              yPercent: 0,
              zIndex: 1,
              borderRadius: "12px",
              overflow: "hidden",
              inset: "auto",
            });

            gsap.set(videoWrap, {
              clipPath: "inset(0% 0% 0% 0% round 0px)",
            });
          },
          onLeaveBack: () => {
            if (!isVideoInSlot) return;
            isVideoInSlot = false;

            // Get slot position before detaching
            const slotRect = videoSlot.getBoundingClientRect();
            const slotCenterX = slotRect.left + slotRect.width / 2;

            // Move video back to main
            document.querySelector("main")!.appendChild(videoWrap);

            // Restore to fullscreen with clip-path at slot position
            gsap.set(videoWrap, {
              position: "fixed",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              xPercent: 0,
              yPercent: 0,
              zIndex: 1,
              borderRadius: "0px",
              overflow: "hidden",
              inset: "auto",
            });

            // Calculate clip-path to show video at slot position
            const clipTop = (vh / 2 - slotH / 2) / vh * 100;
            const clipBottom = (vh / 2 - slotH / 2) / vh * 100;
            const clipLeft = (slotCenterX - slotW / 2) / vw * 100;
            const clipRight = (vw - slotCenterX - slotW / 2) / vw * 100;

            gsap.set(videoWrap, {
              clipPath: `inset(${clipTop}% ${clipRight}% ${clipBottom}% ${clipLeft}% round 12px)`,
            });
          },
        });

        // PORTFOLIO: Stacking images animation
        const portfolioImages = gsap.utils.toArray<HTMLDivElement>("[data-portfolio]");
        const img1 = portfolioImages[0];
        const img2 = portfolioImages[1];
        const img3 = portfolioImages[2];

        // Get inner images for parallax effect
        const img2Inner = img2.querySelector("img");
        const img3Inner = img3.querySelector("img");

        // Calculate container content width (excluding padding)
        const portfolioStack = portfolio.querySelector(`.${styles.portfolioStack}`) as HTMLElement;
        const stackStyles = getComputedStyle(portfolioStack);
        const stackPaddingLeft = parseFloat(stackStyles.paddingLeft);
        const stackPaddingRight = parseFloat(stackStyles.paddingRight);
        const containerContentWidth = portfolioStack.clientWidth - stackPaddingLeft - stackPaddingRight;

        const portfolioTl = gsap.timeline({
          scrollTrigger: {
            trigger: portfolio,
            start: "top top",
            end: `+=${vh * 2.5}`,
            pin: true,
            scrub: 0.5,
            pinSpacing: true,
          },
        });

        // Phase 1: First image expands from small to container width
        portfolioTl.to(img1, {
          width: containerContentWidth,
          height: vh,
          borderRadius: 0,
          ease: "none",
          duration: 1,
        });

        // Phase 2: Second image slides up with stronger parallax on inner image
        portfolioTl.to(img2, {
          y: 0,
          ease: "none",
          duration: 1,
        }, "+=0");

        // Stronger parallax: inner image moves significantly slower, ends at scale 1
        portfolioTl.to(img2Inner, {
          y: 0,
          scale: 1,
          ease: "none",
          duration: 1,
        }, "<");

        // Clip-path horizontal squeeze instead of scale
        portfolioTl.to(img1, {
          clipPath: "inset(0% 5% 0% 5%)",
          "--overlay-opacity": 0.6,
          ease: "none",
          duration: 1,
        }, "<");

        // Phase 3: Third image slides up with stronger parallax
        portfolioTl.to(img3, {
          y: 0,
          ease: "none",
          duration: 1,
        });

        // Stronger parallax: inner image moves significantly slower, ends at scale 1
        portfolioTl.to(img3Inner, {
          y: 0,
          scale: 1,
          ease: "none",
          duration: 1,
        }, "<");

        // Clip-path horizontal squeeze instead of scale
        portfolioTl.to(img2, {
          clipPath: "inset(0% 5% 0% 5%)",
          "--overlay-opacity": 0.6,
          ease: "none",
          duration: 1,
        }, "<");

        // MARQUEE: Infinite horizontal scroll
        const marquee = marqueeRef.current;
        if (marquee) {
          const marqueeItems = marquee.querySelectorAll(`.${styles.marqueeItem}`);
          if (marqueeItems.length > 0) {
            const firstItem = marqueeItems[0] as HTMLElement;
            const itemWidth = firstItem.offsetWidth;

            gsap.to(marquee, {
              x: -itemWidth,
              duration: 20,
              ease: "none",
              repeat: -1,
            });
          }
        }
      };

      // INTRO: Video expands from small to fullscreen, then SVG reveals
      const introTl = gsap.timeline({
        delay: 0.3,
        onComplete: () => {
          // After intro, convert to fullscreen fixed with clip-path for scroll animations
          gsap.set(videoWrap, {
            top: 0,
            left: 0,
            transform: "none",
            width: "100%",
            height: "100%",
            borderRadius: 0,
            clipPath: "inset(0% 0% 0% 0% round 0px)",
          });
          setupScrollAnimations();
        }
      });

      // Expand video from small (600x400) to fullscreen, rotation goes to 0
      introTl.to(videoWrap, {
        width: "100vw",
        height: "100vh",
        borderRadius: 0,
        rotation: 0,
        duration: 1.5,
        ease: "power2.inOut",
      });

      // SVG reveal starts after video is full viewport
      introTl.to(titleInner, {
        y: 0,
        duration: 1.2,
        ease: "power3.out",
      });
    });

    return () => {
      ScrollTrigger.killAll();
      ctx.revert();
      gsap.ticker.remove(ticker);
      lenis.destroy();
    };
  }, []);

  return (
    <main>
      {/* Video wrapper - lives in main so it can be truly fixed */}
      <div ref={videoWrapRef} className={styles.videoWrapper}>
        <video
          className={styles.video}
          src="/videos/sample.mp4"
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          aria-hidden="true"
        />
        <div className={`${styles.content}`}>
          <h1 className={styles.title}>
            <span className="sr-only">Designer & Developer</span>
            <span className={styles.titleReveal}>
              <span ref={titleInnerRef} className={styles.titleInner}>
                <LogoTitle fill="#ffffff" />
              </span>
            </span>
          </h1>
        </div>
      </div>

      <section ref={heroRef} className={styles.hero}>
        <div className={styles.imageRail}>
          <div data-card className={`${styles.card} ${styles.leftTop}`}>
            <Image src="/images/daniel.avif" alt="Paesaggio 1" fill sizes="(max-width: 600px) 44vw, 28vw" style={{ objectFit: "cover" }} />
          </div>
          <div data-card className={`${styles.card} ${styles.leftBottom}`}>
            <Image src="/images/Homepage_Image_2.jpg" alt="Paesaggio 2" fill sizes="(max-width: 600px) 44vw, 28vw" style={{ objectFit: "cover" }} />
          </div>
          <div data-card className={`${styles.card} ${styles.rightMid}`}>
            <Image src="/images/Homepage_Image_3.jpg" alt="Paesaggio 3" fill sizes="(max-width: 600px) 44vw, 28vw" style={{ objectFit: "cover" }} />
          </div>
          <div data-card className={`${styles.card} ${styles.rightBottom}`}>
            <Image src="/images/Homepage_Image_4.jpg" alt="Paesaggio 4" fill sizes="(max-width: 600px) 44vw, 28vw" style={{ objectFit: "cover" }} />
          </div>
        </div>
        
      </section>

      <section className={`${styles.next} container`}>
        <h2 ref={headlineRef} className={styles.headline}>
          <span className={styles.headlineRow}>
            <span className={styles.textBefore}>Together</span>
            <span ref={videoSlotRef} className={styles.videoSlot}></span>
            <span className={styles.textAfter}>, we</span>
          </span>
          <span className={styles.headlineRow}>
            inspire meaningful change and help others thrive.
          </span>
        </h2>
      </section>

      <section ref={portfolioRef} className={`${styles.portfolio}`}>
        <div className={styles.portfolioTitleWrapper}>
          <h2>
            <span className="sr-only">Latest works</span>
            <div ref={marqueeRef} className={styles.marquee}>
              <span className={styles.marqueeItem}><LatestWorks fill="var(--foreground)" /></span>
              <span className={styles.marqueeItem}><LatestWorks fill="var(--foreground)" /></span>
              <span className={styles.marqueeItem}><LatestWorks fill="var(--foreground)" /></span>
              <span className={styles.marqueeItem}><LatestWorks fill="var(--foreground)" /></span>
            </div>
          </h2>
        </div>
        <div className={styles.portfolioStack}>
          <div data-portfolio="1" className={styles.portfolioImageWrapper}>
            <Image src="/images/portfolio1.png" alt="Portfolio 1" fill sizes="100%" style={{ objectFit: "cover" }} />
          </div>
          <div data-portfolio="2" className={styles.portfolioImageWrapper}>
            <Image src="/images/portfolio2.png" alt="Portfolio 2" fill sizes="100%" style={{ objectFit: "cover" }} />
          </div>
          <div data-portfolio="3" className={styles.portfolioImageWrapper}>
            <Image src="/images/portfolio3.png" alt="Portfolio 3" fill sizes="100v%" style={{ objectFit: "cover" }} />
          </div>
        </div>
      </section>
    </main>
  );
}
