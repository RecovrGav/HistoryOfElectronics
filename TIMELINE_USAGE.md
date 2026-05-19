# Timeline Component - Usage Guide

## Overview
The timeline component has been implemented across all subpages (Early Electricity, Computers, Communications, and Full Timeline) with a responsive design that adapts between PC (horizontal) and mobile (vertical) views.

## How to Add Timeline Points

Each timeline is defined in an HTML file with a simple structure:

```html
<div class="timeline-container">
  <div class="timeline-track">
    <div class="timeline-edge-point start"></div>
    
    <!-- Add timeline points here -->
    <div class="timeline-point" 
         data-date="YEAR/DATE" 
         data-title="Event Title" 
         data-image="https://image-url.jpg"
         data-paragraph="Description paragraph text">
    </div>
    
    <div class="timeline-edge-point end"></div>
  </div>
  
  <div class="timeline-info">
    <div class="timeline-info-top">
      <p class="timeline-paragraph"></p>
      <div class="timeline-info-separator"></div>
      <div class="timeline-date"></div>
    </div>
    <div class="timeline-info-bottom">
      <h2 class="timeline-title"></h2>
      <img class="timeline-image" src="" alt="Timeline point image">
    </div>
  </div>
</div>
```

### Point Attributes

- **data-date**: The date or time period (e.g., "1800", "600 BC", "1920s")
- **data-title**: Event title that appears when focused
- **data-image**: URL to an image that displays when the point is focused
- **data-paragraph**: Description text that appears when the point is focused

### Adding a New Point

Simply add another `.timeline-point` element between the edge points:

```html
<div class="timeline-point" 
     data-date="2024" 
     data-title="New Innovation" 
     data-image="https://example.com/image.jpg"
     data-paragraph="This is a new milestone in electronics history.">
</div>
```

**Important**: The order of points in the HTML determines their left-to-right (PC) or top-to-bottom (mobile) position.

## Customizing Timeline Appearance

Edit the CSS variables in `styles.css` under the `:root` section:

```css
:root {
  --timeline-point-spacing: 280px;        /* Space between points */
  --timeline-thickness-pc: 3px;            /* Line thickness */
  --timeline-point-focused-size: 18px;    /* Expanded point size */
  --timeline-point-minimized-size: 8px;   /* Normal point size */
  --timeline-mobile-image-blur: 8px;      /* Mobile image blur */
  --timeline-mobile-image-darkness: 0.5;  /* Mobile image darkening (0-1) */
  --timeline-transition-duration: 400ms;  /* Animation speed */
  --timeline-edge-fade-width: 80px;       /* Edge fade width */
}
```

## View-Specific Behavior

### PC View (Desktop - 768px and wider)
- Horizontal timeline in the center of the screen
- Points expand when in focus (center horizontal position)
- Vertical scrolling controls horizontal timeline position
- Image and title display below the timeline
- Paragraph text displays above the timeline
- Fade effect at timeline edges (when timeline extends off-screen)

### Mobile View (Phones - below 768px)
- Vertical timeline on the left side
- Normal vertical page scrolling
- Points expand when in focus (center vertical position)
- No title display
- Image becomes blurred/darkened background
- Paragraph text displays to the right of timeline
- Date displays below paragraph text

## Styling Points Info

For PC view, you can adjust the info styling:

```css
.timeline-info-top {
  margin-bottom: 2rem;
  max-width: var(--timeline-info-max-width);  /* Adjust max width */
  text-align: center;
}

.timeline-paragraph {
  font-size: 1rem;
  line-height: 1.6;
}

.timeline-date {
  color: var(--muted);
  font-size: 0.9rem;
}

.timeline-title {
  font-size: 1.8rem;
  font-weight: 700;
}

.timeline-image {
  max-width: 500px;
  height: 300px;
}
```

## Edge Points

The timeline has two edge points (first and last):
- Larger than regular points (18px vs 8-18px)
- Do NOT display any info when focused
- Useful for visual balance and indicating timeline boundaries

## Hover Effects

- Timeline points become more opaque on hover when minimized
- Focused points show a subtle glow/shadow effect

## Back Button

- Fixed to bottom-left corner of screen
- Always visible and accessible
- Automatically created if a back link exists on the page
- Responsive (smaller on mobile)

## File Structure

```
/workspaces/HistoryOfElectronics/
├── index.html                    # Main page with timeline button
├── early-electricity.html        # 6-point timeline
├── computers.html                # 7-point timeline
├── communications.html           # 8-point timeline
├── timeline.html                 # 19-point full timeline
├── styles.css                    # Contains timeline CSS + customizable variables
├── timeline.js                   # Timeline component logic
└── script.js                     # Page initialization (hero backgrounds, etc.)
```

## Troubleshooting

### Timeline not showing
- Ensure `.timeline-container` and `.timeline-track` divs are present
- Check that `.timeline-point` elements have data attributes
- Verify `timeline.js` is loaded: `<script src="timeline.js"></script>`

### Points not expanding
- Check `--timeline-transition-duration` is appropriate
- Verify CSS media queries are loading correctly
- Check browser console for JavaScript errors

### Image not displaying
- Verify image URL is correct and accessible
- Check that `data-image` attribute has valid URL
- Mobile: Check image blur effect with `--timeline-mobile-image-blur`

### Info not updating
- Ensure focused point has all required data attributes
- Check that `.timeline-info` and child elements exist
- Verify script is loading (check console for errors)

### Back button not appearing
- Ensure there's an anchor tag with `href="index.html"` on the page
- Check z-index stacking context
- Verify `.back-button` CSS is loaded

## Best Practices

1. **Image URLs**: Use HTTPS URLs for better compatibility
2. **Paragraph Length**: Keep paragraphs concise (2-3 sentences recommended)
3. **Point Spacing**: Adjust `--timeline-point-spacing` based on number of points
4. **Mobile Testing**: Always test on mobile to ensure readability
5. **Performance**: Limit to ~20 points for best performance

## Customization Examples

### Larger Points
```css
--timeline-point-focused-size: 24px;
--timeline-point-minimized-size: 12px;
```

### Faster Animations
```css
--timeline-transition-duration: 200ms;
```

### Wider Info Section
```css
--timeline-info-max-width: 800px;
```

### More Spacing Between Points
```css
--timeline-point-spacing: 350px;
```

## Browser Support
- Chrome/Edge: Full support
- Firefox: Full support
- Safari: Full support (iOS 14+)
- IE11: Not supported (modern CSS features required)
