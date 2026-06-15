import { lazy, Suspense } from 'react';
import { defer } from 'react-router-dom';
import Home from './pages/Home';
import EventDetail from './components/EventDetail/EventDetail';
import BookingFlow from './components/BookingFlow/BookingFlow';
import MyBookings from './components/MyBookings/MyBookings';
import App from './App';
import ErrorPage from './pages/ErrorPage';
import queryClient from './services/queryClient';
import { eventsAPI, usersAPI } from './services/api';

const CreateEvent = lazy(() => import('./pages/CreateEvent'));
const Profile = lazy(() => import('./pages/Profile'));

const CURRENT_USER_ID = 'user1';

// Simulated slow reviews data (demonstrates defer)
const FAKE_REVIEWS = {
  '1': [
    { id: 'r1', author: 'Alice M.', rating: 5, comment: 'Absolutely incredible — world-class speakers and great networking!' },
    { id: 'r2', author: 'Bob K.', rating: 4, comment: 'Fantastic content and atmosphere. Will be back next year.' },
  ],
  '2': [
    { id: 'r3', author: 'Carol S.', rating: 5, comment: 'Best jazz festival I\'ve attended. Unforgettable performances.' },
    { id: 'r4', author: 'Dave R.', rating: 4, comment: 'Amazing atmosphere, great lineup. Highly recommend the weekend pass.' },
  ],
  '3': [
    { id: 'r5', author: 'Emma L.', rating: 5, comment: 'Finished my first marathon here! Course was stunning, well-organized.' },
  ],
  '4': [
    { id: 'r6', author: 'Frank O.', rating: 5, comment: 'A masterclass in contemporary art. The installations were breathtaking.' },
    { id: 'r7', author: 'Grace P.', rating: 4, comment: 'Incredibly curated show. Guided tour is a must.' },
  ],
};

const fetchReviews = (eventId) =>
  new Promise(resolve =>
    setTimeout(
      () => resolve(FAKE_REVIEWS[eventId] || [
        { id: 'r-default', author: 'Sam T.', rating: 4, comment: 'Great event, highly recommend!' },
      ]),
      1800
    )
  );

// Root loader — fetches current user, accessible via useRouteLoaderData('root')
export const rootLoader = async () => {
  try {
    const user = await queryClient.ensureQueryData({
      queryKey: ['user', CURRENT_USER_ID],
      queryFn: () => usersAPI.getById(CURRENT_USER_ID).then(r => r.data),
    });
    return { user };
  } catch {
    return { user: null };
  }
};

// Events loader — prefetches events into TanStack Query cache
export const eventsLoader = async () => {
  try {
    await queryClient.ensureQueryData({
      queryKey: ['events', {}],
      queryFn: () => eventsAPI.getAll({}).then(r => r.data),
    });
  } catch { /* component handles errors via useQuery */ }
  return null;
};

// Event detail loader — eager event data + deferred slow reviews
export const eventDetailLoader = async ({ params }) => {
  const event = await queryClient.ensureQueryData({
    queryKey: ['event', params.id],
    queryFn: () => eventsAPI.getById(params.id).then(r => r.data),
  });

  return defer({
    event,
    reviews: fetchReviews(params.id),
  });
};

export const bookingAction = async () => null;
export const createEventAction = async () => null;

const LazyFallback = (
  <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
    Loading...
  </div>
);

export const router = [
  {
    path: '/',
    element: <App />,
    errorElement: <ErrorPage />,
    id: 'root',
    loader: rootLoader,
    children: [
      {
        index: true,
        element: <Home />,
        loader: eventsLoader,
        errorElement: <ErrorPage />,
      },
      {
        path: 'events',
        element: <Home />,
        loader: eventsLoader,
        errorElement: <ErrorPage />,
      },
      {
        path: 'events/:id',
        element: <EventDetail />,
        loader: eventDetailLoader,
        errorElement: <ErrorPage />,
      },
      {
        path: 'book/:eventId',
        element: <BookingFlow />,
        action: bookingAction,
        errorElement: <ErrorPage />,
      },
      {
        path: 'my-bookings',
        element: <MyBookings />,
        errorElement: <ErrorPage />,
      },
      {
        path: 'create-event',
        element: (
          <Suspense fallback={LazyFallback}>
            <CreateEvent />
          </Suspense>
        ),
        action: createEventAction,
        errorElement: <ErrorPage />,
      },
      {
        path: 'profile',
        element: (
          <Suspense fallback={LazyFallback}>
            <Profile />
          </Suspense>
        ),
        errorElement: <ErrorPage />,
      },
      {
        path: '*',
        element: <ErrorPage />,
      },
    ],
  },
];

export default router;
