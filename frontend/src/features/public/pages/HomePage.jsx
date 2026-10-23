import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  ExternalLink,
  Github,
  Send,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { apiRequest } from '../../../common/utils/api.js';
import ProjectMedia from '../components/ProjectMedia.jsx';
import { SEOHead } from '../../../common/components/SEOHead.jsx';
import { SEO_CONFIG } from '../../../common/config/seo.config.js';
import { buildProfilePageSchema } from '../../../common/utils/seoHelper.js';

// Lazy-load Three.js hero effect so it never blocks initial page load
const HeroCanvas = React.lazy(() => import('../components/HeroCanvas.jsx'));

// Technical progression data (5 sequential steps from resume)
const technicalProgression = [
  {
    step: '01',
    category: 'Frontend',
    technologies: ['HTML5', 'CSS3', 'JavaScript', 'React.js', 'Tailwind CSS'],
    description: 'Build responsive, accessible user interfaces and reusable UI systems.'
  },
  {
    step: '02',
    category: 'UI/UX Design',
    technologies: ['Figma', 'Wireframing', 'Prototyping', 'Design Systems'],
    description: 'Design user flows, wireframes, and intuitive product architectures.'
  },
  {
    step: '03',
    category: 'Backend & APIs',
    technologies: ['Node.js', 'Express.js', 'REST APIs', 'Java Fundamentals'],
    description: 'Build server runtimes, RESTful services, and client-server communication.'
  },
  {
    step: '04',
    category: 'Data & State',
    technologies: ['MongoDB', 'MySQL', 'Context API', 'React Query'],
    description: 'Manage relational and document databases with robust client state.'
  },
  {
    step: '05',
    category: 'Tools & AI',
    technologies: ['Git & GitHub', 'Agile / JIRA', 'Webpack & npm', 'AI Engineering'],
    description: 'Accelerate engineering with version control, Scrum, and modern AI tools.'
  }
];

// Reusable Milestone Project Card Component
function MilestoneCard({ project, milestoneNum, isLeft, isMobile, delayIndex, isRevealed }) {
  const mediaUrl = project.preview_url || project.thumbnail_url || project.featured_image_url;

  return (
    <div
      className={`journey-milestone-item journey-reveal ${isRevealed ? 'is-revealed' : ''} delay-${Math.min(delayIndex || 1, 5)}`}
    >
      {/* Numbered Milestone Node & Connector */}
      <div className="journey-node" title={`Milestone ${milestoneNum}`}>
        {milestoneNum}
      </div>
      <div className="journey-connector" />

      {/* Milestone Project Card */}
      <article className="journey-card">
        {/* Minimal Metadata Row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0.7rem 1.15rem',
            borderBottom: '1px solid var(--border-subtle)',
            backgroundColor: 'var(--bg-tertiary)',
            fontSize: '0.75rem',
            fontFamily: 'var(--font-mono)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontWeight: 700, color: 'var(--accent-primary)' }}>
              {milestoneNum}
            </span>
            <span style={{ color: 'var(--text-muted)' }}>/</span>
            <span style={{ color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              {project.category || 'Featured Project'}
            </span>
          </div>

          {project.is_featured && (
            <span
              className="badge-mono"
              style={{
                backgroundColor: 'var(--accent-primary)',
                color: '#FFFFFF',
                border: 'none',
                fontSize: '0.68rem',
                padding: '0.1rem 0.45rem'
              }}
            >
              ★ Milestone
            </span>
          )}
        </div>

        {/* Media Preview (50% aspect ratio for sleek compact display) */}
        <div style={{ overflow: 'hidden', borderBottom: '1px solid var(--border-subtle)' }}>
          <ProjectMedia
            url={mediaUrl}
            type={project.preview_type}
            title={project.title}
            isWallpaper={false}
            aspectRatio="50%"
          />
        </div>

        {/* Card Details */}
        <div style={{ padding: '1.25rem' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.45rem', color: 'var(--text-primary)' }}>
            <Link to={`/projects/${project.slug || project.id}`} style={{ color: 'inherit' }}>
              {project.title}
            </Link>
          </h3>

          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.55, marginBottom: '1rem' }}>
            {project.short_summary || project.problem_statement?.slice(0, 130) || 'Engineered production application.'}
          </p>

          {/* Technology Badges */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginBottom: '1.15rem' }}>
            {Array.isArray(project.tech_stack)
              ? project.tech_stack.map((tech, idx) => (
                  <span key={idx} className="badge-mono">
                    {tech}
                  </span>
                ))
              : null}
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
            <Link
              to={`/projects/${project.slug || project.id}`}
              className="btn btn-primary btn-sm"
              style={{ gap: '0.4rem', fontFamily: 'var(--font-mono)' }}
            >
              Inspect Case Study <ArrowRight size={13} />
            </Link>

            {project.live_demo_url && (
              <a
                href={project.live_demo_url}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-secondary btn-sm"
                style={{ gap: '0.35rem' }}
              >
                Live Site <ExternalLink size={13} />
              </a>
            )}

            {project.github_url && (
              <a
                href={project.github_url}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-ghost btn-sm"
                aria-label="GitHub Repository"
                title="Repository"
              >
                <Github size={15} />
              </a>
            )}
          </div>
        </div>
      </article>
    </div>
  );
}

