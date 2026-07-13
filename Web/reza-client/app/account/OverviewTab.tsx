import { Calendar, Users, Gift, Heart, ChevronRight, Bell, Check } from 'lucide-react';
import React from 'react';
import { useRouter } from 'next/navigation';
import { formatMoroccoDate, formatMoroccoDateTime, getImageUrl } from '../../lib/utils';

type OverviewTabProps = {
  userData: any;
  familyMembers: any[];
  appointments: any[];
  favoritesCount: number;
  notifications?: any[];
  unreadNotificationsCount?: number;
  setActiveTab: (tab: string) => void;
  onMarkNotificationAsRead: (id: string) => void;
};

const OverviewTab = ({ userData, familyMembers, appointments, favoritesCount, notifications = [], unreadNotificationsCount = 0, setActiveTab, onMarkNotificationAsRead }: OverviewTabProps) => {
  const router = useRouter();
  
  // Debug: Log notifications to verify they're being passed
  console.log('[OverviewTab] Received notifications:', notifications);
  console.log('[OverviewTab] Unread count:', unreadNotificationsCount);
  
  return (
  <div className="space-y-8 sm:space-y-10 lg:space-y-12 animate-fadeIn">
    {/* Stats Grid */}
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
      <div className="group relative overflow-hidden bg-[#f5f7f3] p-4 sm:p-6 lg:p-8 border border-gray-200 hover:border-gray-300 transition-all rounded-xl sm:rounded-2xl">
        <div className="absolute top-0 right-0 w-32 h-32 opacity-0 group-hover:opacity-100 transition-opacity"></div>
        <div className="relative">
          <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500 mb-2 sm:mb-3 lg:mb-4" />
          <div className="text-2xl sm:text-3xl font-extralight text-gray-900 mb-1">{userData.totalBookings}</div>
          <div className="text-[10px] sm:text-xs text-gray-400 tracking-wide uppercase">Réservations</div>
        </div>
      </div>

      <div className="group relative overflow-hidden bg-[#f5f7f3] p-4 sm:p-6 lg:p-8 border border-gray-200 hover:border-gray-300 transition-all rounded-xl sm:rounded-2xl">
        <div className="absolute top-0 right-0 w-32 h-32 opacity-0 group-hover:opacity-100 transition-opacity"></div>
        <div className="relative">
          <Users className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500 mb-2 sm:mb-3 lg:mb-4" />
          <div className="text-2xl sm:text-3xl font-extralight text-gray-900 mb-1">{familyMembers.length}</div>
          <div className="text-[10px] sm:text-xs text-gray-400 tracking-wide uppercase">Proches</div>
        </div>
      </div>

      <div className="group relative overflow-visible bg-[#f5f7f3] p-4 sm:p-6 lg:p-8 border border-gray-200 hover:border-gray-300 transition-all rounded-xl sm:rounded-2xl">
        {/* Badge "Bientôt" for Mes récompenses, ensure it's above and outside the border */}
        <span
          className="absolute top-1 -right-1 bg-[#8b7260] text-white text-[8px] sm:text-[10px] px-1.5 sm:px-2 py-0.5 rounded-full font-semibold z-30 opacity-90 pointer-events-none"
          style={{ transform: 'rotate(18deg)' }}
        >
          Bientôt
        </span>
        <div className="absolute top-0 right-0 w-32 h-32 opacity-0 group-hover:opacity-100 transition-opacity"></div>
        <div className="relative">
          <Gift className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500 mb-2 sm:mb-3 lg:mb-4" />
          <div className="text-2xl sm:text-3xl font-extralight text-gray-900 mb-1">0</div>
          <div className="text-[10px] sm:text-xs text-gray-400 tracking-wide uppercase">Points Fidélité</div>
        </div>
      </div>

      <div className="group relative overflow-hidden bg-[#f5f7f3] p-4 sm:p-6 lg:p-8 border border-gray-200 hover:border-gray-300 transition-all rounded-xl sm:rounded-2xl">
        <div className="absolute top-0 right-0 w-32 h-32 opacity-0 group-hover:opacity-100 transition-opacity"></div>
        <div className="relative">
          <Heart className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500 mb-2 sm:mb-3 lg:mb-4" />
          <div className="text-2xl sm:text-3xl font-extralight text-gray-900 mb-1">{favoritesCount || 0}</div>
          <div className="text-[10px] sm:text-xs text-gray-400 tracking-wide uppercase">Favoris</div>
        </div>
      </div>
    </div>

    {/* Quick Actions */}
    <div>
      <h3 className="text-xs text-gray-400 tracking-widest uppercase mb-4 sm:mb-6">Actions Rapides</h3>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <button 
          onClick={() => router.push('/search-results')}
          className="group p-4 sm:p-5 lg:p-6 bg-[#f5f7f3] border border-gray-200 hover:border-gray-300 transition-all text-left rounded-xl sm:rounded-2xl cursor-pointer"
        >
          <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-gray-400 group-hover:text-gray-900 mb-2 sm:mb-3 transition-colors" />
          <div className="text-sm font-light text-gray-900 mb-1">Nouveau rendez-vous</div>
          <div className="text-xs text-gray-400">Réserver maintenant</div>
        </button>

        <button 
          onClick={() => setActiveTab('family')}
          className="group p-4 sm:p-5 lg:p-6 bg-[#f5f7f3] border border-gray-200 hover:border-gray-300 transition-all text-left rounded-xl sm:rounded-2xl"
        >
          <Users className="w-5 h-5 sm:w-6 sm:h-6 text-gray-400 group-hover:text-gray-900 mb-2 sm:mb-3 transition-colors" />
          <div className="text-sm font-light text-gray-900 mb-1">Ajouter un proche</div>
          <div className="text-xs text-gray-400">Gérer les comptes</div>
        </button>

        <button className="group relative overflow-visible p-4 sm:p-5 lg:p-6 bg-[#f5f7f3] border border-gray-200 hover:border-gray-300 transition-all text-left rounded-xl sm:rounded-2xl">
          {/* Badge "Bientôt" for Mes récompenses quick action, ensure it's above and outside the border */}
          <span
            className="absolute top-1 -right-1 bg-[#8b7260] text-white text-[10px] px-2 py-0.5 rounded-full font-semibold z-30 opacity-90 pointer-events-none"
            style={{ transform: 'rotate(18deg)' }}
          >
            Bientôt
          </span>
          <Gift className="w-5 h-5 sm:w-6 sm:h-6 text-gray-400 group-hover:text-gray-900 mb-2 sm:mb-3 transition-colors" />
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
            onClick={() => setActiveTab('appointments')}
          >
            <div className="w-20 h-20 overflow-hidden">
              <img 
                src={getImageUrl(apt.image) || 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800&q=80'} 
                alt={apt.salon} 
                className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800&q=80';
                }}
              />
            </div>
            <div className="flex-1">
              <div className="text-sm font-light text-gray-900 mb-1">{apt.service}</div>
              <div className="text-xs text-gray-400">{apt.salon}</div>
            </div>
            <div className="text-right">
              <div className="text-sm font-light text-gray-900 mb-1">
                {formatMoroccoDate(apt.date, { day: 'numeric', month: 'short' })}
              </div>
              <div className="text-xs text-gray-400">{apt.time}</div>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-900 transition-colors" />
          </div>
        ))}
      </div>
    </div>

    {/* Notifications Section */}
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h3 className="text-xs text-gray-400 tracking-widest uppercase">Notifications</h3>
          {unreadNotificationsCount > 0 && (
            <span className="bg-[#8b7260] text-white text-[10px] px-2 py-0.5 rounded-full font-semibold">
              {unreadNotificationsCount} nouveau{unreadNotificationsCount > 1 ? 'x' : ''}
            </span>
          )}
        </div>
      </div>
      
      {notifications && notifications.length > 0 ? (
        <div className="space-y-3">
          {notifications.slice(0, 5).map((notification: any) => (
            <div 
              key={notification.id}
              className={`group flex items-start gap-4 p-6 bg-[#f5f7f3] border transition-all rounded-2xl ${
                !notification.isRead 
                  ? 'border-[#8b7260] border-2 bg-[#faf8f6]' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                !notification.isRead ? 'bg-[#8b7260]' : 'bg-gray-200'
              }`}>
                <Bell className={`w-5 h-5 ${!notification.isRead ? 'text-white' : 'text-gray-400'}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-900 mb-1">{notification.title}</div>
                <div className="text-xs text-gray-600 mb-2">{notification.message}</div>
                <div className="text-xs text-gray-400">
                  {formatMoroccoDateTime(notification.createdAt, {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
              </div>
              {!notification.isRead && onMarkNotificationAsRead && (
                <button
                  onClick={() => onMarkNotificationAsRead(notification.id)}
                  className="flex-shrink-0 p-2 text-gray-400 hover:text-[#8b7260] transition-colors"
                  title="Marquer comme lu"
                >
                  <Check className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-gray-400 text-sm">
          <Bell className="w-8 h-8 mx-auto mb-3 text-gray-300" />
          <p>Aucune notification pour le moment</p>
        </div>
      )}
    </div>
  </div>
  );
};

export default OverviewTab;