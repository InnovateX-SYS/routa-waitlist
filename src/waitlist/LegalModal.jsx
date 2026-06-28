import React from "react";

// Generic legal-document modal. Renders a verbatim legal document with
// automatic numbering: sections are 1, 2, 3 … and clauses are x.1, x.2 …
// `bullets` on a clause render as un-numbered sub-points.
const LegalModal = ({ open, onClose, title, effectiveDate, preamble = [], sections = [], closing, agreed, onAgreeChange, agreeLabel }) => {
  if (!open) return null;

  const showAgree = typeof onAgreeChange === "function";
  const checkboxId = `agree-${(title || "doc").replace(/\s+/g, "-").toLowerCase()}`;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center px-4 py-6 sm:py-10">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className="relative bg-white rounded-[24px] w-full max-w-[760px] max-h-[88vh] flex flex-col shadow-2xl overflow-hidden"
        style={{ animation: "modalIn 0.3s cubic-bezier(0.34,1.56,0.64,1) forwards" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-4 px-6 sm:px-8 py-5 border-b border-[#E5E5E5]">
          <h2 className="text-[#232323] font-bold text-[18px] sm:text-[22px]">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="flex items-center justify-center w-[40px] h-[40px] rounded-[10px] border-2 border-[#6B6EF5] flex-shrink-0 transition-colors hover:bg-[#f5f5ff]"
            aria-label="Close"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6l12 12" stroke="#6B6EF5" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto px-6 sm:px-8 py-6 text-[#444] text-[14px] sm:text-[15px] leading-relaxed">
          {effectiveDate && (
            <p className="text-[#666] mb-5">
              <span className="font-semibold text-[#232323]">Effective Date:</span>{" "}
              {effectiveDate}
            </p>
          )}

          {preamble.map((para, i) => (
            <p key={i} className="mb-4">{para}</p>
          ))}

          {sections.map((section, si) => (
            <div key={si} className="mb-6">
              <h3 className="text-[#232323] font-bold text-[16px] sm:text-[17px] mb-3">
                {si + 1}. {section.title}
              </h3>
              <div className="flex flex-col gap-3 pl-1">
                {section.items.map((item, ii) => (
                  <div key={ii}>
                    <p className="flex gap-2">
                      <span className="text-[#6B6EF5] font-semibold flex-shrink-0">
                        {si + 1}.{ii + 1}
                      </span>
                      <span>{item.text}</span>
                    </p>
                    {item.bullets && (
                      <ul className="list-disc pl-10 mt-2 flex flex-col gap-1.5 marker:text-[#6B6EF5]">
                        {item.bullets.map((b, bi) => (
                          <li key={bi}>{b}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}

          {closing && <p className="mt-4 font-medium text-[#232323]">{closing}</p>}
        </div>

        {/* Footer */}
        <div className="px-6 sm:px-8 py-4 border-t border-[#E5E5E5] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          {showAgree ? (
            <div className="flex items-start gap-3">
              <input
                id={checkboxId}
                type="checkbox"
                checked={!!agreed}
                onChange={(e) => onAgreeChange(e.target.checked)}
                className="mt-[2px] w-[18px] h-[18px] accent-[#6B6EF5] flex-shrink-0 cursor-pointer"
              />
              <label htmlFor={checkboxId} className="text-[13px] sm:text-[14px] text-[#4a4a4a] leading-snug cursor-pointer">
                {agreeLabel || `I have read and agree to the ${title}.`}
              </label>
            </div>
          ) : (
            <span />
          )}
          <button
            onClick={onClose}
            className="bg-[#6B6EF5] text-white h-[44px] px-8 rounded-full font-bold text-[15px] transition-all duration-200 hover:bg-[#5557e0] hover:scale-105 active:scale-95 self-end sm:self-auto"
          >
            {showAgree && agreed ? "Done" : "Close"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LegalModal;
