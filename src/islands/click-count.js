import { scrambleText, slideText } from "../lib/utils.js";

class ClickCount extends HTMLElement {
  constructor() {
    super();
    this.count = 0;
    this.animationQueue = Promise.resolve();
    this.pendingAnimations = 0;
    this.normalSpeed = 300;
    this.fastSpeed = 100;
    this.countingResetDelay = 250; // Delay before resetting counting state
    console.log("ClickCount loaded", this);
  }

  async connectedCallback() {
    // Find elements within the component
    this.buttonElement = this.querySelector("button");
    this.counterElement = this.querySelector("[data-click-count]");
    this.activatedTextElement = this.querySelector("[data-activated-text]");

    // Set initial states
    this.dataset.active = "false";
    this.dataset.counting = "false";

    // Initial animations
    await this.initialize();

    // Attach event listeners
    this.attachEvents();
  }

  async initialize() {
    // Set initial state
    await Promise.all([
      // Scramble both the "Activated" text and the initial "00"
      scrambleText(this.activatedTextElement, "Activated", { speed: 500 }),
      scrambleText(this.counterElement, "00", { speed: 500 }),
    ]);

    // Show the component
    this.dataset.active = "true";
  }

  attachEvents() {
    if (this.buttonElement) {
      this.buttonElement.addEventListener("click", () => {
        this.count++;
        this.pendingAnimations++;
        this.dataset.counting = "true";
        this.queueAnimation();

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

  queueAnimation() {
    // Queue this animation to run after the previous one completes
    this.animationQueue = this.animationQueue
      .then(() => this.updateCounterDisplay())
      .catch((error) => {
        console.error("Animation error:", error);
        // Reset the queue on error
        this.animationQueue = Promise.resolve();
        this.pendingAnimations = 0;
        this.dataset.counting = "false";
      });
  }

  async updateCounterDisplay() {
    if (this.counterElement) {
      // Format number as two digits (00, 01, 02, etc.)
      const formattedCount = String(this.count).padStart(2, "0");

      // Determine if this is the last animation in the queue
      const isLastAnimation = this.pendingAnimations === 1;
      this.pendingAnimations = Math.max(0, this.pendingAnimations - 1);

      // Use normal speed for the last animation, fast speed for others
      const speed = isLastAnimation ? this.normalSpeed : this.fastSpeed;

      // Animate the counter using slideText
      await slideText(this.counterElement, formattedCount, {
        speed,
        direction: "up",
      });

      // Clean up any leftover animation elements
      const animationContainers = this.counterElement.querySelectorAll(
        'div[style*="position: relative"]',
      );
      animationContainers.forEach((container) => {
        if (container !== this.counterElement.firstElementChild) {
          container.remove();
        }
      });

      // Update counting state based on pending animations
      if (this.pendingAnimations === 0) {
        // Add delay before setting counting back to false
        await new Promise((resolve) =>
          setTimeout(resolve, this.countingResetDelay),
        );
        this.dataset.counting = "false";
      }
    }
  }

  disconnectedCallback() {
    // Clean up any remaining animation elements
    if (this.counterElement) {
      const animationContainers = this.counterElement.querySelectorAll(
        'div[style*="position: relative"]',
      );
      animationContainers.forEach((container) => container.remove());
    }
  }
}

// Register the component if not already registered
if (!customElements.get("click-count")) {
  customElements.define("click-count", ClickCount);
  console.log("click-count component registered");
}
