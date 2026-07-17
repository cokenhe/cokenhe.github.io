import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from "framer-motion";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import MagicPortalButton from "./components/MagicPortalButton.jsx";
import PortalTransition from "./components/PortalTransition.jsx";
import {
  getNextWorld,
  getPortalTiming,
  WORLD,
} from "./portal-state.mjs";

const contactLinks = [
  { label: "Experience", href: "#experience" },
  { label: "Stack", href: "#stack" },
  { label: "me@cokenhe.dev", href: "mailto:me@cokenhe.dev" },
  { label: "LinkedIn", href: "https://www.linkedin.com/in/cokenhe" },
  { label: "GitHub", href: "https://github.com/cokenhe" },
];

const metrics = [
  ["20", "childcare campuses supported"],
  ["4,000+", "parent users supported"],
  ["100+", "staff users supported"],
  ["<1s", "key API responses improved from about 10 seconds"],
];

const impactCards = [
  {
    title: "Operational platforms",
    body: "Built internal admin and customer-facing portals for childcare operations with React, Express.js, Supabase, Firebase, and Netlify.",
  },
  {
    title: "API gateway ownership",
    body: "Connected React portals, mobile applications, and FileMaker systems with authentication, retries, batching, logging, webhooks, and scheduled jobs.",
  },
  {
    title: "Production support",
    body: "Handled logs, root-cause investigation, hotfixes, rollbacks, deployment workflows, and release communication.",
  },
];

const experiences = [
  {
    role: "Full Stack Software Developer / Mobile Application Developer",
    company: "Lullaboo Childcare and Nursery Center",
    meta: "Oct 2024 - Present / Toronto",
    bullets: [
      "Built internal admin and customer-facing portals from the ground up using React, Express.js, Tailwind CSS, Netlify, Supabase, and Firebase for 20 childcare campuses, supporting 4,000+ parent users and 100+ staff users.",
      "Designed and implemented an Express.js API gateway between React portals, mobile applications, and FileMaker systems, handling authentication, JWT refresh, FileMaker token auto-renewal, request retries, request batching, concurrency control, logging, webhooks, scheduled jobs, and centralized error handling.",
      "Reduced key API response times from ~10 seconds to under 1 second by improving backend access patterns, batching requests, caching selected data, and mitigating FileMaker limitations around slow responses, expired tokens, failed syncs, and limited concurrent sessions.",
      "Designed PostgreSQL schemas, Firebase collections, indexes, and privacy-conscious permission models across Supabase and Firebase, enabling role-based access, auditability, traceability, secure file handling, and data separation across parents, staff, management, admins, campuses, and head office.",
      "Improved operational efficiency by reducing manual workflow effort by ~35%, saving 30+ minutes on selected administrative tasks, and improving support/task processing speed by ~42% through dashboards, searchable records, report generation, and workflow automation.",
      "Owned frontend architecture for React/TypeScript portals, including routing, reusable components, form systems, data tables, dashboards, responsive layouts, accessibility, pagination, lazy loading, debounced search, and error boundaries.",
      "Served as the primary technical owner for portal and backend development, gathering requirements from management, staff, and support teams, translating pain points into technical tickets, reviewing pull requests, assigning tasks, writing documentation, managing Netlify/GitHub Actions deployment workflows, and resolving production issues through log analysis, root-cause investigation, hotfixes, rollbacks, and release communication.",
    ],
  },
  {
    role: "Mobile Application Developer",
    company: "Boutir (Firework)",
    meta: "May 2021 - June 2023 / Hong Kong",
    bullets: [
      "Developed native iOS/Android and React Native features for merchant-facing SaaS, e-commerce, live commerce, and CMS workflows, integrating backend APIs and Firebase/database-backed product functionality.",
      "Spearheaded a React Native migration, resulting in a twofold acceleration in development pace and a notable reduction in QA workload.",
      "Implemented Appium for automated testing, optimizing the QA process and bolstering Continuous Integration/Continuous Deployment effectiveness.",
      "Integrated a live-streaming module into the application, boosting user engagement and supporting revenue growth.",
      "Improved API reliability by implementing automatic JWT token refresh, reducing authentication-related API failure rates from ~5% to ~1%.",
      "Optimized client-side caching and data loading, reducing duplicate API requests by ~40% and improving page load performance by ~800ms.",
    ],
  },
  {
    role: "Mobile Application Developer",
    company: "WonderKin Ltd.",
    meta: "Jul 2020 - Aug 2020 / Hong Kong",
    bullets: [
      "Developed a user-friendly Flutter mobile application that established seamless Bluetooth Low Energy connections with smart diapers.",
      "Built monitoring flows for diaper status, including chart-based views for diaper wetness, urine volume, and posture trends.",
      "Used Dart, Flutter, Firebase, Jira, App Store Connect, Google Play Store, GitHub, and Figma across delivery.",
    ],
  },
  {
    role: "Junior Programmer",
    company: "AppQuick.co",
    meta: "2018 - 2019 / Hong Kong",
    bullets: [
      "Built customized mobile applications for prominent corporations to optimize event organization and attendee engagement.",
      "Designed and implemented a user-friendly Content Management System that let clients update and manage app data in real time.",
      "Worked closely with corporate clients to tailor app functionality to event requirements using Swift, Kotlin, Firebase, AWS, Xcode, and Android Studio.",
    ],
  },
];

