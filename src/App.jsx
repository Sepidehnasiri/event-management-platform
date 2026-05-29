import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { UserProvider } from './contexts/UserContext';
import Navbar from './components/Navbar/Navbar';
import Notification from './components/Common/Notification';
import Home from './pages/Home';
import EventList from './components/EventList/EventList';
import EventDetail from './components/EventDetail/EventDetail';
import BookingFlow from './components/BookingFlow/BookingFlow';
import MyBookings from './components/MyBookings/MyBookings';

export default function App() {
  return (
    <ThemeProvider>
      <UserProvider>
        <BrowserRouter>
          <Navbar />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/events" element={<EventList />} />
            <Route path="/events/:id" element={<EventDetail />} />
            <Route path="/events/:id/book" element={<BookingFlow />} />
            <Route path="/my-bookings" element={<MyBookings />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          <Notification />
        </BrowserRouter>
      </UserProvider>
    </ThemeProvider>
  );
}
