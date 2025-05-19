# Vite Islands Architecture

A lightweight, modern boilerplate implementing the islands architecture pattern with Vite and vanilla JavaScript.

## What is Islands Architecture?

Islands architecture is a pattern where your page consists of mostly static HTML with isolated "islands" of interactivity. This approach:

- Provides excellent page load performance
- Delivers a complete experience even before JavaScript loads
- Hydrates components individually, rather than the entire page
- Allows loading components conditionally or lazily

## Core Concepts

### 1. Progressive Enhancement

Everything starts with HTML. All content is present in the initial HTML load, ensuring users without JavaScript still have a functional experience. JavaScript then "hydrates" specific components, adding interactivity.

```html
<!-- Example: A component that works without JS but gets enhanced -->
<click-count data-active="false" data-counting="false">
  <button>Get Started</button>
  <span>
    <span data-activated-text>Activated</span>
    <span data-click-count>00</span>
  </span>
</click-count>
```

### 2. Web Components

Custom elements provide encapsulation without frameworks:

```js
// Simplified component example
class ClickCount extends HTMLElement {
  connectedCallback() {
    // Find elements within the component
    this.buttonElement = this.querySelector("button");
    this.counterElement = this.querySelector("[data-click-count]");
    
    // Initialize and attach events
    this.attachEvents();
  }
}
customElements.define("click-count", ClickCount);
```

### 3. Conditional Loading

Components can load based on various conditions:

- `client:visible` - Load when the component becomes visible
- `client:media="(max-width: 767px)"` - Load only on specific media queries
- `client:idle` - Load when the browser is idle

```html
<!-- This component only loads on mobile devices -->
<click-counter 
  client:media="(max-width: 767px)" 
  class="...">
  <!-- Component content -->
</click-counter>
```

### 4. Micro-Animations

The boilerplate includes utility functions for subtle animations:

- **Text Scrambling**: Letters randomize before revealing the final text
- **Text Sliding**: Smooth transitions between different text values
- **State Transitions**: Color changes based on component state

These animations enhance the user experience without compromising performance.

### 5. Smart State Management

Components use data attributes for state management, allowing CSS to respond to state changes:

```html
<!-- Example of state-driven styling -->
<span class="... [[data-counting='false']_&]:bg-green-400 [[data-counting='true']_&]:bg-orange-400"></span>
```

## Components

### Click Counter

A basic counter that increments when clicked.

### Click Count

A more advanced counter with:
- Animated text transitions
- State-based styling
- Optimized animation queueing for rapid clicks
- Visual feedback during interactions

## Testing

Components are thoroughly tested using Vitest:

- Unit tests for component initialization
- Interaction tests for user actions
- Animation and state transition tests
- Queue processing tests for complex behaviors

```js
// Example test
it("should increment count and animate on button click", async () => {
  // Click the button
  counter.buttonElement.click();
  
  // Verify state changes
  expect(counter.dataset.counting).toBe("true");
  expect(counter.count).toBe(1);
  
  // Verify animations triggered
  expect(slideText).toHaveBeenCalled();
});
```

## Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run tests
npm run test

# Build for production
npm run build
```

## Learn More

- [Islands Architecture Explained](https://jasonformat.com/islands-architecture/)
- [Web Components MDN](https://developer.mozilla.org/en-US/docs/Web/API/Web_components)
- [Vite Documentation](https://vitejs.dev/)