export function HomePage() {
  const [projects, setProjects] = useState([]);
  const [experience, setExperience] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(true);

  // Scroll reveal state
  const [revealedSections, setRevealedSections] = useState({
    projects: false,
    capabilities: false,
    experience: false
  });

  const projectsRef = useRef(null);
  const capabilitiesRef = useRef(null);
  const experienceRef = useRef(null);

  // Contact form state
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formSuccess, setFormSuccess] = useState(false);
  const [formError, setFormError] = useState('');

  const [canRenderHero3D, setCanRenderHero3D] = useState(false);

  // Check device capability and motion preference for 3D hero
  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth >= 640) {
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (!prefersReducedMotion) {
        setCanRenderHero3D(true);
      }
    }
  }, []);

  // Fetch projects and experience with single consolidated request
  useEffect(() => {
    async function loadData() {
      try {
        const [allRes, expRes] = await Promise.all([
          apiRequest('/public/projects').catch(() => []),
          apiRequest('/public/profile/experience').catch(() => [])
        ]);

        const allList = Array.isArray(allRes) ? allRes : [];
        const featuredList = allList.filter(p => Boolean(p.is_featured));

        // Max 3 featured projects
        if (featuredList.length > 0) {
          setProjects(featuredList.slice(0, 3));
        } else {
          setProjects(allList.slice(0, 3));
        }

        setExperience(Array.isArray(expRes) ? expRes.slice(0, 2) : []);
      } catch (err) {
        console.error('Failed to load homepage data:', err);
      } finally {
        setLoadingProjects(false);
      }
    }

    loadData();
  }, []);

  // IntersectionObserver for scroll-based entrance animation (fires once)
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const sectionName = entry.target.getAttribute('data-section');
            if (sectionName) {
              setRevealedSections((prev) => ({ ...prev, [sectionName]: true }));
              observer.unobserve(entry.target);
            }
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );

    if (projectsRef.current) observer.observe(projectsRef.current);
    if (capabilitiesRef.current) observer.observe(capabilitiesRef.current);
    if (experienceRef.current) observer.observe(experienceRef.current);

    return () => observer.disconnect();
  }, []);

  const handleContactSubmit = async (e) => {
    e.preventDefault();
    setFormSubmitting(true);
    setFormError('');
    setFormSuccess(false);

    try {
      await apiRequest('/public/contact', {
        method: 'POST',
        body: JSON.stringify(formData)
      });
      setFormSuccess(true);
      setFormData({ name: '', email: '', message: '' });
    } catch (err) {
      setFormError(err.message || 'Failed to dispatch message. Please email directly.');
    } finally {
      setFormSubmitting(false);
    }
  };

  return (
    <div className="home-page" style={{ position: 'relative' }}>
      <SEOHead
        title={`${SEO_CONFIG.personName} — Software Engineer | Frontend & MERN Stack Developer`}
        description={SEO_CONFIG.description}
        canonical={`${SEO_CONFIG.siteUrl}/`}
        structuredData={buildProfilePageSchema(`${SEO_CONFIG.siteUrl}/`, SEO_CONFIG.description)}
      />
      {/* ── 01. HERO (Lightweight, Minimal, Technical) ───────── */}
      <section
        style={{
          position: 'relative',
          minHeight: 'calc(85vh - 54px)',
          display: 'flex',
          alignItems: 'center',
          padding: '4.5rem 0 5.5rem 0',
          overflow: 'hidden'
        }}
      >
        {/* Holographic globe and neural canvas (lazy loaded, desktop only) */}
        {canRenderHero3D && (
          <React.Suspense fallback={null}>
            <HeroCanvas />
          </React.Suspense>
        )}

        <div className="container" style={{ position: 'relative', zIndex: 1, width: '100%' }}>
          <div style={{ maxWidth: '680px' }}>
            {/* Small Technical Label */}
            <div
              style={{
                fontSize: '0.82rem',
                fontWeight: 600,
                color: 'var(--accent-primary)',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                marginBottom: '1rem',
                fontFamily: 'var(--font-mono)'
              }}
            >
              Software Engineer
            </div>

            {/* Name */}
            <h1
              style={{
                fontSize: 'clamp(1rem, 6vw, 4.5rem)',
                fontWeight: 800,
                lineHeight: 1.05,
                letterSpacing: '-0.04em',
                color: 'var(--text-primary)',
                marginBottom: '1rem'
              }}
            >
              Pushkara Sai Vardhan Kagitha
            </h1>

            {/* Role */}
            <div
              style={{
                fontSize: 'clamp(1.15rem, 2.5vw, 1.45rem)',
                fontWeight: 500,
                color: 'var(--text-secondary)',
                letterSpacing: '-0.02em',
                marginBottom: '1.5rem'
              }}
            >
              Frontend & MERN Stack Developer | UI Developer
            </div>

            {/* Short professional description */}
            <p
              style={{
                fontSize: '1.05rem',
                lineHeight: 1.65,
                color: 'var(--text-secondary)',
                marginBottom: '2.5rem',
                maxWidth: '580px'
              }}
            >
              Enthusiastic Computer Science graduate with practical experience in building responsive user interfaces using HTML, CSS, JavaScript, React, and Figma. Passionate about creating intuitive, high-performance web experiences.
            </p>

            {/* Hero CTAs */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
              <Link to="/projects" className="btn btn-primary">
                Explore Projects <ArrowRight size={15} />
              </Link>
              <Link to="/about" className="btn btn-secondary">
                About Me
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── 02. PROJECTS — ENGINEERING JOURNEY ────────────────── */}
      <section
        ref={projectsRef}
        data-section="projects"
        className="section"
        style={{
          borderTop: '1px solid var(--border-subtle)',
          backgroundColor: 'var(--bg-secondary)',
          padding: '4.5rem 0'
        }}
      >
        <div className="container" style={{ maxWidth: '1140px' }}>
          {/* Section Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  color: 'var(--accent-primary)',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  fontFamily: 'var(--font-mono)',
                  marginBottom: '0.4rem'
                }}
              >
                <span className="pulse-dot" style={{ width: 6, height: 6 }} />
                <span>01 // Selected Work</span>
              </div>
              <h2 style={{ fontSize: 'clamp(1.75rem, 3.5vw, 2.3rem)', fontWeight: 700, letterSpacing: '-0.025em' }}>
                Engineering Journey
              </h2>
              <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', marginTop: '0.35rem' }}>
                Selected projects as milestones in the engineering journey.
              </p>
            </div>

            <Link
              to="/projects"
              style={{
                fontSize: '0.88rem',
                fontWeight: 600,
                color: 'var(--accent-primary)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                fontFamily: 'var(--font-mono)'
              }}
            >
              All Projects Archive ({projects.length}) <ArrowRight size={14} />
            </Link>
          </div>

          {/* Central Alternating Milestone Timeline */}
          <div className="journey-timeline-container">
            {loadingProjects ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
                {[1, 2].map((n) => (
                  <div key={n} className="journey-card" style={{ height: 320, padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div className="skeleton" style={{ height: 160, width: '100%' }} />
                    <div className="skeleton" style={{ height: 20, width: '55%' }} />
                    <div className="skeleton" style={{ height: 16, width: '90%' }} />
                  </div>
                ))}
              </div>
            ) : projects.length > 0 ? (
              <>
                {/* Desktop Dual-Track Alternating Presentation */}
                <div className="journey-dual-track">
                  <div className="journey-spine" />

                  {/* Left Column (Milestones 01, 03, 05...) */}
                  <div className="journey-col journey-col-left">
                    {projects.filter((_, i) => i % 2 === 0).map((project, colIdx) => {
                      const originalIndex = colIdx * 2;
                      const milestoneNum = String(originalIndex + 1).padStart(2, '0');
                      return (
                        <MilestoneCard
                          key={project.id || project.slug}
                          project={project}
                          milestoneNum={milestoneNum}
                          isLeft={true}
                          delayIndex={originalIndex + 1}
                          isRevealed={revealedSections.projects}
                        />
                      );
                    })}
                  </div>

                  {/* Right Column (Milestones 02, 04, 06...) - staggered down */}
                  <div className="journey-col journey-col-right">
                    {projects.filter((_, i) => i % 2 === 1).map((project, colIdx) => {
                      const originalIndex = colIdx * 2 + 1;
                      const milestoneNum = String(originalIndex + 1).padStart(2, '0');
                      return (
                        <MilestoneCard
                          key={project.id || project.slug}
                          project={project}
                          milestoneNum={milestoneNum}
                          isLeft={false}
                          delayIndex={originalIndex + 1}
                          isRevealed={revealedSections.projects}
                        />
                      );
                    })}
                  </div>
                </div>

                {/* Mobile Single-Track Sequential Presentation (<= 900px) */}
                <div className="journey-mobile-track">
                  <div className="journey-spine" />
                  {projects.map((project, index) => {
                    const milestoneNum = String(index + 1).padStart(2, '0');
                    return (
                      <MilestoneCard
                        key={project.id || project.slug}
                        project={project}
                        milestoneNum={milestoneNum}
                        isLeft={false}
                        isMobile={true}
                        delayIndex={index + 1}
                        isRevealed={revealedSections.projects}
                      />
                    );
                  })}
                </div>
              </>
            ) : (
              <div style={{ padding: '3rem 1rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                No active projects found. View the full project archive.
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── 03. TECHNICAL CAPABILITIES (5-Step Progression) ──── */}
      <section
        ref={capabilitiesRef}
        data-section="capabilities"
        className="section"
        style={{
          borderTop: '1px solid var(--border-subtle)',
          padding: '6rem 0'
        }}
      >
        <div className="container" style={{ maxWidth: '1140px' }}>
          {/* Section Header */}
          <div style={{ maxWidth: '680px', marginBottom: '3.5rem' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
                fontSize: '0.78rem',
                fontWeight: 600,
                color: 'var(--accent-primary)',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                fontFamily: 'var(--font-mono)',
                marginBottom: '0.4rem'
              }}
            >
              <span className="pulse-dot" style={{ width: 6, height: 6 }} />
              <span>02 // How I Build</span>
            </div>
            <h2 style={{ fontSize: 'clamp(1.75rem, 3.5vw, 2.3rem)', fontWeight: 700, letterSpacing: '-0.025em' }}>
              Technical Capabilities
            </h2>
            <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', marginTop: '0.35rem' }}>
              The technologies I use across the product engineering lifecycle.
            </p>
          </div>

          {/* 5-Step Horizontal Progression */}
          <div
            className={`capability-progression-wrapper ${
              revealedSections.capabilities ? 'is-revealed' : ''
            }`}
          >
            {/* Subtle horizontal connecting progress line */}
            <div className="capability-track-line" />

            <div className="capability-steps-grid">
              {technicalProgression.map((item, idx) => (
                <div
                  key={item.step}
                  className={`capability-step-card journey-reveal ${
                    revealedSections.capabilities ? 'is-revealed' : ''
                  } delay-${idx + 1}`}
                >
                  {/* Step Header with Node Dot & Number */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div className="capability-node-dot" />
                    <span
                      style={{
                        fontSize: '0.72rem',
                        color: 'var(--accent-primary)',
                        fontFamily: 'var(--font-mono)',
                        fontWeight: 700
                      }}
                    >
                      {item.step}
                    </span>
                  </div>

                  {/* Category Title */}
                  <div
                    style={{
                      fontSize: '0.88rem',
                      fontWeight: 700,
                      color: 'var(--text-primary)',
                      letterSpacing: '0.04em',
                      textTransform: 'uppercase'
                    }}
                  >
                    {item.category}
                  </div>

                  {/* Technology Badges */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', margin: '0.2rem 0' }}>
                    {item.technologies.map((tech) => (
                      <span
                        key={tech}
                        className="badge-mono"
                        style={{ fontSize: '0.72rem', padding: '0.12rem 0.4rem' }}
                      >
                        {tech}
                      </span>
                    ))}
                  </div>

                  {/* Description */}
                  <p
                    style={{
                      fontSize: '0.82rem',
                      color: 'var(--text-secondary)',
                      lineHeight: 1.5,
                      margin: 0,
                      marginTop: 'auto'
                    }}
                  >
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── 04. EXPERIENCE SECTION (Career Journey) ────────────── */}
      <section
        ref={experienceRef}
        data-section="experience"
        className="section"
        style={{
          borderTop: '1px solid var(--border-subtle)',
          backgroundColor: 'var(--bg-secondary)',
          padding: '6rem 0'
        }}
      >
        <div className="container" style={{ maxWidth: '980px' }}>
          {/* Section Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '3.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  color: 'var(--accent-primary)',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  fontFamily: 'var(--font-mono)',
                  marginBottom: '0.4rem'
                }}
              >
                <span className="pulse-dot" style={{ width: 6, height: 6 }} />
                <span>03 // Career Milestones</span>
              </div>
              <h2 style={{ fontSize: 'clamp(1.75rem, 3.5vw, 2.3rem)', fontWeight: 700, letterSpacing: '-0.025em' }}>
                Career Journey
              </h2>
              <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', marginTop: '0.35rem' }}>
                Professional engineering progression and academic foundation.
              </p>
            </div>

            <Link
              to="/about"
              style={{
                fontSize: '0.88rem',
                fontWeight: 600,
                color: 'var(--accent-primary)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                fontFamily: 'var(--font-mono)'
              }}
            >
              Full Profile & Education <ArrowRight size={14} />
            </Link>
          </div>

          {/* Clean Career Progression Timeline */}
          <div className="career-timeline-container">
            {/* Vertical Spine */}
            <div className="career-timeline-spine" />

            {/* Milestone 1: Professional Engineering Role (Current / Active) */}
            <div
              className={`career-milestone-card journey-reveal ${
                revealedSections.experience ? 'is-revealed' : ''
              } delay-1`}
              style={{ position: 'relative' }}
            >
              {/* Circular Timeline Node */}
              <div className="career-node" style={{ backgroundColor: 'var(--accent-primary)' }} />

              <div
                className="card"
                style={{
                  padding: '2rem',
                  backgroundColor: 'var(--bg-primary)',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--border-subtle)',
                  borderLeft: '3px solid var(--accent-primary)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.85rem' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                      <span className="badge-mono" style={{ backgroundColor: 'var(--accent-subtle)', color: 'var(--accent-primary)', fontWeight: 700 }}>
                        MARCH 2026 // PRESENT
                      </span>
                      <span style={{ fontSize: '0.78rem', color: 'var(--success)', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                        ● CURRENT MILESTONE
                      </span>
                    </div>
                    <h3 style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      Software Engineer
                    </h3>
                    <div style={{ color: 'var(--accent-primary)', fontWeight: 600, fontSize: '0.95rem', marginTop: '0.15rem' }}>
                      VCube Software Solutions · <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>Frontend Developer | MERN Stack Developer</span>
                    </div>
                  </div>
                  <span className="badge-mono">Hyderabad, IN</span>
                </div>

                <p style={{ fontSize: '0.92rem', color: 'var(--text-secondary)', lineHeight: 1.65, marginBottom: '1.5rem', maxWidth: '780px' }}>
                  Developing and maintaining responsive web applications using React.js, JavaScript, HTML5, CSS3, Tailwind CSS, Node.js, Express.js, and MongoDB. Built multiple production-ready applications including an Employee Management System, Book Market (E-Commerce), SHAI Bank, HRMS, and Student Job Portal.
                </p>

                {/* Engineering Highlights */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                  <div style={{ padding: '0.85rem 1rem', backgroundColor: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)', borderLeft: '2px solid var(--accent-primary)' }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--accent-primary)', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                      MILESTONE 01
                    </div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', marginTop: '0.2rem' }}>
                      Scalable UI Architecture
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                      Reusable React components, responsive layouts & optimized user experience
                    </div>
                  </div>

                  <div style={{ padding: '0.85rem 1rem', backgroundColor: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)', borderLeft: '2px solid var(--accent-primary)' }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--accent-primary)', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                      MILESTONE 02
                    </div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', marginTop: '0.2rem' }}>
                      APIs & MERN Integration
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                      REST APIs, dynamic client-server communication & Node/Express/MongoDB
                    </div>
                  </div>

                  <div style={{ padding: '0.85rem 1rem', backgroundColor: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)', borderLeft: '2px solid var(--accent-primary)' }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--accent-primary)', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                      MILESTONE 03
                    </div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', marginTop: '0.2rem' }}>
                      AI-Assisted Engineering
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                      ChatGPT, Claude, Gemini, Grok, Windsurf & Antigravity for rapid prototyping
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', paddingTop: '1rem', borderTop: '1px solid var(--border-subtle)' }}>
                  {['React.js', 'JavaScript (ES6+)', 'Tailwind CSS', 'Node.js', 'Express.js', 'MongoDB', 'REST APIs', 'Agile / JIRA', 'AI Tooling'].map((t) => (
                    <span key={t} className="badge-mono">{t}</span>
                  ))}
                </div>
              </div>
            </div>

            {/* Milestone 2: UI/UX Designer — Vastiverse Nexus */}
            <div
              className={`career-milestone-card journey-reveal ${
                revealedSections.experience ? 'is-revealed' : ''
              } delay-2`}
              style={{ position: 'relative' }}
            >
              {/* Circular Timeline Node */}
              <div className="career-node" style={{ backgroundColor: 'var(--accent-secondary)' }} />

              <div
                className="card"
                style={{
                  padding: '2rem',
                  backgroundColor: 'var(--bg-primary)',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--border-subtle)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.85rem' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                      <span className="badge-mono" style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}>
                        NOV 2024 – FEB 2025
                      </span>
                      <span style={{ fontSize: '0.78rem', color: 'var(--accent-secondary)', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                        ● LEAD DESIGNER
                      </span>
                    </div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      UI/UX Designer
                    </h3>
                    <div style={{ color: 'var(--accent-primary)', fontWeight: 600, fontSize: '0.95rem', marginTop: '0.15rem' }}>
                      Vastiverse Nexus · <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>Lead Designer | Remote</span>
                    </div>
                  </div>
                  <span className="badge-mono">Remote</span>
                </div>

                <p style={{ fontSize: '0.92rem', color: 'var(--text-secondary)', lineHeight: 1.65, marginBottom: '1.25rem', maxWidth: '780px' }}>
                  Worked as the lead UI/UX designer for Navapuja, creating the full website experience for pandit booking. Designed user flows, wireframes, and high-fidelity UI screens, developed a consistent design system in Figma, and coordinated with developers for smooth design implementation.
                </p>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-subtle)' }}>
                  {['Figma', 'UI/UX Design', 'Wireframing', 'Prototyping', 'Design Systems', 'Responsive & Accessible Layouts'].map((t) => (
                    <span key={t} className="badge-mono">{t}</span>
                  ))}
                </div>
              </div>
            </div>

            {/* Milestone 3: University / Foundation */}
            <div
              className={`career-milestone-card journey-reveal ${
                revealedSections.experience ? 'is-revealed' : ''
              } delay-3`}
              style={{ position: 'relative' }}
            >
              {/* Circular Timeline Node */}
              <div className="career-node" />

              <div
                className="card"
                style={{
                  padding: '2rem',
                  backgroundColor: 'var(--bg-primary)',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--border-subtle)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.65rem' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                      <span className="badge-mono" style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}>
                        NOV 2021 – MAY 2025
                      </span>
                      <span style={{ fontSize: '0.78rem', color: 'var(--accent-primary)', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                        ● CGPA: 7.72
                      </span>
                    </div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      B.Tech, Computer Science & Engineering
                    </h3>
                    <div style={{ color: 'var(--accent-primary)', fontWeight: 600, fontSize: '0.9rem', marginTop: '0.15rem' }}>
                      Usharama College of Engineering and Technology, Gannavaram
                    </div>
                  </div>
                  <span className="badge-mono">Graduated</span>
                </div>

                <p style={{ fontSize: '0.92rem', color: 'var(--text-secondary)', lineHeight: 1.65, marginBottom: '1.25rem', maxWidth: '780px' }}>
                  Completed core foundation in Computer Science & Engineering, including Data Structures, Algorithms, Relational Database Management Systems, and responsive web interface design.
                </p>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-subtle)' }}>
                  {['Computer Science', 'HTML/CSS/JavaScript', 'Java Fundamentals', 'Algorithms', 'RDBMS'].map((t) => (
                    <span key={t} className="badge-mono">{t}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 05. CONTACT (Direct & Simple) ────────────────────── */}
      <section
        className="section"
        style={{
          borderTop: '1px solid var(--border-subtle)',
          padding: '6rem 0'
        }}
      >
        <div className="container" style={{ maxWidth: '820px' }}>
          <div style={{ marginBottom: '3rem', textAlign: 'center' }}>
            <div
              style={{
                fontSize: '0.78rem',
                fontWeight: 600,
                color: 'var(--accent-primary)',
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                fontFamily: 'var(--font-mono)',
                marginBottom: '0.4rem'
              }}
            >
              04 // Get In Touch
            </div>
            <h2 style={{ fontSize: 'clamp(1.75rem, 3.5vw, 2.25rem)', fontWeight: 700, letterSpacing: '-0.025em', marginBottom: '0.75rem' }}>
              Direct Inquiries
            </h2>
            <p style={{ fontSize: '1rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              Looking for a frontend or MERN stack developer? Reach out directly or dispatch a note below.
            </p>
          </div>

          <div
            className="card"
            style={{
              padding: '2.5rem',
              backgroundColor: 'var(--bg-secondary)',
              borderRadius: 'var(--radius-lg)'
            }}
          >
            {formSuccess ? (
              <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
                <CheckCircle2 size={36} style={{ color: 'var(--success)', margin: '0 auto 0.75rem auto' }} />
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                  Message Sent
                </h3>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
                  Thank you — your message has been received and stored in the database.
                </p>
                <button onClick={() => setFormSuccess(false)} className="btn btn-secondary btn-sm">
                  Send another note
                </button>
              </div>
            ) : (
              <form onSubmit={handleContactSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {formError && (
                  <div
                    style={{
                      padding: '0.65rem 0.85rem',
                      backgroundColor: 'var(--danger-bg)',
                      color: 'var(--danger)',
                      fontSize: '0.85rem',
                      borderRadius: 'var(--radius-sm)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}
                  >
                    <AlertCircle size={15} />
                    <span>{formError}</span>
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
                  <div>
                    <label className="label" htmlFor="hp-name">YOUR NAME</label>
                    <input
                      id="hp-name"
                      type="text"
                      required
                      placeholder="e.g. Alex"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="label" htmlFor="hp-email">EMAIL ADDRESS</label>
                    <input
                      id="hp-email"
                      type="email"
                      required
                      placeholder="alex@company.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="input"
                    />
                  </div>
                </div>

                <div>
                  <label className="label" htmlFor="hp-message">MESSAGE</label>
                  <textarea
                    id="hp-message"
                    required
                    rows={4}
                    placeholder="Details about your opportunity or project..."
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="textarea"
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
                    <span>Email: <a href="mailto:kagithapushkara@gmail.com" style={{ color: 'var(--accent-primary)', textDecoration: 'underline' }}>kagithapushkara@gmail.com</a></span>
                    <span>•</span>
                    <span>Tel: <a href="tel:+917842770553" style={{ color: 'var(--accent-primary)', textDecoration: 'underline' }}>+91 7842770553</a></span>
                  </div>

                  <button
                    type="submit"
                    disabled={formSubmitting}
                    className="btn btn-primary"
                    style={{ opacity: formSubmitting ? 0.7 : 1 }}
                  >
                    {formSubmitting ? 'Sending...' : 'Send Message'} <Send size={14} />
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
export default HomePage;
