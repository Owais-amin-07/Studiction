# 👨‍💻 Developer Reference Guide

## Quick Reference for Developers

### Project Type
- **Name**: Digital Clarity / Addiction Recovery App
- **Tech Stack**: React + TypeScript + Vite + Tailwind + Framer Motion
- **Frontend URL**: Starts on login page
 - **Frontend URL**: Starts on landing page

### Key Files

| File | Purpose | Status |
|------|---------|--------|
| `src/App.tsx` | Main router | ✅ Updated |

### Available Views
```typescript
type AppView = 'landing' | 'transition' | 'diagnostic' | 'reveal';
```

---

## Common Tasks

### How to Change Starting Page
**File**: `src/App.tsx`
```typescript
const [view, setView] = useState<AppView>('landing');
```

---

## Animation Customization

### Change Animation Duration
```typescript
// Current: 0.8s
initial={{ opacity: 0, y: 30 }}
animate={{ opacity: 1, y: 0 }}
transition={{ duration: 0.8, ease: 'easeOut' }}

// Change to: 1.2s
transition={{ duration: 1.2, ease: 'easeOut' }}
```

### Change Background Animation
```typescript
// Current: 8 second loop
animate={{
  scale: [1, 1.2, 1],
  opacity: [0.15, 0.25, 0.15],
}}
transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}

// Change to: 5 second loop
transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
```

### Add Custom Animation
```typescript
<motion.div
  initial={{ opacity: 0, scale: 0.8 }}
  animate={{ opacity: 1, scale: 1 }}
  transition={{ duration: 0.5, delay: 0.2 }}
  className="..."
>
  Your content
</motion.div>
```

---

## Styling Customization

### Tailwind Classes Used
- Glass effect: `backdrop-blur-xl bg-white/5 border border-white/10`
- Gradient: `bg-gradient-to-r from-[#48cfad] to-[#6c63ff]`
- Animations: `hover:scale-105 transition-all duration-300`
- Focus: `focus:ring-2 focus:ring-[#48cfad]/50`

### How to Change Glass Effect
```jsx
// Current: Hard to see
backdrop-blur-xl bg-white/5 border border-white/10

// More opaque:
backdrop-blur-xl bg-white/10 border border-white/20

// More transparent:
backdrop-blur-md bg-white/3 border border-white/5
```

---

## Performance Tips

1. **Avoid re-renders**: Use `useCallback` for event handlers
2. **Optimize animations**: Use `will-change` CSS property
3. **Debounce validation**: Add debounce for fast typers
4. **Lazy load**: Load components only when needed
5. **Memoize components**: Wrap with React.memo if needed

---

## Browser Console Debugging

### Enable Debug Logs
```typescript
console.log('Debugging message');
// ... rest of code
```

### Check Component State
```javascript
// In browser console:
// Use React DevTools to inspect component state
```

### Network Requests
- Open DevTools Network tab
- Look for API calls

---

## Common Errors & Solutions

### "Cannot find module"
**Error**: Module not found: can't resolve
**Solution**: Check imports in `src/App.tsx`
```typescript
// Correct:
import Landing from './components/Landing';

// Wrong:
import Landing from './Landing';  // Missing /components
```

### TypeScript Errors
**Error**: Type 'string' is not assignable to type...
**Solution**: Check interface definitions
```typescript
// Make sure interface matches state
interface MyComponentProps {
  data: string;
}
```

### "Unexpected token"
**Error**: SyntaxError: Unexpected token
**Solution**: Check JSX syntax and closing braces

### Animations Not Working
**Error**: Animations don't move or animate
**Solution**: 
1. Check Framer Motion is imported
2. Check animate props are set
3. Check browser supports CSS animations

---

## Dependencies

Already installed in package.json:
```json
{
  "react": "^19.2.0",
  "react-dom": "^19.2.0",
  "framer-motion": "^12.35.2",
  "lucide-react": "^0.577.0",
  "tailwindcss": "^4.2.1",
  "styled-components": "^6.4.1"
}
```

No additional packages needed!

---

## Contact & Support

For issues or questions:
1. Check browser console for errors
2. Review documentation files
3. Check TypeScript error messages
4. Verify all dependencies installed

Happy coding! 🚀
