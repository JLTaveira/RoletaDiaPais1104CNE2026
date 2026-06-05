// Definição das 6 equipas com os caminhos das imagens de ecrã inteiro
const equipas = {
    1: { nome: "Aramis 📜", imagem: "equipa1.jpg", msg: "Pela honra e pelo manuscrito! Desvendem os segredos mais profundos e sagrados de Versalhes antes que o tempo se esgote." },
    2: { nome: "Porthos 🍷", imagem: "equipa2.jpg", msg: "Força bruta, coragem e companheirismo! Ergam as vossas canecas na taberna, nenhum obstáculo vos conseguirá travar!" },
    3: { nome: "Athos ⚜️", imagem: "equipa3.jpg", msg: "Sabedoria, precisão e sangue-frio. Sigam com a solenidade de um nobre Conde e não deixem rastos para trás." },
    4: { nome: "Treville 🏛️", imagem: "equipa4.jpg", msg: "Intriga, espionagem e passos silenciosos. O Capitão-Comandante exige disciplina militar nesta missão secreta!" },
    5: { nome: "D'Artagnan ⚔️", imagem: "equipa5.jpg", msg: "Lealdade, astúcia e audácia gascona! O destino de França e a proteção do Rei Sol estão nas pontas das vossas espadas." },
    6: { nome: "Planchet 🐴", imagem: "equipa6.jpg", msg: "Nas sombras mais escuras das masmorras se esconde a verdade. Libertem o homem da máscara de ferro com astúcia e fidelidade!" }
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
    let analiseEquipas = {};

    // 1. Analisar o estado interno de cada uma das 6 equipas
    for (let id = 1; id <= 6; id++) {
        const membros = jogadoresAtuais.filter(j => j.equipa == id);
        
        // Quantos do mesmo escalão já existem nesta equipa? (Ex: Quantos Lobitos)
        const mesmoEscalao = membros.filter(j => j.escalao === jogador.escalao).length;
        
        // Quantos do mesmo escalão E do mesmo género já existem? (Ex: Quantos rapazes Lobitos)
        const mesmoGeneroEEscalao = membros.filter(j => j.escalao === jogador.escalao && j.genero === jogador.genero).length;

        analiseEquipas[id] = {
            id: id,
            totalAbsoluto: membros.length,
            vagasEscalao: mesmoEscalao,
            vagasGeneroEscalao: mesmoGeneroEEscalao
        };
    }

    // 2. Filtrar apenas as equipas que não foram bloqueadas pelo Admin
    let equipasElegiveisIds = [1, 2, 3, 4, 5, 6].filter(id => !jogador.equipasBloqueadas.includes(id));
    
    // Salvaguarda: Se o Admin bloqueou tudo por engano, liberta todas
    if (equipasElegiveisIds.length === 0) equipasElegiveisIds = [1, 2, 3, 4, 5, 6];

    // Converter para array de objetos das elegíveis para podermos ordenar
    let listaFiltrada = equipasElegiveisIds.map(id => analiseEquipas[id]);

    // 3. ORDENAÇÃO POR PRIORIDADE ESTRITA:
    // Critério A: Vai para onde houver MENOS pessoas do mesmo género e escalão (Prioridade Máxima)
    // Critério B: Em caso de empate, vai para onde houver MENOS pessoas do mesmo escalão
    // Critério C: Em caso de novo empate, vai para a equipa com MENOS elementos no total global
    listaFiltrada.sort((a, b) => {
        if (a.vagasGeneroEscalao !== b.vagasGeneroEscalao) {
            return a.vagasGeneroEscalao - b.vagasGeneroEscalao;
        }
        if (a.vagasEscalao !== b.vagasEscalao) {
            return a.vagasEscalao - b.vagasEscalao;
        }
        return a.totalAbsoluto - b.totalAbsoluto;
    });

    // 4. INTRODUÇÃO DE FACTOR ALEATÓRIO CONTROLADO (Para manter a mística da roleta)
    // Se as duas melhores opções estiverem perfeitamente empatadas no critério de Género+Escalão,
    // baralhamos entre as duas em 50% das vezes para que o sorteio pareça orgânico.
    if (listaFiltrada.length > 1 && 
        listaFiltrada[0].vagasGeneroEscalao === listaFiltrada[1].vagasGeneroEscalao &&
        listaFiltrada[0].vagasEscalao === listaFiltrada[1].vagasEscalao) {
        
        return Math.random() > 0.5 ? listaFiltrada[0].id : listaFiltrada[1].id;
    }

    // Caso contrário, entrega obrigatoriamente à equipa matematicamente mais necessitada
    return listaFiltrada[0].id;
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