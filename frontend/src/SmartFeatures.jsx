import { useEffect, useMemo, useRef, useState } from "react";

const tools = [
  { id: "planner", number: "01", label: "Trek planner", icon: "⌖" },
  { id: "assistant", number: "02", label: "TrekWise assistant", icon: "✳" },
  { id: "fitness", number: "03", label: "Fitness readiness", icon: "↗" },
  { id: "image", number: "04", label: "Trail photo review", icon: "▧" },
  { id: "buddies", number: "05", label: "Trek buddy groups", icon: "♧" },
];

const assistantCopy = {
  en: {
    welcome: "Hi! I can help with route details, preparation and safety planning using TrekWise demo data.",
    route: (route) => `${route.fort} is listed as ${route.difficulty}, with a sample duration of ${route.durationHours} hours and ${route.elevationGainM} m ascent. Trail conditions are currently marked “${route.trailCondition}”; check locally before setting out.`,
    safety: "TrekWise does not have verified live hazard data. Check official weather alerts, confirm access with local authorities or guides, share your plan with someone you trust, and turn back if conditions become unsafe.",
    preparation: "For a day trek, carry water, food, suitable footwear, a charged phone and a basic first-aid kit. Check official alerts and access conditions, tell someone your return time, and avoid trekking in severe weather.",
    fitness: "Start with a route that matches your current ability. Build up with regular walking, gentle hill or stair practice, and leg-strength exercises. Stop if you feel unwell; this demo score is not medical advice.",
    planner: "Open the Trek planner to estimate travel, food, stay and trail-preparation costs. Its sample INR figures are not live prices or bookings.",
    unknown: "I can help with a route, fitness, preparation, budget or safety question. Try one of the sample questions; I use local demo guidance, not a connected AI model.",
  },
  hi: {
    welcome: "नमस्ते! मैं TrekWise के डेमो डेटा से रूट, तैयारी और सुरक्षा की जानकारी दे सकता हूँ।",
    route: (route) => `${route.fort} को ${route.difficulty} कठिनाई वाला नमूना रूट दिखाया गया है। अनुमानित समय ${route.durationHours} घंटे और चढ़ाई ${route.elevationGainM} मीटर है। ट्रेल की स्थिति “${route.trailCondition}” है—जाने से पहले स्थानीय जानकारी ज़रूर जाँचें।`,
    safety: "TrekWise के पास सत्यापित लाइव खतरे की जानकारी नहीं है। आधिकारिक मौसम चेतावनी देखें, स्थानीय अधिकारियों या गाइड से रास्ते की पुष्टि करें, अपनी योजना किसी भरोसेमंद व्यक्ति को बताएं और हालात खराब हों तो वापस लौटें।",
    preparation: "दिनभर की ट्रेक के लिए पानी, खाना, सही जूते, चार्ज फोन और प्राथमिक उपचार किट रखें। आधिकारिक चेतावनी और रास्ते की स्थिति जाँचें, वापसी का समय किसी को बताएं और खराब मौसम में ट्रेक न करें।",
    fitness: "अपनी मौजूदा क्षमता के अनुसार आसान रास्ते से शुरुआत करें। नियमित पैदल चलना, हल्की चढ़ाई या सीढ़ियों का अभ्यास और पैरों की ताकत बढ़ाने वाले व्यायाम धीरे-धीरे करें। यह डेमो स्कोर चिकित्सकीय सलाह नहीं है।",
    planner: "यात्रा, भोजन, ठहरने और ट्रेक तैयारी का अनुमान देखने के लिए Trek planner खोलें। नमूना रुपये के अनुमान लाइव कीमत या बुकिंग नहीं हैं।",
    unknown: "मैं रूट, फिटनेस, तैयारी, बजट या सुरक्षा से जुड़े सवालों में मदद कर सकता हूँ। नमूना सवाल चुनें—यह स्थानीय डेमो मार्गदर्शन है, जुड़ा हुआ AI मॉडल नहीं।",
  },
  mr: {
    welcome: "नमस्कार! TrekWise च्या डेमो माहितीवरून मार्ग, तयारी आणि सुरक्षिततेबद्दल मदत करू शकतो.",
    route: (route) => `${route.fort} हा ${route.difficulty} असा नमुना मार्ग आहे. अंदाजे वेळ ${route.durationHours} तास आणि चढ ${route.elevationGainM} मीटर आहे. पायवाटेची स्थिती “${route.trailCondition}” आहे—निघण्यापूर्वी स्थानिक माहिती तपासा.`,
    safety: "TrekWise कडे पडताळलेली थेट धोक्याची माहिती नाही. अधिकृत हवामान सूचना तपासा, स्थानिक अधिकारी किंवा मार्गदर्शकांकडून प्रवेशाची खात्री करा, आपली योजना विश्वासू व्यक्तीला सांगा आणि परिस्थिती बिघडल्यास परत फिरा.",
    preparation: "दिवसभराच्या ट्रेकसाठी पाणी, अन्न, योग्य बूट, चार्ज केलेला फोन आणि प्राथमिक उपचार पेटी ठेवा. अधिकृत सूचना व मार्गस्थिती तपासा, परतीची वेळ कोणाला तरी सांगा आणि खराब हवामानात ट्रेक करू नका.",
    fitness: "आपल्या सध्याच्या क्षमतेला अनुरूप सोप्या मार्गाने सुरुवात करा. नियमित चालणे, हलका चढ किंवा पायऱ्यांचा सराव आणि पायांचे बळ वाढवणारे व्यायाम हळूहळू वाढवा. हा डेमो स्कोअर वैद्यकीय सल्ला नाही.",
    planner: "प्रवास, जेवण, मुक्काम आणि ट्रेक तयारीचा अंदाज पाहण्यासाठी Trek planner उघडा. नमुना रुपये अंदाज हे थेट दर किंवा बुकिंग नाहीत.",
    unknown: "मार्ग, फिटनेस, तयारी, बजेट किंवा सुरक्षिततेबद्दल विचारा. नमुना प्रश्न वापरून पाहा—हे स्थानिक डेमो मार्गदर्शन आहे, जोडलेले AI मॉडेल नाही.",
  },
};

