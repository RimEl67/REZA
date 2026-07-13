import React from 'react';

const LuxuryLoadingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-transparent flex items-center justify-center overflow-hidden">
      <div className="content">
        <div className="svg-container">
          <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 667 667" width="80%" height="80%">
            <rect className="bg-path" width="667" height="667" fill="#000" />
            <text
              className="letter-r"
              x="200"
              y="420"
              textAnchor="middle"
              fontFamily="Georgia, 'Times New Roman', serif"
              fontSize="260"
              fontWeight="600"
              fill="#F3F3F3"
            >
              R
            </text>
            <text
              className="letter-z"
              x="460"
              y="420"
              textAnchor="middle"
              fontFamily="Georgia, 'Times New Roman', serif"
              fontSize="260"
              fontWeight="600"
              fill="#F2F2F2"
            >
              Z
            </text>
          </svg>
        </div>
      </div>

      <style jsx>{`
        .content {
          width: 20vmin;
          height: 20vmin;
          position: relative;
          animation: gentle-float 3s ease-in-out infinite;
        }

        .svg-container {
          width: 100%;
          height: 100%;
        }

        .svg-container svg {
          width: 70%;
          height: 70%;
        }

        .bg-path {
          animation: fill-in 0.6s ease-out forwards;
          opacity: 0;
        }

        .letter-r,
        .letter-z {
          opacity: 0;
          fill: transparent;
          stroke: #F3F3F3;
          stroke-width: 2;
        }

        .letter-r {
          animation: draw-letter 0.9s ease-out 0.3s forwards, fill-letter 0.5s ease-out 1.1s forwards;
        }

        .letter-z {
          animation: draw-letter 0.9s ease-out 0.7s forwards, fill-letter 0.5s ease-out 1.5s forwards;
        }

        @keyframes gentle-float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }

        @keyframes fill-in {
          to { opacity: 1; }
        }

        @keyframes draw-letter {
          to { opacity: 1; stroke-dashoffset: 0; }
        }

        @keyframes fill-letter {
          0% { fill: transparent; }
          100% { fill: #F3F3F3; stroke-width: 0; }
        }
      `}</style>
    </div>
  );
};

export default LuxuryLoadingPage;
