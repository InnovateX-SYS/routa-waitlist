import React, { useState, useEffect, useRef } from "react";
import LegalModal from "./LegalModal";
import { termsTitle, termsEffectiveDate, termsPreamble, termsSections, termsClosing } from "./termsContent";
import { privacyTitle, privacyEffectiveDate, privacyPreamble, privacySections, privacyClosing } from "./privacyContent";

const destinations = [
  { city: "Singapore", hotels: 540, img: "/assets/explore1.png", showLabel: true },
  { city: "Paris", hotels: 950, img: "/assets/explore2.png", showLabel: true },
  { city: "London", hotels: 490, img: "/assets/explore3.png", showLabel: true },
  { city: "Rome", hotels: 350, img: "/assets/explore4.png", showLabel: true },
  { city: "Lagos", hotels: 730, img: "/assets/explore5.png", showLabel: true },
  { city: "New York", hotels: 1100, img: "/assets/explore6.png", showLabel: true },
  { city: "Bali", hotels: 410, img: "/assets/explore7.png", showLabel: true },
];

const faqs = [
  {
    question: "What is Routa?",
    answer: "Routa is an all-in-one travel platform that lets you discover destinations, plan itineraries, book flights, hotels, cabs, and experiences — all in one place.",
  },
  {
    question: "Can I book both flights and hotels on Routa?",
    answer: "Yes! Routa allows you to book flights, hotels, cabs, cruises, and experiences seamlessly within the same app with unified payment options.",
  },
  {
    question: "Do Routa accept crypto payments?",
    answer: "Yes, Routa supports crypto payments alongside traditional payment methods, giving you full flexibility on how you pay for your travel.",
  },
  {
    question: "Can I invite friends or family to join a trip?",
    answer: "Absolutely. You can invite friends and family directly within the app to collaborate on trip planning, share itineraries, and book together.",
  },
  {
    question: "Can i book cabs on Routa?",
    answer: "Yes, cab booking is fully integrated into Routa so you can arrange ground transportation as part of your overall travel plan without switching apps.",
  },
];

const referralSources = [
  { value: "FRIEND_OR_FAMILY", label: "Friend or family" },
  { value: "SOCIAL_MEDIA", label: "Social media" },
  { value: "SOCIAL_MEDIA_ADS", label: "Social media ads" },
  { value: "SEARCH_ENGINE", label: "Search engine" },
  { value: "BLOG_OR_ARTICLE", label: "Blog or article" },
  { value: "OTHER", label: "Other" },
];

// Endpoint that returns the total number of people on the waitlist.
// Expected to respond with a number somewhere in the JSON, e.g.
// { count: 1234 }  |  { total: 1234 }  |  { data: { count: 1234 } }
const WAITLIST_COUNT_ENDPOINT =
  "https://routa-backend-core.vercel.app/api/v1/waitlist/count";

// Padding added on top of the real signup count so the badge looks more
// populated early on. Set to 0 to show the true number.
const WAITLIST_COUNT_BASELINE = 300;

// Pulls the first numeric value we can find from a few common shapes.
const extractCount = (data) => {
  if (typeof data === "number") return data;
  if (!data || typeof data !== "object") return null;
  const candidates = [
    data.count,
    data.total,
    data.totalCount,
    data?.data?.count,
    data?.data?.total,
    data?.data?.totalCount,
  ];
  const found = candidates.find((v) => typeof v === "number");
  return typeof found === "number" ? found : null;
};

const getCarouselSizes = () => {
  if (typeof window === "undefined") return { CARD_W: 300, FEATURED_W: 380, FEATURED_H: 460, CARD_H: 380, GAP: 40 };
  const vw = window.innerWidth;
  if (vw < 480) return { CARD_W: 160, FEATURED_W: 200, FEATURED_H: 260, CARD_H: 220, GAP: 12 };
  if (vw < 768) return { CARD_W: 220, FEATURED_W: 270, FEATURED_H: 330, CARD_H: 280, GAP: 20 };
  return { CARD_W: 300, FEATURED_W: 380, FEATURED_H: 460, CARD_H: 380, GAP: 40 };
};

