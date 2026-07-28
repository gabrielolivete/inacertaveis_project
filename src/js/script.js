// ==========================================
// 1. CONFIGURAÇÃO PRINCIPAL
// ==========================================
const RODADAS_EXISTENTES = [19, 20, "b01"];
const ULTIMA_RODADA = RODADAS_EXISTENTES[RODADAS_EXISTENTES.length - 1];

const CHAVES_JOGADORES = {
  "marcola": "marcos16",
  "gabs": "gabs",
  "joca": "jocavila",
  "fefezao": "fefeprog"
};

// ==========================================
// 2. BUSCA DE DADOS (FETCH JSON)
// ==========================================
async function buscarDadosRodada(numeroRodada) {
  try {
    // Ex: puxa src/js/rodadas/rodadaB01.json ou rodada20.json
    const resposta = await fetch(`src/js/rodadas/rodada${numeroRodada}.json`);

    if (!resposta.ok) {
      throw new Error(`Erro ao carregar rodada ${numeroRodada}`);
    }

    const dados = await resposta.json();

    if (String(numeroRodada).toLowerCase() === String(ULTIMA_RODADA).toLowerCase()) {
      window.dadosUltimaRodada = dados;
      renderizarFormularioJogos(dados); 
    }

    // Compara como String para suportar textos ("b01") e números (20)
    if (String(numeroRodada).toLowerCase() === String(ULTIMA_RODADA).toLowerCase()) {
      window.dadosUltimaRodada = dados;
    }

    renderizarRodada(dados);
  } catch (erro) {
    console.error("Erro ao carregar os dados:", erro);
  }
}

// ==========================================
// 3. RENDERIZAÇÃO DA TELA (CARDS DOS JOGADORES)
// ==========================================
function renderizarRodada(dados) {
  // Atualiza o nome da rodada no topo
  const elementoRodada = document.getElementById("nome-rodada");
  if (elementoRodada) {
    elementoRodada.innerText = dados.nome;
  }

  // Atualiza o texto e EXIBE o lembrete (se o campo prazoPalpites existir no JSON)
  const elementoPrazo = document.getElementById("data-prazo");
  const containerLembrete = document.getElementById("lembrete-prazo");

  if (dados.prazoPalpites && elementoPrazo) {
    elementoPrazo.innerText = dados.prazoPalpites;

    // Garante visibilidade apenas se for a rodada inicial/ativa
    const seletorHist = document.getElementById('seletor-historico');
    if (containerLembrete && (!seletorHist || seletorHist.style.display === 'none')) {
      containerLembrete.style.display = "flex";
    }
  } else if (containerLembrete) {
    containerLembrete.style.display = "none";
  }

  // Limpa e prepara o container
  const container = document.getElementById("container-jogadores");
  if (!container) return;

  // Ordena jogadores da maior para a menor pontuação
  const jogadoresOrdenados = [...dados.participantes].sort((a, b) => b.pontuacaoTotal - a.pontuacaoTotal);

  let htmlAcumulado = "";

  // Monta os cards em memória
  jogadoresOrdenados.forEach((jogador, index) => {
    const cartasHTML = jogador.cartas ? jogador.cartas.map(carta =>
      `<img class="carta-icone ${carta.usada ? 'carta-usada' : ''}" src="${carta.img}" alt="carta">`
    ).join('') : '';

    const jogosHTML = jogador.jogos ? jogador.jogos.map(jogo => `
      <div class="linha-palpite ${jogo.coringa ? 'destaque' : ''}">
        ${jogo.coringa ? '<div class="coringa-tag">🃏 CORINGA 2X</div>' : ''}
        <div class="confronto">
          <img src="${jogo.time1}" alt="Time" class="escudo-time">
          <span class="placar-palpite">${jogo.placar}</span>
          <img src="${jogo.time2}" alt="Time" class="escudo-time">
        </div>
        <div class="pontos-palpite">
          <span class="pontos-valor ${jogo.tipoPontos}">${jogo.pontos}</span>
          <span class="pontos-descricao ${jogo.tipoPontos}">${jogo.descricao}</span>
        </div>
      </div>
    `).join('') : '';

    const eventosHTML = jogador.eventos ? jogador.eventos.map(ev => `
      <div class="evento">
        <span>${ev.texto}</span>
        <span class="${ev.acertou ? 'positivo' : 'negativo'}">${ev.acertou ? '✓' : '✗'}</span>
      </div>
    `).join('') : '';

    htmlAcumulado += `
      <article class="card-player">
        ${index === 0 ? '<img src="src/img/especial/lider.png" class="badge-lider-sobreposta" alt="Líder">' : ''}
        <div class="card-header">
          <h2>${jogador.nome}</h2>
        </div>
        <div class="card-body">
          <div class="perfil">
            <img class="avatar" src="${jogador.avatar}" alt="${jogador.nome}">
            <div class="total-container">
              <span class="total-label">PONTUAÇÃO TOTAL</span>
              <span class="total-pontos">${jogador.pontuacaoTotal}</span>
              <div class="cartas-jogo">
                ${cartasHTML}
              </div>
            </div>
          </div>
          <div class="lista-palpites">
            ${jogosHTML}
          </div>
          <div class="eventos">
            ${eventosHTML}
          </div>
        </div>
      </article>
    `;
  });

  // Renderiza tudo de uma vez só no DOM
  container.innerHTML = htmlAcumulado;
}

