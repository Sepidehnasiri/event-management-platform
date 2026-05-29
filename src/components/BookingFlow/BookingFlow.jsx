import { useReducer, useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../hooks/useApi';
import { useUser } from '../../contexts/UserContext';
import styles from './BookingFlow.module.css';

// ── Reducer ──────────────────────────────────────────────────────────────────
const initialState = {
  step: 1,
  selectedTickets: {},   // { ticketId: quantity }
  attendees: [],         // [{ name, email, phone }]
  errors: {},
};

function reducer(state, action) {
  switch (action.type) {
    case 'SET_TICKET_QTY':
      return {
        ...state,
        selectedTickets: {
          ...state.selectedTickets,
          [action.ticketId]: action.qty,
        },
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
    if (!a.name?.trim()) errors[`${i}_name`] = 'Name is required';
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
  const { id } = useParams();
  const navigate = useNavigate();
  const { showNotification } = useUser();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [booking, setBooking] = useState(null);
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    api.getEvent(id)
      .then(setEvent)
      .catch(() => navigate('/events'))
      .finally(() => setLoading(false));
  }, [id, navigate]);

  // Derive total
  const selectedTicketObjects = event?.ticketTypes?.filter(t =>
    state.selectedTickets[t.id] > 0
  ) || [];

  const totalQty = Object.values(state.selectedTickets).reduce((s, q) => s + q, 0);

  const totalAmount = event?.ticketTypes?.reduce((sum, t) => {
    const qty = state.selectedTickets[t.id] || 0;
    return sum + qty * t.price;
  }, 0) || 0;

  // Step 1: validate at least 1 ticket
  const handleStep1Next = () => {
    if (totalQty === 0) {
      dispatch({ type: 'SET_ERRORS', errors: { tickets: 'Please select at least one ticket.' } });
      return;
    }
    // Build attendee slots
    const slots = Array.from({ length: totalQty }, (_, i) =>
      state.attendees[i] || { name: '', email: '', phone: '' }
    );
    dispatch({ type: 'SET_ATTENDEES', attendees: slots });
    dispatch({ type: 'NEXT_STEP' });
  };

  // Step 2: validate attendees
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

  // Submit
  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const newBooking = {
        id: Date.now().toString(),
        userId: 'user1',
        eventId: event.id,
        eventTitle: event.title,
        eventDate: event.date,
        tickets: selectedTicketObjects.map(t => ({
          type: t.name, quantity: state.selectedTickets[t.id], price: t.price,
        })),
        attendees: state.attendees,
        totalAmount,
        status: 'confirmed',
        bookingDate: new Date().toISOString().slice(0, 10),
        referenceNumber: genRef(),
      };
      const result = await api.createBooking(newBooking);
      setBooking(result);
      dispatch({ type: 'NEXT_STEP' });
      showNotification('Booking confirmed! 🎉');
    } catch {
      showNotification('Failed to confirm booking. Please try again.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <main className={styles.page}><div className="container"><div className={styles.skeleton} /></div></main>
  );

  return (
    <main className={styles.page}>
      <div className="container">
        <button className={styles.backLink} onClick={() => navigate(-1)}>← Back to event</button>

        <div className={styles.layout}>
          {/* Progress */}
          {state.step < 4 && (
            <div className={styles.progress}>
              {['Select Tickets', 'Attendee Details', 'Confirmation'].map((label, i) => (
                <div key={i} className={`${styles.step} ${state.step === i + 1 ? styles.stepActive : ''} ${state.step > i + 1 ? styles.stepDone : ''}`}>
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
                      </div>
                      <div className={styles.qtyControl}>
                        <button
                          className={styles.qtyBtn}
                          onClick={() => dispatch({ type: 'SET_TICKET_QTY', ticketId: ticket.id, qty: Math.max(0, (state.selectedTickets[ticket.id] || 0) - 1) })}
                          disabled={(state.selectedTickets[ticket.id] || 0) === 0}
                        >−</button>
                        <span className={styles.qty}>{state.selectedTickets[ticket.id] || 0}</span>
                        <button
                          className={styles.qtyBtn}
                          onClick={() => dispatch({ type: 'SET_TICKET_QTY', ticketId: ticket.id, qty: Math.min(ticket.available, (state.selectedTickets[ticket.id] || 0) + 1) })}
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
                      <div className={styles.field}>
                        <label className={styles.label}>Full Name *</label>
                        <input
                          className={`${styles.input} ${state.errors[`${i}_name`] ? styles.inputError : ''}`}
                          placeholder="John Doe"
                          value={attendee.name}
                          onChange={e => updateAttendee(i, 'name', e.target.value)}
                        />
                        {state.errors[`${i}_name`] && <span className={styles.fieldError}>{state.errors[`${i}_name`]}</span>}
                      </div>
                      <div className={styles.field}>
                        <label className={styles.label}>Email *</label>
                        <input
                          className={`${styles.input} ${state.errors[`${i}_email`] ? styles.inputError : ''}`}
                          type="email"
                          placeholder="john@example.com"
                          value={attendee.email}
                          onChange={e => updateAttendee(i, 'email', e.target.value)}
                        />
                        {state.errors[`${i}_email`] && <span className={styles.fieldError}>{state.errors[`${i}_email`]}</span>}
                      </div>
                      <div className={styles.field}>
                        <label className={styles.label}>Phone *</label>
                        <input
                          className={`${styles.input} ${state.errors[`${i}_phone`] ? styles.inputError : ''}`}
                          type="tel"
                          placeholder="1234567890"
                          value={attendee.phone}
                          onChange={e => updateAttendee(i, 'phone', e.target.value)}
                        />
                        {state.errors[`${i}_phone`] && <span className={styles.fieldError}>{state.errors[`${i}_phone`]}</span>}
                      </div>
                    </div>
                  </div>
                ))}

                <div className={styles.actions}>
                  <button className={styles.btnSecondary} onClick={() => dispatch({ type: 'PREV_STEP' })}>← Back</button>
                  <button className={styles.btnPrimary} onClick={handleStep2Next}>Review Booking →</button>
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
                  <button className={styles.btnSecondary} onClick={() => dispatch({ type: 'PREV_STEP' })}>← Back</button>
                  <button
                    className={styles.btnPrimary}
                    onClick={handleSubmit}
                    disabled={submitting}
                  >
                    {submitting ? 'Confirming…' : 'Confirm Booking'}
                  </button>
                </div>
              </div>
            )}

            {/* ── STEP 4: Success ── */}
            {state.step === 4 && booking && (
              <div className={styles.success}>
                <div className={styles.successIcon}>✓</div>
                <h2 className={styles.successTitle}>Booking Confirmed!</h2>
                <p className={styles.successSub}>Your booking reference number is</p>
                <div className={styles.refNumber}>{booking.referenceNumber}</div>
                <p className={styles.successNote}>A confirmation has been sent to your email address.</p>
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
