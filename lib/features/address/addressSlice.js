// import { createAsyncThunk, createSlice } from "@reduxjs/toolkit"
// import axios from "axios"

// export const fetchAddress = createAsyncThunk(
//   "address/fetchAddress",
//   async ({ getToken }, thunkAPI) => {
//     try {
//       const token = await getToken()
//       const { data } = await axios.get("/api/address", {
//         headers: {
//           Authorization: `Bearer ${token}`,
//         },
//       })
//       return data?.addresses || []
//     } catch (error) {
//       return thunkAPI.rejectWithValue(error.response.data)
//     }
//   }
// )

// const addressSlice = createSlice({
//   name: "address",
//   initialState: {
//     list: [],
//   },
//   reducers: {
//     addAddress: (state, action) => {
//     if (!Array.isArray(state.list)) {
//         state.list = []
//     }
//     state.list.push(action.payload)
//     },
//     clearAddress: (state) => {
//       state.list = []
//     },
//   },
//   extraReducers: (builder) => {
//     builder.addCase(fetchAddress.fulfilled, (state, action) => {
//       state.list = action.payload
//     })
//   },
// })

// export const { addAddress, clearAddress } = addressSlice.actions

// export default addressSlice.reducer
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit"
import axios from "axios"

/* =========================
   THUNK: FETCH ADDRESSES
========================= */
export const fetchAddress = createAsyncThunk(
  "address/fetchAddress",
  async ({ getToken }, thunkAPI) => {
    try {
      const token = await getToken()

      const { data } = await axios.get("/api/address", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      // ALWAYS return an array
      return Array.isArray(data?.addresses) ? data.addresses : []

    } catch (error) {
      return thunkAPI.rejectWithValue(
        error?.response?.data || error.message
      )
    }
  }
)

/* =========================
   SLICE
========================= */
const addressSlice = createSlice({
  name: "address",
  initialState: {
    list: [],
  },
  reducers: {
    addAddress: (state, action) => {
      // Extra safety
      if (!Array.isArray(state.list)) {
        state.list = []
      }

      if (action.payload) {
        state.list.push(action.payload)
      }
    },

    clearAddress: (state) => {
      state.list = []
    },
  },

  extraReducers: (builder) => {
    builder
      .addCase(fetchAddress.fulfilled, (state, action) => {
        state.list = Array.isArray(action.payload)
          ? action.payload
          : []
      })
      .addCase(fetchAddress.rejected, (state) => {
        // Never allow list to become undefined
        state.list = []
      })
  },
})

export const { addAddress, clearAddress } = addressSlice.actions
export default addressSlice.reducer
