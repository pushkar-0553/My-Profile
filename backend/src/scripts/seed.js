import { query, memoryStore } from '../config/db.js';
import { config } from '../config/env.js';

export const initialData = {
  admins: [
    {
      id: 1,
      email: config.auth.adminEmail,
      full_name: 'Kagitha Pushkara Sai Vardhan',
      avatar_url: '',
      role: 'SUPER_ADMIN'
    }
  ],
  siteSettings: {
    site_title: 'Pushkara Sai Vardhan Kagitha | Frontend & MERN Stack Developer | UI Developer',
    meta_description: 'Portfolio of Pushkara Sai Vardhan Kagitha - Frontend Developer & MERN Stack Developer specializing in React.js, JavaScript, Tailwind CSS, Node.js, Express, MongoDB, and Figma.',
    contact_email: 'kagithapushkara@gmail.com',
    phone: '+91 7842770553',
    portfolio_url: 'https://my-profile-seven-murex.vercel.app',
    github_url: 'https://github.com/pushkar-0553',
    linkedin_url: 'https://www.linkedin.com/in/pushkara-sai-vardhan-kagitha-2345b5283',
    hero_headline: "Frontend & MERN Stack Developer | UI Developer",
    hero_subheadline: "Enthusiastic Computer Science graduate with practical experience in building responsive user interfaces using HTML, CSS, JavaScript, React, and Figma. Passionate about creating intuitive and visually appealing web experiences and eager to contribute as a UI Developer."
  },
  projects: [
    {
      id: 1,
      slug: 'distributed-ecommerce-platform',
      title: 'Distributed High-Concurrency E-Commerce Platform',
      short_summary: 'Full-stack e-commerce system engineered with Spring Boot, React, and MySQL/TiDB, optimizing checkout throughput and inventory consistency.',
      full_content: `## Executive Overview\n\nThis application addresses the engineering challenges of modern commerce platforms: high concurrent cart updates, reliable order fulfillment, and sub-second catalog search.\n\nBuilt with a resilient Spring Boot backend and an accessible React frontend, the architecture eliminates single points of failure while maintaining sub-50ms query response times under heavy simulation.`,
      problem: 'Relational database lock contention during concurrent checkout bursts often causes inventory drift, deadlocks, and shopping cart transaction drop-offs.',
      solution: 'Implemented optimistic locking on inventory counts with an asynchronous event-driven order processing pipeline and clean REST API boundary isolation.',
      my_role: 'Lead Full Stack Architect & Developer. Responsible for system design, database schema, Spring Boot microservices, and React frontend integration.',
      architecture_details: 'React 18 SPA client interacting with a Spring Boot REST API service. Relational data model deployed on TiDB Cloud with connection pooling, optimistic concurrency tokens, and secure JWT authentication.',
      challenges: 'Resolving race conditions in checkout carts when multiple sessions attempt to purchase the final inventory item simultaneously.',
      results_metrics: 'Eliminated inventory over-allocation in stress tests of 5,000 simulated concurrent checkouts while keeping 99th percentile response latency below 65ms.',
      lessons_learned: 'Decoupling inventory reservation from payment authorization ensures customers are never billed for items that just slipped out of stock.',
      preview_type: 'image',
      preview_url: 'https://images.unsplash.com/photo-1557821552-17105176677c?w=1200&q=80',
      github_repo_url: 'https://github.com/pushkar-0553/E-Commerce-Platform',
      live_demo_url: '',
      figma_url: '',
      category: 'Full Stack',
      is_featured: true,
      is_published: true,
      display_order: 1
    },
    {
      id: 2,
      slug: 'rpa-invoice-automation-pipeline',
      title: 'Automated Financial Invoice Extraction Pipeline',
      short_summary: 'Enterprise robotic workflow automating multi-format invoice optical recognition, validation, and accounting ingestion.',
      full_content: `## Executive Overview\n\nAccounts payable departments spend hundreds of hours manually keying PDF invoices into financial ledgers. This robotic process automation solution extracts line-item data across heterogeneous invoice layouts with automated exception routing.\n\nDesigned with strict retry rules, OCR fallback handlers, and human-in-the-loop review queues.`,
      problem: 'Manual invoice data entry introduced an average 48-hour processing lag and a 6.2% human transposition error rate across hundreds of vendor formats.',
      solution: 'Engineered a UiPath RPA pipeline combining OCR pattern recognition, regular expression extractors, automated math checksums, and structured CSV/database output.',
      my_role: 'Automation & Workflow Developer. Designed the data extraction logic, validation thresholds, and error notification hooks.',
      architecture_details: 'UiPath workflow triggers on incoming inbox attachments, verifies cryptographic hashes to prevent duplicate ingestion, runs OCR extraction, validates tax sums, and outputs clean ledger entries.',
      challenges: 'Handling non-standardized multi-page vendor invoices where totals and line items appear across fragmented tables.',
      results_metrics: 'Cut average invoice handling time from 9.5 minutes to 38 seconds while lowering data entry error rates below 0.3%.',
      lessons_learned: 'RPA pipelines require robust defensive programming: always validate checksums before committing data to financial downstream systems.',
      preview_type: 'image',
      preview_url: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&q=80',
      github_repo_url: 'https://github.com/pushkar-0553/RPA-Invoice-Automation',
      live_demo_url: '',
      figma_url: '',
      category: 'Automation & RPA',
      is_featured: true,
      is_published: true,
      display_order: 2
    },
    {
      id: 3,
      slug: 'modular-component-design-system',
      title: 'Modular Component Design System',
      short_summary: 'Comprehensive multi-brand UI kit and tokenized design system built in Figma for scalable web and mobile applications.',
      full_content: `## Executive Overview\n\nScalable engineering requires a consistent design vocabulary. This design system bridges the gap between Figma mockups and production React components through automated token management and accessibility-tested components.`,
      problem: 'Fragmented typography scales, inconsistent elevation shadows, and ad-hoc CSS button overrides created visual inconsistency and slowed engineering velocity.',
      solution: 'Created an accessible token-based design system in Figma featuring atomic variables, responsive layout grids, WCAG AA contrast scales, and component state variants.',
      my_role: 'Product Designer & Design System Architect. Established token definitions, interactive component variants, and design documentation.',
      architecture_details: 'Figma Auto-Layout v5 architecture with component property controls, centralized semantic color tokens, and direct export mapping to CSS Custom Properties.',
      challenges: 'Balancing visual richness (subtle depth, fluid typography) with strict WCAG AA accessibility contrast compliance across dark and light palettes.',
      results_metrics: 'Accelerated UI development velocity by over 40% through standardized reusable component patterns and zero ambiguity in handoff specs.',
      lessons_learned: 'A design system is a living product. Without strict component governance and token discipline, visual debt accumulates rapidly.',
      preview_type: 'image',
      preview_url: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=1200&q=80',
      github_repo_url: 'https://github.com/pushkar-0553/UI-UX-Design-System',
      live_demo_url: '',
      figma_url: 'https://www.figma.com',
      category: 'UI/UX Design',
      is_featured: true,
      is_published: true,
      display_order: 3
    }
  ],
  skillCategories: [
    { id: 1, name: 'Front-end Technologies', display_order: 1 },
    { id: 2, name: 'UI/UX Tools', display_order: 2 },
    { id: 3, name: 'Frameworks & Libraries', display_order: 3 },
    { id: 4, name: 'State Management', display_order: 4 },
    { id: 5, name: 'APIs, Backend & Databases', display_order: 5 },
    { id: 6, name: 'Build & Dev Tools', display_order: 6 },
    { id: 7, name: 'Workflow & AI Tooling', display_order: 7 }
  ],
  skills: [
    { id: 1, category_id: 1, name: 'HTML5', icon_name: 'bx bxl-html5', display_order: 1, is_core: true },
    { id: 2, category_id: 1, name: 'CSS3', icon_name: 'bx bxl-css3', display_order: 2, is_core: true },
    { id: 3, category_id: 1, name: 'JavaScript (ES6+)', icon_name: 'bx bxl-javascript', display_order: 3, is_core: true },
    { id: 4, category_id: 2, name: 'Figma (Prototyping, Wireframing)', icon_name: 'bx bxl-figma', display_order: 1, is_core: true },
    { id: 5, category_id: 3, name: 'React.js', icon_name: 'bx bxl-react', display_order: 1, is_core: true },
    { id: 6, category_id: 3, name: 'Tailwind CSS', icon_name: 'bx bxl-tailwind-css', display_order: 2, is_core: true },
    { id: 7, category_id: 3, name: 'Bootstrap', icon_name: 'bx bxl-bootstrap', display_order: 3, is_core: false },
    { id: 8, category_id: 4, name: 'Context API', icon_name: 'bx bx-layer', display_order: 1, is_core: true },
    { id: 9, category_id: 4, name: 'React Query', icon_name: 'bx bx-sync', display_order: 2, is_core: true },
    { id: 10, category_id: 5, name: 'REST API Integration (Axios, Fetch)', icon_name: 'bx bx-code-curly', display_order: 1, is_core: true },
    { id: 11, category_id: 5, name: 'Node.js & Express.js', icon_name: 'bx bxl-nodejs', display_order: 2, is_core: true },
    { id: 12, category_id: 5, name: 'MongoDB', icon_name: 'bx bxl-mongodb', display_order: 3, is_core: true },
    { id: 13, category_id: 5, name: 'MySQL', icon_name: 'bx bx-data', display_order: 4, is_core: true },
    { id: 14, category_id: 5, name: 'Java Fundamentals', icon_name: 'bx bxl-java', display_order: 5, is_core: false },
    { id: 15, category_id: 6, name: 'Git & GitHub', icon_name: 'bx bxl-git', display_order: 1, is_core: true },
    { id: 16, category_id: 6, name: 'Webpack & npm', icon_name: 'bx bx-package', display_order: 2, is_core: true },
    { id: 17, category_id: 7, name: 'Agile Methodology (Scrum), JIRA', icon_name: 'bx bx-task', display_order: 1, is_core: true },
    { id: 18, category_id: 7, name: 'AI-Assisted Tools (ChatGPT, Claude, Gemini, Grok, Windsurf, Antigravity)', icon_name: 'bx bx-bot', display_order: 2, is_core: true }
  ],
  education: [
    {
      id: 1,
      degree: 'B.Tech, Computer Science & Engineering',
      institution: 'Usharama College of Engineering and Technology, Gannavaram',
      location: 'Gannavaram, India',
      start_year: 2021,
      end_year: 2025,
      grade_or_gpa: 'CGPA: 7.72',
      display_order: 1
    },
    {
      id: 2,
      degree: '12th Grade (ISC Board)',
      institution: 'Loyola Public School, Nallapadu, Guntur',
      location: 'Guntur, India',
      start_year: 2019,
      end_year: 2021,
      grade_or_gpa: '82%',
      display_order: 2
    },
    {
      id: 3,
      degree: '10th Grade (ICSE Board)',
      institution: 'Loyola Public School, Nallapadu, Guntur',
      location: 'Guntur, India',
      start_year: 2018,
      end_year: 2019,
      grade_or_gpa: '78%',
      display_order: 3
    }
  ],
  experiences: [
    {
      id: 1,
      role: 'Software Engineer — Frontend Developer | MERN Stack Developer',
      company: 'VCube Software Solutions',
      location: 'Hyderabad, IN',
      employment_type: 'Full-time',
      start_date: '2026-03-01',
      end_date: null,
      is_current: true,
      description: 'Developed and maintained responsive web applications using React.js, JavaScript, HTML5, CSS3, Tailwind CSS, Node.js, Express.js, and MongoDB.',
      achievements: [
        'Built multiple production-ready applications including an Employee Management System, Book Market (E-Commerce), SHAI Bank, HRMS, and a Student Job Portal.',
        'Designed reusable React components and implemented scalable frontend architecture.',
        'Integrated REST APIs and managed client-server communication for dynamic web applications.',
        'Collaborated with designers and backend developers in an Agile development environment (Scrum, JIRA).',
        'Optimized application performance, responsiveness, and user experience across devices.',
        'Used AI-assisted development tools including ChatGPT, Claude, Gemini, Grok, Windsurf, and Antigravity for code generation, debugging, refactoring, documentation, and rapid prototyping.',
        'Participated in feature planning, UI implementation, testing, deployment, and continuous improvement of applications.'
      ],
      display_order: 1,
      is_published: true
    },
    {
      id: 2,
      role: 'UI/UX Designer — Lead Designer',
      company: 'Vastiverse Nexus',
      location: 'Remote',
      employment_type: 'Internship',
      start_date: '2024-11-01',
      end_date: '2025-02-01',
      is_current: false,
      description: 'Worked as the lead UI/UX designer for Navapuja, creating the full website experience for pandit booking.',
      achievements: [
        'Designed user flows, wireframes, and high-fidelity UI screens.',
        'Developed a consistent design system using Figma.',
        'Ensured responsive, accessible, and user-friendly layouts.',
        'Coordinated with developers for smooth design implementation.'
      ],
      display_order: 2,
      is_published: true
    }
  ],
  certifications: [
    {
      id: 1,
      name: 'AWS & DevOps Workshop + Hackathon',
      issuer: 'Brain O Vision',
      issue_date: 'July 2023',
      display_order: 1
    },
    {
      id: 2,
      name: 'Employability Skills Certification',
      issuer: 'APSSDC - Edunet & IBM SkillsBuild',
      issue_date: '2024–2025',
      display_order: 2
    },
    {
      id: 3,
      name: "GUVI's Design Skill-A-Thon",
      issuer: 'GUVI',
      issue_date: 'Design Competition',
      display_order: 3
    }
  ]
};

