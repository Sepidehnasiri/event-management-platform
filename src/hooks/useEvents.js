import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { eventsAPI } from '../services/api';

// Normalize filters so empty values don't produce different cache keys
const normalizeFilters = (filters = {}) =>
  Object.fromEntries(
    Object.entries(filters).filter(([, v]) => v !== undefined && v !== '')
  );

export const useEvents = (filters = {}) => {
  const normalized = normalizeFilters(filters);
  return useQuery({
    queryKey: ['events', normalized],
    queryFn: () => eventsAPI.getAll(normalized).then(r => r.data),
    select: (data) => (Array.isArray(data) ? data : data?.data ?? []),
  });
};

export const useEventDetail = (eventId) => {
  return useQuery({
    queryKey: ['event', eventId],
    queryFn: () => eventsAPI.getById(eventId).then(r => r.data),
    enabled: !!eventId,
  });
};

export const useCreateEvent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => eventsAPI.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
    },
  });
};

// Like with optimistic update + rollback
export const useLikeEvent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, likes }) => eventsAPI.like(id, likes),
    onMutate: async ({ id, likes }) => {
      await queryClient.cancelQueries({ queryKey: ['events'] });
      await queryClient.cancelQueries({ queryKey: ['event', id] });

      const queriesSnapshot = queryClient.getQueriesData({ queryKey: ['events'] });
      const eventSnapshot = queryClient.getQueryData(['event', id]);

      // Optimistically update all events list queries
      queryClient.setQueriesData({ queryKey: ['events'] }, (old) => {
        if (!old) return old;
        const arr = Array.isArray(old) ? old : old?.data ?? [];
        const updated = arr.map(e => e.id === id ? { ...e, likes } : e);
        return Array.isArray(old) ? updated : { ...old, data: updated };
      });

      // Optimistically update the single event query
      queryClient.setQueryData(['event', id], (old) => {
        if (!old) return old;
        return { ...old, likes };
      });

      return { queriesSnapshot, eventSnapshot };
    },
    onError: (_err, { id }, context) => {
      context?.queriesSnapshot?.forEach(([queryKey, data]) => {
        queryClient.setQueryData(queryKey, data);
      });
      if (context?.eventSnapshot !== undefined) {
        queryClient.setQueryData(['event', id], context.eventSnapshot);
      }
    },
    onSettled: (_data, _err, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['event', id] });
    },
  });
};
