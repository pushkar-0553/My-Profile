import React, { useEffect, useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  ExternalLink,
  Github,
  Layers,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  Monitor,
  ImageIcon,
  Video,
  Figma,
  Sparkles,
  Code2,
  Share2,
  BookOpen,
  FileText,
  Clock,
  Check,
  Terminal,
  Cpu,
  Compass
} from 'lucide-react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { apiRequest } from '../../../common/utils/api.js';
import ProjectMedia from '../components/ProjectMedia.jsx';
import { SEOHead } from '../../../common/components/SEOHead.jsx';
import { SEO_CONFIG } from '../../../common/config/seo.config.js';
import { buildProjectSchema, buildBreadcrumbSchema } from '../../../common/utils/seoHelper.js';

// Configure marked with GitHub Flavored Markdown rules
marked.setOptions({
  gfm: true,
  breaks: true
});

function renderSafeMarkdown(content) {
  if (!content) return '';
  const rawHtml = marked.parse(content);
  return DOMPurify.sanitize(rawHtml, {
    USE_PROFILES: { html: true },
    ADD_ATTR: ['target', 'rel']
  });
}

/**
 * Helper to extract GitHub owner and repo name from a GitHub URL or string
 */
function parseGithubUrl(url) {
  if (!url) return null;
  const match = url.match(/github\.com\/([^/]+)\/([^/]+)/);
  if (match) {
    return {
      owner: match[1],
      repo: match[2].replace(/\.git$/, '')
    };
  }
  return null;
}

function slugify(text) {
  return (text || '')
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-');
}

