/**
 * VelocityType - LocalStorage & Analytics Persistence Manager
 */

const STORAGE_KEYS = {
  SETTINGS: "vt_settings",
  HISTORY: "vt_history",
  STATS: "vt_stats"
};

const DEFAULT_SETTINGS = {
  theme: "midnight",
  fontFamily: "'JetBrains Mono', monospace",
  fontSize: 24,
  caretStyle: "smooth", // 'smooth' | 'blink' | 'block' | 'underline' | 'off'
  soundType: "clicky",  // 'clicky' | 'thocky' | 'typewriter' | 'bubble' | 'off'
  soundVolume: 0.5,
  isMuted: false,
  showLiveWpm: true,
  showLiveTimer: true,
  showKeyboard: false,
  strictMasterMode: false,
  quickRestart: true,
  smoothScroll: true
};

export class StorageManager {
  /**
   * Load user settings with fallback to defaults
   */
  static getSettings() {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      return stored ? { ...DEFAULT_SETTINGS, ...JSON.parse(stored) } : { ...DEFAULT_SETTINGS };
    } catch (e) {
      console.warn("Error reading settings from localStorage", e);
      return { ...DEFAULT_SETTINGS };
    }
  }

  /**
   * Save user settings
   * @param {Object} settings 
   */
  static saveSettings(settings) {
    try {
      const current = this.getSettings();
      const updated = { ...current, ...settings };
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(updated));
      return updated;
    } catch (e) {
      console.warn("Error writing settings to localStorage", e);
      return settings;
    }
  }

  /**
   * Get all recorded past test sessions
   * @returns {Array<Object>}
   */
  static getHistory() {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.HISTORY);
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      console.warn("Error reading history from localStorage", e);
      return [];
    }
  }

  /**
   * Append a new test result
   * @param {Object} result 
   */
  static saveTestResult(result) {
    try {
      const history = this.getHistory();
      const entry = {
        id: Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
        timestamp: new Date().toISOString(),
        wpm: Math.round(result.wpm),
        rawWpm: Math.round(result.rawWpm),
        accuracy: Math.round(result.accuracy * 10) / 10,
        cpm: Math.round(result.cpm),
        consistency: Math.round(result.consistency || 100),
        mode: result.mode,
        modeParam: result.modeParam,
        duration: result.duration,
        errors: result.errors,
        chars: result.chars, // { correct, incorrect, extra, missed }
        weakKeys: result.weakKeys || []
      };

      // Store up to last 100 tests
      history.unshift(entry);
      if (history.length > 100) history.pop();

      localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(history));
      return entry;
    } catch (e) {
      console.warn("Error saving test result to localStorage", e);
      return null;
    }
  }

  /**
   * Calculate all-time summary statistics
   */
  static getStatsSummary() {
    const history = this.getHistory();
    if (history.length === 0) {
      return {
        testsCompleted: 0,
        bestWpm: 0,
        avgWpm: 0,
        avgAccuracy: 0,
        totalTimeTypedSec: 0
      };
    }

    let highestWpm = 0;
    let totalWpm = 0;
    let totalAcc = 0;
    let totalDuration = 0;

    history.forEach(item => {
      if (item.wpm > highestWpm) highestWpm = item.wpm;
      totalWpm += item.wpm;
      totalAcc += item.accuracy;
      totalDuration += item.duration || 0;
    });

    return {
      testsCompleted: history.length,
      bestWpm: highestWpm,
      avgWpm: Math.round(totalWpm / history.length),
      avgAccuracy: Math.round((totalAcc / history.length) * 10) / 10,
      totalTimeTypedSec: Math.round(totalDuration)
    };
  }

  /**
   * Clear all stored test history
   */
  static clearHistory() {
    try {
      localStorage.removeItem(STORAGE_KEYS.HISTORY);
      return true;
    } catch (e) {
      console.warn("Error clearing history", e);
      return false;
    }
  }
}
