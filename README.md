# visible.js
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![npm version](https://badge.fury.io/js/visible.js.svg)](https://www.npmjs.com/package/visible.js)
[![GitHub stars](https://img.shields.io/github/stars/Hassanrkbiz/visible.svg?style=social)](https://github.com/Hassanrkbiz/visible)

A lightweight, modern JavaScript library to detect when elements become visible or invisible in the viewport using the [Intersection Observer API](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API).

## Features

- 🚀 **Lightweight** - Small footprint with no dependencies
- 🎯 **Modern** - Built on the Intersection Observer API
- 🔧 **Flexible** - Multiple API patterns to suit different needs
- 📱 **Responsive** - Works with dynamic content and DOM changes
- 🔄 **Framework Agnostic** - Works with vanilla JS, jQuery, and any framework
- 🛡️ **Robust** - Comprehensive error handling and edge case management
- 🎨 **TypeScript Ready** - Includes TypeScript definitions

## Installation

### CDN
```html
<!-- Using jsDelivr -->
<script src="https://cdn.jsdelivr.net/npm/visible.js@1.0.0/dist/visible.min.js"></script>

<!-- Or download and include manually -->
<script src="path/to/visible.min.js"></script>
```

### NPM
```bash
npm install visible.js
```

### Download
Download [visible.min.js](https://raw.githubusercontent.com/Hassanrkbiz/visible/master/minified/visible.min.js)

## Quick Start

```javascript
// Basic usage - trigger when element becomes visible
document.visible('.my-element', (element) => {
  console.log('Element is now visible!', element);
});

// Using the class API
const observer = new Visible();
observer.observe(document.querySelector('.my-element'), (element) => {
  console.log('Element is visible!', element);
});

// Using the DOM API
document.querySelector('.my-element').visible((element) => {
  console.log('Element is visible!', element);
});
```

## API Reference

### Document API

#### `document.visible(selector, options, callback)`
Watch for elements matching a selector to become visible.

```javascript
// Basic usage
document.visible('.fade-in', (element) => {
  element.classList.add('animate');
});

// With options
document.visible('.lazy-load', {
  threshold: 0.5,
  once: true,
  existing: true
}, (element) => {
  loadImage(element);
});
```

#### `document.invisible(selector, options, callback)`
Watch for elements to become invisible.

```javascript
document.invisible('.video', (element) => {
  element.pause();
});
```

#### `document.unobserveVisible(selector)`
Stop watching for visible elements.

```javascript
document.unobserveVisible('.my-element');
```

### Class API

#### `new Visible(options)`
Create a new Visible instance.

```javascript
const observer = new Visible({
  threshold: 0.5,
  rootMargin: '10px',
  once: true
});
```

#### `observe(elements, options, callback)`
Start observing elements.

```javascript
observer.observe('.my-elements', {
  threshold: 0.3,
  data: { id: 'custom-data' }
}, (element, entry, data) => {
  console.log('Visible!', element, data);
});
```

#### `unobserve(elements, callback)`
Stop observing elements.

```javascript
observer.unobserve('.my-elements');
```

#### `isVisible(element)`
Check if an element is currently visible.

```javascript
const isVisible = observer.isVisible(element);
```

#### `destroy()`
Destroy the observer instance.

```javascript
observer.destroy();
```

### DOM API

#### `element.visible(options, callback)`
Watch for a specific element to become visible.

```javascript
document.querySelector('.my-element').visible((element) => {
  console.log('Element is visible!');
});
```

#### `element.invisible(options, callback)`
Watch for a specific element to become invisible.

```javascript
document.querySelector('.my-element').invisible((element) => {
  console.log('Element is invisible!');
});
```

#### `element.unobserveVisible(callback)`
Stop watching for visibility changes.

```javascript
element.unobserveVisible();
```

#### `element.isElementVisible()`
Check if element is currently visible.

```javascript
const isVisible = element.isElementVisible();
```

### jQuery Plugin

```javascript
// Watch for visibility
$('.my-elements').visible((element) => {
  $(element).addClass('animate');
});

// Watch for invisible
$('.my-elements').invisible((element) => {
  $(element).removeClass('animate');
});

// Check visibility
const isVisible = $('.my-element').isVisible();
```

## Configuration Options

### Observer Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `root` | Element | `null` | Root element for intersection |
| `rootMargin` | String | `"0px"` | Margin around root element |
| `threshold` | Number/Array | `0` | Intersection threshold(s) |
| `once` | Boolean | `false` | Trigger only once |
| `debug` | Boolean | `false` | Enable debug logging |

### Callback Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `onVisible` | Function | `null` | Called when element becomes visible |
| `onInvisible` | Function | `null` | Called when element becomes invisible |
| `data` | Any | `null` | Custom data passed to callbacks |

### Document API Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `existing` | Boolean | `false` | Process existing elements |
| `timeout` | Number | `null` | Auto-destroy after timeout |

## Examples

### Lazy Loading Images

```javascript
document.visible('img[data-src]', {
  threshold: 0.1,
  once: true,
  existing: true
}, (img) => {
  img.src = img.dataset.src;
  img.classList.add('loaded');
});
```

### Fade In Animations

```javascript
document.visible('.fade-in', {
  threshold: 0.3,
  once: true
}, (element) => {
  element.style.opacity = '1';
  element.style.transform = 'translateY(0)';
});
```

### Infinite Scroll

```javascript
document.visible('.load-more', {
  threshold: 1.0
}, (element) => {
  loadMoreContent().then(() => {
    element.scrollIntoView();
  });
});
```

### Video Auto-play/Pause

```javascript
const observer = new Visible({
  threshold: 0.5
});

observer.observe('video', {
  onVisible: (video) => video.play(),
  onInvisible: (video) => video.pause()
});
```

### Progress Tracking

```javascript
document.visible('.section', {
  threshold: [0, 0.25, 0.5, 0.75, 1.0]
}, (element, entry) => {
  const progress = Math.round(entry.intersectionRatio * 100);
  console.log(`Section ${element.id} is ${progress}% visible`);
});
```

### Dynamic Content

```javascript
// Watch for dynamically added elements
document.visible('.dynamic-content', {
  existing: false  // Only new elements
}, (element) => {
  initializeWidget(element);
});
```

## Browser Support

- Chrome 51+
- Firefox 55+
- Safari 12.1+
- Edge 15+
- iOS Safari 12.2+
- Android Chrome 51+

For older browsers, include the [IntersectionObserver polyfill](https://github.com/w3c/IntersectionObserver/tree/master/polyfill):

```html
<script src="https://polyfill.io/v3/polyfill.min.js?features=IntersectionObserver"></script>
```

## TypeScript Support

```typescript
import Visible from 'visible.js';

interface CustomData {
  id: string;
  priority: number;
}

const observer = new Visible({
  threshold: 0.5,
  once: true
});

observer.observe<CustomData>('.my-elements', {
  data: { id: 'custom', priority: 1 }
}, (element, entry, data) => {
  console.log(data.id, data.priority);
});
```

## Performance Tips

1. **Use appropriate thresholds** - Lower thresholds trigger more frequently
2. **Use `once: true`** for one-time events like lazy loading
3. **Batch DOM operations** in callbacks to avoid layout thrashing
4. **Clean up observers** when no longer needed
5. **Use `rootMargin`** to trigger callbacks before elements are fully visible

## Common Patterns

### Staggered Animations

```javascript
document.visible('.stagger-item', {
  threshold: 0.2,
  once: true
}, (element) => {
  const delay = Array.from(element.parentNode.children).indexOf(element) * 100;
  setTimeout(() => {
    element.classList.add('animate');
  }, delay);
});
```

### Scroll-triggered Counters

```javascript
document.visible('.counter', {
  threshold: 0.5,
  once: true
}, (element) => {
  const target = parseInt(element.dataset.target);
  animateCounter(element, 0, target, 2000);
});
```

### Conditional Loading

```javascript
document.visible('.expensive-widget', {
  threshold: 0.1,
  once: true
}, (element) => {
  if (window.innerWidth > 768) {
    loadDesktopWidget(element);
  } else {
    loadMobileWidget(element);
  }
});
```

## Error Handling

The library includes comprehensive error handling:

```javascript
// Callbacks are wrapped in try-catch
document.visible('.my-element', (element) => {
  // If this throws an error, it won't break the library
  throw new Error('Oops!');
});

// Invalid selectors are handled gracefully
document.visible('invalid>>>selector', (element) => {
  // This callback will never be called
});
```

## Debugging

Enable debug mode to see detailed logging:

```javascript
const observer = new Visible({
  debug: true
});

// Or for document API
document.visible('.my-element', {
  debug: true
}, callback);
```

## Contributing
#### Report a bug / Request a feature
If you want to report a bug or request a feature, use the [Issues](https://github.com/Hassanrkbiz/visible/issues) section. Before creating a new issue, search the existing ones to make sure that you're not creating a duplicate. When reporting a bug, be sure to include OS/browser version and steps/code to reproduce the bug, a [JSFiddle](http://jsfiddle.net/) would be great.

#### Development
If you want to contribute to arrive, here is the workflow you should use:

1. Fork the repository.
2. Clone the forked repository locally.
3. create and checkout a new feature branch to work upon.
4. Make your changes in that branch (the actual source file is `/src/visible.js`).
5. If sensible, add some jasmine tests in `/tests/spec/visibleSpec.js` file.
6. Make sure there are no regressions by executing the unit tests by opening the file `/tests/SpecRunner.html` in a browser. There is a button 'Run tests without jQuery' at the top left of th page, click that button to make sure that the tests passes without jQuery. Run the test cases in all major browsers.
7. Push the changes to your github repository.
8. Submit a pull request from your repo back to the original repository.
9. Once it is accepted, remember to pull those changes back into your develop branch!

## License

MIT License - see the [LICENSE](LICENSE) file for details.

---

**Star ⭐ this repository if you find it useful!**