(function() {
    "use strict";
    const model = { estLoss: 0, range: "" };
    const fmt = (v) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(v);
    
    // Funções de Analytics
    const genId = () => (crypto?.randomUUID ? crypto.randomUUID() : Date.now() + Math.random());
    function getCookie(n) { const m = document.cookie.match(new RegExp("(^|; )" + n.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&") + "=([^;]*)")); return m ? decodeURIComponent(m[2]) : null; }

    async function sendCapi(ev, id, data = {}) {
        try {
            fetch("/.netlify/functions/capi", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ event_name: ev, event_id: id, event_source_url: window.location.href, fbp: getCookie("_fbp"), fbc: getCookie("_fbc"), ...data }),
                keepalive: true 
            });
        } catch (e) { console.error(e); }
    }

    function track(ev, data = {}) {
        const id = genId();
        if (window.fbq) fbq("track", ev, data, { eventID: id });
        sendCapi(ev, id, data);
    }

    // Perguntas do Quiz (Otimizadas para 6 questões)
    const questions = [
        { ph: "CONTEXTO", q: "Tamanho da sua base de revendedoras?", opts: ["1-10", "11-30", "31-60", "60+"], map: (o) => model.range = o },
        { ph: "FINANCEIRO", q: "Prejuízo acumulado nos últimos 6 meses?", opts: ["Até R$ 2k", "R$ 2k-7k", "Acima R$ 10k", "Não controlo"], map: (o, i) => model.estLoss = [2000, 7000, 15000, 10000][i] },
        { ph: "PROCESSO", q: "Como decide a mercadoria para novas?", opts: ["Feeling", "Urgência dela", "Regra falha", "Padrão Gigantes"] },
        { ph: "RETENÇÃO", q: "Comportamento da 'Equipe Zumbi'?", opts: ["Somem logo", "Maletas sujas", "WhatsApp deserto", "100% Produtivo"] },
        { ph: "LIBERDADE", q: "Tempo semanal agindo como 'babá'?", opts: ["O dia todo", "Mais que o ideal", "É constante", "Foco estratégia"] },
        { ph: "MATURIDADE", q: "O que te impede de dobrar a equipe?", opts: ["Medo calote", "Cansaço", "Falta estoque", "Falta método"] }
    ];

    let idx = 0;

    window.startQuiz = () => {
        track("StartQuiz");
        gsap.to("#intro-screen", { opacity: 0, y: -20, duration: 0.4, onComplete: () => {
            document.getElementById("intro-screen").classList.add("hidden");
            document.getElementById("quiz-container").classList.remove("hidden");
            render();
        }});
    };

    function render() {
        const q = questions[idx];
        const prog = (idx / questions.length) * 100;
        document.getElementById("progress-bar").style.width = prog + "%";
        document.getElementById("progress-text").innerText = Math.round(prog) + "%";
        
        document.getElementById("question-content").innerHTML = `
            <span style="color:var(--accent); font-size:0.75rem; font-weight:bold;">${q.ph}</span>
            <h3 style="font-size:1.5rem; font-weight:bold; margin: 1rem 0;">${q.q}</h3>
            <div style="display:flex; flex-direction:column;">
                ${q.opts.map((o, i) => `<div class="option-card" onclick="select(${i}, this)">${o}</div>`).join('')}
            </div>`;
        document.getElementById("next-btn").classList.add("hidden");
    }

    window.select = (i, el) => {
        document.querySelectorAll(".option-card").forEach(c => c.classList.remove("selected"));
        el.classList.add("selected");
        el.dataset.idx = i;
        document.getElementById("next-btn").classList.remove("hidden");
    };

    window.nextQuestion = () => {
        const sel = document.querySelector(".option-card.selected");
        const q = questions[idx];
        if (q.map) q.map(q.opts[sel.dataset.idx], parseInt(sel.dataset.idx));
        idx++;
        idx < questions.length ? render() : finish();
    };

    function finish() {
        track("Lead", { active_range: model.range });
        document.getElementById("dynamic-money-impact").innerText = fmt(Math.round(model.estLoss / 6)) + " /mês";
        document.getElementById("quiz-container").classList.add("hidden");
        document.getElementById("loading-screen").classList.remove("hidden");
        setTimeout(() => {
            document.getElementById("loading-screen").classList.add("hidden");
            document.getElementById("result-screen").classList.remove("hidden");
        }, 2500);
    }

    window.goToVSL = () => {
        track("ViewContent", { value: 47.00, currency: "BRL" });
        const p = new URLSearchParams(window.location.search);
        const to = new URL("https://maparevendedoras.netlify.app/");
        ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "fbclid"].forEach(k => {
            if (p.get(k)) to.searchParams.set(k, p.get(k));
        });
        window.location.href = to.toString();
    };
})();
