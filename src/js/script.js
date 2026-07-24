// ==========================================
// 1. CONFIGURAÇÃO PRINCIPAL
// ==========================================
// Atualize este número a cada nova rodada que você criar!
const ULTIMA_RODADA = 20; 

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

  // Limpa e redesenha a área de cards
  const container = document.getElementById("container-jogadores");
  if (!container) return;
  container.innerHTML = "";

  dados.participantes.forEach(jogador => {
    // Monta o HTML das cartas
    const cartasHTML = jogador.cartas.map(carta => 
      `<img class="carta-icone ${carta.usada ? 'carta-usada' : ''}" src="${carta.img}" alt="carta">`
    ).join('');

    // Monta o HTML dos palpites/jogos
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

    // Monta o HTML dos eventos (gols / cartões)
    const eventosHTML = jogador.eventos.map(ev => `
      <div class="evento">
        <span>${ev.texto}</span>
        <span class="${ev.acertou ? 'positivo' : 'negativo'}">${ev.acertou ? '✓' : '✗'}</span>
      </div>
    `).join('');

    // Junta tudo na estrutura do card
    const cardHTML = `
      <article class="card-player">
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

// Preenche o menu suspenso (<select>) com todas as rodadas disponíveis
function preencherSeletorHistorico() {
  const select = document.getElementById("select-rodada");
  if (!select) return;

  select.innerHTML = "";

  for (let i = 1; i <= ULTIMA_RODADA; i++) {
    const option = document.createElement("option");
    option.value = i;
    option.innerText = `RODADA ${i < 10 ? '0' + i : i}`;
    select.appendChild(option);
  }
}

// Função chamada quando o usuário escolhe uma opção no dropdown
function carregarRodadaHistorico(numeroRodada) {
  buscarDadosRodada(numeroRodada);
}

// Troca entre as abas do menu superior
function mudarAba(nomeAba, elementoClicado) {
  // Esconde o conteúdo de todas as abas
  document.querySelectorAll('.aba-conteudo').forEach(aba => aba.style.display = 'none');
  
  // Remove o destaque visual dos botões do menu
  document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));

  const seletorHist = document.getElementById('seletor-historico');
  const subtituloRodada = document.getElementById('container-rodada-subtitulo');

  if (nomeAba === 'inicio') {
    document.getElementById('aba-rodadas').style.display = 'block';
    if (seletorHist) seletorHist.style.display = 'none';
    if (subtituloRodada) subtituloRodada.style.display = 'block'; // Mostra a rodada
    
    buscarDadosRodada(ULTIMA_RODADA);
  } 
  else if (nomeAba === 'historico') {
    document.getElementById('aba-rodadas').style.display = 'block';
    if (seletorHist) seletorHist.style.display = 'block';
    if (subtituloRodada) subtituloRodada.style.display = 'block'; // Mostra a rodada
    
    const select = document.getElementById("select-rodada");
    if (select) buscarDadosRodada(select.value);
  } 
  else if (nomeAba === 'classificacao') {
    document.getElementById('aba-classificacao').style.display = 'block';
    if (subtituloRodada) subtituloRodada.style.display = 'none'; // OCULTA a rodada
  } 
  else if (nomeAba === 'conquistas') {
    document.getElementById('aba-conquistas').style.display = 'block';
    if (subtituloRodada) subtituloRodada.style.display = 'none'; // OCULTA a rodada
  }

  // Adiciona a classe active no botão clicado
  if (elementoClicado) {
    elementoClicado.classList.add('active');
  }
}

// ==========================================
// 5. INICIALIZAÇÃO DA PÁGINA
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
  preencherSeletorHistorico();
  
  // Define o valor padrão do seletor para a última rodada
  const select = document.getElementById("select-rodada");
  if (select) select.value = ULTIMA_RODADA;

  // Carrega a tela inicial
  buscarDadosRodada(ULTIMA_RODADA);
});