export function calculateBusinessStatus(businessHours: any, now: Date = new Date()): string {
  const currentDay = now.getDay();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const currentTime = currentHour * 60 + currentMinute;

  const dayMap: { [key: number]: string } = {
    0: 'Dimanche', 1: 'Lundi', 2: 'Mardi', 3: 'Mercredi',
    4: 'Jeudi', 5: 'Vendredi', 6: 'Samedi',
  };

  let schedules = businessHours?.schedules || [];

  if (schedules.length === 0) {
    schedules = [
      { day: 'Lundi', isOpen: true, openTime: '09:00', closeTime: '19:00' },
      { day: 'Mardi', isOpen: true, openTime: '09:00', closeTime: '19:00' },
      { day: 'Mercredi', isOpen: true, openTime: '09:00', closeTime: '19:00' },
      { day: 'Jeudi', isOpen: true, openTime: '09:00', closeTime: '19:00' },
      { day: 'Vendredi', isOpen: true, openTime: '09:00', closeTime: '19:00' },
      { day: 'Samedi', isOpen: true, openTime: '09:00', closeTime: '19:00' },
      { day: 'Dimanche', isOpen: false },
    ];
  }

  const todayDayName = dayMap[currentDay];
  const todaySchedule = schedules.find((s: any) => s.day === todayDayName);

  if (todaySchedule && todaySchedule.isOpen) {
    const openTime = todaySchedule.openTime || '09:00';
    const closeTime = todaySchedule.closeTime || '18:00';
    const [openHour, openMin] = openTime.split(':').map(Number);
    const [closeHourN, closeMinN] = closeTime.split(':').map(Number);
    const openTimeMinutes = openHour * 60 + openMin;
    const closeTimeMinutes = closeHourN * 60 + closeMinN;
    if (currentTime >= openTimeMinutes && currentTime < closeTimeMinutes) {
      const timeStr = currentHour.toString().padStart(2, '0') + ':' + currentMinute.toString().padStart(2, '0');
      return 'Ouvert · ' + timeStr;
    } else if (currentTime < openTimeMinutes) {
      return 'Fermé · Ouvre à ' + openTime;
    } else {
      return 'Fermé à ' + closeTime.split(':')[0];
    }
  } else {
    for (let i = 1; i <= 7; i++) {
      const checkDay = (currentDay - i + 7) % 7;
      const checkSchedule = schedules.find((s: any) => s.day === dayMap[checkDay]);
      if (checkSchedule && checkSchedule.isOpen && checkSchedule.closeTime) {
        return 'Fermé à ' + checkSchedule.closeTime.split(':')[0];
      }
    }
    return 'Fermé';
  }
}

