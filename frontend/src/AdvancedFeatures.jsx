import { useEffect, useMemo, useRef, useState } from "react";
import { getWeather } from "./api";
import { estimateTrekBudget } from "./routeBudget";

const advancedTools = [
  { id: "checkin", number: "06", label: "Smart check-in", icon: "◷" },
  { id: "offline", number: "07", label: "Offline emergency", icon: "⌂" },
  { id: "risk", number: "08", label: "Route risk map", icon: "△" },
  { id: "heritage", number: "09", label: "AR heritage", icon: "⌖" },
  { id: "game", number: "10", label: "Trek rewards", icon: "✦" },
  { id: "packing", number: "11", label: "Packing assistant", icon: "▣" },
  { id: "budget", number: "12", label: "Group budget", icon: "₹" },
  { id: "voice", number: "13", label: "Voice guide", icon: "◖" },
];

const rank = { Beginner: 1, Moderate: 2, Advanced: 3 };
const heritageImages = {
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
const heritageMarkers = {
  "raigad-pachad": [
    { id: "maha-darwaja", title: "Maha Darwaja", detail: "A prominent fortified entrance within the historic Raigad complex." },
    { id: "jagdishwar-temple", title: "Jagdishwar Temple", detail: "A notable temple on the fort; confirm current access and opening conditions locally." },
  ],
  "sinhagad-pune": [
    { id: "tanaji-memorial", title: "Tanaji Malusare memorial", detail: "Sinhagad is associated with Tanaji Malusare and the 1670 Battle of Sinhagad." },
    { id: "kalyan-darwaja", title: "Kalyan Darwaja", detail: "One of the historic gateways associated with the Sinhagad fort complex." },
  ],
  "pratapgad-mahabaleshwar": [
    { id: "bhavani-temple", title: "Bhavani Temple", detail: "A well-known temple within the Pratapgad complex; check local visitor guidance." },
    { id: "fort-history", title: "Fort history", detail: "Pratapgad is associated with the 1659 encounter between Shivaji Maharaj and Afzal Khan." },
  ],
  "lohagad-lonavala": [
    { id: "vinchu-kata", title: "Vinchu Kata", detail: "A long fortified spur known for its shape, often compared to a scorpion's tail." },
    { id: "four-gates", title: "Fort gateways", detail: "The fort is known for a sequence of historic gateways on its approach." },
  ],
  "rajgad-fort": [
    { id: "padmavati-machi", title: "Padmavati Machi", detail: "One of Rajgad's prominent fortified spurs, with a temple and water cisterns." },
    { id: "sanjivani-machi", title: "Sanjivani Machi", detail: "A long fortification spur noted for its layered defensive walls." },
    { id: "balekilla", title: "Balekilla", detail: "The central citadel rises above Rajgad's surrounding machis." },
  ],
  "torna-fort": [
    { id: "budhla-machi", title: "Budhla Machi", detail: "A distinctive spur of Torna, also called Prachandagad." },
    { id: "zunjar-machi", title: "Zunjar Machi", detail: "A prominent fortified spur on Torna's extensive fort complex." },
  ],
};
const emergencyInstructions = [
  "Stop and move away from immediate hazards if you can do so safely.",
  "If in India, call 112 for emergency assistance; confirm the correct local number for your area.",
  "Tell a trusted person your route, last known location and expected return time.",
  "Preserve phone battery, stay with your group and follow local authority or guide instructions.",
  "Do not rely on this prototype to contact rescuers or transmit an SOS.",
];

function routeMap(route) {
  return `https://www.openstreetmap.org/?mlat=${route.latitude}&mlon=${route.longitude}#map=14/${route.latitude}/${route.longitude}`;
}

function formatInr(amount) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount);
}

function dateTimeLocalAfter(milliseconds) {
  const date = new Date(Date.now() + milliseconds);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

function downloadText(filename, content) {
  const file = new Blob([content], { type: "text/plain;charset=utf-8" });
  const link = document.createElement("a");
  const downloadUrl = URL.createObjectURL(file);
  link.href = downloadUrl;
  link.download = filename;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000);
}

