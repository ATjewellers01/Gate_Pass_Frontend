import React from 'react';

const Footer = ({ isFixed = true }) => {
  return (
    <div
      className={`${
        isFixed ? 'fixed bottom-0 left-0 right-0' : 'w-full mt-auto'
      } z-50`}
      style={{
        background: 'rgba(255,255,255,0.85)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderTop: '1px solid rgba(186, 230, 253, 0.5)',
      }}
    >
      <div className="flex items-center justify-center gap-2 py-2.5 px-4">
        <span className="text-xs text-slate-400 font-medium tracking-wide">
          Powered by
        </span>

        <a
          href="https://www.botivate.in/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 group"
          title="Visit Botivate"
        >
          {/* Lightning bolt SVG – Botivate's brand mark */}
          <span
            className="flex items-center justify-center w-5 h-5 rounded-md"
            style={{
              background: 'linear-gradient(135deg, #0ea5e9, #6366f1)',
            }}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              width="12"
              height="12"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M13 2L4.5 13.5H11L10 22L19.5 10.5H13L13 2Z"
                fill="white"
                stroke="white"
                strokeWidth="0.5"
                strokeLinejoin="round"
              />
            </svg>
          </span>

          <span
            className="text-xs font-bold tracking-tight transition-opacity duration-200 group-hover:opacity-80"
            style={{
              background: 'linear-gradient(90deg, #0ea5e9, #6366f1)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            Botivate
          </span>
        </a>
      </div>
    </div>
  );
};

export default Footer;
