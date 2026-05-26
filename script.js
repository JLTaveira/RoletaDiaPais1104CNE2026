// Definição das 6 equipas com os caminhos das imagens de ecrã inteiro
const equipas = {
    1: { nome: "Os Mosqueteiros de Aramis", imagem: "equipa1.jpg", msg: "Pela honra e pelo manuscrito! Desvendem o segredo de Versalhes antes que o sangue seque na pedra." },
    2: { nome: "A Guarda Real de d'Artagnan", imagem: "equipa2.jpg", msg: "Lealdade e astúcia! O destino de França está nas vossas mãos. Protejam o segredo do Rei." },
    3: { nome: "Os Conspiradores da Máscara", imagem: "equipa3.jpg", msg: "Nas sombras mais escuras de Versalhes se esconde a verdade. Libertem o homem da máscara de ferro!" },
    4: { nome: "Os Segredos de Milady", imagem: "equipa4.jpg", msg: "Intriga, espionagem e passos silenciosos. Ninguém poderá saber que estiveram aqui." },
    5: { nome: "Os Bravos de Porthos", imagem: "equipa5.jpg", msg: "Força bruta, coragem e companheirismo! Nenhum obstáculo ou parede de Versalhes vos conseguirá travar." },
    6: { nome: "Os Eruditos de Athos", imagem: "equipa6.jpg", msg: "Sabedoria, precisão e sangue-frio. Sigam o rasto de gotas de sangue sem deixar testemunhas." }
};

// Inicialização das tabelas locais se não existirem
if (!localStorage.getItem('jogadores')) localStorage.setItem('jogadores', JSON.stringify([]));

// FUNÇÃO DO BACKOFFICE (admin.html)
function liberarSorteio() {
    const escalao = document.getElementById('escalao').value;
    const genero = document.getElementById('genero').value;
    
    // Recolhe equipas bloqueadas
    const checkboxes = document.querySelectorAll('.bloqueio:checked');
    const equipasBloqueadas = Array.from(checkboxes).map(cb => parseInt(cb.value));

    const proximoJogador = { 
        escalao: escalao, 
        genero: genero, 
        equipasBloqueadas: equipasBloqueadas 
    };
    
    // Coloca o jogador na "sala de espera" do disco
    localStorage.setItem('jogadorPendente', JSON.stringify(proximoJogador));
    
    // REGRA SUGERIDA: Desativa o botão para evitar alterações ou cliques duplos
    const botao = document.querySelector('button[onclick="liberarSorteio()"]');
    botao.disabled = true;
    botao.innerText = "⏳ A AGUARDAR JOGADOR EM VERSALHES...";
    botao.style.background = "#6c757d"; // Cinzento de desativado
    botao.style.cursor = "not-allowed";

    // Limpa as checkboxes para o próximo
    checkboxes.forEach(cb => cb.checked = false);
}

// FUNÇÃO DO JOGADOR (index.html)
function iniciarSorteio() {
    // Vai buscar o jogador que o Admin colocou na sala de espera
    const jogadorAtual = JSON.parse(localStorage.getItem('jogadorPendente'));
    
    if (!jogadorAtual) {
        alert("Aguarde que a mesa de controlo autorize a sua entrada em Versalhes!");
        return;
    }

    // Retira IMEDIATAMENTE o jogador da sala de espera para ninguém conseguir clicar duas vezes
    localStorage.removeItem('jogadorPendente');

    const fundo = document.getElementById('fundo-roleta');
    const eInicial = document.getElementById('ecran-inicial');
    const eRoleta = document.getElementById('ecran-roleta');
    const eResultado = document.getElementById('ecran-resultado');

    // Ativar ecrã de roleta e mostrar o fundo full screen
    eInicial.style.display = 'none';
    eRoleta.style.display = 'flex';
    fundo.style.display = 'block';

    const listaImagens = Object.values(equipas).map(e => e.imagem);
    
    let idx = 0;
    const intervaloRoleta = setInterval(() => {
        fundo.style.backgroundImage = `url('${listaImagens[idx % listaImagens.length]}')`;
        idx++;
    }, 150);

    // Corre o algoritmo inteligente de distribuição equilibrada
    const equipaEscolhidaID = algoritmoSorteioEquitativo(jogadorAtual);

    // Parar após 10 segundos exatos
    setTimeout(() => {
        clearInterval(intervaloRoleta);
        
        // Fixa a imagem da equipa sorteada
        fundo.style.backgroundImage = `url('${equipas[equipaEscolhidaID].imagem}')`;
        
        // Grava na tabela de registos oficial
        salvarJogadorNaEquipa(jogadorAtual, equipaEscolhidaID);

        // Mostra o resultado final na tela
        eRoleta.style.display = 'none';
        document.getElementById('titulo-equipa').innerText = `Parabéns, és da Equipa ${equipaEscolhidaID}: ${equipas[equipaEscolhidaID].nome}!`;
        document.getElementById('msg-equipa').innerText = equipas[equipaEscolhidaID].msg;
        eResultado.style.display = 'flex';
        document.getElementById('caixa-resultado').style.display = 'block';

        // Sorteio concluído! Sinaliza o Backoffice para libertar o botão de novo
        localStorage.setItem('sorteioConcluido', 'true');

        // Reset completo da interface do jogador após 10 segundos para o próximo jogar
        setTimeout(() => {
            eResultado.style.display = 'none';
            fundo.style.display = 'none';
            eInicial.style.display = 'flex';
        }, 10000);

    }, 10000); 
}

