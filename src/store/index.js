import { configureStore } from '@reduxjs/toolkit';
import eventFormReducer from './slices/eventFormSlice';

const store = configureStore({
  reducer: {
    eventForm: eventFormReducer,
  },
});

export default store;