// ==========================================
// 4. LÓGICA DO MENU E SELETOR DE HISTÓRICO
// ==========================================

function preencherSeletorHistorico() {
  const select = document.getElementById("select-rodada");
  if (!select) return;

  select.innerHTML = "";

  RODADAS_EXISTENTES.forEach(item => {
    const option = document.createElement("option");
    option.value = item;

    if (typeof item === 'number') {
      option.innerText = `RODADA ${item < 10 ? '0' + item : item}`;
    } else {
      option.innerText = `RODADA BÔNUS ${String(item).toUpperCase()}`;
    }

    select.appendChild(option);
  });
}

function carregarRodadaHistorico(numeroRodada) {
  buscarDadosRodada(numeroRodada);
}

function mudarAba(nomeAba, elementoClicado) {
  // 1. Esconde todas as seções que têm a classe .aba-conteudo
  document.querySelectorAll('.aba-conteudo').forEach(aba => {
    aba.style.display = 'none';
  });

  // 2. Remove a classe active de todos os botões da navbar
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.classList.remove('active');
  });

  // Elementos auxiliares da tela
  const seletorHist = document.getElementById('seletor-historico');
  const subtituloRodada = document.getElementById('container-rodada-subtitulo');
  const lembretePrazo = document.getElementById('lembrete-prazo');

  // Oculta os auxiliares por padrão
  if (seletorHist) seletorHist.style.display = 'none';
  if (subtituloRodada) subtituloRodada.style.display = 'none';
  if (lembretePrazo) lembretePrazo.style.display = 'none';

  // 3. Lógica para exibir cada aba
  if (nomeAba === 'inicio') {
    document.getElementById('aba-rodadas').style.display = 'block';
    if (subtituloRodada) subtituloRodada.style.display = 'block';
    if (lembretePrazo) lembretePrazo.style.display = 'flex';
    buscarDadosRodada(ULTIMA_RODADA);
  }
  else if (nomeAba === 'palpites') {
    const abaPalpites = document.getElementById('aba-palpites');
    if (abaPalpites) abaPalpites.style.display = 'flex';
  }
  else if (nomeAba === 'historico') {
    document.getElementById('aba-rodadas').style.display = 'block';
    if (seletorHist) seletorHist.style.display = 'block';
    const select = document.getElementById("select-rodada");
    if (select) buscarDadosRodada(select.value);
  }
  else if (nomeAba === 'conquistas') {
    document.getElementById('aba-conquistas').style.display = 'block';
    carregarAbaBadges();
  }
  else if (nomeAba === 'regras') {
    document.getElementById('aba-regras').style.display = 'block';
  }

  // 4. Marca o botão clicado como ativo
  if (elementoClicado) {
    elementoClicado.classList.add('active');
  }
}