const sampleQuestions = {
  en: ["Is Sinhagad suitable for beginners?", "What should I pack?", "How do I plan for bad weather?"],
  hi: ["क्या सिंहगढ़ शुरुआती लोगों के लिए ठीक है?", "ट्रेक में क्या सामान रखें?", "खराब मौसम में क्या करें?"],
  mr: ["सिंहगड नवशिक्यांसाठी योग्य आहे का?", "ट्रेकसाठी काय सामान घ्यावे?", "खराब हवामानात काय करावे?"],
};

const fitnessRank = { Beginner: 1, Moderate: 2, Advanced: 3 };
const difficultyRank = { Easy: 1, Moderate: 2, Hard: 3 };
const hazardOptions = ["Damaged path", "Loose rocks", "Fallen tree / blocked path", "Water or erosion"];

function getAssistantAnswer(question, language, routes) {
  const text = question.toLowerCase();
  const words = {
    safety: ["safety", "safe", "weather", "rain", "hazard", "सुरक्षित", "सुरक्षा", "मौसम", "बारिश", "हवामान", "पाऊस", "धोका"],
    preparation: ["pack", "carry", "prepare", "preparation", "सामान", "तैयारी", "लेकर", "घेऊन", "तयारी", "साहित्य"],
    fitness: ["fitness", "beginner", "exercise", "fit", "शुरुआत", "शुरुआती", "फिटनेस", "व्यायाम", "नवशिक्या", "तंदुरुस्ती"],
    planner: ["budget", "cost", "price", " खर्च", "बजट", "खर्च", "योजना", "planner"],
  };
  const localizedRoute = text.includes("सिंहग") ? routes.find(route => route.id === "sinhagad-pune") : null;
  const route = localizedRoute || routes.find(item => text.includes(item.fort.toLowerCase()));
  const copy = assistantCopy[language];
  if (route) return copy.route(route);
  if (words.safety.some(word => text.includes(word))) return copy.safety;
  if (words.preparation.some(word => text.includes(word))) return copy.preparation;
  if (words.fitness.some(word => text.includes(word))) return copy.fitness;
  if (words.planner.some(word => text.includes(word))) return copy.planner;
  return copy.unknown;
}

