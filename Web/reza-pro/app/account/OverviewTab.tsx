import { Calendar, Users, Gift, Heart, ChevronRight } from 'lucide-react';
import React from 'react';

const OverviewTab = ({ userData, familyMembers, appointments, setActiveTab }) => (
  <div className="space-y-12 animate-fadeIn">
    {/* Stats Grid */}
    <div className="grid grid-cols-4 gap-6">
      <div className="group relative overflow-hidden bg-[#f5f7f3] p-8 border border-gray-200 hover:border-gray-300 transition-all rounded-2xl">
        <div className="absolute top-0 right-0 w-32 h-32 opacity-0 group-hover:opacity-100 transition-opacity"></div>
        <div className="relative">
          <Calendar className="w-5 h-5 text-gray-500 mb-4" />
          <div className="text-3xl font-extralight text-gray-900 mb-1">{userData.totalBookings}</div>
          <div className="text-xs text-gray-400 tracking-wide uppercase">Réservations</div>
        </div>
      </div>

      <div className="group relative overflow-hidden bg-[#f5f7f3] p-8 border border-gray-200 hover:border-gray-300 transition-all rounded-2xl">
        <div className="absolute top-0 right-0 w-32 h-32 opacity-0 group-hover:opacity-100 transition-opacity"></div>
        <div className="relative">
          <Users className="w-5 h-5 text-gray-500 mb-4" />
          <div className="text-3xl font-extralight text-gray-900 mb-1">{familyMembers.length}</div>
          <div className="text-xs text-gray-400 tracking-wide uppercase">Proches</div>
        </div>
      </div>

      <div className="group relative overflow-visible bg-[#f5f7f3] p-8 border border-gray-200 hover:border-gray-300 transition-all rounded-2xl">
        {/* Badge "Bientôt" for Mes récompenses, ensure it's above and outside the border */}
        <span
          className="absolute top-1 -right-1 bg-[#8b7260] text-white text-[10px] px-2 py-0.5 rounded-full font-semibold z-30 opacity-90 pointer-events-none"
          style={{ transform: 'rotate(18deg)' }}
        >
          Bientôt
        </span>
        <div className="absolute top-0 right-0 w-32 h-32 opacity-0 group-hover:opacity-100 transition-opacity"></div>
        <div className="relative">
          <Gift className="w-5 h-5 text-gray-500 mb-4" />
          <div className="text-3xl font-extralight text-gray-900 mb-1">0</div>
          <div className="text-xs text-gray-400 tracking-wide uppercase">Points Fidélité</div>
        </div>
      </div>

      <div className="group relative overflow-hidden bg-[#f5f7f3] p-8 border border-gray-200 hover:border-gray-300 transition-all rounded-2xl">
        <div className="absolute top-0 right-0 w-32 h-32 opacity-0 group-hover:opacity-100 transition-opacity"></div>
        <div className="relative">
          <Heart className="w-5 h-5 text-gray-500 mb-4" />
          <div className="text-3xl font-extralight text-gray-900 mb-1">8</div>
          <div className="text-xs text-gray-400 tracking-wide uppercase">Favoris</div>
        </div>
      </div>
    </div>

    {/* Quick Actions */}
    <div>
      <h3 className="text-xs text-gray-400 tracking-widest uppercase mb-6">Actions Rapides</h3>
      <div className="grid grid-cols-3 gap-4">
        <button className="group p-6 bg-[#f5f7f3] border border-gray-200 hover:border-gray-300 transition-all text-left rounded-2xl">
          <Calendar className="w-6 h-6 text-gray-400 group-hover:text-gray-900 mb-3 transition-colors" />
          <div className="text-sm font-light text-gray-900 mb-1">Nouveau rendez-vous</div>
          <div className="text-xs text-gray-400">Réserver maintenant</div>
        </button>

        <button 
          onClick={() => setActiveTab('family')}
          className="group p-6 bg-[#f5f7f3] border border-gray-200 hover:border-gray-300 transition-all text-left rounded-2xl"
        >
          <Users className="w-6 h-6 text-gray-400 group-hover:text-gray-900 mb-3 transition-colors" />
          <div className="text-sm font-light text-gray-900 mb-1">Ajouter un proche</div>
          <div className="text-xs text-gray-400">Gérer les comptes</div>
        </button>

        <button className="group relative overflow-visible p-6 bg-[#f5f7f3] border border-gray-200 hover:border-gray-300 transition-all text-left rounded-2xl">
          {/* Badge "Bientôt" for Mes récompenses quick action, ensure it's above and outside the border */}
          <span
            className="absolute top-1 -right-1 bg-[#8b7260] text-white text-[10px] px-2 py-0.5 rounded-full font-semibold z-30 opacity-90 pointer-events-none"
            style={{ transform: 'rotate(18deg)' }}
          >
            Bientôt
          </span>
          <Gift className="w-6 h-6 text-gray-400 group-hover:text-gray-900 mb-3 transition-colors" />
          <div className="text-sm font-light text-gray-900 mb-1">Mes récompenses</div>
          <div className="text-xs text-gray-400">Voir les offres</div>
        </button>
      </div>
    </div>

    {/* Upcoming Appointments Preview */}
    <div>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xs text-gray-400 tracking-widest uppercase mb-4">Prochains Rendez-vous</h3>
        <button 
          onClick={() => setActiveTab('appointments')}
          className="text-xs text-gray-900 hover:text-[#8b7260] tracking-wide flex items-center gap-1"
        >
          Tout voir
          <ChevronRight className="w-3 h-3" />
        </button>
      </div>
      
      <div className="space-y-3">
        {appointments.filter(a => a.status === 'confirmed').slice(0, 2).map((apt) => (
          <div 
            key={apt.id} 
            className="group flex items-center gap-6 p-6 bg-[#f5f7f3] border border-gray-200 hover:border-gray-300 transition-all rounded-2xl cursor-pointer"
            onClick={() => setActiveTab('appointments', apt.id)}
          >
            <div className="w-20 h-20 overflow-hidden">
              <img src={apt.image} alt={apt.salon} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all" />
            </div>
            <div className="flex-1">
              <div className="text-sm font-light text-gray-900 mb-1">{apt.service}</div>
              <div className="text-xs text-gray-400">{apt.salon}</div>
            </div>
            <div className="text-right">
              <div className="text-sm font-light text-gray-900 mb-1">
                {new Date(apt.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
              </div>
              <div className="text-xs text-gray-400">{apt.time}</div>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-900 transition-colors" />
          </div>
        ))}
      </div>
    </div>
  </div>
);

export default OverviewTab;