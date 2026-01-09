// script.js - Optimized & Refined (SPIN Power + Spacing Fix)

// --- ANALYTICS TRACKING (GA4 + Pixel) ---
function trackEvent(eventName, details = {}) {
    // Safe logging
    if (location.hostname === "localhost" || location.hostname === "127.0.0.1") {
        console.log(`📊 Evento: ${eventName}`, details);
    }

    // Google Analytics 4
    if (typeof gtag === "function") gtag("event", eventName, details);

    // Facebook Pixel (browser)
    if (typeof fbq === "function") fbq("trackCustom", eventName, details);
}

// --- Helpers: Event ID + Cookies + CAPI ---
function genEventId() {
    return (window.crypto?.randomUUID && window.crypto.randomUUID()) || String(Date.now()) + "-" + Math.random();
}

function getCookie(name) {
    const match = document.cookie.match(
        new RegExp("(^|; )" + name.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&") + "=([^;]*)")
    );
    return match ? decodeURIComponent(match[2]) : null;
}

// Optimized CAPI sender
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
        if (navigator.sendBeacon) {
            const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
            navigator.sendBeacon("/.netlify/functions/capi", blob);
        } else {
            fetch("/.netlify/functions/capi", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
                keepalive: true
            }).catch(err => console.warn("CAPI fail", err));
        }
    } catch (err) {
        // console.warn("⚠️ CAPI fetch failed:", err);
    }
}

const META_STANDARD_EVENTS = new Set([
    "PageView", "ViewContent", "Lead", "CompleteRegistration",
    "AddToCart", "InitiateCheckout", "Purchase"
]);

function fireMetaEvent(eventName, details = {}, eventId = genEventId()) {
    const isStandard = META_STANDARD_EVENTS.has(eventName);

    // Pixel (browser)
    if (typeof fbq === "function") {
        if (isStandard) {
            fbq("track", eventName, details, { eventID: eventId });
        } else {
            fbq("trackCustom", eventName, details, { eventID: eventId });
        }
    } else {
        trackEvent(eventName, details);
    }

    // GA4
    if (typeof gtag === "function") gtag("event", eventName, details);

    // CAPI
    sendCapi(eventName, eventId, {});
    return eventId;
}

// ------------------------
// DATA MODEL & QUESTIONS (POWER SPIN)
// ------------------------

let userState = {
    baseSize: 0,
    financialLoss: 0,
    manualManagement: false,
    needsHelp: true
};

const questions = [
    {
        id: 1,
        phase: "VOLUME DE RISCO",
        text: "Qual o tamanho da sua 'frota' de revendedoras com maletas na rua hoje?",
        options: [
            "Iniciante (1 a 10 maletas)",
            "Em expansão (11 a 30 maletas)",
            "Intermediário (31 a 60 maletas)",
            "Elite (Mais de 60 maletas)"
        ],
        provocation: "Quanto maior a frota, maior o risco de 'vazamento silencioso' se não houver rastreamento de perfil.",
        action: (idx) => { userState.baseSize = idx + 1; }
    },
    {
        id: 2,
        phase: "SANGRIA FINANCEIRA",
        text: "Somando calotes, peças sumidas e devoluções ruins, quanto dinheiro seu evaporou nos últimos 6 meses?",
        options: [
            "Sangria Leve (Até R$ 2.000,00)",
            "Sangria Moderada (Entre R$ 2.000,00 e R$ 7.000,00)",
            "Hemorragia Grave (Acima de R$ 10.000,00)",
            "Não tenho controle exato (Risco Crítico)"
        ],
        provocation: "Se você não sabe o número exato do prejuízo, sua operação está vulnerável e operando no escuro.",
        action: (idx) => {
            if (idx === 0) userState.financialLoss = 2000;
            if (idx === 1) userState.financialLoss = 5000;
            if (idx === 2) userState.financialLoss = 12000;
            if (idx === 3) userState.financialLoss = -1; // Desconhecido = Alto Risco
        }
    },
    {
        id: 3,
        phase: "MECANISMO DE BLINDAGEM",
        text: "Como você garante matematicamente que uma nova revendedora vai vender e pagar antes de entregar a maleta?",
        options: [
            "Não garanto, vou no 'feeling' e na conversa",
            "Analiso urgência financeira dela (Erro comum)",
            "Tenho critérios, mas ainda tomo calotes",
            "Uso Análise Psicográfica (Método das Gigantes)"
        ],
        provocation: "Esperar a 'índole' da pessoa é torcida. Usar método preditivo é gestão."
    },
    {
        id: 4,
        phase: "DIAGNÓSTICO DE VITALIDADE",
        text: "Qual a 'doença' mais comum que infecta sua equipe hoje?",
        options: [
            "Síndrome do Fogo de Palha (Começa animada, depois some)",
            "Inadimplência Crônica (Paga atrasado e devolve mal)",
            "Grupo Deserto (Ninguém interage ou vende)",
            "Nenhuma, meu time é de Alta Performance (Raro)"
        ],
        provocation: "Uma equipe doente contamina seu fluxo de caixa e suga sua energia vital."
    },
    {
        id: 5,
        phase: "CUSTO DE OPORTUNIDADE",
        text: "Você passa mais tempo agindo como CEO Estratégica ou como 'Cobradora de Luxo'?",
        options: [
            "Cobradora: Passo o dia conferindo peças e cobrando",
            "Apaga-Incêndio: Resolvo problemas o tempo todo",
            "Dividida: Tento gerir, mas o operacional me engole",
            "CEO: Foco apenas em crescimento e estratégia"
        ],
        provocation: "Quem gasta tempo cobrando não tem tempo para escalar. Você precisa automatizar a triagem."
    },
    {
        id: 6,
        phase: "ULTIMATO DE CRESCIMENTO",
        text: "Você prefere continuar refém da sorte ou instalar o 'motor de previsibilidade' das grandes marcas?",
        options: [
            "Quero o Motor: Profissionalizar minha triagem agora",
            "Quero Estancar a Sangria: Parar de perder dinheiro",
            "Ainda acho que consigo resolver sozinha na sorte"
        ],
        provocation: "O mercado não perdoa amadorismo. Sua decisão hoje define seu extrato bancário do ano que vem."
    }
];

