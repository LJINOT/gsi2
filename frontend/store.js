import { configureStore, createSlice } from '@reduxjs/toolkit';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api';

// Task Slice
const taskSlice = createSlice({
  name: 'tasks',
  initialState: {
    items: [],
    loading: false,
    error: null,
    filter: 'all',
    searchQuery: '',
  },
  reducers: {
    setTasks: (state, action) => {
      state.items = action.payload;
    },
    addTask: (state, action) => {
      state.items.push(action.payload);
    },
    updateTask: (state, action) => {
      const index = state.items.findIndex(t => t.id === action.payload.id);
      if (index !== -1) {
        state.items[index] = action.payload;
      }
    },
    deleteTask: (state, action) => {
      state.items = state.items.filter(t => t.id !== action.payload);
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
    setFilter: (state, action) => {
      state.filter = action.payload;
    },
    setSearchQuery: (state, action) => {
      state.searchQuery = action.payload;
    },
  },
});

// Schedule Slice
const scheduleSlice = createSlice({
  name: 'schedule',
  initialState: {
    optimizedSchedule: [],
    loading: false,
    error: null,
    generatedAt: null,
  },
  reducers: {
    setSchedule: (state, action) => {
      state.optimizedSchedule = action.payload.schedule;
      state.generatedAt = action.payload.generatedAt;
    },
    setScheduleLoading: (state, action) => {
      state.loading = action.payload;
    },
    setScheduleError: (state, action) => {
      state.error = action.payload;
    },
  },
});

// Priorities Slice
const prioritiesSlice = createSlice({
  name: 'priorities',
  initialState: {
    ranked: [],
    loading: false,
    error: null,
    ahpWeights: {},
  },
  reducers: {
    setPriorities: (state, action) => {
      state.ranked = action.payload;
    },
    setAHPWeights: (state, action) => {
      state.ahpWeights = action.payload;
    },
    setPrioritiesLoading: (state, action) => {
      state.loading = action.payload;
    },
    setPrioritiesError: (state, action) => {
      state.error = action.payload;
    },
  },
});

// Timesheet Slice
const timesheetSlice = createSlice({
  name: 'timesheet',
  initialState: {
    entries: [],
    activeTimer: null,
    statistics: {
      totalTime: 0,
      byCategory: {},
      streaks: {},
    },
    loading: false,
  },
  reducers: {
    setTimesheetEntries: (state, action) => {
      state.entries = action.payload;
    },
    startTimer: (state, action) => {
      state.activeTimer = {
        taskId: action.payload.taskId,
        startTime: new Date(),
      };
    },
    stopTimer: (state, action) => {
      state.activeTimer = null;
    },
    setStatistics: (state, action) => {
      state.statistics = action.payload;
    },
    setTimesheetLoading: (state, action) => {
      state.loading = action.payload;
    },
  },
});

// Analytics Slice
const analyticsSlice = createSlice({
  name: 'analytics',
  initialState: {
    completionRate: 0,
    peakHours: [],
    workPatterns: {},
    timeByDifficulty: {},
    learnings: {},
  },
  reducers: {
    setAnalytics: (state, action) => {
      return { ...state, ...action.payload };
    },
  },
});

// User Settings Slice
const settingsSlice = createSlice({
  name: 'settings',
  initialState: {
    workHours: {
      start: '09:00',
      end: '18:00',
    },
    theme: 'dark',
    notifications: true,
    peakProductivityHours: [],
    focusStyles: [],
  },
  reducers: {
    updateSettings: (state, action) => {
      return { ...state, ...action.payload };
    },
  },
});

export const store = configureStore({
  reducer: {
    tasks: taskSlice.reducer,
    schedule: scheduleSlice.reducer,
    priorities: prioritiesSlice.reducer,
    timesheet: timesheetSlice.reducer,
    analytics: analyticsSlice.reducer,
    settings: settingsSlice.reducer,
  },
});

// Action Exports
export const taskActions = taskSlice.actions;
export const scheduleActions = scheduleSlice.actions;
export const prioritiesActions = prioritiesSlice.actions;
export const timesheetActions = timesheetSlice.actions;
export const analyticsActions = analyticsSlice.actions;
export const settingsActions = settingsSlice.actions;

// API Thunks
export const fetchTasks = () => async (dispatch) => {
  dispatch(taskActions.setLoading(true));
  try {
    const response = await axios.get(`${API_BASE_URL}/tasks`);
    dispatch(taskActions.setTasks(response.data));
  } catch (error) {
    dispatch(taskActions.setError(error.message));
  } finally {
    dispatch(taskActions.setLoading(false));
  }
};

export const createTask = (taskData) => async (dispatch) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/tasks`, taskData);
    dispatch(taskActions.addTask(response.data));
    return response.data;
  } catch (error) {
    dispatch(taskActions.setError(error.message));
    throw error;
  }
};

export const generateOptimalSchedule = () => async (dispatch, getState) => {
  dispatch(scheduleActions.setScheduleLoading(true));
  try {
    const state = getState();
    const response = await axios.post(`${API_BASE_URL}/schedule/generate`, {
      tasks: state.tasks.items,
      settings: state.settings,
    });
    dispatch(scheduleActions.setSchedule({
      schedule: response.data.schedule,
      generatedAt: new Date(),
    }));
  } catch (error) {
    dispatch(scheduleActions.setScheduleError(error.message));
  } finally {
    dispatch(scheduleActions.setScheduleLoading(false));
  }
};

export const generatePriorities = () => async (dispatch, getState) => {
  dispatch(prioritiesActions.setPrioritiesLoading(true));
  try {
    const state = getState();
    const response = await axios.post(`${API_BASE_URL}/priorities/calculate`, {
      tasks: state.tasks.items,
    });
    dispatch(prioritiesActions.setPriorities(response.data.ranked));
    dispatch(prioritiesActions.setAHPWeights(response.data.weights));
  } catch (error) {
    dispatch(prioritiesActions.setPrioritiesError(error.message));
  } finally {
    dispatch(prioritiesActions.setPrioritiesLoading(false));
  }
};

export const fetchAnalytics = () => async (dispatch) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/analytics/behavior`);
    dispatch(analyticsActions.setAnalytics(response.data));
  } catch (error) {
    console.error('Analytics fetch error:', error);
  }
};

export default store;
