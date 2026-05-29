# EventHub — Event Management Platform

A full-featured React application for browsing, booking, and managing event tickets.

### Prerequisites
- Node.js v16+ and npm

### Installation

# 1. Clone the repo
git clone https://github.com/YOUR_USERNAME/event-management-platform.git
cd event-management-platform

# 2. Install dependencies
npm install

# 3. Install json-server globally (if not already installed)
npm install -g json-server
```

### Running the App

You need **two terminals**:

**Terminal 1 — Start the JSON Server (backend):**
```bash
json-server --watch db.json --port 3001
```

**Terminal 2 — Start the React App:**
```bash
npm start
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📁 Project Structure

```
src/
├── components/
│   ├── Navbar/          # Navigation with theme toggle
│   ├── EventCard/       # Reusable event card (memoized)
│   ├── EventList/       # Events page with search & filters
│   ├── EventDetail/     # Single event page
│   ├── BookingFlow/     # Multi-step booking (useReducer)
│   ├── MyBookings/      # Booking management
│   └── Common/          # Modal (Portal), Notification (Portal)
├── contexts/
│   ├── ThemeContext.jsx  # Light/Dark mode (localStorage persist)
│   └── UserContext.jsx   # Favorites & notifications
├── hooks/
│   └── useApi.js         # API layer for json-server
├── pages/
│   └── Home.jsx          # Landing page
└── styles/
    └── global.css        # CSS variables & reset
```

## ✅ Features

### Events
- Browse all events in a responsive card grid
- Search by title (debounced)
- Filter by category, date range, and price
- Sort by date or price
- Like/favorite events (persisted in localStorage)

### Event Details
- Full event information with image, organizer, venue
- Ticket types with pricing
- Favorite toggle

### Booking Flow (3-step)
1. **Select Tickets** — Choose type & quantity with real-time price calc
2. **Attendee Details** — Form validation for each ticket holder
3. **Confirmation** — Review summary, then confirm
4. **Success** — Reference number displayed

### My Bookings
- View all bookings with status badges
- Filter by Upcoming / Past / Cancelled
- Cancel upcoming bookings (with confirmation modal)

### Theme
- Dark mode is now the default experience
- Light mode remains available via the navbar toggle
- Persists across sessions via localStorage

## 🔧 React Concepts Demonstrated

| Concept | Where Used |
|---|---|
| `useState` | All components (local state) |
| `useReducer` | `BookingFlow` (multi-step form state) |
| `useEffect` | Data fetching in EventList, EventDetail, BookingFlow |
| `useContext` | ThemeContext, UserContext |
| `useRef` | Auto-focus search input in EventList |
| `memo` | EventCard wrapped in React.memo |
| Portals | Modal and Notification components |
| Context API | Theme + User state |
| React Router | Full client-side routing |
| Form validation | Attendee details step |

## 🌐 API Endpoints (json-server)

| Method | Endpoint | Description |
|---|---|---|
| GET | `/events` | All events (supports `?category=&title_like=`) |
| GET | `/events/:id` | Single event |
| GET | `/bookings?userId=user1` | User's bookings |
| POST | `/bookings` | Create booking |
| PATCH | `/bookings/:id` | Update booking (cancel) |