// ALGORITMO EQUITATIVO
function algoritmoSorteioEquitativo(jogador) {
    const jogadoresAtuais = JSON.parse(localStorage.getItem('jogadores')) || [];
    let pontuacaoEquipas = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };

    for (let id in equipas) {
        const membros = jogadoresAtuais.filter(j => j.equipa == id);
        pontuacaoEquipas[id] += membros.length * 10;
        const mesmoEscalao = membros.filter(j => j.escalao === jogador.escalao).length;
        pontuacaoEquipas[id] += mesmoEscalao * 5;
        const mesmoGeneroEEscalao = membros.filter(j => j.escalao === jogador.escalao && j.genero === jogador.genero).length;
        pontuacaoEquipas[id] += mesmoGeneroEEscalao * 3;
    }

    let equipasElegiveis = [1, 2, 3, 4, 5, 6].filter(id => !jogador.equipasBloqueadas.includes(id));
    if (equipasElegiveis.length === 0) equipasElegiveis = [1, 2, 3, 4, 5, 6];
    equipasElegiveis.sort((a, b) => pontuacaoEquipas[a] - pontuacaoEquipas[b]);

    if (equipasElegiveis.length > 1 && Math.abs(pontuacaoEquipas[equipasElegiveis[0]] - pontuacaoEquipas[equipasElegiveis[1]]) <= 2) {
        return Math.random() > 0.5 ? equipasElegiveis[0] : equipasElegiveis[1];
    }
    return equipasElegiveis[0];
}

function salvarJogadorNaEquipa(jogador, equipaID) {
    const jogadoresAtuais = JSON.parse(localStorage.getItem('jogadores')) || [];
    jogador.equipa = equipaID;
    jogadoresAtuais.push(jogador);
    localStorage.setItem('jogadores', JSON.stringify(jogadoresAtuais));
}

function obterEstatisticasHTML() {
    const jogadores = JSON.parse(localStorage.getItem('jogadores')) || [];
    let html = "<table border='1' style='width:100%; text-align:center; border-collapse:collapse;'><tr><th>Equipa</th><th>Total</th><th>M / F</th><th>Distribuição por Escalão</th></tr>";
    for(let id in equipas) {
        const m = jogadores.filter(j => j.equipa == id);
        const masc = m.filter(j => j.genero === 'M').length;
        const fem = m.filter(j => j.genero === 'F').length;
        const lob = m.filter(j => j.escalao === 'Lobitos').length;
        const exp = m.filter(j => j.escalao === 'Exploradores').length;
        const pio = m.filter(j => j.escalao === 'Pioneiros').length;
        const cam = m.filter(j => j.escalao === 'Caminheiros').length;
        const pai = m.filter(j => j.escalao === 'Pais').length;

        html += `<tr>
            <td><strong>Equipa ${id} - ${equipas[id].nome}</strong></td>
            <td>${m.length} elementos</td>
            <td>${masc}M / ${fem}F</td>
            <td>${lob} Lob | ${exp} Exp | ${pio} Pio | ${cam} Cam | ${pai} Pais</td>
        </tr>`;
    }
    html += "</table>";
    return html;
}

// SENSOR DO BACKOFFICE: Fica a verificar se o jogador já terminou para reativar o botão
setInterval(() => {
    if (localStorage.getItem('sorteioConcluido') === 'true') {
        localStorage.removeItem('sorteioConcluido');
        const botao = document.querySelector('button[onclick="liberarSorteio()"]');
        if (botao) {
            botao.disabled = false;
            botao.innerText = "AUTORIZAR PRÓXIMO SORTEIO";
            botao.style.background = "#2d6a4f";
            botao.style.cursor = "pointer";
        }
    }
}, 500);