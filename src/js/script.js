// ==========================================
// 1. CONFIGURAÇÃO PRINCIPAL
// ==========================================
// Coloque aqui apenas os números das rodadas que você realmente já criou o arquivo .json:
const RODADAS_EXISTENTES = [19, 20]; 

// A rodada atual/mais recente é sempre o último item da lista
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

  // Limpa a área de cards
  const container = document.getElementById("container-jogadores");
  if (!container) return;
  container.innerHTML = "";

  // 🏆 1. ORDENA OS JOGADORES DO MAIOR PARA O MENOR PONTO
  const jogadoresOrdenados = [...dados.participantes].sort((a, b) => b.pontuacaoTotal - a.pontuacaoTotal);

  // 🎠 2. RENDEREIZA OS CARDS JÁ ORDENADOS
  jogadoresOrdenados.forEach((jogador, index) => {
    // Monta as cartas
    const cartasHTML = jogador.cartas.map(carta => 
      `<img class="carta-icone ${carta.usada ? 'carta-usada' : ''}" src="${carta.img}" alt="carta">`
    ).join('');

    // Monta os palpites
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

    // Monta os eventos
    const eventosHTML = jogador.eventos.map(ev => `
      <div class="evento">
        <span>${ev.texto}</span>
        <span class="${ev.acertou ? 'positivo' : 'negativo'}">${ev.acertou ? '✓' : '✗'}</span>
      </div>
    `).join('');

    // Card completo (com badge de posição do líder/colocação)
    const cardHTML = `
      <article class="card-player">
        <div class="card-header">
          <h2>${index === 0 ? '👑 ' : ''}${jogador.nome}</h2>
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

// Preenche o menu suspenso (<select>) APENAS com as rodadas da lista
function preencherSeletorHistorico() {
  const select = document.getElementById("select-rodada");
  if (!select) return;

  select.innerHTML = "";

  // Percorre apenas o array de rodadas existentes
  RODADAS_EXISTENTES.forEach(num => {
    const option = document.createElement("option");
    option.value = num;
    option.innerText = `RODADA ${num < 10 ? '0' + num : num}`;
    select.appendChild(option);
  });
}

// Função chamada quando o usuário escolhe uma opção no dropdown
function carregarRodadaHistorico(numeroRodada) {
  buscarDadosRodada(numeroRodada);
}

function mudarAba(nomeAba, elementoClicado) {
  // 1. Esconde TODAS as abas
  document.querySelectorAll('.aba-conteudo').forEach(aba => {
    aba.style.display = 'none';
  });
  
  // 2. Remove o destaque visual amarelo de todos os botões
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.classList.remove('active');
  });

  const seletorHist = document.getElementById('seletor-historico');
  const subtituloRodada = document.getElementById('container-rodada-subtitulo');

  // 3. Mostra a aba específica que foi clicada
  if (nomeAba === 'inicio') {
    document.getElementById('aba-rodadas').style.display = 'block';
    if (seletorHist) seletorHist.style.display = 'none';
    if (subtituloRodada) subtituloRodada.style.display = 'block';
    buscarDadosRodada(ULTIMA_RODADA);
  } 
  else if (nomeAba === 'historico') {
    document.getElementById('aba-rodadas').style.display = 'block';
    if (seletorHist) seletorHist.style.display = 'block';
    if (subtituloRodada) subtituloRodada.style.display = 'none';
    const select = document.getElementById("select-rodada");
    if (select) buscarDadosRodada(select.value);
  } 
  else if (nomeAba === 'conquistas') {
    document.getElementById('aba-conquistas').style.display = 'block'; // <--- Ativa essa div
    if (subtituloRodada) subtituloRodada.style.display = 'none';
  }
  else if (nomeAba === 'regras') {
    document.getElementById('aba-regras').style.display = 'block'; // <--- Ativa essa div
    if (subtituloRodada) subtituloRodada.style.display = 'none';
  }

  // 4. Marca o botão clicado como ativo
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