function CheckInTool({ routes }) {
  const [routeId, setRouteId] = useState("");
  const [returnAt, setReturnAt] = useState(() => dateTimeLocalAfter(6 * 60 * 60 * 1000));
  const [checkIn, setCheckIn] = useState(null);
  const [now, setNow] = useState(Date.now());
  const [shareStatus, setShareStatus] = useState("");
  const route = routes.find(item => item.id === (routeId || routes[0]?.id));
  const checkInRoute = routes.find(item => item.id === checkIn?.routeId);
  const overdue = checkIn && now >= new Date(checkIn.returnAt).getTime();

  useEffect(() => {
    if (!checkIn) return undefined;
    const intervalId = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(intervalId);
  }, [checkIn]);

  const startCheckIn = event => {
    event.preventDefault();
    const selected = routes.find(item => item.id === (routeId || routes[0]?.id));
    if (!selected || new Date(returnAt).getTime() <= Date.now()) {
      setShareStatus("Choose a valid route and a return time in the future.");
      return;
    }
    setCheckIn({ routeId: selected.id, returnAt });
    setShareStatus("");
  };
  const sharePlan = async () => {
    if (!checkIn || !checkInRoute) return;
    const text = `TrekWise check-in: ${checkInRoute.fort}. Expected return: ${new Date(checkIn.returnAt).toLocaleString()}. Route map: ${routeMap(checkInRoute)}`;
    try {
      if (navigator.share) await navigator.share({ title: "TrekWise trek check-in", text });
      else if (navigator.clipboard) await navigator.clipboard.writeText(text);
      else throw new Error("Sharing or clipboard is not available in this browser.");
      setShareStatus("Share sheet opened or check-in copied. Confirm that your trusted contact receives it.");
    } catch (error) {
      if (error.name !== "AbortError") setShareStatus(error.message);
    }
  };

  return <section className="advanced-card">
    <ToolHeading icon="◷" eyebrow="SMART CHECK-IN" title="Set a return time and check in." description="This page can show an overdue reminder while open. It cannot send an automatic alert or guarantee background monitoring." />
    <form className="advanced-form checkin-form" onSubmit={startCheckIn}>
      <label>Planned route<select value={routeId || routes[0]?.id || ""} onChange={event => setRouteId(event.target.value)}>{routes.map(item => <option value={item.id} key={item.id}>{item.fort}</option>)}</select></label>
      <label>Expected return<input type="datetime-local" required min={dateTimeLocalAfter(60 * 1000)} value={returnAt} onChange={event => setReturnAt(event.target.value)} /></label>
      <button className="button dark" type="submit">Start check-in →</button>
    </form>
    {checkIn && checkInRoute && <div className={`checkin-status ${overdue ? "overdue" : ""}`} role="status">
      <span className="checkin-indicator"></span><div><strong>{overdue ? "Return time passed — contact your trusted person now." : "Check-in active for this browser session."}</strong><p>{checkInRoute.fort} · Expected return {new Date(checkIn.returnAt).toLocaleString()}</p></div>
      <div className="checkin-actions"><button className="button secondary" onClick={sharePlan}>Share plan manually</button><button className="text-button" onClick={() => { setCheckIn(null); setShareStatus("Checked out safely. This only updates the local page."); }}>Check out safely</button></div>
    </div>}
    {shareStatus && <p className="advanced-status" role="status">{shareStatus}</p>}
    <div className="advanced-warning"><strong>No automatic rescue alert.</strong><p>Share your plan with a trusted contact before departure. A missed check-out only changes this page if it is open; it does not call, text or notify anyone.</p></div>
  </section>;
}

function OfflineTool({ routes }) {
  const [online, setOnline] = useState(navigator.onLine);
  const [queuedMessage, setQueuedMessage] = useState("");
  const [status, setStatus] = useState("");
  const [routeId, setRouteId] = useState("");
  const route = routes.find(item => item.id === (routeId || routes[0]?.id));

  useEffect(() => {
    const updateStatus = () => setOnline(navigator.onLine);
    window.addEventListener("online", updateStatus);
    window.addEventListener("offline", updateStatus);
    try {
      const saved = window.localStorage.getItem("trekwise-offline-sos");
      if (saved) setQueuedMessage(saved);
    } catch (error) {
      setStatus(`Could not read the local SOS queue: ${error.message}`);
    }
    return () => {
      window.removeEventListener("online", updateStatus);
      window.removeEventListener("offline", updateStatus);
    };
  }, []);

  const downloadBrief = () => {
    if (!route) return;
    const content = [
      `TrekWise offline route briefing — ${route.fort}`,
      `Area: ${route.region}`,
      `Coordinates: ${route.latitude}, ${route.longitude}`,
      `Sample distance / duration / ascent: ${route.distanceKm} km / ${route.durationHours} hours / ${route.elevationGainM} m`,
      `Map link (requires internet): ${routeMap(route)}`,
      "",
      "Emergency reminders:",
      ...emergencyInstructions.map((instruction, index) => `${index + 1}. ${instruction}`),
      "",
      "Sample data only. This file is not an offline map or a rescue service.",
    ].join("\n");
    downloadText(`trekwise-${route.id}-emergency-brief.txt`, content);
    setStatus("Offline text briefing downloaded. It includes coordinates, not map tiles.");
  };
  const queueSos = () => {
    const message = `TrekWise SOS draft for ${route?.fort || "my trek"} — queued ${new Date().toLocaleString()}. This message has NOT been sent.`;
    try {
      window.localStorage.setItem("trekwise-offline-sos", message);
      setQueuedMessage(message);
      setStatus("SOS draft saved on this device only. It will not send automatically.");
    } catch (error) {
      setStatus(`Could not queue the SOS draft: ${error.message}`);
    }
  };
  const clearQueue = () => {
    try {
      window.localStorage.removeItem("trekwise-offline-sos");
      setQueuedMessage("");
      setStatus("Local SOS draft removed.");
    } catch (error) {
      setStatus(`Could not clear the local SOS draft: ${error.message}`);
    }
  };

  return <section className="advanced-card">
    <ToolHeading icon="⌂" eyebrow="OFFLINE EMERGENCY MODE" title="Keep essential instructions close." description="Save a plain-text route briefing and keep a local SOS draft. Neither action downloads map tiles or sends an alert." />
    <div className={`network-indicator ${online ? "online" : "offline"}`}><span></span>{online ? "Internet appears available" : "Offline — only local information is available"}</div>
    <label className="advanced-select-label">Route briefing<select value={routeId || routes[0]?.id || ""} onChange={event => setRouteId(event.target.value)}>{routes.map(item => <option value={item.id} key={item.id}>{item.fort}</option>)}</select></label>
    <div className="offline-content-grid"><article className="offline-instructions"><span className="eyebrow">EMERGENCY REMINDERS</span><ol>{emergencyInstructions.map(item => <li key={item}>{item}</li>)}</ol></article>
      <aside className="offline-actions"><button className="button dark" onClick={downloadBrief}>Download route & emergency briefing</button><button className="button secondary" onClick={queueSos}>Queue SOS draft on this device</button>{queuedMessage && <div className="queued-sos"><strong>Saved draft — not sent</strong><p>{queuedMessage}</p><button className="text-button" onClick={clearQueue}>Remove draft</button></div>}<p className="advanced-warning compact"><strong>Offline limits</strong><span>Instructions are available after this page loads. No offline map tiles, guaranteed app reload or automatic SOS delivery are provided.</span></p></aside>
    </div>
    {status && <p className="advanced-status" role="status">{status}</p>}
  </section>;
}

