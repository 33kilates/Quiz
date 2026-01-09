// script.js - Optimized (No GSAP, Native Transitions)

// --- ANALYTICS TRACKING (GA4 + Pixel) ---
function trackEvent(eventName, details = {}) {
    if (location.hostname === "localhost" || location.hostname === "127.0.0.1") {
        console.log(`📊 Evento: ${eventName}`, details);
    }
    if (typeof gtag === "function") gtag("event", eventName, details);
    if (typeof fbq === "function") fbq("trackCustom", eventName, details);
}

function genEventId() {
    return (window.crypto?.randomUUID && window.crypto.randomUUID()) || String(Date.now()) + "-" + Math.random();
}

function getCookie(name) {
    const match = document.cookie.match(new RegExp("(^|; )" + name.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&") + "=([^;]*)"));
    return match ? decodeURIComponent(match[2]) : null;
}

async function sendCapi(eventName, eventId, extra = {}) {
    // Basic CAPI without complex logic to save KB
    const payload = {
        event_name: eventName,
        event_id: eventId,
        event_source_url: window.location.href,
        ...extra,
    };
    try {
        if (navigator.sendBeacon) {
            const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
            navigator.sendBeacon("/.netlify/functions/capi", blob);
        } else {
            fetch("/.netlify/functions/capi", {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload), keepalive: true
            }).catch(() => { });
        }
    } catch (e) { }
}

const META_STANDARD_EVENTS = new Set(["PageView", "ViewContent", "Lead", "CompleteRegistration", "AddToCart", "InitiateCheckout", "Purchase"]);

function fireMetaEvent(eventName, details = {}, eventId = genEventId()) {
    const isStandard = META_STANDARD_EVENTS.has(eventName);
    if (typeof fbq === "function") {
        fbq(isStandard ? "track" : "trackCustom", eventName, details, { eventID: eventId });
    }
    if (typeof gtag === "function") gtag("event", eventName, details);
    sendCapi(eventName, eventId, { custom_data: details });
    return eventId;
}

// --- RETENTION TRACKING (DASHBOARD) ---
function trackRetentionStep(step) {
    // Fire-and-forget to analytics endpoint
    try {
        // Use full URL if simulated locally or relative path standard
        const url = "/.netlify/functions/analytics";
        const data = JSON.stringify({ step });

        if (navigator.sendBeacon) {
            const blob = new Blob([data], { type: 'application/json' });
            navigator.sendBeacon(url, blob);
        } else {
            fetch(url, { method: "POST", body: data, headers: { 'Content-Type': 'application/json' }, keepalive: true }).catch(() => { });
        }
    } catch (e) {
        console.error("Tracking Error", e);
    }
}

// Track Visit On Load
if (document.readyState === "loading") {
    // Wait for interactivity
    document.addEventListener("DOMContentLoaded", () => trackRetentionStep("visits"));
} else {
    trackRetentionStep("visits");
}

// ------------------------
// DATA MODEL
// ------------------------
let userState = { baseSize: 0, financialLoss: 0, manualManagement: false, needsHelp: true };

const questions = [
    {
        id: 1, phase: "VOLUME DE RISCO",
        text: "Qual o tamanho da sua 'frota' de revendedoras com maletas na rua hoje?",
        options: ["Iniciante (1 a 10 maletas)", "Em expansão (11 a 30 maletas)", "Intermediário (31 a 60 maletas)", "Elite (Mais de 60 maletas)"],
        provocation: "Quanto maior a frota, maior o risco de 'vazamento silencioso' se não houver rastreamento de perfil.",
        action: (idx) => { userState.baseSize = idx + 1; }
    },
    {
        id: 2, phase: "SANGRIA FINANCEIRA",
        text: "Somando calotes, peças sumidas e devoluções ruins, quanto dinheiro seu evaporou nos últimos 6 meses?",
        options: ["Sangria Leve (Até R$ 2.000,00)", "Sangria Moderada (Entre R$ 2.000,00 e R$ 7.000,00)", "Hemorragia Grave (Acima de R$ 10.000,00)", "Não tenho controle exato (Risco Crítico)"],
        provocation: "Se você não sabe o número exato do prejuízo, sua operação está vulnerável e operando no escuro.",
        action: (idx) => {
            if (idx === 0) userState.financialLoss = 2000;
            if (idx === 1) userState.financialLoss = 5000;
            if (idx === 2) userState.financialLoss = 12000;
            if (idx === 3) userState.financialLoss = -1;
        }
    },
    {
        id: 3, phase: "MECANISMO DE BLINDAGEM",
        text: "Como você garante matematicamente que uma nova revendedora vai vender e pagar antes de entregar a maleta?",
        options: ["Não garanto, vou no 'feeling' e na conversa", "Analiso urgência financeira dela (Erro comum)", "Tenho critérios, mas ainda tomo calotes", "Uso Análise Psicográfica (Método das Gigantes)"],
        provocation: "Esperar a 'índole' da pessoa é torcida. Usar método preditivo é gestão."
    },
    {
        id: 4, phase: "DIAGNÓSTICO DE VITALIDADE",
        text: "Qual a 'doença' mais comum que infecta sua equipe hoje?",
        options: ["Síndrome do Fogo de Palha (Começa animada, depois some)", "Inadimplência Crônica (Paga atrasado e devolve mal)", "Grupo Deserto (Ninguém interage ou vende)", "Nenhuma, meu time é de Alta Performance (Raro)"],
        provocation: "Uma equipe doente contamina seu fluxo de caixa e suga sua energia vital."
    },
    {
        id: 5, phase: "CUSTO DE OPORTUNIDADE",
        text: "Você passa mais tempo agindo como CEO Estratégica ou como 'Cobradora de Luxo'?",
        options: ["Cobradora: Passo o dia conferindo peças e cobrando", "Apaga-Incêndio: Resolvo problemas o tempo todo", "Dividida: Tento gerir, mas o operacional me engole", "CEO: Foco apenas em crescimento e estratégia"],
        provocation: "Quem gasta tempo cobrando não tem tempo para escalar. Você precisa automatizar a triagem."
    },
    {
        id: 6, phase: "ULTIMATO DE CRESCIMENTO",
        text: "Você prefere continuar refém da sorte ou instalar o 'motor de previsibilidade' das grandes marcas?",
        options: ["Quero o Motor: Profissionalizar minha triagem agora", "Quero Estancar a Sangria: Parar de perder dinheiro", "Ainda acho que consigo resolver sozinha na sorte"],
        provocation: "O mercado não perdoa amadorismo. Sua decisão hoje define seu extrato bancário do ano que vem."
    }
];

// --- APP STATE & DOM ---
const TOTAL_QUESTIONS = questions.length;
let currentQuestionIndex = 0;
let answers = [];
let selectedOptionIndex = null;
let didStart = false;
let didComplete = false;

const dom = {
    introScreen: document.getElementById("intro-screen"),
    quizContainer: document.getElementById("quiz-container"),
    questionContent: document.getElementById("question-content"),
    progressBar: document.getElementById("progress-bar"), // Fixed selector
    progressText: document.getElementById("progress-text"),
    nextBtn: document.getElementById("next-btn"),
    loadingScreen: document.getElementById("loading-screen"),
    resultScreen: document.getElementById("result-screen")
};

// --- ANIMATION HELPERS ---
function fadeOut(el, duration = 300, onComplete) {
    el.style.opacity = '1';
    el.style.transition = `opacity ${duration}ms, transform ${duration}ms`;

    requestAnimationFrame(() => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(-10px)';
        setTimeout(() => {
            el.classList.add("hidden");
            if (onComplete) onComplete();
        }, duration);
    });
}