const Waitlist = () => {
  const [current, setCurrent] = useState(destinations.length);
  const [openFaq, setOpenFaq] = useState(null);
  const [sizes, setSizes] = useState(getCarouselSizes());
  const [menuOpen, setMenuOpen] = useState(false);
  const [name, setName] = useState("");
  const [agencyName, setAgencyName] = useState("");
  const [webUrl, setWebUrl] = useState("");
  const [email, setEmail] = useState("");
  const [referralSource, setReferralSource] = useState("");
  const [userType, setUserType] = useState("traveller");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState(false);
  const [nameError, setNameError] = useState(false);
  const [agencyNameError, setAgencyNameError] = useState(false);
  const [webUrlError, setWebUrlError] = useState(false);
  const [sourceError, setSourceError] = useState(false);
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [agreedPrivacy, setAgreedPrivacy] = useState(false);
  const [termsError, setTermsError] = useState(false);
  const [termsOpen, setTermsOpen] = useState(false);
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  // Seed with the baseline so the badge shows immediately instead of waiting on the
  // network fetch; it updates to the real total (+ baseline) once the request resolves.
  const [waitlistCount, setWaitlistCount] = useState(WAITLIST_COUNT_BASELINE);
  const [displayCount, setDisplayCount] = useState(0);
  const intervalRef = useRef(null);
  const isResetting = useRef(false);
  const emailSectionRef = useRef(null);
  const featuresSectionRef = useRef(null);
  const exploresSectionRef = useRef(null);
  const faqSectionRef = useRef(null);

  useEffect(() => {
    const handleResize = () => setSizes(getCarouselSizes());
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setCurrent((prev) => prev + 1);
    }, 2000);
    return () => clearInterval(intervalRef.current);
  }, []);

  // Fetch the live waitlist count once on mount.
  useEffect(() => {
    let cancelled = false;
    const fetchCount = async () => {
      try {
        const res = await fetch(WAITLIST_COUNT_ENDPOINT);
        if (!res.ok) return;
        const data = await res.json();
        const count = extractCount(data);
        if (!cancelled && typeof count === "number")
          setWaitlistCount(count + WAITLIST_COUNT_BASELINE);
      } catch {
        // Silently ignore — the badge just stays hidden if the count isn't available.
      }
    };
    fetchCount();
    return () => {
      cancelled = true;
    };
  }, []);

  // Count-up animation whenever the target count changes.
  useEffect(() => {
    if (typeof waitlistCount !== "number") return;
    const start = displayCount;
    const end = waitlistCount;
    if (start === end) return;
    const duration = 1000;
    const startTime = performance.now();
    let frame;
    const tick = (now) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
      setDisplayCount(Math.round(start + (end - start) * eased));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [waitlistCount]);

  useEffect(() => {
    if (current >= destinations.length * 2) {
      setTimeout(() => {
        isResetting.current = true;
        setCurrent(destinations.length);
      }, 650);
    }
  }, [current]);

  const getTranslateX = () => {
    const { CARD_W, FEATURED_W, GAP } = sizes;
    const vw = typeof window !== "undefined" ? window.innerWidth : 1200;
    let leftEdge = 0;
    for (let i = 0; i < current; i++) {
      leftEdge += CARD_W + GAP;
    }
    const centerOffset = vw / 2 - FEATURED_W / 2;
    return -(leftEdge - centerOffset);
  };

  const scrollTo = (ref) => {
    setMenuOpen(false);
    ref.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const scrollToEmailSection = () => {
    setMenuOpen(false);
    emailSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const handleJoin = async () => {
    const isAgency = userType === "agency";
    const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    const isSourceValid = referralSource.length > 0;
    const isNameValid = isAgency ? true : name.trim().length >= 5;
    const isAgencyNameValid = isAgency ? agencyName.trim().length >= 5 : true;
    const isWebUrlValid = isAgency
      ? webUrl.trim().length >= 8 &&
        /^(https?:\/\/)?([\w-]+\.)+[\w-]{2,}(\/\S*)?$/i.test(webUrl.trim())
      : true;

    const isTermsValid = agreedTerms && agreedPrivacy;

    if (!isNameValid || !isAgencyNameValid || !isWebUrlValid || !isEmailValid || !isSourceValid || !isTermsValid) {
      setNameError(!isNameValid);
      setAgencyNameError(!isAgencyNameValid);
      setWebUrlError(!isWebUrlValid);
      setEmailError(!isEmailValid);
      setSourceError(!isSourceValid);
      setTermsError(!isTermsValid);
      emailSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      setTimeout(() => {
        setNameError(false);
        setAgencyNameError(false);
        setWebUrlError(false);
        setEmailError(false);
        setSourceError(false);
        setTermsError(false);
      }, 3000);
      return;
    }

    setLoading(true);
    setErrorMessage("");

    const endpoint = isAgency
      ? "https://routa-backend-core.vercel.app/api/v1/waitlist/agency/join"
      : "https://routa-backend-core.vercel.app/api/v1/waitlist/traveller/join";

    const payload = isAgency
      ? { agencyName: agencyName.trim(), websiteUrl: webUrl.trim(), email, referralSource }
      : { fullName: name.trim(), email, referralSource };

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok) {
        setSubmitted(true);
        // Optimistically reflect this new signup in the live count.
        setWaitlistCount((prev) => (typeof prev === "number" ? prev + 1 : prev));
      } else {
        // Backend messages can be a string or an array of validation strings.
        const backendMessage = Array.isArray(data.message)
          ? data.message[0]
          : data.message;

        let userMessage;
        if (response.status >= 500) {
          // Real server-side failure — keep it friendly, don't leak internals.
          userMessage = "Something went wrong on our end. Please try again in a moment.";
        } else {
          // Client-side issues (409 duplicate, 400 validation, etc.) — show the specifics.
          userMessage = backendMessage || "Something went wrong. Please try again.";
        }

        setErrorMessage(userMessage);
        emailSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
        setTimeout(() => setErrorMessage(""), 10000);
      }
    } catch (error) {
      setErrorMessage("Network error. Please check your connection and try again.");
      setTimeout(() => setErrorMessage(""), 10000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full h-full bg-[#FFFFFF] overflow-x-hidden">

      {/* ─── Hero Section ─── */}
      <div
        style={{
          backgroundImage: "url(/assets/waitlist-h-background.png)",
          backgroundSize: "cover",
          backgroundPosition: "center",
          minHeight: "100vh",
        }}
        className="pt-[30px] pb-[80px] rounded-[10px] px-4 sm:px-[26px]"
      >
        {/* Navbar */}
        <div className="h-auto min-h-[80px] w-full max-w-[832px] bg-white rounded-[50px] flex items-center mx-auto mb-[60px] sm:mb-[110px] px-[26px] py-3 gap-4">
          <div className="w-[104px] h-[45px] flex-shrink-0">
            <img src="/assets/routa-logo.png" alt="Routa" className="w-full h-full object-contain" />
          </div>
          <div className="flex items-center justify-end gap-3 sm:gap-[30px] ml-auto">
            {/* Desktop links */}
            <div className="hidden sm:flex items-center gap-[30px] font-medium text-[18px] text-[#232323] tracking-[0.01em] leading-none">
              <button onClick={() => scrollTo(featuresSectionRef)} className="hover:text-[#6B6EF5] transition-colors">Features</button>
              <button onClick={() => scrollTo(exploresSectionRef)} className="hover:text-[#6B6EF5] transition-colors">About</button>
              <button onClick={() => scrollTo(faqSectionRef)} className="hover:text-[#6B6EF5] transition-colors">FAQs</button>
            </div>
            {/* Join Waitlist — desktop only */}
            <button
              onClick={scrollToEmailSection}
              className="hidden sm:flex bg-[#6B6EF5] h-[54px] px-[21.5px] text-white rounded-full font-medium text-[18px] tracking-[0.01em] leading-none whitespace-nowrap items-center justify-center transition-all duration-200 hover:bg-[#5557e0] hover:scale-105 active:scale-95"
            >
              Join Waitlist
            </button>
            {/* Hamburger — mobile only */}
            <button
              className="sm:hidden flex items-center justify-center w-[44px] h-[44px] rounded-[10px] border-2 border-[#6B6EF5] flex-shrink-0"
              onClick={() => setMenuOpen((v) => !v)}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M3 6h18M3 12h18M3 18h18" stroke="#6B6EF5" strokeWidth="2.5" strokeLinecap="round"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile fullscreen menu */}
        {menuOpen && (
          <div
            className="fixed inset-0 z-50 sm:hidden flex flex-col bg-white"
            style={{ animation: "fadeIn 0.25s ease forwards" }}
          >
            {/* Top bar */}
            <div className="flex items-center justify-between px-6 pt-8 pb-6">
              <img src="/assets/routa-logo.png" alt="Routa" className="h-[35px] object-contain" />
              <button
                onClick={() => setMenuOpen(false)}
                className="flex items-center justify-center w-[44px] h-[44px] rounded-[10px] border-2 border-[#6B6EF5]"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M18 6L6 18M6 6l12 12" stroke="#6B6EF5" strokeWidth="2.5" strokeLinecap="round"/>
                </svg>
              </button>
            </div>

            {/* Links */}
            <div className="flex flex-col px-6 mt-4 flex-1">
              {[
                { label: "Features", ref: featuresSectionRef },
                { label: "Explore", ref: exploresSectionRef },
                { label: "FAQs", ref: faqSectionRef },
              ].map((item, i) => (
                <button
                  key={i}
                  onClick={() => scrollTo(item.ref)}
                  className="text-left text-[#848AFF] font-medium text-[28px] py-5 border-b border-[#E5E5E5] hover:text-[#6B6EF5] hover:pl-4 active:scale-95 transition-all duration-200"
                  style={{ animation: `linkFadeIn 0.3s ease ${i * 0.08}s both` }}
                >
                  {item.label}
                </button>
              ))}
            </div>

            {/* Bottom Join Waitlist */}
            <div className="px-6 pb-12">
              <button
                onClick={scrollToEmailSection}
                className="w-full bg-[#6B6EF5] text-white h-[60px] rounded-full font-bold text-[18px] transition-all duration-200 hover:bg-[#5557e0] active:scale-95"
              >
                Join Waitlist
              </button>
            </div>
          </div>
        )}

        {/* Hero Text */}
        <div className="w-full max-w-[993px] mx-auto flex flex-col items-center justify-center mb-[56px] px-4 text-center">
          <p className="font-bold text-[32px] sm:text-[48px] lg:text-[65px] text-[#ffffff] leading-none text-center tracking-[1.1%] mb-4">
            EVERYTHING YOU NEED TO <br className="hidden sm:block" /> PLAN BOOK AND TRAVEL
          </p>
          <p className="font-normal text-[16px] sm:text-[20px] lg:text-[24px] text-[#ffffff] tracking-[1.1%] text-center">
            Join the waitlist for a smarter way to discover destinations,{" "}
            <br className="hidden sm:block" />
            plan itineraries, and book unforgettable travel experiences.
          </p>

          {/* Live signup count */}
          {typeof waitlistCount === "number" && (
            <div
              className="mt-6 flex items-center gap-3 bg-white/15 backdrop-blur-md border border-white/25 rounded-full pl-2 pr-5 py-2"
              style={{ animation: "fadeIn 0.5s ease forwards" }}
            >
              <span className="relative flex w-3 h-3 flex-shrink-0 ml-1">
                <span className="absolute inline-flex w-full h-full rounded-full bg-[#4ADE80] opacity-75 animate-ping" />
                <span className="relative inline-flex w-3 h-3 rounded-full bg-[#22C55E]" />
              </span>
              <p className="text-white text-[15px] sm:text-[16px] font-medium tracking-[0.01em] whitespace-nowrap">
                <span className="font-bold">{displayCount.toLocaleString()}+</span>{" "}
                people have joined the waitlist
              </p>
            </div>
          )}
        </div>

        {/* Sign-up form */}
        <div
          ref={emailSectionRef}
          className="flex flex-col items-stretch bg-[#FBFBFB] rounded-[24px] px-4 py-5 w-full max-w-[574px] mx-auto gap-3 mb-[50px] transition-all duration-300"
        >
          {/* Use-type selector */}
          <div className="flex flex-col gap-2 mb-1">
            <span className="text-[#232323] text-[18px] sm:text-[20px] font-semibold text-center">
              How would you like to use Routa?
            </span>
            <div className="flex items-center gap-1 bg-[#ECECEC] rounded-full p-[3px]">
              <button
                type="button"
                onClick={() => setUserType("traveller")}
                className={`flex-1 rounded-full py-[8px] text-[14px] sm:text-[15px] font-medium transition-all duration-200 ${userType === "traveller" ? "bg-[#6B6EF5] text-white shadow-sm" : "text-[#232323] hover:text-[#6B6EF5]"}`}
              >
                Traveller
              </button>
              <button
                type="button"
                onClick={() => setUserType("agency")}
                className={`flex-1 rounded-full py-[8px] text-[14px] sm:text-[15px] font-medium transition-all duration-200 ${userType === "agency" ? "bg-[#6B6EF5] text-white shadow-sm" : "text-[#232323] hover:text-[#6B6EF5]"}`}
              >
                Agency
              </button>
            </div>
          </div>

          {userType === "agency" ? (
            <>
              <input
                type="text"
                placeholder="Agency Name"
                value={agencyName}
                onChange={(e) => setAgencyName(e.target.value)}
                className={`w-full rounded-full px-5 py-[14px] outline-none text-[#1A1A1A] text-[16px] sm:text-[18px] font-normal tracking-[1%] leading-none placeholder-[#4a4a4a] transition-colors duration-300 ${agencyNameError ? "bg-red-100 placeholder-red-400 ring-2 ring-red-400" : "bg-white border border-[#E2E2E2]"}`}
              />
              <input
                type="url"
                placeholder="Website URL"
                value={webUrl}
                onChange={(e) => setWebUrl(e.target.value)}
                className={`w-full rounded-full px-5 py-[14px] outline-none text-[#1A1A1A] text-[16px] sm:text-[18px] font-normal tracking-[1%] leading-none placeholder-[#4a4a4a] transition-colors duration-300 ${webUrlError ? "bg-red-100 placeholder-red-400 ring-2 ring-red-400" : "bg-white border border-[#E2E2E2]"}`}
              />
            </>
          ) : (
            <input
              type="text"
              placeholder="Full Name"
              value={name}
              onChange={(e) => setName(e.target.value.replace(/[0-9]/g, ""))}
              className={`w-full rounded-full px-5 py-[14px] outline-none text-[#1A1A1A] text-[16px] sm:text-[18px] font-normal tracking-[1%] leading-none placeholder-[#4a4a4a] transition-colors duration-300 ${nameError ? "bg-red-100 placeholder-red-400 ring-2 ring-red-400" : "bg-white border border-[#E2E2E2]"}`}
            />
          )}

          <input
            type="email"
            placeholder="Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={`w-full rounded-full px-5 py-[14px] outline-none text-[#1A1A1A] text-[16px] sm:text-[18px] font-normal tracking-[1%] leading-none placeholder-[#4a4a4a] transition-colors duration-300 ${emailError ? "bg-red-100 placeholder-red-400 ring-2 ring-red-400" : "bg-white border border-[#E2E2E2]"}`}
          />
          <select
            value={referralSource}
            onChange={(e) => setReferralSource(e.target.value)}
            style={{
              backgroundImage:
                "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%23232323' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E\")",
              backgroundRepeat: "no-repeat",
              backgroundPosition: "right 1.25rem center",
              backgroundSize: "1.1rem",
            }}
            className={`w-full appearance-none rounded-full pl-5 pr-12 py-[14px] outline-none text-[16px] sm:text-[18px] font-normal tracking-[1%] leading-none placeholder-[#4a4a4a] transition-colors duration-300 ${sourceError ? "bg-red-100 ring-2 ring-red-400 text-red-400" : "bg-white border border-[#E2E2E2]"} ${referralSource ? "text-[#1A1A1A]" : "text-[#4a4a4a]"}`}
          >
            <option value="" disabled>How did you hear about us?</option>
            {referralSources.map((source) => (
              <option key={source.value} value={source.value} className="text-[#1A1A1A]">
                {source.label}
              </option>
            ))}
          </select>

          {/* Terms of Use agreement */}
          <div className="flex items-start gap-3 mt-1 px-1">
            <input
              id="agreeTerms"
              type="checkbox"
              checked={agreedTerms}
              onChange={(e) => setAgreedTerms(e.target.checked)}
              className="mt-[3px] w-[18px] h-[18px] accent-[#6B6EF5] flex-shrink-0 cursor-pointer"
            />
            <label
              htmlFor="agreeTerms"
              className={`text-[13px] sm:text-[14px] leading-snug cursor-pointer transition-colors ${termsError ? "text-red-400" : "text-[#4a4a4a]"}`}
            >
              I have read and agree to the{" "}
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setTermsOpen(true);
                }}
                className="text-[#6B6EF5] font-semibold underline hover:text-[#5557e0]"
              >
                Terms of Use
              </button>
              .
            </label>
          </div>

          {/* Privacy Policy agreement */}
          <div className="flex items-start gap-3 px-1">
            <input
              id="agreePrivacy"
              type="checkbox"
              checked={agreedPrivacy}
              onChange={(e) => setAgreedPrivacy(e.target.checked)}
              className="mt-[3px] w-[18px] h-[18px] accent-[#6B6EF5] flex-shrink-0 cursor-pointer"
            />
            <label
              htmlFor="agreePrivacy"
              className={`text-[13px] sm:text-[14px] leading-snug cursor-pointer transition-colors ${termsError ? "text-red-400" : "text-[#4a4a4a]"}`}
            >
              I have read and agree to the{" "}
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setPrivacyOpen(true);
                }}
                className="text-[#6B6EF5] font-semibold underline hover:text-[#5557e0]"
              >
                Privacy Policy
              </button>
              .
            </label>
          </div>
        </div>
        {(nameError || agencyNameError || webUrlError || emailError || sourceError || termsError) && (
          <p className="text-red-400 text-[16px] text-center -mt-4 mb-4 animate-pulse">
            {nameError
              ? "Please enter your full name (at least 5 characters)."
              : agencyNameError
              ? "Please enter your agency name (at least 5 characters)."
              : webUrlError
              ? "Please enter a valid website URL (e.g. https://youragency.com)."
              : emailError
              ? "Please enter a valid email address."
              : sourceError
              ? "Please tell us how you heard about us."
              : "Please read and agree to the Terms of Use and Privacy Policy to continue."}
          </p>
        )}
        {errorMessage && (
          <p className="text-red-400 text-[16px] text-center -mt-4 mb-4">
            {errorMessage}
          </p>
        )}

        {/* CTA Button */}
        <div>
          <button
            type="button"
            onClick={handleJoin}
            disabled={loading}
            className="bg-[#FFFFFF] flex h-[50px] w-[193px] text-[#000000] items-center justify-center rounded-full font-bold text-[18px] tracking-[1%] leading-none mx-auto transition-all duration-200 hover:scale-105 hover:shadow-lg active:scale-95 disabled:opacity-70"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                </svg>
                Joining...
              </span>
            ) : "Join Waitlist"}
          </button>
        </div>
      </div>

      {/* ─── Features Section ─── */}
      <div ref={featuresSectionRef} className="w-full px-4 sm:px-[60px] py-[60px]">
        <div className="flex items-start justify-between mb-[40px] flex-wrap gap-4">
          <div className="flex flex-col gap-[16px]">
            <span className="bg-[#6B6EF5] text-white text-[18px] font-bold tracking-[0.1em] items-center justify-center w-[168px] h-[46px] uppercase -rotate-3 flex rounded-[8px]">
              All In One
            </span>
            <h2 className="text-[#6B6EF5] font-bold text-[42px] leading-tight uppercase">
              IT'S NOT MAGIC. <br />
              IT'S <span className="font-extrabold">ROUTA.</span>
            </h2>
          </div>
          <span className="text-[#6B6EF5] font-bold text-[20px] tracking-[0.15em] uppercase mt-0 sm:mt-[130px] h-[24px] flex items-center justify-center">
            FEATURES
          </span>
        </div>

        {/* Feature Images — stack on mobile, side by side on desktop */}
        <div className="flex flex-col sm:flex-row gap-[16px] mb-[16px]">
          <div className="rounded-[20px] overflow-hidden w-full sm:flex-[831]">
            <img src="/assets/booking-features-img.png" alt="Booking" className="w-full h-full object-cover aspect-[831/414]" />
          </div>
          <div className="rounded-[20px] overflow-hidden w-full sm:flex-[452]">
            <img src="/assets/planner-features-img.png" alt="Trip Planner" className="w-full h-full object-cover aspect-[452/414]" />
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-[16px]">
          <div className="rounded-[20px] overflow-hidden w-full sm:flex-[452]">
            <img src="/assets/ai-features.png" alt="AI Assistance" className="w-full h-full object-cover aspect-[452/414]" />
          </div>
          <div className="rounded-[20px] overflow-hidden w-full sm:flex-[831]">
            <img src="/assets/communitity-features.png" alt="Community" className="w-full h-full object-cover aspect-[831/414]" />
          </div>
        </div>
      </div>

      {/* ─── Explore / Places Section ─── */}
      <div ref={exploresSectionRef} className="w-full py-[60px]">
        <div className="flex items-start justify-between px-4 sm:px-[60px] mb-[60px] sm:mb-[127px] flex-wrap gap-4">
          <div className="flex flex-col gap-[16px]">
            <span className="bg-[#6B6EF5] text-white text-[18px] font-bold tracking-[0.1em] items-center justify-center w-[168px] h-[46px] uppercase -rotate-3 flex rounded-[8px]">
              Explore
            </span>
            <h2 className="text-[#6B6EF5] font-bold text-[42px] leading-tight uppercase">
              FIND PLACES, EXPERIENCES. <br />
              PLAN TRIP ON <span className="font-extrabold">ROUTA.</span>
            </h2>
          </div>
          <span className="text-[#6B6EF5] font-bold text-[20px] tracking-[0.15em] uppercase mt-0 sm:mt-[130px] h-[24px] flex items-center justify-center">
            PLACES
          </span>
        </div>

        <div className="w-full overflow-hidden relative" style={{ height: sizes.FEATURED_H + 30 }}>
          <div
            className="flex items-center h-full absolute"
            style={{
              gap: sizes.GAP,
              transform: `translateX(${getTranslateX()}px)`,
              transition: isResetting.current
                ? "none"
                : "transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)",
              width: "max-content",
            }}
            onTransitionEnd={() => {
              isResetting.current = false;
            }}
          >
            {[...destinations, ...destinations, ...destinations].map((d, i) => {
              const isFeatured = i === current;
              return (
                <div
                  key={i}
                  className="relative flex-shrink-0 rounded-[20px] overflow-hidden cursor-pointer"
                  style={{
                    width: isFeatured ? sizes.FEATURED_W : sizes.CARD_W,
                    height: isFeatured ? sizes.FEATURED_H : sizes.CARD_H,
                    transition: "width 0.6s cubic-bezier(0.4,0,0.2,1), height 0.6s cubic-bezier(0.4,0,0.2,1)",
                  }}
                >
                  <img src={d.img} alt={d.city} className="w-full h-full object-cover" />
                  {d.showLabel && (
                    <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/70 to-transparent">
                      <p className="text-[#FFFFFF] text-[25px] font-semibold tracking-[0.01rem]">{d.city}</p>
                      <p className="text-[#FFFFFF] font-normal text-[15px]">{d.hotels} hotels available</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ─── FAQ Section ─── */}
      <div ref={faqSectionRef} className="w-full px-4 sm:px-[60px] py-[60px] bg-[#FAFAF5]">
        <div className="flex items-start justify-between mb-[50px] flex-wrap gap-4">
          <div className="flex flex-col gap-[16px]">
            <span className="bg-[#6B6EF5] text-white text-[18px] font-bold tracking-[0.1em] items-center justify-center w-[168px] h-[46px] uppercase -rotate-3 flex rounded-[8px]">
              FAQs
            </span>
            <h2 className="text-[#6B6EF5] font-bold text-[42px] leading-tight uppercase">
              FREQUENTLY ASKED <br /> QUESTIONS
            </h2>
          </div>
          <span className="text-[#6B6EF5] font-bold text-[20px] tracking-[0.15em] uppercase mt-0 sm:mt-[130px] h-[24px] flex items-center justify-center">
            Questions
          </span>
        </div>

        <div className="flex flex-col gap-[12px] w-full max-w-[717px] h-[535px] mx-auto overflow-hidden">
          {faqs.map((faq, i) => (
            <div
              key={i}
              className="bg-white border border-[#E5E5E5] rounded-[12px] w-full cursor-pointer px-5 sm:px-[38px] py-[27px] flex flex-col"
              onClick={() => setOpenFaq(openFaq === i ? null : i)}
            >
              <div className="flex items-center justify-between">
                <span className="text-[#232323] text-[15px] font-normal pr-4">{faq.question}</span>
                <div className="w-[30px] h-[30px] rounded-full border border-[#232323] flex items-center justify-center flex-shrink-0">
                  <span className="text-[#232323] text-[18px] leading-none">{openFaq === i ? "−" : "+"}</span>
                </div>
              </div>
              {openFaq === i && (
                <p className="text-[#666] text-[14px] mt-3 leading-relaxed">{faq.answer}</p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ─── CTA Section ─── */}
      <div className="w-full relative rounded-[30px] bg-[#848AFF] flex flex-col items-center overflow-hidden pb-0">
        <div className="mt-[89px] flex justify-center mb-[42px]">
          <p className="text-[#ffffff] font-bold text-[18px] uppercase">Routa</p>
        </div>

        <div className="flex flex-col items-center text-center w-full max-w-[784px] px-4 mb-[42px]">
          <div className="mb-[16px] flex items-center justify-center">
            <h2 className="text-white font-bold text-[42px] sm:text-[68px] uppercase leading-tight tracking-[0.078px]">
              NEED TO TRAVEL? <br /> TRAVEL WITH ROUTA
            </h2>
          </div>

          <div className="w-full max-w-[520px] flex justify-center items-center mb-[42px]">
            <p className="text-[#ffffff] text-[20px] font-normal tracking-[0.02px] text-center">
              Discover destinations, organize itineraries, and book{" "}
              <br className="hidden sm:block" />
              unforgettable trips - all in one platform.
            </p>
          </div>

          <button
            onClick={handleJoin}
            disabled={loading}
            className="bg-[#ffffff] text-[#000000] h-[50px] w-[193px] font-bold text-[18px] tracking-[0.18px] uppercase flex items-center justify-center rounded-full transition-all duration-200 hover:scale-105 hover:shadow-lg active:scale-95 disabled:opacity-70"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                </svg>
                Joining...
              </span>
            ) : "Join Waitlist"}
          </button>
        </div>

        {/* Big ROUTA text */}
        <div className="w-full flex items-end justify-center overflow-hidden leading-none mt-8 sm:mt-16">
          <p className="text-[#909AFF] text-[clamp(80px,28vw,410px)] font-bold uppercase select-none pointer-events-none leading-none whitespace-nowrap">
            ROUTA
          </p>
        </div>
      </div>

      {/* ─── Footer ─── */}
      <div className="w-full border-t border-[#E5E5E5]">
        <div className="w-full max-w-[1312px] mx-auto px-4 sm:px-6 py-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">

          {/* Copyright */}
          <p className="text-[#000000] text-[16px] font-normal order-3 sm:order-1 text-center sm:text-left">
            © Copyright 2026 Routa. All rights reserved.
          </p>

          {/* Social Icons */}
          <div className="flex items-center justify-center gap-[12px] order-1 sm:order-2">
            <a href="https://x.com/tryrouta" target="_blank" rel="noopener noreferrer"
              className="w-[45px] h-[45px] rounded-full border border-[#232323] flex items-center justify-center hover:bg-[#f5f5f5] transition-colors">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.748l7.73-8.835L1.254 2.25H8.08l4.253 5.622 5.911-5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" fill="#232323" /></svg>
            </a>
            <a href="https://instagram.com/tryrouta" target="_blank" rel="noopener noreferrer"
              className="w-[45px] h-[45px] rounded-full border border-[#232323] flex items-center justify-center hover:bg-[#f5f5f5] transition-colors">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" fill="#232323" /></svg>
            </a>
            <a href="https://tiktok.com/@tryrouta" target="_blank" rel="noopener noreferrer"
              className="w-[45px] h-[45px] rounded-full border border-[#232323] flex items-center justify-center hover:bg-[#f5f5f5] transition-colors">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.32 6.32 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.75a4.85 4.85 0 0 1-1.01-.06z" fill="#232323" /></svg>
            </a>
            <a href="https://linkedin.com/company/tryrouta" target="_blank" rel="noopener noreferrer"
              className="w-[45px] h-[45px] rounded-full border border-[#232323] flex items-center justify-center hover:bg-[#f5f5f5] transition-colors">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" fill="#232323" /></svg>
            </a>
          </div>

          {/* Links */}
          <div className="flex items-center justify-center gap-[28px] order-2 sm:order-3">
            <a href="/privacy" className="text-[#232323] text-[18px] font-normal whitespace-nowrap hover:text-[#6B6EF5] transition-colors">Privacy Policy</a>
            <a href="/terms" className="text-[#232323] text-[18px] font-normal whitespace-nowrap hover:text-[#6B6EF5] transition-colors">Terms of Use</a>
          </div>

        </div>
      </div>
      {/* ─── Terms of Use Modal ─── */}
      <LegalModal
        open={termsOpen}
        onClose={() => setTermsOpen(false)}
        title={termsTitle}
        effectiveDate={termsEffectiveDate}
        preamble={termsPreamble}
        sections={termsSections}
        closing={termsClosing}
        agreed={agreedTerms}
        onAgreeChange={setAgreedTerms}
        agreeLabel="I have read and agree to the Terms of Use."
      />

      {/* ─── Privacy Policy Modal ─── */}
      <LegalModal
        open={privacyOpen}
        onClose={() => setPrivacyOpen(false)}
        title={privacyTitle}
        effectiveDate={privacyEffectiveDate}
        preamble={privacyPreamble}
        sections={privacySections}
        closing={privacyClosing}
        agreed={agreedPrivacy}
        onAgreeChange={setAgreedPrivacy}
        agreeLabel="I have read and agree to the Privacy Policy."
      />

      {/* ─── Success Modal ─── */}
      {submitted && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setSubmitted(false)}
          />
          {/* Modal */}
          <div className="relative bg-white rounded-[24px] px-8 py-10 w-full max-w-[420px] flex flex-col items-center text-center shadow-2xl animate-[modalIn_0.3s_ease_forwards]"
            style={{ animation: "modalIn 0.3s cubic-bezier(0.34,1.56,0.64,1) forwards" }}
          >
            {/* Checkmark */}
            <div className="w-[72px] h-[72px] rounded-full bg-[#6B6EF5] flex items-center justify-center mb-6">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
                <path d="M5 13l4 4L19 7" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h3 className="text-[#232323] font-bold text-[24px] mb-3">You're on the list! 🎉</h3>
            <p className="text-[#666] text-[15px] leading-relaxed mb-6">
              Thanks for joining the Routa waitlist. We'll be in touch at <span className="text-[#6B6EF5] font-medium">{email}</span> when we launch.
            </p>
            <button
              onClick={() => setSubmitted(false)}
              className="bg-[#6B6EF5] text-white h-[48px] w-full rounded-full font-bold text-[16px] transition-all duration-200 hover:bg-[#5557e0] hover:scale-105 active:scale-95"
            >
              Done
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes modalIn {
          from { opacity: 0; transform: scale(0.85) translateY(20px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes linkFadeIn {
          from { opacity: 0; transform: translateX(-16px); }
          to   { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  );
};

export default Waitlist;