function formatCurrency(value) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value);
}

function dateAfterDays(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

export default function SmartFeatures({ routes, onReport }) {
  const [activeTool, setActiveTool] = useState("planner");
  const [plannerForm, setPlannerForm] = useState({ routeId: "", budget: "5000", hours: "6", fitness: "Beginner", overnight: false });
  const [plan, setPlan] = useState(null);
  const [language, setLanguage] = useState("en");
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([{ role: "assistant", text: assistantCopy.en.welcome }]);
  const [fitnessForm, setFitnessForm] = useState({ sessions: "2", walkingHours: "2", level: "Beginner" });
  const [readiness, setReadiness] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [imageError, setImageError] = useState("");
  const [imageRouteId, setImageRouteId] = useState("");
  const [hazards, setHazards] = useState([]);
  const [buddyForm, setBuddyForm] = useState({ routeId: "", date: "", fitness: "Beginner", consent: false });
  const [buddySearched, setBuddySearched] = useState(false);
  const [joinedGroups, setJoinedGroups] = useState([]);
  const messagesEndRef = useRef(null);

  const selectedRoute = routes.find(route => route.id === (plannerForm.routeId || routes[0]?.id));
  const selectedImageRoute = routes.find(route => route.id === (imageRouteId || routes[0]?.id));
  const imageUrl = useMemo(() => imageFile ? URL.createObjectURL(imageFile) : "", [imageFile]);
  const sampleGroups = useMemo(() => routes.slice(0, 6).map((route, index) => ({
    id: `sample-${route.id}`,
    routeId: route.id,
    routeName: route.fort,
    date: dateAfterDays([7, 14, 21, 28, 35, 42][index]),
    name: ["Aarav", "Mira", "Dev", "Anaya", "Kabir", "Ira"][index],
    fitness: ["Beginner", "Moderate", "Advanced", "Beginner", "Moderate", "Advanced"][index],
    experience: ["New trekker", "Weekend hiker", "Regular trekker", "New trekker", "Weekend hiker", "Regular trekker"][index],
    members: [2, 3, 4, 2, 3, 4][index],
  })), [routes]);
  const matchingGroups = useMemo(() => {
    const routeId = buddyForm.routeId || routes[0]?.id;
    const date = buddyForm.date || sampleGroups[0]?.date;
    return sampleGroups.filter(group => {
      const fitnessGap = Math.abs(fitnessRank[group.fitness] - fitnessRank[buddyForm.fitness]);
      return group.routeId === routeId && group.date === date && fitnessGap <= 1;
    });
  }, [buddyForm.date, buddyForm.fitness, buddyForm.routeId, routes, sampleGroups]);

  useEffect(() => {
    if (!plannerForm.routeId && routes[0]) setPlannerForm(form => ({ ...form, routeId: routes[0].id }));
    if (!imageRouteId && routes[0]) setImageRouteId(routes[0].id);
  }, [imageRouteId, plannerForm.routeId, routes]);
  useEffect(() => () => { if (imageUrl) URL.revokeObjectURL(imageUrl); }, [imageUrl]);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }); }, [messages]);

  const updatePlanner = (key, value) => {
    setPlannerForm(form => ({ ...form, [key]: value }));
    setPlan(null);
  };
  const createPlan = (event) => {
    event.preventDefault();
    if (!selectedRoute) return;
    const hours = Number(plannerForm.hours);
    const travel = Math.round((350 + selectedRoute.distanceKm * 80) / 50) * 50;
    const food = Math.max(200, Math.ceil(hours / 3) * 180);
    const stay = plannerForm.overnight ? 1000 : 0;
    const trail = 200 + Math.ceil(selectedRoute.elevationGainM / 250) * 100;
    const total = travel + food + stay + trail;
    const fitnessGap = difficultyRank[selectedRoute.difficulty] - fitnessRank[plannerForm.fitness];
    setPlan({
      route: selectedRoute,
      costs: { Travel: travel, Food: food, Stay: stay, "Trail & local expenses": trail },
      total,
      withinBudget: total <= Number(plannerForm.budget),
      enoughTime: hours >= selectedRoute.durationHours,
      routeFit: fitnessGap <= 0 ? "Matches the selected fitness level." : "This route may be more challenging than your selected fitness level.",
      hours,
    });
  };
  const askQuestion = (eventOrQuestion) => {
    if (eventOrQuestion?.preventDefault) eventOrQuestion.preventDefault();
    const prompt = typeof eventOrQuestion === "string" ? eventOrQuestion : question;
    if (!prompt.trim()) return;
    const response = getAssistantAnswer(prompt, language, routes);
    setMessages(items => [...items, { role: "user", text: prompt.trim() }, { role: "assistant", text: response }]);
    setQuestion("");
  };
  const calculateReadiness = (event) => {
    event.preventDefault();
    const sessions = Number(fitnessForm.sessions);
    const walkingHours = Number(fitnessForm.walkingHours);
    const score = Math.min(100, 25 + sessions * 8 + Math.min(walkingHours, 4) * 9 + fitnessRank[fitnessForm.level] * 5);
    setReadiness({
      score: Math.round(score),
      difficulty: score < 52 ? "Easy" : score < 78 ? "Moderate" : "Hard",
      plan: score < 52
        ? ["Walk comfortably for 20–30 minutes, 3 times this week.", "Try gentle stairs and supported sit-to-stands.", "Build distance gradually; include rest days."]
        : score < 78
          ? ["Add one steady 35–45 minute walk this week.", "Practice short hills or stairs at a comfortable pace.", "Add calf raises and step-ups, then rest and recover."]
          : ["Maintain regular walks and add a gradual hill session.", "Practice step-ups, calf raises and light core stability.", "Reduce training and rest if you feel pain or unusual fatigue."],
    });
  };
  const selectImage = (event) => {
    const file = event.target.files?.[0];
    setImageError("");
    setImageFile(null);
    setHazards([]);
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setImageError("Choose an image file to preview.");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setImageError("The image must be smaller than 8 MB.");
      return;
    }
    setImageFile(file);
  };
  const toggleHazard = (hazard) => setHazards(items => items.includes(hazard) ? items.filter(item => item !== hazard) : [...items, hazard]);
  const createHazardReport = () => {
    if (!selectedImageRoute || !hazards.length) return;
    const type = hazards.some(item => item.includes("Fallen tree")) ? "Blocked path"
      : hazards.some(item => item.includes("Water or erosion")) ? "Landslide"
        : "Slippery trail";
    onReport({
      routeId: selectedImageRoute.id,
      type,
      description: `Manually observed by the trekker after previewing a local image: ${hazards.join(", ")}. This demo did not run AI image analysis; verify the observation on site.`,
    });
  };
  const searchGroups = (event) => {
    event.preventDefault();
    setBuddySearched(true);
    setJoinedGroups([]);
  };

  return <main className="main-content page-main smart-page">
    <section className="community-intro smart-intro"><div><span className="eyebrow">SMART TREK STUDIO · LOCAL DEMO</span><h2>Plan with a little more insight.</h2><p>Five practical tools for your next trek. This version runs locally: no AI service is connected, and trail photos stay in your browser.</p></div><span className="demo-label">NO EXTERNAL AI</span></section>
    <div className="smart-tool-tabs" role="tablist" aria-label="Smart trekking tools">
      {tools.map(tool => <button key={tool.id} role="tab" aria-selected={activeTool === tool.id} className={activeTool === tool.id ? "selected" : ""} onClick={() => setActiveTool(tool.id)}><span>{tool.number}</span><strong>{tool.label}</strong></button>)}
    </div>

    {activeTool === "planner" && <section className="smart-card planner-tool">
      <div className="smart-card-heading"><span className="smart-tool-icon">⌖</span><div><span className="eyebrow">PERSONAL TREK PLANNER</span><h3>Build a simple trip plan.</h3><p>Choose your route, budget, time and fitness level to see a transparent sample itinerary.</p></div></div>
      <form className="smart-form planner-form" onSubmit={createPlan}>
        <label>Destination / route<select required value={plannerForm.routeId || routes[0]?.id || ""} onChange={event => updatePlanner("routeId", event.target.value)}>{routes.map(route => <option value={route.id} key={route.id}>{route.fort} — {route.routeName}</option>)}</select></label>
        <label>Budget (INR)<input type="number" required min="100" step="100" value={plannerForm.budget} onChange={event => updatePlanner("budget", event.target.value)} /></label>
        <label>Available time (hours)<input type="number" required min="1" max="24" step="0.5" value={plannerForm.hours} onChange={event => updatePlanner("hours", event.target.value)} /></label>
        <label>Fitness level<select value={plannerForm.fitness} onChange={event => updatePlanner("fitness", event.target.value)}><option>Beginner</option><option>Moderate</option><option>Advanced</option></select></label>
        <label className="smart-checkbox"><input type="checkbox" checked={plannerForm.overnight} onChange={event => updatePlanner("overnight", event.target.checked)} /><span>Include a sample overnight stay</span></label>
        <button className="button dark" type="submit">Create my sample plan →</button>
      </form>
      {plan && <div className="planner-result" role="status">
        <div className="planner-result-heading"><div><span className="eyebrow">YOUR SAMPLE ITINERARY</span><h4>{plan.route.fort}</h4></div><span className={`planner-budget ${plan.withinBudget ? "within" : "over"}`}>{plan.withinBudget ? "Within budget estimate" : "Above budget estimate"}</span></div>
        <div className="planner-cost-grid">{Object.entries(plan.costs).filter(([, amount]) => amount > 0).map(([label, amount]) => <div key={label}><span>{label}</span><strong>{formatCurrency(amount)}</strong></div>)}<div className="planner-total"><span>Estimated total</span><strong>{formatCurrency(plan.total)}</strong></div></div>
        <ol className="planner-itinerary"><li><strong>Before leaving</strong><span>Check official weather alerts, access, transport and your return plan.</span></li><li><strong>Trail time</strong><span>{plan.route.durationHours} hrs sample route · {plan.route.distanceKm} km · {plan.route.elevationGainM} m ascent.</span></li><li><strong>Return and rest</strong><span>Keep time for your return journey and stop if conditions become unsafe.</span></li></ol>
        <p className="planner-fit-note"><strong>Time:</strong> {plan.enoughTime ? "Your available time covers the sample route duration." : "Your selected time may be too short for the sample route duration."} <strong>Fitness:</strong> {plan.routeFit}</p>
        <small className="smart-disclaimer">Illustrative INR estimates only—not live prices, bookings, travel advice or a safety guarantee. Verify costs, route access and conditions locally.</small>
      </div>}
    </section>}

    {activeTool === "assistant" && <section className="smart-card assistant-tool">
      <div className="smart-card-heading"><span className="smart-tool-icon">✳</span><div><span className="eyebrow">TREKWISE ASSISTANT</span><h3>Ask a trek question.</h3><p>Local demo answers for routes, preparation, fitness and safety. No question is sent to an AI service.</p></div></div>
      <div className="assistant-languages" aria-label="Choose assistant language">{[["en", "English"], ["hi", "हिन्दी"], ["mr", "मराठी"]].map(([value, label]) => <button type="button" className={language === value ? "selected" : ""} key={value} onClick={() => setLanguage(value)}>{label}</button>)}</div>
      <div className="assistant-chat" aria-live="polite">{messages.map((message, index) => <div className={`assistant-message ${message.role}`} key={`${message.role}-${index}`}><span>{message.role === "assistant" ? "TrekWise" : "You"}</span><p>{message.text}</p></div>)}<div ref={messagesEndRef} /></div>
      <div className="assistant-samples">{sampleQuestions[language].map(sample => <button type="button" key={sample} onClick={() => askQuestion(sample)}>{sample}</button>)}</div>
      <form className="assistant-input" onSubmit={askQuestion}><label className="visually-hidden" htmlFor="assistant-question">Ask a question</label><input id="assistant-question" value={question} onChange={event => setQuestion(event.target.value)} placeholder={language === "en" ? "Ask about a route, preparation or safety…" : language === "hi" ? "रूट, तैयारी या सुरक्षा के बारे में पूछें…" : "मार्ग, तयारी किंवा सुरक्षिततेबद्दल विचारा…"} /><button className="button dark" type="submit">Ask →</button></form>
      <p className="smart-disclaimer">Demo guidance can be incomplete or out of date. Verify route, weather and safety information with local authorities and experienced guides.</p>
    </section>}

    {activeTool === "fitness" && <section className="smart-card fitness-tool">
      <div className="smart-card-heading"><span className="smart-tool-icon">↗</span><div><span className="eyebrow">FITNESS READINESS CHECK</span><h3>Find a comfortable starting point.</h3><p>Use your recent activity to get a simple, non-medical training suggestion.</p></div></div>
      <form className="smart-form fitness-form" onSubmit={calculateReadiness}>
        <label>Fitness level<select value={fitnessForm.level} onChange={event => setFitnessForm(form => ({ ...form, level: event.target.value }))}><option>Beginner</option><option>Moderate</option><option>Advanced</option></select></label>
        <label>Walking / exercise sessions per week<select value={fitnessForm.sessions} onChange={event => setFitnessForm(form => ({ ...form, sessions: event.target.value }))}><option value="0">0 sessions</option><option value="1">1 session</option><option value="2">2 sessions</option><option value="3">3 sessions</option><option value="4">4 sessions</option><option value="5">5 or more</option></select></label>
        <label>Longest comfortable walk (hours)<input type="number" min="0" max="12" step="0.5" required value={fitnessForm.walkingHours} onChange={event => setFitnessForm(form => ({ ...form, walkingHours: event.target.value }))} /></label>
        <button className="button dark" type="submit">Check my readiness →</button>
      </form>
      {readiness && <div className="readiness-result" role="status"><div className="readiness-score"><strong>{readiness.score}</strong><span>demo readiness score / 100</span></div><div className="readiness-recommendation"><span className="eyebrow">SUGGESTED STARTING DIFFICULTY</span><h4>{readiness.difficulty}</h4><ul>{readiness.plan.map(item => <li key={item}>{item}</li>)}</ul></div></div>}
      <div className="fitness-safety-note"><strong>Listen to your body.</strong><p>This simple score is not an AI or medical assessment. It does not account for health conditions, altitude or current trail conditions. If you have health concerns or pain, consult a qualified health professional before strenuous activity.</p></div>
    </section>}

    {activeTool === "image" && <section className="smart-card image-tool">
      <div className="smart-card-heading"><span className="smart-tool-icon">▧</span><div><span className="eyebrow">TRAIL PHOTO REVIEW</span><h3>Review a trail photo.</h3><p>Preview a photo on this device and record hazards you observe. Nothing is uploaded.</p></div></div>
      <div className="image-review-grid"><div className="image-upload-panel"><label className="upload-dropzone"><span>＋</span><strong>Choose a trail image</strong><small>JPG, PNG or WebP · up to 8 MB · local preview only</small><input type="file" accept="image/*" onChange={selectImage} /></label>
        {imageError && <p className="inline-error" role="alert">{imageError}</p>}
        {imageUrl && <div className="image-preview"><img src={imageUrl} alt="Selected trail for manual review" /><span>Preview stays in this browser</span></div>}
      </div>
      <div className="image-checklist"><label>Route<select value={imageRouteId || routes[0]?.id || ""} onChange={event => setImageRouteId(event.target.value)}>{routes.map(route => <option key={route.id} value={route.id}>{route.fort}</option>)}</select></label>
        <strong>What can you personally see?</strong>
        {hazardOptions.map(hazard => <label className="smart-checkbox" key={hazard}><input type="checkbox" checked={hazards.includes(hazard)} onChange={() => toggleHazard(hazard)} /><span>{hazard}</span></label>)}
        <p className="image-ai-limit">This local demo has no computer-vision model, so it cannot identify hazards from pixels. Do not treat this checklist as verified safety information.</p>
        <button className="button dark" type="button" disabled={!imageFile || !hazards.length || !selectedImageRoute} onClick={createHazardReport}>Continue to community report →</button>
      </div></div>
    </section>}

    {activeTool === "buddies" && <section className="smart-card buddies-tool">
      <div className="smart-card-heading"><span className="smart-tool-icon">♧</span><div><span className="eyebrow">TREK BUDDY GROUPS</span><h3>Find a compatible demo group.</h3><p>Filter synthetic sample groups by destination, date and fitness level. No real people or location data are shared.</p></div></div>
      <form className="smart-form buddy-form" onSubmit={searchGroups}>
        <label>Destination<select value={buddyForm.routeId || routes[0]?.id || ""} onChange={event => setBuddyForm(form => ({ ...form, routeId: event.target.value }))}>{routes.map(route => <option key={route.id} value={route.id}>{route.fort}</option>)}</select></label>
        <label>Preferred date<input type="date" required min={dateAfterDays(1)} value={buddyForm.date || sampleGroups[0]?.date || ""} onChange={event => setBuddyForm(form => ({ ...form, date: event.target.value }))} /></label>
        <label>Fitness level<select value={buddyForm.fitness} onChange={event => setBuddyForm(form => ({ ...form, fitness: event.target.value }))}><option>Beginner</option><option>Moderate</option><option>Advanced</option></select></label>
        <label className="smart-checkbox buddy-consent"><input type="checkbox" required checked={buddyForm.consent} onChange={event => setBuddyForm(form => ({ ...form, consent: event.target.checked }))} /><span>I agree to use these preferences for this local demo search. No personal location is requested or shared.</span></label>
        <button className="button dark" type="submit">Find sample groups →</button>
      </form>
      {sampleGroups.length > 0 && <div className="buddy-sample-dates"><span>Try a sample group date:</span>{sampleGroups.map(group => <button type="button" key={group.id} onClick={() => setBuddyForm(form => ({ ...form, routeId: group.routeId, date: group.date }))}>{group.routeName} · {new Date(`${group.date}T12:00:00`).toLocaleDateString()}</button>)}</div>}
      {buddySearched && <div className="buddy-results" aria-live="polite"><div className="buddy-results-heading"><span className="eyebrow">SAMPLE MATCHES</span><span>{matchingGroups.length} found</span></div>
        {matchingGroups.length ? <div className="buddy-card-grid">{matchingGroups.map(group => <article className="buddy-card" key={group.id}><span className="buddy-avatar">{group.name[0]}</span><div className="buddy-card-content"><strong>{group.name}’s trek group</strong><span>{group.routeName}</span><small>{new Date(`${group.date}T12:00:00`).toLocaleDateString()} · {group.fitness} · {group.experience}</small><small>{group.members} demo members · sample profile only</small></div><button className="button secondary" type="button" disabled={joinedGroups.includes(group.id)} onClick={() => setJoinedGroups(items => [...items, group.id])}>{joinedGroups.includes(group.id) ? "Joined demo" : "Join demo group"}</button></article>)}</div> : <p className="empty-state">No sample group matches this exact destination and date. Try another date or route.</p>}
      </div>}
      <p className="smart-disclaimer">These are fictional sample profiles. There is no live matching, messaging or group creation. A real feature should require explicit consent and share only the minimum profile details needed.</p>
    </section>}
  </main>;
}
