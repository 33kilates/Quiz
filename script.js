// script.js

// --- ANALYTICS TRACKING (GA4 + Pixel) ---
function trackEvent(eventName, details = {}) {
  console.log(`📊 Evento: ${eventName}`, details);

  // Google Analytics 4
  if (typeof gtag === "function") gtag("event", eventName, details);

  // Facebook Pixel (browser)
  if (typeof fbq === "function") fbq("trackCustom", eventName, details);
}

// --- Helpers: Event ID + Cookies + CAPI ---
function genEventId() {
  return (crypto?.randomUUID && crypto.randomUUID()) || String(Date.now()) + "-" + Math.random();
}

function getCookie(name) {
  const match = document.cookie.match(
    new RegExp("(^|; )" + name.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&") + "=([^;]*)")
  );
  return match ? decodeURIComponent(match[2]) : null;
}

async function sendCapi(eventName, eventId, extra = {}) {
  const fbp = getCookie("_fbp");
  const fbc = getCookie("_fbc");

  const payload = {
    event_name: eventName,
    event_id: eventId,
    event_source_url: window.location.href,
    ...(fbp ? { fbp } : {}),
    ...(fbc ? { fbc } : {}),
    ...extra,
  };

  try {
    const resp = await fetch("/.netlify/functions/capi", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await resp.json().catch(() => null);
    if (!resp.ok) console.warn("⚠️ CAPI error:", resp.status, data);
    else console.log("✅ CAPI ok:", data);
  } catch (err) {
    console.warn("⚠️ CAPI fetch failed:", err);
  }
}

/**
 * Dispara evento com dedupe:
 * - Pixel (browser) com { eventID }
 * - CAPI (server) com event_id igual
 */
function fireMetaEvent(eventName, details = {}, eventId = genEventId()) {
  if (typeof fbq === "function") {
    fbq("trackCustom", eventName, details, { eventID: eventId });
  } else {
    trackEvent(eventName, details);
  }

  if (typeof gtag === "function") gtag("event", eventName, details);

  sendCapi(eventName, eventId, {});
  return eventId;
}

// ------------------------
// MODELO (estimativa dinâmica)
// ------------------------
const model = {
  activeCount: null,     // número estimado de revendedoras ativas
  avgTicket: null,       // valor estimado em R$ (mercadoria em consignado / giro mensal por ativa)
  basePotential: null,   // activeCount * avgTicket
};

const fmtBRL = (v) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(v);

function calcRangesFromPotential(potential) {
  if (!potential || potential <= 0) return null;

  const moderateMin = Math.round(potential * 0.10);
  const moderateMax = Math.round(potential * 0.15);

  const heavyMin = Math.round(potential * 0.30);
  const heavyMax = Math.round(potential * 0.50);

  return { moderateMin, moderateMax, heavyMin, heavyMax };
}

function buildMoneyLine() {
  if (!model.activeCount || !model.avgTicket) return "";
  const potential = model.activeCount * model.avgTicket;
  model.basePotential = potential;

  const r = calcRangesFromPotential(potential);
  if (!r) return "";

  return `📌 Pela sua resposta, seu potencial de giro mensal fica em torno de <strong>${fmtBRL(potential)}</strong>.
  Se você estiver 10–15% abaixo do potencial por “perfil errado”, isso pode ser <strong>${fmtBRL(r.moderateMin)} a ${fmtBRL(
    r.moderateMax
  )}</strong> na mesa.`;
}

function buildMoneyLineHeavy() {
  if (!model.basePotential) return "";
  const r = calcRangesFromPotential(model.basePotential);
  if (!r) return "";
  return `⚠️ Em cenários travados, 30–50% abaixo do potencial vira <strong>${fmtBRL(r.heavyMin)} a ${fmtBRL(
    r.heavyMax
  )}</strong> “sumindo” em atraso, mercadoria parada e retrabalho.`;
}

// ------------------------
// QUIZ DATA (SPIN + CONSIGNADO + micro-recompensa + 12 perguntas)
// ------------------------
const questions = [
  // SITUAÇÃO (3)
  {
    id: 1,
    phase: "SITUAÇÃO",
    transition: () => "Leva menos de 3 minutos. Vamos direto ao ponto.",
    text: "Quantas revendedoras estão ATIVAS de verdade hoje (girando mercadoria e acertando com frequência)?",
    options: ["1–10", "11–25", "26–50", "51–100", "100+"],
    map: { type: "activeCount", values: [8, 18, 38, 75, 130] }, // estimativas conservadoras
  },
  {
    id: 2,
    phase: "SITUAÇÃO",
    transition: () => "Agora uma pergunta que quase ninguém mede — e é onde o lucro se esconde.",
    text: "Em média, quanto de mercadoria (em consignado) uma revendedora ativa consegue girar/fechar por mês?",
    options: ["Até R$ 300", "R$ 300–700", "R$ 700–1.200", "R$ 1.200–2.000", "Acima de R$ 2.000"],
    map: { type: "avgTicket", values: [250, 500, 950, 1500, 2400] },
  },
  {
    id: 3,
    phase: "SITUAÇÃO",
    transition: () => {
      const line = buildMoneyLine();
      return line ? `${line}<br><span class="text-slate-500">Última dessa parte. Agora vamos achar o vazamento.</span>` : "Última dessa parte. Agora vamos achar o vazamento.";
    },
    text: "Como você decide quanto de mercadoria libera no começo do consignado?",
    options: [
      "No feeling (e às vezes eu pago caro por isso)",
      "Pelo papo/urgência (e já quebrei a cara com isso)",
      "Tenho regra… mas ainda travo com atrasos e devolução",
    ],
  },

  // PROBLEMA (4)
  {
    id: 4,
    phase: "PROBLEMA",
    transition: () => "Grandes operações escalam porque não tratam todo mundo igual: base, pico e liderança têm funções diferentes.",
    text: "Qual destes cenários acontece com mais frequência no seu consignado?",
    options: [
      "Atraso no acerto vira rotina",
      "Mercadoria fica travada/encalhada em algumas mãos",
      "Quando dá problema, recuperar vira desgaste",
    ],
  },
  {
    id: 5,
    phase: "PROBLEMA",
    transition: () => "Isso aqui é a definição de “Equipe Zumbi”: gente ocupando espaço e travando seu caixa.",
    text: "Quantas revendedoras consomem atenção/mercadoria, mas não geram giro consistente?",
    options: [
      "Muitas — e eu empurro pra não “perder cadastro”",
      "Uma parte relevante — trava meu mês",
      "Poucas — mas já causam prejuízo e estresse",
    ],
  },
  {
    id: 6,
    phase: "PROBLEMA",
    transition: () => "Você já está na metade. Essa pergunta separa equipe viva de equipe que só dá trabalho.",
    text: "Com que frequência alguém começa animada e depois trava, desanima ou some?",
    options: [
      "O tempo todo — eu vivo recomeçando",
      "Com frequência — atrasa meu crescimento",
      "Menos… mas ainda me custa caro",
    ],
  },
  {
    id: 7,
    phase: "PROBLEMA",
    transition: () => {
      const heavy = buildMoneyLineHeavy();
      return heavy ? `${heavy}<br><span class="text-slate-500">Agora, vamos ver como isso te prende.</span>` : "Agora, vamos ver como isso te prende.";
    },
    text: "Quando a mercadoria retorna, qual situação é mais comum?",
    options: [
      "Volta atrasada e eu preciso correr atrás",
      "Volta parada/encalhada sem justificativa clara",
      "Volta com desgaste/perda e vira briga pra resolver",
    ],
  },

  // IMPLICAÇÃO (3)
  {
    id: 8,
    phase: "IMPLICAÇÃO",
    transition: () => "A pergunta não é se dói. É: quanto isso custa por mês sem você perceber?",
    text: "Quando a mercadoria trava, o que isso causa primeiro na sua operação?",
    options: [
      "Caixa sufoca (menos margem, mais aperto)",
      "Tempo vai pro ralo (cobrança, conferência, retrabalho)",
      "Eu fico com medo e travo o crescimento",
    ],
  },
  {
    id: 9,
    phase: "IMPLICAÇÃO",
    transition: () => "Se você ganha clareza, você para de virar cobrador(a).",
    text: "Quanto da sua semana vira ‘gerenciar BO’ de revendedora (cobrar, conferir, resolver)?",
    options: [
      "Tempo demais — parece um segundo trabalho",
      "Mais do que deveria — atrasa o negócio",
      "Menos… mas o peso mental é constante",
    ],
  },
  {
    id: 10,
    phase: "IMPLICAÇÃO",
    transition: () => "Se você não muda o método, o padrão se repete.",
    text: "Se nada mudar, qual cenário parece mais provável nos próximos meses?",
    options: [
      "Continuar apagando incêndio e perdendo caixa em silêncio",
      "Crescer com caos (mais gente = mais problema)",
      "Estagnar por cansaço e medo de liberar consignado",
    ],
  },

  // NECESSIDADE (2)
  {
    id: 11,
    phase: "NECESSIDADE",
    transition: () => "Agora a virada: método > sorte. Arquitetura > motivação.",
    text: "Você concorda que não dá pra escalar consignado tratando todo mundo igual?",
    options: [
      "Concordo totalmente — já me custou caro",
      "Concordo… mas não sei separar perfis na prática",
      "Concordo — preciso organizar isso agora",
    ],
  },
  {
    id: 12,
    phase: "NECESSIDADE",
    transition: () => "Última. Em seguida eu te mostro exatamente onde está o travamento.",
    text: "O que você quer resolver primeiro na sua equipe?",
    options: [
      "Parar de perder dinheiro com consignado na pessoa errada",
      "Organizar o mix de perfis pra ter caixa previsível",
      "Ter clareza total antes de colocar mais mercadoria pra rua",
    ],
  },
];

const TOTAL_QUESTIONS = questions.length;

let currentQuestionIndex = 0;
let answers = [];
let selectedOptionIndex = null;

// Flags anti-duplicação
let didStart = false;
let didComplete = false;

// DOM Elements
const introScreen = document.getElementById("intro-screen");
const quizContainer = document.getElementById("quiz-container");
const questionContent = document.getElementById("question-content");
const progressBar = document.getElementById("progress-bar");
const progressText = document.getElementById("progress-text");
const nextBtn = document.getElementById("next-btn");
const loadingScreen = document.getElementById("loading-screen");
const resultScreen = document.getElementById("result-screen");

// Initialize State
function startQuiz() {
  if (!didStart) {
    didStart = true;
    fireMetaEvent("StartQuiz", { source: "intro" });
  }

  gsap.to(introScreen, {
    duration: 0.5,
    opacity: 0,
    y: -20,
    onComplete: () => {
      introScreen.classList.add("hidden");
      quizContainer.classList.remove("hidden");
      gsap.fromTo(quizContainer, { opacity: 0, y: 20 }, { duration: 0.5, opacity: 1, y: 0 });
      renderQuestion(currentQuestionIndex);
    },
  });
}

function getTransitionText(q) {
  if (!q.transition) return "";
  try {
    return typeof q.transition === "function" ? q.transition() : String(q.transition);
  } catch {
    return "";
  }
}

function renderQuestion(index) {
  const question = questions[index];

  selectedOptionIndex = null;

  const progress = Math.round((index / TOTAL_QUESTIONS) * 100);
  progressBar.style.width = `${progress}%`;
  progressText.innerText = `${progress}%`;

  fireMetaEvent("ViewQuestion", {
    question_number: index + 1,
    phase: question.phase,
    question_id: question.id,
  });

  const optionsHtml = question.options
    .map(
      (opt, i) => `
        <div class="option-card border-2 border-slate-100 rounded-xl p-4 flex items-center gap-4 cursor-pointer group hover:border-accent/50 bg-white"
             onclick="selectOption(${i}, this)">
          <div class="option-circle w-6 h-6 rounded-full border-2 border-slate-300 flex items-center justify-center shrink-0">
            <div class="option-check w-3 h-3 bg-white rounded-full opacity-0 transform scale-0 transition-all duration-200"></div>
          </div>
          <span class="text-slate-700 font-medium group-hover:text-primary transition-colors text-lg">${opt}</span>
        </div>
      `
    )
    .join("");

  const transitionText = getTransitionText(question);

  questionContent.innerHTML = `
    <div class="animate-content">
      <span class="text-xs font-bold text-accent tracking-widest uppercase mb-2 block">${question.phase}</span>

      ${transitionText ? `<p class="text-sm text-slate-500 mb-3 italic">${transitionText}</p>` : ""}

      <h3 class="text-xl md:text-2xl font-bold text-slate-800 mb-6 leading-tight">${question.text}</h3>
      <div class="space-y-3 flex flex-col">
        ${optionsHtml}
      </div>
    </div>
  `;

  gsap.fromTo(".animate-content", { opacity: 0, y: 20 }, { duration: 0.4, opacity: 1, y: 0, ease: "power2.out" });

  nextBtn.classList.add("hidden", "opacity-0");
  nextBtn.classList.remove("flex");
}

function applyMappingForQuestion(questionId, optionIndex) {
  const q = questions.find((x) => x.id === questionId);
  if (!q || !q.map) return;

  if (q.map.type === "activeCount") model.activeCount = q.map.values[optionIndex] ?? model.activeCount;
  if (q.map.type === "avgTicket") model.avgTicket = q.map.values[optionIndex] ?? model.avgTicket;

  if (model.activeCount && model.avgTicket) {
    model.basePotential = model.activeCount * model.avgTicket;
  }
}

function selectOption(optionIndex, element) {
  selectedOptionIndex = optionIndex;

  const allOptions = document.querySelectorAll(".option-card");
  allOptions.forEach((opt) => opt.classList.remove("selected", "border-accent", "bg-accent/5"));

  element.classList.add("selected");

  fireMetaEvent("SelectOption", {
    question_number: currentQuestionIndex + 1,
    question_id: questions[currentQuestionIndex].id,
    option_index: optionIndex,
  });

  if (nextBtn.classList.contains("hidden")) {
    nextBtn.classList.remove("hidden");
    nextBtn.classList.add("flex");
    gsap.to(nextBtn, { duration: 0.3, opacity: 1, y: 0, ease: "back.out(1.7)" });
  }
}

function nextQuestion() {
  if (selectedOptionIndex === null) {
    console.warn("⚠️ Nenhuma opção selecionada.");
    return;
  }

  const q = questions[currentQuestionIndex];

  answers.push({
    questionId: q.id,
    selectedOptionIndex,
    phase: q.phase,
  });

  // Atualiza modelo (para as transições com números)
  applyMappingForQuestion(q.id, selectedOptionIndex);

  gsap.to(".animate-content", {
    duration: 0.3,
    opacity: 0,
    x: -20,
    onComplete: () => {
      currentQuestionIndex++;

      if (currentQuestionIndex < questions.length) {
        renderQuestion(currentQuestionIndex);
      } else {
        finishQuiz();
      }
    },
  });
}

function finishQuiz() {
  if (!didComplete) {
    didComplete = true;

    fireMetaEvent("QuizComplete", {
      total_answers: answers.length,
    });
  }

  gsap.to(quizContainer, {
    duration: 0.5,
    opacity: 0,
    scale: 0.95,
    onComplete: () => {
      quizContainer.classList.add("hidden");
      loadingScreen.classList.remove("hidden");

      setTimeout(() => {
        loadingScreen.classList.add("hidden");
        resultScreen.classList.remove("hidden");

        gsap.fromTo(
          resultScreen,
          { opacity: 0, scale: 0.9 },
          { duration: 0.6, opacity: 1, scale: 1, ease: "back.out(1.2)" }
        );
      }, 2500);
    },
  });
}

function redirect() {
  fireMetaEvent("ClickCTA", { destination: "Landing Page" });
  window.location.href = "#landing-page";
}

// ------------------------
// PASSTHROUGH (UTM + CLICK IDs) QUIZ -> VSL
// ------------------------
const PASSTHROUGH_KEYS = [
  "utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term",
  "fbclid", "gclid", "ttclid", "wbraid", "gbraid"
];

function buildPassthroughURL(baseUrl) {
  const from = new URLSearchParams(window.location.search);
  const toUrl = new URL(baseUrl);

  // mantém query que já exista no baseUrl
  const to = toUrl.searchParams;

  PASSTHROUGH_KEYS.forEach((key) => {
    const val = from.get(key);
    if (val) to.set(key, val);
  });

  // opcional (ajuda MUITO em cross-domain): enviar fbp/fbc também
  const fbp = getCookie("_fbp");
  const fbc = getCookie("_fbc");
  if (fbp) to.set("fbp", fbp);
  if (fbc) to.set("fbc", fbc);

  return toUrl.toString();
}

// Use esta função no botão final do Quiz
function goToVSL() {
  // ✅ Domínio correto confirmado por você
  const VSL_BASE = "https://maparevendedoras.netlify.app/";

  // 1) Gera 1 único eventId para dedupe (browser + CAPI)
  const eventId = genEventId();

  // 2) Dispara LEAD (evento padrão do Meta) no browser com eventID
  if (typeof fbq === "function") {
    fbq("track", "Lead", {}, { eventID: eventId });
  }

  // 3) Dispara LEAD no CAPI com o MESMO event_id (dedupe perfeito)
  sendCapi("Lead", eventId, {});

  // 4) (Opcional, mas útil p/ debug interno): mantém seu evento custom
  //    Se você quiser reduzir “poluição” de eventos, pode remover esta linha.
  fireMetaEvent("ClickCTA", { destination: "VSL" });

  // 5) Redireciona com passthrough (UTM + click IDs + fbp/fbc)
  window.location.href = buildPassthroughURL(VSL_BASE);
}

// Expor funções pro HTML (onclick)
window.startQuiz = startQuiz;
window.nextQuestion = nextQuestion;
window.selectOption = selectOption;
window.redirect = redirect;
window.goToVSL = goToVSL;

