import React, { useState } from 'react';
import { X, ChevronLeft, ChevronRight, Star } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';

interface ModalFiltersProps {
  open: boolean;
  filterValues: {
    availability: string;
    selectedDate: Date | null;
    selectedTime: string | null;
    rating: number | null;
    bestPro: boolean;
  };
  setFilterValues: (values: any) => void;
  onClose: () => void;
}

const timeSlots = [
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
  '16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00', '19:30', '20:00'
];

export default function ModalFilters({ open, filterValues, setFilterValues, onClose }: ModalFiltersProps) {
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  if (!open) return null;

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    return { daysInMonth, startingDayOfWeek, year, month };
  };

  const { daysInMonth, startingDayOfWeek, year, month } = getDaysInMonth(currentMonth);
  
  const monthNames = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 
                      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
  const dayNames = ['lu', 'ma', 'me', 'je', 've', 'sa', 'di'];

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const handleDateSelect = (day: number) => {
    const selected = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    setFilterValues({ ...filterValues, selectedDate: selected, availability: 'choose' });
  };

  const isToday = (day: number) => {
    const today = new Date();
    return today.getDate() === day && 
           today.getMonth() === currentMonth.getMonth() && 
           today.getFullYear() === currentMonth.getFullYear();
  };

  const isSelected = (day: number) => {
    if (!filterValues.selectedDate) return false;
    const selected = filterValues.selectedDate;
    return selected.getDate() === day && 
           selected.getMonth() === currentMonth.getMonth() && 
           selected.getFullYear() === currentMonth.getFullYear();
  };

  const isPastDate = (day: number) => {
    const today = new Date();
    const checkDate = new Date(year, month, day);
    today.setHours(0, 0, 0, 0);
    checkDate.setHours(0, 0, 0, 0);
    return checkDate < today;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-0 md:p-4 overflow-x-hidden">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-full md:max-w-3xl max-h-[100vh] md:max-h-[70vh] overflow-y-auto relative flex flex-col md:block">
        <button
          className="absolute top-2 right-2 md:top-4 md:right-4 p-2 hover:bg-gray-50 rounded-full transition-all z-10"
          onClick={onClose}
          aria-label="Fermer"
        >
          <X className="w-5 h-5 text-gray-600" />
        </button>

        <div className="p-2 md:p-6 flex flex-col md:flex-row gap-2 md:gap-8 h-full w-full max-w-full">
          {/* Left Side: Filters */}
          <div className="flex-1 flex flex-col justify-between min-w-0 w-full md:min-w-[300px] md:w-auto">
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-6">Disponibilités</h2>

              {/* Availability Radio Options */}
              <div className="space-y-3 mb-6">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className="relative">
                    <input
                      type="radio"
                      name="availability"
                      checked={filterValues.availability === 'anytime'}
                      onChange={() => setFilterValues({ ...filterValues, availability: 'anytime', selectedDate: null })}
                      className="w-5 h-5 appearance-none border-2 border-gray-300 rounded-full cursor-pointer checked:border-black checked:border-[6px] transition-all"
                    />
                  </div>
                  <span className="text-sm text-gray-700">À tout moment</span>
                </label>
                
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className="relative">
                    <input
                      type="radio"
                      name="availability"
                      checked={filterValues.availability === 'today'}
                      onChange={() => setFilterValues({ ...filterValues, availability: 'today', selectedDate: new Date() })}
                      className="w-5 h-5 appearance-none border-2 border-gray-300 rounded-full cursor-pointer checked:border-black checked:border-[6px] transition-all"
                    />
                  </div>
                  <span className="text-sm text-gray-700">Aujourd'hui</span>
                </label>
                
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className="relative">
                    <input
                      type="radio"
                      name="availability"
                      checked={filterValues.availability === 'tomorrow'}
                      onChange={() => {
                        const tomorrow = new Date();
                        tomorrow.setDate(tomorrow.getDate() + 1);
                        setFilterValues({ ...filterValues, availability: 'tomorrow', selectedDate: tomorrow });
                      }}
                      className="w-5 h-5 appearance-none border-2 border-gray-300 rounded-full cursor-pointer checked:border-black checked:border-[6px] transition-all"
                    />
                  </div>
                  <span className="text-sm text-gray-700">Demain</span>
                </label>
                
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className="relative">
                    <input
                      type="radio"
                      name="availability"
                      checked={filterValues.availability === 'choose'}
                      onChange={() => setFilterValues({ ...filterValues, availability: 'choose' })}
                      className="w-5 h-5 appearance-none border-2 border-gray-300 rounded-full cursor-pointer checked:border-black checked:border-[6px] transition-all"
                    />
                  </div>
                  <span className="text-sm text-gray-700">Choisir une date</span>
                </label>
              </div>

              {/* Time Picker Section */}
              {(filterValues.selectedDate || filterValues.availability === 'today' || filterValues.availability === 'tomorrow') && (
                <div className="border-t border-gray-100 pt-6 mb-6">
                  <button
                    onClick={() => setShowTimePicker(!showTimePicker)}
                    className="w-full flex items-center justify-between text-sm text-gray-700 font-normal mb-3 hover:text-gray-900 transition-colors"
                  >
                    <span>Heure</span>
                    {filterValues.selectedTime && (
                      <span className="text-gray-900 font-medium">{filterValues.selectedTime}</span>
                    )}
                  </button>
                  
                  {showTimePicker && (
                    <div className="grid grid-cols-4 gap-2 max-h-52 overflow-y-auto p-3 bg-gray-50 rounded-xl">
                      {timeSlots.map(time => (
                        <button
                          key={time}
                          onClick={() => {
                            setFilterValues({ ...filterValues, selectedTime: time });
                            setShowTimePicker(false);
                          }}
                          className={`px-3 py-2.5 text-xs rounded-lg font-medium transition-all
                            ${filterValues.selectedTime === time 
                              ? 'bg-black text-white shadow-sm' 
                              : 'bg-white hover:bg-gray-100 text-gray-700 border border-gray-200'}`}
                        >
                          {time}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Rating Filter */}
              <div className="border-t border-gray-100 pt-6 mb-6">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-gray-700 font-normal">Notation minimale</span>
                </div>
                <div className="flex gap-2">
                  {[5, 4, 3, 2, 1].map(rating => (
                    <button
                      key={rating}
                      onClick={() => setFilterValues({ 
                        ...filterValues, 
                        rating: filterValues.rating === rating ? null : rating 
                      })}
                      className={`flex items-center gap-1.5 px-4 py-1 rounded-full border transition-all
                        ${filterValues.rating === rating 
                          ? 'bg-black text-white border-black' 
                          : 'bg-white hover:bg-gray-50 text-gray-700 border-gray-200'}`}
                    >
                      <Star className={`w-4 h-4 ${filterValues.rating === rating ? 'fill-white' : 'fill-gray-400'}`} />
                      <span className="text-sm font-medium">{rating}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Best Pro Filter */}
              <div className="border-t border-gray-100 pt-6 mb-6">
                <label className="flex items-start gap-3 cursor-pointer group">
                  <Checkbox
                    checked={filterValues.bestPro}
                    onCheckedChange={checked => setFilterValues({ ...filterValues, bestPro: !!checked })}
                    className="mt-0.5 border rounded-full w-4 h-4" 
                  />
                  <span className="text-sm text-gray-700">
                    Afficher en premier les professionnels avec les meilleures avis
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* Right Side: Calendar */}
          <div className="flex-1 flex flex-col items-center justify-center min-w-0 w-full md:min-w-[340px] md:max-w-[400px] md:w-auto">
            {/* Calendar Section (divider removed) */}
            <div className="w-full mt-2 md:mt-8 overflow-x-auto md:overflow-x-visible">
              <div className="flex items-center justify-between mb-5">
                <button 
                  onClick={handlePrevMonth} 
                  className="p-1.5 hover:bg-gray-50 rounded-lg transition-all"
                >
                  <ChevronLeft className="w-5 h-5 text-gray-700" />
                </button>
                <h3 className="text-sm font-medium text-gray-900">
                  {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                </h3>
                <button 
                  onClick={handleNextMonth} 
                  className="p-1.5 hover:bg-gray-50 rounded-lg transition-all"
                >
                  <ChevronRight className="w-5 h-5 text-gray-700" />
                </button>
              </div>

              <div className="grid grid-cols-7 gap-1 mb-3">
                {dayNames.map(day => (
                  <div key={day} className="text-center text-xs text-gray-500 font-normal py-2">
                    {day}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: startingDayOfWeek === 0 ? 6 : startingDayOfWeek - 1 }).map((_, i) => (
                  <div key={`empty-${i}`} className="aspect-square" />
                ))}
                
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1;
                  const today = isToday(day);
                  const selected = isSelected(day);
                  const past = isPastDate(day);
                  
                  return (
                    <button
                      key={day}
                      onClick={() => !past && handleDateSelect(day)}
                      disabled={past}
                      className={`aspect-square flex items-center justify-center text-sm rounded-full transition-all
                        ${selected ? 'bg-black text-white font-medium' : ''}
                        ${today && !selected ? 'border-2 border-black text-gray-900 font-medium' : ''}
                        ${!selected && !today && !past ? 'text-gray-700 hover:bg-gray-100' : ''}
                        ${past ? 'text-gray-300 cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col md:flex-row gap-2 md:gap-3 pt-2 w-full mt-4">
              <button
                onClick={() => setFilterValues({ 
                  availability: 'anytime', 
                  selectedDate: null, 
                  selectedTime: null,
                  rating: null,
                  bestPro: false
                })}
                className="flex-1 py-3 rounded-full text-sm font-medium text-gray-700 hover:bg-gray-50 border border-gray-200 transition-all"
              >
                Réinitialiser
              </button>
              <button
                onClick={onClose}
                className="flex-1 py-3 rounded-full bg-black text-white text-sm font-medium hover:bg-gray-800 transition-all shadow-sm"
              >
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}