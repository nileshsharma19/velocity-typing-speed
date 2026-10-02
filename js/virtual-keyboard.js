/**
 * VelocityType - Interactive Virtual On-Screen Keyboard
 * Renders QWERTY layout with keypress animations, finger color guides, and error heatmaps
 */

export class VirtualKeyboard {
  constructor(containerElement) {
    this.container = containerElement;
    this.keyElements = new Map();
    this.fingerGuideEnabled = true;
    this.init();
  }

  static LAYOUT = [
    [
      { code: "Backquote", label: "`", shift: "~", finger: "pinky-l" },
      { code: "Digit1", label: "1", shift: "!", finger: "pinky-l" },
      { code: "Digit2", label: "2", shift: "@", finger: "ring-l" },
      { code: "Digit3", label: "3", shift: "#", finger: "mid-l" },
      { code: "Digit4", label: "4", shift: "$", finger: "index-l" },
      { code: "Digit5", label: "5", shift: "%", finger: "index-l" },
      { code: "Digit6", label: "6", shift: "^", finger: "index-r" },
      { code: "Digit7", label: "7", shift: "&", finger: "index-r" },
      { code: "Digit8", label: "8", shift: "*", finger: "mid-r" },
      { code: "Digit9", label: "9", shift: "(", finger: "ring-r" },
      { code: "Digit0", label: "0", shift: ")", finger: "pinky-r" },
      { code: "Minus", label: "-", shift: "_", finger: "pinky-r" },
      { code: "Equal", label: "=", shift: "+", finger: "pinky-r" },
      { code: "Backspace", label: "backspace", width: "w-2", finger: "pinky-r" }
    ],
    [
      { code: "Tab", label: "tab", width: "w-1-5", finger: "pinky-l" },
      { code: "KeyQ", label: "q", shift: "Q", finger: "pinky-l" },
      { code: "KeyW", label: "w", shift: "W", finger: "ring-l" },
      { code: "KeyE", label: "e", shift: "E", finger: "mid-l" },
      { code: "KeyR", label: "r", shift: "R", finger: "index-l" },
      { code: "KeyT", label: "t", shift: "T", finger: "index-l" },
      { code: "KeyY", label: "y", shift: "Y", finger: "index-r" },
      { code: "KeyU", label: "u", shift: "U", finger: "index-r" },
      { code: "KeyI", label: "i", shift: "I", finger: "mid-r" },
      { code: "KeyO", label: "o", shift: "O", finger: "ring-r" },
      { code: "KeyP", label: "p", shift: "P", finger: "pinky-r" },
      { code: "BracketLeft", label: "[", shift: "{", finger: "pinky-r" },
      { code: "BracketRight", label: "]", shift: "}", finger: "pinky-r" },
      { code: "Backslash", label: "\\", shift: "|", width: "w-1-5", finger: "pinky-r" }
    ],
    [
      { code: "CapsLock", label: "caps", width: "w-1-75", finger: "pinky-l" },
      { code: "KeyA", label: "a", shift: "A", finger: "pinky-l", home: true },
      { code: "KeyS", label: "s", shift: "S", finger: "ring-l", home: true },
      { code: "KeyD", label: "d", shift: "D", finger: "mid-l", home: true },
      { code: "KeyF", label: "f", shift: "F", finger: "index-l", home: true, bump: true },
      { code: "KeyG", label: "g", shift: "G", finger: "index-l" },
      { code: "KeyH", label: "h", shift: "H", finger: "index-r" },
      { code: "KeyJ", label: "j", shift: "J", finger: "index-r", home: true, bump: true },
      { code: "KeyK", label: "k", shift: "K", finger: "mid-r", home: true },
      { code: "KeyL", label: "l", shift: "L", finger: "ring-r", home: true },
      { code: "Semicolon", label: ";", shift: ":", finger: "pinky-r", home: true },
      { code: "Quote", label: "'", shift: "\"", finger: "pinky-r" },
      { code: "Enter", label: "enter", width: "w-2-25", finger: "pinky-r" }
    ],
    [
      { code: "ShiftLeft", label: "shift", width: "w-2-25", finger: "pinky-l" },
      { code: "KeyZ", label: "z", shift: "Z", finger: "pinky-l" },
      { code: "KeyX", label: "x", shift: "X", finger: "ring-l" },
      { code: "KeyC", label: "c", shift: "C", finger: "mid-l" },
      { code: "KeyV", label: "v", shift: "V", finger: "index-l" },
      { code: "KeyB", label: "b", shift: "B", finger: "index-l" },
      { code: "KeyN", label: "n", shift: "N", finger: "index-r" },
      { code: "KeyM", label: "m", shift: "M", finger: "index-r" },
      { code: "Comma", label: ",", shift: "<", finger: "mid-r" },
      { code: "Period", label: ".", shift: ">", finger: "ring-r" },
      { code: "Slash", label: "/", shift: "?", finger: "pinky-r" },
      { code: "ShiftRight", label: "shift", width: "w-2-75", finger: "pinky-r" }
    ],
    [
      { code: "Space", label: "space", width: "w-space", finger: "thumb" }
    ]
  ];

