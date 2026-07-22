import React from 'react';

const LuxuryLoadingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-transparent flex items-center justify-center overflow-hidden">
      <div className="content">
        <span className="font-extrabold text-[48px] tracking-wide text-[#0a0f2c]">
          REZA
        </span>
      </div>

      <style jsx>{`
        .content {
          position: relative;
          animation: gentle-float 3s ease-in-out infinite, fade-in 1s ease-out forwards;
          opacity: 0;
        }

        @keyframes fade-in {
          to { opacity: 1; }
        }

        @keyframes gentle-float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
      `}</style>
    </div>
  );
};

export default LuxuryLoadingPage;