function RiskTool({ routes, reports }) {
  const [weatherByRoute, setWeatherByRoute] = useState({});
  const reportCounts = useMemo(() => reports.reduce((counts, report) => {
    counts[report.routeId] = (counts[report.routeId] || 0) + 1;
    return counts;
  }, {}), [reports]);
  const checkWeather = async route => {
    setWeatherByRoute(current => ({ ...current, [route.id]: { loading: true } }));
    try {
      const weather = await getWeather(route.latitude, route.longitude);
      setWeatherByRoute(current => ({ ...current, [route.id]: { ...weather } }));
    } catch (error) {
      setWeatherByRoute(current => ({ ...current, [route.id]: { error: error.message } }));
    }
  };
  const riskFor = route => {
    const count = reportCounts[route.id] || 0;
    const weather = weatherByRoute[route.id];
    if (route.safetyScore < 50 || count >= 2 || weather?.rainRisk === "high") return { level: "high", label: "High caution", count };
    if (route.safetyScore < 75 || count > 0 || weather?.rainRisk === "medium") return { level: "caution", label: "Caution", count };
    if (route.trailCondition === "Unknown") return { level: "unknown", label: "Unknown — verify locally", count };
    return { level: "clear", label: "No flags in sample data", count };
  };

  return <section className="advanced-card">
    <ToolHeading icon="△" eyebrow="ROUTE RISK OVERVIEW" title="Review route-level caution indicators." description="Combines sample route indicators, community report counts and optional weather results. It does not show individual trail segments." />
    <div className="risk-legend"><span><i className="risk-dot unknown"></i> Unknown</span><span><i className="risk-dot caution"></i> Caution</span><span><i className="risk-dot high"></i> High caution</span></div>
    <div className="risk-route-list">{routes.map(route => {
      const risk = riskFor(route);
      const weather = weatherByRoute[route.id];
      return <article className={`risk-route-card ${risk.level}`} key={route.id}>
        <div className="risk-route-title"><span className="risk-dot"></span><div><strong>{route.fort}</strong><small>{route.region} · {route.difficulty}</small></div><b>{risk.label}</b></div>
        <div className="risk-route-details"><span>Trail: {route.trailCondition}</span><span>Sample indicator: {route.safetyScore}/100</span><span>{risk.count} community {risk.count === 1 ? "report" : "reports"} (unverified)</span></div>
        <div className="risk-weather-row"><button className="text-button" onClick={() => checkWeather(route)} disabled={weather?.loading}>{weather?.loading ? "Checking weather…" : "Check available forecast"}</button>
          {weather?.error && <span role="status">Forecast unavailable: {weather.error}</span>}
          {weather && !weather.error && !weather.loading && <span role="status">{weather.temperatureC}°C · {weather.description} · Rain risk: {weather.rainRisk}</span>}
        </div>
        {weather && !weather.loading && !weather.error && ["high", "medium"].includes(weather.rainRisk) && <p className="risk-weather-warning">Weather service reports {weather.rainRisk} rain risk. Check official alerts and local conditions before travelling.</p>}
      </article>;
    })}</div>
    <div className="advanced-warning"><strong>Not a live risk map.</strong><p>These are fort-level sample indicators, not a hazard heatmap of the trail. Reports may be unverified; unknown data does not mean safe. Confirm conditions with local authorities and experienced guides.</p></div>
  </section>;
}