  init() {
    if (!this.container) return;
    this.container.innerHTML = "";
    this.keyElements.clear();

    const keyboardWrapper = document.createElement("div");
    keyboardWrapper.className = "vk-wrapper";

    VirtualKeyboard.LAYOUT.forEach(row => {
      const rowEl = document.createElement("div");
      rowEl.className = "vk-row";

      row.forEach(key => {
        const keyEl = document.createElement("div");
        keyEl.className = `vk-key ${key.width || ""} ${key.finger ? `finger-${key.finger}` : ""}`;
        keyEl.dataset.code = key.code;
        if (key.label) keyEl.dataset.key = key.label.toLowerCase();
        if (key.shift) keyEl.dataset.shift = key.shift;

        const mainLabel = document.createElement("span");
        mainLabel.className = "vk-label";
        mainLabel.textContent = key.label;
        keyEl.appendChild(mainLabel);

        if (key.bump) {
          const bump = document.createElement("div");
          bump.className = "vk-bump";
          keyEl.appendChild(bump);
        }

        rowEl.appendChild(keyEl);
        this.keyElements.set(key.code, keyEl);

        // Store mapping by character
        if (key.label && key.label.length === 1) {
          this.keyElements.set(key.label.toLowerCase(), keyEl);
        }
        if (key.shift) {
          this.keyElements.set(key.shift, keyEl);
        }
      });

      keyboardWrapper.appendChild(rowEl);
    });

    this.container.appendChild(keyboardWrapper);
  }

  /**
   * Flash key on press
   * @param {string} code 
   * @param {string} char
   * @param {boolean} isError
   */
  pressKey(code, char, isError = false) {
    let keyEl = this.keyElements.get(code) || (char ? this.keyElements.get(char.toLowerCase()) : null);
    if (!keyEl) return;

    const activeClass = isError ? "vk-key-error" : "vk-key-pressed";
    keyEl.classList.add(activeClass);

    setTimeout(() => {
      keyEl.classList.remove(activeClass);
    }, 120);
  }

  /**
   * Highlight the expected upcoming key
   * @param {string} nextChar 
   */
  highlightNextKey(nextChar) {
    // Clear previous hints
    this.container?.querySelectorAll(".vk-key-next").forEach(el => el.classList.remove("vk-key-next"));

    if (!nextChar) return;

    let targetEl = null;
    if (nextChar === " ") {
      targetEl = this.keyElements.get("Space");
    } else {
      targetEl = this.keyElements.get(nextChar) || this.keyElements.get(nextChar.toLowerCase());
    }

    if (targetEl) {
      targetEl.classList.add("vk-key-next");
    }
  }

  /**
   * Apply heatmap styling based on mistake frequency
   * @param {Object} weakKeysMap { 'e': 5, 't': 2, ... }
   */
  applyHeatmap(weakKeysMap) {
    this.container?.querySelectorAll(".vk-key-heatmap").forEach(el => {
      el.classList.remove("vk-key-heatmap");
      el.style.removeProperty("--heat-intensity");
    });

    if (!weakKeysMap) return;

    const maxErrors = Math.max(...Object.values(weakKeysMap), 1);

    Object.entries(weakKeysMap).forEach(([char, count]) => {
      const keyEl = this.keyElements.get(char.toLowerCase());
      if (keyEl && count > 0) {
        const intensity = Math.min(1, count / maxErrors);
        keyEl.classList.add("vk-key-heatmap");
        keyEl.style.setProperty("--heat-intensity", intensity.toFixed(2));
      }
    });
  }

  /**
   * Clear all highlights
   */
  reset() {
    this.container?.querySelectorAll(".vk-key").forEach(el => {
      el.classList.remove("vk-key-pressed", "vk-key-error", "vk-key-next", "vk-key-heatmap");
      el.style.removeProperty("--heat-intensity");
    });
  }
}