// ==========================================
// 5. CARREGAR ABA BADGES
// ==========================================
async function carregarAbaBadges() {
  // Se ainda não tiver os dados da última rodada salvos na memória, busca primeiro
  if (!window.dadosUltimaRodada) {
    try {
      const resp = await fetch(`src/js/rodadas/rodada${ULTIMA_RODADA}.json`);
      window.dadosUltimaRodada = await resp.json();
    } catch (e) {
      console.error("Erro ao carregar dados para o mini leaderboard", e);
    }
  }

  if (window.dadosUltimaRodada) {
    const jogadoresOrdenados = [...window.dadosUltimaRodada.participantes]
      .sort((a, b) => b.pontuacaoTotal - a.pontuacaoTotal);

    const miniContainer = document.getElementById("mini-leaderboard");
    if (miniContainer) {
      miniContainer.innerHTML = jogadoresOrdenados.map((jogador, idx) => `
        <div class="mini-player-card">
          <div class="avatar-container-relativo">
            <div class="avatar-wrapper">
              <img class="avatar-rosto" src="${jogador.avatarHead || jogador.avatar}" alt="${jogador.nome}">
            </div>
            <span class="posicao-badge pos-${idx + 1}">${idx + 1}º</span>
          </div>
          <span class="mini-player-nome">${jogador.nome}</span>
          <span class="mini-player-pontos">${jogador.pontuacaoTotal} pts</span>
        </div>
      `).join('');
    }
  }

  try {
    const resposta = await fetch('src/data/badges.json');
    const dadosBadges = await resposta.json();

    const containerBadges = document.getElementById("lista-badges");
    if (containerBadges) {
      containerBadges.innerHTML = dadosBadges.conquistas.map(badge => `
        <div class="card-badge">
          <img src="${badge.icone}" alt="${badge.nome}" class="badge-img">
          <div class="badge-titulo">${badge.nome}</div>
          <div class="badge-desc">${badge.descricao}</div>
          <div class="badge-dono">
            👑 <b>${badge.lider_atual}</b><br>
            <small style="color: #f1c40f;">${badge.valor}</small>
          </div>
        </div>
      `).join('');
    }
  } catch (erro) {
    console.error("Erro ao carregar o arquivo badges.json:", erro);
  }
}

function renderizarFormularioJogos(dadosRodada) {
  const containerJogos = document.getElementById("container-jogos-palpite");
  if (!containerJogos) return;

  //  1. VERIFICA SE É UMA RODADA BÔNUS
  if (dadosRodada.rodadaBonus === true) {
    containerJogos.innerHTML = `
      <div style="
        background: linear-gradient(135deg, rgba(243, 156, 18, 0.15), rgba(231, 76, 60, 0.15));
        border: 2px dashed #f39c12;
        border-radius: 12px;
        padding: 20px;
        text-align: center;
        margin: 15px 0;
      ">
        <div style="font-size: 2rem; margin-bottom: 10px;"></div>
        <h3 style="
          font-family: 'Press Start 2P', cursive;
          font-size: 0.85rem;
          color: #f39c12;
          margin-bottom: 12px;
          line-height: 1.4;
        ">
          RODADA BÔNUS ATIVA!
        </h3>
        <p style="
          color: #c9d1d9;
          font-size: 0.85rem;
          line-height: 1.5;
          margin-bottom: 0;
        ">
          Os palpites para esta rodada bônus <strong>não serão feitos pelo site</strong>.<br><br>
          Siga as instruções enviadas no grupo do WhatsApp para enviar seus palpites!
        </p>
      </div>
    `;

    // Esconde o botão de enviar do formulário para ninguém tentar mandar
    const btnEnviar = document.querySelector(".btn-enviar-palpite");
    if (btnEnviar) btnEnviar.style.display = "none";

    return;
  }

  // Restaura a visibilidade do botão caso tenha sido escondido em uma rodada bônus anterior
  const btnEnviar = document.querySelector(".btn-enviar-palpite");
  if (btnEnviar) btnEnviar.style.display = "block";

  // 2. SE FOR RODADA NORMAL, CONTINUA A RENDERIZAÇÃO PADRÃO
  const primeiroParticipante = dadosRodada.participantes[0] || {};
  const jogosDaRodada = primeiroParticipante.jogos || [];
  const eventosDaRodada = primeiroParticipante.eventos || [];

  if (jogosDaRodada.length === 0) {
    containerJogos.innerHTML = "<p style='text-align:center; color:#8b949e;'>Nenhum jogo disponível no momento.</p>";
    return;
  }

  // Opção de não usar coringa
  let html = `
    <div style="background-color: #161b22; border: 1px solid #30363d; border-radius: 8px; padding: 10px; margin-bottom: 15px; text-align: center;">
      <label style="font-size: 0.75rem; color: #8b949e; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px;">
        <input type="radio" name="jogo-coringa" value="nenhum" checked>
        🚫 Não usar Coringa 2X nesta rodada
      </label>
    </div>
  `;

  // Renderiza Jogos
  html += jogosDaRodada.map((jogo, index) => `
    <div class="jogo-palpite-box" style="display: flex; flex-direction: column; gap: 8px; margin-bottom: 15px;">
      <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
        <div class="confronto">
          <img src="${jogo.time1}" alt="Time Casa" class="escudo-time">
        </div>

        <div class="inputs-placar">
          <input type="number" id="j${index}-casa" min="0" max="99" required placeholder="0">
          <span style="color: #8b949e; font-weight: bold;">x</span>
          <input type="number" id="j${index}-fora" min="0" max="99" required placeholder="0">
        </div>

        <div class="confronto">
          <img src="${jogo.time2}" alt="Time Fora" class="escudo-time">
        </div>
      </div>

      <label style="font-size: 0.7rem; color: #f39c12; cursor: pointer; text-align: center; margin-top: 4px;">
        <input type="radio" name="jogo-coringa" value="${index}">
        🃏 Aplicar Coringa 2X neste jogo
      </label>
    </div>
  `).join('');

  // Renderiza Eventos/Palpites Especiais
  if (eventosDaRodada.length > 0) {
    html += `
      <hr class="divisor">
      <h3 style="font-size: 0.75rem; color: #f39c12; margin: 15px 0 10px 0; text-align: center; font-family: 'Press Start 2P', cursive;">
        PALPITES ESPECIAIS
      </h3>
      <div id="container-eventos-palpite" style="display: flex; flex-direction: column; gap: 10px;">
    `;

    html += eventosDaRodada.map((ev, index) => {
      const LabelTexto = ev.texto.trim();
      return `
        <div class="campo-grupo" style="margin-bottom: 5px;">
          <label for="ev-${index}" style="font-size: 0.75rem; color: #c9d1d9;">${LabelTexto}</label>
          <input type="text" id="ev-${index}" data-texto-original="${ev.texto}" placeholder="Ex: Sim / Não / Nome do jogador..." required style="background-color: #161b22; color: #fff; border: 1px solid #30363d; padding: 8px; border-radius: 6px; font-size: 0.8rem;">
        </div>
      `;
    }).join('');

    html += `</div>`;
  }

  containerJogos.innerHTML = html;
}

