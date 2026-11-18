import { useEffect, useMemo, useState } from "react";
import { getTreks, getReports, submitReport, registerUser, loginUser } from "./api";
import SmartFeatures from "./SmartFeatures";
import AdvancedFeatures from "./AdvancedFeatures";
import { translate } from "./localization";
import { estimateTrekBudget } from "./routeBudget";

const initialProfile = { age: "", fitness: "Beginner", experience: "Beginner", availableHours: "3", preferredDifficulty: "Any" };
const reviewStorageKey = "trekwise-post-trek-reviews";
const preferencesStorageKey = "trekwise-user-preferences";
const inquiryDraftStorageKey = "trekwise-booking-inquiry-draft";
const emptyReviewDraft = { routeId: "", rating: 0, title: "", experience: "", completed: false };
const emptyInquiryDraft = { routeId: "", name: "", email: "", plannedDate: "", groupSize: "2", message: "" };
const defaultPreferences = { theme: "light", language: "en", savedRoutes: [], error: "" };

function readPreferences() {
  try {
    const stored = window.localStorage.getItem(preferencesStorageKey);
    if (!stored) return defaultPreferences;
    const parsed = JSON.parse(stored);
    if (!parsed || !["light", "dark"].includes(parsed.theme) || !["en", "hi", "mr"].includes(parsed.language)
      || !Array.isArray(parsed.savedRoutes) || parsed.savedRoutes.some(id => typeof id !== "string")) {
      throw new Error("Saved TrekWise preferences are invalid.");
    }
    return { theme: parsed.theme, language: parsed.language, savedRoutes: parsed.savedRoutes, error: "" };
  } catch (err) {
    return { ...defaultPreferences, error: `Could not load saved preferences: ${err.message}` };
  }
}
const routeImages = {
  "raigad-pachad": "/images/forts/raigad-fort.jpg",
  "sinhagad-pune": "/images/forts/sinhagad-fort.jpg",
  "pratapgad-mahabaleshwar": "/images/forts/pratapgad-fort.jpg",
  "lohagad-lonavala": "/images/forts/lohagad-fort.jpg",
  "rajgad-fort": "/images/forts/rajgad-fort.jpg",
  "torna-fort": "/images/forts/torna-fort.jpg",
  "shivneri-fort": "/images/forts/shivneri-fort.jpg",
  "harishchandragad-fort": "/images/forts/harishchandragad-fort.jpg",
  "sindhudurg-fort": "/images/forts/sindhudurg-fort.jpg",
  "visapur-fort": "/images/forts/visapur-fort.jpg",
};
const imageCredits = {
  "raigad-pachad": { artist: "Gbaadkar", license: "CC BY-SA 3.0", url: "https://commons.wikimedia.org/wiki/File:Raigad_Fort-Rigad.JPG" },
  "sinhagad-pune": { artist: "Lobodrl", license: "CC BY-SA 3.0", url: "https://commons.wikimedia.org/wiki/File:Pune_Darwaza_-_Sinhagad_Fort_(2).jpg" },
  "pratapgad-mahabaleshwar": { artist: "Neeraj Rane", license: "CC BY-SA 4.0", url: "https://commons.wikimedia.org/wiki/File:Pratapgad_The_Fort_of_Valour.jpg" },
  "lohagad-lonavala": { artist: "Rangan Datta Wiki", license: "CC BY-SA 4.0", url: "https://commons.wikimedia.org/wiki/File:Bastions_of_Lohagad_Fort_3.jpg" },
  "rajgad-fort": { artist: "Cj.samson", license: "CC BY 3.0", url: "https://commons.wikimedia.org/wiki/File:Bali_Khila_Rajgad_Maharashtra.jpg" },
  "torna-fort": { artist: "VK1307", license: "CC BY-SA 4.0", url: "https://commons.wikimedia.org/wiki/File:Torna_fort_fencing_wall.jpg" },
  "shivneri-fort": { artist: "Nandini Jaybhaye", license: "CC BY-SA 4.0", url: "https://commons.wikimedia.org/wiki/File:Beautiful_scenery_while_going_upwards_on_Shivneri_fort.jpg" },
  "harishchandragad-fort": { artist: "Dinesh Valke", license: "CC BY-SA 2.0", url: "https://commons.wikimedia.org/wiki/File:Harishchandragad_(32607095943).jpg" },
  "sindhudurg-fort": { artist: "Kshitija43", license: "CC BY-SA 4.0", url: "https://commons.wikimedia.org/wiki/File:Sindhudurg_Fort,_Konkan_division,_Maharashtra,_India_(2016).jpg" },
  "visapur-fort": { artist: "Sumedh.dorwat", license: "CC BY-SA 4.0", url: "https://commons.wikimedia.org/wiki/File:Fort_Visapur.jpg" },
};
const heroFortCollection = [
  { id: "rajgad-fort", name: "Rajgad Fort" },
  { id: "lohagad-lonavala", name: "Lohagad Fort" },
  { id: "sinhagad-pune", name: "Sinhagad Fort" },
  { id: "raigad-pachad", name: "Raigad Fort" },
  { id: "pratapgad-mahabaleshwar", name: "Pratapgad Fort" },
  { id: "torna-fort", name: "Torna Fort" },
  { id: "shivneri-fort", name: "Shivneri Fort" },
  { id: "harishchandragad-fort", name: "Harishchandragad" },
  { id: "sindhudurg-fort", name: "Sindhudurg Fort" },
  { id: "visapur-fort", name: "Visapur Fort" },
];
function ImageCredit({ routeId }) {
  const credit = imageCredits[routeId];
  if (!credit) return null;
  return <a className="photo-credit" href={credit.url} target="_blank" rel="noreferrer" title={`Photo by ${credit.artist}, ${credit.license}`} onClick={e => e.stopPropagation()}>Photo: {credit.artist} · {credit.license} ↗</a>;
}

function Score({ label, score, safety = false }) {
  const level = score >= 75 ? "good" : score >= 50 ? "medium" : "low";
  return <div className={`score ${safety ? "safety" : ""}`}>
    <div className="score-line"><span>{label}</span><strong>{score}/100</strong></div>
    <div className="meter"><span className={level} style={{ width: `${score}%` }} /></div>
  </div>;
}

function Feedback({ message, error, onClearMessage, onClearError }) {
  return <>
    {message && <div className="notice" role="status"><span>{message}</span><button onClick={onClearMessage} aria-label="Dismiss message">×</button></div>}
    {error && <div className="error-box" role="alert"><span>{error}</span><button onClick={onClearError} aria-label="Dismiss error">×</button></div>}
  </>;
}

function RouteCard({ route, onReport, onReview, onInquiry, saved, onSave, t }) {
  return <article className="route-card">
    <div className="route-image" style={{ backgroundImage: `url("${routeImages[route.id] || routeImages["raigad-pachad"]}")` }}>
      <span className={`difficulty ${route.difficulty.toLowerCase()}`}>{t(`difficulty.${route.difficulty.toLowerCase()}`)}</span>
      <button className={`save-route ${saved ? "saved" : ""}`} onClick={() => onSave(route.id)} aria-label={saved ? t("route.unsave") : t("route.save")}>{saved ? "♥" : "♡"}</button>
      <ImageCredit routeId={route.id} />
    </div>
    <div className="route-card-content">
      <div className="route-top">
        <div><span className="eyebrow">{route.region}</span><h3>{route.fort}</h3><p className="route-name">{route.routeName}</p></div>
        <span className="rating"><span>★</span> 4.9</span>
      </div>
      <div className="facts">
        <div><span>{t("route.distance")}</span><strong>{route.distanceKm} km</strong></div>
        <div><span>{t("route.duration")}</span><strong>{route.durationHours} hrs</strong></div>
        <div><span>{t("route.ascent")}</span><strong>{route.elevationGainM} m</strong></div>
      </div>
      <div className="scores">
        <Score label={t("route.match")} score={route.compatibilityScore} />
        <Score label={t("route.indicator")} score={route.safetyScore} safety />
      </div>
      <div className="route-meta"><span>⌁ {route.trailCondition}</span><span>◷ Water: {route.waterAvailability}</span></div>
      {route.recommendationReasons?.length > 0 && <details className="why"><summary>Why this trek?</summary><ul>{route.recommendationReasons.map((reason, i) => <li key={i}>{reason}</li>)}</ul></details>}
      {route.safetyScore < 50 && <div className="warning">High caution: do not use this score as permission to trek. Check with local authorities and do not proceed if the route is unsafe.</div>}
      <div className="card-actions">
        <a className="button dark" href={route.mapUrl} target="_blank" rel="noreferrer">{t("route.map")} ↗</a>
        <button className="button secondary" onClick={() => onReview(route)}>{t("route.review")}</button>
        <button className="button secondary" onClick={() => onReport(route)}>{t("route.report")}</button>
      </div>
      <button className="button secondary inquiry-button" onClick={() => onInquiry(route)}>{t("route.inquiry")} →</button>
    </div>
  </article>;
}

