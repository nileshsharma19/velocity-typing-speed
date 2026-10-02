/**
 * VelocityType - Main Application Controller
 */

import { TypingEngine, EngineState } from "./engine.js";
import { soundEngine } from "./sound.js";
import { StorageManager } from "./storage.js";
import { PerformanceChart } from "./chart.js";
import { VirtualKeyboard } from "./virtual-keyboard.js";

class App {
  constructor() {
    // 1. Settings & State
    this.settings = StorageManager.getSettings();
    this.currentMode = "time";
    this.currentModeParam = "30";
    this.withPunctuation = false;
    this.withNumbers = false;
    this.customText = "";
    this.customTimeSeconds = parseInt(localStorage.getItem("vt_custom_time") || "45");

    // 2. Engine
    this.engine = new TypingEngine({
      mode: this.currentMode,
      modeParam: this.currentModeParam,
      withPunctuation: this.withPunctuation,
      withNumbers: this.withNumbers,
      strictMasterMode: this.settings.strictMasterMode,
      customText: this.customText
    });

    // 3. Components
    this.chart = null;
    this.keyboard = null;

    // 4. Line Scrolling state
    this.currentLineTop = 0;
    this.lineHeight = 44; // Estimated line height in px

    this.init();
  }

  init() {
    this.cacheDom();
    this.applyInitialSettings();
    this.setupSubOptions();
    this.setupEngineCallbacks();
    this.setupEventListeners();
    this.initKeyboard();

    // Start initial test
    this.engine.initTest();
  }

  cacheDom() {
    // Top Bar & Buttons
    this.themeToggleBtn = document.getElementById("themeModalBtn");
    this.soundToggleBtn = document.getElementById("soundToggleBtn");
    this.keyboardToggleBtn = document.getElementById("keyboardToggleBtn");
    this.historyModalBtn = document.getElementById("historyModalBtn");
    this.settingsModalBtn = document.getElementById("settingsModalBtn");
    this.shortcutsBtn = document.getElementById("shortcutsBtn");
    this.brandLink = document.getElementById("brandLink");

    // Mode Toolbar
    this.modeButtons = document.querySelectorAll(".mode-bar .pill-btn[data-mode]");
    this.subOptionsContainer = document.getElementById("subOptionsContainer");
    this.punctuationToggle = document.getElementById("punctuationToggle");
    this.numbersToggle = document.getElementById("numbersToggle");

    // Typing Viewport
    this.liveHud = document.getElementById("liveHud");
    this.hudTimer = document.getElementById("hudTimer");
    this.hudTimerLabel = document.getElementById("hudTimerLabel");
    this.hudWpm = document.getElementById("hudWpm");
    this.hudAccuracy = document.getElementById("hudAccuracy");

    this.typingBox = document.getElementById("typingBox");
    this.hiddenInput = document.getElementById("hiddenInput");
    this.focusOverlay = document.getElementById("focusOverlay");
    this.wordsViewport = document.getElementById("wordsViewport");
    this.wordsWrapper = document.getElementById("wordsWrapper");
    this.caret = document.getElementById("caret");
    this.quoteCredit = document.getElementById("quoteCredit");
    this.restartBtn = document.getElementById("restartBtn");

    // Results Section
    this.resultsView = document.getElementById("resultsView");
    this.rankBadge = document.getElementById("rankBadge");
    this.resWpm = document.getElementById("resWpm");
    this.resAccuracy = document.getElementById("resAccuracy");
    this.resCpm = document.getElementById("resCpm");
    this.resConsistency = document.getElementById("resConsistency");
    this.resRawWpm = document.getElementById("resRawWpm");
    this.resChars = document.getElementById("resChars");
    this.resTime = document.getElementById("resTime");
    this.weakKeysList = document.getElementById("weakKeysList");
    this.perfChartCanvas = document.getElementById("perfChartCanvas");
    this.resNextBtn = document.getElementById("resNextBtn");
    this.resRepeatBtn = document.getElementById("resRepeatBtn");
    this.resShareBtn = document.getElementById("resShareBtn");

    // Keyboard Section
    this.keyboardSection = document.getElementById("keyboardSection");
    this.vkContainer = document.getElementById("virtualKeyboardContainer");

    // Modals
    this.settingsModal = document.getElementById("settingsModal");
    this.historyModal = document.getElementById("historyModal");
    this.customTextModal = document.getElementById("customTextModal");
    this.customTimeModal = document.getElementById("customTimeModal");
    this.shortcutsModal = document.getElementById("shortcutsModal");

    // Settings Controls
    this.settingTheme = document.getElementById("settingTheme");
    this.settingSound = document.getElementById("settingSound");
    this.settingVolume = document.getElementById("settingVolume");
    this.settingCaret = document.getElementById("settingCaret");
    this.settingFont = document.getElementById("settingFont");
    this.settingStrictToggle = document.getElementById("settingStrictToggle");
    this.settingHudToggle = document.getElementById("settingHudToggle");

    // History Modal Controls
    this.statBestWpm = document.getElementById("statBestWpm");
    this.statAvgWpm = document.getElementById("statAvgWpm");
    this.statTotalTests = document.getElementById("statTotalTests");
    this.historyTableBody = document.getElementById("historyTableBody");
    this.clearHistoryBtn = document.getElementById("clearHistoryBtn");

    // Custom Text Controls
    this.customTextInput = document.getElementById("customTextInput");
    this.customWordCount = document.getElementById("customWordCount");
    this.applyCustomTextBtn = document.getElementById("applyCustomTextBtn");

    // Custom Time Controls
    this.customTimeInput = document.getElementById("customTimeInput");
    this.applyCustomTimeBtn = document.getElementById("applyCustomTimeBtn");
    this.presetChips = document.querySelectorAll(".preset-chip");

    // Toast Container
    this.toastContainer = document.getElementById("toastContainer");
  }