// ==========================================
// 6. FORMULÁRIO DE PALPITES
// ==========================================

const NUMERO_ORGANIZADOR = "5541998814995"; 

// ⏳ DATA E HORÁRIO LIMITE PARA PALPITAR (Ajuste a cada rodada)
const PRAZO_LIMITE_PALPITES = new Date("2026-07-29T16:00:00"); 

// 🔢 LIMITE MÁXIMO DE ENVIOS POR PERFIL
const LIMITE_ENVIOS_PERFIL = 2;


function inicializarFormularioPalpites() {
  const form = document.getElementById("form-palpite");
  if (!form) return;

  form.addEventListener("submit", function(event) {
    event.preventDefault();

    // 1. VERIFICAÇÃO DE DATA E HORÁRIO LIMITE
    const agora = new Date();
    if (agora > PRAZO_LIMITE_PALPITES) {
      alert("⏳ O prazo para envio de palpites desta rodada já se encerrou!");
      return;
    }

    const jogadorSelec = document.getElementById("select-jogador").value;
    const chaveDigitada = document.getElementById("chave-jogador").value.trim();

    // 2. VALIDAÇÃO DE SELEÇÃO E CHAVE SECRETA
    if (!jogadorSelec) {
      alert("⚠️ Por favor, selecione qual é o seu perfil!");
      return;
    }

    if (CHAVES_JOGADORES[jogadorSelec] !== chaveDigitada) {
      alert("❌ Chave Secreta incorreta! Você não tem autorização para palpitar por esse perfil.");
      return;
    }

    // 3. TRAVA COM RESET AUTOMÁTICO POR RODADA
    // Usamos 'ULTIMA_RODADA' na chave para o limite zerar sozinho a cada nova rodada!
    const chaveStorage = `envios_r${ULTIMA_RODADA}_${jogadorSelec}`;
    let enviosAtuais = parseInt(localStorage.getItem(chaveStorage) || "0", 10);

    if (enviosAtuais >= LIMITE_ENVIOS_PERFIL) {
      alert(`⛔ Limite atingido! O perfil ${jogadorSelec.toUpperCase()} já enviou o palpite ${LIMITE_ENVIOS_PERFIL} vezes na Rodada ${ULTIMA_RODADA}.`);
      return;
    }

    // ⚽ 4. MONTA O CONTEÚDO DOS PALPITES (JOGOS E CORINGA)
    const jogosOriginais = window.dadosUltimaRodada?.participantes[0]?.jogos || [];
    const jogosContainer = document.getElementById("container-jogos-palpite");
    const caixasDeJogo = jogosContainer.querySelectorAll(".jogo-palpite-box");
    const coringaSelecionado = document.querySelector('input[name="jogo-coringa"]:checked')?.value;

    let listaJogosJSON = [];
    let textoLeitura = `⚽ *PALPITE CONFIRMADO - INACERTÁVEIS*%0A`;
    textoLeitura += `👤 *Jogador:* ${jogadorSelec.toUpperCase()} (Envio ${enviosAtuais + 1}/${LIMITE_ENVIOS_PERFIL})%0A%0A`;

    caixasDeJogo.forEach((box, index) => {
      const inputCasa = document.getElementById(`j${index}-casa`);
      const inputFora = document.getElementById(`j${index}-fora`);

      const gCasa = inputCasa ? inputCasa.value : 0;
      const gFora = inputFora ? inputFora.value : 0;
      const placarDigitado = `${gCasa} x ${gFora}`;
      const eCoringa = coringaSelecionado !== "nenhum" && String(index) === String(coringaSelecionado);

      textoLeitura += `🏟️ *Jogo ${index + 1}:* ${placarDigitado} ${eCoringa ? '🃏(CORINGA)' : ''}%0A`;

      const time1Path = jogosOriginais[index]?.time1 || "src/img/escudos/default.png";
      const time2Path = jogosOriginais[index]?.time2 || "src/img/escudos/default.png";

      listaJogosJSON.push({
        time1: time1Path,
        placar: placarDigitado,
        time2: time2Path,
        pontos: "",
        descricao: "",
        tipoPontos: "",
        coringa: eCoringa
      });
    });

    // 🎯 5. CAPTURA DOS PALPITES ESPECIAIS (EVENTOS)
    const containerEventos = document.getElementById("container-eventos-palpite");
    let listaEventosJSON = [];

    if (containerEventos) {
      const inputsEventos = containerEventos.querySelectorAll("input");
      textoLeitura += `%0A🎯 *PALPITES ESPECIAIS:*%0A`;

      inputsEventos.forEach((input) => {
        const textoOriginal = input.getAttribute("data-texto-original");
        const respostaDigitada = input.value.trim();

        textoLeitura += `${textoOriginal} ${respostaDigitada}%0A`;

        listaEventosJSON.push({
          texto: `${textoOriginal} ${respostaDigitada}`,
          acertou: false
        });
      });
    }

    // 📦 6. DADOS FORMATADOS PARA O JSON
    const dadosParaColar = {
      jogos: listaJogosJSON,
      eventos: listaEventosJSON
    };

    const jsonString = JSON.stringify(dadosParaColar, null, 2);

    let mensagemWhatsapp = textoLeitura;
    mensagemWhatsapp += `%0A📋 *BLOCO PRONTO PARA O JSON DO JOGADOR:*%0A`;
    mensagemWhatsapp += "```json%0A" + encodeURIComponent(jsonString) + "%0A```";

    // 📈 INCREMENTA A CONTAGEM DE ENVIOS NO NAVEGADOR
    localStorage.setItem(chaveStorage, enviosAtuais + 1);

    alert(`🎉 Palpite validado com sucesso, ${jogadorSelec.toUpperCase()}!\n\nEste é seu envio ${enviosAtuais + 1} de ${LIMITE_ENVIOS_PERFIL}. Redirecionando para o WhatsApp...`);

    const urlWhats = `https://api.whatsapp.com/send?phone=${NUMERO_ORGANIZADOR}&text=${mensagemWhatsapp}`;
    window.open(urlWhats, '_blank');

    form.reset();
  });
}

// ==========================================
// 7. INICIALIZAÇÃO DA PÁGINA
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
  preencherSeletorHistorico();

  const select = document.getElementById("select-rodada");
  if (select) select.value = ULTIMA_RODADA;

  buscarDadosRodada(ULTIMA_RODADA);
  inicializarFormularioPalpites();
});