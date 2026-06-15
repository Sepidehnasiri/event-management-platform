import { useReducer, useState, useOptimistic, useId, startTransition } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useEventDetail } from '../../hooks/useEvents';
import { useUser } from '../../contexts/UserContext';
import { bookingsAPI } from '../../services/api';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import styles from './BookingFlow.module.css';

// ── Reducer ──────────────────────────────────────────────────────────────────
const initialState = {
  step: 1,
  selectedTickets: {},
  attendees: [],
  errors: {},
};

function reducer(state, action) {
  switch (action.type) {
    case 'SET_TICKET_QTY':
      return {
        ...state,
        selectedTickets: { ...state.selectedTickets, [action.ticketId]: action.qty },
      };
    case 'SET_ATTENDEES':
      return { ...state, attendees: action.attendees };
    case 'SET_ERRORS':
      return { ...state, errors: action.errors };
    case 'NEXT_STEP':
      return { ...state, step: state.step + 1, errors: {} };
    case 'PREV_STEP':
      return { ...state, step: state.step - 1, errors: {} };
    default:
      return state;
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function genRef() {
  return 'BK' + Math.random().toString(36).slice(2, 8).toUpperCase();
}

function validateAttendees(attendees) {
  const errors = {};
  attendees.forEach((a, i) => {
    if (!a.name?.trim())  errors[`${i}_name`]  = 'Name is required';
    if (!a.email?.trim()) errors[`${i}_email`] = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(a.email))
      errors[`${i}_email`] = 'Invalid email address';
    if (!a.phone?.trim()) errors[`${i}_phone`] = 'Phone is required';
    else if (!/^\d{7,15}$/.test(a.phone.replace(/[\s\-()]/g, '')))
      errors[`${i}_phone`] = 'Invalid phone number';
  });
  return errors;
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function BookingFlow() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { showNotification } = useUser();
  const queryClient = useQueryClient();

  const [booking, setBooking] = useState(null);
  // useOptimistic — shows a pending booking immediately while the mutation runs
  const [optimisticBooking, addOptimisticBooking] = useOptimistic(booking);

  const [state, dispatch] = useReducer(reducer, initialState);

  // useId for accessible form label/input associations
  const attendeeFieldId = useId();

  const { data: event, isLoading, error } = useEventDetail(eventId);

  const createBookingMutation = useMutation({
    mutationFn: (data) => bookingsAPI.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
    },
  });

  const selectedTicketObjects = event?.ticketTypes?.filter(t => state.selectedTickets[t.id] > 0) || [];
  const totalQty = Object.values(state.selectedTickets).reduce((s, q) => s + q, 0);
  const totalAmount = event?.ticketTypes?.reduce((sum, t) => {
    return sum + (state.selectedTickets[t.id] || 0) * t.price;
  }, 0) || 0;

  // Step 1: must select at least one ticket
  const handleStep1Next = () => {
    if (totalQty === 0) {
      dispatch({ type: 'SET_ERRORS', errors: { tickets: 'Please select at least one ticket.' } });
      return;
    }
    const slots = Array.from({ length: totalQty }, (_, i) =>
      state.attendees[i] || { name: '', email: '', phone: '' }
    );
    dispatch({ type: 'SET_ATTENDEES', attendees: slots });
    dispatch({ type: 'NEXT_STEP' });
  };

  // Step 2: validate attendee fields
  const handleStep2Next = () => {
    const errors = validateAttendees(state.attendees);
    if (Object.keys(errors).length > 0) {
      dispatch({ type: 'SET_ERRORS', errors });
      return;
    }
    dispatch({ type: 'NEXT_STEP' });
  };

  const updateAttendee = (i, field, value) => {
    const updated = state.attendees.map((a, idx) => idx === i ? { ...a, [field]: value } : a);
    dispatch({ type: 'SET_ATTENDEES', attendees: updated });
  };

  // Step 3 → 4: optimistic confirmation, then actual mutation
  const handleSubmit = () => {
    const newBooking = {
      id: Date.now().toString(),
      userId: 'user1',
      eventId: event.id,
      eventTitle: event.title,
      eventDate: event.date,
      tickets: selectedTicketObjects.map(t => ({
        type: t.name,
        quantity: state.selectedTickets[t.id],
        price: t.price,
      })),
      attendees: state.attendees,
      totalAmount,
      status: 'confirmed',
      bookingDate: new Date().toISOString().slice(0, 10),
      referenceNumber: genRef(),
    };

    startTransition(async () => {
      // Show step 4 instantly with optimistic booking data
      addOptimisticBooking(newBooking);
      dispatch({ type: 'NEXT_STEP' });

      try {
        const result = await createBookingMutation.mutateAsync(newBooking);
        setBooking(result.data || result);
        showNotification('Booking confirmed!');
      } catch {
        // Rollback to step 3 so the user can retry
        dispatch({ type: 'PREV_STEP' });
        showNotification('Failed to confirm booking. Please try again.', 'error');
      }
    });
  };

  if (isLoading) return (
    <main className={styles.page}>
      <div className="container"><div className={styles.skeleton} /></div>
    </main>
  );

  if (error || !event) return (
    <main className={styles.page}>
      <div className="container">
        <div className={styles.error}>
          <h2>Event Not Found</h2>
          <button onClick={() => navigate('/')} className={styles.backBtn}>← Back</button>
        </div>
      </div>
    </main>
  );

  return (
    <main className={styles.page}>
      <div className="container">
        <button className={styles.backLink} onClick={() => navigate(-1)}>← Back to event</button>

        <div className={styles.layout}>
          {/* Progress indicator */}
          {state.step < 4 && (
            <div className={styles.progress}>
              {['Select Tickets', 'Attendee Details', 'Confirmation'].map((label, i) => (
                <div
                  key={i}
                  className={`${styles.step} ${state.step === i + 1 ? styles.stepActive : ''} ${state.step > i + 1 ? styles.stepDone : ''}`}
                >
                  <div className={styles.stepNum}>{state.step > i + 1 ? '✓' : i + 1}</div>
                  <span className={styles.stepLabel}>{label}</span>
                  {i < 2 && <div className={styles.stepLine} />}
                </div>
              ))}
            </div>
          )}

          <div className={styles.card}>
            {/* ── STEP 1: Select Tickets ── */}
            {state.step === 1 && (
              <div className={styles.stepContent}>
                <h2 className={styles.stepTitle}>Select Tickets</h2>
                <p className={styles.eventName}>{event?.title}</p>

                {state.errors.tickets && (
                  <div className={styles.errorBanner}>{state.errors.tickets}</div>
                )}

                <div className={styles.ticketList}>
                  {event?.ticketTypes?.map(ticket => (
                    <div key={ticket.id} className={styles.ticketItem}>
                      <div>
                        <div className={styles.ticketName}>{ticket.name}</div>
                        <div className={styles.ticketPrice}>
                          {ticket.price === 0 ? 'Free' : `$${ticket.price} / person`}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          {ticket.available} available
                        </div>
                      </div>
                      <div className={styles.qtyControl}>
                        <button
                          className={styles.qtyBtn}
                          onClick={() => dispatch({
                            type: 'SET_TICKET_QTY',
                            ticketId: ticket.id,
                            qty: Math.max(0, (state.selectedTickets[ticket.id] || 0) - 1),
                          })}
                          disabled={(state.selectedTickets[ticket.id] || 0) === 0}
                          aria-label={`Decrease ${ticket.name} quantity`}
                        >−</button>
                        <span className={styles.qty}>{state.selectedTickets[ticket.id] || 0}</span>
                        <button
                          className={styles.qtyBtn}
                          onClick={() => dispatch({
                            type: 'SET_TICKET_QTY',
                            ticketId: ticket.id,
                            qty: Math.min(ticket.available, (state.selectedTickets[ticket.id] || 0) + 1),
                          })}
                          disabled={(state.selectedTickets[ticket.id] || 0) >= ticket.available}
                          aria-label={`Increase ${ticket.name} quantity`}
                        >+</button>
                      </div>
                    </div>
                  ))}
                </div>

                {totalQty > 0 && (
                  <div className={styles.priceBox}>
                    <span>{totalQty} ticket{totalQty !== 1 ? 's' : ''}</span>
                    <strong>${totalAmount.toFixed(2)}</strong>
                  </div>
                )}

                <div className={styles.actions}>
                  <button className={styles.btnPrimary} onClick={handleStep1Next}>
                    Continue →
                  </button>
                </div>
              </div>
            )}

            {/* ── STEP 2: Attendee Details ── */}
            {state.step === 2 && (
              <div className={styles.stepContent}>
                <h2 className={styles.stepTitle}>Attendee Details</h2>
                <p className={styles.subtitle}>Fill in details for each ticket holder</p>

                {state.attendees.map((attendee, i) => (
                  <div key={i} className={styles.attendeeBlock}>
                    <h4 className={styles.attendeeTitle}>Attendee {i + 1}</h4>
                    <div className={styles.fieldGrid}>
                      {/* useId ensures label htmlFor matches input id for accessibility */}
                      <div className={styles.field}>
                        <label htmlFor={`${attendeeFieldId}-name-${i}`} className={styles.label}>
                          Full Name *
                        </label>
                        <input
                          id={`${attendeeFieldId}-name-${i}`}
                          className={`${styles.input} ${state.errors[`${i}_name`] ? styles.inputError : ''}`}
                          placeholder="John Doe"
                          value={attendee.name}
                          onChange={e => updateAttendee(i, 'name', e.target.value)}
                          aria-describedby={state.errors[`${i}_name`] ? `${attendeeFieldId}-name-err-${i}` : undefined}
                        />
                        {state.errors[`${i}_name`] && (
                          <span id={`${attendeeFieldId}-name-err-${i}`} className={styles.fieldError} role="alert">
                            {state.errors[`${i}_name`]}
                          </span>
                        )}
                      </div>

                      <div className={styles.field}>
                        <label htmlFor={`${attendeeFieldId}-email-${i}`} className={styles.label}>
                          Email *
                        </label>
                        <input
                          id={`${attendeeFieldId}-email-${i}`}
                          type="email"
                          className={`${styles.input} ${state.errors[`${i}_email`] ? styles.inputError : ''}`}
                          placeholder="john@example.com"
                          value={attendee.email}
                          onChange={e => updateAttendee(i, 'email', e.target.value)}
                          aria-describedby={state.errors[`${i}_email`] ? `${attendeeFieldId}-email-err-${i}` : undefined}
                        />
                        {state.errors[`${i}_email`] && (
                          <span id={`${attendeeFieldId}-email-err-${i}`} className={styles.fieldError} role="alert">
                            {state.errors[`${i}_email`]}
                          </span>
                        )}
                      </div>

                      <div className={styles.field}>
                        <label htmlFor={`${attendeeFieldId}-phone-${i}`} className={styles.label}>
                          Phone *
                        </label>
                        <input
                          id={`${attendeeFieldId}-phone-${i}`}
                          type="tel"
                          className={`${styles.input} ${state.errors[`${i}_phone`] ? styles.inputError : ''}`}
                          placeholder="1234567890"
                          value={attendee.phone}
                          onChange={e => updateAttendee(i, 'phone', e.target.value)}
                          aria-describedby={state.errors[`${i}_phone`] ? `${attendeeFieldId}-phone-err-${i}` : undefined}
                        />
                        {state.errors[`${i}_phone`] && (
                          <span id={`${attendeeFieldId}-phone-err-${i}`} className={styles.fieldError} role="alert">
                            {state.errors[`${i}_phone`]}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                <div className={styles.actions}>
                  <button className={styles.btnSecondary} onClick={() => dispatch({ type: 'PREV_STEP' })}>
                    ← Back
                  </button>
                  <button className={styles.btnPrimary} onClick={handleStep2Next}>
                    Review Booking →
                  </button>
                </div>
              </div>
            )}

            {/* ── STEP 3: Review & Confirm ── */}
            {state.step === 3 && (
              <div className={styles.stepContent}>
                <h2 className={styles.stepTitle}>Review Your Booking</h2>

                <div className={styles.summary}>
                  <div className={styles.summaryRow}>
                    <span className={styles.summaryLabel}>Event</span>
                    <span className={styles.summaryValue}>{event?.title}</span>
                  </div>
                  <div className={styles.summaryRow}>
                    <span className={styles.summaryLabel}>Date</span>
                    <span className={styles.summaryValue}>
                      {new Date(event?.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>
                  <div className={styles.summaryRow}>
                    <span className={styles.summaryLabel}>Venue</span>
                    <span className={styles.summaryValue}>{event?.venue}</span>
                  </div>
                  <div className={styles.divider} />
                  {selectedTicketObjects.map(t => (
                    <div key={t.id} className={styles.summaryRow}>
                      <span className={styles.summaryLabel}>{t.name} × {state.selectedTickets[t.id]}</span>
                      <span className={styles.summaryValue}>
                        {t.price === 0 ? 'Free' : `$${(t.price * state.selectedTickets[t.id]).toFixed(2)}`}
                      </span>
                    </div>
                  ))}
                  <div className={styles.divider} />
                  <div className={`${styles.summaryRow} ${styles.totalRow}`}>
                    <span>Total</span>
                    <strong>${totalAmount.toFixed(2)}</strong>
                  </div>
                </div>

                <div className={styles.attendeesSummary}>
                  <h4 className={styles.attendeeTitle}>Attendees</h4>
                  {state.attendees.map((a, i) => (
                    <div key={i} className={styles.attendeeSummaryRow}>
                      <span>{a.name}</span>
                      <span className={styles.attendeeEmail}>{a.email}</span>
                    </div>
                  ))}
                </div>

                <div className={styles.actions}>
                  <button className={styles.btnSecondary} onClick={() => dispatch({ type: 'PREV_STEP' })}>
                    ← Back
                  </button>
                  <button
                    className={styles.btnPrimary}
                    onClick={handleSubmit}
                    disabled={createBookingMutation.isPending}
                  >
                    {createBookingMutation.isPending ? 'Confirming…' : 'Confirm Booking'}
                  </button>
                </div>
              </div>
            )}

            {/* ── STEP 4: Success (shows optimistic data immediately) ── */}
            {state.step === 4 && optimisticBooking && (
              <div className={styles.success}>
                <div className={styles.successIcon}>✓</div>
                <h2 className={styles.successTitle}>Booking Confirmed!</h2>
                <p className={styles.successSub}>Your booking reference number is</p>
                <div className={styles.refNumber}>{optimisticBooking.referenceNumber}</div>
                <p className={styles.successNote}>
                  A confirmation has been sent to your email address.
                </p>
                {createBookingMutation.isPending && (
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                    Saving your booking…
                  </p>
                )}
                <div className={styles.successActions}>
                  <button className={styles.btnPrimary} onClick={() => navigate('/my-bookings')}>
                    View My Bookings
                  </button>
                  <button className={styles.btnSecondary} onClick={() => navigate('/events')}>
                    Browse More Events
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
