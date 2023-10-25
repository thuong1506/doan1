import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface TicketData {
  id: string;
  bookingCode: string;
  ticketNumber: string;
  usageStatus: string;
  usageDate: string;
  ticketDate: string;
  checkInGate: string;
  ticketType: String;
  ticketTypeName: String;
  nameEvent: String;
  reconciliationStatus: string;
}

interface TicketState {
  filterValue: string[];
  defaultValue: string;
  tickets: TicketData[];
  showOverlay: boolean;
  showDateChangeOverlay: boolean;
}

const initialState: TicketState = {
  filterValue: [],
  defaultValue: "tatca",
  tickets: [],
  showOverlay: false,
  showDateChangeOverlay: false,
};

const ticketSlice = createSlice({
  name: "ticket",
  initialState,
  reducers: {
    setFilterValue: (state, action: PayloadAction<string[]>) => {
      if (action.payload.includes("tatcacong")) {
        state.filterValue = ["tatcacong"];
      } else {
        state.filterValue = action.payload;
      }
    },
    setDefaultValue: (state, action: PayloadAction<string>) => {
      state.defaultValue = action.payload;
    },
    setTickets: (state, action: PayloadAction<TicketData[]>) => {
      state.tickets = action.payload;
    },
    setShowOverlay: (state, action: PayloadAction<boolean>) => {
      state.showOverlay = action.payload;
    },
    setShowDateChangeOverlay: (state, action: PayloadAction<boolean>) => {
      state.showDateChangeOverlay = action.payload;
    },
    updateUsageDate: (
      state,
      action: PayloadAction<{ ticketNumber: string; usageDate: string }>
    ) => {
      const { ticketNumber, usageDate } = action.payload;
      const updatedTickets = state.tickets.map((ticket) =>
        ticket.ticketNumber === ticketNumber ? { ...ticket, usageDate } : ticket
      );
      state.tickets = updatedTickets;
    },
    "ticket/updateUsageStatus": (state, action) => {
      const { ticketId, newStatus } = action.payload;
      const ticketToUpdate = state.tickets.find(
        (ticket) => ticket.id === ticketId
      );
      if (ticketToUpdate) {
        ticketToUpdate.usageStatus = newStatus;
      }
    },
  },
});

export const updateUsageDate = (ticketNumber: string, usageDate: string) => ({
  type: "ticket/updateUsageDate",
  payload: { ticketNumber, usageDate },
});

export const setFilterValues = (
  filterValue: string[],
  defaultValue: string
) => ({
  type: "ticket/setFilterValue",
  payload: { filterValue, defaultValue },
});

export const updateUsageStatus = (ticketId: string, newStatus: string) => ({
  type: "ticket/updateUsageStatus",
  payload: { ticketId, newStatus },
});

export const {
  setFilterValue,
  setDefaultValue,
  setTickets,
  setShowOverlay,
  setShowDateChangeOverlay,
} = ticketSlice.actions;

export default ticketSlice.reducer;
