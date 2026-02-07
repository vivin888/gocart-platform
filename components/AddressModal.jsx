// "use client"

// import { useState } from "react"
// import { useAuth } from "@clerk/nextjs"
// import { useDispatch } from "react-redux"
// import axios from "axios"
// import toast from "react-hot-toast"
// import { XIcon } from "lucide-react"
// import { addAddress } from "@/lib/features/address/addressSlice"



// const AddressModal = ({ setShowAddressModal }) => {
//     const {getToken} = useAuth()    
//     const dispatch = useDispatch()

//     const [address, setAddress] = useState({
//         name: '',
//         email: '',
//         street: '',
//         city: '',
//         state: '',
//         zip: '',
//         country: '',
//         phone: ''
//     })

//     const handleAddressChange = (e) => {
//         setAddress({
//             ...address,
//             [e.target.name]: e.target.value
//         })
//     }

//     const handleSubmit = async (e) => {
//         e.preventDefault()
//         try {
//             const token = await getToken()
//             const { data } = await axios.post(
//             '/api/address',
//             { address },
//             {
//                 headers: {
//                 Authorization: `Bearer ${token}`,
//                 },
//             }
//             )
//             dispatch(addAddress(data.newAddress))
//             toast.success(data.message)
//             setShowAddressModal(false)
//         } catch (error) {
//             console.log(error)
//             toast.error(error?.response?.data?.message || error.message)
//         }
//     }

//     return (
//         <form onSubmit={e => toast.promise(handleSubmit(e), { loading: 'Adding Address...' })} className="fixed inset-0 z-50 bg-white/60 backdrop-blur h-screen flex items-center justify-center">
//             <div className="flex flex-col gap-5 text-slate-700 w-full max-w-sm mx-6">
//                 <h2 className="text-3xl ">Add New <span className="font-semibold">Address</span></h2>
//                 <input name="name" onChange={handleAddressChange} value={address.name} className="p-2 px-4 outline-none border border-slate-200 rounded w-full" type="text" placeholder="Enter your name" required />
//                 <input name="email" onChange={handleAddressChange} value={address.email} className="p-2 px-4 outline-none border border-slate-200 rounded w-full" type="email" placeholder="Email address" required />
//                 <input name="street" onChange={handleAddressChange} value={address.street} className="p-2 px-4 outline-none border border-slate-200 rounded w-full" type="text" placeholder="Street" required />
//                 <div className="flex gap-4">
//                     <input name="city" onChange={handleAddressChange} value={address.city} className="p-2 px-4 outline-none border border-slate-200 rounded w-full" type="text" placeholder="City" required />
//                     <input name="state" onChange={handleAddressChange} value={address.state} className="p-2 px-4 outline-none border border-slate-200 rounded w-full" type="text" placeholder="State" required />
//                 </div>
//                 <div className="flex gap-4">
//                     <input name="zip" onChange={handleAddressChange} value={address.zip} className="p-2 px-4 outline-none border border-slate-200 rounded w-full" type="number" placeholder="Zip code" required />
//                     <input name="country" onChange={handleAddressChange} value={address.country} className="p-2 px-4 outline-none border border-slate-200 rounded w-full" type="text" placeholder="Country" required />
//                 </div>
//                 <input name="phone" onChange={handleAddressChange} value={address.phone} className="p-2 px-4 outline-none border border-slate-200 rounded w-full" type="text" placeholder="Phone" required />
//                 <button className="bg-slate-800 text-white text-sm font-medium py-2.5 rounded-md hover:bg-slate-900 active:scale-95 transition-all">SAVE ADDRESS</button>
//             </div>
//             <XIcon size={30} className="absolute top-5 right-5 text-slate-500 hover:text-slate-700 cursor-pointer" onClick={() => setShowAddressModal(false)} />
//         </form>
//     )
// }

// export default AddressModal

"use client"

import { useState } from "react"
import { useAuth } from "@clerk/nextjs"
import { useDispatch } from "react-redux"
import axios from "axios"
import toast from "react-hot-toast"
import { XIcon } from "lucide-react"
import { addAddress } from "@/lib/features/address/addressSlice"

const AddressModal = ({ setShowAddressModal }) => {
  const { getToken } = useAuth()
  const dispatch = useDispatch()

  const [address, setAddress] = useState({
    name: "",
    email: "",
    street: "",
    city: "",
    state: "",
    zip: "",
    country: "",
    phone: "",
  })

  const [loading, setLoading] = useState(false)

  const handleAddressChange = (e) => {
    const { name, value } = e.target
    setAddress((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (loading) return
    setLoading(true)

    try {
      const token = await getToken()

      const { data } = await axios.post(
        "/api/address",
        { address },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      // ✅ CRITICAL SAFETY CHECK
      if (data?.newAddress) {
        dispatch(addAddress(data.newAddress))
      }

      toast.success(data?.message || "Address added successfully")
      setShowAddressModal(false)

    } catch (error) {
      console.error(error)
      toast.error(
        error?.response?.data?.message || error.message || "Something went wrong"
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="fixed inset-0 z-50 bg-white/60 backdrop-blur h-screen flex items-center justify-center"
    >
      <div className="flex flex-col gap-5 text-slate-700 w-full max-w-sm mx-6">
        <h2 className="text-3xl">
          Add New <span className="font-semibold">Address</span>
        </h2>

        <input name="name" value={address.name} onChange={handleAddressChange} className="p-2 px-4 border rounded" placeholder="Name" required />
        <input name="email" value={address.email} onChange={handleAddressChange} className="p-2 px-4 border rounded" placeholder="Email" required />
        <input name="street" value={address.street} onChange={handleAddressChange} className="p-2 px-4 border rounded" placeholder="Street" required />

        <div className="flex gap-4">
          <input name="city" value={address.city} onChange={handleAddressChange} className="p-2 px-4 border rounded w-full" placeholder="City" required />
          <input name="state" value={address.state} onChange={handleAddressChange} className="p-2 px-4 border rounded w-full" placeholder="State" required />
        </div>

        <div className="flex gap-4">
          <input name="zip" value={address.zip} onChange={handleAddressChange} className="p-2 px-4 border rounded w-full" placeholder="Zip" required />
          <input name="country" value={address.country} onChange={handleAddressChange} className="p-2 px-4 border rounded w-full" placeholder="Country" required />
        </div>

        <input name="phone" value={address.phone} onChange={handleAddressChange} className="p-2 px-4 border rounded" placeholder="Phone" required />

        <button
          disabled={loading}
          className="bg-slate-800 text-white py-2.5 rounded hover:bg-slate-900 disabled:opacity-60"
        >
          {loading ? "Saving..." : "SAVE ADDRESS"}
        </button>
      </div>

      <XIcon
        size={30}
        className="absolute top-5 right-5 cursor-pointer text-slate-500 hover:text-slate-700"
        onClick={() => setShowAddressModal(false)}
      />
    </form>
  )
}

export default AddressModal
