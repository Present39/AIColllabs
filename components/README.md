# Dora Component - 3D Specialist

Een volledig toegankelijke React-component voor de Dora karakter (3D-specialist), voorbereid voor integratie met Figma-ontwerpen.

## Features

- ✅ **Volledig toegankelijk**: WCAG 2.1 compliant
- ✅ **Toetsenbord navigatie**: Tab, Enter, Spatie ondersteuning
- ✅ **Screen reader vriendelijk**: ARIA labels en roles
- ✅ **Figma-ready**: Placeholder voor eenvoudige integratie van ontwerpen
- ✅ **Responsief**: Werkt op alle schermgroottes
- ✅ **High contrast ondersteuning**: Voor gebruikers met visuele beperkingen
- ✅ **Reduced motion**: Respecteert gebruikers motion preferences

## Gebruik

```jsx
import Dora from './components/Dora.jsx';

// Basis gebruik
<Dora onClick={handleClick} />

// Met custom properties
<Dora 
  onClick={handleClick}
  ariaLabel="Dora 3D-specialist, klik voor functies"
  className="my-custom-class"
  tabIndex={0}
/>
```

## Props

| Prop | Type | Standaard | Beschrijving |
|------|------|-----------|--------------|
| `className` | string | `''` | Extra CSS classes |
| `tabIndex` | number | `0` | Tab volgorde voor toetsenbord navigatie |
| `ariaLabel` | string | `'Dora, 3D-specialist character'` | Toegankelijkheid label |
| `onClick` | function | `undefined` | Click event handler |

## CSS Module Klassen

De component gebruikt CSS modules voor styling. Belangrijkste klassen:

- `.dora` - Hoofd container
- `.doraContainer` - Interne layout container
- `.doraPlaceholder` - Placeholder voor Figma/3D content
- `.doraLabel` - Tekst labels

## Figma Integratie

De component is voorbereid voor Figma integratie via de `.doraPlaceholder` sectie. Vervang de placeholder content met:

1. **SVG**: Direct inline SVG code
2. **Figma components**: Via Figma API of export
3. **3D elements**: Three.js of andere 3D libraries

```jsx
// Voorbeeld Figma/SVG integratie
<div className={styles.doraPlaceholder}>
  <YourFigmaComponent />
  {/* of */}
  <svg>...</svg>
  {/* of */}
  <Canvas>...</Canvas>
</div>
```

## Toegankelijkheid

De component volgt alle WCAG 2.1 richtlijnen:

- **Toetsenbord ondersteuning**: Tab navigatie en Enter/Spatie activatie
- **Screen readers**: Juiste ARIA attributes en roles
- **Focus management**: Duidelijke focus indicators
- **High contrast**: Automatische aanpassing voor high contrast modus
- **Motion**: Respecteert prefers-reduced-motion

## Styling Aanpassen

Voor custom styling, gebruik CSS modules of styled-components:

```css
/* Custom CSS */
.customDora {
  /* Jouw custom styles */
}
```

```jsx
<Dora className="customDora" />
```

## Browser Ondersteuning

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## Design Richtlijnen

Volgt de richtlijnen uit `DESIGN.md`:
- Consistente kleuren en spacing
- Figma ontwerp referenties
- Toegankelijkheid prioriteit
- Pixel-perfect development ready