  applyInitialSettings() {
    // Theme
    document.documentElement.setAttribute("data-theme", this.settings.theme);
    if (this.settingTheme) this.settingTheme.value = this.settings.theme;

    // Font
    this.wordsWrapper.style.fontFamily = this.settings.fontFamily;
    if (this.settingFont) this.settingFont.value = this.settings.fontFamily;

    // Caret
    this.caret.className = `caret style-${this.settings.caretStyle}`;
    if (this.settingCaret) this.settingCaret.value = this.settings.caretStyle;

    // Sound
    soundEngine.setSoundType(this.settings.soundType);
    soundEngine.setVolume(this.settings.soundVolume);
    soundEngine.setMuted(this.settings.isMuted);
    if (this.settingSound) this.settingSound.value = this.settings.soundType;
    if (this.settingVolume) this.settingVolume.value = this.settings.soundVolume;
    this.updateSoundIcon();

    // HUD Visibility
    if (this.liveHud) {
      this.liveHud.style.display = this.settings.showLiveWpm ? "flex" : "none";
    }
    if (this.settingHudToggle) {
      this.settingHudToggle.classList.toggle("active", this.settings.showLiveWpm);
    }

    // Strict Master Mode
    if (this.settingStrictToggle) {
      this.settingStrictToggle.classList.toggle("active", this.settings.strictMasterMode);
    }

    // Keyboard Visualizer
    if (this.keyboardSection) {
      this.keyboardSection.classList.toggle("hidden", !this.settings.showKeyboard);
      this.keyboardToggleBtn?.classList.toggle("active", this.settings.showKeyboard);
    }
  }

  initKeyboard() {
    if (this.vkContainer) {
      this.keyboard = new VirtualKeyboard(this.vkContainer);
    }
  }