function fadeIn(el, duration = 300) {
    el.classList.remove("hidden");
    el.classList.add("flex"); // Ensure flex display for containers

    el.style.opacity = '0';
    el.style.transform = 'translateY(10px)';
    el.style.transition = `opacity ${duration}ms, transform ${duration}ms`;

    requestAnimationFrame(() => {
        el.style.opacity = '1';
        el.style.transform = 'translateY(0)';
    });
}

// --- LOGIC ---
function startQuiz() {
    if (!didStart) {
        didStart = true;
        trackRetentionStep("start");
        fireMetaEvent("StartQuiz", { source: "intro_dossier" });
    }
    fadeOut(dom.introScreen, 300, () => {
        dom.quizContainer.classList.remove("hidden");
        // dom.quizContainer.classList.add("block");
        fadeIn(dom.quizContainer, 300);
        renderQuestion(currentQuestionIndex);
        trackRetentionStep("q1");
    });
}

function renderQuestion(index) {
    const q = questions[index];
    selectedOptionIndex = null;

    const progress = Math.round((index / TOTAL_QUESTIONS) * 100);
    dom.progressBar.style.width = `${progress}%`;
    dom.progressText.innerText = `${progress}%`;

    fireMetaEvent("ViewQuestion", { question_number: index + 1, phase: q.phase, question_id: q.id });

    const opts = q.options.map((opt, i) => `
        <div class="option-card" onclick="selectOption(${i}, this)">
            <div class="option-circle"><div class="option-check"></div></div>
            <span class="font-medium text-slate-800">${opt}</span>
        </div>
    `).join("");

    const prevProvocation = (index > 0) ? questions[index - 1].provocation : "";
    const transitionHtml = prevProvocation
        ? `<div class="mb-4 text-sm text-slate-600 italic bg-yellow-50 border-l-2 border-yellow-800 p-2 rounded-r">
             <span class="font-bold text-yellow-800 uppercase text-xs block not-italic mb-1">Insight de Mercado:</span>
             "${prevProvocation}"
           </div>` : "";

    // Internal fade out/in for content
    const contentHtml = `
        <div class="animate-content-inner" style="opacity:0; transform:translateY(5px); transition:all 0.3s ease;">
             <div class="flex justify-between mb-2">
                <span class="text-xs font-bold text-slate-400 uppercase tracking-widest">Arquivo #${index + 1}</span>
                <span class="text-xs font-bold text-slate-900 bg-slate-100 px-2 rounded uppercase">${q.phase}</span>
             </div>
             ${transitionHtml}
             <h3 class="text-xl md:text-2xl font-bold text-slate-900 mb-6 font-heading">${q.text}</h3>
             <div class="flex flex-col gap-3">${opts}</div>
        </div>
    `;

    dom.questionContent.innerHTML = contentHtml;

    // Animate in new content
    setTimeout(() => {
        const el = dom.questionContent.querySelector(".animate-content-inner");
        if (el) { el.style.opacity = '1'; el.style.transform = 'translateY(0)'; }
    }, 50);

    // Hide Next Button
    dom.nextBtn.classList.add("hidden");
    dom.nextBtn.classList.remove("flex");
}

