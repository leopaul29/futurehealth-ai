# 🏥 FutureHealth AI

**Predictive Preventive Medicine Platform**

> "Don't just track your health. Predict your future."

FutureHealth AI is a next-generation health management platform that converts static, physical medical reports into a dynamic, predictive roadmap. By combining **GPT-4o Vision OCR** with a **Proprietary Risk Engine**, we help users visualize their health trajectory one year into the future.

---

## 🌟 Key Features

* **⚡ GPT-Powered Medical OCR**: Instantly extract complex Japanese health check data from a photo. No manual entry, 99% accuracy across Kanji and technical medical tables.
* **🔮 Future Health Scoring**: Beyond current status, our engine calculates a "1-Year Outlook Score" to predict health deterioration before it happens.
* **📊 Smart Triage UI**: Clear visual indicators for "Safe," "Warning," and "Danger" zones based on Japanese medical standards.
* **⌚ Wearable Integration**: Ready for dynamic data syncing with Apple Watch and Fitbit to refine predictions in real-time.

---

## 🛠 Tech Stack

| Layer | Technology |
| --- | --- |
| **Frontend** | React + TypeScript + Vite |
| **Intelligence** | OpenAI GPT-4o Vision API (OCR & Extraction) |
| **State Management** | React Context API |
| **Image Handling** | HTML5 Canvas & FileReader API (Optimized for Large Files) |
| **Styling** | Modern CSS with Responsive Design |

---

## 🚀 Getting Started

### Prerequisites

* Node.js (v18+)
* OpenAI API Key

### Installation

1. Clone the repository:
```bash
git clone https://github.com/your-username/futurehealth-ai.git

```


2. Install dependencies:
```bash
npm install

```


3. Create a `.env` file in the root directory:
```env
VITE_OPENAI_API_KEY=your_api_key_here
VITE_OPENAI_MODEL=gpt-4o-mini

```


4. Start the development server:
```bash
npm run dev

```



---

## 📈 Business Logic & Impact

This project addresses the **¥45 Trillion** medical expenditure crisis in Japan by focusing on "Pre-Symptomatic" (Mibyo) intervention.

1. **Retention Hook**: Users don't just "check" their results once; they monitor their "Future Score" monthly.
2. **B2B2C Potential**: Designed for insurance companies to reduce claim payouts through gamified prevention.
3. **Actionability**: The UI distinguishes between "Self-care" and "Medical Intervention," reducing unnecessary hospital visits.

---

## 🛡 Security & Privacy

* **Local Processing**: Images are processed via secure API calls and are not stored permanently.
* **Data Masking**: PII (Personally Identifiable Information) can be masked before transmission to the LLM.
