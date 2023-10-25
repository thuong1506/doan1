import { configureStore } from "@reduxjs/toolkit";
import ticketPackReducer from "./ticketPackSlice";
import ticketReducer from "./ticketSlice";

const store = configureStore({
  reducer: {
    ticketPack: ticketPackReducer,
    ticket: ticketReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;
