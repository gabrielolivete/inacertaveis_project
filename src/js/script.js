// ==========================================
// 1. CONFIGURAÇÃO PRINCIPAL
// ==========================================
const RODADAS_EXISTENTES = [19, 20, "b01", 21];
const ULTIMA_RODADA = RODADAS_EXISTENTES[RODADAS_EXISTENTES.length - 1];

const CHAVES_JOGADORES_HASH = {
  marcola: "5efe6e6a239f8bec144e1b1f24680aad25764f77cfa2c54dfd1dca7dc73f810b",
  gabs: "72831924521887e6638e686d6d004cd6cefe48168d2d4e2c40d29115b9c611b9",
  joca: "6c4ffc3992e5ac7161c57e3256e49c33f0fa8db139b0f6f2dba65df85d1bd7dd",
  fefezao: "d52a67fa602f58eec5dc5929160f395613c5288b0c50e8682064ab1cb8949ee7"
};

// Função auxiliar para converter o texto em SHA-256 usando o próprio navegador
async function gerarSHA256(texto) {
  const msgUint8 = new TextEncoder().encode(texto);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

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

    // Se for a rodada atual, armazena e atualiza o formulário de palpites
    if (String(numeroRodada).toLowerCase() === String(ULTIMA_RODADA).toLowerCase()) {
      window.dadosUltimaRodada = dados;
      renderizarFormularioJogos(dados);
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
  const elementoRodada = document.getElementById("nome-rodada");
  if (elementoRodada) {
    elementoRodada.innerText = dados.nome;
  }

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

  const jogadoresOrdenados = [...dados.participantes].sort((a, b) => b.pontuacaoTotal - a.pontuacaoTotal);

  let htmlAcumulado = "";

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
// 5. CARREGAR ABA BADGES E FORMULÁRIO DE JOGOS
// ==========================================
async function carregarAbaBadges() {
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

  // 1. VERIFICAÇÃO DE PRAZO ENCERRADO (NOVO!)
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

    // Esconde o botão de envio e a seção de seleção de perfil/chave se existirem no HTML
    const btnEnviar = document.querySelector(".btn-enviar-palpite");
    if (btnEnviar) btnEnviar.style.display = "none";

    const secaoPerfil = document.getElementById("secao-autenticacao-palpite"); // ajuste a classe/id se tiver no seu HTML
    if (secaoPerfil) secaoPerfil.style.display = "none";

    return;
  }

  // Restaura a visibilidade do botão caso o prazo ainda esteja válido
  const btnEnviar = document.querySelector(".btn-enviar-palpite");
  if (btnEnviar) btnEnviar.style.display = "block";

  // 2. VERIFICA SE É UMA RODADA BÔNUS
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

    if (btnEnviar) btnEnviar.style.display = "none";
    return;
  }

  // 3. RENDERIZAÇÃO PADRÃO (SE DENTRO DO PRAZO)
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
          <input type="text" id="ev-${index}" data-texto-original="${ev.texto}" placeholder="Ex: Nome Jogador (Time)" required style="background-color: #161b22; color: #fff; border: 1px solid #30363d; padding: 8px; border-radius: 6px; font-size: 0.8rem;">
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
const PRAZO_LIMITE_PALPITES = new Date("2026-07-29T16:00:00");
const LIMITE_ENVIOS_PERFIL = 2;

function inicializarFormularioPalpites() {
  const form = document.getElementById("form-palpite");
  if (!form) return;

  // 💡 Adicionado 'async' no manipulador do evento submit
  form.addEventListener("submit", async function (event) {
    event.preventDefault();

    // 1. VERIFICAÇÃO DE DATA E HORÁRIO LIMITE
    const agora = new Date();
    if (agora > PRAZO_LIMITE_PALPITES) {
      alert("⏳ O prazo para envio de palpites desta rodada já se encerrou!");
      return;
    }

    const jogadorSelec = document.getElementById("select-jogador").value;
    const chaveDigitada = document.getElementById("chave-jogador").value.trim();

    // 2. VALIDAÇÃO DE SELEÇÃO E CHAVE SECRETA (HASH SHA-256)
    if (!jogadorSelec) {
      alert("⚠️ Por favor, selecione qual é o seu perfil!");
      return;
    }

    const hashDigitado = await gerarSHA256(chaveDigitada);

    if (CHAVES_JOGADORES_HASH[jogadorSelec] !== hashDigitado) {
      alert("❌ Chave Secreta incorreta! Você não tem autorização para palpitar por esse perfil.");
      return;
    }

    // 3. TRAVA COM RESET AUTOMÁTICO POR RODADA
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

    // INCREMENTA A CONTAGEM DE ENVIOS NO NAVEGADOR
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