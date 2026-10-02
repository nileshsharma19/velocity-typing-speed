/**
 * VelocityType - Core Typing Engine & State Machine
 */

import { generateWords, getRandomQuote, getRandomCodeSnippet } from "./words.js";

export const EngineState = {
  IDLE: "IDLE",
  RUNNING: "RUNNING",
  FINISHED: "FINISHED"
};

export class TypingEngine {
  constructor(options = {}) {
    this.options = Object.assign({
      mode: "time", // 'time' | 'words' | 'quote' | 'code' | 'custom'
      modeParam: 30, // seconds or word count or language
      withPunctuation: false,
      withNumbers: false,
      strictMasterMode: false,
      customText: ""
    }, options);

    // State
    this.state = EngineState.IDLE;
    this.words = []; // Array of string words
    this.wordStates = []; // Array of word typing metadata [{ chars: [...], isCompleted: bool }]
    this.activeWordIndex = 0;
    this.activeCharIndex = 0;

    // Timing & Metrics
    this.startTime = null;
    this.endTime = null;
    this.timerInterval = null;
    this.elapsedSeconds = 0;
    this.remainingSeconds = 0;

    // Keystroke statistics
    this.totalTypedChars = 0;
    this.correctTypedChars = 0;
    this.incorrectTypedChars = 0;
    this.extraTypedChars = 0;
    this.missedChars = 0;
    this.weakKeysMap = {}; // { 'a': errorCount, ... }

    // Real-time timeline for graph (1 snapshot per second)
    this.timeline = [];
    this.wpmSnapshots = [];

    // Callbacks
    this.onStart = null;
    this.onTick = null;
    this.onCharTyped = null;
    this.onWordCompleted = null;
    this.onFinish = null;
    this.onReset = null;
  }

  /**
   * Initialize or reset the test with new content
   */
  initTest() {
    this.resetState();
    this.generateContent();
    this.buildWordStates();
    if (this.onReset) this.onReset();
  }

