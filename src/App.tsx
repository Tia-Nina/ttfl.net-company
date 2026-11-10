import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  ArrowDown,
  ArrowDownRight,
  ArrowUp,
  ArrowUpRight,
  Check,
  Code2,
  Copy,
  Github,
  Globe2,
  MapPin,
  Menu,
  Minus,
  Monitor,
  Moon,
  Pause,
  Play,
  Plus,
  Sun,
  X,
} from "lucide-react";
import { content, languageNames, type Language, type Theme } from "./content";
import {
  contactEmail,
  detectVisitorLanguage,
  languages,
  readPreference,
  resolveLanguage,
  resolveTheme,
  savePreference,
  themes,
} from "./preferences.mjs";
import Orbital from "./Orbital";
import Dropdown from "./Dropdown";
import LanguagePrompt from "./LanguagePrompt";

const sectionIds = ["services", "platforms", "about"];

function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <span className="brand-lockup">
      <svg
        className="brand-symbol"
        viewBox="0 0 36 36"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M5 4v27h12M19 4v16L31 4M19 20v11"
          stroke="currentColor"
          strokeWidth="5.5"
        />
      </svg>
      {!compact && (
        <span className="brand-name">
          LINYU<span>DIGITAL TECHNOLOGY</span>
        </span>
      )}
    </span>
  );
}

function SectionLabel({
  number,
  children,
}: {
  number: string;
  children: ReactNode;
}) {
  return (
    <p className="section-label">
      <span>{number}</span>
      {children}
    </p>
  );
}

