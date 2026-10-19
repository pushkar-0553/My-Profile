# My-Profile

Personal portfolio for **Kagitha Pushkara Sai Vardhan** showcasing experience, featured work, and a live GitHub projects explorer. The site is built as a fast, responsive static application that can be hosted on any static hosting provider (GitHub Pages, Netlify, Vercel, etc.).

## Features

1. **Hero & About sections** with animated headings (Typed.js) and highlighted skills/education timeline.
2. **Skills grid** with progress indicators and floating technology icons.
3. **Dynamic Projects section** that retrieves repositories directly from GitHub, complete with filtering, search, topics, and modal details.
4. **Contact form** connected to backend API and database with an admin visitor messages inbox.
5. **Dark mode** and responsive navigation optimized for mobile & desktop.

## Technologies Used

| Layer | Technologies |
| --- | --- |
| Core | HTML5, CSS3, Vanilla JavaScript, React (Vite) |
| Styling & Layout | Custom CSS modules (`styles.css`, `projects.css`), CSS Grid/Flexbox |
| UI/UX Enhancements | Google Fonts (Poppins), Boxicons, Unicons, ScrollReveal, Typed.js |
| Data & Logic | GitHub REST API v3, TiDB Cloud / MySQL Database |
| Backend | Node.js, Express, MySQL2, Passkey Auth |

## APIs & Services

- **GitHub REST API** – `projects.js` consumes `/users/:username/repos`, `/repos/:owner/:repo/contents/cover.png`, and `/repos/:owner/:repo/topics` to populate the Projects page. Optional authentication (personal access token) can be supplied via the `GITHUB_TOKEN` constant or `localStorage.github_token` to raise rate limits.
- **Visitor Messages** – The contact form posts visitor details directly to `/api/public/contact`, storing them securely in the database. All inquiries are immediately visible in the Admin CMS under `/admin/messages` (Visitor Messages).

## Getting Started

1. **Clone** the repository
   ```bash
   git clone https://github.com/<your-username>/My-Profile.git
   cd My-Profile
   ```
2. **Configure (optional)**
   - Replace `GITHUB_USERNAME` (and optionally `GITHUB_TOKEN`) inside `projects.js` if you want to show a different GitHub profile.
3. **Run locally**
   - Open `index.html` (or `projects.html`) directly in a browser, or serve the folder with any static server (e.g., `npx serve .`).

## Project Structure

```
My-Profile/
├── index.html          # Main portfolio page
├── projects.html       # Dedicated GitHub projects explorer
├── styles.css          # Global styles/theme
├── projects.css        # Projects-page specific styles
├── main.js             # Navigation, dark mode, animations, EmailJS wiring
├── projects.js         # GitHub API integration & modal logic
└── assets/             # Images, favicon, resume, etc.
```

## Customization Tips

- Replace placeholder social links and profile media in `index.html`.
- Add `cover.png` to individual GitHub repositories to show custom thumbnails inside the Projects grid.
- Adjust theme colors in `:root` within `styles.css`; dark-mode overrides live under the `.dark-mode` selector.

## Mailing Service Notes

- Requires an EmailJS account with a browser (public) API key.
- In `main.js`, update:
  ```js
  emailjs.init('YOUR_PUBLIC_KEY');
  emailjs.send('your_service_id', 'your_template_id', templateParams);
  ```
- Ensure the EmailJS template includes `name`, `reply_to`, and `message` variables as used in `templateParams`.

---

Feel free to fork and adapt this portfolio to your own branding. Contributions and suggestions are welcome!
