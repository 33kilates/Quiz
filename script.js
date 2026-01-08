(function() {
    "use strict";
    const model = { estLoss: 0, range: "", activeCount: 0, maturityPoints: 0 };
    const fmt = (v) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(v);
    
    // Traqueamento (Mantendo toda sua lógica original de UTM e CAPI)
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

    // Perguntas (Elevador de Consciência)
    const questions = [
        { 
            ph: "SITUAÇÃO", 
            q: "Qual o tamanho atual da sua base de revendedoras?", 
            opts: ["Iniciante (1-10)", "Em Expansão (11-30)", "Escalando (31-60)", "Elite (60+)"], 
            prov: "Empresas que não medem a base com precisão sofrem vazamento silencioso no 1º trimestre.",
            map: (o, i) => { model.range = o; model.activeCount = [8, 20, 45, 80][i]; }
        },
        { 
            ph: "FINANCEIRO", 
            q: "Qual seu prejuízo estimado nos últimos 6 meses (calotes/estoque parado)?", 
            opts: ["Até R$ 2k", "R$ 2k a R$ 7k", "Acima de R$ 10k", "Não controlo"], 
            prov: "Se você não sabe quanto está perdendo, você tem uma loteria, não uma empresa.",
            map: (o, i) => { model.estLoss = [2000, 7000, 15000, 10000][i]; }
        },
        { 
            ph: "CEGUEIRA", 
            q: "Como você decide o valor da mercadoria para uma nova revendedora?", 
            opts: ["Feeling", "Urgência dela", "Regra falha", "Padrão das Gigantes"], 
            prov: "As grandes marcas filtram o DNA de vendas antes de entregar a primeira peça.",
            map: (o, i) => { if(i === 3) model.maturityPoints += 33; }
        },
        { 
            ph: "RETENÇÃO", 
            q: "Qual comportamento é mais comum na sua 'Equipe Zumbi' hoje?", 
            opts: ["Somem logo", "Atrasam acerto", "WhatsApp deserto", "Time 100% Produtivo"], 
            prov: "Cuidado: você pode estar sustentando uma equipe que suga seu tempo e trava seu caixa.",
            map: (o, i) => { if(i === 3) model.maturityPoints += 33; }
        },
        { 
            ph: "LIBERDADE", 
            q: "Quanto do seu tempo você gasta agindo como 'babá'?", 
            opts: ["O dia todo", "Mais que o ideal", "É constante", "Foco na Estratégia"], 
            prov: "Se você gasta tempo cobrando em vez de escalar, é funcionária do seu time.",
            map: (o, i) => { if(i === 3) model.maturityPoints += 34; }
        },
        { 
            ph: "COMPROMISSO", 
            q: "Pronta para parar de 'jogar a rede' e começar a usar o 'arpão'?", 
            opts: ["Sim! Profissionalizar hoje", "Sim, quero parar de perder $", "Dúvidas"], 
            prov: "O mercado não perdoa amadorismo. Sua decisão agora define o lucro de 2026."
        }
    ];

    let idx = 0;

    window.startQuiz = () => {
        track("StartQuiz");
        document.getElementById("intro-screen").classList.add("hidden");
        document.getElementById("quiz-container").classList.remove("hidden");
        render();
    };

    function render() {
        const q = questions[idx];
        document.getElementById("progress-bar").style.width = (idx / questions.length) * 100 + "%";
        document.getElementById("progress-text").innerText = Math.round((idx / questions.length) * 100) + "%";
        document.getElementById("question-content").innerHTML = `
            <span style="color:var(--accent); font-size:12px; font-weight:700;">${q.ph}</span>
            <p style="font-size:13px; color:#94a3b8; font-style:italic; margin: 8px 0;">"${q.prov}"</p>
            <h3 style="font-size:22px; font-weight:800; color:#0f172a; margin-bottom:20px;">${idx+1}. ${q.q}</h3>
            <div style="display:flex; flex-direction:column;">
                ${q.opts.map((o, i) => `<div class="option-card" style="border:2px solid #e2e8f0; padding:18px; border-radius:14px; cursor:pointer; background:#fff; margin-bottom:12px;" onclick="window.sel(${i}, this)">${o}</div>`).join('')}
            </div>`;
        document.getElementById("next-btn").classList.add("hidden");
    }

    window.sel = (i, el) => {
        document.querySelectorAll(".option-card").forEach(c => { c.style.borderColor = "#e2e8f0"; c.style.background = "#fff"; });
        el.style.borderColor = "var(--accent)"; el.style.background = "#f0fdfc";
        el.dataset.idx = i;
        document.getElementById("next-btn").classList.remove("hidden");
    };

    window.nextQuestion = () => {
        const s = document.querySelector(".option-card[style*='border-color: var(--accent)']");
        const q = questions[idx];
        if (q.map) q.map(q.opts[s.dataset.idx], parseInt(s.dataset.idx));
        idx++;
        idx < questions.length ? render() : finish();
    };

    function finish() {
        track("Lead", { active_range: model.range });
        
        const monthlyLoss = Math.round(model.estLoss / 6);
        const annualLoss = monthlyLoss * 12;
        const profitSim = (model.activeCount * 850) * 1.45; // Simulação: Base * ticket médio * ganho de 45%

        document.getElementById("dynamic-money-impact").innerText = fmt(monthlyLoss);
        document.getElementById("annual-loss").innerText = fmt(annualLoss);
        document.getElementById("maturity-score").innerText = model.maturityPoints + "/100";
        document.getElementById("profit-simulation").innerText = fmt(profitSim);

        document.getElementById("quiz-container").classList.add("hidden");
        document.getElementById("loading-screen").classList.remove("hidden");
        
        setTimeout(() => {
            document.getElementById("loading-screen").classList.add("hidden");
            document.getElementById("result-screen").classList.remove("hidden");
            window.scrollTo({ top: 0, behavior: 'smooth' });
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
