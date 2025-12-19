// script.js

// Defines the total number of questions for progress calculation
const TOTAL_QUESTIONS = 17;

// --- ANALYTICS TRACKING (GA4 + Pixel) ---
function trackEvent(eventName, details = {}) {
  console.log(`📊 Evento: ${eventName}`, details);

  // Google Analytics 4
  if (typeof gtag === "function") {
    gtag("event", eventName, details);
  }

  // Facebook Pixel (browser)
  if (typeof fbq === "function") {
    fbq("trackCustom", eventName, details);
  }
}

// --- Helpers: Event ID + Cookies + CAPI ---
function genEventId() {
  // Dedupe id (Pixel eventID + CAPI event_id)
  return (crypto?.randomUUID && crypto.randomUUID()) || String(Date.now()) + "-" + Math.random();
}

function getCookie(name) {
  const match = document.cookie.match(new RegExp("(^|; )" + name.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&") + "=([^;]*)"));
  return match ? decodeURIComponent(match[2]) : null;
}

async function sendCapi(eventName, eventId, extra = {}) {
  // fbp/fbc ajudam match quality (se existirem)
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

    // opcional: log de debug
    const data = await resp.json().catch(() => null);
    if (!resp.ok) {
      console.warn("⚠️ CAPI error:", resp.status, data);
    } else {
      console.log("✅ CAPI ok:", data);
    }
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
  // GA4 + Pixel (sem eventID) via trackEvent (mantém seu log/GA4)
  // Porém para dedupe do Meta, precisamos do fbq com eventID:
  if (typeof fbq === "function") {
    fbq("trackCustom", eventName, details, { eventID: eventId });
  } else {
    // fallback: se não houver fbq, ao menos manda pro GA4
    trackEvent(eventName, details);
  }

  // GA4 (sempre)
  if (typeof gtag === "function") {
    gtag("event", eventName, details);
  }

  // CAPI (server) com MESMO event_id
  sendCapi(eventName, eventId, {});

  return eventId;
}

// --- Quiz Data - SPIN Selling Structure (Updated) ---
const questions = [
  // FASE 1 - SITUAÇÃO (com tensão embutida)
  {
    id: 1,
    text: "Hoje, quantas revendedoras realmente contribuem com vendas constantes na sua equipe?",
    options: ["Poucas — a maioria oscila ou para", "Algumas — mas dependem muito de cobrança", "Muitas — porém com comportamentos muito diferentes entre si"],
    phase: "SITUAÇÃO",
  },
  {
    id: 2,
    text: "Quando uma nova revendedora entra, você consegue prever se ela vai vender de verdade ou só “testar”?",
    options: ["Não, só descubro depois do prejuízo", "Às vezes acerto, mas erro bastante", "Tenho critérios, mas eles falham com frequência"],
    phase: "SITUAÇÃO",
  },
  {
    id: 3,
    text: "Hoje, sua equipe é formada por pessoas com objetivos muito diferentes entre si?",
    options: ["Sim, cada uma quer uma coisa", "Sim, e isso dificulta a gestão", "Sim, e gera conflitos e desistências"],
    phase: "SITUAÇÃO",
  },
  {
    id: 4,
    text: "Você sente que precisa se adaptar o tempo todo ao perfil de cada revendedora?",
    options: ["Sim, isso consome muita energia", "Sim, e me deixa sobrecarregado(a)", "Sim, e mesmo assim o resultado não compensa"],
    phase: "SITUAÇÃO",
  },
  // FASE 2 - PROBLEMA (Equipe Zumbi escancarada)
  {
    id: 5,
    text: "Quantas revendedoras hoje ocupam espaço na equipe, mas vendem pouco ou nada?",
    options: ["Mais do que eu gostaria", "Uma parte significativa", "Poucas, mas já causam prejuízo"],
    phase: "PROBLEMA",
  },
  {
    id: 6,
    text: "Com que frequência alguém da equipe começa bem e depois desaparece ou trava?",
    options: ["Acontece o tempo todo", "Acontece com frequência", "Acontece mais do que deveria"],
    phase: "PROBLEMA",
  },
  {
    id: 7,
    text: "Quando mercadorias retornam, qual dessas situações é mais comum?",
    options: ["Falta de cuidado e atraso", "Peças paradas sem justificativa", "Dificuldade para cobrar ou recuperar"],
    phase: "PROBLEMA",
  },
  {
    id: 8,
    text: "Você sente que parte da equipe não leva a revenda como negócio, apenas como oportunidade momentânea?",
    options: ["Sim, claramente", "Sim, em boa parte da equipe", "Sim, e isso afeta o faturamento"],
    phase: "PROBLEMA",
  },
  {
    id: 9,
    text: "Hoje, você sente que depende mais de sorte do que de método para ter boas revendedoras?",
    options: ["Sim, totalmente", "Sim, em muitos casos", "Sim, e isso me preocupa"],
    phase: "PROBLEMA",
  },
  // FASE 3 - IMPLICAÇÃO (dor financeira e mental)
  {
    id: 10,
    text: "Se essas pessoas improdutivas saíssem hoje da equipe, o que mudaria?",
    options: ["Meu caixa respiraria", "Meu tempo aumentaria", "Minha operação ficaria mais leve"],
    phase: "IMPLICAÇÃO",
  },
  {
    id: 11,
    text: "Quanto da sua energia é gasta tentando fazer alguém vender, em vez de crescer o negócio?",
    options: ["Energia demais", "Muito mais do que deveria", "O suficiente para me travar"],
    phase: "IMPLICAÇÃO",
  },
  {
    id: 12,
    text: "Qual o maior prejuízo hoje?",
    options: ["Dinheiro parado", "Tempo desperdiçado", "Estresse constante"],
    phase: "IMPLICAÇÃO",
  },
  {
    id: 13,
    text: "Se nada mudar, o que tende a acontecer nos próximos meses?",
    options: ["Continuar apagando incêndio", "Crescer com caos", "Estagnar por cansaço"],
    phase: "IMPLICAÇÃO",
  },
  // FASE 4 - NECESSIDADE E COMPROMISSO (SIM EM TUDO)
  {
    id: 14,
    text: "Você concorda que não dá para escalar uma equipe sem separar perfis?",
    options: ["Concordo totalmente", "Concordo, mas não sei como fazer", "Concordo e preciso resolver isso"],
    phase: "NECESSIDADE",
  },
  {
    id: 15,
    text: "Se você tivesse um método claro para identificar quem deve ficar, sair ou crescer, usaria?",
    options: ["Sim, imediatamente", "Sim, isso mudaria tudo", "Sim, é exatamente o que falta"],
    phase: "NECESSIDADE",
  },
  {
    id: 16,
    text: "Você acredita que o problema hoje não é esforço, mas perfil errado no lugar errado?",
    options: ["Sim, ficou claro agora", "Sim, faz muito sentido", "Sim, nunca tinha pensado assim"],
    phase: "NECESSIDADE",
  },
  {
    id: 17,
    text: "O que você quer resolver primeiro?",
    options: ["Parar de perder dinheiro com equipe errada", "Organizar a equipe para crescer", "Ter clareza total antes de investir mais"],
    phase: "NECESSIDADE",
  },
];

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
  // Evita disparar StartQuiz duas vezes
  if (!didStart) {
    didStart = true;

    // Dedupe Meta (browser+server)
    fireMetaEvent("StartQuiz", {
      source: "intro",
    });
  }

  // Animate transition out of Intro
  gsap.to(introScreen, {
    duration: 0.5,
    opacity: 0,
    y: -20,
    onComplete: () => {
      introScreen.classList.add("hidden");
      quizContainer.classList.remove("hidden");

      // Animate transition into Quiz
      gsap.fromTo(quizContainer, { opacity: 0, y: 20 }, { duration: 0.5, opacity: 1, y: 0 });

      renderQuestion(currentQuestionIndex);
    },
  });
}

function renderQuestion(index) {
  const question = questions[index];

  // reset seleção
  selectedOptionIndex = null;

  // Update Progress
  const progress = Math.round((index / TOTAL_QUESTIONS) * 100);
  progressBar.style.width = `${progress}%`;
  progressText.innerText = `${progress}%`;

  // Evento de visualização de pergunta (1x por render)
  fireMetaEvent("ViewQuestion", {
    question_number: index + 1,
    phase: question.phase,
    question_id: question.id,
  });

  // Generate Options HTML
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

  // Inject Content with Fade Up Animation
  questionContent.innerHTML = `
    <div class="animate-content">
      <span class="text-xs font-bold text-accent tracking-widest uppercase mb-2 block">${question.phase}</span>
      <h3 class="text-xl md:text-2xl font-bold text-slate-800 mb-6 leading-tight">${question.text}</h3>
      <div class="space-y-3 flex flex-col">
        ${optionsHtml}
      </div>
    </div>
  `;

  // GSAP Animation for question entry
  gsap.fromTo(".animate-content", { opacity: 0, y: 20 }, { duration: 0.4, opacity: 1, y: 0, ease: "power2.out" });

  // Reset Next Button
  nextBtn.classList.add("hidden", "opacity-0");
  nextBtn.classList.remove("flex");
}

function selectOption(optionIndex, element) {
  selectedOptionIndex = optionIndex;

  // Remove selected state from all siblings
  const allOptions = document.querySelectorAll(".option-card");
  allOptions.forEach((opt) => opt.classList.remove("selected", "border-accent", "bg-accent/5"));

  // Add selected state to clicked element
  element.classList.add("selected");

  // Evento opcional: seleção (se quiser mapear dropoff por alternativa)
  fireMetaEvent("SelectOption", {
    question_number: currentQuestionIndex + 1,
    question_id: questions[currentQuestionIndex].id,
    option_index: optionIndex,
  });

  // Show Next Button with animation
  if (nextBtn.classList.contains("hidden")) {
    nextBtn.classList.remove("hidden");
    nextBtn.classList.add("flex");
    gsap.to(nextBtn, {
      duration: 0.3,
      opacity: 1,
      y: 0,
      ease: "back.out(1.7)",
    });
  }
}

function nextQuestion() {
  // Proteção: não deixa avançar sem selecionar
  if (selectedOptionIndex === null) {
    console.warn("⚠️ Nenhuma opção selecionada.");
    return;
  }

  // Register Answer (corrigido)
  answers.push({
    questionId: questions[currentQuestionIndex].id,
    selectedOptionIndex,
    phase: questions[currentQuestionIndex].phase,
  });

  // Animate Exit
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

    // Evento de conclusão (dedupe)
    fireMetaEvent("QuizComplete", {
      total_answers: answers.length,
    });
  }

  // Hide Quiz Container
  gsap.to(quizContainer, {
    duration: 0.5,
    opacity: 0,
    scale: 0.95,
    onComplete: () => {
      quizContainer.classList.add("hidden");
      loadingScreen.classList.remove("hidden");

      // Simulate Analysis Delay
      setTimeout(() => {
        loadingScreen.classList.add("hidden");
        resultScreen.classList.remove("hidden");

        // Animate Result Entry
        gsap.fromTo(resultScreen, { opacity: 0, scale: 0.9 }, { duration: 0.6, opacity: 1, scale: 1, ease: "back.out(1.2)" });
      }, 2500);
    },
  });
}

function redirect() {
  // Evento de clique no CTA final (dedupe)
  fireMetaEvent("ClickCTA", {
    destination: "Landing Page",
  });

  // Replace with actual URL
  window.location.href = "#landing-page";
}

// Expor funções pro HTML (onclick)
window.startQuiz = startQuiz;
window.nextQuestion = nextQuestion;
window.selectOption = selectOption;
window.redirect = redirect;