function FortLocationMap({ routes, selectedRoute, onSelect }) {
  const longitudes = routes.map(route => route.longitude);
  const latitudes = routes.map(route => route.latitude);
  const minLongitude = Math.min(...longitudes);
  const longitudeRange = Math.max(...longitudes) - minLongitude || 1;
  const minLatitude = Math.min(...latitudes);
  const latitudeRange = Math.max(...latitudes) - minLatitude || 1;

  return <div className="fort-location-map" aria-label="Illustrative map of sample fort locations">
    <svg className="locator-terrain" viewBox="0 0 640 400" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <pattern id="locatorGrid" width="48" height="48" patternUnits="userSpaceOnUse">
          <path d="M 48 0 L 0 0 0 48" fill="none" stroke="#d7e2d2" strokeWidth="1" />
        </pattern>
      </defs>
      <rect width="640" height="400" fill="#f1f5ed" />
      <rect width="640" height="400" fill="url(#locatorGrid)" />
      <path d="M-20 305 C90 260 105 345 208 290 S330 250 410 288 S550 335 670 245" fill="none" stroke="#dce8d7" strokeWidth="30" />
      <path d="M-20 305 C90 260 105 345 208 290 S330 250 410 288 S550 335 670 245" fill="none" stroke="#b8cdb1" strokeWidth="2" strokeDasharray="5 7" />
      <path d="M52 60 C147 112 102 161 204 181 S345 145 380 205 S477 258 600 180" fill="none" stroke="#e0e9db" strokeWidth="2" />
      <path d="M-10 115 C82 95 111 42 204 72 S362 115 442 74 S574 39 656 84" fill="none" stroke="#e0e9db" strokeWidth="2" />
      <text x="24" y="34" fill="#789073" fontSize="11" fontWeight="700" letterSpacing="2">SAHYADRI · MAHARASHTRA</text>
      <text x="24" y="378" fill="#82907e" fontSize="10">Approximate fort locations · not hiking trails</text>
    </svg>
    {routes.map((route, index) => {
      const left = 8 + ((route.longitude - minLongitude) / longitudeRange) * 84;
      const top = 12 + ((Math.max(...latitudes) - route.latitude) / latitudeRange) * 72;
      const selected = route.id === selectedRoute.id;
      return <button
        key={route.id}
        type="button"
        className={`locator-marker ${selected ? "selected" : ""}`}
        style={{ left: `${left}%`, top: `${top}%` }}
        onClick={() => onSelect(route.id)}
        aria-label={`Show ${route.fort} on map`}
        title={route.fort}
      >
        <span>{String(index + 1).padStart(2, "0")}</span>
        {selected && <strong>{route.fort}</strong>}
      </button>;
    })}
  </div>;
}

function RouteSketch() {
  return <div className="route-sketch" aria-label="Illustrative elevation profile">
    <div className="sketch-label"><span>Elevation profile</span><strong>Trail overview</strong></div>
    <svg viewBox="0 0 480 150" role="img" aria-label="Illustrative trail elevation, not GPS data">
      <defs><linearGradient id="elevationFill" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#c6d9ad" stopOpacity=".65" /><stop offset="100%" stopColor="#c6d9ad" stopOpacity=".04" /></linearGradient></defs>
      <path d="M0 124 C36 116 38 96 76 101 S121 89 148 93 S186 56 216 68 S262 77 284 47 S325 51 346 43 S390 18 414 30 S449 20 480 8 V150 H0Z" fill="url(#elevationFill)" />
      <path d="M0 124 C36 116 38 96 76 101 S121 89 148 93 S186 56 216 68 S262 77 284 47 S325 51 346 43 S390 18 414 30 S449 20 480 8" fill="none" stroke="#79966c" strokeWidth="3" strokeLinecap="round" />
      <circle cx="0" cy="124" r="5" fill="#79966c" /><circle cx="480" cy="8" r="5" fill="#294f38" />
    </svg>
    <div className="sketch-axis"><span>Start</span><span>Route distance · illustrative</span><span>Summit</span></div>
  </div>;
}

