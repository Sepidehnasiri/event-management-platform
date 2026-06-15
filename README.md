# EventHub — Event Management Platform

A full-featured React 18 single-page application for browsing, booking, and managing events. Built to showcase modern React patterns including advanced hooks, routing with loaders/actions, and layered state management.

---

## Tech Stack

| Layer | Library |
|---|---|
| UI | React 18.3 |
| Routing | React Router v6 (loaders, actions, defer) |
| Server state | TanStack Query v5 |
| Complex form state | Redux Toolkit |
| Global UI state | React Context (Theme, User) |
| HTTP | Axios |
| Mock API | JSON Server |
| Styling | CSS Modules |

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm

### Install dependencies

```bash
cd event-management
npm install
```

### Run the app

```bash
npm run dev
```

This starts both the React app (port 3000) and JSON Server mock API (port 3001) concurrently.

| Service | URL |
|---|---|
| React app | http://localhost:3000 |
| JSON Server API | http://localhost:3001 |

### Run separately (optional)

```bash
# React dev server only
npm start

# JSON Server only
npm run server
```

---

## Features

### Events Discovery (`/`, `/events`)
- Responsive grid of event cards
- Non-blocking search with `useDeferredValue`
- Filters: Category (pill buttons), Date range, Price range
- Sort by date or price
- Heart/favourite button with **optimistic server-side like counter** — updates instantly, rolls back on failure
- Data prefetched by route loader before render, cached by TanStack Query

### Event Details (`/events/:id`)
- Route `loader` prefetches event data into TanStack Query cache before render
- `defer` streams slow data (reviews) separately — reviews appear after a simulated delay with a skeleton placeholder
- `Await` + `Suspense` renders a skeleton while deferred content loads
- `useRouteLoaderData('root')` surfaces the logged-in user's name without an extra fetch
- Book Tickets / Save Event sidebar

### Booking Flow (`/book/:eventId`)
- 3-step wizard managed with `useReducer`
  1. **Select Tickets** — quantity picker per ticket type
  2. **Attendee Details** — per-ticket holder form with full validation; `useId` for accessible `label`/`input` pairs
  3. **Review & Confirm**
- **`useOptimistic` + `startTransition`** — confirmation page shows instantly with reference number before the API responds; rolls back to step 3 on failure
- TanStack Query mutation syncs the booking and invalidates cache on success

### My Bookings (`/my-bookings`)
- Four filter tabs: All · Upcoming · Past · Cancelled (client-side via TanStack Query `select`)
- Single network request shared across all tabs
- Explicit `staleTime` (2 min) and `gcTime` (5 min)
- **Optimistic cancel** — booking shows "Cancelled" badge instantly; rolled back via `onMutate`/`onError` if the API call fails

### Create Event (`/create-event`)
- 3-step form: Basic Info → Date/Time/Location/Tickets → Preview & Publish
- State managed by **Redux Toolkit** `createSlice`
- Draft auto-saved to `localStorage` on each step advance
- Dynamic ticket type rows (add / remove)
- `useId` on every form field for accessibility
- Publishes via Axios POST and invalidates the events cache

### Profile (`/profile`)
- Populated from `useRouteLoaderData('root')` — no extra fetch on first paint
- Edit display name (PATCH via TanStack Query mutation)
- Light / Dark theme toggle (persisted to `localStorage`)
- Saved events grid filtered client-side from the shared events cache
- Quick-link buttons to key routes

### Routing
- Route loaders prefetch data into TanStack Query before render
- `defer` on event detail for progressive data loading
- `errorElement` on every route for graceful error boundaries
- `useNavigation` drives a top-of-page loading bar during transitions
- Lazy-loaded `CreateEvent` and `Profile` pages with `Suspense` fallback

### Theme & Context
- `ThemeContext` — light/dark toggle, persisted to `localStorage` (dark is default)
- `UserContext` — favourites list, notification toasts

---

## Project Structure

```
src/
├── App.jsx                     # Root layout: providers + nav loading bar
├── routes.jsx                  # Route definitions with loaders, actions, defer
├── index.js
│
├── components/
│   ├── BookingFlow/            # 3-step booking wizard (useReducer + useOptimistic)
│   ├── Common/                 # Modal (Portal), Notification (Portal)
│   ├── EventCard/              # Card with optimistic like counter
│   ├── EventDetail/            # Detail page with deferred reviews
│   ├── EventList/              # Grid with search/filter/sort
│   ├── MyBookings/             # Bookings list with optimistic cancel
│   └── Navbar/                 # Nav with desktop links + mobile hamburger
│
├── contexts/
│   ├── ThemeContext.jsx
│   └── UserContext.jsx
│
├── hooks/
│   ├── useEvents.js            # TanStack Query hooks + optimistic like mutation
│   └── useBookings.js          # TanStack Query hooks + optimistic cancel mutation
│
├── pages/
│   ├── CreateEvent.jsx         # Redux multi-step form
│   ├── ErrorPage.jsx
│   ├── Home.jsx
│   └── Profile.jsx             # User profile with useRouteLoaderData
│
├── services/
│   ├── api.js                  # Axios instance + endpoint helpers
│   └── queryClient.js          # TanStack Query client
│
├── store/
│   ├── index.js
│   └── slices/eventFormSlice.js
│
└── styles/
    └── global.css
```

---

## API Endpoints (JSON Server)

| Method | Endpoint | Description |
|---|---|---|
| GET | `/events` | List events (supports `?category=` filter) |
| GET | `/events/:id` | Single event |
| POST | `/events` | Create event |
| PATCH | `/events/:id` | Update event (e.g. likes) |
| GET | `/bookings?userId=user1` | User's bookings |
| POST | `/bookings` | Create booking |
| PATCH | `/bookings/:id` | Update booking (cancel) |
| GET | `/users/:id` | User profile |
| PATCH | `/users/:id` | Update user profile |

Mock data lives in `db.json`. The default simulated user is `user1` (John Doe).

---

## React Patterns Demonstrated

| Pattern | Where |
|---|---|
| `useOptimistic` + `startTransition` | BookingFlow — instant confirmation step |
| `useId` | BookingFlow attendee forms, CreateEvent all fields |
| `useDeferredValue` | EventList search input |
| `defer` + `Await` + `Suspense` | EventDetail reviews section |
| `useRouteLoaderData` | EventDetail, Profile — access parent route data |
| `useNavigation` | App layout — loading bar during navigation |
| `useReducer` | BookingFlow step/ticket/attendee state |
| TanStack Query optimistic mutations | EventCard likes, MyBookings cancel |
| TanStack Query `select` | Client-side booking filter from shared cache |
| Redux Toolkit `createSlice` | Create Event multi-step form state |
| Route `loader` + query cache prefetch | All main routes |
| `errorElement` per route | All routes |
| Lazy loading + `Suspense` | CreateEvent, Profile pages |
| CSS Modules | All components |
| React Portals | Modal, Notification |
