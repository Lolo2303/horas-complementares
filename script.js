// Configuração do Firebase
const firebaseConfig = {
    apiKey: "AIzaSyBRJWGi4EyVtxHHLfbUFhmIRdWvNUAn9uc",
    authDomain: "horas-complementares-68015.firebaseapp.com",
    databaseURL: "https://horas-complementares-68015-default-rtdb.firebaseio.com",
    projectId: "horas-complementares-68015",
    storageBucket: "horas-complementares-68015.firebasestorage.app",
    messagingSenderId: "124993283924",
    appId: "1:124993283924:web:4f49d5903a2d7326594ac1"
  };
  
  // Inicialize o Firebase
  firebase.initializeApp(firebaseConfig);
  const database = firebase.database();
  
  const atividades = []; // Lista para armazenar atividades cadastradas
  const totalPorCategoria = { Ensino: 0, Extensão: 0, Pesquisa: 0 }; // Objeto para controlar o total de horas por categoria
  
  // Listagem das regras para abastecer as funções e realizar os cálculos
  const regras = `Extensão - Máximo de horas a serem aproveitadas: 90hrs 
  
  Projeto de extensão	10%	40h
  Atividades culturais	80%	5h
  Visitas Técnicas	100%	40h
  Visitas a Feiras e Exposições	20%	5h
  Cursos de Idiomas	60%	20h
  Palestras, Seminários e Congressos (ouvinte)	80%	10h
  Palestras, Seminários e Congressos (apresentador)	100%	15h
  Projeto Empresa Júnior	20%	20h
  
  Ensino - Máximo de horas a serem aproveitadas: 90hrs
  
  Estágio Extracurricular	70%	40h
  Monitoria	70%	40h
  Concursos e campeonatos	70%	50h
  Presença comprovada a defesas de TCC do curso	50%	3h
  Cursos Profissionalizantes Específicos na área	80%	40h
  Cursos Profissionalizantes em geral	20%	10h
  
  Pesquisa - Máximo de horas a serem aproveitadas: 90hrs
  
  Iniciação Científica	80%	40h
  Publicação de artigos em periódicos científicos	100%	10h
  Publicação de artigos completos em anais de congressos	100%	7h
  Publicação de capítulo de livro	100%	7h
  Publicação de resumos de artigos em anais	100%	5h
  Registro de patentes como auto/coautor	100%	40h
  Premiação resultante de pesquisa científica	100%	10h
  Colaborador em atividades como Seminários e Congressos	100%	10h
  Palestras, Seminários e Congressos de Pesquisa (ouvinte)	80%	10h
  Palestras, Seminários e Congressos de Pesquisa (apresentador)	100%	15h`;
  
  // Função para salvar uma atividade no Firebase
  function salvarAtividadeNoFirebase(atividade) {
    const atividadesRef = database.ref('atividades');
    atividadesRef.push(atividade);
  }
  
  // Função para recuperar atividades do Firebase
  function recuperarAtividadesDoFirebase() {
    const atividadesRef = database.ref('atividades');
    atividadesRef.on('value', (snapshot) => {
      const data = snapshot.val();
      if (data) {
        atividades.length = 0; // Limpa a lista local
        totalPorCategoria.Ensino = 0;
        totalPorCategoria.Extensão = 0;
        totalPorCategoria.Pesquisa = 0;
  
        Object.keys(data).forEach(key => {
          atividades.push(data[key]);
          totalPorCategoria[data[key].Categoria] += data[key]["Horas Aproveitadas"];
        });
        exibirAtividades();
      }
    });
  }
  
  // Função para analisar as regras e convertê-las em um objeto
  function parseRegras(regras) {
    const linhas = regras.split('\n');
    const regrasObj = {};
    let categoriaAtual = '';
  
    linhas.forEach(linha => {
      if (linha.includes('Máximo de horas')) {
        categoriaAtual = linha.split(' - ')[0];
        regrasObj[categoriaAtual] = {};
      } else if (linha.includes('\t')) {
        const [atividade, aproveitamento, limite] = linha.split('\t');
        regrasObj[categoriaAtual][atividade.trim()] = {
          aproveitamento: parseFloat(aproveitamento),
          limite: parseInt(limite)
        };
      }
    });
  
    return regrasObj;
  }
  
  // Função para preencher os tipos de atividades com base na categoria selecionada
  function populateTipos() {
    const categoria = document.getElementById('categoria').value;
    const tipoSelect = document.getElementById('tipo');
    const regrasObj = parseRegras(regras);
  
    tipoSelect.innerHTML = '<option value="">Selecione um tipo</option>';
  
    if (categoria) {
      Object.keys(regrasObj[categoria]).forEach(tipo => {
        const option = document.createElement('option');
        option.value = tipo;
        option.textContent = tipo;
        tipoSelect.appendChild(option);
      });
    }
  }
  
  // Função para calcular as horas e salvar a atividade
  function calcularHoras() {
    const descricao = document.getElementById('descricao').value;
    const categoria = document.getElementById('categoria').value;
    const tipo = document.getElementById('tipo').value;
    const totalHoras = parseFloat(document.getElementById('totalHoras').value);
  
    const regrasObj = parseRegras(regras);
    const categoriaRegras = regrasObj[categoria];
    const tipoRegras = categoriaRegras[tipo];
  
    const aproveitamento = tipoRegras.aproveitamento / 100;
    const limite = tipoRegras.limite;
  
    let horasAproveitadas = totalHoras * aproveitamento;
    if (horasAproveitadas > limite) horasAproveitadas = limite;
  
    const atividade = {
      Descrição: descricao,
      Categoria: categoria,
      Tipo: tipo,
      "Total de Horas": totalHoras,
      "Horas Aproveitadas": horasAproveitadas,
      "Limite de Horas": limite
    };
  
    atividades.push(atividade);
    totalPorCategoria[categoria] += horasAproveitadas;
  
    // Salva a atividade no Firebase
    salvarAtividadeNoFirebase(atividade);
  
    document.getElementById('resultado').innerHTML = `
      <p><strong>Descrição:</strong> ${descricao}</p>
      <p><strong>Categoria:</strong> ${categoria}</p>
      <p><strong>Tipo:</strong> ${tipo}</p>
      <p><strong>Total de Horas:</strong> ${totalHoras}</p>
      <p><strong>Horas Aproveitadas:</strong> ${horasAproveitadas}</p>
      <p><strong>Limite de Horas:</strong> ${limite}</p>
    `;
  }
  
  // Função para exibir as atividades cadastradas
  function exibirAtividades() {
    let listaHTML = "<h2>Atividades Cadastradas</h2>";
    
    atividades.forEach((atividade, index) => {
      listaHTML += `<p><strong>${index + 1}.</strong> ${atividade.Descrição} - ${atividade.Categoria} - ${atividade.Tipo} - ${atividade["Horas Aproveitadas"]}h</p>`;
    });
  
    listaHTML += `<h3>Total por Categoria</h3>
                  <p>Ensino: ${totalPorCategoria["Ensino"]}h</p>
                  <p>Extensão: ${totalPorCategoria["Extensão"]}h</p>
                  <p>Pesquisa: ${totalPorCategoria["Pesquisa"]}h</p>`;
  
    document.getElementById("listaAtividades").innerHTML = listaHTML;
  }
  
  // Função para excluir uma atividade
  function excluirAtividade() {
    if (atividades.length === 0) {
      alert("Nenhuma atividade cadastrada para excluir.");
      return;
    }
  
    let index = prompt("Digite o número da atividade que deseja excluir:");
  
    if (index === null || index.trim() === "") return;
  
    index = parseInt(index) - 1;
  
    if (isNaN(index) || index < 0 || index >= atividades.length) {
      alert("Número inválido. Escolha um número da lista.");
      return;
    }
  
    const atividadeRemovida = atividades.splice(index, 1)[0];
    totalPorCategoria[atividadeRemovida.Categoria] -= atividadeRemovida["Horas Aproveitadas"];
  
    // Remove a atividade do Firebase
    const atividadesRef = database.ref('atividades');
    atividadesRef.once('value', (snapshot) => {
      snapshot.forEach((childSnapshot) => {
        const childData = childSnapshot.val();
        if (childData.Descrição === atividadeRemovida.Descrição && childData.Categoria === atividadeRemovida.Categoria) {
          childSnapshot.ref.remove();
        }
      });
    });
  
    alert("Atividade removida com sucesso!");
    exibirAtividades();
  }
  
  // Função para baixar a lista de atividades em Excel
  function baixarLista() {
    if (atividades.length === 0) {
      alert('Nenhuma atividade cadastrada.');
      return;
    }
  
    let atividadesExcel = [...atividades];
    atividadesExcel.push({ Descrição: "Total por Categoria", Ensino: totalPorCategoria["Ensino"], Extensão: totalPorCategoria["Extensão"], Pesquisa: totalPorCategoria["Pesquisa"] });
  
    const worksheet = XLSX.utils.json_to_sheet(atividadesExcel);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Atividades");
  
    XLSX.writeFile(workbook, "atividades_cadastradas.xlsx");
  }
  
  // Inicializa a exibição das atividades ao carregar a página
  window.onload = function() {
    recuperarAtividadesDoFirebase();
  };