  setupSubOptions() {
    const isStandardTime = ["15", "30", "60", "120"].includes(this.currentModeParam);
    const customTimeLabel = (this.currentMode === "time" && !isStandardTime) 
      ? `${this.currentModeParam}s ⏱️` 
      : "custom";

    const subOptionsMap = {
      time: [
        { label: "15", value: "15" },
        { label: "30", value: "30" },
        { label: "60", value: "60" },
        { label: "120", value: "120" },
        { 
          label: customTimeLabel, 
          value: !isStandardTime ? this.currentModeParam : "custom", 
          isCustomTime: true 
        }
      ],
      words: [
        { label: "10", value: "10" },
        { label: "25", value: "25" },
        { label: "50", value: "50" },
        { label: "100", value: "100" }
      ],
      quote: [
        { label: "all", value: "all" },
        { label: "short", value: "short" },
        { label: "medium", value: "medium" },
        { label: "long", value: "long" }
      ],
      code: [
        { label: "javascript", value: "javascript" },
        { label: "python", value: "python" },
        { label: "html", value: "html" }
      ],
      custom: [
        { label: "edit text", value: "custom" }
      ]
    };

    const options = subOptionsMap[this.currentMode] || [];
    this.subOptionsContainer.innerHTML = "";

    options.forEach(opt => {
      const isActive = opt.value === this.currentModeParam || (opt.isCustomTime && !isStandardTime && this.currentMode === "time");
      const btn = document.createElement("button");
      btn.className = "pill-btn" + (isActive ? " active" : "");
      btn.textContent = opt.label;
      btn.dataset.subOption = opt.value;

      btn.addEventListener("click", () => {
        if (this.currentMode === "custom") {
          this.openModal(this.customTextModal);
          return;
        }
        if (opt.isCustomTime) {
          this.openCustomTimeModal();
          return;
        }
        this.currentModeParam = opt.value;
        this.subOptionsContainer.querySelectorAll(".pill-btn").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        this.restartTest();
      });

      this.subOptionsContainer.appendChild(btn);
    });

    // Punctuation and Numbers visibility
    const allowModifiers = this.currentMode === "time" || this.currentMode === "words";
    this.punctuationToggle.style.display = allowModifiers ? "inline-flex" : "none";
    this.numbersToggle.style.display = allowModifiers ? "inline-flex" : "none";
  }

  openCustomTimeModal() {
    if (this.customTimeInput) {
      const isStandardTime = ["15", "30", "60", "120"].includes(this.currentModeParam);
      const val = !isStandardTime ? this.currentModeParam : this.customTimeSeconds;
      this.customTimeInput.value = val;
      this.updatePresetChipsActive(val);
    }
    this.openModal(this.customTimeModal);
  }

  updatePresetChipsActive(val) {
    this.presetChips?.forEach(chip => {
      chip.classList.toggle("active", chip.dataset.time === val.toString());
    });
  }

  setupEngineCallbacks() {
    this.engine.onReset = () => {
      this.renderWordsDOM();
      this.updateHud();
      this.resultsView.style.display = "none";
      this.typingBox.style.display = "block";
      this.liveHud.style.display = this.settings.showLiveWpm ? "flex" : "none";
      this.keyboard?.reset();
      this.focusInput();
    };

    this.engine.onStart = () => {
      soundEngine.init();
    };

    this.engine.onTick = ({ remainingSeconds, stats }) => {
      if (this.currentMode === "time") {
        this.hudTimer.textContent = remainingSeconds;
      } else {
        this.hudTimer.textContent = this.engine.elapsedSeconds;
      }
      this.hudWpm.textContent = stats.wpm;
      this.hudAccuracy.textContent = `${Math.round(stats.accuracy)}%`;
    };

    this.engine.onCharTyped = ({ key, code, isCorrect, expectedChar, nextChar, wordIndex, charIndex, currentStats }) => {
      // Sound feedback
      if (isCorrect) {
        soundEngine.playKey(key);
      } else {
        soundEngine.playError();
      }

      // Keyboard animation
      this.keyboard?.pressKey(code, key, !isCorrect);
      this.keyboard?.highlightNextKey(nextChar);

      // Update DOM character styling
      this.updateCharDOM(wordIndex, charIndex);

      // Reposition Caret
      this.updateCaretPosition();

      // Live HUD update
      if (this.currentMode !== "time") {
        this.hudTimer.textContent = `${this.engine.activeWordIndex}/${this.engine.wordStates.length}`;
      }
      this.hudWpm.textContent = currentStats.wpm;
      this.hudAccuracy.textContent = `${Math.round(currentStats.accuracy)}%`;
    };

    this.engine.onWordCompleted = (completedIndex) => {
      const wordEl = this.wordsWrapper.children[completedIndex];
      if (wordEl) {
        const state = this.engine.wordStates[completedIndex];
        if (!state.isCorrect) {
          wordEl.classList.add("error-underline");
        }
      }
      this.checkLineScroll();
    };

    this.engine.onFinish = (result) => {
      soundEngine.playSuccess();
      StorageManager.saveTestResult(result);
      this.displayResults(result);
    };
  }

