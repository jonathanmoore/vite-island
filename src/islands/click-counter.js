class ClickCounter extends HTMLElement {
  constructor() {
    super();
    this.count = 0;
    console.log("ClickCounter loaded", this);
  }

  connectedCallback() {
    // Find elements within the component
    this.buttonElement = this.querySelector("button");
    this.counterElement = this.querySelector("[data-counter]");

    // Set initial state if counter element exists
    if (this.counterElement) {
      this.counterElement.textContent = this.count;
    }

    // Attach event listeners
    this.attachEvents();
  }

  attachEvents() {
    if (this.buttonElement) {
      this.buttonElement.addEventListener("click", () => {
        this.count++;

        // Update counter display
        if (this.counterElement) {
          this.counterElement.textContent = this.count;
        }

        // Dispatch a custom event
        this.dispatchEvent(
          new CustomEvent("counter-updated", {
            detail: { count: this.count },
            bubbles: true,
          }),
        );
      });
    }
  }

  // Method to reset the counter (useful for testing)
  resetCounter() {
    this.count = 0;
    if (this.counterElement) {
      this.counterElement.textContent = "0";
    }
    return this.count;
  }

  // Method to get current count (useful for testing)
  getCount() {
    return this.count;
  }
}

// Register the component if not already registered
if (!customElements.get("click-counter")) {
  customElements.define("click-counter", ClickCounter);
  console.log("click-counter component registered");
}
