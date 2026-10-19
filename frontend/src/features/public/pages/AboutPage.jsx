import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  ArrowUpRight,
  GraduationCap,
  Briefcase,
  FileText,
  MapPin,
  CheckCircle2,
  Award,
  Sparkles,
  Layers,
  Code2,
  Cpu,
  Palette
} from 'lucide-react';
import { apiRequest } from '../../../common/utils/api.js';

export function AboutPage() {
  const [profile, setProfile] = useState(null);
  const [experiences, setExperiences] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAboutData() {
      try {
        const [profileData, expData] = await Promise.all([
          apiRequest('/public/profile/overview').catch(() => null),
          apiRequest('/public/profile/experience').catch(() => [])
        ]);

        setProfile(profileData || {});
        setExperiences(Array.isArray(expData) ? expData : []);
      } catch (err) {
        console.error('Failed to load about data:', err);
      } finally {
        setLoading(false);
      }
    }

    loadAboutData();
  }, []);

  const technicalSkillsCategories = [
    {
      title: 'Front-end Technologies',
      icon: <Code2 size={18} color="var(--accent-primary)" />,
      skills: ['HTML5', 'CSS3', 'JavaScript (ES6+)', 'React.js', 'Bootstrap', 'Tailwind CSS']
    },
    {
      title: 'UI/UX Tools & Design',
      icon: <Palette size={18} color="var(--accent-primary)" />,
      skills: ['Figma', 'Prototyping', 'Wireframing', 'Design Systems', 'Responsive Design']
    },
    {
      title: 'APIs, Backend & Databases',
      icon: <Layers size={18} color="var(--accent-primary)" />,
      skills: ['Node.js', 'Express.js', 'REST API', 'Axios', 'Fetch', 'MongoDB', 'MySQL', 'Java Fundamentals']
    },
    {
      title: 'State Management & Build Tools',
      icon: <Cpu size={18} color="var(--accent-primary)" />,
      skills: ['Context API', 'React Query', 'Webpack', 'npm', 'Git', 'GitHub']
    },
    {
      title: 'Workflow & AI-Assisted Engineering',
      icon: <Sparkles size={18} color="var(--accent-primary)" />,
      skills: ['Agile Methodology (Scrum)', 'JIRA', 'ChatGPT', 'Claude', 'Gemini', 'Grok', 'Windsurf', 'Antigravity']
    }
  ];

  return (
    <div className="section" style={{ paddingTop: '3.5rem', paddingBottom: '6rem' }}>
      <div className="container" style={{ maxWidth: '980px' }}>
        {/* ── 01. EDITORIAL HEADER & PORTRAIT ────────────────── */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '3.5rem',
            alignItems: 'start',
            marginBottom: '4.5rem'
          }}
        >
          {/* Portrait Image */}
          <div>
            <div
              style={{
                borderRadius: 'var(--radius-lg)',
                overflow: 'hidden',
                border: '1px solid var(--border-subtle)',
                backgroundColor: 'var(--bg-tertiary)'
              }}
            >
              <img
                src="https://res.cloudinary.com/cq7auu5w/image/upload/profile_cakhrj.png"
                alt="Pushkara Sai Vardhan Kagitha"
                style={{
                  width: '100%',
                  height: 'auto',
                  display: 'block',
                  objectFit: 'cover'
                }}
              />
            </div>
            <div style={{ marginTop: '0.85rem', fontSize: '0.82rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
              Pushkara Sai Vardhan Kagitha · Frontend & UI Developer
            </div>
          </div>

          {/* Biography & Summary from Resume */}
          <div>
            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--accent-primary)', letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: 'var(--font-mono)', marginBottom: '0.5rem' }}>
              Profile Summary
            </div>
            <h1
              style={{
                fontSize: 'clamp(2.2rem, 4.5vw, 3rem)',
                fontWeight: 800,
                lineHeight: 1.15,
                letterSpacing: '-0.03em',
                marginBottom: '1.25rem',
                color: 'var(--text-primary)'
              }}
            >
              Creating intuitive and visually appealing web experiences.
            </h1>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', color: 'var(--text-secondary)', fontSize: '1rem', lineHeight: 1.7 }}>
              <p>
                Enthusiastic Computer Science graduate with practical experience in building responsive user interfaces using <strong style={{ color: 'var(--text-primary)' }}>HTML, CSS, JavaScript, React.js, and Figma</strong>. Passionate about crafting intuitive, accessible, and high-performance digital products and eager to contribute as a UI Developer.
              </p>
              <p>
                Currently serving as a <strong style={{ color: 'var(--text-primary)' }}>Software Engineer at VCube Software Solutions</strong>, developing and maintaining production-ready web applications across the MERN stack (React, Node.js, Express, MongoDB) alongside Tailwind CSS and modern RESTful APIs.
              </p>
              <p>
                Background also includes hands-on experience as Lead UI/UX Designer at Vastiverse Nexus, designing end-to-end user flows, wireframes, and design systems in Figma, paired with continuous AI-assisted software engineering practices.
              </p>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginTop: '2rem' }}>
              <a
                href="https://drive.google.com/file/d/1jWRYRcQItR0yGmAZGpaKO1pIxfTJgbCU/view?usp=sharing"
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary"
              >
                <FileText size={15} /> Curriculum Vitae <ArrowUpRight size={14} />
              </a>

              <Link to="/contact" className="btn btn-secondary">
                Get in Touch
              </Link>
            </div>
          </div>
        </div>

        {/* ── 02. TECHNICAL SKILLS SECTION ────────────────────── */}
        <section style={{ marginBottom: '4.5rem' }}>
          <div style={{ marginBottom: '2rem' }}>
            <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--accent-primary)', letterSpacing: '0.06em', textTransform: 'uppercase', fontFamily: 'var(--font-mono)', marginBottom: '0.35rem' }}>
              Core Competencies
            </div>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Technical Skills
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
            {technicalSkillsCategories.map((cat, idx) => (
              <div
                key={idx}
                className="card"
                style={{
                  padding: '1.5rem',
                  backgroundColor: 'var(--bg-secondary)',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--border-subtle)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.85rem'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {cat.icon}
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {cat.title}
                  </h3>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                  {cat.skills.map((skill, sIdx) => (
                    <span key={sIdx} className="badge-mono" style={{ fontSize: '0.75rem' }}>
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── 03. PROFESSIONAL EXPERIENCE ──────────────────────── */}
        <section style={{ marginBottom: '4.5rem' }}>
          <div style={{ marginBottom: '2rem' }}>
            <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--accent-primary)', letterSpacing: '0.06em', textTransform: 'uppercase', fontFamily: 'var(--font-mono)', marginBottom: '0.35rem' }}>
              Career Timeline
            </div>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Professional Experience & Internships
            </h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
            {/* Experience 1: VCube Software Solutions */}
            <div
              className="card"
              style={{
                padding: '2rem',
                backgroundColor: 'var(--bg-secondary)',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border-subtle)',
                borderLeft: '3px solid var(--accent-primary)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.85rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                    <span className="badge-mono" style={{ backgroundColor: 'var(--accent-subtle)', color: 'var(--accent-primary)', fontWeight: 700 }}>
                      MARCH 2026 – PRESENT
                    </span>
                    <span style={{ fontSize: '0.78rem', color: 'var(--success)', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                      ● CURRENT POSITION
                    </span>
                  </div>
                  <h3 style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    Software Engineer — Frontend Developer | MERN Stack Developer
                  </h3>
                  <div style={{ color: 'var(--accent-primary)', fontWeight: 600, fontSize: '0.95rem', marginTop: '0.15rem' }}>
                    VCube Software Solutions
                  </div>
                </div>
                <span className="badge-mono">Hyderabad, IN</span>
              </div>

              <p style={{ fontSize: '0.92rem', color: 'var(--text-secondary)', lineHeight: 1.65, marginBottom: '1.25rem' }}>
                Developed and maintained responsive web applications using React.js, JavaScript, HTML5, CSS3, Tailwind CSS, Node.js, Express.js, and MongoDB.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                  <CheckCircle2 size={16} style={{ color: 'var(--accent-primary)', marginTop: 2, flexShrink: 0 }} />
                  <span>Built multiple production-ready applications including an Employee Management System, Book Market (E-Commerce), SHAI Bank, and involved in HRMS, and a Student Job Portal.</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                  <CheckCircle2 size={16} style={{ color: 'var(--accent-primary)', marginTop: 2, flexShrink: 0 }} />
                  <span>Designed reusable React components and implemented scalable frontend architecture.</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                  <CheckCircle2 size={16} style={{ color: 'var(--accent-primary)', marginTop: 2, flexShrink: 0 }} />
                  <span>Integrated REST APIs and managed client-server communication for dynamic web applications.</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                  <CheckCircle2 size={16} style={{ color: 'var(--accent-primary)', marginTop: 2, flexShrink: 0 }} />
                  <span>Collaborated with designers and backend developers in an Agile development environment (Scrum, JIRA).</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                  <CheckCircle2 size={16} style={{ color: 'var(--accent-primary)', marginTop: 2, flexShrink: 0 }} />
                  <span>Optimized application performance, responsiveness, and user experience across devices.</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                  <CheckCircle2 size={16} style={{ color: 'var(--accent-primary)', marginTop: 2, flexShrink: 0 }} />
                  <span>Leveraged AI-assisted development tools including ChatGPT, Claude, Gemini, Grok, Windsurf, and Antigravity for code generation, debugging, refactoring, documentation, and rapid prototyping.</span>
                </div>
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', paddingTop: '1rem', borderTop: '1px solid var(--border-subtle)' }}>
                {['React.js', 'JavaScript (ES6+)', 'Node.js', 'Express.js', 'MongoDB', 'Tailwind CSS', 'REST APIs', 'Agile / JIRA', 'AI Tooling'].map((t) => (
                  <span key={t} className="badge-mono">{t}</span>
                ))}
              </div>
            </div>

            {/* Experience 2: Vastiverse Nexus (Internship) */}
            <div
              className="card"
              style={{
                padding: '2rem',
                backgroundColor: 'var(--bg-secondary)',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border-subtle)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.85rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                    <span className="badge-mono" style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}>
                      NOV 2024 – FEB 2025
                    </span>
                    <span className="badge-mono">INTERNSHIP</span>
                  </div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    UI/UX Designer — Lead Designer
                  </h3>
                  <div style={{ color: 'var(--accent-primary)', fontWeight: 600, fontSize: '0.92rem', marginTop: '0.15rem' }}>
                    Vastiverse Nexus
                  </div>
                </div>
                <span className="badge-mono">Remote</span>
              </div>

              <p style={{ fontSize: '0.92rem', color: 'var(--text-secondary)', lineHeight: 1.65, marginBottom: '1.25rem' }}>
                Worked as the lead UI/UX designer for Navapuja, creating the full website experience for pandit booking.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem', fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                  <CheckCircle2 size={16} style={{ color: 'var(--accent-primary)', marginTop: 2, flexShrink: 0 }} />
                  <span>Designed user flows, wireframes, and high-fidelity UI screens in Figma.</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                  <CheckCircle2 size={16} style={{ color: 'var(--accent-primary)', marginTop: 2, flexShrink: 0 }} />
                  <span>Developed a consistent design system with reusable components and tokens.</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                  <CheckCircle2 size={16} style={{ color: 'var(--accent-primary)', marginTop: 2, flexShrink: 0 }} />
                  <span>Ensured responsive, accessible, and user-friendly layouts across mobile and web.</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                  <CheckCircle2 size={16} style={{ color: 'var(--accent-primary)', marginTop: 2, flexShrink: 0 }} />
                  <span>Coordinated closely with frontend developers for smooth design implementation.</span>
                </div>
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', paddingTop: '1rem', borderTop: '1px solid var(--border-subtle)' }}>
                {['Figma', 'Wireframing', 'Prototyping', 'Design Systems', 'User Flows', 'UI/UX'].map((t) => (
                  <span key={t} className="badge-mono">{t}</span>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── 04. ACADEMIC FOUNDATION (Education from Resume) ─── */}
        <section style={{ marginBottom: '4.5rem' }}>
          <div style={{ marginBottom: '2rem' }}>
            <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--accent-primary)', letterSpacing: '0.06em', textTransform: 'uppercase', fontFamily: 'var(--font-mono)', marginBottom: '0.35rem' }}>
              Academic Foundation
            </div>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Education
            </h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Education 1: B.Tech */}
            <div
              className="card"
              style={{
                padding: '2rem',
                backgroundColor: 'var(--bg-secondary)',
                borderRadius: 'var(--radius-lg)',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '1.5rem',
                flexWrap: 'wrap'
              }}
            >
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--accent-soft)',
                  color: 'var(--accent-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}
              >
                <GraduationCap size={22} />
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.25rem' }}>
                  <h3 style={{ fontSize: '1.18rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    B.Tech, Computer Science & Engineering
                  </h3>
                  <span className="badge-mono" style={{ backgroundColor: 'var(--accent-subtle)', color: 'var(--accent-primary)', fontWeight: 700 }}>
                    CGPA: 7.72
                  </span>
                </div>
                <div style={{ fontSize: '0.92rem', color: 'var(--accent-primary)', fontWeight: 600, marginBottom: '0.2rem' }}>
                  Usharama College of Engineering and Technology, Gannavaram
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginBottom: '0.65rem' }}>
                  Nov 2021 – May 2025
                </div>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.6 }}>
                  Focused on Data Structures, Relational Database Management Systems, Object-Oriented System Design, Computer Networks, and Web Application Engineering.
                </p>
              </div>
            </div>

            {/* Education 2: 12th Grade */}
            <div
              className="card"
              style={{
                padding: '1.75rem 2rem',
                backgroundColor: 'var(--bg-secondary)',
                borderRadius: 'var(--radius-lg)',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '1.5rem',
                flexWrap: 'wrap'
              }}
            >
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--bg-tertiary)',
                  color: 'var(--text-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}
              >
                <GraduationCap size={20} />
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.25rem' }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    12th Grade (ISC Board)
                  </h3>
                  <span className="badge-mono">82%</span>
                </div>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: 600, marginBottom: '0.2rem' }}>
                  Loyola Public School, Nallapadu, Guntur
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                  July 2019 – April 2021
                </div>
              </div>
            </div>

            {/* Education 3: 10th Grade */}
            <div
              className="card"
              style={{
                padding: '1.75rem 2rem',
                backgroundColor: 'var(--bg-secondary)',
                borderRadius: 'var(--radius-lg)',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '1.5rem',
                flexWrap: 'wrap'
              }}
            >
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--bg-tertiary)',
                  color: 'var(--text-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}
              >
                <GraduationCap size={20} />
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.25rem' }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    10th Grade (ICSE Board)
                  </h3>
                  <span className="badge-mono">78%</span>
                </div>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: 600, marginBottom: '0.2rem' }}>
                  Loyola Public School, Nallapadu, Guntur
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                  July 2018 – April 2019
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── 05. ACHIEVEMENTS & CERTIFICATIONS ────────────────── */}
        <section>
          <div style={{ marginBottom: '2rem' }}>
            <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--accent-primary)', letterSpacing: '0.06em', textTransform: 'uppercase', fontFamily: 'var(--font-mono)', marginBottom: '0.35rem' }}>
              Recognitions & Certifications
            </div>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Key Achievements & Certifications
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
            {/* Hackathon Achievement */}
            <div
              className="card"
              style={{
                padding: '1.5rem',
                backgroundColor: 'var(--bg-secondary)',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border-subtle)',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-primary)' }}>
                <Award size={18} />
                <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', fontWeight: 700, textTransform: 'uppercase' }}>
                  Hackathon & Workshop
                </span>
              </div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                AWS & DevOps Workshop + Hackathon
              </h3>
              <div style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
                Brain O Vision · July 2023
              </div>
            </div>

            {/* Certification 1 */}
            <div
              className="card"
              style={{
                padding: '1.5rem',
                backgroundColor: 'var(--bg-secondary)',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border-subtle)',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--success)' }}>
                <Award size={18} />
                <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', fontWeight: 700, textTransform: 'uppercase' }}>
                  Professional Certification
                </span>
              </div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Employability Skills Certification
              </h3>
              <div style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
                APSSDC - Edunet & IBM SkillsBuild · 2024–2025
              </div>
            </div>

            {/* Certification 2 */}
            <div
              className="card"
              style={{
                padding: '1.5rem',
                backgroundColor: 'var(--bg-secondary)',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border-subtle)',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-primary)' }}>
                <Award size={18} />
                <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', fontWeight: 700, textTransform: 'uppercase' }}>
                  Design Competition
                </span>
              </div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                GUVI's Design Skill-A-Thon
              </h3>
              <div style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
                Participated in UI/UX Design Competition
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default AboutPage;
