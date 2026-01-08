(function() {
    "use strict";
    // Estado do modelo para cálculos dinâmicos
    const model = { 
        estLoss: 0, 
        range: "", 
        activeCount: 0, 
        avgTicket: 0,
        maturityPoints: 0 
    };

    const fmt = (v) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(v);
    const genId = () => (crypto?.randomUUID ? crypto.randomUUID() : Date.now() + Math.random());

    const questions = [
        { 
            ph: "SITUAÇÃO", 
            q: "Qual o tamanho atual da sua base de revendedoras?", 
            opts: ["1 a 10", "11 a 30", "31 a 60", "Mais de 60"], 
            prov: "O vazamento silencioso começa quando você perde o controle da base.",
            map: (o, i) => { 
                model.range = o; 
                model.activeCount = [8, 20, 45, 80][i]; // Média da opção selecionada
            }
        },
        { 
            ph: "FINANCEIRO", 
            q: "Qual seu prejuízo estimado nos últimos 6 meses?", 
            opts: ["Até R$ 2.000", "R$ 2.000 a R$ 7.000", "Acima de R$ 10.000", "Não controlo"], 
            prov: "Se não sabe quanto perde, tem uma loteria, não uma empresa.",
            map: (o, i) => {
                model.estLoss = [2000, 7000, 15000, 10000][i];
            }
        },
        { 
            ph: "CEGUEIRA", 
            q: "Como decide o valor liberado para uma nova?", 
            opts: ["Feeling", "Urgência dela", "Regra falha", "Padrão das Gigantes"], 
            prov: "As grandes marcas filtram o DNA antes da primeira peça.",
            map: (o, i) => { if(i === 3) model.maturityPoints += 33; }
        },
        { 
            ph: "EQUIPE ZUMBI", 
            q: "Qual comportamento é mais comum no seu time?", 
            opts: ["Somem logo", "Maletas sujas", "WhatsApp deserto", "100% Produtivo"], 
            prov: "A Equipe Zumbi trava o crescimento de quem quer faturar sério.",
            map: (o, i) => { if(i === 3) model.maturityPoints += 33; }
        },
        { 
            ph: "LIBERDADE", 
            q: "Quanto tempo gasta sendo 'babá' de revendedora?", 
            opts: ["O dia todo", "Mais que o ideal", "É constante", "Foco Estratégico"], 
            prov: "Se você gasta tempo cobrando, você é funcionária do seu time.",
            map: (o, i) => { if(i === 3) model.maturityPoints += 34; }
        },
        { 
            ph: "COMPROMISSO", 
            q: "Pronta para profissionalizar sua triagem hoje?", 
            opts: ["Sim!", "Sim, quero o diagnóstico", "Dúvidas"], 
            prov: "O mercado não perdoa o amadorismo operacional."
        }
    ];

    let idx = 0;

    window.startQuiz = () => {
        document.getElementById("intro-screen").classList.add("hidden");
        document.getElementById("quiz-container").classList.remove("hidden");
        render();
    };

    function render() {
        const q = questions[idx];
        document.getElementById("progress-bar").style.width = (idx / questions.length) * 100 + "%";
        document.getElementById("question-content").innerHTML = `
            <span style="color:var(--accent); font-size:12px; font-weight:700;">${q.ph}</span>
            <p style="font-size:13px; color:#94a3b8; font-style:italic; margin: 8px 0;">"${q.prov}"</p>
            <h3 style="font-size:22px; font-weight:800; color:#0f172a; margin-bottom:20px;">${idx+1}. ${q.q}</h3>
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
        const sel = document.querySelector(".option-card.selected");
        const q = questions[idx];
        if (q.map) q.map(q.opts[sel.dataset.idx], parseInt(sel.dataset.idx));
        idx++;
        idx < questions.length ? render() : finishQuiz();
    };

    function finishQuiz() {
        // 1. Cálculos de Inteligência
        const monthlyLoss = Math.round(model.estLoss / 6);
        const annualLoss = monthlyLoss * 12;
        
        // Simulação: Consideramos um ticket médio de R$ 800 por revendedora
        const currentRevenue = model.activeCount * 800;
        const simulatedProfit = currentRevenue * 1.4; // 40% de aumento

        // 2. Injeção de Dados no HTML
        document.getElementById("dynamic-money-loss").innerText = fmt(monthlyLoss);
        document.getElementById("annual-loss").innerText = fmt(annualLoss);
        document.getElementById("maturity-score").innerText = model.maturityPoints + "/100";
        document.getElementById("profit-simulation").innerText = fmt(simulatedProfit);

        // 3. Transição de Telas
        document.getElementById("quiz-container").classList.add("hidden");
        document.getElementById("loading-screen").classList.remove("hidden");
        
        setTimeout(() => {
            document.getElementById("loading-screen").classList.add("hidden");
            document.getElementById("result-screen").classList.remove("hidden");
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }, 3000);
    }

    window.goToVSL = () => {
        // Tracking final
        if(window.fbq) fbq('track', 'ViewContent', { value: 47, currency: 'BRL' });
        
        const p = new URLSearchParams(window.location.search);
        const to = new URL("https://maparevendedoras.netlify.app/");
        ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "fbclid"].forEach(k => {
            if (p.get(k)) to.searchParams.set(k, p.get(k));
        });
        window.location.href = to.toString();
    };
})();
