import { describe, it, expect, beforeEach, vi } from "vitest";
import "./click-counter.js";

describe("ClickCounter Component", () => {
  let counter;

  beforeEach(() => {
    // Create component with pre-rendered HTML
    document.body.innerHTML = `
      <click-counter>
        <button>Click me!</button>
        <span data-counter>0</span>
      </click-counter>
    `;

    counter = document.querySelector("click-counter");

    // Wait for component to be fully initialized
    return new Promise((resolve) => setTimeout(resolve, 0));
  });

  it("should start with a count of 0", () => {
    expect(counter.getCount()).toBe(0);
    const counterEl = counter.querySelector("[data-counter]");
    expect(counterEl.textContent).toBe("0");
  });

  it("should increment count when button is clicked", () => {
    const button = counter.querySelector("button");
    const counterEl = counter.querySelector("[data-counter]");

    // Click the button
    button.click();

    // Check the count was incremented
    expect(counter.getCount()).toBe(1);
    expect(counterEl.textContent).toBe("1");

    // Click again
    button.click();

    // Check count is now 2
    expect(counter.getCount()).toBe(2);
    expect(counterEl.textContent).toBe("2");
  });

  it("should emit a custom event when clicked", () => {
    // Set up event listener
    const eventSpy = vi.fn();
    counter.addEventListener("counter-updated", eventSpy);

    // Click the button
    const button = counter.querySelector("button");
    button.click();

    // Verify event was emitted
    expect(eventSpy).toHaveBeenCalledTimes(1);
    expect(eventSpy.mock.calls[0][0].detail.count).toBe(1);
  });

  it("should reset counter to 0", () => {
    // Click the button to increment
    const button = counter.querySelector("button");
    button.click();
    button.click();

    // Verify count is 2
    expect(counter.getCount()).toBe(2);

    // Reset the counter
    counter.resetCounter();

    // Verify count is back to 0
    expect(counter.getCount()).toBe(0);
    const counterEl = counter.querySelector("[data-counter]");
    expect(counterEl.textContent).toBe("0");
  });
});
