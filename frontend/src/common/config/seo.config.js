// Central SEO & Identity Configuration for Portfolio
// Source of truth for personal identity, canonical domain, and social profile associations

export const SEO_CONFIG = {
  // Production canonical site URL (Never use trailing slash)
  siteUrl: (import.meta.env.VITE_SITE_URL || 'https://my-profile-seven-murex.vercel.app').replace(/\/+$/, ''),

  // Canonical Identity
  siteName: 'Pushkara Sai Vardhan Kagitha Portfolio',
  personName: 'Kagitha Pushkara Sai Vardhan',
  shortName: 'Pushkara',
  givenName: 'Pushkara Sai Vardhan',
  familyName: 'Kagitha',
  jobTitle: 'Software Engineer | Frontend & MERN Stack Developer',
  headline: 'Frontend & MERN Stack Developer | UI Developer',
  description: 'Official portfolio and technical case studies of Kagitha Pushkara Sai Vardhan — Software Engineer specializing in React.js, JavaScript, Tailwind CSS, Node.js, Express, MongoDB, and UI/UX systems.',
  
  // Authoritative Profile Image
  profileImage: 'https://res.cloudinary.com/cq7auu5w/image/upload/profile_cakhrj.png',
  defaultOgImage: 'https://res.cloudinary.com/cq7auu5w/image/upload/profile_cakhrj.png',

  // Authoritative Social & Identity Profiles (sameAs)
  linkedinUrl: 'https://www.linkedin.com/in/pushkara-sai-vardhan-kagitha-2345b5283',
  githubUrl: 'https://github.com/pushkar-0553',
  contactEmail: 'kagithapushkara@gmail.com',
  phone: '+91 7842770553',

  // Professional Affiliations & Education
  currentEmployer: {
    name: 'VCube Software Solutions',
    role: 'Software Engineer — Frontend Developer | MERN Stack Developer',
    location: 'Hyderabad, India'
  },
  alumniOf: {
    name: 'Usharama College of Engineering and Technology',
    degree: 'B.Tech in Computer Science & Engineering'
  },
  skills: [
    'React.js',
    'JavaScript (ES6+)',
    'TypeScript',
    'HTML5',
    'CSS3',
    'Tailwind CSS',
    'Node.js',
    'Express.js',
    'MongoDB',
    'MySQL',
    'TiDB Cloud',
    'Figma',
    'REST APIs',
    'Git & GitHub',
    'Agile / Scrum',
    'UI/UX Design'
  ],

  // Known legacy slug redirects (old slug -> new canonical slug)
  slugRedirects: {
    'ecommerce-platform': 'distributed-ecommerce-platform',
    'invoice-automation': 'rpa-invoice-automation-pipeline',
    'design-system': 'modular-component-design-system'
  }
};
