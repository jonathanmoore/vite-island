import { scrambleText, slideText } from "../lib/utils.js";

class ClickCount extends HTMLElement {
  constructor() {
    super();
    this.count = 0;
    this.animationQueue = Promise.resolve();
    this.pendingAnimations = 0;
    this.isAnimating = false;
    console.log("ClickCount loaded", this);
  }

  async connectedCallback() {
    // Find elements within the component
    this.buttonElement = this.querySelector("button");
    this.counterElement = this.querySelector("[data-click-count]");
    this.activatedTextElement = this.querySelector("[data-activated-text]");

    // Initial animations
    await this.initialize();

    // Attach event listeners
    this.attachEvents();
  }

  async initialize() {
    // Set initial state
    await Promise.all([
      // Scramble both the "Activated" text and the initial "00"
      scrambleText(this.activatedTextElement, "Activated", { speed: 1000 }),
      scrambleText(this.counterElement, "00", { speed: 1000 }),
    ]);

    // Show the component
    this.dataset.active = "true";
  }

  attachEvents() {
    if (this.buttonElement) {
      this.buttonElement.addEventListener("click", () => {
        this.count++;
        this.pendingAnimations++;

        // Mark that we have pending animations
        this.counterElement.dataset.hasPendingAnimations = "true";

        if (!this.isAnimating) {
          this.processAnimationQueue();
        }

        // Dispatch a custom event
        this.dispatchEvent(
          new CustomEvent("count-updated", {
            detail: { count: this.count },
            bubbles: true,
          }),
        );
      });
    }
  }

  async processAnimationQueue() {
    if (this.isAnimating) return;

    this.isAnimating = true;

    while (this.pendingAnimations > 0) {
      const currentCount = this.count - (this.pendingAnimations - 1);
      const formattedCount = String(currentCount).padStart(2, "0");

      try {
        await slideText(this.counterElement, formattedCount, {
          speed: 100,
          direction: "up",
        });

        this.pendingAnimations--;
      } catch (error) {
        console.error("Animation error:", error);
        break;
      }
    }

    // Reset state after all animations complete
    this.isAnimating = false;
    this.counterElement.dataset.hasPendingAnimations = "false";
  }

  disconnectedCallback() {
    // Clean up any remaining animation elements
    if (this.counterElement) {
      const container = this.counterElement.querySelector(".slide-container");
      if (container) {
        container.remove();
      }
      this.counterElement.textContent = String(this.count).padStart(2, "0");
    }
  }
}

// Register the component if not already registered
if (!customElements.get("click-count")) {
  customElements.define("click-count", ClickCount);
  console.log("click-count component registered");
}
