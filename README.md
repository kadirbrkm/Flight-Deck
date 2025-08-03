# ✈️ Pilot Flight Logger

A comprehensive web application designed specifically for pilots to log, track, and visualize their flight history. The platform features an interactive world map, detailed flight logging, advanced filtering, and export capabilities.

![Flight Logger Screenshot](https://via.placeholder.com/800x400/667eea/ffffff?text=Pilot+Flight+Logger)

## 🌟 Features

### ✈️ Flight Logging
- **Comprehensive Form**: Log flights with date, departure/arrival airports, aircraft type, flight hours, flight type, and notes
- **Validation**: Built-in form validation to ensure data accuracy
- **Auto-formatting**: Airport codes are automatically converted to uppercase

### 🗺️ Interactive World Map
- **Real-time Visualization**: See all your flights plotted on an interactive world map
- **Flight Paths**: Visual flight paths with different colors for different flight types:
  - 🟡 Training flights
  - 🔵 Commercial flights  
  - 🟢 Personal flights
  - 🔴 Cross Country flights
- **Interactive Markers**: Click on departure/arrival markers and flight paths for detailed information
- **Map Controls**: Clear map, fit all flights, and zoom functionality

### 📊 Statistics Dashboard
- **Total Flight Hours**: Real-time calculation of accumulated flight time
- **Flight Count**: Track total number of flights logged
- **Airports Visited**: Count of unique airports in your flight history

### 🔍 Advanced Filtering
- **Filter by Month**: View flights from specific months/years
- **Filter by Aircraft**: See flights for specific aircraft types
- **Filter by Route**: Search for specific routes (e.g., "JFK-LAX")
- **Real-time Updates**: Map and table update instantly as filters are applied

### ✏️ Flight Management
- **Edit Flights**: Modify any logged flight with in-line editing
- **Delete Flights**: Remove flights with confirmation dialogs
- **Bulk Operations**: Clear all filters at once

### 📄 Export & Reports
- **CSV Export**: Download your complete flight log as a CSV file
- **Date-stamped Files**: Exported files include the current date
- **Professional Format**: Properly formatted for import into other systems

### 📱 Responsive Design
- **Desktop Optimized**: Full-featured experience on desktop computers
- **Tablet Friendly**: Touch-optimized interface for tablet use
- **Mobile Responsive**: Accessible on mobile devices
- **Professional UI**: Clean, modern design with glassmorphism effects

## 🚀 Getting Started

### Prerequisites
- A modern web browser (Chrome, Firefox, Safari, Edge)
- No server required - runs entirely in the browser

### Installation
1. **Download or Clone** the project files
2. **Open** `index.html` in your web browser
3. **Start Logging** your flights immediately!

### File Structure
```
pilot-flight-logger/
├── index.html          # Main application file
├── style.css           # Comprehensive styling
├── script.js           # Application logic
└── README.md           # This file
```

## 📖 Usage Guide

### Logging Your First Flight
1. **Fill out the flight form** on the left side:
   - Select the flight date
   - Enter flight duration in hours (e.g., 2.5)
   - Enter departure airport code (e.g., KJFK, LAX)
   - Enter arrival airport code
   - Select aircraft type
   - Choose flight type
   - Add optional notes

2. **Click "Log Flight"** to save your entry

3. **View your flight** on the map and in the flight log table

### Using the Map
- **View Flight Paths**: Each flight is visualized as a line between airports
- **Click Markers**: Get airport information
- **Click Flight Paths**: See detailed flight information
- **Clear Map**: Remove all flight paths temporarily
- **Fit All Flights**: Zoom map to show all your flights

### Filtering Flights
- **Month Filter**: Select a specific month/year from the dropdown
- **Aircraft Filter**: Choose a specific aircraft type
- **Route Filter**: Type part of a route (e.g., "JFK" or "JFK-LAX")
- **Clear Filters**: Reset all filters to show all flights

### Managing Flights
- **Edit**: Click the "Edit" button in any table row to modify a flight
- **Delete**: Click the "Delete" button to remove a flight (with confirmation)
- **Cancel Edit**: Use the "Cancel Edit" button to abort changes

### Exporting Data
- Click **"Export Log"** to download your flights as a CSV file
- File includes all flight data in a format compatible with spreadsheet applications
- Filename includes the current date for easy organization

## 🛩️ Supported Airports

The application includes a built-in database of major airports:
- **US Major Airports**: JFK, LAX, ORD, ATL, DEN, SEA, MIA, BOS, SFO, DFW, PHX, LAS, MCO, CLT, IAH
- **ICAO Codes**: Full 4-letter ICAO codes (KJFK, KLAX, etc.)
- **IATA Codes**: 3-letter IATA codes (JFK, LAX, etc.)
- **Geocoding Fallback**: Unknown airports are geocoded automatically

## 💾 Data Storage

- **Local Storage**: All flight data is stored locally in your browser
- **Persistent**: Data remains available between browser sessions
- **Private**: Your data never leaves your computer
- **Backup**: Export your data regularly as CSV files for backup

## 🎨 Design Features

- **Glassmorphism UI**: Modern translucent design elements
- **Gradient Backgrounds**: Beautiful color gradients throughout
- **Responsive Grid**: Flexible layout that adapts to screen size
- **Professional Typography**: Clear, readable fonts
- **Intuitive Icons**: Font Awesome icons for better UX
- **Smooth Animations**: Subtle hover effects and transitions

## 🔧 Technical Details

### Built With
- **HTML5**: Semantic markup for accessibility
- **CSS3**: Modern styling with flexbox, grid, and custom properties
- **Vanilla JavaScript**: No frameworks required
- **Leaflet.js**: Interactive maps
- **Font Awesome**: Professional icons
- **OpenStreetMap**: Map tiles

### Browser Compatibility
- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

### Performance
- **Fast Loading**: Minimal dependencies
- **Efficient Rendering**: Optimized DOM manipulation
- **Local Processing**: All calculations done client-side
- **Memory Efficient**: Proper cleanup and event management

## 🚁 Flight Types Supported

- **Training**: Flight instruction and practice
- **Commercial**: Professional/airline flights
- **Personal**: Private recreational flights
- **Cross Country**: Long-distance flights

## 📊 Statistics Tracked

- **Total Flight Hours**: Cumulative flight time
- **Total Flights**: Number of flight entries
- **Unique Airports**: Count of different airports visited
- **Flight Distribution**: Visual representation on map

## 🔒 Privacy & Security

- **No External Servers**: All data stays on your device
- **No Registration**: No accounts or personal information required
- **GDPR Compliant**: No data collection or tracking
- **Offline Capable**: Works without internet (after initial load)

## 🐛 Troubleshooting

### Common Issues

**Map not loading?**
- Check internet connection for map tiles
- Try refreshing the page

**Airport not found?**
- Use ICAO codes (KJFK) or IATA codes (JFK)
- Check spelling of airport codes

**Data disappeared?**
- Check if browser data/cookies were cleared
- Export data regularly as backup

**Filter not working?**
- Try clearing all filters and reapplying
- Check filter criteria spelling

## 🤝 Contributing

This is a standalone web application. To modify:
1. Edit the HTML structure in `index.html`
2. Modify styles in `style.css`
3. Update functionality in `script.js`
4. Test in multiple browsers

## 📝 License

This project is open source and available under the MIT License.

## 🛫 Happy Flying!

Track your aviation journey with style and precision. Whether you're a student pilot building hours or a commercial pilot tracking your career, this flight logger provides all the tools you need.

---

*Built for pilots, by aviation enthusiasts* ✈️
