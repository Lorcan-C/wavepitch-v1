# Wavepitch Landing Page

A clean, minimal landing page for Wavepitch with waitlist functionality.

## Features

- 🎨 Exact same look and feel as the main app
- ✨ Rotating text animation
- 📧 Waitlist signup
- 🎭 Background image with opacity overlay
- 📱 Fully responsive design
- 🚀 Ready for Vercel deployment

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Deployment

### Vercel (Recommended)

1. Push this code to a new GitHub repository
2. Connect your GitHub repo to Vercel
3. Deploy automatically on every push

### Netlify

1. Build the project: `npm run build`
2. Drag the `dist` folder to Netlify
3. Or connect your GitHub repo for auto-deployment

## Customization

### Update Waitlist Service

Replace the placeholder waitlist submission in `src/components/LandingPage.tsx` with your actual service:

```typescript
// Replace this simulation
await new Promise(resolve => setTimeout(resolve, 2000));

// With your actual API call
const response = await fetch('/api/waitlist', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email })
});
```

### Change Rotating Words

Edit the `actionWords` array in `src/components/LandingPage.tsx`:

```typescript
const actionWords = ["explore?", "work through?", "discover?", "chat about?", "discuss?", "problem solve?", "brainstorm?"];
```

### Update Background Image

Replace `public/images/background.png` with your preferred background image.

## Tech Stack

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Lucide React** - Icons