  /**
   * Render all word & character span elements into the DOM
   */
  renderWordsDOM() {
    this.wordsWrapper.innerHTML = "";
    this.wordsWrapper.style.transform = "translateY(0px)";
    this.currentLineTop = 0;

    const frag = document.createDocumentFragment();

    this.engine.wordStates.forEach((wordObj, wIdx) => {
      const wordSpan = document.createElement("div");
      wordSpan.className = "word";
      wordSpan.dataset.wordIndex = wIdx;

      wordObj.chars.forEach((c, cIdx) => {
        const charSpan = document.createElement("span");
        charSpan.className = "char";
        charSpan.textContent = c.original;
        charSpan.dataset.charIndex = cIdx;
        wordSpan.appendChild(charSpan);
      });

      frag.appendChild(wordSpan);
    });

    this.wordsWrapper.appendChild(frag);

    // Show quote attribution if in quote mode
    if (this.currentMode === "quote" && this.engine.quoteMeta) {
      this.quoteCredit.textContent = `— ${this.engine.quoteMeta.author}`;
      this.quoteCredit.style.display = "block";
    } else {
      this.quoteCredit.style.display = "none";
    }

    // Initial Caret placement & Keyboard hint
    requestAnimationFrame(() => {
      this.updateCaretPosition();
      this.keyboard?.highlightNextKey(this.engine.getNextExpectedChar());
    });
  }

  /**
   * Update character span class based on typed status
   */
  updateCharDOM(wordIndex, charIndex) {
    const wordEl = this.wordsWrapper.children[wordIndex];
    if (!wordEl) return;

    const wordState = this.engine.wordStates[wordIndex];
    if (!wordState) return;

    // Normal characters
    wordState.chars.forEach((c, idx) => {
      const charEl = wordEl.querySelector(`[data-char-index="${idx}"]`);
      if (charEl) {
        charEl.className = `char ${c.status}`;
      }
    });
  }

  /**
   * Smooth dynamic positioning of the caret
   */
  updateCaretPosition() {
    const currentWordEl = this.wordsWrapper.children[this.engine.activeWordIndex];
    if (!currentWordEl) return;

    let targetCharEl = null;

    if (this.engine.activeCharIndex < currentWordEl.children.length) {
      targetCharEl = currentWordEl.children[this.engine.activeCharIndex];
    }

    const wrapperRect = this.wordsWrapper.getBoundingClientRect();

    if (targetCharEl) {
      const charRect = targetCharEl.getBoundingClientRect();
      const left = charRect.left - wrapperRect.left;
      const top = charRect.top - wrapperRect.top;

      this.caret.style.left = `${left}px`;
      this.caret.style.top = `${top}px`;
    } else {
      // Caret after the last letter of word
      const lastChild = currentWordEl.lastElementChild;
      if (lastChild) {
        const lastRect = lastChild.getBoundingClientRect();
        const left = lastRect.right - wrapperRect.left;
        const top = lastRect.top - wrapperRect.top;

        this.caret.style.left = `${left}px`;
        this.caret.style.top = `${top}px`;
      }
    }
  }

  /**
   * Check if active line moved beyond line 2, scroll up 1 line
   */
  checkLineScroll() {
    const currentWordEl = this.wordsWrapper.children[this.engine.activeWordIndex];
    if (!currentWordEl) return;

    const wordOffsetTop = currentWordEl.offsetTop;

    if (wordOffsetTop > this.currentLineTop + 25) {
      // Moved to next line
      this.currentLineTop = wordOffsetTop;
      const scrollOffset = Math.max(0, this.currentLineTop - 40);
      this.wordsWrapper.style.transform = `translateY(-${scrollOffset}px)`;
    }
  }

  updateHud() {
    if (this.currentMode === "time") {
      this.hudTimer.textContent = this.currentModeParam;
      this.hudTimerLabel.textContent = "sec";
    } else if (this.currentMode === "words") {
      this.hudTimer.textContent = `0/${this.currentModeParam}`;
      this.hudTimerLabel.textContent = "words";
    } else {
      this.hudTimer.textContent = "0";
      this.hudTimerLabel.textContent = "sec";
    }

    this.hudWpm.textContent = "0";
    this.hudAccuracy.textContent = "100%";
  }

