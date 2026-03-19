# Routa Waitlist

## Getting Started

```bash
npm install
npm run dev
```

## Project Structure

```
routa-waitlist/
├── public/               ← Static assets (favicon, og-image, etc.)
│   └── favicon.svg
├── src/
│   ├── assets/           ← ✅ PUT YOUR IMAGES HERE
│   ├── waitlist/
│   │   └── waitlist.jsx  ← Main waitlist page component
│   ├── App.jsx
│   ├── main.jsx
│   ├── index.css         ← Tailwind directives
│   └── style.css         ← Custom global styles
├── index.html
├── package.json
├── tailwind.config.js
├── postcss.config.js
└── vite.config.js
```

## Adding Images

Place your images in `src/assets/`, then import them in your component:

```jsx
import heroBg from '../assets/hero.png'

<img src={heroBg} alt="Hero" />
```
