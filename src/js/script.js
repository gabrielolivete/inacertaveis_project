// ==========================================
// 1. CONFIGURAÇÃO PRINCIPAL
// ==========================================
const RODADAS_EXISTENTES = [20, "b01", 21, "b02", 22, "b03", 23, "b04", 24, 25, "b05"];
const ULTIMA_RODADA = RODADAS_EXISTENTES[RODADAS_EXISTENTES.length - 1];

const CHAVES_JOGADORES_HASH = {
  marcola: "5efe6e6a239f8bec144e1b1f24680aad25764f77cfa2c54dfd1dca7dc73f810b",
  gabs: "72831924521887e6638e686d6d004cd6cefe48168d2d4e2c40d29115b9c611b9",
  joca: "6c4ffc3992e5ac7161c57e3256e49c33f0fa8db139b0f6f2dba65df85d1bd7dd",
  fefezao: "d52a67fa602f58eec5dc5929160f395613c5288b0c50e8682064ab1cb8949ee7"
};

const NUMERO_ORGANIZADOR = "5541998814995";
const PRAZO_LIMITE_PALPITES = new Date("2026-09-01T20:30:00");
const LIMITE_ENVIOS_PERFIL = 2;

// ==========================================
// 2. FUNÇÕES AUXILIARES DE CÁLCULO E SEGURANÇA
// ==========================================

// Converter texto de pontos (Ex: "+3" -> 3, "-10" -> -10, "0" -> 0)
function extrairPontosNumericos(textoPontos) {
  if (!textoPontos) return 0;
  const limpo = String(textoPontos).replace(/[^0-9+-]/g, '');
  const valor = parseInt(limpo, 10);
  return isNaN(valor) ? 0 : valor;
}

// Soma todos os pontos obtidos nos jogos e eventos da rodada atual
function calcularPontosGanhosNaRodada(jogador) {
  let soma = 0;

  if (jogador.jogos && Array.isArray(jogador.jogos)) {
    jogador.jogos.forEach(jogo => {
      soma += extrairPontosNumericos(jogo.pontos);
    });
  }

  if (jogador.eventos && Array.isArray(jogador.eventos)) {
    jogador.eventos.forEach(ev => {
      if (ev.pontos) {
        soma += extrairPontosNumericos(ev.pontos);
      }
    });
  }

  return soma;
}