  /**
   * Show final detailed results
   */
  displayResults(result) {
    this.typingBox.style.display = "none";
    this.liveHud.style.display = "none";
    this.resultsView.style.display = "block";

    // Set Big Metrics
    this.resWpm.textContent = result.wpm;
    this.resAccuracy.textContent = `${result.accuracy}%`;
    this.resCpm.textContent = result.cpm;
    this.resConsistency.textContent = `${result.consistency}%`;

    // Substats
    this.resRawWpm.textContent = result.rawWpm;
    this.resChars.textContent = `${result.chars.correct} / ${result.chars.incorrect} / ${result.chars.extra} / ${result.chars.missed}`;
    this.resTime.textContent = `${result.duration}s`;

    // Rank Badge
    this.rankBadge.textContent = this.getRankTitle(result.wpm, result.accuracy);

    // Render Weak Keys
    this.renderWeakKeys(result.weakKeys, result.weakKeysMap);

    // Render Performance Canvas Chart
    requestAnimationFrame(() => {
      if (!this.chart) {
        this.chart = new PerformanceChart(this.perfChartCanvas);
      }
      const primaryColor = getComputedStyle(document.documentElement).getPropertyValue("--accent-primary").trim();
      const errorColor = getComputedStyle(document.documentElement).getPropertyValue("--char-incorrect").trim();
      this.chart.render(result.timeline, { primary: primaryColor, error: errorColor });
    });
  }

  getRankTitle(wpm, acc) {
    if (acc < 80) return "Careless Speedster ⚠️";
    if (wpm >= 125) return "Grandmaster ⚡⚡";
    if (wpm >= 100) return "Master Typist 🚀";
    if (wpm >= 80) return "Expert Typist 🔥";
    if (wpm >= 60) return "Pro Typist ✨";
    if (wpm >= 40) return "Intermediate Typist 💻";
    if (wpm >= 20) return "Novice Typist ✍️";
    return "Beginner 🌱";
  }

  renderWeakKeys(weakKeys, weakKeysMap) {
    this.weakKeysList.innerHTML = "";

    if (!weakKeys || weakKeys.length === 0) {
      this.weakKeysList.innerHTML = `<span style="font-size: 13px; color: var(--accent-primary);">Flawless accuracy! Zero missed keys ✨</span>`;
      return;
    }

    weakKeys.forEach(({ char, count }) => {
      const pill = document.createElement("div");
      pill.className = "weak-key-pill";
      pill.innerHTML = `<strong>${char.toUpperCase()}</strong> <span>(${count} error${count > 1 ? "s" : ""})</span>`;
      this.weakKeysList.appendChild(pill);
    });

    // Targeted practice button
    const practiceBtn = document.createElement("button");
    practiceBtn.className = "pill-btn";
    practiceBtn.style.background = "var(--bg-tertiary)";
    practiceBtn.style.color = "var(--accent-primary)";
    practiceBtn.innerHTML = `🎯 Practice Weak Keys`;
    practiceBtn.addEventListener("click", () => {
      this.startWeakKeyPractice(weakKeys.map(k => k.char));
    });
    this.weakKeysList.appendChild(practiceBtn);

    // Apply heatmap to virtual keyboard if open
    this.keyboard?.applyHeatmap(weakKeysMap);
  }

  startWeakKeyPractice(keys) {
    if (!keys || keys.length === 0) return;
    // Generate custom text emphasizing weak keys
    const words = [];
    const bank = ["the", "quick", "practice", "system", "accuracy", "speed", "finger", "target", "focus", "master"];

    for (let i = 0; i < 30; i++) {
      const key = keys[Math.floor(Math.random() * keys.length)];
      const base = bank[Math.floor(Math.random() * bank.length)];
      words.push(`${base}${key}`);
    }

    this.customText = words.join(" ");
    this.setMode("custom", "custom");
    this.restartTest();
    this.showToast(`🎯 Weak key drill started for: [${keys.join(", ")}]`);
  }

  restartTest() {
    this.engine.options.mode = this.currentMode;
    this.engine.options.modeParam = this.currentModeParam;
    this.engine.options.withPunctuation = this.withPunctuation;
    this.engine.options.withNumbers = this.withNumbers;
    this.engine.options.strictMasterMode = this.settings.strictMasterMode;
    this.engine.options.customText = this.customText;

    this.engine.initTest();
  }

  repeatCurrentWords() {
    this.engine.resetState();
    this.engine.buildWordStates();
    if (this.engine.onReset) this.engine.onReset();
  }