const stackGroups = [
  ["Frontend", "React, TypeScript, Tailwind CSS, TanStack Query, Zustand, React Hook Form, Zod, responsive UI"],
  ["Backend", "Node.js, Express.js, REST APIs, API gateways, authentication, authorization, JWT, webhooks"],
  ["Data and cloud", "Supabase, PostgreSQL, RLS, Firebase, Firestore, Realtime Database, Netlify Functions"],
  ["Delivery", "Git, GitHub Actions, CI/CD, Netlify deployments, preview deployments, rollbacks, Jira"],
];

const projectImages = [
  {
    src: "/assets/1-f96675d8.webp",
    alt: "Mobile operational dashboard screenshot",
  },
  {
    src: "/assets/1-c5138d7f.webp",
    alt: "Live commerce mobile product screenshot",
  },
  {
    src: "/assets/2-b5e6e141.webp",
    alt: "Caregiver mobile app analytics screenshot",
  },
];

const projects = [
  {
    title: "Boutir",
    image: "/assets/1-c5138d7f.webp",
    description: "Swift, Kotlin, TypeScript, React Native, Appium, and WebDriverIO",
    links: [
      ["iOS", "https://apps.apple.com/hk/app/id917526274?l=en"],
      ["Android", "https://play.google.com/store/apps/details?id=com.redso.boutir&hl=en_CA&gl=US&pli=1"],
    ],
    points: [
      "Spearheaded a React Native migration, resulting in a twofold acceleration in development pace and a notable reduction in QA workload.",
      "Implemented Appium for automated testing, optimizing QA and CI/CD effectiveness.",
      "Successfully facilitated the integration of native components between React Native.",
    ],
  },
  {
    title: "Wonderfam",
    image: "/assets/2-b5e6e141.webp",
    description: "Dart, Flutter, Firebase, and Jira",
    links: [
      ["iOS", "https://apps.apple.com/hk/app/id1493163920?l=en"],
      ["Android", "https://play.google.com/store/apps/details?id=com.anxinbao.anxinbaobaby&hl=en_CA&gl=US"],
    ],
    points: [
      "Created a user-friendly mobile application with Flutter to enable a seamless BLE connection with smart diapers.",
      "Engineered intuitive chart-based UI elements for diaper wetness data.",
    ],
  },
  {
    title: "HKIE GED",
    image: "/assets/2-5db7f57e.webp",
    description: "Swift, Kotlin, JavaScript, Angular, ExpressJS, Firebase, and AWS",
    links: [
      ["iOS", "https://apps.apple.com/hk/app/id1225551220?l=en"],
      ["Android", "https://play.google.com/store/apps/details?id=co.appquick.hkieged"],
    ],
    points: [
      "Crafted bespoke mobile applications for prominent enterprises, elevating event management and enriching attendee engagement.",
      "Devised and executed an intuitive CMS, enabling clients to oversee real-time app data updates.",
      "Worked closely with corporate partners to align app functionality with event requirements.",
    ],
  },
];

const fadeUp = {
  hidden: { opacity: 0, y: 26 },
  visible: { opacity: 1, y: 0 },
};

const stagger = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.08,
    },
  },
};

