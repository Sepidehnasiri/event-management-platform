import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { bookingsAPI } from '../services/api';

const CURRENT_USER_ID = 'user1';

// Single query key for all user bookings — filtering is done client-side via select
export const useBookings = (statusFilter) => {
  return useQuery({
    queryKey: ['bookings'],
    queryFn: () => bookingsAPI.getByUserId(CURRENT_USER_ID),
    staleTime: 2 * 60 * 1000,  // 2 minutes
    gcTime: 5 * 60 * 1000,     // 5 minutes
    select: (response) => {
      const bookings = response.data || [];
      if (!statusFilter || statusFilter === 'all') return bookings;

      const now = new Date();
      if (statusFilter === 'upcoming')
        return bookings.filter(b => new Date(b.eventDate) > now && b.status !== 'cancelled');
      if (statusFilter === 'past')
        return bookings.filter(b => new Date(b.eventDate) <= now && b.status !== 'cancelled');
      if (statusFilter === 'cancelled')
        return bookings.filter(b => b.status === 'cancelled');
      return bookings;
    },
  });
};

// Returns ALL bookings (no filter) — used for count badges in tabs
export const useAllBookingsRaw = () => {
  return useQuery({
    queryKey: ['bookings'],
    queryFn: () => bookingsAPI.getByUserId(CURRENT_USER_ID),
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    select: (response) => response.data || [],
  });
};

export const useCancelBooking = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (bookingId) => bookingsAPI.cancel(bookingId),
    onMutate: async (bookingId) => {
      await queryClient.cancelQueries({ queryKey: ['bookings'] });
      const previousData = queryClient.getQueryData(['bookings']);

      // Optimistic update: mark booking as cancelled immediately
      queryClient.setQueryData(['bookings'], (old) => {
        if (!old?.data) return old;
        return {
          ...old,
          data: old.data.map(b =>
            b.id === bookingId ? { ...b, status: 'cancelled' } : b
          ),
        };
      });

      return { previousData };
    },
    onError: (_err, _bookingId, context) => {
      // Roll back to snapshot on failure
      if (context?.previousData) {
        queryClient.setQueryData(['bookings'], context.previousData);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
    },
  });
};
