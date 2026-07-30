'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Phone, MapPin, CreditCard, Smartphone, Loader2, CheckCircle, XCircle, Navigation, Store, Home, Compass } from 'lucide-react'
import { useCartStore } from '@/lib/cart-store'
import { useAuth, apiFetch } from '@/lib/auth'
import { validateKenyanPhone } from '@/lib/validation'
import { KENYAN_COUNTIES, PICKUP_STATIONS, PickupStation } from '@/lib/location-data'

type PaymentMethod = 'MOCK' | 'MPESA'
type CheckoutStatus = 'form' | 'processing' | 'awaiting_confirmation' | 'success' | 'failed' | 'timeout'
type DeliveryMode = 'doorstep' | 'pickup'

export default function CheckoutPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { items, total, itemCount, clearCart } = useCartStore()

  const [phone, setPhone] = useState('')
  
  // Delivery & Location States (Jumia Model)
  const [deliveryMode, setDeliveryMode] = useState<DeliveryMode>('doorstep')
  const [selectedCounty, setSelectedCounty] = useState('Nairobi')
  const [selectedTown, setSelectedTown] = useState('Westlands')
  const [streetLandmark, setStreetLandmark] = useState('')
  const [selectedStationId, setSelectedStationId] = useState<number>(1)
  
  // Geolocation GPS State
  const [detectingGps, setDetectingGps] = useState(false)
  const [gpsCoordinates, setGpsCoordinates] = useState<{ lat: number; lon: number } | null>(null)
  const [gpsAddressTag, setGpsAddressTag] = useState('')

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('MOCK')
  const [status, setStatus] = useState<CheckoutStatus>('form')
  const [error, setError] = useState('')
  const pollRef = useRef<NodeJS.Timeout | null>(null)

  // Available towns for selected county
  const currentCountyObj = KENYAN_COUNTIES.find(c => c.name === selectedCounty) || KENYAN_COUNTIES[0]
  const availableTowns = currentCountyObj.towns

  // Available pickup stations for selected county
  const availableStations = PICKUP_STATIONS.filter(s => s.county === selectedCounty)

  // Calculate delivery fee
  const selectedStation = PICKUP_STATIONS.find(s => s.id === selectedStationId)
  const doorstepFee = total >= 2000 ? 0 : 200
  const delivery = deliveryMode === 'pickup' ? (selectedStation ? selectedStation.fee : 100) : doorstepFee
  const grandTotal = total + delivery

  // Update selected town if current town is not in new county
  const handleCountyChange = (countyName: string) => {
    setSelectedCounty(countyName)
    const countyData = KENYAN_COUNTIES.find(c => c.name === countyName)
    if (countyData && countyData.towns.length > 0) {
      setSelectedTown(countyData.towns[0])
    }
    const countyStations = PICKUP_STATIONS.filter(s => s.county === countyName)
    if (countyStations.length > 0) {
      setSelectedStationId(countyStations[0].id)
    }
  }

  // Redirect if cart empty
  useEffect(() => {
    if (items.length === 0 && status === 'form') {
      router.push('/cart')
    }
  }, [items, status])

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [])

  // Geolocation API Handler (Jumia Style GPS Detection)
  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser')
      return
    }

    setDetectingGps(true)
    setError('')

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude
        const lon = pos.coords.longitude
        setGpsCoordinates({ lat, lon })

        try {
          // Reverse geocode via OpenStreetMap Nominatim
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`)
          const data = await res.json()
          
          if (data && data.address) {
            const addr = data.address
            const detectedCounty = addr.county || addr.state || addr.city || ''
            const detectedTown = addr.town || addr.suburb || addr.neighbourhood || addr.city_district || ''
            const detectedRoad = addr.road || addr.pedestrian || addr.building || ''

            // Match county if found in our Kenya list
            const matchedCounty = KENYAN_COUNTIES.find(c => 
              detectedCounty.toLowerCase().includes(c.name.toLowerCase()) || 
              c.name.toLowerCase().includes(detectedCounty.toLowerCase())
            )
            if (matchedCounty) {
              setSelectedCounty(matchedCounty.name)
              const matchedTown = matchedCounty.towns.find(t => 
                detectedTown.toLowerCase().includes(t.toLowerCase()) || 
                t.toLowerCase().includes(detectedTown.toLowerCase())
              )
              if (matchedTown) {
                setSelectedTown(matchedTown)
              }
            }

            if (detectedRoad) {
              setStreetLandmark(prev => prev ? `${prev}, ${detectedRoad}` : detectedRoad)
            }

            const tag = [addr.suburb || addr.town || addr.city, addr.road, addr.county].filter(Boolean).join(', ')
            setGpsAddressTag(tag || `${lat.toFixed(4)}, ${lon.toFixed(4)}`)
          } else {
            setGpsAddressTag(`Lat: ${lat.toFixed(4)}, Lon: ${lon.toFixed(4)}`)
          }
        } catch {
          setGpsAddressTag(`Lat: ${lat.toFixed(4)}, Lon: ${lon.toFixed(4)}`)
        } finally {
          setDetectingGps(false)
        }
      },
      (err) => {
        console.error(err)
        setError('Could not get your location. Please select your county and town manually.')
        setDetectingGps(false)
      },
      { timeout: 10000, enableHighAccuracy: true }
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) {
      router.push('/login')
      return
    }

    if (!validateKenyanPhone(phone)) {
      setError('Please provide a valid Kenyan phone number (starts with +254, 07, or 01, max 12 digits)')
      return
    }

    if (deliveryMode === 'doorstep' && !streetLandmark.trim()) {
      setError('Please enter your street, building, or landmark for doorstep delivery')
      return
    }

    setError('')
    setStatus('processing')

    // Construct structured delivery address
    let formattedAddress = ''
    if (deliveryMode === 'doorstep') {
      formattedAddress = `[Doorstep Delivery] County: ${selectedCounty}, Town: ${selectedTown}, Details: ${streetLandmark.trim()}`
    } else {
      const station = PICKUP_STATIONS.find(s => s.id === selectedStationId)
      formattedAddress = `[Pickup Station] ${station ? station.name : selectedCounty}`
    }

    if (gpsCoordinates) {
      formattedAddress += ` (GPS: ${gpsCoordinates.lat.toFixed(4)}, ${gpsCoordinates.lon.toFixed(4)})`
    }

    try {
      const data = await apiFetch('/api/orders/checkout', {
        method: 'POST',
        body: JSON.stringify({
          phone_number: phone,
          shipping_address: formattedAddress,
          payment_method: paymentMethod,
        }),
      })

      if (data.checkout_request_id) {
        setStatus('awaiting_confirmation')
        startPolling(data.checkout_request_id)
      } else {
        setStatus('success')
        clearCart()
      }
    } catch (err: any) {
      setError(err.message || 'Checkout failed')
      setStatus('form')
    }
  }

  const startPolling = (checkoutRequestId: string) => {
    let attempts = 0
    pollRef.current = setInterval(async () => {
      attempts++
      if (attempts > 30) {
        clearInterval(pollRef.current!)
        setStatus('timeout')
        return
      }

      try {
        const data = await apiFetch(`/api/orders/payment/${checkoutRequestId}/status`)
        if (data.status === 'PAID' || data.status === 'SUCCESS') {
          clearInterval(pollRef.current!)
          setStatus('success')
          clearCart()
        } else if (data.status === 'FAILED') {
          clearInterval(pollRef.current!)
          setStatus('failed')
        }
      } catch {
        // keep polling
      }
    }, 3000)
  }

  // ── Success State ──
  if (status === 'success') {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center animate-fade-in">
        <div className="glass rounded-3xl p-10">
          <div className="w-16 h-16 mx-auto mb-5 rounded-full bg-success/15 flex items-center justify-center">
            <CheckCircle size={32} className="text-success" />
          </div>
          <h1 className="text-2xl font-extrabold text-foreground" style={{ fontFamily: 'var(--font-heading)' }}>
            Order Placed!
          </h1>
          <p className="text-sm text-muted mt-2 leading-relaxed">
            Your order has been placed successfully and is being processed for delivery.
          </p>
          <Link href="/account" className="btn-pill-primary mt-6 inline-flex py-3 px-8 text-sm font-bold">
            View My Orders
          </Link>
        </div>
      </div>
    )
  }

  // ── Failed State ──
  if (status === 'failed') {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center animate-fade-in">
        <div className="glass rounded-3xl p-10">
          <div className="w-16 h-16 mx-auto mb-5 rounded-full bg-danger/10 flex items-center justify-center">
            <XCircle size={32} className="text-danger" />
          </div>
          <h1 className="text-2xl font-bold text-foreground" style={{ fontFamily: 'var(--font-heading)' }}>
            Payment Failed
          </h1>
          <p className="text-sm text-muted mt-2">
            The M-Pesa payment was cancelled or failed due to insufficient funds.
          </p>
          <button onClick={() => setStatus('form')} className="btn-pill-primary mt-6 inline-flex py-3 px-8 text-sm font-bold">
            Try Again
          </button>
        </div>
      </div>
    )
  }

  // ── Timeout State ──
  if (status === 'timeout') {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center animate-fade-in">
        <div className="glass rounded-3xl p-10">
          <div className="w-16 h-16 mx-auto mb-5 rounded-full bg-warning/10 flex items-center justify-center">
            <Loader2 size={32} className="text-warning animate-spin" />
          </div>
          <h1 className="text-2xl font-bold text-foreground" style={{ fontFamily: 'var(--font-heading)' }}>
            Payment Taking Too Long
          </h1>
          <p className="text-sm text-muted mt-2">
            We haven&apos;t received confirmation from Safaricom yet. You can track your payment status in your account.
          </p>
          <Link href="/account" className="btn-pill-primary mt-6 inline-flex py-3 px-8 text-sm font-bold">
            Check Orders
          </Link>
        </div>
      </div>
    )
  }

  // ── Awaiting Confirmation State (M-Pesa waiting) ──
  if (status === 'awaiting_confirmation') {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center animate-fade-in">
        <div className="glass rounded-3xl p-10">
          <div className="w-16 h-16 mx-auto mb-5 rounded-full bg-primary/10 flex items-center justify-center animate-pulse">
            <Smartphone size={28} className="text-primary" />
          </div>
          <h1 className="text-xl font-extrabold text-foreground" style={{ fontFamily: 'var(--font-heading)' }}>
            Waiting for M-Pesa PIN...
          </h1>
          <p className="text-sm text-muted mt-2 leading-relaxed">
            An M-Pesa payment request has been sent to <strong className="text-foreground">{phone}</strong>. 
            Please check your phone and enter your M-Pesa PIN to authorize.
          </p>
          <div className="flex items-center justify-center gap-2 mt-6 text-xs font-bold text-primary">
            <Loader2 size={14} className="animate-spin" />
            Verifying payment status...
          </div>
        </div>
      </div>
    )
  }

  // ── Checkout Form ──
  return (
    <div className="max-w-[var(--max-w-page)] mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6 text-foreground" style={{ fontFamily: 'var(--font-heading)' }}>
        Checkout & Delivery Details
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form */}
        <form onSubmit={handleSubmit} className="lg:col-span-2 space-y-6">
          {error && (
            <div className="bg-danger/10 text-danger text-sm font-medium p-3.5 rounded-xl border border-danger/20">
              ❌ {error}
            </div>
          )}

          {/* Customer Contact */}
          <div className="glass rounded-2xl p-6 space-y-4">
            <h2 className="text-base font-bold text-foreground" style={{ fontFamily: 'var(--font-heading)' }}>
              1. Customer Contact
            </h2>

            <div>
              <label className="text-xs font-semibold text-muted mb-1.5 block">Phone Number (M-Pesa registered)</label>
              <div className="relative">
                <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
                <input
                  required type="tel" placeholder="+254712345678"
                  value={phone} onChange={e => setPhone(e.target.value)}
                  className="input-glass pl-10"
                />
              </div>
            </div>
          </div>

          {/* Delivery Location - Jumia Model */}
          <div className="glass rounded-2xl p-6 space-y-5">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-border/40 pb-4">
              <div>
                <h2 className="text-base font-bold text-foreground" style={{ fontFamily: 'var(--font-heading)' }}>
                  2. Delivery Location
                </h2>
                <p className="text-xs text-muted mt-0.5">Select structured location or auto-detect with GPS</p>
              </div>

              {/* Geolocation Button */}
              <button
                type="button"
                onClick={handleDetectLocation}
                disabled={detectingGps}
                className="btn-secondary text-xs py-2 px-3.5 rounded-xl flex items-center gap-1.5 shrink-0 hover:border-primary/50 text-primary font-bold"
              >
                {detectingGps ? (
                  <><Loader2 size={14} className="animate-spin" /> Detecting GPS...</>
                ) : (
                  <><Navigation size={14} className="text-primary fill-primary/20" /> Auto-Detect My Location</>
                )}
              </button>
            </div>

            {/* GPS Verified Badge */}
            {gpsAddressTag && (
              <div className="bg-success/10 border border-success/20 text-success text-xs font-bold rounded-xl p-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Compass size={16} className="shrink-0" />
                  <span>GPS Detected: {gpsAddressTag}</span>
                </div>
                {gpsCoordinates && (
                  <span className="text-[10px] bg-success/20 px-2 py-0.5 rounded-full font-mono">
                    {gpsCoordinates.lat.toFixed(4)}, {gpsCoordinates.lon.toFixed(4)}
                  </span>
                )}
              </div>
            )}

            {/* Delivery Mode Options (Doorstep vs Pickup) */}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setDeliveryMode('doorstep')}
                className={`glass p-4 rounded-xl text-left border transition-all cursor-pointer ${
                  deliveryMode === 'doorstep'
                    ? 'border-primary ring-2 ring-primary/20 bg-primary/5'
                    : 'hover:border-primary/30'
                }`}
              >
                <div className="flex items-center gap-2 mb-1 text-primary">
                  <Home size={18} />
                  <span className="text-sm font-extrabold text-foreground">Doorstep Delivery</span>
                </div>
                <p className="text-xs text-muted">Delivered to your home, office, or building</p>
              </button>

              <button
                type="button"
                onClick={() => setDeliveryMode('pickup')}
                className={`glass p-4 rounded-xl text-left border transition-all cursor-pointer ${
                  deliveryMode === 'pickup'
                    ? 'border-primary ring-2 ring-primary/20 bg-primary/5'
                    : 'hover:border-primary/30'
                }`}
              >
                <div className="flex items-center gap-2 mb-1 text-primary">
                  <Store size={18} />
                  <span className="text-sm font-extrabold text-foreground">Pickup Station</span>
                </div>
                <p className="text-xs text-muted">Collect from verified local pickup hub (Cheaper)</p>
              </button>
            </div>

            {/* Doorstep Delivery Form */}
            {deliveryMode === 'doorstep' && (
              <div className="space-y-4 pt-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-muted mb-1.5 block">County</label>
                    <select
                      className="input-glass text-sm font-semibold"
                      value={selectedCounty}
                      onChange={e => handleCountyChange(e.target.value)}
                    >
                      {KENYAN_COUNTIES.map(c => (
                        <option key={c.name} value={c.name}>{c.name} County</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-muted mb-1.5 block">Town / Sub-County</label>
                    <select
                      className="input-glass text-sm font-semibold"
                      value={selectedTown}
                      onChange={e => setSelectedTown(e.target.value)}
                    >
                      {availableTowns.map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-muted mb-1.5 block">
                    Street / Building / House No. / Landmark <span className="text-danger">*</span>
                  </label>
                  <div className="relative">
                    <MapPin size={16} className="absolute left-3.5 top-3.5 text-muted" />
                    <textarea
                      required
                      placeholder="e.g. Woodvale Groove, Mpaka Plaza 3rd Floor, House B4 near Shell Petrol Station"
                      value={streetLandmark}
                      onChange={e => setStreetLandmark(e.target.value)}
                      className="input-glass pl-10 min-h-[80px] resize-none text-sm"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Pickup Station Form */}
            {deliveryMode === 'pickup' && (
              <div className="space-y-4 pt-2">
                <div>
                  <label className="text-xs font-semibold text-muted mb-1.5 block">Select County</label>
                  <select
                    className="input-glass text-sm font-semibold"
                    value={selectedCounty}
                    onChange={e => handleCountyChange(e.target.value)}
                  >
                    {KENYAN_COUNTIES.map(c => (
                      <option key={c.name} value={c.name}>{c.name} County</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-muted mb-1.5 block">Available Pickup Stations in {selectedCounty}</label>
                  {availableStations.length > 0 ? (
                    <div className="space-y-2">
                      {availableStations.map(st => (
                        <label
                          key={st.id}
                          className={`glass p-3.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                            selectedStationId === st.id
                              ? 'border-primary bg-primary/5 ring-1 ring-primary/30'
                              : 'hover:border-primary/20'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <input
                              type="radio"
                              name="pickup_station"
                              checked={selectedStationId === st.id}
                              onChange={() => setSelectedStationId(st.id)}
                              className="accent-primary cursor-pointer"
                            />
                            <div>
                              <span className="text-sm font-bold text-foreground block">{st.name}</span>
                              <span className="text-xs text-muted">Area: {st.town}</span>
                            </div>
                          </div>
                          <span className="text-xs font-black text-primary">KES {st.fee}</span>
                        </label>
                      ))}
                    </div>
                  ) : (
                    <div className="text-xs text-muted p-4 border border-dashed border-border rounded-xl text-center">
                      No pickup stations available in {selectedCounty} yet. Please choose Doorstep Delivery.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Payment Method */}
          <div className="glass rounded-2xl p-6 space-y-4">
            <h2 className="text-base font-bold text-foreground" style={{ fontFamily: 'var(--font-heading)' }}>
              3. Payment Method
            </h2>

            <div className="grid grid-cols-2 gap-3">
              {([
                { value: 'MOCK' as PaymentMethod, icon: <CreditCard size={20} />, label: 'Mock Payment', desc: 'Simulate instant payment' },
                { value: 'MPESA' as PaymentMethod, icon: <Smartphone size={20} />, label: 'M-Pesa STK Push', desc: 'Direct prompt to your phone' },
              ]).map(opt => (
                <label
                  key={opt.value}
                  className={`glass rounded-xl p-4 cursor-pointer transition-all border ${
                    paymentMethod === opt.value
                      ? 'border-primary ring-2 ring-primary/20 bg-primary/5'
                      : 'hover:border-primary/30'
                  }`}
                >
                  <input
                    type="radio" name="payment" value={opt.value}
                    checked={paymentMethod === opt.value}
                    onChange={() => setPaymentMethod(opt.value)}
                    className="sr-only"
                  />
                  <div className={`mb-2 ${paymentMethod === opt.value ? 'text-primary' : 'text-muted'}`}>
                    {opt.icon}
                  </div>
                  <div className="text-sm font-bold text-foreground">{opt.label}</div>
                  <div className="text-[11px] text-muted">{opt.desc}</div>
                </label>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={status === 'processing'}
            className="btn-pill-accent w-full py-4 text-sm font-extrabold shadow-xl hover:shadow-2xl transition-all cursor-pointer"
          >
            {status === 'processing' ? (
              <><Loader2 size={16} className="animate-spin" /> Processing Order...</>
            ) : (
              `Place Order — KES ${grandTotal.toLocaleString()}`
            )}
          </button>
        </form>

        {/* Order Summary */}
        <div>
          <div className="glass rounded-2xl p-6 sticky top-24 space-y-4">
            <h3 className="text-base font-bold text-foreground" style={{ fontFamily: 'var(--font-heading)' }}>
              Order Summary
            </h3>

            <div className="space-y-3 text-sm max-h-60 overflow-y-auto pr-1">
              {items.map(item => (
                <div key={item.product_id} className="flex justify-between items-center text-xs">
                  <span className="text-muted truncate mr-2 font-medium">{item.name} × {item.quantity}</span>
                  <span className="font-extrabold text-foreground shrink-0">
                    KES {(item.price * item.quantity).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>

            <hr className="border-border/40" />

            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-muted text-xs font-medium">
                <span>Items Subtotal</span>
                <span>KES {total.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-muted text-xs font-medium">
                <span>Delivery Fee ({deliveryMode === 'doorstep' ? 'Doorstep' : 'Pickup Station'})</span>
                <span className={delivery === 0 ? 'text-success font-bold' : ''}>
                  {delivery === 0 ? 'FREE' : `KES ${delivery}`}
                </span>
              </div>
              <hr className="border-border/40" />
              <div className="flex justify-between font-extrabold text-base text-foreground pt-1">
                <span>Total Amount</span>
                <span className="text-primary font-black">KES {grandTotal.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