function selectOption(idx, el) {
    selectedOptionIndex = idx;
    document.querySelectorAll(".option-card").forEach(c => c.classList.remove("selected"));
    el.classList.add("selected");

    fireMetaEvent("SelectOption", { question_number: currentQuestionIndex + 1, question_id: questions[currentQuestionIndex].id, option_index: idx });
    if (questions[currentQuestionIndex].action) questions[currentQuestionIndex].action(idx);

    if (dom.nextBtn.classList.contains("hidden")) {
        dom.nextBtn.classList.remove("hidden");
        dom.nextBtn.classList.add("flex");
        // Simple pop in
        dom.nextBtn.style.opacity = '0';
        dom.nextBtn.style.transform = 'translateY(10px)';
        dom.nextBtn.style.transition = 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)'; // bouncier
        requestAnimationFrame(() => {
            dom.nextBtn.style.opacity = '1';
            dom.nextBtn.style.transform = 'translateY(0)';
        });
    }
}

function nextQuestion() {
    if (selectedOptionIndex === null) return;

    answers.push({ questionId: questions[currentQuestionIndex].id, selectedOptionIndex });

    // Fade out current content
    const content = dom.questionContent.querySelector(".animate-content-inner");
    content.style.opacity = '0';
    content.style.transform = 'translateX(-10px)';

    setTimeout(() => {
        currentQuestionIndex++;
        if (currentQuestionIndex < questions.length) {
            renderQuestion(currentQuestionIndex);

            // TRACKING: Step Reached
            trackRetentionStep(`q${currentQuestionIndex + 1}`);
        } else {
            finishQuiz();
        }
    }, 250);
}

