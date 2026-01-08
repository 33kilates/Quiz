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
    { 
      ph: "SITUAÇÃO", 
      q: "Qual o tamanho atual da sua base de revendedoras?", 
      opts: ["1 a 10", "11 a 30", "31 a 60", "Mais de 60"], 
      prov: "Empresas que não medem a base com precisão costumam sofrer com o 'vazamento silencioso' no primeiro trimestre.",
      map: (o) => model.range = o 
    },
    { 
      ph: "FINANCEIRO", 
      q: "Qual seu prejuízo estimado (calotes/estoque parado) nos últimos 6 meses?", 
      opts: ["Até R$ 2.000", "R$ 2.000 a R$ 7.000", "Acima de R$ 10.000", "Não tenho esse número exato"], 
      prov: "Se você não sabe quanto está perdendo, você tem uma loteria de mercadorias, não uma empresa.",
      map: (o, i) => model.estLoss = [2000, 7000, 15000, 10000][i] 
    },
    { 
      ph: "CEGUEIRA DE PERFIL", 
      q: "Hoje, como você decide o valor da mercadoria que libera para uma nova?", 
      opts: ["Pelo 'feeling' e conversa", "Pela urgência dela", "Regra que falha muito", "Critérios psicográficos (Gigantes)"],
      prov: "As grandes marcas como Natura e Avon não contam com a sorte; elas filtram o DNA de vendas antes de entregar a peça."
    },
    { 
      ph: "RETENÇÃO", 
      q: "Qual comportamento é mais comum no seu time atualmente?", 
      opts: ["Somem após o acerto", "Maletas sujas/atraso", "WhatsApp deserto", "Time 100% Produtivo"],
      prov: "Cuidado: você pode estar sustentando uma 'Equipe Zumbi' que suga seu tempo e trava seu caixa."
    },
    { 
      ph: "LIBERDADE", 
      q: "Quanto do seu tempo semanal é consumido agindo como 'babá' de revendedora?", 
      opts: ["O dia todo (Sobrecarregada)", "Mais do que o ideal", "É constante", "Gestão automatizada/Estratégia"],
      prov: "Se você gasta mais tempo cobrando do que escalando, você é funcionária do seu time."
    },
    { 
      ph: "COMPROMISSO", 
      q: "Pronta para usar o 'arpão' no recrutamento seguindo o padrão das Gigantes?", 
      opts: ["Sim! Profissionalizar hoje", "Sim, quero parar de perder $", "Dúvidas se consigo aplicar"],
      prov: "O mercado de semijoias não perdoa o amadorismo. Sua próxima decisão define o seu lucro de 2026."
    }
  ];

  let idx = 0;

  window.startQuiz = () => {
    track("StartQuiz");
    gsap.to("#intro-screen", { opacity: 0, y: -20, onComplete: () => {
      document.getElementById("intro-screen").classList.add("hidden");
      document.getElementById("quiz-container").classList.remove("hidden");
      render();
    }});
  };

  function render() {
    const q = questions[idx];
    document.getElementById("progress-bar").style.width = (idx / questions.length) * 100 + "%";
    document.getElementById("progress-text").innerText = Math.round((idx / questions.length) * 100) + "%";
    document.getElementById("question-content").innerHTML = `
      <div class="animate-content">
        <span class="text-xs font-bold text-accent uppercase tracking-widest block mb-2">${q.ph}</span>
        <p class="text-sm text-slate-400 italic mb-4">"${q.prov}"</p>
        <h3 class="text-xl md:text-2xl font-bold text-slate-800 mb-6">${idx+1}. ${q.q}</h3>
        <div class="flex flex-col gap-3">
          ${q.opts.map((o, i) => `<div class="option-card border-2 border-slate-100 rounded-xl p-4 cursor-pointer bg-white" onclick="window.sel(${i}, this)">${o}</div>`).join('')}
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