function revealProps(shouldReduceMotion, delay = 0) {
  if (shouldReduceMotion) return {};
  return {
    initial: "hidden",
    whileInView: "visible",
    viewport: { once: true, amount: 0.22 },
    variants: fadeUp,
    transition: { duration: 0.55, ease: "easeOut", delay },
  };
}

function Reveal({ children, as = "section", className, delay }) {
  const shouldReduceMotion = useReducedMotion();
  const Component = motion[as];
  return (
    <Component className={className} {...revealProps(shouldReduceMotion, delay)}>
      {children}
    </Component>
  );
}

function ClassicPortfolio({ portalControl }) {
  const shouldReduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll();
  const progressScale = shouldReduceMotion ? 0 : scrollYProgress;
  const heroImageY = useTransform(scrollYProgress, [0, 0.35], [0, -42]);
  const float = shouldReduceMotion
    ? {}
    : {
        animate: { y: [0, -12, 0], rotate: [-1, 1, -1] },
        transition: { duration: 6, repeat: Infinity, ease: "easeInOut" },
      };

  return (
    <>
      <motion.div
        className="scroll-progress"
        style={{ scaleX: progressScale }}
        aria-hidden="true"
      />
      <motion.header
        className="site-nav wrap"
        initial={shouldReduceMotion ? false : { opacity: 0, y: -16 }}
        animate={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <a className="brand" href="#top">
          Ken He
        </a>
        <nav aria-label="Contact and sections">
          {contactLinks.map((link) => (
            <motion.a key={link.href} href={link.href} whileHover={{ y: -2 }}>
              {link.label}
            </motion.a>
          ))}
          {portalControl}
        </nav>
      </motion.header>

      <main id="top">
        <section className="hero wrap" aria-labelledby="intro-title">
          <motion.div
            className="hero-copy"
            initial={shouldReduceMotion ? false : "hidden"}
            animate={shouldReduceMotion ? undefined : "visible"}
            variants={stagger}
          >
            <motion.p className="eyebrow" variants={fadeUp}>
              Markham / Toronto
            </motion.p>
            <motion.h1 id="intro-title" variants={fadeUp}>
              Full stack developer for operational SaaS.
            </motion.h1>
            <motion.p className="lede" variants={fadeUp}>
              I build production web, backend, cloud, and mobile systems with
              React, TypeScript, Node.js, Supabase, Firebase, and CI/CD. Recent
              work includes internal admin portals, customer-facing portals, API
              gateways, role-based data access, and production support.
            </motion.p>
            <motion.div className="actions" variants={fadeUp}>
              <motion.a
                className="button primary"
                href="mailto:me@cokenhe.dev"
                whileHover={{ y: -3 }}
                whileTap={{ scale: 0.98 }}
              >
                Contact Ken
              </motion.a>
            </motion.div>
          </motion.div>

          <motion.aside
            className="visual"
            aria-label="Project screenshots and career metrics"
            initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.96 }}
            animate={shouldReduceMotion ? undefined : { opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, ease: "easeOut", delay: 0.2 }}
          >
            <div className="image-stack">
              {projectImages.map((image, index) => (
                <motion.img
                  key={image.src}
                  src={image.src}
                  alt={image.alt}
                  loading={index === 0 ? "eager" : "lazy"}
                  className={`project-shot shot-${index + 1}`}
                  style={index === 1 && !shouldReduceMotion ? { y: heroImageY } : undefined}
                  {...(index === 0 ? float : {})}
                />
              ))}
            </div>
            <motion.div className="metric-card" variants={stagger}>
              <p>Current profile</p>
              <strong>5+ years</strong>
              <span>Full Stack Software Developer</span>
              <div className="metric-grid">
                {metrics.map(([value, label]) => (
                  <motion.div
                    className="metric"
                    key={label}
                    variants={fadeUp}
                    whileHover={{ y: -4 }}
                  >
                    <b>{value}</b>
                    <span>{label}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </motion.aside>
        </section>

        <Reveal className="section">
          <div className="wrap">
            <div className="section-head">
              <p className="section-kicker">Selected impact</p>
              <h2>Modern systems for teams that run on data.</h2>
            </div>
            <motion.div
              className="card-grid"
              initial={shouldReduceMotion ? false : "hidden"}
              whileInView={shouldReduceMotion ? undefined : "visible"}
              viewport={{ once: true, amount: 0.18 }}
              variants={stagger}
            >
              {impactCards.map((card) => (
                <motion.article
                  className="panel"
                  key={card.title}
                  variants={fadeUp}
                  whileHover={{ y: -6 }}
                >
                  <h3>{card.title}</h3>
                  <p>{card.body}</p>
                </motion.article>
              ))}
            </motion.div>
          </div>
        </Reveal>

        <Reveal className="section" as="section">
          <div className="wrap media-band">
            <div>
              <p className="section-kicker">Product surfaces</p>
              <h2>Mobile and web work with production constraints.</h2>
              <p className="section-copy">
                This keeps the older project information from the dev branch
                alongside the newer full-stack platform work.
              </p>
            </div>
            <motion.div
              className="gallery"
              initial={shouldReduceMotion ? false : "hidden"}
              whileInView={shouldReduceMotion ? undefined : "visible"}
              viewport={{ once: true, amount: 0.25 }}
              variants={stagger}
            >
              {projectImages.map((image) => (
                <motion.img
                  key={image.src}
                  src={image.src}
                  alt={image.alt}
                  loading="lazy"
                  variants={fadeUp}
                  whileHover={{ y: -8, scale: 1.02 }}
                />
              ))}
            </motion.div>
          </div>
        </Reveal>

        <section className="section" aria-labelledby="projects-title">
          <div className="wrap">
            <div className="section-head">
              <p className="section-kicker">From dev branch</p>
              <h2 id="projects-title">Earlier shipped projects</h2>
            </div>
            <div className="project-grid">
              {projects.map((project, index) => (
                <Reveal className="project-card" as="article" key={project.title} delay={index * 0.05}>
                  <motion.img
                    src={project.image}
                    alt={`${project.title} app screenshot`}
                    loading="lazy"
                    whileHover={{ scale: 1.03 }}
                  />
                  <div>
                    <h3>{project.title}</h3>
                    <p className="project-desc">{project.description}</p>
                    <ul>
                      {project.points.map((point) => (
                        <li key={point}>{point}</li>
                      ))}
                    </ul>
                    <div className="project-links">
                      {project.links.map(([label, href]) => (
                        <motion.a key={href} href={href} whileHover={{ y: -2 }}>
                          {label}
                        </motion.a>
                      ))}
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <section className="section" id="experience" aria-labelledby="experience-title">
          <div className="wrap">
            <div className="section-head">
              <p className="section-kicker">Experience</p>
              <h2 id="experience-title">Complete experience</h2>
            </div>
            <div className="timeline">
              {experiences.map((job, index) => (
                <Reveal className="role" as="article" key={job.company} delay={index * 0.05}>
                  <div className="role-head">
                    <p className="role-meta">{job.meta}</p>
                    <h3>{job.role}</h3>
                    <p className="role-company">{job.company}</p>
                  </div>
                  <ul>
                    {job.bullets.map((bullet) => (
                      <li key={bullet}>{bullet}</li>
                    ))}
                  </ul>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <Reveal className="section" as="section">
          <div className="wrap" id="stack">
            <div className="section-head">
              <p className="section-kicker">Stack</p>
              <h2>Tools I use in production</h2>
            </div>
            <div className="stack-grid">
              {stackGroups.map(([title, body]) => (
                <motion.article className="panel" key={title} whileHover={{ y: -4 }}>
                  <h3>{title}</h3>
                  <p>{body}</p>
                </motion.article>
              ))}
            </div>
          </div>
        </Reveal>

        <Reveal className="section" as="section">
          <div className="wrap education">
            <p className="section-kicker">Education</p>
            <div>
              <h2>Computer science foundation</h2>
              <p className="section-copy">
                Bachelor of Engineering in Computer Science, minor in Big Data
                Technology, The Hong Kong University of Science and Technology,
                Hong Kong, 2021.
              </p>
            </div>
          </div>
        </Reveal>
      </main>

      <footer className="footer">
        <div className="wrap">
          <p>
            Markham, ON, CA / <a href="mailto:me@cokenhe.dev">me@cokenhe.dev</a> /
            <a href="https://www.linkedin.com/in/cokenhe"> LinkedIn</a> /
            <a href="https://github.com/cokenhe"> GitHub</a>
          </p>
        </div>
      </footer>
    </>
  );
}

function App() {
  const shouldReduceMotion = Boolean(useReducedMotion());
  const [world, setWorld] = useState(WORLD.CLASSIC);
  const [destination, setDestination] = useState(WORLD.NOCTURNAL);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isNewWorldReady, setIsNewWorldReady] = useState(false);
  const classicScrollPosition = useRef(0);
  const classicPortalButton = useRef(null);
  const nocturnalPortalButton = useRef(null);
  const restoreAfterSwap = useRef(false);
  const scrollFrame = useRef(0);
  const timers = useRef([]);

  useLayoutEffect(() => {
    document.documentElement.dataset.portfolioWorld = world;
    document.body.classList.toggle("is-new-world", world === WORLD.NOCTURNAL);

    return () => {
      delete document.documentElement.dataset.portfolioWorld;
      document.body.classList.remove("is-new-world");
    };
  }, [world]);

  useLayoutEffect(() => {
    document.body.classList.toggle("is-crossing-portal", isTransitioning);
    return () => document.body.classList.remove("is-crossing-portal");
  }, [isTransitioning]);

  useLayoutEffect(() => {
    if (!restoreAfterSwap.current) return;
    restoreAfterSwap.current = false;

    const destinationButton = world === WORLD.NOCTURNAL
      ? nocturnalPortalButton.current
      : classicPortalButton.current;
    destinationButton?.focus({ preventScroll: true });

    window.cancelAnimationFrame(scrollFrame.current);
    scrollFrame.current = window.requestAnimationFrame(() => {
      window.scrollTo({
        top: world === WORLD.NOCTURNAL ? 0 : classicScrollPosition.current,
        behavior: "auto",
      });
    });
  }, [world]);

  useEffect(() => () => {
    timers.current.forEach((timer) => window.clearTimeout(timer));
    window.cancelAnimationFrame(scrollFrame.current);
  }, []);

  const crossPortal = () => {
    if (isTransitioning || (world === WORLD.CLASSIC && !isNewWorldReady)) return;

    const nextWorld = getNextWorld(world);
    const timing = getPortalTiming(shouldReduceMotion);

    if (world === WORLD.CLASSIC) {
      classicScrollPosition.current = window.scrollY;
    }

    setDestination(nextWorld);
    setIsTransitioning(true);

    const swapTimer = window.setTimeout(() => {
      restoreAfterSwap.current = true;
      setWorld(nextWorld);
      setIsTransitioning(false);
      timers.current = [];
    }, timing.swapMs);

    timers.current = [swapTimer];
  };

  const portalControl = (
    <MagicPortalButton
      busy={isTransitioning}
      buttonRef={classicPortalButton}
      destinationReady={isNewWorldReady}
      onActivate={crossPortal}
      variant="classic"
      world={world}
    />
  );

  return (
    <div className="portfolio-worlds" data-od-id="portfolio-worlds" data-world={world}>
      {world === WORLD.CLASSIC && (
        <div className="classic-world" data-od-id="classic-world">
          <ClassicPortfolio portalControl={portalControl} />
        </div>
      )}

      <iframe
        className={`new-world-frame${world === WORLD.NOCTURNAL ? " is-active" : ""}`}
        id="new-world-frame"
        src={`${import.meta.env.BASE_URL}new-world/index.html`}
        title="Ken He nocturnal portfolio"
        aria-hidden={world !== WORLD.NOCTURNAL}
        tabIndex={world === WORLD.NOCTURNAL ? 0 : -1}
        data-od-id="new-world-frame"
        data-ready={isNewWorldReady}
        onLoad={() => setIsNewWorldReady(true)}
      />

      {world === WORLD.NOCTURNAL && (
        <div className="portal-dock" data-od-id="nocturnal-portal-control">
          <MagicPortalButton
            busy={isTransitioning}
            buttonRef={nocturnalPortalButton}
            onActivate={crossPortal}
            variant="nocturnal"
            world={world}
          />
        </div>
      )}

      <PortalTransition
        active={isTransitioning}
        destination={destination}
        reducedMotion={shouldReduceMotion}
      />

      <p className="sr-only" aria-live="polite">
        {isTransitioning
          ? `Entering the ${destination} portfolio.`
          : `${world === WORLD.CLASSIC ? "Classic" : "Nocturnal"} portfolio active.`}
      </p>
    </div>
  );
}

export default App;
