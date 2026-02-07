"use client"

import Banner from "@/components/Banner"
import Navbar from "@/components/Navbar"
import Footer from "@/components/Footer"

import { useEffect } from "react"
import { useDispatch, useSelector } from "react-redux"
import { fetchProducts } from "@/lib/features/product/productSlice"
import { fetchCart, uploadCart } from "@/lib/features/cart/cartSlice"
import { useAuth, useUser } from "@clerk/nextjs"
import { fetchAddress } from "@/lib/features/address/addressSlice"
import { fetchUserRatings } from "@/lib/features/rating/ratingSlice"

export default function PublicLayout({ children }) {
  const dispatch = useDispatch()
  const { user } = useUser()
  const { getToken } = useAuth()
  const { cartItems } = useSelector((state) => state.cart)

  // Fetch products (runs once)
  useEffect(() => {
    dispatch(fetchProducts({}))
  }, [])

  // Fetch cart when user logs in
  useEffect(() => {
    if (user) {
      dispatch(fetchCart({ getToken }))
      dispatch(fetchAddress({ getToken }))
      dispatch(fetchUserRatings({ getToken }))
    }
  }, [user])

  // Upload cart when cart changes (debounced thunk)
  useEffect(() => {
    if (user) {
      dispatch(uploadCart({ getToken }))
    }
  }, [cartItems])

  return (
    <>
      <Navbar />
      <Banner />
      {children}
      <Footer />
    </>
  )
}
