# 🌤️ Atmosfera - Weather-Based Media Discovery

**Atmosfera** is a cross-platform mobile application built with Ionic and React that revolutionizes how users discover entertainment. Instead of endlessly scrolling through popular lists, Atmosfera uses your real-world local weather to determine your "vibe" and recommends the perfect Anime, Manga, and Video Game for that specific moment.

## ✨ Key Features

* **🌍 Native Geolocation & Weather Mapping:** Accurately detects your current location and maps real-time weather conditions into a specific "Mood" and media genre.
* **🎲 The Vibe Engine (Gacha System):** To prevent decision fatigue, users are limited to 3 "Analyze Vibe" rolls per day. Make every discovery count!
* **🎒 Cloud-Synced Showcase:** Found a hidden gem? Save it directly to your personal Showcase. Integrated with Supabase for secure, real-time cloud storage.
* **🎨 Modern Asymmetric UI:** A stunning, premium interface featuring dark cyber aesthetics, glassmorphism elements, and smooth staggered animations.
* **🔐 Secure Authentication:** Complete authentication flow (Register, Login, Password Recovery) seamlessly connected between the mobile native environment and backend database.

## 🛠️ Technology Stack

* **Frontend:** React.js, TypeScript, Ionic Framework
* **Native Compilation:** Capacitor (Android & iOS ready)
* **Backend & Database:** Supabase (PostgreSQL & Auth)
* **APIs Used:**
  * [BigDataCloud](https://www.bigdatacloud.com/) (Reverse Geocoding)
  * [Jikan API](https://jikan.moe/) (Unofficial MyAnimeList API)
  * [RAWG API](https://rawg.io/) (Video Games Database)

## 🚀 How to Run Locally

If you want to clone and run this project on your local machine, follow these steps:

### Prerequisites
* Node.js and npm installed
* Android Studio (for building the .apk)
* API Keys for RAWG and Supabase

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/tobisawaa/Atmosfera.git
   cd atmosfera
Install dependencies:

Bash
npm install
Set up Environment Variables:
Create a .env file in the root directory and add your API keys:

Code snippet
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_RAWG_API_KEY=your_rawg_api_key
Run on Web Browser:

Bash
npm run dev
📱 Building for Android
To compile the app into a native Android .apk:

Bash
# 1. Build the React project
npm run build

# 2. Sync web assets to Capacitor Android folder
npx cap sync android

# 3. Open Android Studio to build the APK
npx cap open android
📜 Privacy Policy
Atmosfera respects user privacy, particularly regarding Geolocation data. [Read our full Privacy Policy here](https://peridot-quokka-f8e.notion.site/Atmosfera-Privacy-Policy-34fcefef99d480e4aae7c4aba11ad075)