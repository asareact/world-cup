# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Claude Code Configuration

### Thinking Modes
- **think**: Use for standard problem-solving and planning
- **think_hard**: Use for complex architectural decisions and debugging
- **ultrathink**: Use for critical system design and performance optimization

### Auto-Edit Mode
- **auto_edit**: Enabled for rapid development and iterative improvements
- Automatically applies suggested changes when confidence is high
- Maintains code quality through automated linting and type checking

## Project Overview

This is a football tournament management application built with Next.js 15, TypeScript, and Tailwind CSS. The application allows users to create, manage, and track football tournaments with comprehensive statistics and real-time updates.

**Tech Stack:**
- Next.js 15 with App Router
- TypeScript
- Tailwind CSS v4
- Framer Motion for animations
- Lucide React for icons
- Deployment: Vercel

## Development Commands

```bash
# Development server with Turbopack
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Lint code
npm run lint
```

## Project Structure

```
src/
├── app/                 # Next.js App Router pages
│   ├── page.tsx        # Landing page
│   └── layout.tsx      # Root layout
├── lib/
│   └── utils.ts        # Utility functions (cn for className merging)
└── components/         # Reusable React components (to be created)
```

## Code Architecture

### Styling Approach
- Uses Tailwind CSS v4 for utility-first styling
- Custom utility function `cn()` in `src/lib/utils.ts` for conditional class merging
- Responsive design with mobile-first approach
- Color scheme: Green/blue gradient theme for football aesthetic

### Animation Strategy
- Framer Motion for page transitions and micro-interactions
- Staggered animations on component mounting
- Hover effects and scroll-triggered animations

### Component Patterns
- Functional components with TypeScript
- Client components marked with 'use client' directive when needed
- Props interfaces defined inline or as separate types

## Development Guidelines

### When adding new features:
1. Create components in `src/components/` with descriptive names
2. Use TypeScript interfaces for all props
3. Follow the established naming convention (PascalCase for components)
4. Implement responsive design patterns
5. Add appropriate animations for enhanced UX

### Database Integration (Future):
- Plan to integrate with SQL database for tournament data
- Consider using Prisma ORM for type-safe database operations
- Authentication will be required for tournament management

### Performance Considerations:
- Images should use Next.js Image component
- Implement lazy loading for heavy components
- Use dynamic imports for large dependencies
- Optimize for Core Web Vitals

## Deployment

The application is configured for Vercel deployment with:
- Automatic builds on git push
- Environment variables for database connections
- Static optimization where possible