function HeritageTool({ routes }) {
  const [routeId, setRouteId] = useState("");
  const [cameraStream, setCameraStream] = useState(null);
  const [cameraStatus, setCameraStatus] = useState("");
  const [selectedMarkerId, setSelectedMarkerId] = useState("");
  const videoRef = useRef(null);
  const route = routes.find(item => item.id === (routeId || routes[0]?.id));
  const markers = heritageMarkers[route?.id] || [{
    id: "fort-overview",
    title: "Fort overview",
    detail: route?.heritage || "Historical details are not available for this fort yet.",
  }];
  const selectedMarker = markers.find(marker => marker.id === selectedMarkerId) || markers[0];
  const image = heritageImages[route?.id];

  useEffect(() => {
    if (videoRef.current && cameraStream) videoRef.current.srcObject = cameraStream;
  }, [cameraStream]);
  useEffect(() => () => cameraStream?.getTracks().forEach(track => track.stop()), [cameraStream]);
  useEffect(() => setSelectedMarkerId(""), [route?.id]);
  const startCamera = async () => {
    setCameraStatus("");
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraStatus("Camera access is not available in this browser. You can still read the fort information below.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: false });
      setCameraStream(stream);
      setCameraStatus("Camera preview is on this device only. No image is recorded or uploaded.");
    } catch (error) {
      setCameraStatus(`Could not open the camera: ${error.message}`);
    }
  };
  const stopCamera = () => {
    cameraStream?.getTracks().forEach(track => track.stop());
    setCameraStream(null);
    setCameraStatus("Camera preview stopped.");
  };

  return <section className="advanced-card">
    <ToolHeading icon="⌖" eyebrow="AR HERITAGE EXPLORER · PREVIEW" title="Explore fort stories with virtual markers." description="Choose a local fort photo or turn on your camera, then tap a marker to read a short historical fact." />
    <label className="advanced-select-label">Fort<select value={routeId || routes[0]?.id || ""} onChange={event => setRouteId(event.target.value)}>{routes.map(item => <option value={item.id} key={item.id}>{item.fort}</option>)}</select></label>
    <div className="heritage-camera-grid"><div className="heritage-camera-view">{cameraStream ? <video ref={videoRef} autoPlay playsInline muted aria-label="Local camera preview" /> : image ? <img className="heritage-photo" src={image} alt={`${route?.fort} historical reference photo`} /> : <div className="camera-placeholder"><span>⌖</span><strong>Photo unavailable</strong></div>}
      {markers.map((marker, index) => <button key={marker.id} type="button" className={`heritage-marker ${selectedMarker?.id === marker.id ? "selected" : ""}`} style={{ top: `${28 + (index % 3) * 20}%`, left: `${24 + (index % 2) * 42}%` }} onClick={() => setSelectedMarkerId(marker.id)} aria-pressed={selectedMarker?.id === marker.id} aria-label={`Show ${marker.title} fact`}><span>{index + 1}</span><strong>{marker.title}</strong></button>)}
      <div className="heritage-camera-overlay"><span>{cameraStream ? "CAMERA PREVIEW · SAMPLE MARKERS" : "FORT PHOTO · SAMPLE MARKERS"}</span><strong>{route?.fort}</strong><small>{route?.region}</small></div></div>
      <article className="heritage-fact">{image && <img className="heritage-fact-image" src={image} alt={`${route?.fort} fort`} />}<span className="eyebrow">HISTORICAL STORY · {selectedMarker?.title}</span><h4>{route?.fort || "Select a fort"}</h4><p>{selectedMarker?.detail || route?.heritage || "Fort details will appear here."}</p><small>Introductory historical information. Marker positions are illustrative, not camera-tracked; verify details and access with trusted local sources.</small><div className="camera-actions">{cameraStream ? <button className="button secondary" onClick={stopCamera}>Stop camera</button> : <button className="button dark" onClick={startCamera}>Start camera preview</button>}</div></article>
    </div>
    {cameraStatus && <p className="advanced-status" role="status">{cameraStatus}</p>}
  </section>;
}

