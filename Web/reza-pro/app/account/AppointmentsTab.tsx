import { ChevronRight, Clock, Calendar, User, MapPin, Phone, CreditCard, Tag, Star, Navigation, ArrowLeft } from 'lucide-react';
import React, { useState } from 'react';
import EditAppointmentModal from './EditAppointmentModal';

const AppointmentsTab = ({
  appointments,
  getStatusText,
  handleAddReview,
  salonTeam = [],
  timeSlots = [],
  salonServices = [],
  onUpdateAppointment = () => {},
}) => {
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [detailedRatings, setDetailedRatings] = useState({
    quality: 0,
    professionalism: 0,
    cleanliness: 0,
    value: 0
  });
  const [comment, setComment] = useState('');
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editData, setEditData] = useState(null);

  const handleAppointmentClick = (apt) => {
    setSelectedAppointment(apt);
    setShowReviewForm(false); // Hide review form on new appointment
    // Reset form
    setRating(0);
    setHoverRating(0);
    setDetailedRatings({
      quality: 0,
      professionalism: 0,
      cleanliness: 0,
      value: 0
    });
    setComment('');
  };

  const closeDetails = () => {
    setSelectedAppointment(null);
  };

  const handleSubmitReview = () => {
    if (!selectedAppointment) return;
    // Call parent handler to add review
    handleAddReview({
      salon: selectedAppointment.salon,
      salonImage: selectedAppointment.image,
      salonLocation: selectedAppointment.address || 'Casablanca',
      service: selectedAppointment.service,
      rating,
      comment,
      appointmentDate: new Date(selectedAppointment.date).toLocaleDateString('fr-FR'),
      // Optionally add detailedRatings if needed
      detailedRatings,
    });
    alert('Votre avis a été publié avec succès!');
    setShowReviewForm(false);
  };

  const handleEditClick = (apt) => {
    setEditData({
      services: apt.services || [{ name: apt.service, duration: apt.duration, price: apt.price }],
      date: apt.date,
      time: apt.time,
      professional: apt.professional
        ? salonTeam?.find((m) => m.name === apt.professional) || null
        : null,
      notes: apt.notes || '',
    });
    setShowEditModal(true);
  };

  const handleSaveEdit = (newData) => {
    if (selectedAppointment) {
      // Call parent or update logic
      try {
        // onUpdateAppointment from parent may expect either (id, data) or a single payload.
        // Call it defensively and ignore TypeScript signature constraints.
        // @ts-ignore
        onUpdateAppointment(selectedAppointment.id, newData);
      } catch {
        // noop if parent implementation differs
      }
      // Update local selectedAppointment for immediate UI feedback
      setSelectedAppointment({
        ...selectedAppointment,
        ...newData,
        service: newData.services?.map(s => s.name).join(', '),
        price: newData.services?.reduce((acc, s) => acc + (s.price || 0), 0),
        duration: newData.services?.map(s => s.duration).join(' + '),
        professional: newData.professional?.name || '',
        notes: newData.notes,
      });
    }
    setShowEditModal(false);
  };

  // Details page view
  if (selectedAppointment) {
    return (
      <>
        <div className="min-h-screen -m-8 bg-[#f5f7f3]">
       
        {/* Hero Section - Refined */}
        <div className="max-w-7xl mx-auto px-12 pt-16">
          {/* Top right controls */}
          <div className="flex justify-end mb-6 relative z-50">
            <div className="flex items-center gap-4">
              <button 
                onClick={closeDetails}
                className="flex items-center gap-3 text-gray-400 hover:text-gray-900 transition-colors group"
              >
                <div className="w-8 h-8 rounded-full group-hover:border-gray-900 flex items-center justify-center transition-all">
                  <ArrowLeft className="w-4 h-4" />
                </div>
                <span className="text-sm font-light tracking-wide">Retour</span>
              </button>
            </div>
          </div>
          <div className="grid grid-cols-5 -mt-16 gap-12 mb-16">
            <div className="col-span-2">
              <div className="aspect-[4/3] rounded-3xl overflow-hidden relative">
                <img 
                  src={selectedAppointment.image} 
                  alt={selectedAppointment.salon}
                  className="w-full h-full object-cover"
                />
                {/* Status badge absolutely positioned in top right, now smaller */}
                <div className={`absolute top-3 right-3 px-3 py-1 text-[11px] font-light tracking-widest rounded-full ${
                  selectedAppointment.status === 'confirmed' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                  selectedAppointment.status === 'completed' ? 'bg-gray-50 text-gray-600 border border-gray-200' :
                  'bg-rose-50 text-rose-700 border border-rose-100'
                }`}>
                  {getStatusText(selectedAppointment.status)}
                </div>
              </div>
            </div>
            
            <div className="col-span-3 flex flex-col justify-center space-y-8">
              <div>
                {/* Status badge removed from here */}
                <div className="text-xs font-light tracking-widest text-gray-400 uppercase mb-4">
                  Réservation #REF{selectedAppointment.id}
                </div>
                <h1 className="text-5xl font-extralight text-gray-900 tracking-tight leading-tight mb-6">
                  {selectedAppointment.salon}
                </h1>
                <div className="flex items-center gap-6 text-gray-500">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    <span className="text-sm font-light">{selectedAppointment.address || 'Casablanca, Morocco'}</span>
                  </div>
                  {selectedAppointment.salonPhone && (
                    <>
                      <span className="text-gray-300">•</span>
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4" />
                        <span className="text-sm font-light">{selectedAppointment.salonPhone}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Key Info Cards */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-[#f5f7f3] rounded-2xl p-6 border border-gray-200">
                  <Calendar className="w-5 h-5 text-gray-400 mb-3" />
                  <div className="text-xs text-gray-400 mb-1 font-light tracking-wide">DATE</div>
                  <div className="text-base font-light text-gray-900">
                    {new Date(selectedAppointment.date).toLocaleDateString('fr-FR', { 
                      day: 'numeric', 
                      month: 'short'
                    })}
                  </div>
                </div>

                <div className="bg-[#f5f7f3] rounded-2xl p-6 border border-gray-200">
                  <Clock className="w-5 h-5 text-gray-400 mb-3" />
                  <div className="text-xs text-gray-400 mb-1 font-light tracking-wide">HEURE</div>
                  <div className="text-base font-light text-gray-900">{selectedAppointment.time}</div>
                </div>

                <div className="bg-[#f5f7f3] rounded-2xl p-6 border border-gray-200">
                  <CreditCard className="w-5 h-5 text-gray-400 mb-3" />
                  <div className="text-xs text-gray-400 mb-1 font-light tracking-wide">TOTAL</div>
                  <div className="text-base font-light text-gray-900">
                    {selectedAppointment.totalPrice || selectedAppointment.price} MAD
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-12 pb-24">
          <div className="grid grid-cols-3 gap-8">
            {/* Left Column */}
            <div className="col-span-2 space-y-8">
              {/* Service Details */}
              <div className="bg-[#f5f7f3] rounded-3xl p-10 border border-gray-200">
                <div className="flex items-start justify-between mb-8">
                  <div className="flex-1">
                    <div className="text-xs font-light tracking-widest text-gray-400 uppercase mb-3">
                      Service
                    </div>
                    <h2 className="text-2xl font-light text-gray-900 mb-3">
                      {selectedAppointment.service}
                    </h2>
                    {selectedAppointment.serviceDescription && (
                      <p className="text-sm text-gray-500 leading-relaxed font-light">
                        {selectedAppointment.serviceDescription}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-extralight text-gray-900">{selectedAppointment.price}</div>
                    <div className="text-xs text-gray-400 font-light tracking-wide mt-1">MAD</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6 pt-8 border-t border-gray-200">
                  <div>
                    <div className="text-xs text-gray-400 font-light tracking-wide mb-2">DURÉE ESTIMÉE</div>
                    <div className="text-lg font-light text-gray-900">{selectedAppointment.duration || '60 minutes'}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-400 font-light tracking-wide mb-2">CATÉGORIE</div>
                    <div className="text-lg font-light text-gray-900">Soins & Beauté</div>
                  </div>
                </div>
              </div>

              {/* Date & Time Detailed */}
              <div className="bg-[#f5f7f3] rounded-3xl p-10 border border-gray-200">
                <div className="text-xs font-light tracking-widest text-gray-400 uppercase mb-6">
                  Horaire de votre rendez-vous
                </div>
                
                <div className="space-y-6">
                  <div className="flex items-center gap-6">
                    <div className="w-16 h-16 bg-gray-900 rounded-2xl flex flex-col items-center justify-center border border-gray-200">
                      <div className="text-2xl font-light text-white">
                        {new Date(selectedAppointment.date).getDate()}
                      </div>
                      <div className="text-xs text-gray-400 font-normal">
                        {new Date(selectedAppointment.date).toLocaleDateString('fr-FR', { month: 'short' }).toUpperCase()}
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="text-xl font-light text-gray-900 mb-1">
                        {new Date(selectedAppointment.date).toLocaleDateString('fr-FR', { 
                          weekday: 'long',
                          day: 'numeric', 
                          month: 'long',
                          year: 'numeric'
                        })}
                      </div>
                      <div className="text-gray-500 font-light">{selectedAppointment.time}</div>
                    </div>
                  </div>

                  <div className="h-px bg-gray-100"></div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500 font-light">Arrivée recommandée</span>
                    <span className="text-gray-900 font-light">15 minutes avant</span>
                  </div>
                </div>
              </div>

              {/* Professional */}
              <div className="bg-[#f5f7f3] rounded-2xl p-10 border border-gray-200">
                <div className="text-xs font-light tracking-widest text-gray-400 uppercase mb-6">
                  Votre professionnel
                </div>

                <div className="flex items-center gap-6">
                  <div className="w-20 h-20 bg-gray-900 rounded-full flex items-center justify-center text-white text-xl font-light">
                    {selectedAppointment.professional.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-light text-gray-900 mb-2">
                      {selectedAppointment.professional}
                    </h3>
                    {selectedAppointment.professionalSpecialty && (
                      <p className="text-sm text-gray-500 font-light mb-2">
                        {selectedAppointment.professionalSpecialty}
                      </p>
                    )}
                    {selectedAppointment.professionalYearsExp && (
                      <div className="flex items-center gap-4 text-xs text-gray-400">
                        <span className="flex items-center gap-1">
                          <Star className="w-3 h-3 fill-gray-400" />
                          Expert
                        </span>
                        <span>•</span>
                        <span>{selectedAppointment.professionalYearsExp} ans d'expérience</span>
                      </div>
                    )}
                  </div>
                </div>

                {selectedAppointment.professionals && selectedAppointment.professionals.length > 1 && (
                  <div className="mt-8 pt-8 border-t border-gray-200">
                    <div className="text-xs text-gray-400 font-light tracking-wide mb-4">ÉQUIPE DÉDIÉE</div>
                    <div className="grid grid-cols-2 gap-4">
                      {selectedAppointment.professionals.map((prof, idx) => (
                        <div key={idx} className="flex items-center gap-3 p-4 rounded-2xl bg-gray-50">
                          <div className="w-12 h-12 bg-gray-900 flex items-center justify-center text-white text-xs font-light rounded-full">
                            {prof.name.split(' ').map(n => n[0]).join('')}
                          </div>
                          <div>
                            <div className="text-sm font-light text-gray-900">{prof.name}</div>
                            <div className="text-xs text-gray-400">{prof.specialty}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Notes */}
              {selectedAppointment.notes && (
                <div className="bg-gradient-to-br from-gray-50 to-white rounded-3xl p-10 border border-gray-100">
                  <div className="text-xs font-light tracking-widest text-gray-400 uppercase mb-4">
                    Notes importantes
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed font-light">
                    {selectedAppointment.notes}
                  </p>
                </div>
              )}

              {/* Opinion Section */}
              {showReviewForm && (
                <div className="bg-[#f5f7f3] rounded-3xl p-10 border border-gray-200">
                  <div className="text-xs font-light tracking-widest text-gray-400 uppercase mb-6">
                    Votre avis
                  </div>
                  
                  {/* Star Rating */}
                  <div className="mb-6">
                    <div className="text-sm text-gray-600 font-light mb-3">Note globale</div>
                    <div className="flex items-center gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          className="group"
                          onMouseEnter={() => setHoverRating(star)}
                          onMouseLeave={() => setHoverRating(0)}
                          onClick={() => setRating(star)}
                          aria-label={`${star} étoiles`}
                        >
                          <Star 
                            className={`w-8 h-8 transition-all cursor-pointer ${
                              star <= (hoverRating || rating)
                                ? 'text-gray-900 fill-gray-900'
                                : 'text-gray-300'
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Comment Textarea */}
                  <div className="mb-6">
                    <div className="text-sm text-gray-600 font-light mb-3">Votre commentaire</div>
                    <textarea
                      placeholder="Partagez votre expérience avec ce salon..."
                      rows={5}
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      className="w-full px-4 py-3 bg-[#f5f7f3] border border-gray-200 rounded-2xl text-sm text-gray-900 font-light placeholder-gray-400 focus:outline-none focus:border-gray-900 transition-colors resize-none"
                    />
                  </div>

                  {/* Specific Ratings */}
                  <div className="space-y-4 mb-6">
                    <div className="text-sm text-gray-600 font-light mb-3">Évaluations détaillées</div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 font-light">Qualité du service</span>
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            onClick={() => setDetailedRatings({...detailedRatings, quality: star})}
                          >
                            <Star 
                              className={`w-5 h-5 transition-all cursor-pointer ${
                                star <= detailedRatings.quality
                                  ? 'text-gray-900 fill-gray-900'
                                  : 'text-gray-300'
                              }`}
                            />
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 font-light">Professionnalisme</span>
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            onClick={() => setDetailedRatings({...detailedRatings, professionalism: star})}
                          >
                            <Star 
                              className={`w-5 h-5 transition-all cursor-pointer ${
                                star <= detailedRatings.professionalism
                                  ? 'text-gray-900 fill-gray-900'
                                  : 'text-gray-300'
                              }`}
                            />
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 font-light">Propreté</span>
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            onClick={() => setDetailedRatings({...detailedRatings, cleanliness: star})}
                          >
                            <Star 
                              className={`w-5 h-5 transition-all cursor-pointer ${
                                star <= detailedRatings.cleanliness
                                  ? 'text-gray-900 fill-gray-900'
                                  : 'text-gray-300'
                              }`}
                            />
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 font-light">Rapport qualité/prix</span>
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            onClick={() => setDetailedRatings({...detailedRatings, value: star})}
                          >
                            <Star 
                              className={`w-5 h-5 transition-all cursor-pointer ${
                                star <= detailedRatings.value
                                  ? 'text-gray-900 fill-gray-900'
                                  : 'text-gray-300'
                              }`}
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button 
                    onClick={handleSubmitReview}
                    className="w-full py-4 bg-gray-900 hover:bg-gray-800 text-white text-sm font-light tracking-wide transition-all rounded-full"
                  >
                    Publier l'avis
                  </button>
                </div>
              )}
            </div>

            {/* Right Sidebar - Sticky */}
            <div className="space-y-6 sticky top-24 self-start">
              {/* Payment Breakdown */}
              <div className="bg-[#f5f7f3] rounded-3xl p-8 border border-gray-200">
                <div className="text-xs font-light tracking-widest text-gray-400 uppercase mb-6">
                  Détails de paiement
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 font-light">Service</span>
                    <span className="text-sm text-gray-900 font-light">{selectedAppointment.price} MAD</span>
                  </div>
                  
                  {selectedAppointment.discount && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 font-light">Réduction</span>
                      <span className="text-sm text-emerald-600 font-light">-{selectedAppointment.discount} MAD</span>
                    </div>
                  )}
                  
                  {selectedAppointment.tax && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 font-light">TVA (20%)</span>
                      <span className="text-sm text-gray-900 font-light">{selectedAppointment.tax} MAD</span>
                    </div>
                  )}

                  <div className="h-px bg-gray-100 my-4"></div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-base text-gray-900 font-light">Total</span>
                    <span className="text-2xl text-gray-900 font-light">
                      {selectedAppointment.totalPrice || selectedAppointment.price} MAD
                    </span>
                  </div>

                  <div className="pt-4 text-xs text-gray-400 font-light">
                    Mode: {selectedAppointment.paymentMethod || 'Sur place'}
                  </div>
                </div>
              </div>

              {/* Booking Reference */}
              <div className="bg-[#f5f7f3] rounded-3xl p-8 border border-gray-200">
                <div className="text-xs font-light tracking-widest text-gray-400 uppercase mb-6">
                  Informations
                </div>
                
                <div className="space-y-4">
                  <div>
                    <div className="text-xs text-gray-400 font-light mb-1">Référence</div>
                    <div className="text-sm font-mono font-light text-gray-900">#REF{selectedAppointment.id}</div>
                  </div>

                  {selectedAppointment.confirmationCode && (
                    <div>
                      <div className="text-xs text-gray-400 font-light mb-1">Code de confirmation</div>
                      <div className="text-sm font-mono font-light text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">
                        {selectedAppointment.confirmationCode}
                      </div>
                    </div>
                  )}

                  {selectedAppointment.bookedFor && (
                    <div>
                      <div className="text-xs text-gray-400 font-light mb-1">Réservé pour</div>
                      <div className="text-sm font-light text-gray-900">{selectedAppointment.bookedFor}</div>
                    </div>
                  )}

                  <div>
                    <div className="text-xs text-gray-400 font-light mb-1">Réservé le</div>
                    <div className="text-sm font-light text-gray-900">
                      {selectedAppointment.bookingDate ? 
                        new Date(selectedAppointment.bookingDate).toLocaleDateString('fr-FR', { 
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        }) :
                        new Date().toLocaleDateString('fr-FR', { 
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        })
                      }
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-3">
                {selectedAppointment.status === 'confirmed' && (
                  <>
                    <button
                      className="w-full py-4 bg-gray-900 hover:bg-gray-800 text-white text-sm font-light tracking-wide transition-all rounded-full"
                      onClick={() => handleEditClick(selectedAppointment)}
                    >
                      Modifier
                    </button>
                    <button className="w-full py-4 border border-gray-200 hover:border-rose-300 hover:bg-rose-50 text-gray-600 hover:text-rose-700 text-sm font-light tracking-wide transition-all rounded-full">
                      Annuler
                    </button>
                  </>
                )}
                {selectedAppointment.status === 'completed' && (
                  <button
                    className="w-full py-4 bg-gray-900 hover:bg-gray-800 text-white text-sm font-light tracking-wide transition-all rounded-full"
                    onClick={() => setShowReviewForm(true)}
                  >
                    Laisser un avis
                  </button>
                )}
              </div>

              {/* Get Directions */}
              <button className="w-full py-4 border -mt-3 border-gray-200 hover:border-gray-900 text-gray-600 hover:text-gray-900 text-sm font-light tracking-wide transition-all rounded-full flex items-center justify-center gap-2">
                <Navigation className="w-4 h-4" />
                Obtenir l'itinéraire
              </button>
            </div>
          </div>
        </div>
      </div>

      <EditAppointmentModal
        show={showEditModal}
        onClose={() => setShowEditModal(false)}
        initialData={editData || {
          services: [],
          date: '',
          time: '',
          professional: null,
          notes: '',
        }}
        salonTeam={salonTeam}
        timeSlots={timeSlots}
        salonServices={salonServices}
        onSave={handleSaveEdit}
      />
    </>
    );
  }

  // List view
  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-extralight text-gray-900 tracking-tight mb-2">Rendez-vous</h2>
          <p className="text-xs text-gray-400 tracking-wide font-light">{appointments.length} réservations</p>
        </div>
      </div>

      <div className="space-y-4">
        {appointments.map((apt) => (
          <div 
            key={apt.id} 
            onClick={() => handleAppointmentClick(apt)}
            className="group bg-[#f5f7f3] border border-gray-200 hover:border-gray-300 rounded-3xl p-8 transition-all cursor-pointer"
          >
            <div className="flex items-center gap-8">
              <div className="w-24 h-24 overflow-hidden flex-shrink-0 rounded-2xl">
                <img 
                  src={apt.image} 
                  alt={apt.salon} 
                  className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all" 
                />
              </div>
              
              <div className="flex-1 grid grid-cols-4 gap-8">
                <div>
                  <div className="text-xs text-gray-400 tracking-wide font-light mb-2">SERVICE</div>
                  <div className="text-sm font-light text-gray-900 mb-1">{apt.service}</div>
                  <div className="text-xs text-gray-400 font-light">{apt.salon}</div>
                </div>

                <div>
                  <div className="text-xs text-gray-400 tracking-wide font-light mb-2">DATE</div>
                  <div className="text-sm font-light text-gray-900 mb-1">
                    {new Date(apt.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                  </div>
                  <div className="text-xs text-gray-400 font-light">{apt.time}</div>
                </div>

                <div>
                  <div className="text-xs text-gray-400 tracking-wide font-light mb-2">PROFESSIONNEL</div>
                  <div className="text-sm font-light text-gray-900 mb-1">{apt.professional}</div>
                  <div className="text-xs text-gray-400 font-light">{apt.price} MAD</div>
                </div>

                <div className="flex items-center justify-end gap-4">
                  <div className={`px-3 py-1 text-xs font-light tracking-wide rounded-full ${
                    apt.status === 'confirmed' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                    apt.status === 'completed' ? 'bg-gray-900 text-white border border border-[#0000001c]' :
                    'bg-rose-50 text-rose-700 border border-rose-100'
                  }`}>
                    {getStatusText(apt.status)}
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-900 transition-colors" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AppointmentsTab;