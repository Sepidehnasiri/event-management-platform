import { Suspense, useState, useId } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';
import {
  setStep,
  updateBasicInfo,
  updateEventDetails,
  addTicketType,
  removeTicketType,
  updateTicketType,
  saveDraft,
  loadDraft,
  resetForm,
} from '../store/slices/eventFormSlice';
import { eventsAPI } from '../services/api';
import styles from './CreateEvent.module.css';

function CreateEventForm() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { showNotification } = useUser();
  const { step, basicInfo, eventDetails } = useSelector(state => state.eventForm);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // useId for accessible label/input associations
  const formId = useId();

  const handleStep1Next = () => {
    const newErrors = {};
    if (!basicInfo.title?.trim()) newErrors.title = 'Title is required';
    if (!basicInfo.description?.trim()) newErrors.description = 'Description is required';
    if (!basicInfo.category) newErrors.category = 'Category is required';
    if (!basicInfo.imageUrl?.trim()) newErrors.imageUrl = 'Image URL is required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    dispatch(saveDraft());
    dispatch(setStep(2));
  };

  const handleStep2Next = () => {
    const newErrors = {};
    if (!eventDetails.date) newErrors.date = 'Date is required';
    if (!eventDetails.time) newErrors.time = 'Time is required';
    if (!eventDetails.location?.trim()) newErrors.location = 'Location is required';
    if (eventDetails.ticketTypes.length === 0) newErrors.tickets = 'At least one ticket type is required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    dispatch(saveDraft());
    dispatch(setStep(3));
  };

  const handlePublish = async () => {
    setIsSubmitting(true);
    try {
      const newEvent = {
        id: Date.now().toString(),
        ...basicInfo,
        ...eventDetails,
        organizerName: 'User Organizer',
        organizerEmail: 'organizer@example.com',
        likes: 0,
        featured: false,
      };

      await eventsAPI.create(newEvent);
      dispatch(resetForm());
      showNotification('Event published successfully! 🎉');
      navigate('/');
    } catch {
      showNotification('Failed to publish event. Please try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddTicket = () => {
    dispatch(addTicketType({
      id: Date.now().toString(),
      name: '',
      price: 0,
      available: 0,
    }));
  };

  return (
    <main className={styles.page}>
      <div className="container" style={{ maxWidth: '800px' }}>
        <button className={styles.backLink} onClick={() => navigate('/')}>
          ← Back
        </button>

        {/* Progress indicator */}
        <div className={styles.progress}>
          {['Basic Info', 'Event Details', 'Preview'].map((label, i) => (
            <div key={i} className={`${styles.step} ${step === i + 1 ? styles.stepActive : ''} ${step > i + 1 ? styles.stepDone : ''}`}>
              <div className={styles.stepNum}>{step > i + 1 ? '✓' : i + 1}</div>
              <span className={styles.stepLabel}>{label}</span>
            </div>
          ))}
        </div>

        <div className={styles.card}>
          {/* STEP 1: Basic Info */}
          {step === 1 && (
            <div className={styles.stepContent}>
              <h2 className={styles.stepTitle}>Event Basic Information</h2>

              <div className={styles.field}>
                <label htmlFor={`${formId}-title`} className={styles.label}>Event Title *</label>
                <input
                  id={`${formId}-title`}
                  className={`${styles.input} ${errors.title ? styles.inputError : ''}`}
                  value={basicInfo.title}
                  onChange={(e) => dispatch(updateBasicInfo({ title: e.target.value }))}
                  placeholder="e.g., Summer Music Festival"
                />
                {errors.title && <span className={styles.fieldError}>{errors.title}</span>}
              </div>

              <div className={styles.field}>
                <label htmlFor={`${formId}-description`} className={styles.label}>Description *</label>
                <textarea
                  id={`${formId}-description`}
                  className={`${styles.textarea} ${errors.description ? styles.inputError : ''}`}
                  value={basicInfo.description}
                  onChange={(e) => dispatch(updateBasicInfo({ description: e.target.value }))}
                  placeholder="Describe your event..."
                  rows="5"
                />
                {errors.description && <span className={styles.fieldError}>{errors.description}</span>}
              </div>

              <div className={styles.fieldGrid}>
                <div className={styles.field}>
                  <label htmlFor={`${formId}-category`} className={styles.label}>Category *</label>
                  <select
                    id={`${formId}-category`}
                    className={`${styles.input} ${errors.category ? styles.inputError : ''}`}
                    value={basicInfo.category}
                    onChange={(e) => dispatch(updateBasicInfo({ category: e.target.value }))}
                  >
                    <option value="">Select a category</option>
                    <option value="Technology">Technology</option>
                    <option value="Music">Music</option>
                    <option value="Sports">Sports</option>
                    <option value="Arts">Arts</option>
                  </select>
                  {errors.category && <span className={styles.fieldError}>{errors.category}</span>}
                </div>

                <div className={styles.field}>
                  <label htmlFor={`${formId}-imageUrl`} className={styles.label}>Image URL *</label>
                  <input
                    id={`${formId}-imageUrl`}
                    className={`${styles.input} ${errors.imageUrl ? styles.inputError : ''}`}
                    value={basicInfo.imageUrl}
                    onChange={(e) => dispatch(updateBasicInfo({ imageUrl: e.target.value }))}
                    placeholder="https://example.com/image.jpg"
                  />
                  {errors.imageUrl && <span className={styles.fieldError}>{errors.imageUrl}</span>}
                </div>
              </div>

              <div className={styles.actions}>
                <button className={styles.btnPrimary} onClick={handleStep1Next}>
                  Continue →
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Event Details */}
          {step === 2 && (
            <div className={styles.stepContent}>
              <h2 className={styles.stepTitle}>Event Details & Tickets</h2>

              <div className={styles.fieldGrid}>
                <div className={styles.field}>
                  <label htmlFor={`${formId}-date`} className={styles.label}>Date *</label>
                  <input
                    id={`${formId}-date`}
                    type="date"
                    className={`${styles.input} ${errors.date ? styles.inputError : ''}`}
                    value={eventDetails.date}
                    onChange={(e) => dispatch(updateEventDetails({ date: e.target.value }))}
                  />
                  {errors.date && <span className={styles.fieldError}>{errors.date}</span>}
                </div>

                <div className={styles.field}>
                  <label htmlFor={`${formId}-time`} className={styles.label}>Time *</label>
                  <input
                    id={`${formId}-time`}
                    type="time"
                    className={`${styles.input} ${errors.time ? styles.inputError : ''}`}
                    value={eventDetails.time}
                    onChange={(e) => dispatch(updateEventDetails({ time: e.target.value }))}
                  />
                  {errors.time && <span className={styles.fieldError}>{errors.time}</span>}
                </div>
              </div>

              <div className={styles.field}>
                <label htmlFor={`${formId}-location`} className={styles.label}>Location *</label>
                <input
                  id={`${formId}-location`}
                  className={`${styles.input} ${errors.location ? styles.inputError : ''}`}
                  value={eventDetails.location}
                  onChange={(e) => dispatch(updateEventDetails({ location: e.target.value }))}
                  placeholder="City, Country"
                />
                {errors.location && <span className={styles.fieldError}>{errors.location}</span>}
              </div>

              <h3 className={styles.sectionTitle}>Ticket Types</h3>
              {errors.tickets && <div className={styles.fieldError}>{errors.tickets}</div>}

              {eventDetails.ticketTypes.map((ticket, idx) => (
                <div key={ticket.id} className={styles.ticketSection}>
                  <div className={styles.fieldGrid}>
                    <div className={styles.field}>
                      <label className={styles.label}>Ticket Name</label>
                      <input
                        className={styles.input}
                        value={ticket.name}
                        onChange={(e) => dispatch(updateTicketType({ index: idx, data: { name: e.target.value } }))}
                        placeholder="e.g., General Admission"
                      />
                    </div>

                    <div className={styles.field}>
                      <label className={styles.label}>Price ($)</label>
                      <input
                        type="number"
                        className={styles.input}
                        value={ticket.price}
                        onChange={(e) => dispatch(updateTicketType({ index: idx, data: { price: Number(e.target.value) } }))}
                        min="0"
                      />
                    </div>

                    <div className={styles.field}>
                      <label className={styles.label}>Available Tickets</label>
                      <input
                        type="number"
                        className={styles.input}
                        value={ticket.available}
                        onChange={(e) => dispatch(updateTicketType({ index: idx, data: { available: Number(e.target.value) } }))}
                        min="0"
                      />
                    </div>
                  </div>
                  <button
                    className={styles.removeBtn}
                    onClick={() => dispatch(removeTicketType(idx))}
                  >
                    Remove
                  </button>
                </div>
              ))}

              <button className={styles.addTicketBtn} onClick={handleAddTicket}>
                + Add Ticket Type
              </button>

              <div className={styles.actions}>
                <button className={styles.btnSecondary} onClick={() => dispatch(setStep(1))}>
                  ← Back
                </button>
                <button className={styles.btnPrimary} onClick={handleStep2Next}>
                  Review Event →
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Preview */}
          {step === 3 && (
            <div className={styles.stepContent}>
              <h2 className={styles.stepTitle}>Preview Your Event</h2>

              <div className={styles.preview}>
                <div className={styles.previewImage}>
                  <img src={basicInfo.imageUrl} alt={basicInfo.title} />
                  <span className={styles.previewCategory}>{basicInfo.category}</span>
                </div>

                <h3 className={styles.previewTitle}>{basicInfo.title}</h3>
                <p className={styles.previewDesc}>{basicInfo.description}</p>

                <div className={styles.previewDetails}>
                  <div>📅 {new Date(eventDetails.date).toLocaleDateString()} at {eventDetails.time}</div>
                  <div>📍 {eventDetails.location}</div>
                </div>

                <h4 className={styles.previewTicketsTitle}>Tickets Available</h4>
                {eventDetails.ticketTypes.map((ticket) => (
                  <div key={ticket.id} className={styles.previewTicket}>
                    <span>{ticket.name}</span>
                    <span>${ticket.price} ({ticket.available} available)</span>
                  </div>
                ))}
              </div>

              <div className={styles.actions}>
                <button className={styles.btnSecondary} onClick={() => dispatch(setStep(2))}>
                  ← Back to Edit
                </button>
                <button className={styles.btnPrimary} onClick={handlePublish} disabled={isSubmitting}>
                  {isSubmitting ? 'Publishing...' : 'Publish Event'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

export default function CreateEvent() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CreateEventForm />
    </Suspense>
  );
}

