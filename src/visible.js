/*
 * visible.js
 * A lightweight, modern library to detect when elements become visible or invisible in the viewport
 *
 * @author Hassan Raza <razahassan554@gmail.com>
 * https://github.com/Hassanrkbiz/visible
 * @version 1.0.3
 * @license MIT
 * @copyright Hassan Raza 2025
 */

(function (global, factory) {
    "use strict";

    var Visible = factory(global);

    // Expose to CommonJS/Node.js
    if (typeof module === "object" && typeof module.exports === "object") {
      module.exports = Visible;
    } 
    // Expose to AMD
    else if (typeof define === "function" && define.amd) {
      define([], function() { return Visible; });
    } 
    // Expose to browser globals
    else {
      global.Visible = Visible;
    }
  })(typeof window !== "undefined" ? window : this, function (window) {
    "use strict";
  
    // Early exit if no window object (server-side rendering)
    if (!window || typeof window !== "object") {
      return {};
    }
  
    // Feature detection with polyfill suggestion
    if (!window.IntersectionObserver) {
      console.warn(
        "visible.js: IntersectionObserver is not supported. Consider using a polyfill: https://github.com/w3c/IntersectionObserver/tree/master/polyfill"
      );
      return {};
    }
  
    // Modern utility functions
    const utils = {
      /**
       * Convert various input types to array of elements
       * @param {*} elements - Element, NodeList, HTMLCollection, or Array
       * @returns {Element[]} Array of DOM elements
       */
      toElementsArray(elements) {
        if (!elements) return [];
        if (elements instanceof Element) return [elements];
        if (elements === window || elements === document)
          return [document.documentElement];
        if (elements instanceof NodeList || elements instanceof HTMLCollection) {
          return Array.from(elements);
        }
        return Array.isArray(elements)
          ? elements.filter((el) => el instanceof Element)
          : [];
      },
  
      /**
       * Deep merge objects with type checking
       * @param {Object} target - Target object
       * @param {...Object} sources - Source objects
       * @returns {Object} Merged object
       */
      mergeOptions(target, ...sources) {
        const result = { ...target };
  
        sources.forEach((source) => {
          if (source && typeof source === "object") {
            Object.keys(source).forEach((key) => {
              if (source[key] !== undefined) {
                result[key] = source[key];
              }
            });
          }
        });
  
        return result;
      },
  
      /**
       * Throttle function execution
       * @param {Function} func - Function to throttle
       * @param {number} limit - Throttle limit in milliseconds
       * @returns {Function} Throttled function
       */
      throttle(func, limit) {
        let inThrottle;
        return function (...args) {
          if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => (inThrottle = false), limit);
          }
        };
      },
  
      /**
       * Validate threshold value
       * @param {number|number[]} threshold - Threshold value(s)
       * @returns {number[]} Valid threshold array
       */
      validateThreshold(threshold) {
        if (Array.isArray(threshold)) {
          return threshold.filter(
            (t) => typeof t === "number" && t >= 0 && t <= 1
          );
        }
        if (typeof threshold === "number" && threshold >= 0 && threshold <= 1) {
          return [threshold];
        }
        return [0];
      },
  
      /**
       * Create a unique identifier
       * @returns {string} Unique ID
       */
      createId() {
        return `visible_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      },
  
      /**
       * Query selector with error handling
       * @param {string} selector - CSS selector
       * @param {Element} root - Root element to search within
       * @returns {Element[]} Array of matching elements
       */
      querySelectorAll(selector, root = document) {
        try {
          return Array.from(root.querySelectorAll(selector));
        } catch (error) {
          console.error("visible.js: Invalid selector:", selector);
          return [];
        }
      },
  
      /**
       * Set up timeout for auto-unbinding
       * @param {Function} cleanup - Cleanup function
       * @param {number} timeout - Timeout in milliseconds
       * @param {Function} callback - Callback to call with null on timeout
       * @returns {number} Timeout ID
       */
      setupTimeout(cleanup, timeout, callback) {
        if (typeof timeout === "number" && timeout > 0) {
          return setTimeout(() => {
            cleanup();
            if (typeof callback === "function") {
              callback(null);
            }
          }, timeout);
        }
        return null;
      }
    };
  
    // Default configuration
    const DEFAULT_OPTIONS = {
      root: null,
      rootMargin: "0px",
      threshold: 0,
      once: false,
      selector: null,
      data: null,
      onVisible: null,
      onInvisible: null,
      onEnter: null,
      onLeave: null,
      debug: false,
    };
  
    // Document-level API options (simplified)
    const DEFAULT_DOCUMENT_OPTIONS = {
      existing: false,
      once: false,
      timeout: null
    };
  
    // Global registry for instances
    const instances = new Map();
    const documentWatchers = new Map();
  
    /**
     * Main Visible class
     */
    class Visible {
      constructor(options = {}) {
        this.id = utils.createId();
        this.options = utils.mergeOptions(DEFAULT_OPTIONS, options);
        this.observer = null;
        this.observedElements = new Map();
        this.isDestroyed = false;
  
        // Validate and normalize threshold
        this.options.threshold = utils.validateThreshold(this.options.threshold);
  
        this._initialize();
        instances.set(this.id, this);
      }
  
      /**
       * Initialize the IntersectionObserver
       * @private
       */
      _initialize() {
        if (this.isDestroyed) return;
  
        const observerOptions = {
          root: this.options.root,
          rootMargin: this.options.rootMargin,
          threshold: this.options.threshold,
        };
  
        this._debug("Initializing observer with options:", observerOptions);
  
        this.observer = new IntersectionObserver(
          this._handleIntersection.bind(this),
          observerOptions
        );
      }
  
      /**
       * Handle intersection events
       * @private
       */
      _handleIntersection(entries) {
        if (this.isDestroyed) return;
  
        entries.forEach((entry) => {
          const element = entry.target;
          const elementData = this.observedElements.get(element);
  
          if (!elementData) return;
  
          elementData.callbacks.forEach((callbackData) => {
            this._processCallback(entry, element, callbackData);
          });
        });
      }
  
      /**
       * Process individual callback
       * @private
       */
      _processCallback(entry, element, callbackData) {
        const { options, callback, state } = callbackData;
        const threshold = Array.isArray(options.threshold)
          ? options.threshold[0]
          : options.threshold;
  
        const isVisible =
          entry.isIntersecting && entry.intersectionRatio >= threshold;
        const wasVisible = state.wasVisible;
  
        // State change detection
        if (isVisible !== wasVisible) {
          state.wasVisible = isVisible;
  
          if (isVisible) {
            this._triggerCallback(
              callback,
              element,
              entry,
              options.data,
              "visible"
            );
            this._triggerCallback(
              options.onVisible,
              element,
              entry,
              options.data,
              "visible"
            );
            this._triggerCallback(
              options.onEnter,
              element,
              entry,
              options.data,
              "enter"
            );
            state.triggered = true;
          } else {
            this._triggerCallback(
              options.onInvisible,
              element,
              entry,
              options.data,
              "invisible"
            );
            this._triggerCallback(
              options.onLeave,
              element,
              entry,
              options.data,
              "leave"
            );
          }
  
          // Handle once option
          if (options.once && state.triggered) {
            this.unobserve(element, callback);
          }
        }
      }
  
      /**
       * Trigger callback with error handling
       * @private
       */
      _triggerCallback(callback, element, entry, data, type) {
        if (typeof callback !== "function") return;
  
        try {
          callback.call(element, element, entry, data);
          this._debug(`Triggered ${type} callback for element:`, element);
        } catch (error) {
          console.error(`visible.js: Error in ${type} callback:`, error);
        }
      }
  
      /**
       * Debug logging
       * @private
       */
      _debug(...args) {
        if (this.options.debug) {
          console.log("[visible.js]", ...args);
        }
      }
  
      /**
       * Observe elements
       * @param {Element|Element[]} elements - Elements to observe
       * @param {Object} options - Observer options
       * @param {Function} callback - Callback function
       * @returns {Visible} This instance for chaining
       */
      observe(elements, options = {}, callback) {
        if (this.isDestroyed) {
          console.warn("visible.js: Cannot observe on destroyed instance");
          return this;
        }
  
        const elementsArray = utils.toElementsArray(elements);
        const mergedOptions = utils.mergeOptions(this.options, options);
  
        elementsArray.forEach((element) => {
          if (!(element instanceof Element)) return;
  
          const callbackData = {
            callback,
            options: mergedOptions,
            state: {
              wasVisible: false,
              triggered: false,
            },
          };
  
          if (!this.observedElements.has(element)) {
            this.observedElements.set(element, { callbacks: [] });
            this.observer.observe(element);
          }
  
          this.observedElements.get(element).callbacks.push(callbackData);
          this._debug("Observing element:", element);
        });
  
        return this;
      }
  
      /**
       * Stop observing elements
       * @param {Element|Element[]} elements - Elements to unobserve
       * @param {Function} [callback] - Specific callback to remove
       * @returns {Visible} This instance for chaining
       */
      unobserve(elements, callback) {
        if (this.isDestroyed) return this;
  
        const elementsArray = utils.toElementsArray(elements);
  
        elementsArray.forEach((element) => {
          const elementData = this.observedElements.get(element);
          if (!elementData) return;
  
          if (callback) {
            // Remove specific callback
            elementData.callbacks = elementData.callbacks.filter(
              (cb) => cb.callback !== callback
            );
  
            if (elementData.callbacks.length === 0) {
              this.observer.unobserve(element);
              this.observedElements.delete(element);
            }
          } else {
            // Remove all callbacks for this element
            this.observer.unobserve(element);
            this.observedElements.delete(element);
          }
  
          this._debug("Unobserving element:", element);
        });
  
        return this;
      }
  
      /**
       * Check if element is currently visible
       * @param {Element} element - Element to check
       * @returns {boolean} True if element is visible
       */
      isVisible(element) {
        const elementData = this.observedElements.get(element);
        return elementData
          ? elementData.callbacks.some((cb) => cb.state.wasVisible)
          : false;
      }
  
      /**
       * Get all observed elements
       * @returns {Element[]} Array of observed elements
       */
      getObservedElements() {
        return Array.from(this.observedElements.keys());
      }
  
      /**
       * Update options for existing observations
       * @param {Object} options - New options
       * @returns {Visible} This instance for chaining
       */
      updateOptions(options) {
        this.options = utils.mergeOptions(this.options, options);
  
        // Recreate observer with new options
        this.disconnect();
        this._initialize();
  
        // Re-observe all elements
        this.observedElements.forEach((_, element) => {
          this.observer.observe(element);
        });
  
        return this;
      }
  
      /**
       * Disconnect and clean up
       * @returns {Visible} This instance for chaining
       */
      disconnect() {
        if (this.observer) {
          this.observer.disconnect();
          this.observer = null;
        }
        this.observedElements.clear();
        return this;
      }
  
      /**
       * Destroy instance completely
       */
      destroy() {
        this.disconnect();
        instances.delete(this.id);
        this.isDestroyed = true;
        this._debug("Instance destroyed");
      }
    }
  
    /**
     * Document Watcher class for monitoring DOM changes
     */
    class DocumentWatcher {
      constructor(selector, options, callback) {
        this.id = utils.createId();
        this.selector = selector;
        this.options = utils.mergeOptions(DEFAULT_DOCUMENT_OPTIONS, options);
        this.callback = callback;
        this.visibleInstance = null;
        this.mutationObserver = null;
        this.timeoutId = null;
        this.processedElements = new Set();
        this.isDestroyed = false;
  
        this._initialize();
      }
  
      /**
       * Initialize the watcher
       * @private
       */
      _initialize() {
        // Create visible instance for intersection observation
        this.visibleInstance = new Visible({
          root: this.options.root || null,
          rootMargin: this.options.rootMargin || "0px",
          threshold: this.options.threshold || 0,
          once: this.options.once || false,
          debug: this.options.debug || false
        });
  
        // Handle existing elements if requested
        if (this.options.existing) {
          this._processExistingElements();
        }
  
        // Set up mutation observer for new elements
        this._setupMutationObserver();
  
        // Set up timeout if specified
        if (this.options.timeout) {
          this.timeoutId = utils.setupTimeout(
            () => this.destroy(),
            this.options.timeout,
            this.callback
          );
        }
      }
  
      /**
       * Process existing elements in the DOM
       * @private
       */
      _processExistingElements() {
        const existingElements = utils.querySelectorAll(this.selector);
        existingElements.forEach(element => {
          this._observeElement(element);
        });
      }
  
      /**
       * Set up mutation observer for DOM changes
       * @private
       */
      _setupMutationObserver() {
        const config = {
          childList: true,
          subtree: true
        };
  
        this.mutationObserver = new MutationObserver((mutations) => {
          mutations.forEach((mutation) => {
            if (mutation.type === 'childList') {
              mutation.addedNodes.forEach((node) => {
                if (node.nodeType === Node.ELEMENT_NODE) {
                  this._checkNewElement(node);
                }
              });
            }
          });
        });
  
        this.mutationObserver.observe(document.body || document.documentElement, config);
      }
  
      /**
       * Check if new element or its descendants match the selector
       * @private
       */
      _checkNewElement(element) {
        // Check the element itself
        if (element.matches && element.matches(this.selector)) {
          this._observeElement(element);
        }
  
        // Check descendants
        if (element.querySelectorAll) {
          const descendants = utils.querySelectorAll(this.selector, element);
          descendants.forEach(descendant => {
            this._observeElement(descendant);
          });
        }
      }
  
      /**
       * Observe an element for visibility
       * @private
       */
      _observeElement(element) {
        if (this.isDestroyed) return;
  
        // Prevent duplicate processing
        if (this.processedElements.has(element)) {
          return;
        }
  
        this.processedElements.add(element);
  
        // Observe the element for visibility
        this.visibleInstance.observe(element, {
          once: this.options.once || false,
          data: this.options.data || null,
          onVisible: this.options.onVisible || null,
          onInvisible: this.options.onInvisible || null,
          onEnter: this.options.onEnter || null,
          onLeave: this.options.onLeave || null
        }, (visibleElement) => {
          try {
            this.callback(visibleElement);
            
            // If once is true, clean up after first trigger
            if (this.options.once) {
              this.destroy();
            }
          } catch (error) {
            console.error("visible.js: Error in document.visible callback:", error);
          }
        });
      }
  
      /**
       * Destroy the watcher
       */
      destroy() {
        if (this.isDestroyed) return;
  
        this.isDestroyed = true;
  
        if (this.visibleInstance) {
          this.visibleInstance.destroy();
          this.visibleInstance = null;
        }
  
        if (this.mutationObserver) {
          this.mutationObserver.disconnect();
          this.mutationObserver = null;
        }
  
        if (this.timeoutId) {
          clearTimeout(this.timeoutId);
          this.timeoutId = null;
        }
  
        documentWatchers.delete(this.id);
      }
    }
  
    // Static methods
    Visible.create = function (options) {
      return new Visible(options);
    };
  
    Visible.destroyAll = function () {
      instances.forEach((instance) => instance.destroy());
      instances.clear();
      documentWatchers.forEach((watcher) => watcher.destroy());
      documentWatchers.clear();
    };
  
    Visible.getInstances = function () {
      return Array.from(instances.values());
    };
  
    Visible.getDocumentWatchers = function () {
      return Array.from(documentWatchers.values());
    };
  
    // Document-level API
    if (typeof document !== "undefined") {
      /**
       * Watch for elements matching a selector to become visible
       * @param {string} selector - CSS selector
       * @param {Object} options - Configuration options
       * @param {Function} callback - Callback function
       * @returns {Object} Watcher object with destroy method
       */
      document.visible = function (selector, options, callback) {
        // Handle overloaded parameters
        if (typeof options === "function") {
          callback = options;
          options = {};
        }
  
        const watcher = new DocumentWatcher(selector, options, callback);
        documentWatchers.set(watcher.id, watcher);
  
        return {
          destroy: () => watcher.destroy(),
          id: watcher.id
        };
      };
  
      /**
       * Watch for elements matching a selector to become invisible
       * @param {string} selector - CSS selector
       * @param {Object} options - Configuration options
       * @param {Function} callback - Callback function
       * @returns {Object} Watcher object with destroy method
       */
      document.invisible = function (selector, options, callback) {
        // Handle overloaded parameters
        if (typeof options === "function") {
          callback = options;
          options = {};
        }
  
        // Create a wrapper that triggers on invisible events
        const invisibleCallback = (element) => {   
          // We need to set up a separate observer for invisible events
          const invisibleInstance = new Visible({
            onInvisible: callback,
            debug: options.debug || false
          });
          invisibleInstance.observe(element);
        };
  
        const watcher = new DocumentWatcher(selector, options, invisibleCallback);
        documentWatchers.set(watcher.id, watcher);
  
        return {
          destroy: () => watcher.destroy(),
          id: watcher.id
        };
      };
  
      /**
       * Stop watching for visible elements
       * @param {string} selector - CSS selector
       */
      document.unobserveVisible = function (selector) {
        documentWatchers.forEach((watcher) => {
          if (watcher.selector === selector) {
            watcher.destroy();
          }
        });
      };
    }
  
    // Enhanced DOM API
    const INSTANCE_KEY = "_visibleInstance";

    // Enhanced DOM API
    if (typeof Element !== "undefined") {
      Element.prototype.visible = function (options, callback) {
        if (typeof options === "function") {
          callback = options;
          options = {};
        }

        if (!this[INSTANCE_KEY]) {
          this[INSTANCE_KEY] = new Visible(options);
        }

        return this[INSTANCE_KEY].observe(this, options, callback);
      };

      Element.prototype.invisible = function (options, callback) {
        if (typeof options === "function") {
          callback = options;
          options = {};
        }

        const invisibleOptions = utils.mergeOptions(options, { onInvisible: callback });

        if (!this[INSTANCE_KEY]) {
          this[INSTANCE_KEY] = new Visible(invisibleOptions);
        }

        return this[INSTANCE_KEY].observe(this, invisibleOptions);
      };

      Element.prototype.unobserveVisible = function (callback) {
        if (this[INSTANCE_KEY]) {
          this[INSTANCE_KEY].unobserve(this, callback);
        }
        return this;
      };

      Element.prototype.isElementVisible = function () {
        return this[INSTANCE_KEY] ? this[INSTANCE_KEY].isVisible(this) : false;
      };
    }

    // jQuery plugin (if available)
    if (typeof window.jQuery !== "undefined") {
      const $ = window.jQuery;

      $.fn.visible = function (options, callback) {
        return this.each(function () {
          if (typeof options === "function") {
            callback = options;
            options = {};
          }
          if (!this[INSTANCE_KEY]) {
            this[INSTANCE_KEY] = new Visible(options);
          }
          this[INSTANCE_KEY].observe(this, options, callback);
        });
      };

      $.fn.invisible = function (options, callback) {
        return this.each(function () {
          if (typeof options === "function") {
            callback = options;
            options = {};
          }
          const invisibleOptions = utils.mergeOptions(options, { onInvisible: callback });
          if (!this[INSTANCE_KEY]) {
            this[INSTANCE_KEY] = new Visible(invisibleOptions);
          }
          this[INSTANCE_KEY].observe(this, invisibleOptions);
        });
      };

      $.fn.unobserveVisible = function (callback) {
        return this.each(function () {
          if (this[INSTANCE_KEY]) {
            this[INSTANCE_KEY].unobserve(this, callback);
          }
        });
      };

      $.fn.isVisible = function () {
        return this.length > 0 && this[0].isElementVisible();
      };
    }
  
    // Module pattern - clean return
    return Visible;
  });
  
  // TypeScript definitions (if using TypeScript)
  if (typeof module !== "undefined" && module.exports) {
    module.exports.Visible = module.exports;
  }