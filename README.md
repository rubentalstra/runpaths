# RunPaths 🏃‍♂️

**RunPaths** is a Next.js web application that helps runners discover scenic,
optimized running routes based on their preferences. The app generates circular
running loops that avoid traffic lights, prefer parks, and match your desired
distance.

![Next.js](https://img.shields.io/badge/Next.js-16.0-black?style=flat-square&logo=next.js)
![React](https://img.shields.io/badge/React-19.2-blue?style=flat-square&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue?style=flat-square&logo=typescript)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4.1-38bdf8?style=flat-square&logo=tailwindcss)

## ✨ Features

- 🗺️ **Interactive Map**: Click anywhere to set your starting location
- 📍 **Geolocation Support**: Automatically detects your current location
- 🔄 **Multiple Route Options**: Generates 3-5 different circular routes to
  choose from
- 🎯 **Customizable Preferences**:
  - Distance (1-25 km)
  - Avoid traffic lights
  - Prefer routes near parks
  - Custom running pace (3-10 min/km)
- 🎨 **Colorblind Mode**: Alternative color scheme for accessibility
- 📊 **Route Statistics**: View distance, estimated duration, and route quality
  scores
- 🏙️ **City Search**: Search for any city worldwide if geolocation is
  unavailable
- 🚦 **Traffic Light Detection**: Routes are analyzed for traffic light density
  (when enabled)

## 🛠️ Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) with App Router
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [TailwindCSS 4](https://tailwindcss.com/)
- **Map**: [MapLibre GL JS](https://maplibre.org/)
- **Routing API**: [OpenRouteService](https://openrouteservice.org/)
- **Geospatial**: [Turf.js](https://turfjs.org/)
- **Animation**: [Framer Motion](https://www.framer.com/motion/)
- **Validation**: [Zod](https://zod.dev/)

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js**: >= 20.0.0
- **npm**: >= 10.0.0

You can check your versions with:

```bash
node --version
npm --version
```

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/rubentalstra/runpaths.git
cd runpaths
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Environment Variables

The application requires an OpenRouteService API key to generate routes.

1. **Get your free API key**:
   - Visit [OpenRouteService Sign Up](https://openrouteservice.org/dev/#/signup)
   - Create a free account
   - Generate an API key (free tier allows 2000 requests/day)

2. **Create environment file**:

```bash
cp .env.local.example .env.local
```

3. **Edit `.env.local`** and add your API key:

```env
ORS_API_KEY=your_actual_api_key_here
```

> ⚠️ **Important**: Never commit your `.env.local` file to version control. It's
> already in `.gitignore`.

### 4. Run the Development Server

```bash
npm run dev
```

The application will be available at
[http://localhost:3000](http://localhost:3000)

## 📦 Available Scripts

| Command              | Description                           |
| -------------------- | ------------------------------------- |
| `npm run dev`        | Start development server on port 3000 |
| `npm run build`      | Build the production application      |
| `npm run start`      | Start the production server           |
| `npm run lint`       | Check for linting errors              |
| `npm run lint:fix`   | Automatically fix linting errors      |
| `npm run type-check` | Run TypeScript type checking          |
| `npm run clean`      | Clean build artifacts and cache       |

## 🎮 How to Use

1. **Allow Location Access** (or search for a city)
   - When prompted, allow browser location access for automatic positioning
   - Alternatively, search for any city using the search bar

2. **Set Starting Point**
   - Click anywhere on the map to set a custom starting location
   - Or use the detected geolocation

3. **Adjust Preferences** (optional)
   - Select distance (default: 5 km)
   - Adjust traffic light avoidance (0-100%)
   - Set park preference (0-100%)
   - Configure your running pace

4. **Generate Routes**
   - Click the "Find routes" button
   - The app will generate 3-5 optimized circular routes

5. **Explore Routes**
   - View route statistics (distance, duration, score)
   - Click on different routes to see alternatives
   - Check the map legend for route colors and markers

## 🏗️ Project Structure

```
runpaths/
├── app/                      # Next.js App Router
│   ├── actions.ts           # Server actions (route generation)
│   ├── globals.css          # Global styles
│   ├── layout.tsx           # Root layout
│   ├── page.tsx             # Main page component
│   ├── hooks/               # Custom React hooks
│   │   ├── useGeolocation.ts    # Location detection
│   │   ├── useRoutes.ts         # Route state management
│   │   ├── usePreferences.ts    # User preferences
│   │   └── useToast.ts          # Toast notifications
│   └── lib/                 # Utility functions and types
│       ├── constants.ts     # App configuration
│       ├── types.ts         # TypeScript types
│       └── utils.ts         # Helper functions
├── components/              # React components
│   ├── CitySearch.tsx      # City search component
│   ├── Controls.tsx        # Route preferences controls
│   ├── Map.tsx             # MapLibre map component
│   ├── RouteStats.tsx      # Route information display
│   ├── Toast.tsx           # Toast notification system
│   └── ui/                 # UI components
│       ├── ErrorFallback.tsx   # Error boundary fallback
│       └── LoadingSpinner.tsx  # Loading indicator
├── .env.local.example      # Environment variables template
├── next.config.mjs         # Next.js configuration
├── package.json            # Dependencies and scripts
├── tailwind.config.js      # TailwindCSS configuration
└── tsconfig.json           # TypeScript configuration
```

## 🐛 Troubleshooting

### Common Issues

1. **"Missing ORS_API_KEY environment variable"**
   - Ensure you've created `.env.local` and added your API key
   - Restart the development server after adding the key

2. **"Failed to generate routes"**
   - Check your internet connection
   - Verify your ORS API key is valid
   - Ensure you haven't exceeded the API rate limit (2000 requests/day)

3. **Location not detected**
   - Allow location permissions in your browser
   - Use the city search feature as an alternative
   - Click the map to manually set a starting point

4. **Map not loading**
   - Clear your browser cache
   - Check browser console for errors
   - Ensure JavaScript is enabled

### API Rate Limits

The free OpenRouteService tier provides:

- 2000 requests per day
- 40 requests per minute

The app generates 5 route candidates per search, so plan accordingly.

## 🔐 Privacy & Data

- **No user data is stored** on any servers
- All preferences are stored locally in your browser
- Location data is only used for route generation and never transmitted
  elsewhere
- OpenRouteService API is used solely for route calculation

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file
for details.

## 👨‍💻 Author

**Ruben Talstra**

## 🙏 Acknowledgments

- [OpenRouteService](https://openrouteservice.org/) for routing API
- [OpenStreetMap](https://www.openstreetmap.org/) contributors for map data
- [MapLibre](https://maplibre.org/) for the mapping library
- [Turf.js](https://turfjs.org/) for geospatial calculations