// Hash SHA-256 para senha do perfil
async function gerarSHA256(texto) {
  const msgUint8 = new TextEncoder().encode(texto);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// ==========================================
// 3. BUSCA DE DADOS E CÁLCULO ACUMULADO HISTÓRICO
// ==========================================

// Função auxiliar que carrega um JSON de rodada específico
async function carregarJsonRodada(numeroRodada) {
  try {
    const resposta = await fetch(`src/js/rodadas/rodada${numeroRodada}.json`);
    if (!resposta.ok) return null;
    return await resposta.json();
  } catch (e) {
    console.warn(`Aviso: Erro ao carregar a rodada ${numeroRodada}`);
    return null;
  }
}

async function buscarDadosRodada(numeroRodadaAlvo) {
  try {
    // 1. Encontra o índice da rodada solicitada no histórico
    const idxAlvo = RODADAS_EXISTENTES.findIndex(
      r => String(r).toLowerCase() === String(numeroRodadaAlvo).toLowerCase()
    );

    if (idxAlvo === -1) {
      throw new Error(`Rodada ${numeroRodadaAlvo} não encontrada em RODADAS_EXISTENTES.`);
    }

    // 2. Mapa de pontuação acumulada para os jogadores. Todos começam com 500 pts no início.
    const PONTUACAO_INICIAL_CAMPEONATO = 500;
    const placarAcumulado = {};

    // 3. Carrega o JSON da rodada alvo para ser a referência visual da tela
    const dadosRodadaExibicao = await carregarJsonRodada(numeroRodadaAlvo);
    if (!dadosRodadaExibicao) {
      throw new Error(`Não foi possível carregar o arquivo da rodada ${numeroRodadaAlvo}`);
    }

    // Inicializa os participantes da tela com base de 500
    dadosRodadaExibicao.participantes.forEach(p => {
      placarAcumulado[p.nome] = PONTUACAO_INICIAL_CAMPEONATO;
    });

    // 4. Percorre o histórico DESDE A PRIMEIRA RODADA (índice 0) ATÉ A RODADA ALVO (idxAlvo)
    for (let i = 0; i <= idxAlvo; i++) {
      const rodadaNum = RODADAS_EXISTENTES[i];
      const dadosRodadaLoop = await carregarJsonRodada(rodadaNum);

      if (dadosRodadaLoop && dadosRodadaLoop.participantes) {
        dadosRodadaLoop.participantes.forEach(jogador => {
          const pontosNestaRodada = calcularPontosGanhosNaRodada(jogador);

          if (placarAcumulado[jogador.nome] === undefined) {
            placarAcumulado[jogador.nome] = PONTUACAO_INICIAL_CAMPEONATO;
          }

          placarAcumulado[jogador.nome] += pontosNestaRodada;
        });
      }
    }

    // 5. Aplica a pontuação total calculada dinamicamente no objeto de exibição
    dadosRodadaExibicao.participantes.forEach(jogador => {
      jogador.pontuacaoTotal = placarAcumulado[jogador.nome] !== undefined 
        ? placarAcumulado[jogador.nome] 
        : PONTUACAO_INICIAL_CAMPEONATO;
    });

    // Se for a rodada atual do campeonato, salva globalmente
    if (String(numeroRodadaAlvo).toLowerCase() === String(ULTIMA_RODADA).toLowerCase()) {
      window.dadosUltimaRodada = dadosRodadaExibicao;
      renderizarFormularioJogos(dadosRodadaExibicao);
    }

    renderizarRodada(dadosRodadaExibicao);
  } catch (erro) {
    console.error("Erro ao carregar e calcular os dados acumulados:", erro);
  }
}

// ==========================================
// 4. RENDERIZAÇÃO DA TELA (CARDS DOS JOGADORES)
// ==========================================
function renderizarRodada(dados) {
  const elementoRodada = document.getElementById("nome-rodada");
  if (elementoRodada) elementoRodada.innerText = dados.nome;

  const elementoPrazo = document.getElementById("data-prazo");
  const containerLembrete = document.getElementById("lembrete-prazo");

  if (dados.prazoPalpites && elementoPrazo) {
    elementoPrazo.innerText = dados.prazoPalpites;
    const seletorHist = document.getElementById('seletor-historico');
    if (containerLembrete && (!seletorHist || seletorHist.style.display === 'none')) {
      containerLembrete.style.display = "flex";
    }
  } else if (containerLembrete) {
    containerLembrete.style.display = "none";
  }

  const container = document.getElementById("container-jogadores");
  if (!container) return;

  // 1. Descobre a maior pontuação obtida exclusivamente NESTA rodada
  const pontuacoesDaRodada = dados.participantes.map(p => calcularPontosGanhosNaRodada(p));
  const maiorPontuacaoRodada = Math.max(...pontuacoesDaRodada);

  // 2. Ordena a lista de jogadores pela pontuação ACUMULADA DO CAMPEONATO (Classificação geral)
  const jogadoresOrdenados = [...dados.participantes].sort((a, b) => b.pontuacaoTotal - a.pontuacaoTotal);

  const tagCompeticaoAbaixoCartas = (dados.rodadaBonus && dados.competicao) ? `
    <div style="
      text-align: center;
      font-size: 0.7rem;
      color: #3498db;
      font-weight: bold;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-top: 10px;
      padding: 4px 8px;
      background: rgba(52, 152, 219, 0.12);
      border: 1px solid rgba(52, 152, 219, 0.3);
      border-radius: 6px;
      width: 100%;
      box-sizing: border-box;
    ">
      🏆 ${dados.competicao}
    </div>
  ` : '';

  let htmlAcumulado = "";

  jogadoresOrdenados.forEach((jogador) => {
    const pontosRodadaAtual = calcularPontosGanhosNaRodada(jogador);
    const eLiderDaRodada = pontosRodadaAtual === maiorPontuacaoRodada;

    const cartasHTML = jogador.cartas ? jogador.cartas.map(carta =>
      `<img class="carta-icone ${carta.usada ? 'carta-usada' : ''}" src="${carta.img}" alt="carta">`
    ).join('') : '';

    // SEÇÃO NOVA: TAG DA CARTA ATIVA USADA NA RODADA
    const tagCartaAtivaHTML = jogador.cartaAtiva ? `
      <div style="
        text-align: center;
        font-size: 0.68rem;
        color: #9b59b6;
        font-weight: bold;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        margin-top: 6px;
        padding: 3px 6px;
        background: rgba(155, 89, 182, 0.15);
        border: 1px solid rgba(155, 89, 182, 0.4);
        border-radius: 6px;
        width: 100%;
        box-sizing: border-box;
      ">
        🃏 ${jogador.cartaAtiva}
      </div>
    ` : '';

    const jogosHTML = renderizarJogosJogador(jogador);

    const eventosHTML = jogador.eventos ? jogador.eventos.map(ev => `
      <div class="evento">
        <span>${ev.texto}</span>
        <span class="${ev.acertou ? 'positivo' : 'negativo'}">${ev.acertou ? '✓' : '✗'}</span>
      </div>
    `).join('') : '';

    htmlAcumulado += `
      <article class="card-player">
        ${eLiderDaRodada ? '<img src="src/img/especial/lider.png" class="badge-lider-sobreposta" alt="Líder da Rodada">' : ''}
        <div class="card-header">
          <h2>${jogador.nome}</h2>
        </div>
        <div class="card-body">
          <div class="perfil">
            <img class="avatar" src="${jogador.avatar}" alt="${jogador.nome}">
            <div class="total-container">
              <div class="total-pontos-wrapper">
                <span class="total-pontos">${jogador.pontuacaoTotal}</span>
                <span class="pts-label">pts</span>
              </div>
              <div class="cartas-jogo">
                ${cartasHTML}
              </div>
              ${tagCartaAtivaHTML}
              ${tagCompeticaoAbaixoCartas}
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

  container.innerHTML = htmlAcumulado;
}

function renderizarJogosJogador(jogador) {
  if (!jogador.jogos) return '';

  return jogador.jogos.map(jogo => `
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
  `).join('');
}

// ==========================================
// 5. NAVEGAÇÃO E HISTÓRICO
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
  document.querySelectorAll('.aba-conteudo').forEach(aba => {
    aba.style.display = 'none';
  });

  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.classList.remove('active');
  });

  const seletorHist = document.getElementById('seletor-historico');
  const subtituloRodada = document.getElementById('container-rodada-subtitulo');
  const lembretePrazo = document.getElementById('lembrete-prazo');

  if (seletorHist) seletorHist.style.display = 'none';
  if (subtituloRodada) subtituloRodada.style.display = 'none';
  if (lembretePrazo) lembretePrazo.style.display = 'none';

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

  if (elementoClicado) {
    elementoClicado.classList.add('active');
  }
}

// ==========================================
// 6. BADGES E LEADERBOARD
// ==========================================
async function carregarAbaBadges() {
  if (!window.dadosUltimaRodada) {
    await buscarDadosRodada(ULTIMA_RODADA);
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

// ==========================================
// 7. FORMULÁRIO DE PALPITES & ENVIO
// ==========================================
function renderizarFormularioJogos(dadosRodada) {
  const containerJogos = document.getElementById("container-jogos-palpite");
  if (!containerJogos) return;

  const agora = new Date();
  if (agora > PRAZO_LIMITE_PALPITES) {
    containerJogos.innerHTML = `
      <div style="
        background: linear-gradient(135deg, rgba(231, 76, 60, 0.15), rgba(192, 57, 43, 0.15));
        border: 2px dashed #e74c3c;
        border-radius: 12px;
        padding: 25px 20px;
        text-align: center;
        margin: 15px 0;
      ">
        <div style="font-size: 2.5rem; margin-bottom: 10px;">⏳</div>
        <h3 style="
          font-family: 'Press Start 2P', cursive;
          font-size: 0.85rem;
          color: #e74c3c;
          margin-bottom: 12px;
          line-height: 1.4;
        ">
          PALPITES ENCERRADOS!
        </h3>
        <p style="
          color: #c9d1d9;
          font-size: 0.85rem;
          line-height: 1.5;
          margin-bottom: 0;
        ">
          O prazo para envio de palpites da <strong>Rodada ${ULTIMA_RODADA}</strong> expirou.<br><br>
          Acompanhe os resultados e pontuações na aba <strong>Início</strong>!
        </p>
      </div>
    `;

    const btnEnviar = document.querySelector(".btn-enviar-palpite");
    if (btnEnviar) btnEnviar.style.display = "none";

    const secaoPerfil = document.getElementById("secao-autenticacao-palpite");
    if (secaoPerfil) secaoPerfil.style.display = "none";

    return;
  }

  const btnEnviar = document.querySelector(".btn-enviar-palpite");
  if (btnEnviar) btnEnviar.style.display = "block";

  const primeiroParticipante = dadosRodada.participantes[0] || {};
  const jogosDaRodada = primeiroParticipante.jogos || [];
  const eventosDaRodada = primeiroParticipante.eventos || [];

  if (jogosDaRodada.length === 0) {
    containerJogos.innerHTML = "<p style='text-align:center; color:#8b949e;'>Nenhum jogo disponível no momento.</p>";
    return;
  }

  let html = `
    <div style="background-color: #161b22; border: 1px solid #30363d; border-radius: 8px; padding: 10px; margin-bottom: 15px; text-align: center;">
      <label style="font-size: 0.75rem; color: #8b949e; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px;">
        <input type="radio" name="jogo-coringa" value="nenhum" checked>
        🚫 Não usar Coringa 2X nesta rodada
      </label>
    </div>
  `;

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

  if (eventosDaRodada.length > 0) {
    html += `<hr class="divisor">`;

    if (dadosRodada.rodadaBonus && dadosRodada.competicao) {
      html += `
        <div style="
          text-align: center;
          margin: 10px 0 5px 0;
          font-size: 0.75rem;
          color: #3498db;
          font-weight: bold;
          letter-spacing: 1px;
          text-transform: uppercase;
        ">
          🏆 Competição: <span style="color: #fff;">${dadosRodada.competicao}</span>
        </div>
      `;
    }

    html += `
      <h3 style="font-size: 0.75rem; color: #f39c12; margin: 5px 0 10px 0; text-align: center; font-family: 'Press Start 2P', cursive;">
        PALPITES ESPECIAIS
      </h3>
      <div id="container-eventos-palpite" style="display: flex; flex-direction: column; gap: 10px;">
    `;

    html += eventosDaRodada.map((ev, index) => {
      const LabelTexto = ev.texto.trim();
      return `
        <div class="campo-grupo" style="margin-bottom: 5px;">
          <label for="ev-${index}" style="font-size: 0.75rem; color: #c9d1d9;">${LabelTexto}</label>
          <input type="text" id="ev-${index}" data-texto-original="${ev.texto}" placeholder="Ex: Nome Jogador (Time)" required style="background-color: #161b22; color: #fff; border: 1px solid #30363d; padding: 8px; border-radius: 6px; font-size: 0.8rem;">
        </div>
      `;
    }).join('');

    html += `</div>`;
  }

  // NOVA SEÇÃO: USO DE CARTAS ESPECIAIS
  html += `
    <hr class="divisor">
    <div style="margin-top: 15px;">
      <h3 style="font-size: 0.75rem; color: #9b59b6; margin: 5px 0 8px 0; text-align: center; font-family: 'Press Start 2P', cursive;">
        🃏 CARTAS ESPECIAIS
      </h3>
      <p style="font-size: 0.7rem; color: #8b949e; text-align: center; margin-bottom: 8px; line-height: 1.3;">
        Se desejar usar uma carta nesta rodada (Escudo, Seguro, Presente de Grego ou Dobro/Metade), especifique abaixo.
      </p>
      <textarea id="texto-cartas-especiais" rows="2" placeholder="Ex: Vou usar a carta Escudo nesta rodada&#10;Ex: Presente de Grego entre Fefe e Marcos no jogo 2" style="
        width: 100%;
        background-color: #161b22;
        color: #fff;
        border: 1px solid #30363d;
        border-radius: 6px;
        padding: 8px;
        font-size: 0.8rem;
        box-sizing: border-box;
        resize: vertical;
        font-family: inherit;
      "></textarea>
    </div>
  `;

  containerJogos.innerHTML = html;
}

function inicializarFormularioPalpites() {
  const form = document.getElementById("form-palpite");
  if (!form) return;

  form.addEventListener("submit", async function (event) {
    event.preventDefault();

    const agora = new Date();
    if (agora > PRAZO_LIMITE_PALPITES) {
      alert("⏳ O prazo para envio de palpites desta rodada já se encerrou!");
      return;
    }

    const jogadorSelec = document.getElementById("select-jogador").value;
    const chaveDigitada = document.getElementById("chave-jogador").value.trim();

    if (!jogadorSelec) {
      alert("⚠️ Por favor, selecione qual é o seu perfil!");
      return;
    }

    const hashDigitado = await gerarSHA256(chaveDigitada);

    if (CHAVES_JOGADORES_HASH[jogadorSelec] !== hashDigitado) {
      alert("❌ Chave Secreta incorreta! Você não tem autorização para palpitar por esse perfil.");
      return;
    }

    const chaveStorage = `envios_r${ULTIMA_RODADA}_${jogadorSelec}`;
    let enviosAtuais = parseInt(localStorage.getItem(chaveStorage) || "0", 10);

    if (enviosAtuais >= LIMITE_ENVIOS_PERFIL) {
      alert(`⛔ Limite atingido! O perfil ${jogadorSelec.toUpperCase()} já enviou o palpite ${LIMITE_ENVIOS_PERFIL} vezes na Rodada ${ULTIMA_RODADA}.`);
      return;
    }

    const jogosOriginais = window.dadosUltimaRodada?.participantes[0]?.jogos || [];
    const jogosContainer = document.getElementById("container-jogos-palpite");
    const caixasDeJogo = jogosContainer.querySelectorAll(".jogo-palpite-box");
    const coringaSelecionado = document.querySelector('input[name="jogo-coringa"]:checked')?.value;

    const horaFormatada = agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const dataFormatada = agora.toLocaleDateString('pt-BR');

    let listaJogosJSON = [];
    let textoLeitura = `⚽ *PALPITE CONFIRMADO - INACERTÁVEIS*%0A`;
    textoLeitura += `👤 *Jogador:* ${jogadorSelec.toUpperCase()} (Envio ${enviosAtuais + 1}/${LIMITE_ENVIOS_PERFIL})%0A`;
    textoLeitura += `🕒 *Enviado em:* ${dataFormatada} às ${horaFormatada}%0A%0A`;

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

    // CAPTURA DO USO DE CARTAS ESPECIAIS
    const campoCartas = document.getElementById("texto-cartas-especiais");
    const mensagemCartas = campoCartas ? campoCartas.value.trim() : "";

    if (mensagemCartas) {
      textoLeitura += `%0A🎴 *USO DE CARTA ESPECIAL:*%0A${encodeURIComponent(mensagemCartas)}%0A`;
    }

    // MONTA O DADO FINAL DO JSON
    const dadosParaColar = {
      jogos: listaJogosJSON,
      eventos: listaEventosJSON
    };

    if (mensagemCartas) {
      dadosParaColar.cartaEspecialUsada = mensagemCartas;
    }

    const jsonString = JSON.stringify(dadosParaColar, null, 2);

    let mensagemWhatsapp = textoLeitura;
    mensagemWhatsapp += `%0A📋 *BLOCO PRONTO PARA O JSON DO JOGADOR:*%0A`;
    mensagemWhatsapp += "```json%0A" + encodeURIComponent(jsonString) + "%0A```";

    localStorage.setItem(chaveStorage, enviosAtuais + 1);

    alert(`🎉 Palpite validado com sucesso, ${jogadorSelec.toUpperCase()}!\n\nEste é seu envio ${enviosAtuais + 1} de ${LIMITE_ENVIOS_PERFIL}. Redirecionando para o WhatsApp...`);

    const urlWhats = `https://api.whatsapp.com/send?phone=${NUMERO_ORGANIZADOR}&text=${mensagemWhatsapp}`;
    window.open(urlWhats, '_blank');

    form.reset();
  });
}

// ==========================================
// 8. INICIALIZAÇÃO DA PÁGINA
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
  preencherSeletorHistorico();

  const select = document.getElementById("select-rodada");
  if (select) select.value = ULTIMA_RODADA;

  buscarDadosRodada(ULTIMA_RODADA);
  inicializarFormularioPalpites();
});