const TOTAL_QUESTIONS = questions.length;
let currentQuestionIndex = 0;
let answers = [];
let selectedOptionIndex = null;
let didStart = false;
let didComplete = false;

// DOM Elements - Cached
const dom = {
    introScreen: document.getElementById("intro-screen"),
    quizContainer: document.getElementById("quiz-container"),
    questionContent: document.getElementById("question-content"),
    progressBar: document.getElementById("progress-bar"),
    progressText: document.getElementById("progress-text"),
    nextBtn: document.getElementById("next-btn"),
    loadingScreen: document.getElementById("loading-screen"),
    resultScreen: document.getElementById("result-screen")
};

// --- QUIZ LOGIC ---

function startQuiz() {
    if (!didStart) {
        didStart = true;
        fireMetaEvent("StartQuiz", { source: "intro_dossier" });
    }

    if (typeof gsap !== 'undefined') {
        gsap.to(dom.introScreen, {
            duration: 0.4, opacity: 0, y: -20,
            onComplete: () => {
                dom.introScreen.classList.add("hidden");
                dom.quizContainer.classList.remove("hidden");
                gsap.fromTo(dom.quizContainer, { opacity: 0, y: 20 }, { duration: 0.4, opacity: 1, y: 0 });
                renderQuestion(currentQuestionIndex);
            },
        });
    } else {
        dom.introScreen.classList.add("hidden");
        dom.quizContainer.classList.remove("hidden");
        renderQuestion(currentQuestionIndex);
    }
}

