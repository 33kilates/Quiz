(function() {
    "use strict";
    const model = { estLoss: 0, range: "" };
    const fmt = (v) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(v);
    
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
        } catch (e) {}
    }

    function track(ev, data = {}) {
        const id = genId();
        if (window.fbq) fbq("track", ev, data, { eventID: id });
        sendCapi(ev, id, data);
    }

    const questions = [
        { ph: "SITUAÇÃO", q: "Qual o tamanho atual da sua base de revendedoras?", opts: ["1 a 10", "11 a 30", "31 a 60", "Mais de 60"], prov: "Empresas que não medem a base com precisão costumam sofrer com o 'vazamento silencioso'.", map: (o) => model.range = o },
        { ph: "FINANCEIRO", q: "Qual seu prejuízo estimado nos últimos 6 meses?", opts: ["Até R$ 2.000", "R$ 2.000 a R$ 7.000", "Acima de R$ 10.000", "Não controlo"], prov: "Se você não sabe quanto está perdendo, você tem uma loteria, não uma empresa.", map: (o, i) => model.estLoss = [2000, 7000, 15000, 10000][i] },
        { ph: "CEGUEIRA", q: "Hoje, como você decide o valor liberado para uma nova?", opts: ["Pelo feeling", "Pela urgência dela", "Regra que falha", "Padrão das Gigantes"], prov: "As grandes marcas filtram o DNA de vendas antes de entregar a primeira peça." },
        { ph: "EQUIPE ZUMBI", q: "Qual comportamento é mais comum no seu time?", opts: ["Somem após o acerto", "Maletas sujas/atraso", "WhatsApp deserto", "Time 100% Produtivo"], prov: "Cuidado: você pode estar sustentando uma 'Equipe Zumbi' que trava seu caixa." },
        { ph: "LIBERDADE", q: "Quanto do seu tempo você gasta como 'babá'?", opts: ["O dia todo", "Mais que o ideal", "É constante", "Foco na Estratégia"], prov: "Se você gasta mais tempo cobrando do que escalando, você é funcionária do seu time." },
        { ph: "COMPROMISSO", q: "Pronta para seguir o padrão das Gigantes?", opts: ["Sim! Profissionalizar hoje", "Sim, quero parar de perder $", "Dúvidas se consigo aplicar"], prov: "O mercado não perdoa o amadorismo. Sua decisão define o lucro de 2026." }
    ];

    let idx = 0;

    window.startQuiz = () => {
        track("StartQuiz");
        if (window.gsap) {
            gsap.to("#intro-screen", { opacity: 0, y: -20, onComplete: () => {
                document.getElementById("intro-screen").classList.add("hidden");
                document.getElementById("quiz-container").classList.remove("hidden");
                render();
            }});
        } else {
            document.getElementById("intro-screen").classList.add("hidden");
            document.getElementById("quiz-container").classList.remove("hidden");
            render();
        }
    };

    function render() {
        const q = questions[idx];
        document.getElementById("progress-bar").style.width = (idx / questions.length) * 100 + "%";
        document.getElementById("progress-text").innerText = Math.round((idx / questions.length) * 100) + "%";
        document.getElementById("question-content").innerHTML = `
            <span style="color:var(--accent); font-size:12px; font-weight:700; text-transform:uppercase;">${q.ph}</span>
            <p style="font-size:14px; color:#94a3b8; font-style:italic; margin: 10px 0;">"${q.prov}"</p>
            <h3 style="font-size:24px; font-weight:800; color:#0f172a; margin-bottom:20px;">${idx+1}. ${q.q}</h3>
            <div>${q.opts.map((o, i) => `<div class="option-card" onclick="window.sel(${i}, this)">${o}</div>`).join('')}</div>`;
        document.getElementById("next-btn").classList.add("hidden");
    }

    window.sel = (i, el) => {
        document.querySelectorAll(".option-card").forEach(c => c.classList.remove("selected"));
        el.classList.add("selected");
        el.dataset.idx = i;
        document.getElementById("next-btn").classList.remove("hidden");
    };

    window.nextQuestion = () => {
        const s = document.querySelector(".option-card.selected");
        const q = questions[idx];
        if (q.map) q.map(q.opts[s.dataset.idx], parseInt(s.dataset.idx));
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
