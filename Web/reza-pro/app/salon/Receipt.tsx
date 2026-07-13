import React from 'react';
import { X, Download } from 'lucide-react';
import html2canvas from 'html2canvas';

type Service = {
  name: string;
  duration: string;
  price?: number;
};

type TeamMember = {
  name: string;
};

type BookingData = {
  firstName: string;
  lastName: string;
  date: string;
  time: string;
  totalPrice: number;
  totalDuration: string;
  paymentMethod?: 'establishment' | 'card';
  cardNumber?: string;
};

type ReceiptProps = {
  bookingData: BookingData;
  selectedServices: Service[];
  selectedTeamMember: TeamMember | null;
  onClose: () => void;
  referenceNumber?: string;
  salonName?: string;
  clientName?: string;
  salonAddress?: string;
  salonCity?: string;
  salonPhone?: string;
};

const Receipt: React.FC<ReceiptProps> = ({
  bookingData,
  selectedServices,
  selectedTeamMember,
  onClose,
  referenceNumber,
  salonName,
  clientName,
  salonAddress,
  salonCity,
  salonPhone,
}) => {
  // Use the passed referenceNumber or fallback to timestamp
  const receiptNumber = referenceNumber || `${Date.now().toString().slice(-8)}`;
  // Use the passed salonName or fallback
  const displaySalonName = salonName || "Sallon lorem";
  const displaySalonAddress = salonAddress || "123 Avenue Mohammed V";
  const displaySalonCity = salonCity || "Casablanca, Maroc";
  const displaySalonPhone = salonPhone || "+212 522 123 456";
  // Use the passed clientName or fallback to bookingData
  const displayClientName = clientName || `${bookingData.firstName} ${bookingData.lastName}`;
  const currentDate = new Date().toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
  const currentTime = new Date().toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const handleDownload = async () => {
    const receiptElement = document.getElementById('receipt-content');
    if (!receiptElement) return;

    try {
      // Use html2canvas to capture the receipt as an image
      const canvas = await html2canvas(receiptElement, {
        backgroundColor: '#ffffff',
        scale: 2,
        logging: false,
        useCORS: true
      });

      // Convert canvas to blob and download
      canvas.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `recu-${receiptNumber}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }, 'image/png');
    } catch (error) {
      console.error('Error generating image:', error);
      alert('Erreur lors du téléchargement');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-white overflow-y-auto">
      <div className="fixed top-4 right-4 flex gap-2 z-10">
        <button
          onClick={handleDownload}
          className="flex items-center gap-2 px-3 py-2 text-black hover:text-gray-700 transition-colors"
          aria-label="Télécharger"
        >
          <Download className="w-3.5 h-3.5" />
          <span className='text-sm'>Télécharger</span>
        </button>
        <button
          onClick={onClose}
          className="px-3 py-2 text-gray-600 hover:text-black text-xs"
          aria-label="Fermer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="bg-white w-full max-w-sm mx-auto pt-0 pb-12 px-6">
        <div
          id="receipt-content"
          className="font-mono text-xs space-y-4 max-w-[320px] mx-auto text-black p-6 rounded-lg"
        >
          {/* Header */}
          <div className="text-center border-b border-black pb-3">
            <h1 className="text-lg font-bold mb-1">RZ</h1>
            <h1 className="text-sm font-bold mb-1">{displaySalonName}</h1>
            <p className="text-black">{displaySalonAddress}</p>
            <p className="text-black">{displaySalonCity}</p>
            <p className="text-black">Tel: {displaySalonPhone}</p>
          </div>

          {/* Receipt Info */}
          <div className="border-b border-black pb-3">
            <div className="flex justify-between mb-1">
              <span>RECU N°</span>
              <span>{receiptNumber}</span>
            </div>
            <div className="flex justify-between mb-1">
              <span>DATE</span>
              <span>{currentDate}</span>
            </div>
            <div className="flex justify-between">
              <span>HEURE</span>
              <span>{currentTime}</span>
            </div>
          </div>

          {/* Customer */}
          <div className="border-b border-black pb-3">
            <div className="flex justify-between mb-1">
              <span>CLIENT</span>
              <span className="text-right">{displayClientName}</span>
            </div>
            {selectedTeamMember && (
              <div className="flex justify-between">
                <span>COIFFEUR</span>
                <span>{selectedTeamMember.name}</span>
              </div>
            )}
          </div>

          {/* Appointment */}
          <div className="border-b border-black pb-3">
            <p className="mb-2 font-bold">RENDEZ-VOUS</p>
            <div className="flex justify-between mb-1">
              <span>DATE RDV</span>
              <span>
                {bookingData.date && new Date(bookingData.date).toLocaleDateString('fr-FR', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric'
                })}
              </span>
            </div>
            <div className="flex justify-between">
              <span>HEURE RDV</span>
              <span>{bookingData.time}</span>
            </div>
          </div>

          {/* Services */}
          <div className="border-b border-black pb-3">
            <p className="mb-2 font-bold">SERVICES</p>
            {selectedServices.map((service, idx) => (
              <div key={idx} className="mb-2">
                <div className="flex justify-between">
                  <span className="flex-1">{service.name}</span>
                  <span className="ml-2">{service.price}.00</span>
                </div>
                <div className="text-black text-[10px]">{service.duration}</div>
              </div>
            ))}
            <div className="flex justify-between mt-3 pt-2 border-t border-dashed border-black">
              <span>DUREE TOTALE</span>
              <span>{bookingData.totalDuration}</span>
            </div>
          </div>

          {/* Payment */}
          <div className="border-b border-black pb-3">
            <div className="flex justify-between mb-1">
              <span>PAIEMENT</span>
              <span>
                {bookingData.paymentMethod === 'card' ? 'CARTE' : 'SUR PLACE'}
              </span>
            </div>
            {bookingData.paymentMethod === 'card' && bookingData.cardNumber && (
              <div className="flex justify-between text-[10px] text-black">
                <span>CARTE N°</span>
                <span>**** **** **** {bookingData.cardNumber.slice(-4)}</span>
              </div>
            )}
            <div className="flex justify-between mt-1">
              <span>STATUT</span>
              <span>PAYE</span>
            </div>
          </div>

          {/* Total */}
          <div className="border-b-2 border-black pb-3">
            <div className="flex justify-between text-base font-bold">
              <span>TOTAL</span>
              <span>{bookingData.totalPrice}.00 MAD</span>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center text-[10px] text-black pt-2">
            <p className="mb-1">ICE: 002345678901234</p>
            <p className="mb-3">RC: 123456 - IF: 98765432</p>
            <p className="mb-1">MERCI DE VOTRE VISITE</p>
            <p>A BIENTOT</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Receipt;