function GameTool({ routes }) {
  const storageKey = "trekwise-completed-routes";
  const monthKey = (() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  })();
  const monthlyStorageKey = `${storageKey}-${monthKey}`;
  const [completedIds, setCompletedIds] = useState([]);
  const [monthlyCompletedIds, setMonthlyCompletedIds] = useState([]);
  const [status, setStatus] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [certificateRouteId, setCertificateRouteId] = useState("");
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (!Array.isArray(parsed) || parsed.some(id => typeof id !== "string")) throw new Error("Saved trek progress is invalid.");
        setCompletedIds(parsed);
      }
      const monthlySaved = window.localStorage.getItem(monthlyStorageKey);
      if (monthlySaved) {
        const parsedMonthly = JSON.parse(monthlySaved);
        if (!Array.isArray(parsedMonthly) || parsedMonthly.some(id => typeof id !== "string")) throw new Error("Saved monthly trek progress is invalid.");
        setMonthlyCompletedIds(parsedMonthly);
      }
    } catch (error) {
      setStatus(`Could not load local progress: ${error.message}`);
    }
  }, []);
  useEffect(() => {
    if (!certificateRouteId) return undefined;
    const timerId = window.setTimeout(() => window.print(), 100);
    const clearCertificate = () => setCertificateRouteId("");
    window.addEventListener("afterprint", clearCertificate);
    return () => {
      window.clearTimeout(timerId);
      window.removeEventListener("afterprint", clearCertificate);
    };
  }, [certificateRouteId]);
  const selectedRoute = routes.find(route => route.id === (selectedId || routes[0]?.id));
  const certificateRoute = routes.find(route => route.id === certificateRouteId);
  const points = completedIds.length * 100;
  const levelThresholds = [
    { name: "New Trekker", minimum: 0, next: 100 },
    { name: "Trail Scout", minimum: 100, next: 300 },
    { name: "Trail Explorer", minimum: 300, next: 500 },
    { name: "Sahyadri Pro", minimum: 500, next: null },
  ];
  const level = levelThresholds.find(item => points < item.next || item.next === null);
  const levelProgress = level.next === null ? 100 : Math.min(100, ((points - level.minimum) / (level.next - level.minimum)) * 100);
  const addCompletion = () => {
    if (!selectedRoute || completedIds.includes(selectedRoute.id)) return;
    const updated = [...completedIds, selectedRoute.id];
    const updatedMonthly = [...new Set([...monthlyCompletedIds, selectedRoute.id])];
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(updated));
      window.localStorage.setItem(monthlyStorageKey, JSON.stringify(updatedMonthly));
      setCompletedIds(updated);
      setMonthlyCompletedIds(updatedMonthly);
      setStatus(`${selectedRoute.fort} added to your personal, self-reported trek log.`);
    } catch (error) {
      setStatus(`Could not save your local trek log: ${error.message}`);
    }
  };
  const printCertificate = () => {
    if (!selectedRoute || !completedIds.includes(selectedRoute.id)) return;
    setCertificateRouteId(selectedRoute.id);
  };
  const previewLeaderboard = [
    { name: "Sample Summit Seeker", points: 1200 },
    { name: "Sample Trail Keeper", points: 900 },
    { name: "Sample Fort Explorer", points: 600 },
    { name: "You · this browser", points: monthlyCompletedIds.length * 100, local: true },
  ];
  const leaderboard = previewLeaderboard.slice().sort((a, b) => b.points - a.points);
  const milestones = [
    { count: 1, title: "First steps" },
    { count: 3, title: "Trail collector" },
    { count: 5, title: "Fort explorer" },
    { count: Math.max(6, routes.length), title: "Sahyadri champion" },
  ];

  return <section className="advanced-card">
    <ToolHeading icon="✦" eyebrow="TREK REWARDS" title="Celebrate your own progress." description="Log a completed trek, earn local points, unlock milestone badges and print a personal certificate." />
    <div className="game-progress-card"><div className="game-level-mark">✦</div><div><span className="eyebrow">YOUR LOCAL LEVEL</span><h4>{level.name}</h4><p>{points} points · {completedIds.length} self-reported {completedIds.length === 1 ? "trek" : "treks"}</p></div><div className="game-progress-bar"><span style={{ width: `${levelProgress}%` }} /></div></div>
    <div className="game-actions"><label className="advanced-select-label">Completed trek<select value={selectedId || routes[0]?.id || ""} onChange={event => setSelectedId(event.target.value)}>{routes.map(route => <option value={route.id} key={route.id}>{route.fort}</option>)}</select></label><button className="button dark" disabled={!selectedRoute || completedIds.includes(selectedRoute.id)} onClick={addCompletion}>{selectedRoute && completedIds.includes(selectedRoute.id) ? "Already in trek log" : "I completed this trek"}</button><button className="button secondary" disabled={!selectedRoute || !completedIds.includes(selectedRoute.id)} onClick={printCertificate}>Print / save certificate</button></div>
    <div className="game-badges"><span className="eyebrow">MILESTONE BADGES</span><div>{milestones.map(badge => <span className={`game-badge ${completedIds.length >= badge.count ? "earned" : "locked"}`} key={badge.title} aria-label={`${badge.title}${completedIds.length >= badge.count ? " earned" : " locked"}`}>{completedIds.length >= badge.count ? "✦" : "○"} {badge.title} · {badge.count}</span>)}</div></div>
    <div className="sample-leaderboard"><div><span className="eyebrow">MONTHLY LEADERBOARD</span><span className="sample-tag">LOCAL + SAMPLE</span></div>{leaderboard.map((entry, index) => <div className={`leader-row ${entry.local ? "local-player" : ""}`} key={entry.name}><span>0{index + 1}</span><strong>{entry.name}</strong><b>{entry.points} pts</b></div>)}</div>
    {certificateRoute && <article className="certificate-print"><span>TREKWISE · PERSONAL ACHIEVEMENT</span><h1>Trek completed</h1><h2>{certificateRoute.fort}</h2><p>This self-reported trek has been added to your personal TrekWise log.</p><small>Recorded {new Date().toLocaleDateString()} · Not an official or independently verified certificate</small></article>}
    {status && <p className="advanced-status" role="status">{status}</p>}
    <p className="advanced-note">Progress stays in this browser. Monthly ranking includes fictional sample entries and this device only; completions are self-reported and not verified.</p>
  </section>;
}