  setMode(mode, param = null) {
    this.currentMode = mode;
    this.modeButtons.forEach(btn => {
      btn.classList.toggle("active", btn.dataset.mode === mode);
    });

    if (param) {
      this.currentModeParam = param;
    } else {
      const defaults = { time: "30", words: "25", quote: "medium", code: "javascript", custom: "custom" };
      this.currentModeParam = defaults[mode] || "30";
    }

    this.setupSubOptions();
    this.restartTest();
  }

  setupEventListeners() {
    // 1. Mode Buttons
    this.modeButtons.forEach(btn => {
      btn.addEventListener("click", () => {
        this.setMode(btn.dataset.mode);
      });
    });

    // 2. Modifiers
    this.punctuationToggle.addEventListener("click", () => {
      this.withPunctuation = !this.withPunctuation;
      this.punctuationToggle.classList.toggle("active", this.withPunctuation);
      this.restartTest();
    });

    this.numbersToggle.addEventListener("click", () => {
      this.withNumbers = !this.withNumbers;
      this.numbersToggle.classList.toggle("active", this.withNumbers);
      this.restartTest();
    });

    // 3. Typing Box Focus & Input
    this.typingBox.addEventListener("click", () => this.focusInput());
    this.focusOverlay.addEventListener("click", () => this.focusInput());

    this.hiddenInput.addEventListener("focus", () => {
      this.typingBox.classList.remove("unfocused");
    });

    this.hiddenInput.addEventListener("blur", () => {
      this.typingBox.classList.add("unfocused");
    });

    // Mobile Virtual Keyboard Input Handling (e.g. Android Gboard, iOS Safari)
    this.hiddenInput.addEventListener("input", (e) => {
      if (this.engine.state === EngineState.FINISHED) return;

      if (e.inputType === "deleteContentBackward" || e.inputType === "deleteContentForward") {
        this.engine.handleKeystroke("Backspace", "Backspace", false);
      } else if (e.inputType === "deleteWordBackward") {
        this.engine.handleKeystroke("Backspace", "Backspace", true);
      } else if (e.data) {
        for (const char of e.data) {
          this.engine.handleKeystroke(char, `Key${char.toUpperCase()}`);
        }
      } else if (this.hiddenInput.value) {
        const val = this.hiddenInput.value;
        for (const char of val) {
          this.engine.handleKeystroke(char, `Key${char.toUpperCase()}`);
        }
      }
      this.hiddenInput.value = "";
    });

    // Global Keydown Handler (Physical Keyboard + Control keys)
    window.addEventListener("keydown", (e) => {
      // Escape: Close any open modals
      if (e.key === "Escape") {
        this.closeAllModals();
        return;
      }

      // Tab: Quick restart
      if (e.key === "Tab") {
        e.preventDefault();
        this.restartTest();
        return;
      }

      // If modal is open, don't capture typing for test
      if (document.querySelector(".modal-backdrop.open")) {
        return;
      }

      // If virtual keyboard is composing (IME/Mobile keyCode 229), let 'input' handle it
      if (e.isComposing || e.keyCode === 229 || e.key === "Unidentified") {
        return;
      }

      // If user presses any typing key while unfocused, refocus automatically
      if (document.activeElement !== this.hiddenInput && e.key.length === 1 && !e.metaKey && !e.ctrlKey && !e.altKey) {
        this.focusInput();
      }

      // Prevent standard browser scrolling on Space
      if (e.key === " " && e.target === this.hiddenInput) {
        e.preventDefault();
      }

      // Feed key to engine
      if (this.engine.state !== EngineState.FINISHED) {
        if (e.key === "Backspace") {
          e.preventDefault();
          this.engine.handleKeystroke("Backspace", "Backspace", e.ctrlKey);
        } else if (e.key === " ") {
          e.preventDefault();
          this.engine.handleKeystroke(" ", "Space", false);
        } else if (e.key.length === 1 && !e.metaKey && !e.altKey && !e.ctrlKey) {
          e.preventDefault();
          this.engine.handleKeystroke(e.key, e.code, false);
        }
      }
    });

    // Restart button
    this.restartBtn.addEventListener("click", () => this.restartTest());
    this.resNextBtn.addEventListener("click", () => this.restartTest());
    this.resRepeatBtn.addEventListener("click", () => this.repeatCurrentWords());
    this.resShareBtn.addEventListener("click", () => this.copyScoreCard());

    // Sound toggle in header
    this.soundToggleBtn.addEventListener("click", () => {
      this.settings.isMuted = !this.settings.isMuted;
      soundEngine.setMuted(this.settings.isMuted);
      StorageManager.saveSettings(this.settings);
      this.updateSoundIcon();
      this.showToast(this.settings.isMuted ? "🔇 Audio Muted" : "🔊 Audio Unmuted");
    });

    // Keyboard visualizer toggle
    this.keyboardToggleBtn.addEventListener("click", () => {
      this.settings.showKeyboard = !this.settings.showKeyboard;
      this.keyboardSection.classList.toggle("hidden", !this.settings.showKeyboard);
      this.keyboardToggleBtn.classList.toggle("active", this.settings.showKeyboard);
      StorageManager.saveSettings(this.settings);
    });

    // Modal open buttons
    this.settingsModalBtn.addEventListener("click", () => this.openModal(this.settingsModal));
    this.historyModalBtn.addEventListener("click", () => {
      this.populateHistoryModal();
      this.openModal(this.historyModal);
    });
    this.shortcutsBtn.addEventListener("click", () => this.openModal(this.shortcutsModal));
    this.themeToggleBtn.addEventListener("click", () => this.openModal(this.settingsModal));

    // Modal Close Buttons
    document.querySelectorAll(".close-modal-btn").forEach(btn => {
      btn.addEventListener("click", () => this.closeAllModals());
    });
    document.querySelectorAll(".modal-backdrop").forEach(backdrop => {
      backdrop.addEventListener("click", (e) => {
        if (e.target === backdrop) this.closeAllModals();
      });
    });

    // Settings inputs
    this.settingTheme.addEventListener("change", (e) => {
      this.settings.theme = e.target.value;
      document.documentElement.setAttribute("data-theme", this.settings.theme);
      StorageManager.saveSettings(this.settings);
      this.showToast(`Theme changed to ${e.target.selectedOptions[0].text}`);
    });

    this.settingSound.addEventListener("change", (e) => {
      this.settings.soundType = e.target.value;
      soundEngine.setSoundType(this.settings.soundType);
      StorageManager.saveSettings(this.settings);
      soundEngine.playKey("a");
    });

    this.settingVolume.addEventListener("input", (e) => {
      this.settings.soundVolume = parseFloat(e.target.value);
      soundEngine.setVolume(this.settings.soundVolume);
      StorageManager.saveSettings(this.settings);
    });

    this.settingCaret.addEventListener("change", (e) => {
      this.settings.caretStyle = e.target.value;
      this.caret.className = `caret style-${this.settings.caretStyle}`;
      StorageManager.saveSettings(this.settings);
    });

    this.settingFont.addEventListener("change", (e) => {
      this.settings.fontFamily = e.target.value;
      this.wordsWrapper.style.fontFamily = this.settings.fontFamily;
      StorageManager.saveSettings(this.settings);
    });

    this.settingStrictToggle.addEventListener("click", () => {
      this.settings.strictMasterMode = !this.settings.strictMasterMode;
      this.settingStrictToggle.classList.toggle("active", this.settings.strictMasterMode);
      StorageManager.saveSettings(this.settings);
      this.showToast(this.settings.strictMasterMode ? "⚡ Master Mode: Instant Fail Enabled" : "Master Mode Disabled");
    });

    this.settingHudToggle.addEventListener("click", () => {
      this.settings.showLiveWpm = !this.settings.showLiveWpm;
      this.settingHudToggle.classList.toggle("active", this.settings.showLiveWpm);
      this.liveHud.style.display = this.settings.showLiveWpm ? "flex" : "none";
      StorageManager.saveSettings(this.settings);
    });

    // Clear History
    this.clearHistoryBtn.addEventListener("click", () => {
      if (confirm("Are you sure you want to clear your typing history and stats?")) {
        StorageManager.clearHistory();
        this.populateHistoryModal();
        this.showToast("History cleared");
      }
    });

    // Custom Text Modal Input
    this.customTextInput.addEventListener("input", (e) => {
      const words = e.target.value.trim().split(/\s+/).filter(Boolean);
      this.customWordCount.textContent = `${words.length} word${words.length === 1 ? "" : "s"}`;
    });

    this.applyCustomTextBtn.addEventListener("click", () => {
      const text = this.customTextInput.value.trim();
      if (!text) {
        alert("Please enter some text to practice.");
        return;
      }
      this.customText = text;
      this.closeAllModals();
      this.setMode("custom", "custom");
    });

    // Custom Time Modal Presets & Apply
    this.presetChips.forEach(chip => {
      chip.addEventListener("click", () => {
        const timeVal = chip.dataset.time;
        this.customTimeInput.value = timeVal;
        this.updatePresetChipsActive(timeVal);
      });
    });

    this.customTimeInput.addEventListener("input", (e) => {
      this.updatePresetChipsActive(e.target.value);
    });

    this.applyCustomTimeBtn.addEventListener("click", () => {
      const seconds = parseInt(this.customTimeInput.value, 10);
      if (isNaN(seconds) || seconds < 5 || seconds > 3600) {
        alert("Please enter a valid time between 5 and 3600 seconds.");
        return;
      }

      this.customTimeSeconds = seconds;
      localStorage.setItem("vt_custom_time", seconds.toString());
      this.currentMode = "time";
      this.currentModeParam = seconds.toString();
      
      this.closeAllModals();
      this.setupSubOptions();
      this.restartTest();
      this.showToast(`⏱️ Custom test time set to ${seconds}s!`);
    });
  }