export default function App() {
  const [initialPreferences] = useState(readPreferences);
  const [profile, setProfile] = useState(initialProfile);
  const [routes, setRoutes] = useState([]);
  const [catalogRoutes, setCatalogRoutes] = useState([]);
  const [search, setSearch] = useState("");
  const [routeFilters, setRouteFilters] = useState({ difficulty: "Any", maxDistanceKm: "any", maxBudgetInr: "any" });
  const [reports, setReports] = useState([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState(initialPreferences.error);
  const [activeTab, setActiveTab] = useState("routes");
  const [account, setAccount] = useState(null);
  const [theme, setTheme] = useState(initialPreferences.theme);
  const [language, setLanguage] = useState(initialPreferences.language);
  const [authMode, setAuthMode] = useState("register");
  const [authForm, setAuthForm] = useState({ name: "", email: "", password: "" });
  const [inquiryForm, setInquiryForm] = useState(emptyInquiryDraft);
  const [reportForm, setReportForm] = useState({ routeId: "", type: "Slippery trail", description: "" });
  const [loading, setLoading] = useState(false);
  const [savedRoutes, setSavedRoutes] = useState(initialPreferences.savedRoutes);
  const [isListening, setIsListening] = useState(false);
  const [locationStatus, setLocationStatus] = useState("");
  const [selectedMapRouteId, setSelectedMapRouteId] = useState("");
  const [reviews, setReviews] = useState([]);
  const [reviewDraft, setReviewDraft] = useState(emptyReviewDraft);
  const [reviewFilter, setReviewFilter] = useState("all");
  const t = (key) => translate(language, key);

  useEffect(() => { loadWithProfile(profile, search, false); }, []);
  useEffect(() => {
    try {
      const savedReviews = window.localStorage.getItem(reviewStorageKey);
      if (savedReviews === null) return;
      const parsedReviews = JSON.parse(savedReviews);
      const isValidReview = review => review
        && typeof review.id === "string"
        && typeof review.routeId === "string"
        && Number.isInteger(review.rating)
        && review.rating >= 1
        && review.rating <= 5
        && typeof review.routeName === "string"
        && typeof review.author === "string"
        && typeof review.title === "string"
        && typeof review.experience === "string"
        && typeof review.createdAt === "string";
      if (!Array.isArray(parsedReviews) || parsedReviews.some(review => !isValidReview(review))) {
        throw new Error("Saved review data is invalid.");
      }
      setReviews(parsedReviews);
    } catch (err) {
      setError(`Could not load saved trek reviews: ${err.message}`);
    }
  }, []);
  useEffect(() => {
    try {
      window.localStorage.setItem(preferencesStorageKey, JSON.stringify({ theme, language, savedRoutes }));
      document.documentElement.lang = language;
    } catch (err) {
      setError(`Could not save your preferences in this browser: ${err.message}`);
    }
  }, [theme, language, savedRoutes]);
  const reportCounts = useMemo(() => reports.reduce((acc, r) => { acc[r.routeId] = (acc[r.routeId] || 0) + 1; return acc; }, {}), [reports]);
  const verifiedCount = reports.filter(report => report.status === "Verified").length;
  const visibleReviews = useMemo(() => reviews
    .filter(review => reviewFilter === "all" || review.routeId === reviewFilter)
    .slice()
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)), [reviews, reviewFilter]);
  const reviewAverage = visibleReviews.length
    ? visibleReviews.reduce((total, review) => total + review.rating, 0) / visibleReviews.length
    : 0;
  const recommendedRoutes = useMemo(() => routes
    .slice()
    .sort((a, b) => b.compatibilityScore - a.compatibilityScore)
    .slice(0, 3), [routes]);
  const visibleRoutes = useMemo(() => routes.filter(route => {
    const matchesDifficulty = routeFilters.difficulty === "Any" || route.difficulty === routeFilters.difficulty;
    const matchesDistance = routeFilters.maxDistanceKm === "any" || route.distanceKm <= Number(routeFilters.maxDistanceKm);
    const estimatedBudget = estimateTrekBudget(route, { hours: route.durationHours }).perPerson;
    const matchesBudget = routeFilters.maxBudgetInr === "any" || estimatedBudget <= Number(routeFilters.maxBudgetInr);
    return matchesDifficulty && matchesDistance && matchesBudget;
  }), [routes, routeFilters]);
  const allRoutes = catalogRoutes.length ? catalogRoutes : routes;
  const favoriteRoutes = useMemo(() => catalogRoutes.filter(route => savedRoutes.includes(route.id)), [catalogRoutes, savedRoutes]);
  const selectedMapRoute = allRoutes.find(route => route.id === selectedMapRouteId) || allRoutes[0];

  const updateProfile = (key, value) => setProfile(p => ({ ...p, [key]: value }));
  const loadWithProfile = async (profileToLoad = profile, searchTerm = search, notify = true) => {
    setLoading(true); setError(""); setMessage("");
    try {
      const [routeData, reportData] = await Promise.all([getTreks(profileToLoad, searchTerm), getReports()]);
      setRoutes(routeData); setReports(reportData);
      if (notify) setMessage("Recommendations updated for your profile.");
      if (!searchTerm.trim()) setCatalogRoutes(routeData);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };
  const refreshRoutes = (event) => {
    event.preventDefault();
    return loadWithProfile();
  };
  const startVoiceSearch = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError("Voice search is not supported in this browser. You can still search by typing.");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = { en: "en-IN", hi: "hi-IN", mr: "mr-IN" }[language];
    recognition.onstart = () => { setIsListening(true); setError(""); };
    recognition.onresult = event => {
      const transcript = event.results?.[0]?.[0]?.transcript?.trim();
      if (!transcript) {
        setError("No fort name was heard. Try again or type your search.");
        return;
      }
      setSearch(transcript);
      loadWithProfile(profile, transcript);
    };
    recognition.onerror = event => {
      setIsListening(false);
      setError(`Voice search could not start (${event.error}). You can still search by typing.`);
    };
    recognition.onend = () => setIsListening(false);
    try {
      recognition.start();
    } catch (err) {
      setIsListening(false);
      setError(`Voice search could not start: ${err.message}`);
    }
  };
  const handleAuth = async (e) => {
    e.preventDefault(); setError(""); setMessage("");
    try {
      const data = authMode === "register"
        ? await registerUser({ ...authForm, ...profile })
        : await loginUser({ email: authForm.email, password: authForm.password });
      setAccount(data.user);
      const nextProfile = {
        ...profile,
        age: data.user.age == null ? "" : String(data.user.age),
        ...Object.fromEntries(Object.entries(data.user).filter(([k]) => ["fitness", "experience", "availableHours", "preferredDifficulty"].includes(k)).map(([k, v]) => [k, String(v)]))
      };
      setProfile(nextProfile);
      await loadWithProfile(nextProfile);
      setMessage(`${data.message} Welcome, ${data.user.name}.`);
    } catch (err) { setError(err.message); }
  };
  const openReport = (route) => {
    setReportForm({ routeId: route.id, type: "Slippery trail", description: "" });
    setActiveTab("report");
    setMessage(`Submit a report for ${route.fort}.`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const sendReport = async (e) => {
    e.preventDefault(); setError(""); setMessage("");
    try {
      const data = await submitReport(reportForm);
      setReportForm(p => ({ ...p, description: "" }));
      await loadWithProfile(); setMessage(data.message); setActiveTab("community");
    } catch (err) { setError(err.message); }
  };
  const submitReview = (e) => {
    e.preventDefault(); setError(""); setMessage("");
    if (!reviewDraft.rating) {
      setError("Choose a star rating before submitting your review.");
      return;
    }
    if (!reviewDraft.completed) {
      setError("Please confirm that you completed this trek before reviewing it.");
      return;
    }
    const route = routes.find(item => item.id === reviewDraft.routeId);
    if (!route) {
      setError("Choose a valid trek route for your review.");
      return;
    }
    const review = {
      ...reviewDraft,
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      routeName: route.fort,
      author: account?.name || "Trekker",
      createdAt: new Date().toISOString(),
    };
    const updatedReviews = [review, ...reviews];
    try {
      window.localStorage.setItem(reviewStorageKey, JSON.stringify(updatedReviews));
      setReviews(updatedReviews);
      setReviewFilter("all");
      setReviewDraft(emptyReviewDraft);
      setMessage("Thanks for sharing your trek review.");
    } catch (err) {
      setError(`Could not save your review in this browser: ${err.message}`);
    }
  };
  const shareLocation = () => {
    setLocationStatus("");
    if (!navigator.geolocation) {
      setLocationStatus("This browser does not support location sharing.");
      return;
    }
    navigator.geolocation.getCurrentPosition(async ({ coords }) => {
      const locationUrl = `https://maps.google.com/?q=${coords.latitude},${coords.longitude}`;
      const shareData = { title: "My TrekWise location", text: "My current location for a trek check-in:", url: locationUrl };
      try {
        if (navigator.share) await navigator.share(shareData);
        else if (navigator.clipboard) await navigator.clipboard.writeText(`${shareData.text} ${locationUrl}`);
        else throw new Error("Sharing is not supported on this browser.");
        setLocationStatus("Location link shared. TrekWise does not contact emergency services.");
      } catch (err) {
        if (err.name !== "AbortError") setLocationStatus(err.message || "Could not share your location.");
      }
    }, err => setLocationStatus(err.code === 1 ? "Location permission was denied. Allow location access to share your position." : "Could not get your location. Try again when GPS is available."), { enableHighAccuracy: true, timeout: 10000 });
  };
  const toggleSaved = (id) => setSavedRoutes(items => items.includes(id) ? items.filter(item => item !== id) : [...items, id]);
  const goTo = (tab) => {
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const navigateMore = (tab) => {
    goTo(tab);
    const menu = document.getElementById("nav-more-menu");
    if (menu) menu.open = false;
  };
  const openSmartReport = (payload) => {
    setReportForm(payload);
    setMessage("Review the manually selected observation before submitting it to the community.");
    goTo("report");
  };
  const openAccount = (mode) => {
    setAuthMode(mode);
    setError("");
    setMessage("");
    goTo("account");
  };
  const openReview = (route) => {
    setReviewDraft({ ...emptyReviewDraft, routeId: route.id });
    goTo("reviews");
  };
  const openInquiry = (route) => {
    setInquiryForm({ ...emptyInquiryDraft, routeId: route.id, name: account?.name || "", email: account?.email || "" });
    goTo("inquiry");
  };
  const getInquiryText = () => {
    const route = catalogRoutes.find(item => item.id === inquiryForm.routeId) || routes.find(item => item.id === inquiryForm.routeId);
    return [
      `Trek inquiry: ${route?.fort || "Route to be confirmed"}`,
      `Name: ${inquiryForm.name || "Not provided"}`,
      `Email: ${inquiryForm.email || "Not provided"}`,
      `Preferred date: ${inquiryForm.plannedDate || "Flexible"}`,
      `Group size: ${inquiryForm.groupSize || "Not provided"}`,
      `Question: ${inquiryForm.message || "Please share availability, access and current pricing."}`,
    ].join("\n");
  };
  const saveInquiryDraft = (event) => {
    event.preventDefault();
    try {
      window.localStorage.setItem(inquiryDraftStorageKey, JSON.stringify({ ...inquiryForm, savedAt: new Date().toISOString() }));
      setMessage(t("inquiry.saved"));
    } catch (err) {
      setError(`Could not save your inquiry draft in this browser: ${err.message}`);
    }
  };
  const copyInquiryDraft = async () => {
    try {
      if (!inquiryForm.routeId) throw new Error("Choose a trek before copying the inquiry.");
      if (!inquiryForm.name.trim()) throw new Error("Enter your name before copying the inquiry.");
      if (!navigator.clipboard) throw new Error("Copying is not supported in this browser.");
      await navigator.clipboard.writeText(getInquiryText());
      setMessage(t("inquiry.copied"));
    } catch (err) {
      setError(`Could not copy the inquiry draft: ${err.message}`);
    }
  };

  return <div className="app-shell" data-theme={theme}>
    <a className="skip-link" href="#main-content">Skip to main content</a>
    <header className="navbar">
      <a href="#" className="brand" onClick={(e) => { e.preventDefault(); goTo("routes"); }}><span className="brand-mark">⌁</span><span>TrekWise<small>FIND YOUR WILD</small></span></a>
      <nav aria-label="Main navigation">
        <button className={activeTab === "routes" ? "nav-active" : ""} onClick={() => goTo("routes")}>{t("nav.home")}</button>
        <button className={activeTab === "smart" ? "nav-active" : ""} onClick={() => goTo("smart")}>{t("nav.smart")}</button>
        <button className={activeTab === "advanced" ? "nav-active" : ""} onClick={() => goTo("advanced")}>{t("nav.safety")}</button>
        <button className={activeTab === "maps" ? "nav-active" : ""} onClick={() => goTo("maps")}>{t("nav.maps")}</button>
        <button className={activeTab === "community" || activeTab === "report" ? "nav-active" : ""} onClick={() => goTo("community")}>{t("nav.community")}</button>
        <details className="nav-more" id="nav-more-menu">
          <summary>{t("nav.more")}</summary>
          <div className="nav-more-menu">
            <button onClick={() => navigateMore("dashboard")}>{t("nav.dashboard")}</button>
            <button onClick={() => navigateMore("safety")}>{t("nav.safetyChecklist")}</button>
            <button onClick={() => navigateMore("heritage")}>{t("nav.heritage")}</button>
            <button onClick={() => navigateMore("favorites")}>{t("nav.favorites")}</button>
            <button onClick={() => navigateMore("reviews")}>{t("nav.reviews")}</button>
            <button onClick={() => navigateMore("help")}>{t("nav.help")}</button>
            <button onClick={() => navigateMore("admin")}>{t("nav.admin")}</button>
          </div>
        </details>
      </nav>
      <div className="nav-actions">
        <select className="nav-language" value={language} onChange={event => setLanguage(event.target.value)} aria-label={t("language.label")} title={t("language.label")}><option value="en">EN</option><option value="hi">हि</option><option value="mr">मर</option></select>
        <button className="nav-shortcut theme-toggle" onClick={() => setTheme(value => value === "dark" ? "light" : "dark")} aria-label={t(theme === "dark" ? "theme.light" : "theme.dark")} title={t(theme === "dark" ? "theme.light" : "theme.dark")}>{theme === "dark" ? "☼" : "◐"}</button>
        {account ? <button className="nav-account" onClick={() => goTo("account")}>{account.name.split(" ")[0]}</button> : <button className="nav-signup" onClick={() => openAccount("register")}>{t("nav.account")}</button>}
      </div>
    </header>
    <div className="feedback-wrap"><Feedback message={message} error={error} onClearMessage={() => setMessage("")} onClearError={() => setError("")} /></div>

    {activeTab === "routes" && <>
      <section className="hero">
        <div className="hero-content">
          <span className="hero-kicker"><span className="live-dot"></span> {t("hero.kicker")}</span>
          <h1>{t("hero.heading")}<br/><em>{t("hero.headingEm")}</em></h1>
          <p>{t("hero.body")}</p>
          <div className="hero-actions"><button className="button primary" onClick={() => document.getElementById("route-results")?.scrollIntoView({ behavior: "smooth" })}>{t("hero.explore")} <span>→</span></button><button className="hero-text-link" onClick={() => goTo("help")}>{t("hero.firstTime")} <span>↗</span></button></div>
          <div className="hero-trust"><div className="avatar-stack"><span>R</span><span>A</span><span>M</span></div><span><strong>Made for curious explorers</strong><small>Plan thoughtfully. Trek responsibly.</small></span></div>
        </div>
        <div className="fort-mosaic" aria-label="Photos of ten Maharashtra forts">
          {heroFortCollection.map((fort, index) => {
            const credit = imageCredits[fort.id];
            return <a key={fort.id} className="fort-mosaic-item" href={credit.url} target="_blank" rel="noreferrer" style={{ backgroundImage: `url("${routeImages[fort.id]}")` }} aria-label={`${fort.name} photo by ${credit.artist}, ${credit.license}`} title={`${fort.name} · Photo by ${credit.artist} · ${credit.license}`}>
              <span className="mosaic-number">{String(index + 1).padStart(2, "0")}</span><strong>{fort.name}</strong><small>{credit.artist} · {credit.license}</small>
            </a>;
          })}
          <button className="fort-mosaic-note" onClick={() => document.getElementById("route-results")?.scrollIntoView({ behavior: "smooth" })}><span>SAHYADRI COLLECTION</span><strong>10 forts.<br/>Endless stories.</strong><i>Explore trails ↗</i></button>
        </div>
        <div className="hero-photo-caption"><span className="caption-pin">⌖</span><span><strong>Pratapgad Fort · Satara</strong><small>A fort above the Sahyadri clouds</small></span></div>
        <ImageCredit routeId="pratapgad-mahabaleshwar" />
        <div className="hero-index">17° 56' N&nbsp; · &nbsp;73° 35' E</div>
      </section>

      <main className="main-content" id="main-content">
        <section className="welcome-strip">
          <div><span className="eyebrow">{t("welcome.eyebrow")}</span><h2>{t("welcome.title")}, {account?.name?.split(" ")[0] || "explorer"} <span>✦</span></h2><p>{t("welcome.body")}</p></div>
          <div className="quick-stats"><div><strong>{catalogRoutes.length || routes.length || "—"}</strong><span>{t("welcome.trails")}</span></div><i></i><div><strong>{reports.length || "0"}</strong><span>{t("welcome.notes")}</span></div><i></i><button className="quick-stat-button" onClick={() => goTo("favorites")}><strong>{savedRoutes.length}</strong><span>{t("welcome.saved")}</span></button></div>
        </section>

        <section className="dashboard-grid">
          <article className="feature-card trail-profile-card">
            <div className="trail-profile-copy"><span className="eyebrow">{t("welcome.profileEyebrow")}</span><h3>{t("welcome.profileTitle")}</h3><p>{t("profile.body")}</p>
              <div className="trail-profile-settings"><span><small>AGE</small><strong>{profile.age ? `${profile.age} years` : t("profile.optional")}</strong></span><span><small>FITNESS</small><strong>{t(`level.${profile.fitness.toLowerCase()}`)}</strong></span><span><small>EXPERIENCE</small><strong>{t(`level.${profile.experience.toLowerCase()}`)}</strong></span><span><small>TIME</small><strong>{profile.availableHours} {profile.availableHours === "1" ? t("time.hour") : t("time.hours")}</strong></span><span><small>DIFFICULTY</small><strong>{profile.preferredDifficulty === "Any" ? t("filters.any") : t(`difficulty.${profile.preferredDifficulty.toLowerCase()}`)}</strong></span></div>
              <button className="text-button" onClick={() => document.getElementById("profile-preferences")?.scrollIntoView({ behavior: "smooth", block: "center" })}>{t("welcome.profileAction")} <span>↗</span></button>
            </div>
            <div className="trail-profile-art" aria-hidden="true"><span className="trail-orbit trail-orbit-one"></span><span className="trail-orbit trail-orbit-two"></span><span className="trail-profile-compass">⌖</span><div className="trail-profile-art-label"><small>YOUR PACE</small><strong>{profile.fitness.toUpperCase()}</strong></div></div>
          </article>
          <article className="feature-card mini-dashboard">
            <div className="mini-head"><div><span className="eyebrow">{t("welcome.journalEyebrow")}</span><h3>{t("welcome.journalTitle")}</h3></div><span className="journal-icon">↗</span></div>
            <p>{t("welcome.journalBody")}</p>
            <div className="journal-progress"><div><span>{t("welcome.journalProgress")}</span><strong>{account ? "Profile set" : t("welcome.journalStatus")}</strong></div><div className="progress-track"><span style={{ width: account ? "78%" : "34%" }} /></div></div>
            <button className="text-button" onClick={() => document.getElementById("route-results")?.scrollIntoView({ behavior: "smooth" })}>{t("welcome.journalAction")} <span>→</span></button>
          </article>
        </section>

        <section className="section-heading route-heading" id="route-results"><div><span className="eyebrow">{t("routes.eyebrow")}</span><h2>{t("routes.title")}</h2><p>{t("routes.description")}</p></div><span className="result-count">{visibleRoutes.length} {t("filters.results")}</span></section>
        <section className="route-planner-panel" aria-labelledby="route-planner-title">
          <div className="route-planner-heading"><span className="route-planner-icon" aria-hidden="true">⌖</span><div><span className="eyebrow">{t("profile.eyebrow")}</span><h3 id="route-planner-title">{t("profile.title")}</h3><p>{t("profile.body")}</p></div><span className="planner-step-label">01</span></div>
          <form className="profile-panel" id="profile-preferences" onSubmit={refreshRoutes}>
            <label>{t("profile.age")}<input type="number" min="13" max="100" step="1" value={profile.age} onChange={e => updateProfile("age", e.target.value)} placeholder="13–100"/></label>
            <label>{t("profile.fitness")}<select value={profile.fitness} onChange={e => updateProfile("fitness", e.target.value)}><option value="Beginner">{t("level.beginner")}</option><option value="Moderate">{t("level.moderate")}</option><option value="Advanced">{t("level.advanced")}</option></select></label>
            <label>{t("profile.experience")}<select value={profile.experience} onChange={e => updateProfile("experience", e.target.value)}><option value="Beginner">{t("level.beginner")}</option><option value="Moderate">{t("level.moderate")}</option><option value="Advanced">{t("level.advanced")}</option></select></label>
            <label>{t("profile.time")}<select value={profile.availableHours} onChange={e => updateProfile("availableHours", e.target.value)}>{[1, 2, 3, 4, 6, 8].map(hours => <option value={hours} key={hours}>{hours} {hours === 1 ? t("time.hour") : t("time.hours")}</option>)}</select></label>
            <label>{t("profile.difficulty")}<select value={profile.preferredDifficulty} onChange={e => updateProfile("preferredDifficulty", e.target.value)}><option value="Any">{t("filters.any")}</option><option value="Easy">{t("difficulty.easy")}</option><option value="Moderate">{t("difficulty.moderate")}</option><option value="Hard">{t("difficulty.hard")}</option></select></label>
            <button className="button dark profile-submit" type="submit" disabled={loading}>{loading ? t("profile.loading") : t("profile.update")} <span>→</span></button>
          </form>
          <p className="profile-age-note">{t("profile.note")}</p>
          <div className="route-search-heading"><span className="route-search-icon">⌕</span><span><strong>{t("search.title")}</strong><small>{t("search.body")}</small></span></div>
          <form className="search-row" onSubmit={refreshRoutes}><span aria-hidden="true">⌕</span><input value={search} onChange={e => setSearch(e.target.value)} placeholder={t("search.placeholder")} aria-label={t("search.title")}/><button className="button dark" type="submit" disabled={loading}>{t("search.submit")}</button><button className={`button voice-search-button ${isListening ? "listening" : ""}`} type="button" onClick={startVoiceSearch} disabled={loading || isListening} aria-label={t("search.voice")} title={t("search.voice")}>{isListening ? "●" : "🎙"}<span>{isListening ? "…" : t("search.voice")}</span></button></form>
          <div className="smart-filter-panel">
            <div className="smart-filter-heading"><strong>{t("filters.title")}</strong><span aria-live="polite">{visibleRoutes.length} {t("filters.results")}</span></div>
            <div className="smart-filter-controls">
              <label>{t("filters.difficulty")}<select value={routeFilters.difficulty} onChange={event => setRouteFilters(filters => ({ ...filters, difficulty: event.target.value }))}><option value="Any">{t("filters.any")}</option><option value="Easy">{t("difficulty.easy")}</option><option value="Moderate">{t("difficulty.moderate")}</option><option value="Hard">{t("difficulty.hard")}</option></select></label>
              <label>{t("filters.distance")}<select value={routeFilters.maxDistanceKm} onChange={event => setRouteFilters(filters => ({ ...filters, maxDistanceKm: event.target.value }))}><option value="any">{t("filters.any")}</option>{[2, 2.5, 3, 3.5, 4, 5].map(distance => <option value={distance} key={distance}>{t("filters.within")} {distance} km</option>)}</select></label>
              <label>{t("filters.budget")}<select value={routeFilters.maxBudgetInr} onChange={event => setRouteFilters(filters => ({ ...filters, maxBudgetInr: event.target.value }))}><option value="any">{t("filters.any")}</option>{[1500, 2000, 2500, 3500, 5000].map(amount => <option value={amount} key={amount}>{t("filters.within")} ₹{amount.toLocaleString("en-IN")}</option>)}</select></label>
              {(routeFilters.difficulty !== "Any" || routeFilters.maxDistanceKm !== "any" || routeFilters.maxBudgetInr !== "any") && <button className="text-button clear-filters" type="button" onClick={() => setRouteFilters({ difficulty: "Any", maxDistanceKm: "any", maxBudgetInr: "any" })}>{t("filters.clear")}</button>}
            </div>
            <small className="filter-disclaimer">{t("filters.sample")}</small>
          </div>
          <div className="score-explainer"><div><span className="dot green"></span><p><strong>Your match</strong><small>Based on your profile and available time.</small></p></div><div><span className="dot gold"></span><p><strong>Trail indicator</strong><small>Uses sample data and community reports. Not a safety guarantee.</small></p></div><button className="text-button" onClick={() => goTo("advanced")}>View safety tools ↗</button></div>
        </section>
        <div className="route-grid">{loading ? <p>Loading trails…</p> : visibleRoutes.length ? visibleRoutes.map(route => <RouteCard key={route.id} route={{ ...route, reportCount: reportCounts[route.id] || 0 }} onReport={openReport} onReview={openReview} onInquiry={openInquiry} saved={savedRoutes.includes(route.id)} onSave={toggleSaved} t={t} />) : <p className="empty-state">{t("route.noResults")}</p>}</div>
        <section className="fort-directory" aria-labelledby="fort-directory-title">
          <div className="fort-directory-heading"><div><span className="eyebrow">THE FULL SAMPLE COLLECTION</span><h2 id="fort-directory-title">All {allRoutes.length} forts</h2><p>Browse the complete fort list, even while your search is filtered.</p></div><button className="text-button" onClick={() => goTo("maps")}>View all on map ↗</button></div>
          <div className="fort-directory-grid">{allRoutes.map(route => <article className="fort-directory-card" key={route.id}>
            <img src={routeImages[route.id] || routeImages["raigad-pachad"]} alt={`${route.fort}`} loading="lazy" />
            <div className="fort-directory-copy"><span>{route.region}</span><strong>{route.fort}</strong><small>{route.difficulty} · {route.distanceKm} km · {route.durationHours} hrs</small><button type="button" onClick={() => { setSelectedMapRouteId(route.id); goTo("maps"); }}>Show on map ↗</button></div>
          </article>)}</div>
        </section>
        <section className="feature-rail"><div className="rail-heading"><div><span className="eyebrow">THOUGHTFUL TOOLS FOR THE TRAIL</span><h2>Adventure, with a little more insight.</h2></div><button className="text-button" onClick={() => goTo("safety")}>See how it works ↗</button></div><div className="rail-grid">
          <article><span className="rail-icon">✳</span><h3>Made for your pace</h3><p>Recommendations consider your experience, fitness and time.</p></article>
          <article><span className="rail-icon">⌖</span><h3>Know before you go</h3><p>Map links, weather checks and trail notes in one place.</p></article>
          <article><span className="rail-icon">♡</span><h3>Better together</h3><p>Share observations to help the trekking community plan.</p></article>
          <article><span className="rail-icon">⌂</span><h3>Stories in every stone</h3><p>Discover the remarkable history behind Maharashtra’s forts.</p></article>
        </div></section>
      </main>
    </>}

    {activeTab === "dashboard" && <main className="main-content page-main dashboard-page">
      <section className="community-intro"><div><span className="eyebrow">YOUR TREKWISE DASHBOARD</span><h2>Welcome, {account?.name?.split(" ")[0] || "explorer"}.</h2><p>A quick view of your trekking profile, saved trails and personalized route matches.</p></div><button className="button dark" onClick={() => account ? goTo("account") : openAccount("register")}>{account ? "View my profile" : "Set up my profile"} →</button></section>
      <section className="dashboard-stat-grid" aria-label="Trekking overview">
        <article><span className="dashboard-stat-icon">⌖</span><span>Available routes</span><strong>{routes.length}</strong><small>Sample route catalog</small></article>
        <article><span className="dashboard-stat-icon">♡</span><span>Saved treks</span><strong>{savedRoutes.length}</strong><small>Saved in this session</small></article>
        <article><span className="dashboard-stat-icon">✳</span><span>Community notes</span><strong>{reports.length}</strong><small>Reports from trekkers</small></article>
        <article><span className="dashboard-stat-icon">◷</span><span>Your available time</span><strong>{profile.availableHours} hrs</strong><small>{profile.fitness} · {profile.experience}</small></article>
      </section>
      <section className="dashboard-profile-panel">
        <div><span className="eyebrow">YOUR PROFILE</span><h3>{account ? account.name : "Browse as a guest"}</h3><p>{account ? account.email : "Create an account to save your profile details for this session."}</p></div>
        <div className="dashboard-profile-tags"><span>{profile.fitness} fitness</span><span>{profile.experience} experience</span><span>{profile.preferredDifficulty} difficulty</span></div>
        <button className="text-button" onClick={() => account ? goTo("account") : openAccount("register")}>{account ? "Manage profile" : "Create an account"} →</button>
      </section>
      <section className="section-heading"><div><span className="eyebrow">MATCHED TO YOUR PACE</span><h2>Recommended for you</h2><p>Ranked by the project's fitness, experience and time rules—not a trained AI model.</p></div><button className="text-button" onClick={() => goTo("routes")}>All recommendations →</button></section>
      <div className="route-grid">{recommendedRoutes.length ? recommendedRoutes.map(route => <RouteCard key={route.id} route={{ ...route, reportCount: reportCounts[route.id] || 0 }} onReport={openReport} onReview={openReview} onInquiry={openInquiry} saved={savedRoutes.includes(route.id)} onSave={toggleSaved} t={t} />) : <p className="empty-state">Loading your route suggestions…</p>}</div>
      <section className="dashboard-shortcuts"><button onClick={() => goTo("maps")}><span>⌖</span><strong>Explore interactive maps</strong><small>Open a route location and elevation details</small></button><button onClick={() => goTo("safety")}><span>＋</span><strong>Plan a safe check-in</strong><small>Weather, trail notes and location sharing</small></button><button onClick={() => goTo("community")}><span>♡</span><strong>Visit the community</strong><small>Read reports and reviews</small></button></section>
    </main>}

    {activeTab === "favorites" && <main className="main-content page-main favorites-page">
      <section className="community-intro"><div><span className="eyebrow">{t("nav.favorites")}</span><h2>{t("favorites.title")}</h2><p>{t("favorites.intro")}</p></div><button className="button secondary" onClick={() => goTo("routes")}>{t("help.explore")} →</button></section>
      <div className="route-grid">{favoriteRoutes.length ? favoriteRoutes.map(route => <RouteCard key={route.id} route={{ ...route, reportCount: reportCounts[route.id] || 0 }} onReport={openReport} onReview={openReview} onInquiry={openInquiry} saved onSave={toggleSaved} t={t} />) : <div className="empty-state">{t("favorites.empty")}<button className="text-button" onClick={() => goTo("routes")}>{t("help.explore")} →</button></div>}</div>
    </main>}

    {activeTab === "help" && <main className="main-content page-main help-page">
      <section className="community-intro"><div><span className="eyebrow">{t("nav.help")} · TREKWISE GUIDE</span><h2>{t("help.title")}</h2><p>{t("help.intro")}</p></div><button className="button dark" onClick={() => goTo("routes")}>{t("help.explore")} →</button></section>
      <section className="help-steps" aria-label="Getting started">
        <article><span className="help-step-number">01</span><div><h3>{t("help.step1")}</h3><p>{t("help.step1.body")}</p><button className="text-button" onClick={() => { goTo("routes"); window.setTimeout(() => document.getElementById("profile-preferences")?.scrollIntoView({ behavior: "smooth", block: "center" }), 80); }}>{t("help.explore")} →</button></div></article>
        <article><span className="help-step-number">02</span><div><h3>{t("help.step2")}</h3><p>{t("help.step2.body")}</p><button className="text-button" onClick={() => goTo("routes")}>{t("help.explore")} →</button></div></article>
        <article><span className="help-step-number">03</span><div><h3>{t("help.step3")}</h3><p>{t("help.step3.body")}</p><button className="text-button" onClick={() => goTo("favorites")}>{t("help.favorites")} →</button></div></article>
      </section>
      <section className="help-faq"><span className="eyebrow">{t("help.faq")}</span><h3>{t("help.faq")}</h3><details><summary>{t("help.faq1")}</summary><p>{t("help.faq1.body")}</p></details><details><summary>{t("help.faq2")}</summary><p>{t("help.faq2.body")}</p></details><details><summary>{t("help.faq3")}</summary><p>{t("help.faq3.body")}</p></details></section>
      <button className="text-button back-link" onClick={() => openAccount("register")}>{t("help.account")} →</button>
    </main>}

    {activeTab === "inquiry" && <main className="main-content page-main inquiry-page">
      <section className="form-section inquiry-section"><span className="eyebrow">{t("route.inquiry")}</span><h2>{t("inquiry.title")}</h2><p>{t("inquiry.intro")}</p>
        <form className="stack-form inquiry-form" onSubmit={saveInquiryDraft}>
          <label>{t("inquiry.route")}<select required value={inquiryForm.routeId} onChange={event => setInquiryForm(form => ({ ...form, routeId: event.target.value }))}><option value="">Choose a trek</option>{(catalogRoutes.length ? catalogRoutes : routes).map(route => <option value={route.id} key={route.id}>{route.fort} — {route.routeName}</option>)}</select></label>
          <label>{t("inquiry.name")}<input required maxLength="100" autoComplete="name" value={inquiryForm.name} onChange={event => setInquiryForm(form => ({ ...form, name: event.target.value }))} /></label>
          <label>{t("inquiry.email")}<input type="email" autoComplete="email" value={inquiryForm.email} onChange={event => setInquiryForm(form => ({ ...form, email: event.target.value }))} /></label>
          <label>{t("inquiry.date")}<input type="date" value={inquiryForm.plannedDate} onChange={event => setInquiryForm(form => ({ ...form, plannedDate: event.target.value }))} /></label>
          <label>{t("inquiry.group")}<input type="number" min="1" max="30" step="1" required value={inquiryForm.groupSize} onChange={event => setInquiryForm(form => ({ ...form, groupSize: event.target.value }))} /></label>
          <label>{t("inquiry.message")}<textarea rows="4" maxLength="500" value={inquiryForm.message} onChange={event => setInquiryForm(form => ({ ...form, message: event.target.value }))} placeholder="Ask about availability, access, guide options or current prices."/></label>
          <div className="inquiry-actions"><button className="button dark" type="submit">{t("inquiry.save")} →</button><button className="button secondary" type="button" onClick={copyInquiryDraft}>{t("inquiry.copy")}</button></div>
        </form>
        <p className="inquiry-disclaimer" role="note">{t("inquiry.disclaimer")}</p><button className="text-button back-link" onClick={() => goTo("routes")}>← {t("common.back")}</button>
      </section>
    </main>}

    {activeTab === "maps" && <main className="main-content page-main maps-page">
      <section className="community-intro"><div><span className="eyebrow">FORT LOCATIONS · MAHARASHTRA</span><h2>Find your trailhead.</h2><p>Select a fort from the map or list to view its approximate location. OpenStreetMap links need an internet connection.</p></div></section>
      {selectedMapRoute ? <div className="map-layout">
        <section className="interactive-map-panel" aria-label={`Map of ${selectedMapRoute.fort}`}>
          <FortLocationMap routes={allRoutes} selectedRoute={selectedMapRoute} onSelect={setSelectedMapRouteId} />
          <div className="map-caption"><span><strong>{selectedMapRoute.fort}</strong><small>{selectedMapRoute.region} · {selectedMapRoute.latitude.toFixed(4)}, {selectedMapRoute.longitude.toFixed(4)}</small></span><a className="button dark" href={selectedMapRoute.mapUrl} target="_blank" rel="noreferrer">Open OpenStreetMap ↗</a></div>
        </section>
        <aside className="map-route-panel"><div className="map-route-heading"><span className="eyebrow">ALL SAMPLE FORTS</span><strong>{allRoutes.length} locations</strong></div>
          <div className="map-route-list">{allRoutes.map(route => <button key={route.id} className={`map-route-option ${selectedMapRoute.id === route.id ? "selected" : ""}`} onClick={() => setSelectedMapRouteId(route.id)}>
            <span className="map-route-pin">⌖</span><span className="map-route-copy"><strong>{route.fort}</strong><small>{route.region} · {route.difficulty}</small><small>{route.distanceKm} km · +{route.elevationGainM} m ascent</small></span><span className="feature-arrow">↗</span>
          </button>)}</div>
          <div className="map-note"><strong>Map and elevation limits</strong><p>Markers show sample fort locations, not verified hiking tracks. Elevation gain is sample data; this prototype does not provide live GPS tracking, offline maps or turn-by-turn trail navigation.</p></div>
        </aside>
      </div> : <p className="empty-state">Routes are loading. Please wait a moment.</p>}
      <section className="map-elevation-card"><div><span className="eyebrow">ELEVATION SNAPSHOT</span><h3>{selectedMapRoute ? selectedMapRoute.fort : "Trail overview"}</h3><p>Approximate elevation gain for the selected sample route. Confirm the current trail profile and conditions locally.</p></div>{selectedMapRoute && <div className="elevation-value"><strong>{selectedMapRoute.elevationGainM} m</strong><span>sample ascent</span></div>}</section>
      <RouteSketch />
    </main>}

    {activeTab === "smart" && <SmartFeatures routes={allRoutes} onReport={openSmartReport} />}
    {activeTab === "advanced" && <AdvancedFeatures routes={allRoutes} reports={reports} />}

    {activeTab === "report" && <main className="main-content page-main"><section className="form-section"><span className="eyebrow">COMMUNITY CARE</span><h2>Share a trail observation</h2><p>Recent, thoughtful reports help other trekkers plan. Reports are pending review and are not automatically verified.</p>
      <form className="stack-form" onSubmit={sendReport}><label>Fort / route<select required value={reportForm.routeId} onChange={e => setReportForm(p => ({ ...p, routeId: e.target.value }))}><option value="">Choose a route</option>{routes.map(r => <option value={r.id} key={r.id}>{r.fort} — {r.routeName}</option>)}</select></label><label>What did you notice?<select value={reportForm.type} onChange={e => setReportForm(p => ({ ...p, type: e.target.value }))}><option>Slippery trail</option><option>Blocked path</option><option>Landslide</option><option>Low water</option><option>Other</option></select></label><label>Your observation<textarea required minLength="5" maxLength="500" rows="4" value={reportForm.description} onChange={e => setReportForm(p => ({ ...p, description: e.target.value }))} placeholder="Where and when did you notice it? Please leave out private information."/></label><button className="button dark" type="submit">Submit for review →</button></form>
      <button className="text-button back-link" onClick={() => goTo("community")}>← Back to community</button>
    </section></main>}

    {activeTab === "community" && <main className="main-content page-main"><section className="community-intro"><div><span className="eyebrow">THE TRAIL IS BETTER TOGETHER</span><h2>Notes from the community.</h2><p>Real observations make better plans. Reports here are unverified until reviewed—always confirm locally.</p></div><div className="community-actions"><button className="button secondary" onClick={() => goTo("reviews")}>Read trek reviews</button><button className="button dark" onClick={() => { setReportForm({ routeId: "", type: "Slippery trail", description: "" }); goTo("report"); }}>＋ Share an update</button></div></section>
      <div className="community-banner"><div><span>✳ COMMUNITY FIELD NOTES</span><h3>Leave the trail better informed.</h3><p>Share useful observations about access, trail surfaces and water points.</p></div><div className="community-banner-mark">TW<br/>✳</div></div>
      <div className="community-summary"><div><strong>{reports.length}</strong><span>Total community notes</span></div><div><strong>{verifiedCount}</strong><span>Verified notes</span></div><div><strong>{routes.length}</strong><span>Routes covered</span></div></div>
      <h3 className="subheading">Recent trail notes</h3>{reports.length ? <div className="reports-list">{reports.slice().reverse().map(r => <div className="report-row" key={r._id || r.createdAt}><span className="report-symbol">⌖</span><div className="report-content"><strong>{r.type}</strong><p>{r.description}</p><small>{routes.find(route => route.id === r.routeId)?.fort || "Trail"} · {new Date(r.createdAt).toLocaleString()}</small></div><span className={`pending ${r.status === "Verified" ? "verified" : ""}`}>{r.status || "Pending review"}</span></div>)}</div> : <p className="empty-state">No community notes yet. Be the first to share an observation.</p>}
    </main>}

    {activeTab === "reviews" && <main className="main-content page-main"><section className="community-intro"><div><span className="eyebrow">AFTER THE ADVENTURE</span><h2>Your trek. Your story.</h2><p>Share an honest review after completing a fort trek. Your notes help the next explorer know what to expect.</p></div><span className="review-total">{reviews.length} {reviews.length === 1 ? "review" : "reviews"}</span></section>
      <div className="review-layout">
        <section className="review-compose"><div className="review-form-heading"><span className="review-icon">✎</span><div><span className="eyebrow">COMMUNITY REVIEW</span><h3>How was your trek?</h3><p>Tell other trekkers what the trail was really like.</p></div></div>
          <form className="stack-form review-form" onSubmit={submitReview}>
            <label>Fort / route<select required value={reviewDraft.routeId} onChange={e => setReviewDraft(p => ({ ...p, routeId: e.target.value }))}><option value="">Choose the trek you completed</option>{routes.map(route => <option value={route.id} key={route.id}>{route.fort} — {route.routeName}</option>)}</select></label>
            <div className="review-rating-field"><span id="review-rating-label">Your overall rating</span><div className="review-star-picker" role="radiogroup" aria-labelledby="review-rating-label">{[1, 2, 3, 4, 5].map(rating => <button key={rating} type="button" role="radio" aria-checked={reviewDraft.rating === rating} aria-label={`${rating} ${rating === 1 ? "star" : "stars"}`} className={rating <= reviewDraft.rating ? "star-selected" : ""} onClick={() => setReviewDraft(p => ({ ...p, rating }))}>★</button>)}</div></div>
            <label>Review title<input required maxLength="80" value={reviewDraft.title} onChange={e => setReviewDraft(p => ({ ...p, title: e.target.value }))} placeholder="Sum up your trek in a few words"/></label>
            <label>What should other trekkers know?<textarea required minLength="15" maxLength="1000" rows="5" value={reviewDraft.experience} onChange={e => setReviewDraft(p => ({ ...p, experience: e.target.value }))} placeholder="Describe the trail, views, difficulty and anything you wish you had known."/></label>
            <label className="review-confirmation"><input required type="checkbox" checked={reviewDraft.completed} onChange={e => setReviewDraft(p => ({ ...p, completed: e.target.checked }))}/><span>I completed this trek and this review reflects my own experience.</span></label>
            <button className="button dark" type="submit">Post my review →</button>
            <p className="review-storage-note">Reviews are saved in this browser on this device for this project demo.</p>
          </form>
        </section>
        <section className="review-list-panel"><div className="review-list-header"><div><span className="eyebrow">TREKKER VOICES</span><h3>Recent reviews</h3></div><label className="review-filter">Filter<select value={reviewFilter} onChange={e => setReviewFilter(e.target.value)}><option value="all">All forts</option>{routes.map(route => <option value={route.id} key={route.id}>{route.fort}</option>)}</select></label></div>
          <div className="review-score-summary"><strong>{visibleReviews.length ? reviewAverage.toFixed(1) : "—"}</strong><div><span className="review-summary-stars" aria-label={`${reviewAverage.toFixed(1)} out of 5 stars`}>{"★".repeat(Math.round(reviewAverage))}{"☆".repeat(5 - Math.round(reviewAverage))}</span><small>{visibleReviews.length ? `Based on ${visibleReviews.length} ${visibleReviews.length === 1 ? "review" : "reviews"}` : "No reviews for this selection yet"}</small></div></div>
          {visibleReviews.length ? <div className="review-list">{visibleReviews.map(review => <article className="review-entry" key={review.id}><div className="review-entry-top"><div><strong>{review.title}</strong><span className="review-entry-route">{review.routeName}</span></div><span className="review-entry-stars" aria-label={`${review.rating} out of 5 stars`}>{"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}</span></div><p>{review.experience}</p><div className="review-entry-meta"><span>{review.author}</span><span>{new Date(review.createdAt).toLocaleDateString()}</span></div></article>)}</div> : <div className="review-empty"><span>✦</span><strong>No reviews yet</strong><p>Just finished a trek? Be the first to share what it was like.</p></div>}
        </section>
      </div>
    </main>}

    {activeTab === "heritage" && <main className="main-content page-main"><section className="community-intro"><div><span className="eyebrow">HISTORY LIVES UP HERE</span><h2>Explore the heritage.</h2><p>Every fort has a story. Get to know the places behind your next climb.</p></div><span className="heritage-stamp">SAHYADRI<br/>ARCHIVE · 01</span></section>    <div className="heritage-grid">{routes.map((route, index) => <article className="heritage-card" key={route.id}><div className="heritage-image" style={{ backgroundImage: `url("${routeImages[route.id] || routeImages["raigad-pachad"]}")` }}><span>FORT · 0{index + 1}</span><ImageCredit routeId={route.id} /></div><div className="heritage-content"><span className="eyebrow">{route.region}</span><h3>{route.fort}</h3><p>{route.heritage}</p><a className="text-button" href={route.mapUrl} target="_blank" rel="noreferrer">Explore location ↗</a></div></article>)}</div><p className="heritage-note">Historical summaries and route details are introductory sample content. Verify historical and access information with trusted local sources.</p></main>}

    {activeTab === "safety" && <main className="main-content page-main"><section className="community-intro"><div><span className="eyebrow">A THOUGHTFUL PLAN IS A SAFER PLAN</span><h2>Make room for the unexpected.</h2><p>Simple tools to prepare, check in and stay aware on the trail.</p></div><span className="safety-status"><span className="live-dot"></span> PLAN AHEAD</span></section>
      <div className="safety-grid"><article className="safety-card sos-card" id="sos-checkin"><span className="safety-emblem">⌖</span><span className="eyebrow">PERSONAL CHECK-IN</span><h3>Share your location.</h3><p>Send your current location link to a trusted contact before or during a trek. Location is only accessed when you tap below.</p><button className="button sos-button" onClick={shareLocation}>Share my location ↗</button>{locationStatus && <p className="location-status" role="status">{locationStatus}</p>}<small>TrekWise is not an emergency service and does not dispatch help.</small></article>
      <article className="safety-card checklist-card"><span className="eyebrow">BEFORE YOU SET OFF</span><h3>Your trail checklist</h3><ul><li><span>✓</span> Check local weather and official alerts</li><li><span>✓</span> Tell someone your route and return time</li><li><span>✓</span> Carry water, suitable footwear and a charged phone</li><li><span>✓</span> Confirm access and trail conditions locally</li><li><span>✓</span> Turn back if conditions become unsafe</li></ul></article></div>
      <RouteSketch /><div className="safety-disclaimer"><strong>Safety data, clearly explained</strong><p>Route indicators are computed from sample route data, available weather results and community reports. They are not verified real-time risk assessments, and a high score does not mean a route is safe. Use local authorities and experienced guides as your source of truth.</p></div>
    </main>}

    {activeTab === "admin" && <main className="main-content page-main"><section className="community-intro"><div><span className="eyebrow">OPERATIONS · PREVIEW</span><h2>Admin dashboard.</h2><p>A high-level snapshot of routes and community reports in this demo.</p></div><span className="demo-label">DEMO PREVIEW</span></section><div className="admin-stats"><article><span>Routes in catalog</span><strong>{routes.length}</strong><small>Sample route records</small></article><article><span>Community reports</span><strong>{reports.length}</strong><small>{verifiedCount} marked verified</small></article><article><span>Pending review</span><strong>{reports.filter(r => (r.status || "Pending review") !== "Verified").length}</strong><small>Needs administrator review</small></article><article><span>Saved by you</span><strong>{savedRoutes.length}</strong><small>This browser session</small></article></div><div className="admin-preview"><div><span className="eyebrow">ADMIN CONTROLS</span><h3>Manage routes, users and reports</h3><p>Administrative editing and user management are not connected in this prototype. The backend currently supports public route reads and community report submissions.</p></div><button className="button dark" onClick={() => goTo("community")}>Review community notes →</button></div></main>}

    {activeTab === "account" && <main className="main-content page-main"><div className="auth-layout">
      <section className="form-section account-section"><span className="eyebrow">YOUR TREKWISE PROFILE</span><h2>{account ? `Hello, ${account.name}` : authMode === "register" ? t("auth.title") : "Welcome back."}</h2>{account ? <><p>You are signed in for this browser session. This prototype does not save a token between reloads.</p><div className="account-summary"><p><strong>Email:</strong> {account.email}</p><p><strong>Age:</strong> {account.age ? `${account.age} years` : "Not provided"}</p><p><strong>Fitness:</strong> {account.fitness}</p><p><strong>Experience:</strong> {account.experience}</p><p><strong>Time available:</strong> {account.availableHours} hours</p><button className="button secondary" onClick={() => { setAccount(null); setMessage("Signed out."); }}>Sign out</button></div></> : <><p>{t("auth.intro")}</p><div className="auth-toggle"><button className={authMode === "register" ? "selected" : ""} onClick={() => setAuthMode("register")} type="button">{t("auth.create")}</button><button className={authMode === "login" ? "selected" : ""} onClick={() => setAuthMode("login")} type="button">{t("auth.login")}</button></div><form className="stack-form auth-form" onSubmit={handleAuth}>{authMode === "register" && <><label>{t("auth.name")}<input required autoComplete="name" value={authForm.name} onChange={e => setAuthForm(p => ({ ...p, name: e.target.value }))} placeholder={t("auth.name")}/></label><label>{t("profile.age")}<input type="number" min="13" max="100" step="1" value={profile.age} onChange={e => updateProfile("age", e.target.value)} placeholder="13–100"/></label></>}<label>{t("auth.email")}<input required type="email" autoComplete="email" value={authForm.email} onChange={e => setAuthForm(p => ({ ...p, email: e.target.value }))} placeholder="you@example.com"/></label><label>{t("auth.password")}<input required minLength="6" type="password" autoComplete={authMode === "register" ? "new-password" : "current-password"} value={authForm.password} onChange={e => setAuthForm(p => ({ ...p, password: e.target.value }))} placeholder="At least 6 characters"/></label>{authMode === "register" && <><div className="auth-preferences-heading"><strong>Make recommendations yours</strong><span>Age is optional: it only gently adjusts ranking, never route access.</span></div><div className="auth-profile-fields"><label>{t("profile.fitness")}<select value={profile.fitness} onChange={e => updateProfile("fitness", e.target.value)}><option>Beginner</option><option>Moderate</option><option>Advanced</option></select></label><label>{t("profile.experience")}<select value={profile.experience} onChange={e => updateProfile("experience", e.target.value)}><option>Beginner</option><option>Moderate</option><option>Advanced</option></select></label><label>{t("profile.time")}<select value={profile.availableHours} onChange={e => updateProfile("availableHours", e.target.value)}>{[1, 2, 3, 4, 6, 8].map(hours => <option value={hours} key={hours}>{hours} {hours === 1 ? t("time.hour") : t("time.hours")}</option>)}</select></label><label>{t("profile.difficulty")}<select value={profile.preferredDifficulty} onChange={e => updateProfile("preferredDifficulty", e.target.value)}><option value="Any">{t("filters.any")}</option><option value="Easy">{t("difficulty.easy")}</option><option value="Moderate">{t("difficulty.moderate")}</option><option value="Hard">{t("difficulty.hard")}</option></select></label></div></>}<button className="button dark" type="submit">{authMode === "register" ? `${t("auth.submit")} →` : `${t("auth.login")} →`}</button><p className="muted">Demo accounts are kept in memory when MongoDB is not configured. Use a test password, not one from another account.</p></form></>}</section>
      <aside className="auth-welcome-panel"><span className="auth-welcome-mark">⌁</span><span className="eyebrow">A BETTER WAY TO PLAN</span><h3>More trail, less guesswork.</h3><p>Create a profile to make TrekWise feel more like your own.</p><ul><li><span>✦</span> Suggestions matched to your pace</li><li><span>⌖</span> Your route preferences in one place</li><li><span>♡</span> Save trails for another day</li></ul><small>New here? Choose “Create account” to get started. No sign-in is needed to browse.</small></aside>
    </div></main>}

    <footer><div className="footer-inner"><div><a href="#" className="brand footer-logo" onClick={(e) => { e.preventDefault(); goTo("routes"); }}><span className="brand-mark">⌁</span><span>TrekWise<small>FIND YOUR WILD</small></span></a><p>Explore heritage. Respect nature. Plan responsibly.</p></div></div><div className="footer-bottom"><small>Academic prototype · Route information is sample data and must be verified locally.</small><small>Made for the mountains ♡</small></div></footer>
  </div>;
}
