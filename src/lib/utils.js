/**
 * Slides text in/out with a directional animation, supporting multiple pending changes
 */
export function slideText(element, newText, options = {}) {
  const { speed = 200, direction = "up" } = options;

  return new Promise((resolve) => {
    // Find or create the animation container
    let container = element.querySelector(".slide-container");
    if (!container) {
      container = document.createElement("div");
      container.className = "slide-container";
      container.style.position = "relative";
      container.style.overflow = "hidden";
      container.style.height = `${element.offsetHeight}px`;

      // Create initial text element
      const currentTextEl = document.createElement("div");
      currentTextEl.style.position = "absolute";
      currentTextEl.style.width = "100%";
      currentTextEl.style.transform = "translateY(0)";
      currentTextEl.textContent = element.textContent;
      container.appendChild(currentTextEl);

      element.textContent = "";
      element.appendChild(container);
    }

    // Get all existing text elements and their positions
    const textElements = Array.from(container.children);
    const lastElement = textElements[textElements.length - 1];
    const currentPosition = lastElement
      ? parseInt(lastElement.style.transform.match(/-?\d+/) || 0)
      : 0;

    // Calculate adjusted speed based on distance to travel
    const elementCount = textElements.length + 1;
    const adjustedSpeed = Math.max(50, speed / elementCount); // Minimum 50ms for smoothness

    // Create new text element
    const newTextEl = document.createElement("div");
    newTextEl.style.position = "absolute";
    newTextEl.style.width = "100%";
    newTextEl.style.transition = `transform ${adjustedSpeed}ms ease-out`;
    newTextEl.textContent = newText;

    // Position the new element
    if (direction === "up") {
      newTextEl.style.transform = `translateY(${100}%)`;
      container.appendChild(newTextEl);
    } else {
      newTextEl.style.transform = `translateY(-${100}%)`;
      container.insertBefore(newTextEl, container.firstChild);
    }

    // Force reflow
    container.offsetHeight;

    // Calculate new positions for all elements
    textElements.forEach((el, index) => {
      const newPosition = direction === "up" ? -100 : 100;

      el.style.transition = `transform ${adjustedSpeed}ms ease-out`;
      el.style.transform = `translateY(${newPosition}%)`;
    });

    // Move new element to final position
    newTextEl.style.transform = "translateY(0)";

    // Cleanup after animation
    setTimeout(() => {
      // Only remove elements that have moved out of view
      textElements.forEach((el) => {
        const transform = el.style.transform;
        const position = parseInt(transform.match(/-?\d+/) || 0);
        if (Math.abs(position) >= 100) {
          el.remove();
        }
      });

      // Reset container if this was the last pending animation
      if (!element.dataset.hasPendingAnimations) {
        element.textContent = newText;
      }

      resolve();
    }, adjustedSpeed);
  });
}

/**
 * Text scrambling animation utility that transforms text character by character
 */
export function scrambleText(element, newText, options = {}) {
  const { speed = 200, permanent = false } = options;
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*+-{}[]<>?";
  const currentText = element.textContent;
  let startTime = null;
  let animationFrame = null;

  // Always create the sr-only span for the actual text
  const srOnlyText = document.createElement("span");
  srOnlyText.classList.add("sr-only");
  srOnlyText.textContent = newText;

  // Create the visual animation span
  const visualText = document.createElement("span");
  visualText.classList.add("not-sr-only");
  visualText.setAttribute("aria-hidden", "true");
  visualText.textContent = currentText;

  // Clear and setup the element
  element.textContent = "";
  element.appendChild(srOnlyText);
  element.appendChild(visualText);

  return new Promise((resolve) => {
    function scrambleText() {
      return currentText
        .split("")
        .map((char) => {
          if (char === " " || /[^a-zA-Z0-9]/.test(char)) return char;
          return chars[Math.floor(Math.random() * chars.length)];
        })
        .join("");
    }

    function update(timestamp) {
      if (!startTime) startTime = timestamp;
      const progress = permanent ? 0 : (timestamp - startTime) / speed;

      if (permanent || progress < 1) {
        if (permanent) {
          visualText.textContent = scrambleText();
        } else {
          const result = newText
            .split("")
            .map((char, i) => {
              if (char === " " || /[^a-zA-Z0-9]/.test(char)) return char;

              if (progress > 0.5) {
                const shouldReveal = Math.random() < (progress - 0.5) * 2;
                return shouldReveal
                  ? char
                  : chars[Math.floor(Math.random() * chars.length)];
              } else {
                return chars[Math.floor(Math.random() * chars.length)];
              }
            })
            .join("");

          visualText.textContent = result;
        }
        animationFrame = requestAnimationFrame(update);
      } else {
        if (!permanent) {
          element.textContent = newText;
        }
        resolve();
      }
    }

    animationFrame = requestAnimationFrame(update);
  });
}