  focusInput() {
    this.hiddenInput.focus();
    this.typingBox.classList.remove("unfocused");
  }

  updateSoundIcon() {
    if (this.settings.isMuted || this.settings.soundType === "off") {
      this.soundToggleBtn.innerHTML = `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="1" y1="1" x2="23" y2="23"></line><path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"></path><path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23"></path><line x1="12" y1="19" x2="12" y2="23"></line><line x1="8" y1="23" x2="16" y2="23"></line></svg>
      `;
    } else {
      this.soundToggleBtn.innerHTML = `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>
      `;
    }
  }

  openModal(modalEl) {
    if (!modalEl) return;
    modalEl.classList.add("open");
  }

  closeAllModals() {
    document.querySelectorAll(".modal-backdrop").forEach(m => m.classList.remove("open"));
    this.focusInput();
  }

  populateHistoryModal() {
    const summary = StorageManager.getStatsSummary();
    this.statBestWpm.textContent = summary.bestWpm;
    this.statAvgWpm.textContent = summary.avgWpm;
    this.statTotalTests.textContent = summary.testsCompleted;

    const history = StorageManager.getHistory();
    this.historyTableBody.innerHTML = "";

    if (history.length === 0) {
      this.historyTableBody.innerHTML = `<tr><td colspan="5" style="text-align:center; color: var(--text-muted);">No tests recorded yet</td></tr>`;
      return;
    }

    history.slice(0, 30).forEach(item => {
      const tr = document.createElement("tr");
      const dateStr = new Date(item.timestamp).toLocaleDateString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
      tr.innerHTML = `
        <td style="color: var(--accent-primary); font-weight:700;">${item.wpm}</td>
        <td>${item.accuracy}%</td>
        <td>${item.mode} (${item.modeParam})</td>
        <td>${item.duration}s</td>
        <td style="color: var(--text-muted);">${dateStr}</td>
      `;
      this.historyTableBody.appendChild(tr);
    });
  }

  copyScoreCard() {
    const wpm = this.resWpm.textContent;
    const acc = this.resAccuracy.textContent;
    const cpm = this.resCpm.textContent;
    const cons = this.resConsistency.textContent;
    const rank = this.rankBadge.textContent;

    const text = `🚀 VelocityType Result:
⚡ WPM: ${wpm} | Accuracy: ${acc}
📊 CPM: ${cpm} | Consistency: ${cons}
🏆 Rank: ${rank}
Test mode: ${this.currentMode} (${this.currentModeParam})`;

    navigator.clipboard.writeText(text).then(() => {
      this.showToast("📋 Result copied to clipboard!");
    }).catch(() => {
      this.showToast("Failed to copy card");
    });
  }

  showToast(msg) {
    const toast = document.createElement("div");
    toast.className = "toast";
    toast.textContent = msg;
    this.toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transform = "translateY(10px)";
      setTimeout(() => toast.remove(), 200);
    }, 2400);
  }
}

// Bootstrap Application when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  window.app = new App();
});