function finishQuiz() {
    if (!didComplete) {
        didComplete = true;
        fireMetaEvent("QuizComplete", { total_answers: answers.length });
        trackRetentionStep("leads");
    }

    fadeOut(dom.quizContainer, 300, () => {
        dom.loadingScreen.classList.remove("hidden");
        generateDiagnosis();

        setTimeout(() => {
            dom.loadingScreen.classList.add("hidden");
            dom.resultScreen.classList.remove("hidden"); // Remove hidden first to calc size
            fadeIn(dom.resultScreen, 500);
        }, 2200);
    });
}

function generateDiagnosis() {
    const resultDiv = document.getElementById("diagnosis-content");

    // Calculate losses
    let lossValue = userState.financialLoss > 0 ? userState.financialLoss : [6000, 18000, 48000, 96000][userState.baseSize - 1] || 6000;
    let projectedLoss = lossValue * 12; // Annual projection if monthly input, but logic implies direct value or annual. Assuming context. 
    // Actually, prompt says "evaporou nos ultimos 6 meses". 
    // If user selected "2000" (sangria leve), that's for 6 months? Or monthly? 
    // Let's assume the value is the total loss in 6 months for impact. 
    // Annual projection = 2 * value.
    const annualLoss = userState.financialLoss > 0 ? userState.financialLoss * 2 : lossValue;

    const fmt = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v);

    resultDiv.innerHTML = `
        <div class="score-container text-center">
            <div class="score-circle-lg">
                <span class="text-xs font-bold text-slate-400 uppercase">Risco</span>
                <span class="text-xl font-bold text-red-500">ALTO</span>
            </div>
            
            <h3 class="text-xl font-bold text-slate-800 mb-2">Seu Dinheiro Está Evaporando</h3>
            <p class="text-sm text-slate-500 max-w-sm mx-auto">
                Identificamos gargalos graves na sua gestão de revendedoras.
            </p>

            <div class="insight-grid">
                <!-- Loss Card -->
                <div class="insight-card insight-danger">
                    <div class="flex items-center gap-2 mb-2">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6"></path></svg>
                        <span class="font-bold uppercase text-xs tracking-wider">Projeção de Perda Anual</span>
                    </div>
                    <div class="text-2xl font-bold mb-1">${fmt(annualLoss)}</div>
                    <p class="text-xs opacity-80">Dinheiro que sai do seu caixa sem retorno se não houver blindagem.</p>
                </div>

                <!-- Opportunity Card -->
                <div class="insight-card insight-success">
                    <div class="flex items-center gap-2 mb-2">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        <span class="font-bold uppercase text-xs tracking-wider">Potencial Blindado</span>
                    </div>
                    <p class="text-sm font-medium">
                        Com o método de <strong>Análise Psicográfica</strong>, você pode reduzir essa perda em até 90% já no próximo ciclo.
                    </p>
                </div>
            </div>
        </div>
    `;
}

function goToVSL() {
    // Standard Redirect Logic
    const VSL_BASE = "https://maparevendedoras.netlify.app/";
    const eid = genEventId();

    // ELITE TRACKING (R$ 47 + Prediction)
    fireMetaEvent("Lead", {
        value: 47.00,
        currency: 'BRL',
        custom_data: {
            predicted_loss: userState.financialLoss,
            team_size_tier: userState.baseSize
        }
    }, eid);

    const target = new URL(VSL_BASE);
    new URLSearchParams(location.search).forEach((v, k) => target.searchParams.set(k, v));
    const fbp = getCookie("_fbp");
    if (fbp) target.searchParams.set("fbp", fbp);

    setTimeout(() => location.href = target.toString(), 300);
}

// Expose
window.startQuiz = startQuiz;
window.selectOption = selectOption;
window.nextQuestion = nextQuestion;
window.goToVSL = goToVSL;