function renderQuestion(index) {
    const question = questions[index];
    selectedOptionIndex = null;

    const progress = Math.round((index / TOTAL_QUESTIONS) * 100);
    dom.progressBar.style.width = `${progress}%`;
    dom.progressText.innerText = `${progress}%`;

    fireMetaEvent("ViewQuestion", {
        question_number: index + 1,
        phase: question.phase,
        question_id: question.id,
    });

    const optionsHtml = question.options.map((opt, i) => `
    <div class="option-card border border-slate-200 rounded-lg p-4 flex items-center gap-3 cursor-pointer group hover:border-black/50 hover:bg-slate-50 transition-all duration-200"
         onclick="selectOption(${i}, this)">
      <div class="option-circle w-5 h-5 rounded-full border border-slate-400 flex items-center justify-center shrink-0">
        <div class="option-check w-2.5 h-2.5 bg-black rounded-full opacity-0 transform scale-0 transition-all duration-200"></div>
      </div>
      <span class="text-slate-800 font-medium group-hover:text-black transition-colors text-base md:text-lg">${opt}</span>
    </div>
  `).join("");

    const prevProvocation = (index > 0) ? questions[index - 1].provocation : "";
    // Show provocation ONLY if it exists and we are not at start
    const transitionHtml = prevProvocation
        ? `<div class="mb-6 p-4 bg-yellow-50/50 border-l-2 border-yellow-500 text-slate-600 text-sm md:text-base italic rounded-r">
         <span class="font-bold text-yellow-700 not-italic block mb-1 text-xs uppercase tracking-wider">Insights do Mercado:</span>
         "${prevProvocation}"
       </div>`
        : "";

    dom.questionContent.innerHTML = `
    <div class="animate-content">
      <div class="flex items-center justify-between mb-2">
        <span class="text-[10px] md:text-xs font-bold text-slate-400 tracking-[0.2em] uppercase">Arquivo #${index + 1}</span>
        <span class="text-[10px] md:text-xs font-bold text-slate-900 bg-slate-100 px-2 py-1 rounded tracking-wider uppercase">${question.phase}</span>
      </div>
      
      ${transitionHtml}

      <h3 class="text-xl md:text-2xl font-bold text-slate-900 mb-6 leading-snug font-heading">${question.text}</h3>
      <div class="space-y-3 flex flex-col">
        ${optionsHtml}
      </div>
    </div>
  `;

    if (typeof gsap !== 'undefined') {
        gsap.fromTo(".animate-content", { opacity: 0, y: 10 }, { duration: 0.3, opacity: 1, y: 0 });
    }

    dom.nextBtn.classList.add("hidden", "opacity-0");
    dom.nextBtn.classList.remove("flex");
}

function selectOption(optionIndex, element) {
    selectedOptionIndex = optionIndex;

    const allOptions = document.querySelectorAll(".option-card");
    allOptions.forEach((opt) => {
        opt.classList.remove("selected", "border-black", "bg-slate-50");
        opt.querySelector(".option-check").classList.remove("opacity-100", "scale-100");
    });

    element.classList.add("selected", "border-black", "bg-slate-50");
    element.querySelector(".option-check").classList.add("opacity-100", "scale-100");

    fireMetaEvent("SelectOption", {
        question_number: currentQuestionIndex + 1,
        question_id: questions[currentQuestionIndex].id,
        option_index: optionIndex,
    });

    if (questions[currentQuestionIndex].action) {
        questions[currentQuestionIndex].action(optionIndex);
    }

    // Auto-show button
    if (dom.nextBtn.classList.contains("hidden")) {
        dom.nextBtn.classList.remove("hidden");
        dom.nextBtn.classList.add("flex");
        if (typeof gsap !== 'undefined') {
            gsap.to(dom.nextBtn, { duration: 0.3, opacity: 1, y: 0, ease: "power2.out" });
        } else {
            dom.nextBtn.classList.remove("opacity-0");
        }
    }
}

function nextQuestion() {
    if (selectedOptionIndex === null) return;

    answers.push({
        questionId: questions[currentQuestionIndex].id,
        selectedOptionIndex
    });

    const onNext = () => {
        currentQuestionIndex++;
        if (currentQuestionIndex < questions.length) {
            renderQuestion(currentQuestionIndex);
        } else {
            finishQuiz();
        }
    };

    if (typeof gsap !== 'undefined') {
        gsap.to(".animate-content", {
            duration: 0.2, opacity: 0, x: -10,
            onComplete: onNext
        });
    } else {
        onNext();
    }
}

function finishQuiz() {
    if (!didComplete) {
        didComplete = true;
        fireMetaEvent("QuizComplete", { total_answers: answers.length });
    }

    const showResult = () => {
        dom.quizContainer.classList.add("hidden");
        dom.loadingScreen.classList.remove("hidden");

        generateDiagnosis();

        setTimeout(() => {
            dom.loadingScreen.classList.add("hidden");
            dom.resultScreen.classList.remove("hidden");
            if (typeof gsap !== 'undefined') {
                gsap.fromTo(dom.resultScreen, { opacity: 0, scale: 0.95 }, { duration: 0.5, opacity: 1, scale: 1, ease: "power2.out" });
            }
        }, 2200);
    };

    if (typeof gsap !== 'undefined') {
        gsap.to(dom.quizContainer, { duration: 0.4, opacity: 0, scale: 0.98, onComplete: showResult });
    } else {
        showResult();
    }
}

