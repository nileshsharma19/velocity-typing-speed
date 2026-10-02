# ⚡ VelocityType — Modern Typing Speed Test & Practice App

**VelocityType** is a modern, high-performance web application for measuring and improving your typing speed, accuracy, and consistency. Designed with clean minimalist aesthetics, procedural mechanical switch sounds (zero latency Web Audio API), rich analytics, customizable themes, and targeted weak-key training.

---

## 🌟 Key Features

- ⏱️ **Multi-Mode Engine**:
  - **Time Mode**: 15s, 30s, 60s, 120s test countdowns.
  - **Words Mode**: 10, 25, 50, 100 word challenge sets.
  - **Quote Mode**: Famous quotes from science, philosophy, and tech with author attribution.
  - **Code Mode**: Practice typing syntax in JavaScript, Python, and HTML/CSS.
  - **Custom Mode**: Paste any article, code snippet, or custom text.
- 🎧 **Procedural Mechanical Audio (Web Audio API)**:
  - Realistic switch sound synthesis (Clicky Blue, Thocky Linear, Vintage Typewriter, Bubble Pop, and Muted).
  - Victory fanfare chords and error buzz notifications.
- 📊 **In-Depth Results & Visual Analytics**:
  - Net WPM, Gross / Raw WPM, Accuracy (%), CPM, Consistency (%).
  - Dynamic interactive SVG/Canvas WPM timeline curve with error markers.
  - Character accuracy breakdown (Correct, Incorrect, Extra, Missed).
  - **Weak Keys Diagnostic**: Identifies top missed keys with a 1-click **Targeted Practice Drill**.
- ⌨️ **Interactive Virtual Keyboard**:
  - Real-time keypress glow, next-expected-key guide, and error heatmap.
- 🎨 **7 Distinct Visual Themes**:
  - *Midnight Slate* (Default dark)
  - *Cyberpunk Neon* (Black & Yellow/Cyan)
  - *Nordic Frost* (Arctic clean slate)
  - *Dracula* (Gothic purple/pink)
  - *Sunset Horizon* (Warm amber & violet)
  - *Matrix Terminal* (Green hacker terminal)
  - *Minimal Paper* (Crisp clean light theme)
- 💾 **LocalStorage Stats & History**:
  - All-time Personal Best (PB), Average WPM, and detailed test logs table.
- ⚡ **Shortcuts & Smooth Controls**:
  - Press `Tab` to quickly restart test.
  - Press `Ctrl + Backspace` to delete entire word.
  - Press `Esc` to close any open modal.

---

## 🚀 Quick Start

No build step or dependencies required. You can simply open `index.html` in your favorite browser.

To serve with a local static server:

```bash
# Using Python
python -m http.server 8000

# Using Node / npx
npx serve .
```

Then open `http://localhost:8000` in your web browser.

---

## 📂 Project Structure

```
typing-speed-test/
├── index.html              # Main HTML markup & modal dialogs
├── css/
│   ├── style.css           # Core styling, responsive layout, glassmorphism
│   └── themes.css          # 7 Color palettes and custom variables
├── js/
│   ├── app.js              # Application controller & event management
│   ├── engine.js           # Core typing engine & metrics calculations
│   ├── sound.js            # Web Audio API procedural sound engine
│   ├── words.js            # Curated word banks, quotes & code snippets
│   ├── chart.js            # Canvas performance curve and error markers
│   ├── storage.js          # LocalStorage persistence manager
│   └── virtual-keyboard.js # Interactive on-screen keyboard & heatmap
└── README.md               # Documentation
```
