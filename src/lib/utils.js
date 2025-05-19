/**
 * Slides text in/out with a directional animation
 */
export function slideText(element, newText, options = {}) {
  const { speed = 200, direction = "up" } = options;

  const container = document.createElement("div");
  container.style.position = "relative";
  container.style.overflow = "hidden";
  container.style.height = `${element.offsetHeight}px`;

  const currentText = element.textContent;

  const oldTextEl = document.createElement("div");
  const newTextEl = document.createElement("div");

  [oldTextEl, newTextEl].forEach((el) => {
    el.style.position = "absolute";
    el.style.width = "100%";
    el.style.transition = `transform ${speed}ms ease-in-out`;
  });

  oldTextEl.textContent = currentText;
  newTextEl.textContent = newText;

  oldTextEl.style.transform = "translateY(0)";
  newTextEl.style.transform = `translateY(${direction === "up" ? "100%" : "-100%"})`;

  container.appendChild(oldTextEl);
  container.appendChild(newTextEl);

  element.textContent = "";
  element.appendChild(container);

  // Force reflow
  container.offsetHeight;

  // Animate
  oldTextEl.style.transform = `translateY(${direction === "up" ? "-100%" : "100%"})`;
  newTextEl.style.transform = "translateY(0)";

  return new Promise((resolve) => {
    setTimeout(() => {
      element.textContent = newText;
      resolve();
    }, speed);
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