function PackingTool({ routes }) {
  const [routeId, setRouteId] = useState("");
  const [trekType, setTrekType] = useState("day");
  const [weather, setWeather] = useState(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [checked, setChecked] = useState([]);
  const [status, setStatus] = useState("");
  const route = routes.find(item => item.id === (routeId || routes[0]?.id));
  const rainy = weather && !weather.error && ["medium", "high"].includes(weather.rainRisk);
  const items = useMemo(() => {
    if (!route) return [];
    const baseItems = [
      "Drinking water — carry enough; refill availability is not confirmed.",
      "Food / energy snacks suited to the planned duration.",
      "Comfortable trekking shoes with suitable grip.",
      "Charged phone, offline contact details and power bank.",
      "Personal medication and a basic first-aid kit.",
      "Tell a trusted contact your route and expected return time.",
    ];
    if (trekType === "overnight") baseItems.push("Overnight layer, torch and confirmed accommodation or shelter plan.");
    if (route.difficulty === "Hard" || route.elevationGainM >= 500) baseItems.push("Trekking poles and extra rest / pacing plan for the ascent.");
    if (rainy) baseItems.push("Rain layer, dry bag and extra grip care; reconsider travel during severe weather.");
    else if (!weather || weather.error) baseItems.push("Weather protection — forecast unavailable, so check official alerts before departure.");
    if (route.durationHours >= 3) baseItems.push("Headlamp and extra snacks for a longer-than-planned return.");
    return baseItems;
  }, [route, rainy, trekType, weather]);
  const checkForecast = async () => {
    if (!route) return;
    setWeatherLoading(true);
    setWeather(null);
    setStatus("");
    try {
      const result = await getWeather(route.latitude, route.longitude);
      setWeather(result);
      setChecked([]);
    } catch (error) {
      setWeather({ error: error.message });
      setStatus(`Forecast unavailable: ${error.message}`);
      setChecked([]);
    } finally {
      setWeatherLoading(false);
    }
  };
  const toggleItem = item => setChecked(current => current.includes(item) ? current.filter(entry => entry !== item) : [...current, item]);

  return <section className="advanced-card">
    <ToolHeading icon="▣" eyebrow="SMART PACKING ASSISTANT" title="Pack for the route, not guesswork." description="Checklist suggestions adapt to route duration, difficulty, trek type and an optional forecast lookup." />
    <div className="packing-controls"><label className="advanced-select-label">Route<select value={routeId || routes[0]?.id || ""} onChange={event => { setRouteId(event.target.value); setWeather(null); setChecked([]); }}>{routes.map(item => <option value={item.id} key={item.id}>{item.fort} · {item.difficulty}</option>)}</select></label><label className="advanced-select-label">Trek type<select value={trekType} onChange={event => { setTrekType(event.target.value); setChecked([]); }}><option value="day">Day trek</option><option value="overnight">Overnight trek</option></select></label><button className="button secondary" onClick={checkForecast} disabled={weatherLoading}>{weatherLoading ? "Checking forecast…" : "Check available weather"}</button></div>
    {weather && !weather.error && <p className="packing-weather" role="status">Forecast for {weather.city || route?.region}: {weather.temperatureC}°C · {weather.description} · Rain risk {weather.rainRisk}. {weather.rainRisk === "high" ? "Avoid trekking in severe weather; confirm official alerts." : ""}</p>}
    <div className="packing-progress"><span>{checked.length} of {items.length} items checked</span><div><span style={{ width: `${items.length ? checked.length / items.length * 100 : 0}%` }} /></div></div>
    <div className="packing-list">{items.map(item => <label className={`packing-item ${checked.includes(item) ? "checked" : ""}`} key={item}><input type="checkbox" checked={checked.includes(item)} onChange={() => toggleItem(item)} /><span>{item}</span></label>)}</div>
    {status && <p className="advanced-status" role="status">{status}</p>}
    <p className="advanced-note">Weather lookup requires a configured weather API. This checklist is general guidance, not a verified gear list or safety assessment.</p>
  </section>;
}

function BudgetTool({ routes }) {
  const [routeId, setRouteId] = useState("");
  const [groupSize, setGroupSize] = useState("4");
  const [hours, setHours] = useState("6");
  const [overnight, setOvernight] = useState(false);
  const route = routes.find(item => item.id === (routeId || routes[0]?.id));
  const budget = useMemo(
    () => route ? estimateTrekBudget(route, { groupSize, hours, overnight }) : null,
    [groupSize, hours, overnight, route]
  );

  return <section className="advanced-card">
    <ToolHeading icon="₹" eyebrow="SMART BUDGET CALCULATOR" title="Estimate and split a trek budget." description="Plan sample travel, meals, stay, entry, parking and basic gear costs for your group." />
    <div className="advanced-form budget-form">
      <label>Destination<select value={routeId || routes[0]?.id || ""} onChange={event => setRouteId(event.target.value)}>{routes.map(item => <option value={item.id} key={item.id}>{item.fort}</option>)}</select></label>
      <label>Group size<input type="number" min="1" max="30" step="1" value={groupSize} onChange={event => setGroupSize(event.target.value)} /></label>
      <label>Time (hours)<input type="number" min="1" max="24" step="0.5" value={hours} onChange={event => setHours(event.target.value)} /></label>
      <label className="advanced-checkbox"><input type="checkbox" checked={overnight} onChange={event => setOvernight(event.target.checked)} /><span>Include overnight accommodation</span></label>
    </div>
    {budget && <div className="budget-result"><div className="budget-cost-list">{Object.entries(budget.costs).filter(([, amount]) => amount > 0).map(([label, amount]) => <div key={label}><span>{label}</span><strong>{formatInr(amount)}</strong></div>)}</div><div className="budget-totals"><div><span>Estimated group total</span><strong>{formatInr(budget.total)}</strong></div><div><span>Estimated per person · {groupSize || 1} people</span><strong>{formatInr(budget.perPerson)}</strong></div></div></div>}
    <p className="advanced-warning"><strong>Sample estimates only.</strong><span>Actual travel, ticket, parking, accommodation and equipment prices vary. Confirm prices with providers; this does not reserve anything.</span></p>
  </section>;
}

function VoiceTool({ routes }) {
  const [routeId, setRouteId] = useState("");
  const [language, setLanguage] = useState("en");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);
  const shouldListenRef = useRef(false);
  const selectedRoute = routes.find(route => route.id === (routeId || routes[0]?.id));
  const languageOptions = { en: { locale: "en-IN", name: "English" }, hi: { locale: "hi-IN", name: "Hindi" }, mr: { locale: "mr-IN", name: "Marathi" } };
  const voiceContextRef = useRef({ route: selectedRoute, language });
  useEffect(() => {
    voiceContextRef.current = { route: selectedRoute, language };
  }, [language, selectedRoute]);
  const createBrief = (route, selectedLanguage) => route && (selectedLanguage === "en"
    ? `${route.fort}. This sample route is ${route.difficulty}, approximately ${route.durationHours} hours and ${route.elevationGainM} meters ascent. Check local conditions and official alerts before departure.`
    : selectedLanguage === "hi"
      ? `${route.fort}। यह नमूना रास्ता ${route.difficulty} कठिनाई का है, लगभग ${route.durationHours} घंटे और ${route.elevationGainM} मीटर चढ़ाई। जाने से पहले स्थानीय स्थिति और आधिकारिक चेतावनी जाँचें।`
      : `${route.fort}. हा नमुना मार्ग ${route.difficulty} कठीणतेचा आहे; अंदाजे ${route.durationHours} तास आणि ${route.elevationGainM} मीटर चढ. निघण्यापूर्वी स्थानिक परिस्थिती व अधिकृत सूचना तपासा.`);
  const brief = createBrief(selectedRoute, language);

  useEffect(() => () => {
    shouldListenRef.current = false;
    recognitionRef.current?.stop();
    window.speechSynthesis?.cancel();
  }, []);
  const speakBrief = () => {
    setStatus("");
    const { route, language: currentLanguage } = voiceContextRef.current;
    const currentBrief = createBrief(route, currentLanguage);
    if (!("speechSynthesis" in window)) {
      setStatus("Text-to-speech is not supported in this browser. Route details remain available on screen.");
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(currentBrief);
    utterance.lang = languageOptions[currentLanguage].locale;
    utterance.onerror = event => setStatus(`Could not play voice guidance: ${event.error}`);
    window.speechSynthesis.speak(utterance);
    setStatus(`Reading sample ${languageOptions[currentLanguage].name} route guidance. This is not turn-by-turn navigation.`);
  };
  const stopVoiceCommands = () => {
    shouldListenRef.current = false;
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    setIsListening(false);
    setStatus("Hands-free voice commands stopped.");
  };
  const startVoiceCommands = () => {
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) {
      setStatus("Voice commands are not supported in this browser. Use the on-screen controls instead.");
      return;
    }
    if (recognitionRef.current) recognitionRef.current.stop();
    const recognition = new Recognition();
    recognition.lang = languageOptions[language].locale;
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.onresult = event => {
      const spoken = event.results[event.results.length - 1]?.[0]?.transcript?.trim();
      if (!spoken) return;
      const { language: currentLanguage } = voiceContextRef.current;
      const command = spoken.toLocaleLowerCase(languageOptions[currentLanguage].locale);
      if (/\b(play|read|briefing)\b/.test(command) || /निर्देश सुनाओ|जानकारी सुनाओ/.test(command) || /सूचना ऐकवा|माहिती सांगा/.test(command)) {
        speakBrief();
        return;
      }
      if (/\b(stop|pause)\b/.test(command) || /रोकें|बंद करो/.test(command) || /थांबा|बंद करा/.test(command)) {
        window.speechSynthesis?.cancel();
        setStatus("Voice briefing stopped.");
        return;
      }
      const match = routes.find(route => command.includes(route.fort.toLocaleLowerCase(languageOptions[currentLanguage].locale))
        || (route.id === "sinhagad-pune" && command.includes("sinhagad")));
      if (match) {
        setRouteId(match.id);
        setQuery(spoken);
        setStatus(`Selected ${match.fort}. Say “play briefing” to hear its preparation summary.`);
      } else {
        setStatus(`Heard “${spoken}”. Say a fort name, “play briefing”, or “stop audio”.`);
      }
    };
    recognition.onerror = event => {
      shouldListenRef.current = false;
      setIsListening(false);
      setStatus(`Voice commands stopped: ${event.error}`);
    };
    recognition.onend = () => {
      if (!shouldListenRef.current) {
        setIsListening(false);
        return;
      }
      try {
        recognition.start();
      } catch (error) {
        shouldListenRef.current = false;
        setIsListening(false);
        setStatus(`Could not continue listening: ${error.message}`);
      }
    };
    recognitionRef.current = recognition;
    shouldListenRef.current = true;
    try {
      recognition.start();
      setIsListening(true);
      setStatus(`Listening in ${languageOptions[language].name}. Say a fort name, “play briefing”, or “stop audio”.`);
    } catch (error) {
      shouldListenRef.current = false;
      setIsListening(false);
      setStatus(`Voice commands could not start: ${error.message}`);
    }
  };
  const listenForRoute = () => {
    setStatus("");
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) {
      setStatus("Voice search is not supported in this browser. Type a fort name below instead.");
      return;
    }
    const recognition = new Recognition();
    recognition.lang = languageOptions[language].locale;
    recognition.onresult = event => {
      const spoken = event.results[0][0].transcript;
      setQuery(spoken);
      const match = routes.find(route => spoken.toLowerCase().includes(route.fort.toLowerCase())
        || (route.id === "sinhagad-pune" && spoken.toLowerCase().includes("sinhagad")));
      if (match) {
        setRouteId(match.id);
        setStatus(`Found ${match.fort}. Review the route details before continuing.`);
      } else {
        setStatus(`Heard “${spoken}”, but no route matched. Choose a route from the list.`);
      }
    };
    recognition.onerror = event => setStatus(`Voice search could not start: ${event.error}`);
    try {
      recognition.start();
      setStatus("Listening for a fort name…");
    } catch (error) {
      setStatus(`Voice search could not start: ${error.message}`);
    }
  };

  return <section className="advanced-card">
    <ToolHeading icon="◖" eyebrow="VOICE-BASED TREK GUIDE" title="Listen and control the guide hands-free." description="Use multilingual speech for preparation guidance, fort selection and audio controls. This is not live turn-by-turn navigation." />
    <div className="voice-controls"><label className="advanced-select-label">Voice language<select value={language} onChange={event => setLanguage(event.target.value)}><option value="en">English</option><option value="hi">Hindi</option><option value="mr">Marathi</option></select></label><label className="advanced-select-label">Route<select value={routeId || routes[0]?.id || ""} onChange={event => setRouteId(event.target.value)}>{routes.map(route => <option value={route.id} key={route.id}>{route.fort}</option>)}</select></label></div>
    <div className="voice-brief"><span className="eyebrow">SAMPLE AUDIO BRIEFING</span><p>{brief}</p><div className="voice-actions"><button className="button dark" onClick={speakBrief}>▶ Play voice briefing</button><button className="button secondary" onClick={listenForRoute}>⌕ Search by voice</button><button className="button secondary" onClick={isListening ? stopVoiceCommands : startVoiceCommands} aria-pressed={isListening}>{isListening ? "Stop hands-free commands" : "Start hands-free commands"}</button></div>{isListening && <small className="voice-command-help">Say a fort name, “play briefing”, or “stop audio”.</small>}</div>
    <form className="voice-search-form" onSubmit={event => {
      event.preventDefault();
      const match = routes.find(route => route.fort.toLowerCase().includes(query.trim().toLowerCase()));
      if (match) {
        setRouteId(match.id);
        setStatus(`Selected ${match.fort}.`);
      } else {
        setStatus("No route matched that search. Try a fort name from the list.");
      }
    }}><label className="advanced-select-label">Or type a fort name<input value={query} onChange={event => setQuery(event.target.value)} placeholder="e.g. Sinhagad Fort" /></label><button className="button secondary" type="submit">Find route</button></form>
    {status && <p className="advanced-status" role="status">{status}</p>}
    <p className="advanced-note">Speech recognition and voice availability depend on your browser and device. Keep maps or a local guide available; this feature does not provide turn-by-turn instructions.</p>
  </section>;
}

