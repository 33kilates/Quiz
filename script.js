(function() {
    "use strict";

    const model = { estLoss: 0, range: "", activeCount: 0, maturityPoints: 0 };
    const fmt = (v) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(v);

    // --- ANALYTICS & CAPI ---
    function genEventId() { return (crypto?.randomUUID && crypto.randomUUID()) || String(Date.now()) + "-" + Math.random(); }
    function getCookie(n) { const m = document.cookie.match(new RegExp("(^|; )" + n.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&") + "=([^;]*)")); return m ? decodeURIComponent(m[2]) : null; }

    async function sendCapi(eventName, eventId, extra = {}) {
        const payload = { event_name: eventName, event_id: eventId, event_source_url: window.location.href, fbp: getCookie("_fbp"), fbc: getCookie("_fbc"), ...extra };
        try { await fetch("/.netlify/functions/capi", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) }); } catch (err) { console.warn("CAPI Error", err); }
    }

    function fireMetaEvent(eventName, details = {}) {
        const eventId = genId();
        if (typeof fbq === "function") fbq("track", eventName, details, { eventID: eventId });
        sendCapi(eventName, eventId, { custom_data: details });
    }

    // --- QUIZ DATA ---
    const questions = [
        { ph: "SITUAÇÃO", q: "Qual o tamanho atual da sua base de revendedoras?", opts: ["1 a 10", "11 a 30", "31 a 60", "Mais de 60"], prov: "Empresas que não medem a base com precisão sofrem vazamento silencioso no 1º trimestre.", map: (o, i) => { model.range = o; model.activeCount = [8, 20, 45, 80][i]; } },
        { ph: "FINANCEIRO", q: "Qual seu prejuízo estimado nos últimos 6 meses?", opts: ["Até R$ 2k", "R$ 2k a R$ 7k", "Acima de R$ 10k", "Não controlo"], prov: "Se não sabe quanto perde, tem uma loteria de mercadorias, não uma empresa.", map: (o, i) => { model.estLoss = [2000, 7000, 15000, 10000][i]; } },
        { ph: "CEGUEIRA", q: "Como decide o valor da mercadoria para uma nova?", opts: ["Feeling", "Urgência", "Regra falha", "Padrão das Gigantes"], prov: "As grandes marcas como Natura e Avon filtram o DNA de vendas antes da primeira peça.", map: (o, i) => { if(i===3) model.maturityPoints += 33; } },
        { ph: "EQUIPE ZUMBI", q: "Qual comportamento é mais comum no seu time?", opts: ["Somem logo", "Maletas sujas", "WhatsApp deserto", "100% Produtivo"], prov: "Cuidado: você pode estar sustentando uma 'Equipe Zumbi' que trava seu caixa.", map: (o, i) => { if(i===3) model.maturityPoints += 33; } },
        { ph: "LIBERDADE", q: "Quanto do seu tempo gasta agindo como 'babá'?", opts: ["O dia todo", "Mais que o ideal", "É constante", "Foco Estratégico"], prov: "Se gasta tempo cobrando em vez de escalar, é funcionária do seu time.", map: (o, i) => { if(i===3) model.maturityPoints += 34; } },
        { ph: "COMPROMISSO", q: "Pronta para profissionalizar sua triagem hoje?", opts: ["Sim!", "Sim, quero o diagnóstico", "Dúvidas"], prov: "O mercado não perdoa o amadorismo operacional." }
    ];

    let currentIdx = 0;

    window.startQuiz = () => {
        fireMetaEvent("StartQuiz");
        gsap.to("#intro-screen", { duration: 0.5, opacity: 0, y: -20, onComplete: () => {
            document.getElementById("intro-screen").classList.add("hidden");
            document.getElementById("quiz-container").classList.remove("hidden");
            renderQuestion();
        }});
    };

    function renderQuestion() {
        const q = questions[currentIdx];
        document.getElementById("progress-bar").style.width = (currentIdx / questions.length) * 100 + "%";
        document.getElementById("progress-text").innerText = Math.round((currentIdx / questions.length) * 100) + "%";
        document.getElementById("question-content").innerHTML = `
            <div class="animate-content">
                <span class="text-xs font-bold text-accent uppercase tracking-widest block mb-1">${q.ph}</span>
                <p class="text-xs text-slate-400 italic mb-4">"${q.prov}"</p>
                <h3 class="text-xl md:text-2xl font-bold text-slate-800 mb-6">${currentIdx + 1}. ${q.q}</h3>
                <div class="flex flex-col gap-3">
                    ${q.opts.map((o, i) => `<div class="option-card rounded-xl p-4 font-medium" onclick="window.sel(${i}, this)">${o}</div>`).join('')}
                </div>
            </div>`;
        document.getElementById("next-btn").classList.add("hidden");
    }

    window.sel = (i, el) => {
        document.querySelectorAll(".option-card").forEach(c => c.classList.remove("selected"));
        el.classList.add("selected");
        el.dataset.idx = i;
        document.getElementById("next-btn").classList.remove("hidden");
    };

    window.nextQuestion = () => {
        const sel = document.querySelector(".option-card.selected");
        const q = questions[currentIdx];
        if (q.map) q.map(q.opts[sel.dataset.idx], parseInt(sel.dataset.idx));
        currentIdx++;
        if(currentIdx < questions.length) renderQuestion();
        else finishQuiz();
    };

    function finishQuiz() {
        fireMetaEvent("Lead", { range: model.range });
        
        // Cálculos dinâmicos
        const monthlyLoss = Math.round(model.estLoss / 6);
        const annualLoss = monthlyLoss * 12;
        const profitSim = (model.activeCount * 850) * 1.4; // Simulação: Faturamento + 40%

        document.getElementById("dynamic-money-loss").innerText = fmt(monthlyLoss);
        document.getElementById("annual-loss").innerText = fmt(annualLoss);
        document.getElementById("maturity-score").innerText = model.maturityPoints + "/100";
        document.getElementById("profit-simulation").innerText = fmt(profitSim);

        document.getElementById("quiz-container").classList.add("hidden");
        document.getElementById("loading-screen").classList.remove("hidden");
        
        setTimeout(() => {
            document.getElementById("loading-screen").classList.add("hidden");
            document.getElementById("result-screen").classList.remove("hidden");
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }, 3000);
    }

    // UTM Passthrough
    window.goToVSL = () => {
        fireMetaEvent("ViewContent", { value: 47, currency: 'BRL' });
        const from = new URLSearchParams(window.location.search);
        const toUrl = new URL("https://maparevendedoras.netlify.app/");
        ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "fbclid"].forEach(k => { if (from.get(k)) toUrl.searchParams.set(k, from.get(k)); });
        window.location.href = toUrl.toString();
    };
})();
