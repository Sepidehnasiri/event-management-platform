import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  step: 1,
  basicInfo: {
    title: '',
    description: '',
    category: '',
    imageUrl: '',
  },
  eventDetails: {
    date: '',
    time: '',
    location: '',
    ticketTypes: [],
  },
  draft: null,
  isPublishing: false,
  error: null,
};

const eventFormSlice = createSlice({
  name: 'eventForm',
  initialState,
  reducers: {
    setStep: (state, action) => {
      state.step = action.payload;
    },
    updateBasicInfo: (state, action) => {
      state.basicInfo = { ...state.basicInfo, ...action.payload };
    },
    updateEventDetails: (state, action) => {
      state.eventDetails = { ...state.eventDetails, ...action.payload };
    },
    addTicketType: (state, action) => {
      state.eventDetails.ticketTypes.push(action.payload);
    },
    removeTicketType: (state, action) => {
      state.eventDetails.ticketTypes = state.eventDetails.ticketTypes.filter(
        (_, index) => index !== action.payload
      );
    },
    updateTicketType: (state, action) => {
      const { index, data } = action.payload;
      state.eventDetails.ticketTypes[index] = {
        ...state.eventDetails.ticketTypes[index],
        ...data,
      };
    },
    saveDraft: (state) => {
      state.draft = {
        basicInfo: state.basicInfo,
        eventDetails: state.eventDetails,
      };
      localStorage.setItem('eventFormDraft', JSON.stringify(state.draft));
    },
    loadDraft: (state) => {
      const draft = localStorage.getItem('eventFormDraft');
      if (draft) {
        const parsed = JSON.parse(draft);
        state.basicInfo = parsed.basicInfo;
        state.eventDetails = parsed.eventDetails;
        state.draft = parsed;
      }
    },
    clearDraft: (state) => {
      state.draft = null;
      localStorage.removeItem('eventFormDraft');
    },
    resetForm: (state) => {
      return initialState;
    },
    setPublishing: (state, action) => {
      state.isPublishing = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
  },
});

export const {
  setStep,
  updateBasicInfo,
  updateEventDetails,
  addTicketType,
  removeTicketType,
  updateTicketType,
  saveDraft,
  loadDraft,
  clearDraft,
  resetForm,
  setPublishing,
  setError,
} = eventFormSlice.actions;

export default eventFormSlice.reducer;
