/* ============================================================
   Yogesh T. — Portfolio interactions (no dependencies)
   ============================================================ */
(() => {
  "use strict";

  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const lerp = (a, b, t) => a + (b - a) * t;

  /* ----------------------------------------------------------
     Preloader — counts up while fonts/images settle, then wipes
     ---------------------------------------------------------- */
  const preloader = $("#preloader");
  const preCount = $("#preloaderCount");
  const preBar = $("#preloaderBar");
  const heroTitle = $("#heroTitle");

  document.body.classList.add("is-loading");

  function splitHeroTitle() {
    let i = 0;
    $$("[data-split]", heroTitle).forEach((word) => {
      const text = word.textContent;
      word.textContent = "";
      for (const ch of text) {
        const span = document.createElement("span");
        span.className = "hero__char";
        span.style.setProperty("--i", i++);
        span.textContent = ch;
        word.appendChild(span);
      }
    });
  }
  splitHeroTitle();

  function finishPreloader() {
    preloader.classList.add("is-done");
    document.body.classList.remove("is-loading");
    requestAnimationFrame(() => {
      heroTitle.classList.add("is-in");
      $$(".hero .reveal").forEach((el) => el.classList.add("is-visible"));
    });
    setTimeout(() => preloader.remove(), 1200);
  }

  if (reduceMotion) {
    finishPreloader();
  } else {
    let progress = 0;
    const start = performance.now();
    const minDuration = 1100;
    const ready = Promise.all([
      document.fonts ? document.fonts.ready : Promise.resolve(),
      new Promise((res) => (document.readyState === "complete" ? res() : window.addEventListener("load", res, { once: true }))),
    ]);
    let loaded = false;
    ready.then(() => (loaded = true));

    const tick = (now) => {
      const elapsed = now - start;
      const target = loaded ? 100 : Math.min(90, (elapsed / minDuration) * 90);
      progress = lerp(progress, target, 0.12);
      const shown = Math.round(progress);
      preCount.textContent = shown;
      preBar.style.width = shown + "%";
      if (loaded && progress > 99.4 && elapsed > minDuration) {
        preCount.textContent = "100";
        preBar.style.width = "100%";
        setTimeout(finishPreloader, 180);
        return;
      }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  /* ----------------------------------------------------------
     Custom cursor with hover states + magnetic buttons
     ---------------------------------------------------------- */
  if (finePointer && !reduceMotion) {
    const cursor = $("#cursor");
    const dot = $(".cursor__dot", cursor);
    const ring = $(".cursor__ring", cursor);
    const label = $(".cursor__label", cursor);
    document.body.classList.add("has-cursor");

    let mx = innerWidth / 2, my = innerHeight / 2;
    let rx = mx, ry = my;
    let visible = false;

    window.addEventListener("mousemove", (e) => {
      mx = e.clientX; my = e.clientY;
      if (!visible) { visible = true; cursor.classList.remove("is-hidden"); }
    }, { passive: true });
    document.addEventListener("mouseleave", () => cursor.classList.add("is-hidden"));
    document.addEventListener("mouseenter", () => cursor.classList.remove("is-hidden"));

    const loop = () => {
      dot.style.transform = `translate(${mx}px, ${my}px) translate(-50%, -50%)`;
      rx = lerp(rx, mx, 0.18); ry = lerp(ry, my, 0.18);
      ring.style.transform = `translate(${rx}px, ${ry}px) translate(-50%, -50%)`;
      requestAnimationFrame(loop);
    };
    loop();

    document.addEventListener("mouseover", (e) => {
      const t = e.target.closest("[data-cursor]");
      cursor.classList.toggle("is-hover", !!t && t.dataset.cursor === "hover");
      cursor.classList.toggle("is-view", !!t && t.dataset.cursor === "view");
      label.textContent = t && t.dataset.cursor === "view" ? "View" : "";
    });

    // Magnetic buttons
    $$(".magnetic").forEach((el) => {
      const strength = 0.35;
      el.addEventListener("mousemove", (e) => {
        const r = el.getBoundingClientRect();
        const x = e.clientX - (r.left + r.width / 2);
        const y = e.clientY - (r.top + r.height / 2);
        el.style.transform = `translate(${x * strength}px, ${y * strength}px)`;
      });
      el.addEventListener("mouseleave", () => {
        el.style.transition = "transform .6s cubic-bezier(0.16, 1, 0.3, 1)";
        el.style.transform = "";
        setTimeout(() => (el.style.transition = ""), 600);
      });
    });
  }

  /* ----------------------------------------------------------
     Ambient blobs parallax (mouse) + hero waves
     ---------------------------------------------------------- */
  if (finePointer && !reduceMotion) {
    const blobs = $$(".ambient__blob");
    let tx = 0, ty = 0, cx = 0, cy = 0;
    window.addEventListener("mousemove", (e) => {
      tx = (e.clientX / innerWidth - 0.5) * 2;
      ty = (e.clientY / innerHeight - 0.5) * 2;
    }, { passive: true });
    const step = () => {
      cx = lerp(cx, tx, 0.04); cy = lerp(cy, ty, 0.04);
      blobs.forEach((b) => {
        const d = parseFloat(b.dataset.depth || 0.05) * 600;
        b.style.translate = `${cx * d}px ${cy * d}px`;
      });
      requestAnimationFrame(step);
    };
    step();
  }

  /* ----------------------------------------------------------
     Nav: scrolled state, hide on scroll down, active link,
     mobile burger, scroll progress
     ---------------------------------------------------------- */
  const nav = $("#nav");
  const navLinks = $("#navLinks");
  const burger = $("#navBurger");
  const progressBar = $("#progressBar");
  const timelineFill = $("#timelineFill");
  const timeline = $(".timeline");
  let lastY = scrollY;

  const onScroll = () => {
    const y = scrollY;
    nav.classList.toggle("is-scrolled", y > 40);
    nav.classList.toggle("is-hidden", y > lastY && y > 300 && !navLinks.classList.contains("is-open"));
    lastY = y;

    const max = document.documentElement.scrollHeight - innerHeight;
    progressBar.style.width = (max > 0 ? (y / max) * 100 : 0) + "%";

    if (timeline) {
      const r = timeline.getBoundingClientRect();
      const pct = Math.min(1, Math.max(0, (innerHeight * 0.75 - r.top) / r.height));
      timelineFill.style.height = pct * 100 + "%";
    }
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  burger.addEventListener("click", () => {
    const open = navLinks.classList.toggle("is-open");
    nav.classList.remove("is-hidden");
    burger.setAttribute("aria-expanded", String(open));
    document.body.style.overflow = open ? "hidden" : "";
  });
  $$("a", navLinks).forEach((a) =>
    a.addEventListener("click", () => {
      navLinks.classList.remove("is-open");
      burger.setAttribute("aria-expanded", "false");
      document.body.style.overflow = "";
    })
  );

  // Active section highlighting
  const sections = $$("main section[id]");
  const linkFor = {};
  $$("a[href^='#']", navLinks).forEach((a) => (linkFor[a.getAttribute("href").slice(1)] = a));
  const sectionObs = new IntersectionObserver(
    (entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        $$("a", navLinks).forEach((a) => a.classList.remove("is-active"));
        const id = en.target.id === "education" ? "about" : en.target.id;
        linkFor[id]?.classList.add("is-active");
      });
    },
    { rootMargin: "-45% 0px -50% 0px" }
  );
  sections.forEach((s) => sectionObs.observe(s));

  /* ----------------------------------------------------------
     Reveal on scroll (with per-element delay)
     ---------------------------------------------------------- */
  const revealObs = new IntersectionObserver(
    (entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        const el = en.target;
        el.style.setProperty("--d", (el.dataset.delay || 0) + "ms");
        el.classList.add("is-visible");
        revealObs.unobserve(el);
      });
    },
    { threshold: 0.04, rootMargin: "0px 0px -6% 0px" }
  );
  $$(".reveal").forEach((el) => {
    if (el.closest(".hero")) return; // hero handled by preloader
    revealObs.observe(el);
  });

  /* ----------------------------------------------------------
     Counters
     ---------------------------------------------------------- */
  const countObs = new IntersectionObserver(
    (entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        const el = en.target;
        const end = parseFloat(el.dataset.count);
        const dur = 1400;
        const t0 = performance.now();
        const run = (now) => {
          const p = Math.min(1, (now - t0) / dur);
          const eased = 1 - Math.pow(1 - p, 3);
          el.textContent = Math.round(end * eased);
          if (p < 1) requestAnimationFrame(run);
        };
        reduceMotion ? (el.textContent = end) : requestAnimationFrame(run);
        countObs.unobserve(el);
      });
    },
    { threshold: 0.6 }
  );
  $$("[data-count]").forEach((el) => countObs.observe(el));

  /* ----------------------------------------------------------
     Hero tagline rotator
     ---------------------------------------------------------- */
  const items = $$(".rotate__item");
  if (items.length > 1 && !reduceMotion) {
    let idx = 0;
    setInterval(() => {
      const cur = items[idx];
      idx = (idx + 1) % items.length;
      cur.classList.remove("is-active");
      cur.classList.add("is-leaving");
      setTimeout(() => cur.classList.remove("is-leaving"), 600);
      items[idx].classList.add("is-active");
    }, 2600);
  }

  /* ----------------------------------------------------------
     3D tilt cards + spotlight position for hover glow
     ---------------------------------------------------------- */
  if (finePointer && !reduceMotion) {
    $$("[data-tilt]").forEach((card) => {
      const max = 8;
      card.addEventListener("mousemove", (e) => {
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width;
        const py = (e.clientY - r.top) / r.height;
        card.style.transform = `perspective(900px) rotateX(${(0.5 - py) * max}deg) rotateY(${(px - 0.5) * max}deg) translateZ(0)`;
        card.style.setProperty("--mx", px * 100 + "%");
        card.style.setProperty("--my", py * 100 + "%");
      });
      card.addEventListener("mouseleave", () => {
        card.style.transition = "transform .7s cubic-bezier(0.16, 1, 0.3, 1)";
        card.style.transform = "";
        setTimeout(() => (card.style.transition = ""), 700);
      });
    });

    $$(".principle, .exp, .skill").forEach((el) => {
      el.addEventListener("mousemove", (e) => {
        const r = el.getBoundingClientRect();
        el.style.setProperty("--mx", ((e.clientX - r.left) / r.width) * 100 + "%");
        el.style.setProperty("--my", ((e.clientY - r.top) / r.height) * 100 + "%");
      });
    });
  }

  /* ----------------------------------------------------------
     Marquee: duplicate track content for seamless loop
     ---------------------------------------------------------- */
  $$(".marquee__track, .footer__track").forEach((track) => {
    track.innerHTML += track.innerHTML;
    const n = track.children.length;
    track.style.setProperty("--speed", Math.max(20, n * 2.2) + "s");
  });

  /* ----------------------------------------------------------
     Project tabs — scroll to panel and highlight
     ---------------------------------------------------------- */
  const tabs = $$(".work__tab");
  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      tabs.forEach((t) => t.classList.remove("is-active"));
      tab.classList.add("is-active");
      const panel = $(`[data-project-panel="${tab.dataset.project}"]`);
      panel?.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
    });
  });
  const panelObs = new IntersectionObserver(
    (entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        tabs.forEach((t) => t.classList.toggle("is-active", t.dataset.project === en.target.dataset.projectPanel));
      });
    },
    { rootMargin: "-40% 0px -40% 0px" }
  );
  $$("[data-project-panel]").forEach((p) => panelObs.observe(p));

  /* ----------------------------------------------------------
     Lightbox for project screenshots
     ---------------------------------------------------------- */
  const lightbox = $("#lightbox");
  const lbImg = $("#lightboxImg");
  const lbCap = $("#lightboxCap");
  const openLightbox = (src, title) => {
    lbImg.src = src;
    lbImg.alt = title;
    lbCap.textContent = title;
    lightbox.classList.add("is-open");
    lightbox.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  };
  const closeLightbox = () => {
    lightbox.classList.remove("is-open");
    lightbox.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  };
  $$("[data-lightbox]").forEach((el) => {
    el.setAttribute("tabindex", "0");
    el.setAttribute("role", "button");
    el.setAttribute("aria-label", `Open ${el.dataset.lightboxTitle} screenshot`);
    el.addEventListener("click", () => openLightbox(el.dataset.lightbox, el.dataset.lightboxTitle));
    el.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openLightbox(el.dataset.lightbox, el.dataset.lightboxTitle); }
    });
  });
  $("#lightboxClose").addEventListener("click", closeLightbox);
  lightbox.addEventListener("click", (e) => { if (e.target === lightbox) closeLightbox(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && lightbox.classList.contains("is-open")) closeLightbox(); });

  /* ----------------------------------------------------------
     Copy email + toast
     ---------------------------------------------------------- */
  const toast = $("#toast");
  let toastTimer;
  const showToast = (msg) => {
    toast.textContent = msg;
    toast.classList.add("is-visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("is-visible"), 2200);
  };
  $("#copyEmail")?.addEventListener("click", async (e) => {
    const email = e.currentTarget.dataset.copy;
    try {
      await navigator.clipboard.writeText(email);
      showToast("Email copied to clipboard");
    } catch {
      showToast(email);
    }
  });

  /* ----------------------------------------------------------
     Footer: year + live IST clock
     ---------------------------------------------------------- */
  $("#year").textContent = new Date().getFullYear();
  const clock = $("#localTime");
  const fmt = new Intl.DateTimeFormat("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true, timeZone: "Asia/Kolkata" });
  const tickClock = () => (clock.textContent = fmt.format(new Date()));
  tickClock();
  setInterval(tickClock, 30000);
})();
