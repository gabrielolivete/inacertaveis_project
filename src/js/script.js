// ==========================================
// 1. CONFIGURAÇÃO PRINCIPAL
// ==========================================
const RODADAS_EXISTENTES = [19, 20];
const ULTIMA_RODADA = RODADAS_EXISTENTES[RODADAS_EXISTENTES.length - 1];

// ==========================================
// 2. BUSCA DE DADOS (FETCH JSON)
// ==========================================
async function buscarDadosRodada(numeroRodada) {
  try {
    const resposta = await fetch(`src/js/rodadas/rodada${numeroRodada}.json`);

    if (!resposta.ok) {
      throw new Error(`Erro ao carregar rodada ${numeroRodada}`);
    }

    const dados = await resposta.json();

    // 💡 Salva os dados globalmente se for a última rodada
    if (Number(numeroRodada) === ULTIMA_RODADA) {
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

  // ⏰ 1. Atualiza o texto e EXIBE o lembrete (se o campo prazoPalpites existir no JSON)
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

  // Limpa a área de cards
  const container = document.getElementById("container-jogadores");
  if (!container) return;
  container.innerHTML = "";

  // 🏆 Ordena jogadores da maior para a menor pontuação
  const jogadoresOrdenados = [...dados.participantes].sort((a, b) => b.pontuacaoTotal - a.pontuacaoTotal);

  // 🎠 Renderiza os cards
  jogadoresOrdenados.forEach((jogador, index) => {
    const cartasHTML = jogador.cartas.map(carta =>
      `<img class="carta-icone ${carta.usada ? 'carta-usada' : ''}" src="${carta.img}" alt="carta">`
    ).join('');

    const jogosHTML = jogador.jogos.map(jogo => `
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

    const eventosHTML = jogador.eventos.map(ev => `
      <div class="evento">
        <span>${ev.texto}</span>
        <span class="${ev.acertou ? 'positivo' : 'negativo'}">${ev.acertou ? '✓' : '✗'}</span>
      </div>
    `).join('');

    const cardHTML = `
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

    container.innerHTML += cardHTML;
  });
}

// ==========================================
// 4. LÓGICA DO MENU E SELETOR DE HISTÓRICO
// ==========================================

function preencherSeletorHistorico() {
  const select = document.getElementById("select-rodada");
  if (!select) return;

  select.innerHTML = "";

  RODADAS_EXISTENTES.forEach(num => {
    const option = document.createElement("option");
    option.value = num;
    option.innerText = `RODADA ${num < 10 ? '0' + num : num}`;
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

  if (nomeAba === 'inicio') {
    document.getElementById('aba-rodadas').style.display = 'block';
    if (seletorHist) seletorHist.style.display = 'none';
    if (subtituloRodada) subtituloRodada.style.display = 'block';
    if (lembretePrazo) lembretePrazo.style.display = 'flex';
    buscarDadosRodada(ULTIMA_RODADA);
  }
  else if (nomeAba === 'historico') {
    document.getElementById('aba-rodadas').style.display = 'block';
    if (seletorHist) seletorHist.style.display = 'block';
    if (subtituloRodada) subtituloRodada.style.display = 'none';
    if (lembretePrazo) lembretePrazo.style.display = 'none';
    const select = document.getElementById("select-rodada");
    if (select) buscarDadosRodada(select.value);
  }
  else if (nomeAba === 'conquistas') {
    document.getElementById('aba-conquistas').style.display = 'block';
    if (subtituloRodada) subtituloRodada.style.display = 'none';
    if (lembretePrazo) lembretePrazo.style.display = 'none';

    carregarAbaBadges();
  }
  else if (nomeAba === 'regras') {
    document.getElementById('aba-regras').style.display = 'block';
    if (subtituloRodada) subtituloRodada.style.display = 'none';
    if (lembretePrazo) lembretePrazo.style.display = 'none';
  }

  if (elementoClicado) {
    elementoClicado.classList.add('active');
  }
}

// ==========================================
// 5. CARREGAR ABA BADGES
// ==========================================
async function carregarAbaBadges() {
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
          <span class="mini-player-pontos">${jogador.pontuacaoTotal}</span>
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
// 6. INICIALIZAÇÃO DA PÁGINA
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
  preencherSeletorHistorico();

  const select = document.getElementById("select-rodada");
  if (select) select.value = ULTIMA_RODADA;

  buscarDadosRodada(ULTIMA_RODADA);
});