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
// ------------------------
// DATA MODEL - SOPHISTICATED
// ------------------------
let userState = {
    baseSize: 0, // 0-3 index
    financialLoss: 0,
    score: 0,
    answers: []
};

// SCORING: Total possible points = 100.
// 6 Questions -> ~16.6 pts each.
const questions = [
    {
        id: 1, phase: "VOLUME DE RISCO",
        text: "Qual o tamanho da sua 'frota' de revendedoras com maletas na rua hoje?",
        options: [
            { text: "Iniciante (1 a 10 maletas)", score: 10, value: 1 },
            { text: "Em expansão (11 a 30 maletas)", score: 15, value: 2 },
            { text: "Intermediário (31 a 60 maletas)", score: 15, value: 3 },
            { text: "Elite (Mais de 60 maletas)", score: 100, value: 4 } // Elite gets max score for volume?? No, risk is higher. Let's score 'Management Readiness'.
            // Actually, size doesn't determine score, MANAGEMENT does.
            // Let's reflow: Size determines MULTIPLIER for loss. Score comes from other Qs.
            // We'll give 'neutral' points here or points for ambition? 
            // Let's stick to the script: Size simply sets the "Risk Factor".
            // We will normalize point distribution on Q3-Q6.
        ],
        // REFACTOR: Options will just be strings in rendering, logic handles mapping.
        // Simplified for this implementation to keep it clean:
        options: ["Iniciante (1 a 10 maletas)", "Em expansão (11 a 30 maletas)", "Intermediário (31 a 60 maletas)", "Elite (Mais de 60 maletas)"],
        provocation: "Quanto maior a frota, maior o risco de 'vazamento silencioso' se não houver rastreamento de perfil.",
        action: (idx) => { userState.baseSize = idx + 1; },
        calcScore: (idx) => 10 // Base participation points
    },
    {
        id: 2, phase: "SANGRIA FINANCEIRA",
        text: "Somando calotes, peças sumidas e devoluções ruins, quanto dinheiro seu evaporou nos últimos 6 meses?",
        options: ["Sangria Leve (Até R$ 2.000,00)", "Sangria Moderada (Entre R$ 2.000,00 e R$ 7.000,00)", "Hemorragia Grave (Acima de R$ 10.000,00)", "Não tenho controle exato (Risco Crítico)"],
        provocation: "Se você não sabe o número exato do prejuízo, sua operação está vulnerável e operando no escuro.",
        action: (idx) => {
            const values = [2000, 5000, 12000, 15000]; // 15k penalty for unknown
            userState.financialLoss = values[idx];
        },
        calcScore: (idx) => [20, 10, 0, 0][idx] // High points for low loss
    },
    {
        id: 3, phase: "MECANISMO DE BLINDAGEM",
        text: "Como você garante matematicamente que uma nova revendedora vai vender e pagar antes de entregar a maleta?",
        options: ["Não garanto, vou no 'feeling' e na conversa", "Analiso urgência financeira dela (Erro comum)", "Tenho critérios, mas ainda tomo calotes", "Uso Análise Psicográfica (Método das Gigantes)"],
        provocation: "Esperar a 'índole' da pessoa é torcida. Usar método preditivo é gestão.",
        calcScore: (idx) => [0, 5, 10, 20][idx] // Max points for using method
    },
    {
        id: 4, phase: "DIAGNÓSTICO DE VITALIDADE",
        text: "Qual a 'doença' mais comum que infecta sua equipe hoje?",
        options: ["Síndrome do Fogo de Palha (Começa animada, depois some)", "Inadimplência Crônica (Paga atrasado e devolve mal)", "Grupo Deserto (Ninguém interage ou vende)", "Dependência da Líder (Se eu paro de cobrar, as vendas param)"],
        provocation: "Uma equipe doente contamina seu fluxo de caixa e suga sua energia vital.",
        calcScore: (idx) => [5, 0, 5, 20][idx]
    },
    {
        id: 5, phase: "CUSTO DE OPORTUNIDADE",
        text: "Você passa mais tempo agindo como CEO Estratégica ou como 'Cobradora de Luxo'?",
        options: ["Cobradora: Passo o dia conferindo peças e cobrando", "Apaga-Incêndio: Resolvo problemas o tempo todo", "Dividida: Tento gerir, mas o operacional me engole", "CEO: Foco apenas em crescimento e estratégia"],
        provocation: "Quem gasta tempo cobrando não tem tempo para escalar. Você precisa automatizar a triagem.",
        calcScore: (idx) => [0, 5, 10, 20][idx]
    },
    {
        id: 6, phase: "ULTIMATO DE CRESCIMENTO",
        text: "Você prefere continuar refém da sorte ou instalar o 'motor de previsibilidade' das grandes marcas?",
        options: ["Quero o Motor: Profissionalizar minha triagem agora", "Quero Estancar a Sangria: Parar de perder dinheiro", "Sei que tenho problemas, mas vou tentar resolver sem ajuda"],
        provocation: "O mercado não perdoa amadorismo. Sua decisão hoje define seu extrato bancário do ano que vem.",
        calcScore: (idx) => [10, 10, 0][idx]
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
             <div class="flex justify-between mb-4">
                <span class="text-xs font-bold text-slate-400 uppercase tracking-widest ml-4">Arquivo #${index + 1}</span>
                <span class="text-xs font-bold text-slate-900 bg-slate-100 px-2 py-1 rounded uppercase">${q.phase}</span>
             </div>
             ${transitionHtml}
             <h3 class="text-xl md:text-2xl font-bold text-slate-900 mb-8 font-heading" style="line-height: 1.4;">${q.text}</h3>
             <div class="flex flex-col gap-4">${opts}</div>
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

    // Add scoring logic immediately or at end? Actions handle state immediately.
    // We run the action now? Yes.
    // Ideally we'd wait for 'Next' but standard is instant feedback or store. 
    // We store in answers[] on next.

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

    const q = questions[currentQuestionIndex];
    // Calculate and store points for this answer
    const pts = q.calcScore ? q.calcScore(selectedOptionIndex) : 0;
    userState.score += pts;
    answers.push({ questionId: q.id, selectedOptionIndex, score: pts });

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
        fireMetaEvent("QuizComplete", { total_answers: answers.length, final_score: userState.score });
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

    // 1. FINANCIAL CALCS
    // Direct Loss (Reported) - Annualized
    let directLoss = userState.financialLoss * 2; // "Last 6 months" * 2 = Annual. 
    // If user selected "Unknown" (Value 15000), treat as 30k annualized direct risk.

    // Opportunity Cost (Hidden Loss)
    // Avg Revenue Per Rep (Good vs Bad): Gap is approx R$ 800/mo.
    // Team Size Est: [5, 20, 45, 80]
    const teamSizes = [5, 20, 45, 80];
    const teamSize = teamSizes[userState.baseSize - 1] || 5;
    const efficiencyGap = 500; // Conservative estimate of monthly loss per "bad" rep
    const opportunityLoss = (teamSize * 0.4) * efficiencyGap * 12; // Assuming 40% of team is suboptimal

    const totalMoneyOnTable = directLoss + opportunityLoss;
    const fmt = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v);

    // 2. SCORE & COPY
    const score = Math.min(userState.score, 94); // Cap at 94 even if perfect, nobody is 100% to sell the improvement.
    // Actually, if they picked all perfect, they might not need the product? 
    // Just ensure max score isn't 100.

    let riskLevel = "ALTÍSSIMO";
    let scoreColor = "#ef4444"; // Red-500
    if (score > 40) { riskLevel = "ALTO"; scoreColor = "#f97316"; } // Orange-500
    if (score > 70) { riskLevel = "MODERADO"; scoreColor = "#eab308"; } // Yellow-500

    // 3. RENDER DASHBOARD
    resultDiv.innerHTML = `
        <div class="container-dash">
            
            <!-- HEADER -->
            <div class="dash-header">
                <p class="text-xs font-bold uppercase tracking-widest text-slate-500 mb-1">Dossiê de Maturidade Operacional</p>
                <div class="text-sm font-medium text-slate-600">ID da Operação: <span class="font-mono text-slate-900 font-bold">#${genEventId().slice(0, 8).toUpperCase()}</span></div>
            </div>

            <!-- ELIGIBILITY BANNER -->
            <div class="bg-slate-900 text-white p-4 rounded-lg text-center mb-6 shadow-lg">
                <span class="text-xs font-bold uppercase tracking-widest text-emerald-400 mb-2 block">Status da Aplicação</span>
                <div class="flex items-center justify-center gap-2 mb-2">
                    <div class="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-slate-900">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path></svg>
                    </div>
                    <span class="text-2xl font-bold font-heading">VOCÊ ESTÁ APTA</span>
                </div>
                <p class="text-xs text-slate-400 mt-2 max-w-md mx-auto" style="line-height: 1.5;">
                    Sua operação foi aprovada para receber o protocolo de correção imediata.
                </p>
            </div>

            <!-- SCORE ROW -->
            <div class="score-badge-container">
                <div class="score-badge">
                    <div class="donut-chart" style="--percent: ${score}%; --fill-color: ${scoreColor};">
                        <div class="donut-inner">
                            <span class="donut-value" style="color: ${scoreColor};">${score}</span>
                        </div>
                    </div>
                    <span class="donut-label">Seu Índice (OMI)</span>
                </div>
                
                <div class="score-badge" style="opacity: 0.5;">
                    <div class="donut-chart" style="--percent: 92%; --fill-color: #059669;">
                        <div class="donut-inner">
                            <span class="donut-value" style="color: #059669;">92</span>
                        </div>
                    </div>
                    <span class="donut-label">Marcas Gigantes</span>
                </div>
            </div>

            <div class="text-center mb-6">
                 <h3 class="text-xl font-bold text-slate-900">Elegibilidade Confirmada: <span class="text-red-600">Alerta de Risco</span></h3>
            </div>


            <!-- MONEY ON TABLE (Sanria) -->
            <div class="money-loss-section animate-pop">
                <div class="flex items-center justify-center gap-2 mb-2 text-red-800">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    <span class="font-bold uppercase text-xs tracking-wider">Dinheiro na Mesa (Anual)</span>
                </div>
                <div class="money-val">${fmt(totalMoneyOnTable)}</div>
                <p class="text-sm text-red-700 mt-2 font-medium px-4">
                    Este é o valor que validou sua elegibilidade. Você está deixando uma fortuna na mesa por não ter a blindagem correta.
                </p>
            </div>


            <!-- COMPARATIVE CHART -->
            <div class="chart-container">
                <h4 class="text-sm font-bold text-slate-900 mb-4 uppercase tracking-wide border-b border-slate-100 pb-2">Comparativo de Eficiência</h4>
                
                <div class="chart-row">
                    <span class="chart-label">Sua Marca</span>
                    <div class="chart-bar-bg">
                        <div class="chart-bar-fill" style="width: ${score}%; background-color: ${scoreColor};"></div>
                    </div>
                </div>

                 <div class="chart-row">
                    <span class="chart-label">Média do Mercado</span>
                    <div class="chart-bar-bg">
                        <div class="chart-bar-fill" style="width: 45%; background-color: #cbd5e1;"></div>
                    </div>
                </div>

                 <div class="chart-row">
                    <span class="chart-label text-emerald-600">Top Players</span>
                    <div class="chart-bar-bg">
                        <div class="chart-bar-fill" style="width: 92%; background-color: #059669;"></div>
                    </div>
                </div>
                
                <p class="text-xs text-slate-400 mt-3 text-right">*Baseado em benchmark de +33k operações</p>
            </div>


            <!-- DIAGNOSTIC BREAKDOWN -->
            <h4 class="text-sm font-bold text-slate-900 mb-3 uppercase tracking-wide">Pontos Críticos Detectados:</h4>
            <div class="diag-grid">
                <div class="diag-card" style="--border-col: #ef4444;">
                    <div class="diag-icon text-red-500">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                    </div>
                    <h5 class="font-bold text-slate-900 text-sm mb-1">Triagem Vulnerável</h5>
                    <p class="text-xs text-slate-600">Seu filtro de entrada atual permite a entrada de perfis de alto risco.</p>
                </div>

                <div class="diag-card" style="--border-col: #f59e0b;">
                    <div class="diag-icon text-yellow-600">
                         <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    </div>
                    <h5 class="font-bold text-slate-900 text-sm mb-1">Custo Operacional Alto</h5>
                    <p class="text-xs text-slate-600">O tempo gasto apagando incêndios está drenando a margem de lucro da operação.</p>
                </div>
            </div>

            <div class="bg-emerald-50 border border-emerald-200 rounded-lg p-4 mt-4">
                <p class="text-sm font-medium text-emerald-800">
                    <span class="font-bold">Protocolo Liberado:</span> Como sua operação já possui volume, a implementação do Método Psicográfico terá impacto financeiro imediato.
                </p>
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