function ToolHeading({ icon, eyebrow, title, description }) {
  return <div className="advanced-heading"><span className="advanced-icon">{icon}</span><div><span className="eyebrow">{eyebrow}</span><h3>{title}</h3><p>{description}</p></div></div>;
}

export default function AdvancedFeatures({ routes, reports }) {
  const [activeTool, setActiveTool] = useState("checkin");
  return <main className="main-content page-main advanced-page">
    <section className="community-intro advanced-intro"><div><span className="eyebrow">ADVANCED SAFETY & ADVENTURE · LOCAL DEMO</span><h2>Prepare thoughtfully. Stay connected.</h2><p>Eight extra tools for planning, check-ins, route awareness and heritage exploration. Important limitations are shown in each section.</p></div><span className="demo-label">DEMO MODE</span></section>
    <div className="advanced-tool-tabs" role="tablist" aria-label="Advanced safety and adventure tools">{advancedTools.map(tool => <button key={tool.id} role="tab" aria-selected={activeTool === tool.id} className={activeTool === tool.id ? "selected" : ""} onClick={() => setActiveTool(tool.id)}><span className="advanced-tab-number">{tool.number}</span><span className="advanced-tab-icon">{tool.icon}</span><strong>{tool.label}</strong></button>)}</div>
    {activeTool === "checkin" && <CheckInTool routes={routes} />}
    {activeTool === "offline" && <OfflineTool routes={routes} />}
    {activeTool === "risk" && <RiskTool routes={routes} reports={reports} />}
    {activeTool === "heritage" && <HeritageTool routes={routes} />}
    {activeTool === "game" && <GameTool routes={routes} />}
    {activeTool === "packing" && <PackingTool routes={routes} />}
    {activeTool === "budget" && <BudgetTool routes={routes} />}
    {activeTool === "voice" && <VoiceTool routes={routes} />}
  </main>;
}