export default function App() {
  const [language, setLanguage] = useState<Language>(() => {
    const saved = readPreference("linyu-language");
    return (
      languages.includes(saved ?? "")
        ? saved
        : resolveLanguage(navigator.languages)
    ) as Language;
  });
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = readPreference("linyu-theme");
    return themes.includes(saved ?? "") ? (saved as Theme) : "system";
  });
  const [systemDark, setSystemDark] = useState(
    () => matchMedia("(prefers-color-scheme: dark)").matches,
  );
  const [mobileMenu, setMobileMenu] = useState(false);
  const [activeService, setActiveService] = useState<number | null>(0);
  const [paused, setPaused] = useState(false);
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "failed">(
    "idle",
  );
  const [languagePrompt, setLanguagePrompt] = useState(false);
  const [recommendedLanguage, setRecommendedLanguage] =
    useState<Language | null>(null);
  const languageChosen = useRef(
    languages.includes(readPreference("linyu-language") ?? ""),
  );
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const copyAttempt = useRef(0);
  const t = content[language];
  const resolvedTheme = resolveTheme(theme, systemDark);
  const email = contactEmail(language);
  const ThemeIcon =
    theme === "system" ? Monitor : theme === "light" ? Sun : Moon;

  useEffect(() => {
    if (languageChosen.current) return;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2500);
    let cancelled = false;
    detectVisitorLanguage(navigator.languages, controller.signal).then(
      (result) => {
        clearTimeout(timeout);
        if (cancelled || languageChosen.current) return;
        const detected = result.language as Language;
        setLanguage(detected);
        setRecommendedLanguage(result.source === "ip" ? detected : null);
        setLanguagePrompt(true);
      },
    );
    return () => {
      cancelled = true;
      clearTimeout(timeout);
      controller.abort();
    };
  }, []);

  function chooseLanguage(value: Language) {
    languageChosen.current = true;
    setLanguage(value);
    savePreference("linyu-language", value);
    setLanguagePrompt(false);
  }

  useEffect(() => {
    const media = matchMedia("(prefers-color-scheme: dark)");
    const onChange = (event: MediaQueryListEvent) =>
      setSystemDark(event.matches);
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    document.documentElement.lang = language;
    document.title = t.title;
    document
      .querySelector('meta[name="description"]')
      ?.setAttribute("content", t.description);
    copyAttempt.current++;
    if (copyTimer.current) clearTimeout(copyTimer.current);
    setCopyStatus("idle");
  }, [language, t]);

  useEffect(() => {
    document.documentElement.dataset.theme = resolvedTheme;
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute(
        "content",
        resolvedTheme === "dark" ? "#171918" : "#f5f4ef",
      );
    savePreference("linyu-theme", theme);
  }, [theme, resolvedTheme]);

  useEffect(() => {
    const onEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobileMenu(false);
    };
    document.addEventListener("keydown", onEscape);
    return () => {
      document.removeEventListener("keydown", onEscape);
      if (copyTimer.current) clearTimeout(copyTimer.current);
    };
  }, []);

  async function copyEmail() {
    const attempt = ++copyAttempt.current;
    if (copyTimer.current) clearTimeout(copyTimer.current);
    try {
      await navigator.clipboard.writeText(email);
      if (attempt === copyAttempt.current) setCopyStatus("copied");
    } catch {
      if (attempt === copyAttempt.current) setCopyStatus("failed");
    }
    if (attempt === copyAttempt.current)
      copyTimer.current = setTimeout(() => setCopyStatus("idle"), 3500);
  }

  return (
    <>
      <a className="skip-link" href="#main">
        {t.skip}
      </a>
      <header className="site-header">
        <div className="shell header-inner">
          <a
            href="#"
            className="logo-link"
            aria-label={t.title}
            onClick={() => setMobileMenu(false)}
          >
            <Logo />
          </a>
          <nav className="desktop-nav" aria-label={t.menu}>
            {t.nav.map((label, index) => (
              <a key={sectionIds[index]} href={`#${sectionIds[index]}`}>
                {label}
              </a>
            ))}
          </nav>
          <div className="header-controls">
            <Dropdown<Language>
              className="language-control"
              label={t.language}
              value={language}
              options={(
                Object.entries(languageNames) as [Language, string][]
              ).map(([value, label]) => ({ value, label, lang: value }))}
              icon={<Globe2 size={16} aria-hidden="true" />}
              onChange={chooseLanguage}
            />
            <Dropdown<Theme>
              className="theme-control"
              label={t.theme}
              value={theme}
              options={(themes as Theme[]).map((value, index) => {
                const Icon = [Monitor, Sun, Moon][index];
                return {
                  value,
                  label: t.themes[index],
                  icon: <Icon size={16} aria-hidden="true" />,
                };
              })}
              icon={<ThemeIcon size={17} aria-hidden="true" />}
              onChange={setTheme}
            />
            <a href="#contact" className="header-contact">
              {t.contact}
              <ArrowUpRight size={15} />
            </a>
            <button
              className="mobile-menu-button icon-button"
              aria-label={t.menu}
              aria-expanded={mobileMenu}
              aria-controls="mobile-navigation"
              onClick={() => setMobileMenu(!mobileMenu)}
            >
              {mobileMenu ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
        {mobileMenu && (
          <nav
            id="mobile-navigation"
            className="mobile-nav shell"
            aria-label={t.menu}
          >
            {[...t.nav, t.contact].map((label, index) => (
              <a
                key={label}
                href={`#${sectionIds[index] ?? "contact"}`}
                onClick={() => setMobileMenu(false)}
              >
                {label}
                <ArrowUpRight size={18} />
              </a>
            ))}
          </nav>
        )}
      </header>

      {languagePrompt && (
        <LanguagePrompt
          language={language}
          recommended={recommendedLanguage}
          onChange={setLanguage}
          onConfirm={() => chooseLanguage(language)}
          onDismiss={() => setLanguagePrompt(false)}
        />
      )}

      <main id="main">
        <section className="hero" aria-labelledby="hero-title">
          <div className="hero-grid" aria-hidden="true" />
          <div className="shell hero-inner">
            <div className="hero-copy">
              <div className="eyebrow">
                <span className="accent-dot" />
                {t.location}
                <span className="eyebrow-line" />
                LINYU
              </div>
              <h1 id="hero-title">
                {t.hero[0]}
                <br />
                <span>{t.hero[1]}</span>
                <span className="hero-period" aria-hidden="true">
                  ↗
                </span>
              </h1>
              <p className="hero-intro">{t.intro}</p>
              <p className="hero-subtitle">{t.subtitle}</p>
              <a href="#services" className="button-primary">
                {t.explore}
                <ArrowDownRight size={19} />
              </a>
            </div>
            <div className="hero-art">
              <div className="orbital-halo" />
              <div className="art-cross cross-top" aria-hidden="true">
                +
              </div>
              <div className="art-cross cross-bottom" aria-hidden="true">
                +
              </div>
              <Orbital dark={resolvedTheme === "dark"} paused={paused} />
              <div className="orbital-caption" aria-hidden="true">
                <span className="caption-line" />
                LINYU — 001
              </div>
              <button
                className="animation-toggle icon-button"
                onClick={() => setPaused(!paused)}
                aria-label={paused ? t.playMotion : t.motion}
                title={paused ? t.playMotion : t.motion}
              >
                {paused ? <Play size={14} /> : <Pause size={14} />}
              </button>
            </div>
            <div className="hero-bottom">
              <a href="#services">
                <ArrowDown size={14} />
                {t.scroll}
              </a>
              <span className="hero-index">01 — 04</span>
            </div>
          </div>
        </section>

        <section
          id="services"
          className="section shell services-section"
          aria-labelledby="services-title"
        >
          <div className="services-heading">
            <SectionLabel number="01">{t.services}</SectionLabel>
            <h2 id="services-title">
              {t.servicesHeading[0]}
              <br />
              <span className="muted">{t.servicesHeading[1]}</span>
            </h2>
            <div className="service-art" aria-hidden="true">
              <div className="service-art-frame">
                <Code2 size={52} strokeWidth={1} />
                <span className="art-node node-one" />
                <span className="art-node node-two" />
                <span className="art-node node-three" />
              </div>
              <span className="service-art-label">&lt; / &gt;</span>
            </div>
          </div>
          <div className="service-list">
            {t.serviceItems.map((service, index) => (
              <div
                className={`service-item ${activeService === index ? "is-open" : ""}`}
                key={index}
              >
                <h3>
                  <button
                    onClick={() =>
                      setActiveService(activeService === index ? null : index)
                    }
                    aria-expanded={activeService === index}
                    aria-controls={`service-panel-${index}`}
                    id={`service-button-${index}`}
                  >
                    <span className="service-number">0{index + 1}</span>
                    <span>{service.title}</span>
                    {activeService === index ? (
                      <Minus size={20} />
                    ) : (
                      <Plus size={20} />
                    )}
                  </button>
                </h3>
                <div
                  id={`service-panel-${index}`}
                  role="region"
                  aria-labelledby={`service-button-${index}`}
                  hidden={activeService !== index}
                  className="service-detail"
                >
                  <p>{service.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section
          id="platforms"
          className="platforms-section"
          aria-labelledby="platforms-title"
        >
          <div className="shell section">
            <div className="section-topline">
              <SectionLabel number="02">{t.platforms}</SectionLabel>
              <ArrowDownRight size={28} strokeWidth={1.2} aria-hidden="true" />
            </div>
            <h2 id="platforms-title">{t.platformsHeading}</h2>
            <div className="platform-grid">
              <article className="platform-card platform-taptap">
                <div className="platform-visual">
                  <div className="tap-orbit orbit-one" />
                  <div className="tap-orbit orbit-two" />
                  <div className="tap-orbit orbit-three" />
                  <span className="taptap-mark" aria-hidden="true">
                    TapTap
                    <span className="tap-dot" />
                  </span>
                  <span className="visual-corner">01</span>
                </div>
                <div className="platform-info">
                  <p>{t.platformTypes[0]}</p>
                  <h3>
                    TapTap<span className="platform-status">{t.coming}</span>
                  </h3>
                </div>
                <div className="platform-placeholder">
                  <span className="status-dot" />
                  {t.reserved}
                  <span>—</span>
                </div>
              </article>
              <article className="platform-card platform-minecraft">
                <div className="platform-visual">
                  <div className="voxel-scene" aria-hidden="true">
                    <div className="voxel voxel-back" />
                    <div className="voxel voxel-main">
                      <span className="cube-top" />
                      <span className="cube-left" />
                      <span className="cube-right" />
                    </div>
                    <div className="voxel voxel-front" />
                  </div>
                  <span className="visual-corner">02</span>
                </div>
                <div className="platform-info">
                  <p>{t.platformTypes[1]}</p>
                  <h3>
                    {t.minecraft}
                    <span className="platform-status">{t.coming}</span>
                  </h3>
                </div>
                <div className="platform-placeholder">
                  <span className="status-dot" />
                  {t.reserved}
                  <span>—</span>
                </div>
              </article>
              <article className="platform-card platform-github">
                <div className="platform-visual">
                  <div className="code-grid" />
                  <div className="github-orbit" />
                  <Github
                    className="github-mark"
                    size={78}
                    strokeWidth={1.3}
                    aria-hidden="true"
                  />
                  <span className="code-decoration code-one" aria-hidden="true">
                    {"{ }"}
                  </span>
                  <span className="code-decoration code-two" aria-hidden="true">
                    {"</>"}
                  </span>
                  <span className="visual-corner">03</span>
                </div>
                <div className="platform-info">
                  <p>{t.platformTypes[2]}</p>
                  <h3>
                    GitHub<span className="platform-status">{t.coming}</span>
                  </h3>
                </div>
                <div className="platform-placeholder">
                  <span className="status-dot" />
                  {t.reserved}
                  <span>—</span>
                </div>
              </article>
            </div>
          </div>
        </section>

        <section
          id="about"
          className="section shell about-section"
          aria-labelledby="about-title"
        >
          <div className="about-left">
            <SectionLabel number="03">{t.about}</SectionLabel>
            <h2 id="about-title">
              {t.aboutHeading[0]}
              <br />
              <span className="muted">{t.aboutHeading[1]}</span>
            </h2>
            <div className="location-label">
              <MapPin size={15} />
              {t.location}
            </div>
          </div>
          <div className="about-right">
            <div className="about-emblem" aria-hidden="true">
              <Logo compact />
              <span className="emblem-orbit" />
              <span className="emblem-plus">+</span>
            </div>
            <p className="about-company">{t.company}</p>
            <p className="about-text">{t.aboutText}</p>
          </div>
        </section>

        <section
          id="contact"
          className="contact-section"
          aria-labelledby="contact-title"
        >
          <div className="shell section">
            <SectionLabel number="04">{t.contactLabel}</SectionLabel>
            <div className="contact-layout">
              <h2 id="contact-title">
                {t.contactHeading[0]}
                <br />
                <span>{t.contactHeading[1]}</span>
                <ArrowUpRight
                  className="contact-heading-arrow"
                  aria-hidden="true"
                />
              </h2>
              <div className="contact-people">
                <article className="person-card">
                  <div className="person-topline">
                    <h3>
                      Lin<span>{t.linRole}</span>
                    </h3>
                    <a
                      href={`mailto:${email}`}
                      className="person-email-action icon-button"
                      aria-label={`${t.emailAction} — Lin`}
                    >
                      <ArrowUpRight size={23} />
                    </a>
                  </div>
                  <div className="person-email">
                    <a href={`mailto:${email}`}>{email}</a>
                    <button
                      onClick={copyEmail}
                      className="icon-button copy-button"
                      aria-label={t.copy}
                      title={t.copy}
                    >
                      {copyStatus === "copied" ? (
                        <Check size={15} />
                      ) : (
                        <Copy size={15} />
                      )}
                    </button>
                  </div>
                </article>
                <article className="person-card yu-card">
                  <div className="person-topline">
                    <h3>
                      Yu<span>{t.yuRole}</span>
                    </h3>
                    <span className="person-empty" aria-hidden="true">
                      —
                    </span>
                  </div>
                  <p className="person-pending">{t.pending}</p>
                </article>
                <p
                  className={`copy-status ${copyStatus === "idle" ? "invisible" : ""}`}
                  role="status"
                  aria-live="polite"
                >
                  {copyStatus === "failed" ? t.copyFailed : t.copied}
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="site-footer shell">
        <div className="footer-top">
          <a href="#" aria-label={t.title}>
            <Logo />
          </a>
          <a href="#" className="back-top">
            {t.backTop}
            <ArrowUp size={16} />
          </a>
        </div>
        <div className="footer-wordmark" aria-hidden="true">
          LINYU<span>↗</span>
        </div>
        <div className="footer-bottom">
          <p>
            © {new Date().getFullYear()} LINYU. {t.rights}.
          </p>
          <p>{t.company}</p>
          <p>
            <span className="accent-dot" />
            {t.footerNote}
          </p>
        </div>
      </footer>
    </>
  );
}