  /**
   * Reset all counters and timers
   */
  resetState() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }

    this.state = EngineState.IDLE;
    this.startTime = null;
    this.endTime = null;
    this.elapsedSeconds = 0;
    this.remainingSeconds = this.options.mode === "time" ? parseInt(this.options.modeParam) : 0;

    this.activeWordIndex = 0;
    this.activeCharIndex = 0;
    this.totalTypedChars = 0;
    this.correctTypedChars = 0;
    this.incorrectTypedChars = 0;
    this.extraTypedChars = 0;
    this.missedChars = 0;
    this.weakKeysMap = {};
    this.timeline = [];
    this.wpmSnapshots = [];
  }

  /**
   * Generate word list based on active mode
   */
  generateContent() {
    const { mode, modeParam, withPunctuation, withNumbers, customText } = this.options;

    if (mode === "time") {
      // Generate a large batch of words for continuous typing (e.g. 150 words)
      this.words = generateWords(150, withPunctuation, withNumbers);
    } else if (mode === "words") {
      const count = parseInt(modeParam) || 25;
      this.words = generateWords(count, withPunctuation, withNumbers);
    } else if (mode === "quote") {
      const quoteObj = getRandomQuote(modeParam || "all");
      this.quoteMeta = quoteObj;
      this.words = quoteObj.text.trim().split(/\s+/);
    } else if (mode === "code") {
      const snippet = getRandomCodeSnippet(modeParam || "javascript");
      this.words = snippet.trim().split(/\s+/);
    } else if (mode === "custom") {
      const cleanCustom = (customText || "The quick brown fox jumps over the lazy dog.").trim();
      this.words = cleanCustom.split(/\s+/);
    }
  }

  /**
   * Build internal character state models
   */
  buildWordStates() {
    this.wordStates = this.words.map((w, wIdx) => {
      const chars = w.split("").map((c, cIdx) => ({
        original: c,
        typed: null,
        status: "untyped" // 'untyped' | 'correct' | 'incorrect'
      }));
      return {
        word: w,
        chars: chars,
        extraChars: [], // For characters typed past word length
        isCompleted: false,
        isCorrect: false
      };
    });
  }

  /**
   * Handle incoming keystroke
   * @param {string} key 
   * @param {string} code 
   * @param {boolean} ctrlKey 
   * @returns {Object} result metadata
   */
  handleKeystroke(key, code, ctrlKey = false) {
    if (this.state === EngineState.FINISHED) return null;

    // Start test on first valid keystroke
    if (this.state === EngineState.IDLE) {
      if (key.length === 1 || key === "Backspace") {
        this.startTest();
      } else {
        return null;
      }
    }

    const currentWord = this.wordStates[this.activeWordIndex];
    if (!currentWord) return null;

    let actionType = "char";
    let isCorrect = true;
    let expectedChar = "";

    // 1. Backspace Handling
    if (key === "Backspace") {
      actionType = "backspace";
      if (ctrlKey) {
        // Ctrl+Backspace: Delete entire active word's typed characters
        this.handleCtrlBackspace(currentWord);
      } else {
        this.handleSingleBackspace(currentWord);
      }
    }
    // 2. Spacebar (Submit current word & jump to next)
    else if (key === " " || key === "Space") {
      actionType = "space";
      this.handleSpace(currentWord);
    }
    // 3. Regular printable character
    else if (key.length === 1) {
      this.totalTypedChars++;
      const charIndex = this.activeCharIndex;

      // Typing within standard word bounds
      if (charIndex < currentWord.chars.length) {
        const targetChar = currentWord.chars[charIndex];
        expectedChar = targetChar.original;
        targetChar.typed = key;

        if (key === targetChar.original) {
          targetChar.status = "correct";
          this.correctTypedChars++;
          isCorrect = true;
        } else {
          targetChar.status = "incorrect";
          this.incorrectTypedChars++;
          isCorrect = false;
          this.recordWeakKey(targetChar.original);

          if (this.options.strictMasterMode) {
            this.finishTest();
            return { action: "strict_fail" };
          }
        }
        this.activeCharIndex++;
      }
      // Typing extra characters beyond the word length (Do not add new characters)
      else {
        this.incorrectTypedChars++;
        isCorrect = false;
      }

      // If in quote or code mode, auto-advance on last word completion
      if (
        this.activeWordIndex === this.wordStates.length - 1 &&
        this.activeCharIndex >= currentWord.chars.length
      ) {
        this.validateCurrentWord(currentWord);
        this.finishTest();
      }
    }

    const nextChar = this.getNextExpectedChar();

    if (this.onCharTyped) {
      this.onCharTyped({
        key,
        code,
        isCorrect,
        expectedChar,
        nextChar,
        wordIndex: this.activeWordIndex,
        charIndex: this.activeCharIndex,
        currentStats: this.getRealtimeStats()
      });
    }

    return { actionType, isCorrect, nextChar };
  }

  /**
   * Handle backspace on a single character
   */
  handleSingleBackspace(currentWord) {
    if (this.activeCharIndex > 0) {
      this.activeCharIndex--;
      const targetChar = currentWord.chars[this.activeCharIndex];
      targetChar.typed = null;
      targetChar.status = "untyped";
    }
    // Jump back to previous word if at beginning of current word and previous word had errors
    else if (this.activeWordIndex > 0) {
      const prevWord = this.wordStates[this.activeWordIndex - 1];
      if (!prevWord.isCorrect) {
        this.activeWordIndex--;
        prevWord.isCompleted = false;
        this.activeCharIndex = prevWord.chars.length;
      }
    }
  }

  /**
   * Handle Ctrl+Backspace (clear entire current word input)
   */
  handleCtrlBackspace(currentWord) {
    if (this.activeCharIndex > 0) {
      currentWord.chars.forEach(c => {
        c.typed = null;
        c.status = "untyped";
      });
      this.activeCharIndex = 0;
    } else if (this.activeWordIndex > 0) {
      this.activeWordIndex--;
      const prevWord = this.wordStates[this.activeWordIndex];
      prevWord.chars.forEach(c => {
        c.typed = null;
        c.status = "untyped";
      });
      prevWord.isCompleted = false;
      this.activeCharIndex = 0;
    }
  }

  /**
   * Handle Space key (Word progression)
   */
  handleSpace(currentWord) {
    // Prevent skipping empty words without typing anything
    if (this.activeCharIndex === 0 && currentWord.extraChars.length === 0) {
      return;
    }

    this.validateCurrentWord(currentWord);

    // If words mode and we completed all requested words
    if (this.activeWordIndex >= this.wordStates.length - 1) {
      this.finishTest();
      return;
    }

    this.activeWordIndex++;
    this.activeCharIndex = 0;

    // In time mode, if user is running low on words, append another batch
    if (this.options.mode === "time" && this.wordStates.length - this.activeWordIndex < 25) {
      this.appendWordBatch(50);
    }

    if (this.onWordCompleted) {
      this.onWordCompleted(this.activeWordIndex - 1, currentWord);
    }
  }

  /**
   * Append more words dynamically (for infinite time mode)
   */
  appendWordBatch(count = 50) {
    const newWords = generateWords(count, this.options.withPunctuation, this.options.withNumbers);
    newWords.forEach(w => {
      this.words.push(w);
      const chars = w.split("").map(c => ({
        original: c,
        typed: null,
        status: "untyped"
      }));
      this.wordStates.push({
        word: w,
        chars: chars,
        extraChars: [],
        isCompleted: false,
        isCorrect: false
      });
    });
  }

  /**
   * Validate whether current word was typed 100% accurately
   */
  validateCurrentWord(currentWord) {
    currentWord.isCompleted = true;
    const allCharsCorrect = currentWord.chars.every(c => c.status === "correct");
    const noExtras = currentWord.extraChars.length === 0;
    const allCharsTyped = this.activeCharIndex >= currentWord.chars.length;

    currentWord.isCorrect = allCharsCorrect && noExtras && allCharsTyped;

    // Count missed chars
    if (this.activeCharIndex < currentWord.chars.length) {
      for (let i = this.activeCharIndex; i < currentWord.chars.length; i++) {
        currentWord.chars[i].status = "incorrect";
        this.missedChars++;
        this.recordWeakKey(currentWord.chars[i].original);
      }
    }
  }

  /**
   * Track error frequency per key
   */
  recordWeakKey(char) {
    if (!char) return;
    const clean = char.toLowerCase();
    this.weakKeysMap[clean] = (this.weakKeysMap[clean] || 0) + 1;
  }

  /**
   * Peek next expected character
   */
  getNextExpectedChar() {
    const currentWord = this.wordStates[this.activeWordIndex];
    if (!currentWord) return "";

    if (this.activeCharIndex < currentWord.chars.length) {
      return currentWord.chars[this.activeCharIndex].original;
    }
    return " "; // Expecting spacebar
  }

  /**
   * Start test timer
   */
  startTest() {
    this.state = EngineState.RUNNING;
    this.startTime = performance.now();
    this.elapsedSeconds = 0;

    // Push initial point for chart
    this.timeline = [{ second: 0, wpm: 0, rawWpm: 0, errors: 0 }];

    this.timerInterval = setInterval(() => {
      this.tick();
    }, 1000);

    if (this.onStart) this.onStart();
  }

  /**
   * 1-Second Timer Tick
   */
  tick() {
    if (this.state !== EngineState.RUNNING) return;

    this.elapsedSeconds++;

    if (this.options.mode === "time") {
      this.remainingSeconds--;
      if (this.remainingSeconds <= 0) {
        this.remainingSeconds = 0;
        this.finishTest();
        return;
      }
    }

    const stats = this.getRealtimeStats();

    // Sample timeline point for chart
    const currentErrors = this.incorrectTypedChars;
    const prevErrors = this.timeline.length > 0 ? this.timeline.reduce((acc, p) => acc + (p.errors || 0), 0) : 0;
    const secondErrors = Math.max(0, currentErrors - prevErrors);

    this.timeline.push({
      second: this.elapsedSeconds,
      wpm: stats.wpm,
      rawWpm: stats.rawWpm,
      errors: secondErrors
    });

    this.wpmSnapshots.push(stats.wpm);

    if (this.onTick) {
      this.onTick({
        elapsedSeconds: this.elapsedSeconds,
        remainingSeconds: this.remainingSeconds,
        stats
      });
    }
  }

  /**
   * Calculate live WPM, CPM, Accuracy
   */
  getRealtimeStats() {
    const now = performance.now();
    const elapsedMinutes = this.startTime ? (now - this.startTime) / 60000 : 0.001;
    const safeMinutes = Math.max(elapsedMinutes, 0.008); // Avoid division by zero

    // Standard Net WPM: (correct characters / 5) / elapsedMinutes
    const wpm = Math.max(0, Math.round((this.correctTypedChars / 5) / safeMinutes));
    // Gross/Raw WPM: (total typed characters / 5) / elapsedMinutes
    const rawWpm = Math.max(0, Math.round((this.totalTypedChars / 5) / safeMinutes));
    // CPM (Characters Per Minute): correct characters / elapsedMinutes
    const cpm = Math.max(0, Math.round(this.correctTypedChars / safeMinutes));

    // Accuracy %: (correct keystrokes / total keystrokes) * 100
    const accuracy = this.totalTypedChars > 0
      ? Math.max(0, Math.min(100, (this.correctTypedChars / this.totalTypedChars) * 100))
      : 100;

    return { wpm, rawWpm, cpm, accuracy };
  }

  /**
   * Calculate Consistency percentage based on WPM variance
   */
  calculateConsistency() {
    if (this.wpmSnapshots.length < 2) return 100;

    const mean = this.wpmSnapshots.reduce((a, b) => a + b, 0) / this.wpmSnapshots.length;
    if (mean === 0) return 100;

    const variance = this.wpmSnapshots.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / this.wpmSnapshots.length;
    const stdDev = Math.sqrt(variance);

    // Coefficient of variation (CV) = (stdDev / mean) * 100
    // Consistency = 100 - CV
    const cv = (stdDev / mean) * 100;
    return Math.max(0, Math.min(100, Math.round(100 - cv)));
  }

  /**
   * Conclude test session and assemble complete report
   */
  finishTest() {
    if (this.state === EngineState.FINISHED) return;

    this.state = EngineState.FINISHED;
    this.endTime = performance.now();

    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }

    const totalSeconds = Math.max(1, (this.endTime - this.startTime) / 1000);
    const finalStats = this.getRealtimeStats();
    const consistency = this.calculateConsistency();

    // Top 5 weakest keys
    const sortedWeakKeys = Object.entries(this.weakKeysMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([char, count]) => ({ char, count }));

    const result = {
      wpm: finalStats.wpm,
      rawWpm: finalStats.rawWpm,
      cpm: finalStats.cpm,
      accuracy: finalStats.accuracy,
      consistency: consistency,
      duration: Math.round(totalSeconds),
      errors: this.incorrectTypedChars,
      chars: {
        correct: this.correctTypedChars,
        incorrect: this.incorrectTypedChars,
        extra: this.extraTypedChars,
        missed: this.missedChars
      },
      mode: this.options.mode,
      modeParam: this.options.modeParam,
      quoteMeta: this.quoteMeta || null,
      timeline: this.timeline,
      weakKeys: sortedWeakKeys,
      weakKeysMap: this.weakKeysMap
    };

    if (this.onFinish) {
      this.onFinish(result);
    }

    return result;
  }
}