function cleanHeading(title) {
  return (title || '')
    .replace(/^#+\s*/, '')
    .replace(/\[(.*?)\]\(.*?\)/g, '$1')
    .replace(/[`*_]/g, '')
    .trim();
}

/**
 * Extracts embedded images / diagrams from markdown
 */
function extractDiagramsFromMarkdown(content) {
  if (!content) return [];
  const diagrams = [];
  
  // 1. Markdown image syntax: ![caption](url)
  const imgRegex = /!\[(.*?)\]\((.*?)\)/g;
  let match;
  while ((match = imgRegex.exec(content)) !== null) {
    diagrams.push({
      caption: match[1] || 'Architecture Diagram',
      url: match[2]
    });
  }

  // 2. HTML <img> tags
  const htmlImgRegex = /<img[^>]+src=["']([^"']+)["'][^>]*alt=["']?([^"'>]*)["']?/gi;
  while ((match = htmlImgRegex.exec(content)) !== null) {
    diagrams.push({
      url: match[1],
      caption: match[2] || 'System Diagram'
    });
  }

  return diagrams;
}

/**
 * Classifies section intent and assigns visual theme
 */
function categorizeSection(title, content) {
  const lower = (title || '').toLowerCase();
  const diagrams = extractDiagramsFromMarkdown(content);
  const hasDiagram = diagrams.length > 0;

  if (
    lower.includes('architecture') ||
    lower.includes('system design') ||
    lower.includes('diagram') ||
    lower.includes('flowchart') ||
    lower.includes('workflow') ||
    hasDiagram
  ) {
    return {
      category: 'SYSTEM ARCHITECTURE',
      iconType: 'architecture',
      diagrams
    };
  }
  if (
    lower.includes('feature') ||
    lower.includes('capability') ||
    lower.includes('modules') ||
    lower.includes('functionality')
  ) {
    return {
      category: 'FEATURE MATRIX',
      iconType: 'features',
      diagrams
    };
  }
  if (
    lower.includes('stack') ||
    lower.includes('technolog') ||
    lower.includes('tools') ||
    lower.includes('dependenc') ||
    lower.includes('prerequisite')
  ) {
    return {
      category: 'TECH ECOSYSTEM',
      iconType: 'tech',
      diagrams
    };
  }
  if (
    lower.includes('install') ||
    lower.includes('setup') ||
    lower.includes('getting started') ||
    lower.includes('quick start') ||
    lower.includes('run') ||
    lower.includes('usage') ||
    lower.includes('build')
  ) {
    return {
      category: 'SETUP & EXECUTION',
      iconType: 'setup',
      diagrams
    };
  }
  if (
    lower.includes('problem') ||
    lower.includes('challenge') ||
    lower.includes('motivation') ||
    lower.includes('pain point')
  ) {
    return {
      category: 'ENGINEERING CHALLENGE',
      iconType: 'problem',
      diagrams
    };
  }
  if (
    lower.includes('solution') ||
    lower.includes('implementation') ||
    lower.includes('approach')
  ) {
    return {
      category: 'TECHNICAL SOLUTION',
      iconType: 'solution',
      diagrams
    };
  }
  if (
    lower.includes('result') ||
    lower.includes('metric') ||
    lower.includes('benchmark') ||
    lower.includes('impact') ||
    lower.includes('performance')
  ) {
    return {
      category: 'PERFORMANCE & IMPACT',
      iconType: 'metrics',
      diagrams
    };
  }
  if (
    lower.includes('api') ||
    lower.includes('endpoint') ||
    lower.includes('route') ||
    lower.includes('schema')
  ) {
    return {
      category: 'API & DATA CONTRACTS',
      iconType: 'api',
      diagrams
    };
  }

  return {
    category: 'TECHNICAL ANALYSIS',
    iconType: 'default',
    diagrams
  };
}

/**
 * Checks if a specific section is permitted to render based on admin display_settings checkboxes
 */
function isSectionAllowed(title, category, iconType, ds) {
  if (!ds) return true;
  const lower = (title || '').toLowerCase();

  // If user turned off Full Markdown / Executive Overview
  if (ds.show_full_content === false) {
    if (
      category === 'EXECUTIVE OVERVIEW' ||
      iconType === 'overview' ||
      lower.includes('overview') ||
      lower.includes('about the project') ||
      lower.includes('introduction')
    ) {
      return false;
    }
  }

  // Problems / Pain Points
  if (ds.show_problem === false) {
    if (
      category === 'ENGINEERING CHALLENGE' ||
      iconType === 'problem' ||
      lower.includes('problem') ||
      lower.includes('motivation') ||
      lower.includes('pain point')
    ) {
      return false;
    }
  }

  // Technical Challenges
  if (ds.show_challenges === false) {
    if (
      lower.includes('challenge') ||
      lower.includes('trade-off') ||
      lower.includes('bottleneck')
    ) {
      return false;
    }
  }

  // Solutions / Implementation
  if (ds.show_solution === false) {
    if (
      category === 'TECHNICAL SOLUTION' ||
      iconType === 'solution' ||
      lower.includes('solution') ||
      lower.includes('approach') ||
      lower.includes('implementation')
    ) {
      return false;
    }
  }

  // System Architecture
  if (ds.show_architecture === false) {
    if (
      category === 'SYSTEM ARCHITECTURE' ||
      iconType === 'architecture' ||
      lower.includes('architecture') ||
      lower.includes('system design') ||
      lower.includes('workflow')
    ) {
      return false;
    }
  }

  // Performance Benchmarks & Metrics
  if (ds.show_results_metrics === false) {
    if (
      category === 'PERFORMANCE & IMPACT' ||
      iconType === 'metrics' ||
      lower.includes('metric') ||
      lower.includes('result') ||
      lower.includes('benchmark') ||
      lower.includes('impact')
    ) {
      return false;
    }
  }

  // Lessons Learned & Retrospective
  if (ds.show_lessons_learned === false) {
    if (
      category === 'ENGINEERING RETROSPECTIVE' ||
      lower.includes('lesson') ||
      lower.includes('learning') ||
      lower.includes('retrospective')
    ) {
      return false;
    }
  }

  return true;
}

/**
 * Parses README text into discrete semantic modules,
 * strictly filtered by admin display_settings checkboxes and
 * augmenting with database architecture fields when permitted.
 */
function buildProjectSections(readmeText, project) {
  if (!project) return [];
  const sections = [];
  const ds = project.display_settings || {};
  const readmeMode = ds.readme_source || 'github';

  // Only parse markdown sections if README display is not disabled AND full_content is allowed
  if (readmeMode !== 'none' && ds.show_full_content !== false) {
    const text = (readmeText || '').replace(/\r\n/g, '\n').trim();

    if (text.length > 25) {
      const lines = text.split('\n');
      let currentTitle = 'Executive Overview';
      let currentLines = [];

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const match = line.match(/^#{1,3}\s+(.+)$/);

        if (match) {
          if (currentLines.length > 0 && currentLines.join('\n').trim().length > 0) {
            const rawContent = currentLines.join('\n').trim();
            const cat = categorizeSection(currentTitle, rawContent);
            if (isSectionAllowed(currentTitle, cat.category, cat.iconType, ds)) {
              sections.push({
                id: slugify(currentTitle) || `sec-${sections.length + 1}`,
                title: cleanHeading(currentTitle),
                content: rawContent,
                ...cat
              });
            }
            currentLines = [];
          }
          currentTitle = match[1].trim();
        } else {
          currentLines.push(line);
        }
      }

      if (currentLines.length > 0 && currentLines.join('\n').trim().length > 0) {
        const rawContent = currentLines.join('\n').trim();
        const cat = categorizeSection(currentTitle, rawContent);
        if (isSectionAllowed(currentTitle, cat.category, cat.iconType, ds)) {
          sections.push({
            id: slugify(currentTitle) || `sec-${sections.length + 1}`,
            title: cleanHeading(currentTitle),
            content: rawContent,
            ...cat
          });
        }
      }
    }
  }

  // Fallback initial section if none parsed and executive overview is permitted
  if (sections.length === 0 && ds.show_full_content !== false) {
    if (project.full_content || project.short_summary) {
      sections.push({
        id: 'overview',
        title: 'Project Overview & Scope',
        category: 'EXECUTIVE OVERVIEW',
        iconType: 'overview',
        content: project.full_content || project.short_summary,
        diagrams: []
      });
    }
  }

  // Check titles to avoid duplicate sections from DB fields
  const allTitles = sections.map((s) => s.title.toLowerCase()).join(' ');

  if (ds.show_problem !== false && project.problem && !allTitles.includes('problem') && !allTitles.includes('challenge')) {
    sections.push({
      id: 'problem-statement',
      title: 'Problem Statement & Requirements',
      category: 'ENGINEERING CHALLENGE',
      iconType: 'problem',
      content: project.problem,
      diagrams: []
    });
  }

  if (ds.show_solution !== false && project.solution && !allTitles.includes('solution') && !allTitles.includes('implementation')) {
    sections.push({
      id: 'technical-solution',
      title: 'Architectural Solution',
      category: 'TECHNICAL SOLUTION',
      iconType: 'solution',
      content: project.solution,
      diagrams: []
    });
  }

  if (ds.show_architecture !== false && project.architecture_details && !allTitles.includes('architecture') && !allTitles.includes('system design')) {
    sections.push({
      id: 'system-architecture',
      title: 'System Architecture & Data Pipeline',
      category: 'SYSTEM ARCHITECTURE',
      iconType: 'architecture',
      content: project.architecture_details,
      diagrams: []
    });
  }

  if (ds.show_challenges !== false && project.challenges && !allTitles.includes('challenge')) {
    sections.push({
      id: 'engineering-challenges',
      title: 'Technical Challenges & Trade-offs',
      category: 'ENGINEERING CHALLENGE',
      iconType: 'problem',
      content: project.challenges,
      diagrams: []
    });
  }

  if (ds.show_results_metrics !== false && project.results_metrics && !allTitles.includes('result') && !allTitles.includes('metric') && !allTitles.includes('benchmark')) {
    sections.push({
      id: 'benchmarks-results',
      title: 'Performance Benchmarks & Metrics',
      category: 'PERFORMANCE & IMPACT',
      iconType: 'metrics',
      content: project.results_metrics,
      diagrams: []
    });
  }

  if (ds.show_lessons_learned !== false && project.lessons_learned && !allTitles.includes('lesson')) {
    sections.push({
      id: 'engineering-insights',
      title: 'Key Learnings & Retrospective',
      category: 'ENGINEERING RETROSPECTIVE',
      iconType: 'default',
      content: project.lessons_learned,
      diagrams: []
    });
  }

  return sections;
}

export function ProjectDetailPage() {
  const { slug } = useParams();
  const [project, setProject] = useState(null);
  const [allProjects, setAllProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Theater player mode: 'video' | 'live' | 'screenshot'
  const [theaterMode, setTheaterMode] = useState('video');
  const [copiedLink, setCopiedLink] = useState(false);

  // GitHub README state
  const [readmeContent, setReadmeContent] = useState('');
  const [loadingReadme, setLoadingReadme] = useState(false);
  const [readmeSource, setReadmeSource] = useState('local'); // 'github' | 'local'

  // Active section filter or scroll anchor
  const [activeSectionId, setActiveSectionId] = useState('all');

  useEffect(() => {
    async function loadProjectData() {
      setLoading(true);
      setError('');
      setReadmeContent('');
      setReadmeSource('local');
      setActiveSectionId('all');

      try {
        const [projectData, projectsList] = await Promise.all([
          apiRequest(`/public/projects/${slug}`),
          apiRequest('/public/projects').catch(() => [])
        ]);

        setProject(projectData);
        setAllProjects(Array.isArray(projectsList) ? projectsList : []);

        // Choose initial theater mode: prefer video/media preview
        if (projectData.preview_url || projectData.preview_type === 'video') {
          setTheaterMode('video');
        } else if (projectData.live_demo_url) {
          setTheaterMode('live');
        } else {
          setTheaterMode('screenshot');
        }

        // Check display_settings for README mode
        const ds = projectData.display_settings || {};
        const readmeMode = ds.readme_source || 'github';

        if (readmeMode === 'none' || ds.show_full_content === false) {
          // Admin disabled README display or unchecked Full Markdown display
          setReadmeContent('');
          setReadmeSource('none');
          setLoadingReadme(false);
        } else if (readmeMode === 'custom') {
          // Admin chose custom markdown narrative
          setReadmeContent(projectData.full_content || '');
          setReadmeSource('custom');
        } else {
          // Fetch GitHub README if repo URL is available
          const gh = parseGithubUrl(projectData.github_repo_url || projectData.github_repo_name);
          if (gh) {
            setLoadingReadme(true);
            try {
              // Attempt 1: fetch from raw GitHub main branch
              let res = await fetch(`https://raw.githubusercontent.com/${gh.owner}/${gh.repo}/main/README.md`);
              if (!res.ok) {
                // Attempt 2: fallback to master branch
                res = await fetch(`https://raw.githubusercontent.com/${gh.owner}/${gh.repo}/master/README.md`);
              }

              if (res.ok) {
                const text = await res.text();
                if (text && text.trim().length > 20) {
                  setReadmeContent(text);
                  setReadmeSource('github');
                } else {
                  setReadmeContent(projectData.full_content || projectData.short_summary || '');
                  setReadmeSource('local');
                }
              } else {
                setReadmeContent(projectData.full_content || projectData.short_summary || '');
                setReadmeSource('local');
              }
            } catch (err) {
              console.warn('Could not fetch live GitHub README:', err);
              setReadmeContent(projectData.full_content || projectData.short_summary || '');
              setReadmeSource('local');
            } finally {
              setLoadingReadme(false);
            }
          } else {
            setReadmeContent(projectData.full_content || projectData.short_summary || '');
            setReadmeSource('local');
          }
        }
      } catch (err) {
        setError('Case study not found or currently unavailable.');
      } finally {
        setLoading(false);
      }
    }

    loadProjectData();
    window.scrollTo(0, 0);
  }, [slug]);

  // Build semantic sections based on README + DB architecture fields
  const docSections = useMemo(() => {
    return buildProjectSections(readmeContent, project);
  }, [readmeContent, project]);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const scrollToSection = (id) => {
    setActiveSectionId(id);
    if (id === 'all') {
      window.scrollTo({ top: 380, behavior: 'smooth' });
      return;
    }
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  if (loading) {
    return (
      <div className="section" style={{ minHeight: '65vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="pulse-dot" style={{ width: 12, height: 12, margin: '0 auto 1rem auto' }} />
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', fontFamily: 'var(--font-mono)' }}>
            Loading project case study & architecture...
          </p>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="theater-page-container" style={{ minHeight: '65vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
        <h2 style={{ fontSize: '1.75rem', marginBottom: '0.75rem', color: 'var(--text-primary)' }}>
          Case Study Unavailable
        </h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', maxWidth: '420px', fontSize: '0.92rem' }}>
          {error || 'This project record does not exist or has not been published.'}
        </p>
        <Link to="/projects" className="btn btn-primary">
          <ArrowLeft size={15} /> Return to Projects
        </Link>
      </div>
    );
  }

  const mediaUrl = project.preview_url || project.featured_image_url || project.thumbnail_url;
  const githubInfo = parseGithubUrl(project.github_repo_url || project.github_repo_name);

  // Other projects for the "More in Engineering Journey" sidebar
  const recommendedProjects = allProjects
    .filter((p) => String(p.id) !== String(project.id) && p.slug !== project.slug)
    .slice(0, 4);

  // Render Section Icon
  const getSectionIcon = (iconType) => {
    switch (iconType) {
      case 'architecture':
        return <Layers size={18} color="var(--accent-primary)" />;
      case 'features':
        return <Sparkles size={18} color="var(--accent-primary)" />;
      case 'tech':
        return <Code2 size={18} color="var(--accent-primary)" />;
      case 'setup':
        return <Terminal size={18} color="var(--accent-primary)" />;
      case 'problem':
        return <AlertTriangle size={18} color="var(--accent-primary)" />;
      case 'solution':
        return <CheckCircle2 size={18} color="var(--success)" />;
      case 'metrics':
        return <Clock size={18} color="var(--accent-primary)" />;
      case 'api':
        return <Cpu size={18} color="var(--accent-primary)" />;
      default:
        return <BookOpen size={18} color="var(--accent-primary)" />;
    }
  };

  const canonicalUrl = `${SEO_CONFIG.siteUrl}/projects/${project?.slug || slug}`;
  const projectSchema = buildProjectSchema(project, canonicalUrl);
  const breadcrumbsSchema = buildBreadcrumbSchema([
    { name: 'Home', url: `${SEO_CONFIG.siteUrl}/` },
    { name: 'Projects', url: `${SEO_CONFIG.siteUrl}/projects` },
    { name: project?.title || 'Case Study', url: canonicalUrl }
  ]);
  const combinedSchema = {
    '@context': 'https://schema.org',
    '@graph': [projectSchema, breadcrumbsSchema].filter(Boolean)
  };

  return (
    <div className="theater-page-container">
      <SEOHead
        title={`${project.title} — ${SEO_CONFIG.personName} | Engineering Case Study`}
        description={project.short_summary || project.problem || SEO_CONFIG.description}
        canonical={canonicalUrl}
        ogImage={mediaUrl}
        structuredData={combinedSchema}
      />
      {/* ── 01. SPLIT HERO: LEFT = VIDEO/DEMO (HALF SCREEN), RIGHT = DETAILS ── */}
      <div className="case-study-split-hero">
        {/* Left Column: Interactive Media Stage */}
        <div className="case-study-media-col">
          <div className="theater-screen-wrapper">
            {/* Switcher Bar on Top of Screen */}
            <div className="theater-switch-bar">
              <div className="theater-pills">
                {mediaUrl && (
                  <button
                    onClick={() => setTheaterMode('video')}
                    className={`theater-pill-btn ${theaterMode === 'video' ? 'is-active' : ''}`}
                    title="Watch Project Video or Walkthrough"
                  >
                    <Video size={13} /> Walkthrough / Video
                  </button>
                )}

                {project.live_demo_url && (
                  <button
                    onClick={() => setTheaterMode('live')}
                    className={`theater-pill-btn ${theaterMode === 'live' ? 'is-active' : ''}`}
                    title="Interactive Live App Preview"
                  >
                    <Monitor size={13} /> Live App Demo
                  </button>
                )}

                <button
                  onClick={() => setTheaterMode('screenshot')}
                  className={`theater-pill-btn ${theaterMode === 'screenshot' ? 'is-active' : ''}`}
                  title="Full-Resolution Screenshot"
                >
                  <ImageIcon size={13} /> Screenshot
                </button>
              </div>

              {project.live_demo_url && (
                <a
                  href={project.live_demo_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    fontSize: '0.75rem',
                    fontFamily: 'var(--font-mono)',
                    color: 'var(--text-secondary)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem'
                  }}
                >
                  <span>Live App</span>
                  <ExternalLink size={12} />
                </a>
              )}
            </div>

            {/* Screen Aspect Frame */}
            <div className="theater-screen-aspect">
              <div className="theater-screen-inner">
                {theaterMode === 'video' && (
                  <ProjectMedia
                    url={mediaUrl}
                    type={project.preview_type || 'video'}
                    title={project.title}
                    interactive={true}
                    aspectRatio="none"
                    style={{ width: '100%', height: '100%' }}
                  />
                )}

                {theaterMode === 'live' && project.live_demo_url && (
                  <iframe
                    src={project.live_demo_url}
                    title={`${project.title} Live Application`}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    style={{
                      width: '100%',
                      height: '100%',
                      border: 'none',
                      backgroundColor: '#FFFFFF'
                    }}
                  />
                )}

                {theaterMode === 'screenshot' && (
                  <ProjectMedia
                    url={mediaUrl}
                    type="image"
                    title={project.title}
                    interactive={false}
                    aspectRatio="none"
                    style={{ width: '100%', height: '100%' }}
                  />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Project Details & Action Hub */}
        <div className="case-study-info-col">
          {/* Breadcrumbs & Category Row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.85rem' }}>
            <Link
              to="/projects"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                color: 'var(--text-secondary)',
                fontSize: '0.82rem',
                fontFamily: 'var(--font-mono)',
                transition: 'color 0.2s'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--accent-primary)')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}
            >
              <ArrowLeft size={13} /> Back to Projects Archive
            </Link>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span className="badge-mono" style={{ backgroundColor: 'var(--accent-subtle)', color: 'var(--accent-primary)', fontWeight: 700 }}>
                {project.category || 'Full Stack'}
              </span>
              {Boolean(project.is_featured) && (
                <span className="badge-mono" style={{ backgroundColor: 'var(--accent-primary)', color: '#FFFFFF', border: 'none' }}>
                  ★ Milestone
                </span>
              )}
            </div>
          </div>

          {/* Project Title */}
          <h1 className="case-study-hero-title">
            {project.title}
          </h1>

          {/* Lead Summary */}
          <p className="case-study-hero-summary">
            {project.short_summary || project.problem || 'Engineered production application with scalable component architecture and modular system design.'}
          </p>

          {/* CTAs Row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
            {project.live_demo_url && (
              <a
                href={project.live_demo_url}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary btn-sm"
                style={{ gap: '0.45rem' }}
              >
                Open Live Project <ExternalLink size={13} />
              </a>
            )}

            {project.github_repo_url && (
              <a
                href={project.github_repo_url}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-secondary btn-sm"
                style={{ gap: '0.45rem' }}
              >
                <Github size={14} /> GitHub Code
              </a>
            )}

            {project.figma_url && (
              <a
                href={project.figma_url}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-secondary btn-sm"
                style={{ gap: '0.45rem' }}
              >
                <Figma size={13} /> Figma Specs
              </a>
            )}

            <button
              onClick={handleShare}
              className="btn btn-ghost btn-sm"
              style={{ gap: '0.35rem' }}
              title="Copy Case Study URL"
            >
              {copiedLink ? <Check size={13} color="var(--success)" /> : <Share2 size={13} />}
              <span style={{ fontSize: '0.78rem' }}>{copiedLink ? 'Copied' : 'Share'}</span>
            </button>
          </div>

          {/* Tech Stack Badges */}
          {Array.isArray(project.tech_stack) && project.tech_stack.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginBottom: '1.25rem' }}>
              {project.tech_stack.map((t, idx) => (
                <span key={idx} className="badge-mono" style={{ fontSize: '0.74rem' }}>
                  {t}
                </span>
              ))}
            </div>
          )}

          {/* Project Quick Specs Card */}
          <div className="case-study-specs-card">
            {project.display_settings?.show_my_role !== false && (
              <div className="case-study-spec-item">
                <span className="spec-label">ROLE</span>
                <span className="spec-value">{project.my_role || 'Lead Engineer'}</span>
              </div>
            )}
            <div className="case-study-spec-item">
              <span className="spec-label">DOMAIN</span>
              <span className="spec-value">{project.category || 'Full Stack'}</span>
            </div>
            <div className="case-study-spec-item">
              <span className="spec-label">DEPLOYMENT</span>
              <span className="spec-value" style={{ color: project.live_demo_url ? 'var(--success)' : 'var(--text-secondary)' }}>
                {project.live_demo_url ? '● Production Active' : 'Offline / Archive'}
              </span>
            </div>
            <div className="case-study-spec-item">
              <span className="spec-label">ENGINEER</span>
              <span className="spec-value">Pushkara Vardhan</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── 02. UNIQUE MODULAR ARCHITECTURE & DOCUMENTATION SYSTEM ── */}
      <div>
        {/* Navigation Ribbon for Parsed Sections */}
        {docSections.length > 1 && (
          <div className="doc-nav-ribbon">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', paddingRight: '0.5rem', borderRight: '1px solid var(--border-subtle)', color: 'var(--accent-primary)', fontSize: '0.75rem', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
              <Compass size={14} />
              <span>MODULES ({docSections.length})</span>
            </div>

            <button
              onClick={() => scrollToSection('all')}
              className={`doc-nav-tab ${activeSectionId === 'all' ? 'is-active' : ''}`}
            >
              All Sections
            </button>

            {docSections.map((sec, idx) => (
              <button
                key={sec.id}
                onClick={() => scrollToSection(sec.id)}
                className={`doc-nav-tab ${activeSectionId === sec.id ? 'is-active' : ''}`}
              >
                <span>{String(idx + 1).padStart(2, '0')}.</span>
                <span>{sec.title}</span>
              </button>
            ))}
          </div>
        )}

        {/* 2-Column Content Layout: Left = Structured Doc Cards, Right = Sidebar */}
        <div className="theater-grid-layout" style={{ marginTop: '1rem' }}>
          {/* Main Modular Architectural Breakdown */}
          <div className="theater-main-content">
            {/* Header info badge */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-subtle)', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <BookOpen size={16} color="var(--accent-primary)" />
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Architectural Analysis & Case Study Documentation
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                {readmeSource === 'github' ? (
                  <span className="badge-mono" style={{ backgroundColor: 'var(--accent-subtle)', color: 'var(--accent-primary)', fontSize: '0.7rem' }}>
                    ● Synced from GitHub Repository
                  </span>
                ) : (
                  <span className="badge-mono" style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-secondary)', fontSize: '0.7rem' }}>
                    ● Local Engineering Blueprint
                  </span>
                )}

                {project.github_repo_url && (
                  <a
                    href={project.github_repo_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
                  >
                    <span>Raw Repo</span>
                    <ExternalLink size={11} />
                  </a>
                )}
              </div>
            </div>

            {loadingReadme ? (
              <div style={{ padding: '3.5rem', textAlign: 'center', backgroundColor: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)' }}>
                <div className="pulse-dot" style={{ width: 10, height: 10, margin: '0 auto 0.75rem auto' }} />
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontFamily: 'var(--font-mono)' }}>
                  Analyzing repository architecture & documentation...
                </p>
              </div>
            ) : docSections.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {docSections.map((sec, idx) => {
                  const moduleNum = String(idx + 1).padStart(2, '0');

                  return (
                    <article
                      key={sec.id}
                      id={sec.id}
                      className="doc-module-card"
                    >
                      {/* Module Header */}
                      <div className="doc-module-header">
                        <div>
                          <div className="doc-module-tag">
                            {getSectionIcon(sec.iconType)}
                            <span>MODULE {moduleNum} // {sec.category}</span>
                          </div>
                          <h2 className="doc-module-title">
                            {sec.title}
                          </h2>
                        </div>

                        {sec.diagrams && sec.diagrams.length > 0 && (
                          <span
                            className="badge-mono"
                            style={{
                              backgroundColor: 'var(--accent-subtle)',
                              color: 'var(--accent-primary)',
                              fontSize: '0.7rem'
                            }}
                          >
                            ● Architecture Visual
                          </span>
                        )}
                      </div>

                      {/* Prominent Diagram Showcase (If this section contains diagrams/flowcharts) */}
                      {sec.diagrams && sec.diagrams.length > 0 && (
                        <div className="doc-diagram-viewport">
                          {sec.diagrams.map((d, dIdx) => (
                            <div key={dIdx} style={{ textAlign: 'center', width: '100%' }}>
                              <img src={d.url} alt={d.caption} loading="lazy" />
                              <div className="doc-diagram-caption">
                                <Layers size={13} color="var(--accent-primary)" />
                                <span>{d.caption}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Rendered Semantic Section Content */}
                      <div
                        className="github-markdown-body"
                        dangerouslySetInnerHTML={{
                          __html: renderSafeMarkdown(sec.content || '')
                        }}
                      />
                    </article>
                  );
                })}
              </div>
            ) : (
              <div style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-secondary)', backgroundColor: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)' }}>
                No documentation available for this project.
              </div>
            )}
          </div>

          {/* Right Sidebar: Recommended Projects in Journey */}
          <aside className="theater-sidebar">
            {/* Quick Repository Specs Card */}
            <div
              className="card"
              style={{
                padding: '1.5rem',
                backgroundColor: 'var(--bg-secondary)',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border-subtle)',
                marginBottom: '2rem'
              }}
            >
              <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--accent-primary)', textTransform: 'uppercase', fontFamily: 'var(--font-mono)', marginBottom: '1rem' }}>
                Engineering Blueprint Specs
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', fontSize: '0.88rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.65rem', borderBottom: '1px solid var(--border-subtle)' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Role</span>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{project.my_role || 'Lead Engineer'}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.65rem', borderBottom: '1px solid var(--border-subtle)' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Category</span>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{project.category || 'Full Stack'}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.65rem', borderBottom: '1px solid var(--border-subtle)' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Architecture</span>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                    {Array.isArray(project.tech_stack) ? project.tech_stack.slice(0, 2).join(' + ') : 'Modern Web'}
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Source Code</span>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                    {project.github_repo_url ? 'Available on GitHub' : 'Private Repository'}
                  </span>
                </div>
              </div>
            </div>

            {/* Suggested / More Projects (YouTube "Up Next" Style) */}
            {recommendedProjects.length > 0 && (
              <div>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span>More In Engineering Journey</span>
                  <Link to="/projects" style={{ fontSize: '0.78rem', color: 'var(--accent-primary)', fontFamily: 'var(--font-mono)' }}>
                    View All
                  </Link>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {recommendedProjects.map((rec) => {
                    const recThumb = rec.preview_url || rec.thumbnail_url || rec.featured_image_url;

                    return (
                      <Link
                        key={rec.id || rec.slug}
                        to={`/projects/${rec.slug || rec.id}`}
                        className="youtube-sidebar-item"
                      >
                        <div className="youtube-sidebar-thumb">
                          <ProjectMedia
                            url={recThumb}
                            type={rec.preview_type}
                            title={rec.title}
                            isWallpaper={false}
                            aspectRatio="56.25%"
                          />
                        </div>

                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div
                            style={{
                              fontSize: '0.88rem',
                              fontWeight: 700,
                              color: 'var(--text-primary)',
                              lineHeight: 1.3,
                              marginBottom: '0.25rem',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            {rec.title}
                          </div>

                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                            {rec.category || 'Full Stack'}
                          </div>

                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                            {Array.isArray(rec.tech_stack)
                              ? rec.tech_stack.slice(0, 2).map((t, idx) => (
                                  <span
                                    key={idx}
                                    className="badge-mono"
                                    style={{ fontSize: '0.65rem', padding: '0.05rem 0.3rem' }}
                                  >
                                    {t}
                                  </span>
                                ))
                              : null}
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}

export default ProjectDetailPage;
