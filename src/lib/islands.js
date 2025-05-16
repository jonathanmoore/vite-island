function media({ query }) {
  const mediaQuery = window.matchMedia(query);
  return new Promise(function (resolve) {
    if (mediaQuery.matches) {
      resolve(true);
    } else {
      mediaQuery.addEventListener('change', resolve, { once: true });
    }
  });
}

function visible({ element }) {
  return new Promise(function (resolve) {
    const observer = new window.IntersectionObserver(async function (entries) {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          observer.disconnect();
          resolve(true);
          break;
        }
      }
    });
    observer.observe(element);
  });
}

function idle() {
  return new Promise(function (resolve) {
    if ('requestIdleCallback' in window) {
      window.requestIdleCallback(resolve);
    } else {
      setTimeout(resolve, 200);
    }
  });
}

// Get all island components
const islandModules = import.meta.glob([
  '/src/islands/*.js',
  '/src/islands/*/index.js',
  '/src/islands/*/*.js',
]);

// Track processed components
const processedComponents = new Set();

export function revive() {
  const observer = new window.MutationObserver((mutations) => {
    for (let i = 0; i < mutations.length; i++) {
      const { addedNodes } = mutations[i];
      for (let j = 0; j < addedNodes.length; j++) {
        const node = addedNodes[j];
        if (node.nodeType === 1) dfs(node);
      }
    }
  });

  async function dfs(node) {
    const tagName = node.tagName.toLowerCase();

    // Check if it's a custom element that hasn't been processed
    if (tagName.includes('-') && !processedComponents.has(tagName)) {
      // Possible paths for the component
      const possiblePaths = [
        `/src/islands/${tagName}.js`,
        `/src/islands/${tagName}/index.js`,
        `/src/islands/${tagName}/${tagName}.js`,
      ];

      // Find the first matching module
      let modulePath = null;
      for (const path of possiblePaths) {
        if (islandModules[path]) {
          modulePath = path;
          break;
        }
      }

      if (modulePath) {
        // Mark this component as processed
        processedComponents.add(tagName);

        // Check loading conditions
        if (node.hasAttribute('client:visible')) {
          await visible({ element: node });
        }

        const clientMedia = node.getAttribute('client:media');
        if (clientMedia) {
          await media({ query: clientMedia });
        }

        if (node.hasAttribute('client:idle')) {
          await idle();
        }

        // Import the module
        try {
          await islandModules[modulePath]();
          console.log(`Loaded island: ${tagName}`);
        } catch (error) {
          console.error(`Error loading island ${tagName}:`, error);
        }
      }
    }

    // Process children
    let child = node.firstElementChild;
    while (child) {
      dfs(child);
      child = child.nextElementSibling;
    }
  }

  // Initial scan
  dfs(document.body);

  // Watch for DOM changes
  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });

  return observer;
}
