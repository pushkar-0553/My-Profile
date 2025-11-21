# My-Profile

Personal portfolio for **Kagitha Pushkara Sai Vardhan** showcasing experience, featured work, and a live GitHub projects explorer. The site is built as a fast, responsive static application that can be hosted on any static hosting provider (GitHub Pages, Netlify, Vercel, etc.).

## Features

1. **Hero & About sections** with animated headings (Typed.js) and highlighted skills/education timeline.
2. **Skills grid** with progress indicators and floating technology icons.
3. **Dynamic Projects section** that retrieves repositories directly from GitHub, complete with filtering, search, topics, and modal details.
4. **Contact form** powered by EmailJS for instant message delivery without a backend.
5. **Dark mode** and responsive navigation optimized for mobile & desktop.

## Technologies Used

| Layer | Technologies |
| --- | --- |
| Core | HTML5, CSS3, Vanilla JavaScript |
| Styling & Layout | Custom CSS modules (`styles.css`, `projects.css`), CSS Grid/Flexbox |
| UI/UX Enhancements | Google Fonts (Poppins), Boxicons, Unicons, ScrollReveal, Typed.js |
| Data & Logic | GitHub REST API v3 (public endpoints), Local Storage for theme persistence |
| Tooling | EmailJS Browser SDK |

## APIs & Services

- **GitHub REST API** – `projects.js` consumes `/users/:username/repos`, `/repos/:owner/:repo/contents/cover.png`, and `/repos/:owner/:repo/topics` to populate the Projects page. Optional authentication (personal access token) can be supplied via the `GITHUB_TOKEN` constant or `localStorage.github_token` to raise rate limits.
- **EmailJS** – The contact form in `main.js` sends messages using EmailJS service `service_yt3hg9w` and template `template_h3bdgej`. Update the public key (`emailjs.init`) and template IDs with your own credentials before deploying.

## Getting Started

1. **Clone** the repository
   ```bash
   git clone https://github.com/<your-username>/My-Profile.git
   cd My-Profile
   ```
2. **Configure (optional)**
   - Replace `GITHUB_USERNAME` (and optionally `GITHUB_TOKEN`) inside `projects.js` if you want to show a different GitHub profile.
   - Update EmailJS public key, service ID, and template ID in `main.js` to route contact form submissions to your inbox.
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