// Seed memoryStore immediately for fallback support
memoryStore.seedInitialData(initialData);

import { initDatabase } from '../config/db.js';

async function seedDatabase() {
  console.log('[Seed] Initializing connection to TiDB...');
  await initDatabase();
  console.log('[Seed] Seeding initial data into TiDB Cloud...');
  try {
    // Insert site settings
    for (const [key, val] of Object.entries(initialData.siteSettings)) {
      await query(`INSERT INTO site_settings (setting_key, setting_value, value_type) VALUES (?, ?, 'string') ON DUPLICATE KEY UPDATE setting_value = ?`, [key, val, val]);
    }
    console.log('[Seed] Site settings seeded.');

    // Insert admin
    const admin = initialData.admins[0];
    await query(`INSERT INTO admins (email, full_name, role) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE full_name = VALUES(full_name)`, [admin.email, admin.full_name, admin.role]);
    console.log('[Seed] Admin user seeded:', admin.email);

    // Insert projects
    for (const p of initialData.projects) {
      await query(`
        INSERT INTO projects (slug, title, short_summary, full_content, problem, solution, my_role, architecture_details, challenges, results_metrics, lessons_learned, preview_type, preview_url, github_repo_url, category, is_featured, is_published, display_order)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE title = VALUES(title), short_summary = VALUES(short_summary)
      `, [p.slug, p.title, p.short_summary, p.full_content, p.problem, p.solution, p.my_role, p.architecture_details, p.challenges, p.results_metrics, p.lessons_learned, p.preview_type, p.preview_url, p.github_repo_url, p.category, p.is_featured ? 1 : 0, p.is_published ? 1 : 0, p.display_order]);
    }
    console.log(`[Seed] Seeded ${initialData.projects.length} featured engineering case studies into TiDB.`);

    // Insert skill categories and skills
    for (const cat of initialData.skillCategories) {
      await query(`INSERT INTO skill_categories (id, name, display_order) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE name = VALUES(name)`, [cat.id, cat.name, cat.display_order]);
    }
    for (const s of initialData.skills) {
      await query(`INSERT INTO skills (id, category_id, name, icon_name, display_order, is_core) VALUES (?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE name = VALUES(name)`, [s.id, s.category_id, s.name, s.icon_name, s.display_order, s.is_core ? 1 : 0]);
    }
    console.log(`[Seed] Seeded ${initialData.skills.length} skills across categories.`);

    // Insert education
    for (const edu of initialData.education) {
      await query(`INSERT INTO education (id, degree, institution, location, start_year, end_year, grade_or_gpa, display_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE degree = VALUES(degree)`, [edu.id, edu.degree, edu.institution, edu.location, edu.start_year, edu.end_year, edu.grade_or_gpa, edu.display_order]);
    }

    // Insert experience
    for (const exp of initialData.experiences) {
      await query(`INSERT INTO experiences (id, role, company, location, employment_type, start_date, is_current, description, achievements, display_order, is_published) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE role = VALUES(role)`, [exp.id, exp.role, exp.company, exp.location, exp.employment_type, exp.start_date, exp.is_current ? 1 : 0, exp.description, JSON.stringify(exp.achievements), exp.display_order, exp.is_published ? 1 : 0]);
    }

    // Insert certifications
    try {
      for (const cert of initialData.certifications) {
        await query(`INSERT INTO certifications (id, name, issuer, issue_date, display_order) VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE name = VALUES(name)`, [cert.id, cert.name, cert.issuer, cert.issue_date, cert.display_order]);
      }
    } catch (e) {
      console.log('[Seed] Note: certifications table not present or handled via in-memory store.');
    }

    console.log('[Seed] Seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('[Seed] Error during database seed:', error);
    process.exit(1);
  }
}

seedDatabase();
