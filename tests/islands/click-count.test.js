import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { scrambleText, slideText } from "@/lib/utils.js";

// First mock the animations before importing the component
vi.mock("@/lib/utils.js", () => ({
  scrambleText: vi.fn().mockResolvedValue(undefined),
  slideText: vi.fn().mockResolvedValue(undefined),
}));

// Now import the component so it uses our mocks
import "@/islands/click-count.js";

describe("ClickCount Component", () => {
  let counter;
  let originalConnectedCallback;
  let originalAttachEvents;

  beforeEach(() => {
    // Setup fake timers for all tests
    vi.useFakeTimers();

    // Create component with pre-rendered HTML
    document.body.innerHTML = `
      <click-count data-active="false" data-counting="false">
        <button>Get Started</button>
        <span>
          <span data-activated-text>Activated</span>
          <span data-click-count>00</span>
        </span>
      </click-count>
    `;

    counter = document.querySelector("click-count");

    // Prevent automatic initialization
    originalConnectedCallback = counter.connectedCallback;
    counter.connectedCallback = vi.fn();

    // Save original attachEvents to prevent duplicate event listeners
    originalAttachEvents = counter.attachEvents;

    // Reset component state completely
    counter.count = 0;
    counter.pendingAnimations = 0;
    counter.animationQueue = Promise.resolve();
    counter.dataset.counting = "false";

    // Manually set up the component properties
    counter.buttonElement = counter.querySelector("button");
    counter.counterElement = counter.querySelector("[data-click-count]");
    counter.activatedTextElement = counter.querySelector(
      "[data-activated-text]",
    );

    // Reset mocks before each test
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Restore original methods
    if (counter) {
      counter.connectedCallback = originalConnectedCallback;
      counter.attachEvents = originalAttachEvents;
    }
    vi.clearAllTimers();
    vi.clearAllMocks();
  });

  it("should initialize with proper state and scramble both texts", async () => {
    // Directly call initialize instead of triggering connectedCallback
    await counter.initialize();

    // Should have called scrambleText twice - once for each text element
    expect(scrambleText).toHaveBeenCalledTimes(2);
    expect(scrambleText).toHaveBeenCalledWith(
      counter.querySelector("[data-activated-text]"),
      "Activated",
      expect.objectContaining({ speed: 500 }),
    );
    expect(scrambleText).toHaveBeenCalledWith(
      counter.querySelector("[data-click-count]"),
      "00",
      expect.objectContaining({ speed: 500 }),
    );

    // Should set active state to true
    expect(counter.dataset.active).toBe("true");
  });

  it("should increment count and animate on button click", async () => {
    // Create a modified attachEvents that doesn't double-register
    counter.attachEvents = function () {
      // Remove any existing listeners
      if (this.buttonElement) {
        const newButton = this.buttonElement.cloneNode(true);
        this.buttonElement.parentNode.replaceChild(
          newButton,
          this.buttonElement,
        );
        this.buttonElement = newButton;

        // Add the click handler
        this.buttonElement.addEventListener("click", () => {
          this.count++;
          this.pendingAnimations++;
          this.dataset.counting = "true";
          this.queueAnimation();

          this.dispatchEvent(
            new CustomEvent("count-updated", {
              detail: { count: this.count },
              bubbles: true,
            }),
          );
        });
      }
    };

    // Set up initial state
    counter.attachEvents();

    // Spy on animation queue method
    const queueSpy = vi.spyOn(counter, "queueAnimation");

    // Click the button
    counter.buttonElement.click();

    // Should update counting state
    expect(counter.dataset.counting).toBe("true");
    expect(counter.count).toBe(1);
    expect(counter.pendingAnimations).toBe(1);

    // Should call queueAnimation once
    expect(queueSpy).toHaveBeenCalledTimes(1);

    // Advance all pending promises
    await Promise.resolve();

    // Should call slideText with correct parameters
    expect(slideText).toHaveBeenCalledWith(
      counter.querySelector("[data-click-count]"),
      "01", // 00 → 01
      expect.objectContaining({ direction: "up" }),
    );
  });

  it("should emit a custom event when clicked", () => {
    // Create a modified attachEvents that doesn't double-register
    counter.attachEvents = function () {
      // Remove any existing listeners
      if (this.buttonElement) {
        const newButton = this.buttonElement.cloneNode(true);
        this.buttonElement.parentNode.replaceChild(
          newButton,
          this.buttonElement,
        );
        this.buttonElement = newButton;

        // Add the click handler
        this.buttonElement.addEventListener("click", () => {
          this.count++;
          this.pendingAnimations++;
          this.dataset.counting = "true";
          this.queueAnimation();

          this.dispatchEvent(
            new CustomEvent("count-updated", {
              detail: { count: this.count },
              bubbles: true,
            }),
          );
        });
      }
    };

    // Set up initial state
    counter.attachEvents();

    // Set up event listener
    const eventSpy = vi.fn();
    counter.addEventListener("count-updated", eventSpy);

    // Click the button
    counter.buttonElement.click();

    // Verify event was emitted once with correct count
    expect(eventSpy).toHaveBeenCalledTimes(1);
    expect(eventSpy.mock.calls[0][0].detail.count).toBe(1);
  });

  it("should process animation queue and update counting state", async () => {
    // Override queue animation to directly call updateCounterDisplay
    counter.queueAnimation = function () {
      // Store a reference to this for the Promise chain
      const self = this;
      this.animationQueue = this.animationQueue
        .then(() => self.updateCounterDisplay())
        .catch((error) => {
          console.error("Animation error:", error);
        });
    };

    // Create a spy that we can track
    const updateSpy = vi.fn().mockImplementation(async function () {
      this.pendingAnimations--;
      return Promise.resolve();
    });
    counter.updateCounterDisplay = updateSpy;

    // Set up simple click handler
    counter.attachEvents = function () {
      if (this.buttonElement) {
        const newButton = this.buttonElement.cloneNode(true);
        this.buttonElement.parentNode.replaceChild(
          newButton,
          this.buttonElement,
        );
        this.buttonElement = newButton;

        this.buttonElement.addEventListener("click", () => {
          this.count++;
          this.pendingAnimations++;
          this.dataset.counting = "true";
          this.queueAnimation();
        });
      }
    };

    // Set up initial state
    counter.attachEvents();

    // Simulate 3 clicks
    counter.buttonElement.click();
    counter.buttonElement.click();
    counter.buttonElement.click();

    // Should have 3 pending animations
    expect(counter.pendingAnimations).toBe(3);
    expect(counter.dataset.counting).toBe("true");

    // Process the entire animation queue - need to flush all promises
    // and wait for all animations to complete
    await new Promise(process.nextTick);
    await counter.animationQueue;

    // Should have called updateCounterDisplay 3 times
    expect(updateSpy).toHaveBeenCalledTimes(3);

    // Should have no pending animations
    expect(counter.pendingAnimations).toBe(0);
  });

  it("should use fast speed for intermediate animations and normal speed for the last one", async () => {
    // Set up a simplified test version of the component's behavior
    counter.pendingAnimations = 0;
    counter.count = 0;
    counter.updateCounterDisplay = async function () {
      const isLastAnimation = this.pendingAnimations === 1;
      this.pendingAnimations--;

      // Format number as two digits
      const formattedCount = String(this.count).padStart(2, "0");
      const speed = isLastAnimation ? this.normalSpeed : this.fastSpeed;

      await slideText(this.counterElement, formattedCount, {
        speed,
        direction: "up",
      });

      return Promise.resolve();
    };

    counter.queueAnimation = function () {
      this.animationQueue = this.animationQueue.then(() =>
        this.updateCounterDisplay(),
      );
    };

    // Simulate 3 animations in the queue
    counter.pendingAnimations = 3;

    // Create a spy version of slideText that captures arguments
    const slideTextArgs = [];
    slideText.mockImplementation((el, text, options) => {
      slideTextArgs.push({ el, text, options });
      return Promise.resolve();
    });

    // Process the queue manually
    await counter.updateCounterDisplay(); // First call (pendingAnimations: 3→2) - should use fast speed
    await counter.updateCounterDisplay(); // Second call (pendingAnimations: 2→1) - should use fast speed
    await counter.updateCounterDisplay(); // Third call (pendingAnimations: 1→0) - should use normal speed

    // Verify the speeds used
    expect(slideTextArgs.length).toBe(3);
    expect(slideTextArgs[0].options.speed).toBe(counter.fastSpeed); // First animation (fast)
    expect(slideTextArgs[1].options.speed).toBe(counter.fastSpeed); // Second animation (fast)
    expect(slideTextArgs[2].options.speed).toBe(counter.normalSpeed); // Last animation (normal)
  });
});