function generateDiagnosis() {
    const resultDiv = document.getElementById("diagnosis-content");

    // Project Loss
    let projectedLoss = 0;
    if (userState.financialLoss > 0) {
        projectedLoss = userState.financialLoss * 2; // Annual projection
    } else {
        // Estimates based on fleet size
        const estimates = [6000, 18000, 48000, 96000];
        projectedLoss = estimates[userState.baseSize - 1] || 6000;
    }

    const fmtMoney = (val) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

    // FIX: Using DIV structure inside LI to prevent flexbox spacing issues
    const diagnosisHTML = `
        <div class="space-y-6 text-left">
            <div class="bg-red-50 border-l-4 border-red-500 p-5 rounded-r-lg shadow-sm">
                <h4 class="text-red-700 font-bold text-lg mb-2 uppercase tracking-wide text-xs">⚠️ Alerta de Risco Financeiro</h4>
                <p class="text-red-900 text-sm md:text-base leading-relaxed">
                    Operando neste padrão, sua projeção de desperdício é de 
                    <span class="font-black bg-red-100 px-1 rounded mx-1 text-red-800 border-b border-red-300 border-dotted cursor-help" title="Estimativa baseada em erros de triagem e inadimplência padrão">${fmtMoney(projectedLoss)} / ano</span>.
                    <br><span class="text-xs opacity-75 mt-1 block">Este é dinheiro que sai do seu lucro direto para o ralo da ineficiência.</span>
                </p>
            </div>

            <div class="space-y-4">
                <h4 class="font-bold text-slate-900 text-lg border-b pb-2">Pontos Críticos Identificados:</h4>
                <ul class="space-y-3 text-slate-700 text-sm md:text-base">
                    <!-- Item 1 -->
                    <li class="flex items-start gap-3">
                        <span class="text-red-500 mt-1 shrink-0">●</span> 
                        <div>
                            <strong class="text-slate-900 block font-bold">Recrutamento "Jogo de Rede":</strong>
                            <span>Você atrai volume, mas falha em filtrar a qualidade, criando uma base frágil.</span>
                        </div>
                    </li>
                    
                    <!-- Item 2 -->
                    <li class="flex items-start gap-3">
                        <span class="text-red-500 mt-1 shrink-0">●</span> 
                        <div>
                            <strong class="text-slate-900 block font-bold">Gestão Reativa (Zumbi):</strong>
                            <span>Sua rotina é consumida por cobrança e "babá", impedindo o crescimento real.</span>
                        </div>
                    </li>

                    <!-- Item 3 -->
                    <li class="flex items-start gap-3">
                        <span class="text-emerald-600 mt-1 shrink-0">●</span> 
                        <div>
                            <strong class="text-slate-900 block font-bold">O Segredo das Gigantes:</strong>
                            <span>Marcas como Avon utilizam <em class="bg-emerald-50 text-emerald-800 font-semibold px-1 rounded">Filtros Psicográficos</em> para prever o comportamento de venda.</span>
                        </div>
                    </li>
                </ul>
            </div>

            <div class="p-5 bg-slate-900 text-white rounded-xl shadow-lg relative overflow-hidden">
                <div class="absolute top-0 right-0 w-20 h-20 bg-white/5 rounded-full blur-2xl transform translate-x-10 -translate-y-10"></div>
                <p class="font-medium text-center italic relative z-10">
                    "Você não precisa de mais revendedoras. Você precisa de um detector de talentos."
                </p>
            </div>
        </div>
    `;

    resultDiv.innerHTML = diagnosisHTML;
}

// ------------------------
// PASSTHROUGH & REDIRECT
// ------------------------
function goToVSL() {
    const VSL_BASE = "https://maparevendedoras.netlify.app/";

    const eventId = genEventId();
    if (typeof fbq === "function") fbq("track", "Lead", {
        value: userState.financialLoss > 0 ? userState.financialLoss : 0,
        currency: 'BRL'
    }, { eventID: eventId });

    sendCapi("Lead", eventId, {
        custom_data: {
            projected_loss: userState.financialLoss
        }
    });

    const currentParams = new URLSearchParams(window.location.search);
    const targetUrl = new URL(VSL_BASE);

    currentParams.forEach((value, key) => targetUrl.searchParams.set(key, value));

    const fbp = getCookie("_fbp");
    if (fbp) targetUrl.searchParams.set("fbp", fbp);

    setTimeout(() => {
        window.location.href = targetUrl.toString();
    }, 300);
}

// Expose to Window
window.startQuiz = startQuiz;
window.selectOption = selectOption;
window.nextQuestion = nextQuestion;
window.goToVSL = goToVSL;
