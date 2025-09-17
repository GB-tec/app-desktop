const router = {
  routes: {},
  defaultRoute: 'dashboard',
  register: function (path, handler) {
    this.routes[path] = handler;
  },
  navigate: function (path) {
    window.location.hash = path;
    this.loadContent(path);
  },
  loadContent: function (path) {
    const contentDiv = document.querySelector('.content');
    if (path.startsWith('#')) {
      path = path.substring(1);
    }
    if (!path) {
      path = this.defaultRoute;
    }
    if (this.routes[path]) {
      const content = this.routes[path]();
      contentDiv.innerHTML = content;
      const event = new CustomEvent('contentLoaded', { detail: { route: path } });
      document.dispatchEvent(event);
    } else {
      if (path !== this.defaultRoute && this.routes[this.defaultRoute]) {
        console.warn(`Rota "${path}" não encontrada. Redirecionando para a rota padrão.`);
        this.navigate(this.defaultRoute);
      } else {
        // Caso a rota padrão também não exista
        contentDiv.innerHTML = `
          <h2>Página não encontrada</h2>
          <p>A página "${path}" não foi encontrada.</p>
        `;
      }
    }
  },

  // Inicializa o router
  init: function () {
    // Manipula a mudança na hash da URL
    window.addEventListener('hashchange', () => {
      const path = window.location.hash.substring(1);
      this.loadContent(path);
    });

    // Carrega o conteúdo inicial
    const path = window.location.hash.substring(1);
    this.loadContent(path); // Se path estiver vazio, carregará a rota padrão
  }
};
function filtrarEmpresas(empresas, termoBusca) {
  if (!termoBusca || termoBusca.trim() === '') {
    return empresas;
  }

  const termo = termoBusca.toLowerCase().trim();

  return empresas.filter(empresa => {
    const nome = empresa.nome ? empresa.nome.toLowerCase() : '';
    const cnpj = empresa.cnpj ? empresa.cnpj.replace(/\D/g, '') : '';
    const cnpjFormatado = empresa.cnpjFormatado ? empresa.cnpjFormatado : '';

    return nome.includes(termo) ||
      cnpj.includes(termo) ||
      cnpjFormatado.includes(termo);
  });
}

document.addEventListener('DOMContentLoaded', function () {

  router.register('dashboard', function () {
    // Assim que o HTML do dashboard for criado, chamamos a função para atualizar o contador.
    setTimeout(async () => {
      const contadorElemento = document.getElementById('total-empresas-ativas');
      if (contadorElemento) {
        const total = await getTotalEmpresasAtivas();
        contadorElemento.textContent = total;
      }
    }, 100); // Pequeno delay para garantir que o DOM foi renderizado.

    return `
    <div class="dash_css">
      <h1>G B SISTEMAS</h1>
      <h2>Dashboard</h2>
      <p>Bem-vindo ao sistema de gestão GB Sistemas.</p>
      <div class="dashboard-stats">
        <div class="stat-card">
          <h3>Empresas Ativas</h3>
          <p class="stat-number" id="total-empresas-ativas">0</p>
        </div>
        <div class="stat-card">
          <h3>Certidões a Vencer</h3>
          <p class="stat-number">8</p>
        </div>
        <div class="stat-card">
          <h3>Notas Fiscais Emitidas</h3>
          <p class="stat-number">124</p>
        </div>
      </div>
    </div>
  `;
  });

  router.register('nfse-mensal', function () {
    return `
    <h2>NFS-e Mensal</h2>
    <p>Gestão de Notas Fiscais de Serviço Mensais.</p>
    
    <!-- CAMPO DE BUSCA ADICIONADO -->
    <div class="mb-3">
      <div class="input-group">
        <span class="input-group-text"><i class="fas fa-search"></i></span>
        <input type="text" class="form-control busca-empresa" placeholder="Buscar por nome da empresa ou CNPJ..." id="buscaNfseMensal">
      </div>
      <small class="form-text text-muted" id="contadorEmpresas"></small>
    </div>
    
    <div id="empresasGrid" class="empresas-grid-container">
      <!-- Conteúdo será carregado dinamicamente -->
    </div>
    <div style="text-align:center; margin-top:20px;">
  <button id="btnCadastrar" class="btn btn-primary" 
          style="padding:12px 24px; font-size:16px; border-radius:6px;">
    Baixar Todas
  </button>
</div>
  `;
  });

  router.register('nfse-anual', function () {
    return `
    <h2>NFS-e Anual</h2>
    <p>Gestão de Notas Fiscais de Serviço Anuais.</p>
    
    <div class="mb-3">
      <div class="input-group">
        <span class="input-group-text"><i class="fas fa-search"></i></span>
        <input type="text" class="form-control busca-empresa" placeholder="Buscar por nome da empresa ou CNPJ..." id="buscaNfseAnual">
      </div>
      <small class="form-text text-muted" id="contadorEmpresas"></small>
    </div>
    
    <div id="empresasGrid" class="empresas-grid-container">
      <!-- Conteúdo será carregado dinamicamente -->
    </div>
    <div style="text-align:center; margin-top:20px;">
  <button id="btnCadastrar" class="btn btn-primary" 
          style="padding:12px 24px; font-size:16px; border-radius:6px;">
    Baixar Todas
  </button>
</div>
    
  `;
  });

  router.register('darf', function () {
    return `
    <h2>DARF</h2>
    <p>Gestão de Documentos de Arrecadação de Receitas Federais.</p>
    
    <div class="mb-3">
      <div class="input-group">
        <span class="input-group-text"><i class="fas fa-search"></i></span>
        <input type="text" class="form-control busca-empresa" placeholder="Buscar por nome da empresa ou CNPJ..." id="buscaDarf">
      </div>
      <small class="form-text text-muted" id="contadorEmpresas"></small>
    </div>
    
    <div id="empresasGrid" class="empresas-grid-container">
      <!-- Conteúdo será carregado dinamicamente -->
    </div>
    <div style="text-align:center; margin-top:20px;">
  <button id="btnCadastrar" class="btn btn-primary" 
          style="padding:12px 24px; font-size:16px; border-radius:6px;">
    Baixar Todas
  </button>
</div>
  `;
  });

  router.register('nf55', function () {
    return `
    <h2>Notas sefaz 55</h2>
    <p>Gestão de Notas Fiscais de Serviço Mensais.</p>
    
    <!-- CAMPO DE BUSCA ADICIONADO -->
    <div class="mb-3">
      <div class="input-group">
        <span class="input-group-text"><i class="fas fa-search"></i></span>
        <input type="text" class="form-control busca-empresa" placeholder="Buscar por nome da empresa ou CNPJ..." id="buscaNf55">
      </div>
      <small class="form-text text-muted" id="contadorEmpresas"></small>
    </div>
    
    <div id="empresasGrid" class="empresas-grid-container">
    <!-- Conteúdo será carregado dinamicamente -->
    </div>
    <div style="text-align:center; margin-top:20px;">
  <button id="btnCadastrar" class="btn btn-primary" 
          style="padding:12px 24px; font-size:16px; border-radius:6px;">
    Baixar Todas
  </button>
</div>
  `;
  });


  router.register('nfce', function () {
    return `
    <h2>NFC-e</h2>
    <p>Gestão de Notas Fiscais de Consumidor Eletrônica.</p>
    
    <div class="mb-3">
      <div class="input-group">
        <span class="input-group-text"><i class="fas fa-search"></i></span>
        <input type="text" class="form-control busca-empresa" placeholder="Buscar por nome da empresa ou CNPJ..." id="buscaNfce">
      </div>
      <small class="form-text text-muted" id="contadorEmpresas"></small>
    </div>
    
    <div id="empresasGrid" class="empresas-grid-container">
      <!-- Conteúdo será carregado dinamicamente -->
    </div>
    <div style="text-align:center; margin-top:20px;">
  <button id="btnCadastrar" class="btn btn-primary" 
          style="padding:12px 24px; font-size:16px; border-radius:6px;">
    Baixar Todas
  </button>
</div>
  `;
  });

  router.register('cte', function () {
    return `
    <h2>CTE Emissor</h2>
    <p>Gestão de Conhecimentos de Transporte Eletrônico.</p>
    
    <div class="mb-3">
      <div class="input-group">
        <span class="input-group-text"><i class="fas fa-search"></i></span>
        <input type="text" class="form-control busca-empresa" placeholder="Buscar por nome da empresa ou CNPJ..." id="buscaCte">
      </div>
      <small class="form-text text-muted" id="contadorEmpresas"></small>
    </div>
    
    <div id="empresasGrid" class="empresas-grid-container">
      <!-- Conteúdo será carregado dinamicamente -->
    </div>
    <div style="text-align:center; margin-top:20px;">
  <button id="btnCadastrar" class="btn btn-primary" 
          style="padding:12px 24px; font-size:16px; border-radius:6px;">
    Baixar Todas
  </button>
</div>
  `;
  });

  // Adicione esta rota ao seu app.js, dentro do bloco DOMContentLoaded

router.register('fethab', function () {
  // Retorna o HTML da página FETHAB
  setTimeout(() => {
    // Inicializar as funcionalidades do FETHAB após o DOM ser renderizado
    inicializarFETHAB();
  }, 100);

  return `
    <style>
      :root {
        --primary: #336699;
        --ok: #4CAF50;
        --bg: #e0f7fa;
        --card: #fff;
        --muted: #f8f9fa;
        --border: #ccc;
        --muted2: #f1f8e9;
      }

      .fethab-container {
        font-family: Arial, sans-serif;
        max-width: 900px;
        margin: 0 auto;
        padding: 20px;
        background: var(--bg);
        border-radius: 8px;
      }

      .fethab-card {
        background: var(--card);
        padding: 20px;
        border-radius: 8px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, .1);
      }

      .header-table {
        width: 100%;
        background: var(--primary);
        color: #fff;
        margin-bottom: 20px;
      }

      .header-table td {
        padding: 8px;
        text-align: center;
      }

      .input-mode {
        text-align: center;
        margin: 20px 0;
        padding: 10px 0;
      }

      .input-mode label {
        margin: 0 12px;
        cursor: pointer;
      }

      .main-table {
        width: 100%;
        border-collapse: collapse;
      }

      .main-table td {
        padding: 6px;
        vertical-align: middle;
      }

      .main-table td:first-child {
        text-align: right;
        width: 230px;
        padding-right: 10px;
        font-weight: 700;
      }

      .fethab-input {
        width: 90%;
        padding: 6px;
        border: 1px solid var(--border);
        border-radius: 4px;
      }

      .fethab-input[readonly] {
        background: #f0f0f0;
        cursor: not-allowed;
      }

      .metros-cubicos-input {
        text-align: right;
        font-family: monospace;
      }

      .action-buttons {
        text-align: center;
        margin-top: 18px;
      }

      .btn-main {
        padding: 10px 20px;
        background: var(--ok);
        color: #fff;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        margin: 5px;
      }

      .btn-sec {
        padding: 10px 20px;
        background: #999;
        color: #fff;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        margin: 5px;
      }

      .hidden {
        display: none;
      }

      .drop-zone {
        width: 100%;
        height: 190px;
        border: 2px dashed var(--border);
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        background: var(--muted);
        text-align: center;
        padding: 10px;
      }

      .drop-zone:hover,
      .drop-zone.dragover {
        border-color: var(--ok);
        background: var(--muted2);
      }

      .small {
        font-size: .9rem;
        color: #555;
      }

      .date-input {
        width: 50%;
        padding: 6px;
        border: 1px solid var(--border);
        border-radius: 4px;
        text-align: center;
        font-family: monospace;
        letter-spacing: 1px;
        background-color: #fff;
        color: #333;
      }

      .date-input::-webkit-calendar-picker-indicator {
        cursor: pointer;
        background: url("data:image/svg+xml;utf8,<svg fill='black' xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'><path d='M7 10h5v5H7z' opacity='.3'/><path d='M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.89-1.99 2L3 20c0 1.11.89 2 2 2h14c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 16H5V9h14v11z'/></svg>") no-repeat center;
        opacity: 0.6;
        width: 20px;
        height: 20px;
      }

      .date-input::-webkit-calendar-picker-indicator:hover {
        opacity: 1;
      }
    </style>

    <div class="fethab-container">
      <div class="fethab-card">
        <table class="header-table">
          <tr>
            <td colspan="2">Sistema de Arrecadação</td>
          </tr>
          <tr>
            <td colspan="2">Pessoa Jurídica Inscrita</td>
          </tr>
        </table>

        <div class="input-mode">
          <input type="radio" id="manual-input" name="input-mode" value="manual" checked>
          <label for="manual-input">Informar Manual</label>

          <input type="radio" id="xml-input" name="input-mode" value="xml">
          <label for="xml-input">Inserir XML</label>

          <input type="radio" id="pdf-input" name="input-mode" value="pdf">
          <label for="pdf-input">Inserir PDF</label>
        </div>

        <!-- MANUAL -->
        <div id="manual-section">
          <table class="main-table">
            <tr>
              <td>Período de referência:</td>
              <td><input type="text" class="fethab-input" id="periodo-referencia" placeholder="MM/AAAA"></td>
            </tr>
            <tr>
              <td>Nome da Empresa:</td>
              <td><input type="text" class="fethab-input" id="empresa"></td>
            </tr>
            <tr>
              <td>Número da Nota:</td>
              <td>
                <input type="text" class="fethab-input" id="numero-nota" placeholder="000.000.000" />
              </td>
            </tr>
            <tr>
              <td>Quantidade de Metros Cúbicos:</td>
              <td>
                <input type="text" class="fethab-input metros-cubicos-input" id="metros-cubicos" maxlength="6" placeholder="00,000"
                  oninput="formatarMetrosCubicosFethab(this)" onchange="calcularTributoFethab()">
              </td>
            </tr>
            <tr>
              <td>Data de vencimento:</td>
              <td><input type="date" class="date-input" id="data-vencimento"></td>
            </tr>
            <tr>
              <td>Valor Tributo:</td>
              <td><input type="text" class="fethab-input" id="valor-tributo" readonly></td>
            </tr>
            <tr>
              <td>Informações Previstas em Instruções:</td>
              <td><textarea class="fethab-input info-box" id="info-box"></textarea></td>
            </tr>
          </table>
        </div>

        <!-- XML -->
        <div id="xml-section" class="hidden">
          <div class="drop-zone" id="drop-zone-xml">
            Arraste e solte o XML aqui<br>
            <span class="small">Ou clique para selecionar</span>
          </div>
          <input type="file" id="file-input-xml" accept=".xml" style="display:none">
        </div>

        <!-- PDF -->
        <div id="pdf-section" class="hidden">
          <div class="drop-zone" id="drop-zone-pdf">
            Arraste e solte o PDF da NF-e (DANFE) aqui<br>
            <span class="small">Ou clique para selecionar</span>
          </div>
          <input type="file" id="file-input-pdf" accept=".pdf" style="display:none">
        </div>

        <div class="action-buttons">
          <button class="btn-main" onclick="emitirGuiaFethab()">Emitir</button>
          <button class="btn-sec" onclick="voltarPaginaFethab()">Retornar</button>
        </div>
      </div>
    </div>
  `;
});

// Função para inicializar todas as funcionalidades do FETHAB
function inicializarFETHAB() {
  // Carrega a biblioteca PDF.js
  if (!window.pdfjsLib) {
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.min.js';
    script.onload = function() {
      console.log('PDF.js carregado com sucesso');
    };
    document.head.appendChild(script);
  }

  // Adicionar event listeners para os radio buttons
  const radioButtons = document.querySelectorAll('input[name="input-mode"]');
  radioButtons.forEach(radio => {
    radio.addEventListener('change', function() {
      if (this.checked) {
        toggleFethabMode(this);
      }
    });
  });

  // Inicializar eventos de drag and drop para XML
  const dropXml = document.getElementById('drop-zone-xml');
  const inputXml = document.getElementById('file-input-xml');

  if (dropXml && inputXml) {
    dropXml.addEventListener('click', () => inputXml.click());
    
    ['dragover', 'dragenter'].forEach(ev => {
      dropXml.addEventListener(ev, e => { 
        e.preventDefault(); 
        dropXml.classList.add('dragover');
      });
    });
    
    ['dragleave', 'drop'].forEach(ev => {
      dropXml.addEventListener(ev, e => { 
        e.preventDefault(); 
        dropXml.classList.remove('dragover');
      });
    });
    
    dropXml.addEventListener('drop', e => {
      e.preventDefault();
      const f = e.dataTransfer.files?.[0];
      if (f) processarXMLFethab(f);
    });
    
    inputXml.addEventListener('change', e => { 
      const f = e.target.files?.[0]; 
      if (f) processarXMLFethab(f); 
    });
  }

  // Inicializar eventos de drag and drop para PDF
  const dropPdf = document.getElementById('drop-zone-pdf');
  const inputPdf = document.getElementById('file-input-pdf');

  if (dropPdf && inputPdf) {
    dropPdf.addEventListener('click', () => inputPdf.click());
    
    ['dragover', 'dragenter'].forEach(ev => {
      dropPdf.addEventListener(ev, e => { 
        e.preventDefault(); 
        dropPdf.classList.add('dragover');
      });
    });
    
    ['dragleave', 'drop'].forEach(ev => {
      dropPdf.addEventListener(ev, e => { 
        e.preventDefault(); 
        dropPdf.classList.remove('dragover');
      });
    });
    
    dropPdf.addEventListener('drop', e => {
      e.preventDefault();
      const f = e.dataTransfer.files?.[0];
      if (f) processarPDFFethab(f);
    });
    
    inputPdf.addEventListener('change', e => {
      const f = e.target.files?.[0];
      if (f) processarPDFFethab(f);
    });
  }
}

// Constante do multiplicador
const MULTIPLICADOR_FETHAB = 24.349;

// Funções auxiliares
function goManualReviewFethab() {
  const manualRadio = document.getElementById('manual-input');
  if (manualRadio) {
    manualRadio.checked = true;
    toggleFethabMode(manualRadio);
  }
}

function onlyDigitsFethab(str) { 
  return (str || "").replace(/\D/g, ''); 
}

function formatNFWithDots9Fethab(nfDigits) {
  const d = onlyDigitsFethab(nfDigits).padStart(9, '0').slice(-9);
  return d.replace(/(\d{3})(\d{3})(\d{3})/, '$1.$2.$3');
}

function setInfoBoxFethab(nfRaw) {
  const nfPlain = onlyDigitsFethab(nfRaw);
  const infoBox = document.getElementById('info-box');
  if (infoBox) {
    infoBox.value = `Guia ref. NF-e Nº ${nfPlain}`;
  }
}

// Formatação de campos
function formatarMetrosCubicosFethab(input) {
  let v = (input.value || '').replace(/\D/g, '');
  while (v.length < 5) v = '0' + v;
  v = v.slice(-5);
  input.value = v.slice(0, 2) + ',' + v.slice(2);
  calcularTributoFethab();
}

function formatarMoedaFethab(valor) {
  return `R$ ${valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function validarMetrosCubicosFethab() {
  const metrosCubicos = document.getElementById('metros-cubicos');
  if (!metrosCubicos) return false;
  
  const v = parseFloat((metrosCubicos.value || '').replace(',', '.'));
  if (!v) { 
    alert('Atenção: Metros Cúbicos não informado.'); 
    return false; 
  }
  return true;
}

function calcularTributoFethab() {
  const metrosCubicos = document.getElementById('metros-cubicos');
  const valorTributo = document.getElementById('valor-tributo');
  
  if (!metrosCubicos || !valorTributo) return;
  
  const v = parseFloat((metrosCubicos.value || '').replace(',', '.'));
  valorTributo.value = isNaN(v) ? '' : formatarMoedaFethab(v * MULTIPLICADOR_FETHAB);
}

// Toggle de modo
function toggleFethabMode(radio) {
  const manualSection = document.getElementById('manual-section');
  const xmlSection = document.getElementById('xml-section');
  const pdfSection = document.getElementById('pdf-section');
  
  if (manualSection) manualSection.classList.add('hidden');
  if (xmlSection) xmlSection.classList.add('hidden');
  if (pdfSection) pdfSection.classList.add('hidden');
  
  if (radio.value === 'manual' && manualSection) manualSection.classList.remove('hidden');
  if (radio.value === 'xml' && xmlSection) xmlSection.classList.remove('hidden');
  if (radio.value === 'pdf' && pdfSection) pdfSection.classList.remove('hidden');
}

// Processamento de XML
function processarXMLFethab(file) {
  const reader = new FileReader();
  reader.onload = e => {
    try {
      const xmlDoc = new DOMParser().parseFromString(e.target.result, 'application/xml');
      const ns = "http://www.portalfiscal.inf.br/nfe";

      // Período de referência
      const dhEmi = xmlDoc.getElementsByTagNameNS(ns, "dhEmi")[0] || xmlDoc.getElementsByTagNameNS(ns, "dEmi")[0];
      if (dhEmi) {
        const d = new Date(dhEmi.textContent);
        const periodoRef = document.getElementById('periodo-referencia');
        if (periodoRef) {
          periodoRef.value = `${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
        }
      }

      // Nome da empresa
      const emit = xmlDoc.getElementsByTagNameNS(ns, "emit")[0];
      const xNome = emit ? emit.getElementsByTagNameNS(ns, "xNome")[0]?.textContent : '';
      if (xNome) {
        const empresa = document.getElementById('empresa');
        if (empresa) empresa.value = xNome;
      }

      // Número da nota
      const nNF = xmlDoc.getElementsByTagNameNS(ns, "nNF")[0]?.textContent;
      if (nNF) {
        const nfDisplay = formatNFWithDots9Fethab(nNF);
        const numeroNota = document.getElementById('numero-nota');
        if (numeroNota) numeroNota.value = nfDisplay;
        setInfoBoxFethab(nNF);
      }

      // Quantidade (metros cúbicos)
      let soma = 0;
      const qCom = xmlDoc.getElementsByTagNameNS(ns, "qCom");
      for (let i = 0; i < qCom.length; i++) {
        soma += parseFloat(qCom[i].textContent || '0');
      }
      
      if (soma > 0) {
        const compact = soma.toFixed(4).replace('.', '');
        const five = compact.slice(0, 5);
        const metrosCubicos = document.getElementById('metros-cubicos');
        if (metrosCubicos) {
          metrosCubicos.value = five.slice(0, 2) + ',' + five.slice(2);
          calcularTributoFethab();
        }
      }

      goManualReviewFethab();
    } catch (error) {
      console.error('Erro ao processar XML:', error);
      alert('Erro ao processar o arquivo XML');
    }
  };
  reader.readAsText(file);
}

// Processamento de PDF
async function processarPDFFethab(file) {
  const reader = new FileReader();
  reader.onload = async function () {
    try {
      if (!window.pdfjsLib) {
        alert('Biblioteca PDF.js não carregada. Tente novamente em alguns segundos.');
        return;
      }

      const pdf = await pdfjsLib.getDocument(new Uint8Array(this.result)).promise;
      let text = "";
      
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        text += content.items.map(it => it.str).join(" ") + "\n";
      }

      // Extrair nome da empresa
      const empresaMatch = text.match(/RECEBEMOS DE\s+(.+?)\s+OS PRODUTOS/i);
      if (empresaMatch) {
        const empresa = document.getElementById('empresa');
        if (empresa) empresa.value = empresaMatch[1].trim();
      }

      // Extrair número da nota
      const nfFullMatch = text.match(/N[ºo]\.\s*([0-9.\s]{5,}?)\s+S[ée]rie/i);
      if (nfFullMatch) {
        let nfFull = nfFullMatch[1].replace(/\s+/g, '').trim();
        if (!nfFull.includes('.')) nfFull = formatNFWithDots9Fethab(nfFull);
        const numeroNota = document.getElementById('numero-nota');
        if (numeroNota) numeroNota.value = nfFull;
        setInfoBoxFethab(nfFull);
      }

      // Extrair data de emissão
      const dataMatch = text.match(/DATA DA EMISS[ãÃ]O\s+(\d{2})\/(\d{2})\/(\d{4})/i);
      if (dataMatch) {
        const periodoRef = document.getElementById('periodo-referencia');
        if (periodoRef) periodoRef.value = `${dataMatch[2]}/${dataMatch[3]}`;
      }

      // Extrair quantidade
      const qtdMatch = text.match(/QUANTIDADE\s+([0-9]{5})/i);
      if (qtdMatch) {
        const raw = qtdMatch[1];
        const metrosCubicos = document.getElementById('metros-cubicos');
        if (metrosCubicos) {
          metrosCubicos.value = raw.slice(0, 2) + ',' + raw.slice(2);
          calcularTributoFethab();
        }
      }

      goManualReviewFethab();
    } catch (error) {
      console.error('Erro ao processar PDF:', error);
      alert('Erro ao processar o arquivo PDF');
    }
  };
  reader.readAsArrayBuffer(file);
}

// Ações principais
function emitirGuiaFethab() {
  if (!validarMetrosCubicosFethab()) return;
  
  const empresa = document.getElementById('empresa')?.value || '';
  const nf = document.getElementById('numero-nota')?.value || '';
  const periodo = document.getElementById('periodo-referencia')?.value || '';
  const mc = document.getElementById('metros-cubicos')?.value || '';
  const valor = document.getElementById('valor-tributo')?.value || '';
  const info = document.getElementById('info-box')?.value || '';
  
  const confirmMessage = `Confirmar emissão?\n\nEmpresa: ${empresa}\nNF: ${nf}\nPeríodo: ${periodo}\nM³: ${mc}\nValor: ${valor}\nInfo: ${info}`;
  
  if (confirm(confirmMessage)) {
    alert('Guia emitida com sucesso!');
  }
}

function voltarPaginaFethab() { 
  router.navigate('dashboard');
}
  /* // Rota para ecacPJPF
   router.register('ecacPJPF', function () {
     return `
       <h2>Certidão ecac PF e PJ</h2>
       <p>Gestão de Conhecimentos de Transporte Eletrônico</p>
       <!-- Conteúdo para ecacPJPF -->
     `;
   });
 
   // Rota para Municipal
   router.register('Municipal', function () {
     return `
       <h2>Certidão Municipal</h2>
       <p>Gestão de Conhecimentos de Transporte Eletrônico</p>
       <!-- Conteúdo para Municipal -->
     `;
   });
 
   // Rota para Sefaz
   router.register('Sefaz', function () {
     return `
       <h2>Certidão Sefaz</h2>
       <p>Gestão de Conhecimentos de Transporte Eletrônico</p>
       <!-- Conteúdo para Sefaz -->
     `;
   });
 
   // Rota para FGTS
   router.register('FGTS', function () {
     return `
       <h2>Certidão FGTS</h2>
       <p>Gestão de Conhecimentos de Transporte Eletrônico</p>
       <!-- Conteúdo para FGTS -->
     `;
   });*/
  function criarLayoutCertidao(titulo, tipo) {
    return `
    <h2>${titulo}</h2>
    <p>Emissão e consulta de certidões de regularidade fiscal.</p>

    <div class="card mb-4">
      <div class="card-body">
        <h5 class="card-title">Consultar Nova Certidão</h5>
        <div class="input-group">
          <input type="text" class="form-control" placeholder="Digite o CNPJ ou CPF para a consulta" id="inputConsulta${tipo}">
          <button class="btn btn-primary" type="button" id="btnConsultar${tipo}">
            <i class="fas fa-search me-2"></i>Consultar
          </button>
        </div>
      </div>
    </div>

    <h3 class="mt-4">Histórico de Emissões</h3>
    <div class="table-responsive">
      <table class="table table-striped table-hover">
<thead class="table-dark">
    <tr>
        <th scope="col">NOME</th>
        <th scope="col" style="width: 20%;">CNPJ</th>
        <th scope="col" style="width: 15%;">I.E.</th>
        <th scope="col" style="width: 10%;">STATUS</th>
        <th scope="col" style="width: 12%; text-align: right;">AÇÕES</th>
    </tr>
</thead>

        <tbody id="tabelaHistorico${tipo}">
          <!-- Exemplo de linha -->
          <tr>
            <td>EMPRESA EXEMPLO LTDA</td>
            <td>10/09/2025</td>
            <td>09/12/2025</td>
            <td><button class="btn btn-sm btn-info"><i class="fas fa-download"></i> Baixar</button></td>
          </tr>
          <tr>
            <td>OUTRA EMPRESA S/A</td>
            <td>01/09/2025</td>
            <td>30/11/2025</td>
            <td><button class="btn btn-sm btn-info"><i class="fas fa-download"></i> Baixar</button></td>
          </tr>
        </tbody>
      </table>
    </div>
  `;
  }

  router.register('ecacPJPF', () => criarLayoutCertidao('Certidão da Receita Federal (ECAC)', 'Ecac'));
  router.register('Municipal', () => criarLayoutCertidao('Certidão Municipal', 'Municipal'));
  router.register('Sefaz', () => criarLayoutCertidao('Certidão da SEFAZ', 'Sefaz'));
  router.register('FGTS', () => criarLayoutCertidao('Certidão de Regularidade do FGTS', 'Fgts'));


  router.register('cadastroEMp', function () {
    setTimeout(() => {
      const btnCadastrar = document.getElementById("btnCadastrar");
      if (btnCadastrar) {
        btnCadastrar.addEventListener("click", function () {
          let modalElement = document.getElementById("importModal");
          if (modalElement) {
            let modalInstance = bootstrap.Modal.getInstance(modalElement);
            if (!modalInstance) {
              modalInstance = new bootstrap.Modal(modalElement);
            }
            modalInstance.show();
          }
        });
      }

      // Carregar empresas na tabela após renderizar
      carregarEmpresasTabela();
    }, 100);

    return `
    <h2>Cadastro de Empresas</h2>
    <p>Gerenciamento de empresas do sistema.</p>

    <button id="btnCadastrar" class="btn btn-primary mb-4">
        <i class="fa-solid fa-plus"></i> Cadastrar Empresas
    </button>

    <div class="card">
      <div class="card-header d-flex justify-content-between align-items-center">
        <h5 class="mb-0">Empresas Cadastradas</h5>
        <div class="text-muted">
            Total: <span id="totalEmpresas">0</span> empresas
        </div>
      </div>
      <div class="card-body">
        <div class="d-flex justify-content-start align-items-center mb-3">
            <label for="ordenacaoSelect" class="form-label mb-0 me-2">Ordenar por:</label>
            <select id="ordenacaoSelect" class="form-select" style="width: auto;">
                <option value="nome-asc">Nome (A-Z)</option>
                <option value="nome-desc">Nome (Z-A)</option>
                <option value="cnpj-asc">CNPJ (Crescente)</option>
                <option value="cnpj-desc">CNPJ (Decrescente)</option>
            </select>
        </div>

        <div class="table-responsive">
            <table class="table table-striped table-hover">
                <thead class="table-dark">
                    <tr>
                        <th scope="col" style="width: 45%;">NOME</th>
                        <th scope="col" style="width: 25%;">CNPJ</th>
                        <th scope="col" style="width: 15%;">STATUS</th>
                        <th scope="col" style="width: 15%;">AÇÕES</th>
                    </tr>
                </thead>
                <tbody id="tabelaEmpresasBody">
                    <!-- Conteúdo será carregado dinamicamente -->
                </tbody>
            </table>
        </div>
      </div>
    </div>
  `;
  });
  // Inicializa o router
  router.init();

  // Adiciona os event listeners aos itens do menu
  setupMenuListeners();

  // Adicionar listener para carregar dados quando o conteúdo muda
  document.addEventListener('contentLoaded', function (e) {
    const route = e.detail.route;

    // Verifica qual rota foi carregada e executa ações específicas
    if (route === 'empresas-cadastro' ||
      document.getElementById('empresasGrid')) {
      carregarEmpresas();
    }

    // Aqui você pode adicionar mais lógica dependendo da rota carregada
  });
});

// Configuração dos event listeners do menu
function setupMenuListeners() {
  // Seleciona todos os links de submenu
  document.querySelectorAll('.submenu a').forEach(link => {
    link.addEventListener('click', function (e) {
      e.preventDefault();

      // Obtém o hash do link ou usa o atributo data se disponível
      const route = this.getAttribute('data-route') || this.getAttribute('href').replace('#', '');

      if (route) {
        router.navigate(route);
      }
    });
    document.addEventListener('input', function (e) {
      if (e.target.classList.contains('busca-empresa')) {
        const termoBusca = e.target.value;
        const route = window.location.hash.substring(1) || 'dashboard';

        // Executar busca baseada na rota atual
        if (document.getElementById('empresasGrid')) {
          executarBuscaEmpresas(termoBusca);
        }
      }
    });
  });

  // Event listener específico para o botão Cadastrar em Configurações
  const btnCadastrar = document.getElementById('btnCadastrar');
  if (btnCadastrar) {
    btnCadastrar.addEventListener('click', function (e) {
      e.preventDefault();
      router.navigate('empresas-cadastro');
    });
  }

  // Event listener para o botão Buscar
  const btnBuscar = document.getElementById('btnBuscar');
  if (btnBuscar) {
    btnBuscar.addEventListener('click', function (e) {
      e.preventDefault();
      // Você pode adicionar uma rota específica para busca ou usar uma existente
      router.navigate('dashboard');
    });
  }

  // Event listener para logout
  const btnLogout = document.getElementById('btnLogout');
  if (btnLogout) {
    btnLogout.addEventListener('click', function (e) {
      e.preventDefault();
      // Lógica de logout do Firebase
      firebase.auth().signOut().then(() => {
        // Redireciona para a página de login após logout
        window.location.href = 'index.html';
      }).catch((error) => {
        console.error("Erro ao fazer logout:", error);
      });
    });
  }
}
/**
 * Renderiza os cards de empresa no grid.
 * Esta versão usa um botão de execução simples, que aciona a automação
 * baseada na preferência global do usuário (CNPJ, IE ou CPF) definida nas configurações.
 *
 * @param {Array} empresas - A lista de objetos de empresa a ser renderizada.
 */
function renderizarEmpresas(empresas) {
  const grid = document.getElementById('empresasGrid');
  if (!grid) {
    console.error('Elemento com ID "empresasGrid" não foi encontrado no DOM.');
    return;
  }

  // Limpa o conteúdo anterior do grid
  grid.innerHTML = '';

  // Verifica se a lista de empresas está vazia ou é inválida
  if (!empresas || empresas.length === 0) {
    grid.innerHTML = '<p class="text-center text-muted mt-3">Nenhuma empresa encontrada ou cadastrada.</p>';
    return;
  }

  // Itera sobre cada empresa para criar seu card correspondente
  empresas.forEach((empresa) => {
    const row = document.createElement('tr');
    const statusAtivo = empresa.status !== 'inativa'; // Assume 'ativa' como padrão

    row.innerHTML = `
            <td>${empresa.nome || 'N/A'}</td>
            <td>${empresa.cnpjFormatado || empresa.cnpj || 'N/A'}</td>
            <td>
                <span class="badge ${statusAtivo ? 'bg-success' : 'bg-danger'}">
                    ${statusAtivo ? 'Ativa' : 'Inativa'}
                </span>
            </td>
            <td>
                <button class="btn btn-sm btn-outline-primary" 
                        onclick="editarEmpresa('${empresa.id}')"
                        title="Editar empresa">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-outline-warning" 
                        onclick="desativarEmpresa('${empresa.id}', '${empresa.nome}')"
                        title="Desativar empresa">
                    <i class="fas fa-toggle-off"></i>
                </button>
                <button class="btn btn-sm btn-outline-danger" 
                        onclick="excluirEmpresaConfirmacao('${empresa.id}', '${empresa.nome}')"
                        title="Excluir empresa">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
    tabelaBody.appendChild(row);
  });
}

/**
 * Ponto de entrada para iniciar uma automação a partir da interface.
 *
 * 1. Determina qual automação deve ser executada com base na seção atual (ex: SEFAZ_NF55).
 * 2. Lê a preferência de consulta do usuário (CNPJ, IE, ou CPF) salva nas configurações.
 * 3. Seleciona o dado correto da empresa (CNPJ, IE ou CPF) com base nessa preferência.
 * 4. Valida se o dado necessário para a consulta existe.
 * 5. Busca as credenciais de automação do usuário.
 * 6. Envia uma requisição para o endpoint do backend com o 'valorConsulta' a ser processado.
 * 7. Exibe notificações de sucesso ou erro com base na resposta do servidor.
 *
 * @param {string} cnpj - O CNPJ da empresa.
 * @param {string} nomeEmpresa - O nome da empresa.
 * @param {string} ie - A Inscrição Estadual da empresa.
 * @param {string} cpf - O CPF associado (para futuras implementações).
 */
function executarAutomacao(cnpj, nomeEmpresa, ie, cpf) {
  // 1. Identifica o tipo de automação a ser executada (ex: 'SEFAZ_NF55')
  const tipoAutomacao = obterTipoAutomacao();
  if (!tipoAutomacao) {
    exibirAlerta('⚠️ Nenhuma automação disponível para esta seção.', 'info');
    return;
  }

  // 2. Lê a preferência de consulta do usuário (armazenada no localStorage ao salvar as configs)
  // O valor padrão é 'CNPJ' se nenhuma preferência for encontrada.
  const preferencia = localStorage.getItem('configPreferenciaSefaz') || 'CNPJ';

  // 3. Seleciona o valor correto para a consulta com base na preferência
  let valorParaConsulta;
  switch (preferencia) {
    case 'IE':
      valorParaConsulta = ie;
      break;
    case 'CPF':
      valorParaConsulta = cpf;
      break;
    case 'CNPJ':
    default:
      valorParaConsulta = cnpj;
      break;
  }

  // 4. Valida se o valor para a consulta é válido
  if (!valorParaConsulta || valorParaConsulta.trim() === '' || valorParaConsulta.toLowerCase() === 'isento') {
    exibirAlerta(`❌ A empresa não possui um ${preferencia} válido para a consulta. Verifique o cadastro da empresa ou altere sua preferência nas configurações.`, 'erro');
    return;
  }

  console.log(`Iniciando automação '${tipoAutomacao}' para '${nomeEmpresa}' usando a preferência: ${preferencia} com o valor: ${valorParaConsulta}`);
  exibirAlerta(`🚀 Iniciando: ${tipoAutomacao} para ${nomeEmpresa}...`, 'info');

  // 5. Busca as credenciais e, em seguida, chama o backend
  buscarCredenciaisParaAutomacao()
    .then(credenciais => {
      // Determina o endpoint correto com base no tipo de automação
      let endpoint;
      if (tipoAutomacao.startsWith('PREFEITURA')) {
        endpoint = 'http://localhost:3000/api/execute-automation-prefeitura';
      } else if (tipoAutomacao.startsWith('SEFAZ')) {
        endpoint = 'http://localhost:3000/api/execute-automation-sefaz';
      } else if (tipoAutomacao.startsWith('CERTIDAO')) {
        endpoint = 'http://localhost:3000/api/execute-automation-certidoes';
      } else {
        // Rejeita a promessa se o tipo não for suportado
        return Promise.reject(new Error('Tipo de automação não suportado!'));
      }

      // 6. Envia a requisição para o backend
      return fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          valorConsulta: valorParaConsulta, // <-- O parâmetro único e inteligente
          nomeEmpresa: nomeEmpresa,
          tipoAutomacao: tipoAutomacao,
          credenciais: credenciais
        })
      });
    })
    .then(response => {
      // Trata respostas que não são 'OK' (ex: 404, 500)
      if (!response.ok) {
        // Tenta extrair uma mensagem de erro do corpo da resposta
        return response.json().then(err => {
          throw new Error(err.message || `Erro do Servidor: ${response.statusText}`);
        });
      }
      return response.json();
    })
    .then(data => {
      // 7. Exibe o resultado da automação para o usuário
      console.log('Resposta do servidor:', data);
      const tipoNotificacao = data.success ? 'sucesso' : 'erro';
      exibirAlerta(data.message, tipoNotificacao);
    })
    .catch(error => {
      // Captura qualquer erro que ocorra durante o processo (falha de rede, erro de lógica, etc.)
      console.error('❌ Erro crítico na execução da automação:', error);
      exibirAlerta(`❌ Erro na automação: ${error.message}`, 'erro');
    });
}


function executarBuscaEmpresas(termoBusca) {
  const user = firebase.auth().currentUser;
  if (!user) return;

  const empresasDoUsuarioRef = db.collection('usuarios').doc(user.uid).collection('empresas');

  empresasDoUsuarioRef.get()
    .then((snapshot) => {
      const todasEmpresas = [];
      snapshot.forEach((doc) => {
        todasEmpresas.push(doc.data());
      });

      const empresasFiltradas = filtrarEmpresas(todasEmpresas, termoBusca);
      renderizarEmpresas(empresasFiltradas);

      // Atualizar contador se existir
      const contador = document.getElementById('contadorEmpresas');
      if (contador) {
        contador.textContent = `${empresasFiltradas.length} empresa(s) encontrada(s)`;
      }
    })
    .catch((error) => {
      console.error("Erro ao buscar empresas:", error);
    });
}

// Funções para carregar dados do Firestore
function carregarEmpresas() {
  const empresasGrid = document.getElementById('empresasGrid');
  if (!empresasGrid) return;

  // Limpa o grid
  empresasGrid.innerHTML = '<p>Carregando empresas...</p>';

  // Busca empresas no Firestore
  db.collection('empresas').get()
    .then((querySnapshot) => {
      if (querySnapshot.empty) {
        empresasGrid.innerHTML = '<p>Nenhuma empresa cadastrada.</p>';
        return;
      }

      // Cria a tabela
      let tableHTML = `
        <table class="table table-striped">
          <thead>
            <tr>
              <th>CNPJ</th>
              <th>Razão Social</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
      `;

      // Adiciona as empresas
      querySnapshot.forEach((doc) => {
        const empresa = doc.data();
        tableHTML += `
          <tr>
            <td>${empresa.cnpj}</td>
            <td>${empresa.razaoSocial}</td>
            <td>
              <button class="btn btn-sm btn-primary editar-empresa" data-id="${doc.id}">
                <i class="fas fa-edit"></i>
              </button>
              <button class="btn btn-sm btn-danger excluir-empresa" data-id="${doc.id}">
                <i class="fas fa-trash"></i>
              </button>
            </td>
          </tr>
        `;
      });

      tableHTML += `
          </tbody>
        </table>
      `;

      empresasGrid.innerHTML = tableHTML;

      // Adiciona event listeners para os botões de ação
      document.querySelectorAll('.editar-empresa').forEach(btn => {
        btn.addEventListener('click', function () {
          const id = this.getAttribute('data-id');
          editarEmpresa(id);
        });
      });

      document.querySelectorAll('.excluir-empresa').forEach(btn => {
        btn.addEventListener('click', function () {
          const id = this.getAttribute('data-id');
          excluirEmpresa(id);
        });
      });
    })
    .catch((error) => {
      console.error("Erro ao carregar empresas:", error);
      empresasGrid.innerHTML = '<p>Erro ao carregar empresas.</p>';
    });
}

// Função para abrir o modal de edição
function editarEmpresa(empresaId) {
  const user = firebase.auth().currentUser;
  if (!user) return;

  const empresaRef = db.collection('usuarios').doc(user.uid).collection('empresas').doc(empresaId);

  empresaRef.get().then(doc => {
    if (doc.exists) {
      const empresa = doc.data();

      // Preenche o modal com os dados da empresa
      document.getElementById('editEmpresaId').value = doc.id;
      document.getElementById('editNome').value = empresa.nome;
      document.getElementById('editCnpj').value = empresa.cnpjFormatado || empresa.cnpj;
      document.getElementById('editIE').value = empresa.ie || '';

      // Preenche o novo campo de status
      document.getElementById('editStatus').value = empresa.status || 'ativa'; // 'ativa' como padrão

      // Abrir o modal
      const modal = new bootstrap.Modal(document.getElementById('editarEmpresaModal'));
      modal.show();
    }
  });
}
// Listener para o botão de salvar edição
document.getElementById('salvarEdicaoBtn').addEventListener('click', async function () {
  const user = firebase.auth().currentUser;
  if (!user) {
    exibirAlerta('Faça login para editar empresas', 'erro');
    return;
  }

  const empresaId = document.getElementById('editEmpresaId').value;
  const novoNome = document.getElementById('editNome').value.trim();
  const novaIE = document.getElementById('editIE').value.trim();
  const novoStatus = document.getElementById('editStatus').value; // Pega o valor do novo campo

  if (!novoNome) {
    exibirAlerta('Nome da empresa é obrigatório', 'erro');
    return;
  }

  try {
    const empresaRef = db.collection('usuarios').doc(user.uid).collection('empresas').doc(empresaId);

    await empresaRef.update({
      nome: novoNome,
      ie: novaIE,
      status: novoStatus, // Salva o novo status no banco de dados
      dataAtualizacao: firebase.firestore.FieldValue.serverTimestamp()
    });

    exibirAlerta('Empresa atualizada com sucesso!', 'sucesso');
    const modal = bootstrap.Modal.getInstance(document.getElementById('editarEmpresaModal'));
    modal.hide();

    // Recarrega as listas para refletir a mudança
    carregarEmpresasTabela();
    carregarEmpresasDoUsuario(); // Para atualizar o grid principal
    atualizarContadorDashboard(); // Para atualizar o dashboard

  } catch (error) {
    console.error('Erro ao atualizar empresa:', error);
    exibirAlerta('Erro ao atualizar empresa: ' + error.message, 'erro');
  }
});

/**
 * Retorna o número total de empresas ativas do usuário.
 * @returns {Promise<number>} O número de empresas ativas.
 */
async function getTotalEmpresasAtivas() {
  const user = firebase.auth().currentUser;
  if (!user) return 0; // Se não houver usuário, retorna 0

  try {
    // Consulta que conta apenas os documentos onde o status NÃO é 'inativa'
    const snapshot = await db.collection('usuarios').doc(user.uid).collection('empresas')
      .where('status', '!=', 'inativa')
      .get();

    return snapshot.size; // .size é a forma mais eficiente de contar os resultados

  } catch (error) {
    console.error("Erro ao obter total de empresas ativas:", error);
    return 0; // Retorna 0 em caso de erro
  }
}


// Função para excluir empresa
function excluirEmpresa(id) {
  Swal.fire({
    title: 'Confirmar exclusão',
    text: "Esta ação não pode ser revertida!",
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#d33',
    cancelButtonColor: '#3085d6',
    confirmButtonText: 'Sim, excluir!',
    cancelButtonText: 'Cancelar'
  }).then((result) => {
    if (result.isConfirmed) {
      db.collection('empresas').doc(id).delete()
        .then(() => {
          Swal.fire(
            'Excluído!',
            'A empresa foi excluída com sucesso.',
            'success'
          );
          carregarEmpresas(); // Recarrega a lista
        })
        .catch((error) => {
          console.error("Erro ao excluir:", error);
          Swal.fire(
            'Erro!',
            'Ocorreu um erro ao excluir a empresa.',
            'error'
          );
        });
    }
  });
}

// Adicione essas funções ao seu app.js

/**
 * Determina o tipo de automação baseado na rota atual
 * @returns {string|null} O tipo de automação ou null se não identificado
 */
function obterTipoAutomacao() {
  const route = window.location.hash.substring(1) || 'dashboard';

  const mapeamentoAutomacoes = {
    'nfse-mensal': 'PREFEITURA_MENSAL',
    'nfse-anual': 'PREFEITURA_ANUAL',
    'darf': 'PREFEITURA_DARF',
    'nf55': 'SEFAZ_NF55',
    'nfce': 'SEFAZ_NFCE',
    'cte': 'SEFAZ_CTE',
    'ecacPJPF': 'CERTIDAO_ECAC',
    'Municipal': 'CERTIDAO_MUNICIPAL',
    'Sefaz': 'CERTIDAO_SEFAZ',
    'FGTS': 'CERTIDAO_FGTS'
  };

  return mapeamentoAutomacoes[route] || null;
}

/**
 * Busca as credenciais necessárias para automação
 * @returns {Promise<object>} Objeto com as credenciais
 */
async function buscarCredenciaisParaAutomacao() {
  return new Promise((resolve, reject) => {
    const user = firebase.auth().currentUser;
    if (!user) {
      reject(new Error('Usuário não autenticado'));
      return;
    }

    // Buscar credenciais do Firestore
    db.collection('usuarios').doc(user.uid).get()
      .then((doc) => {
        if (doc.exists) {
          const userData = doc.data();
          const credenciais = {
            sefaz: userData.credenciais?.sefaz || {},
            prefeitura: userData.credenciais?.prefeitura || {},
            certificadoDigital: userData.credenciais?.certificadoDigital || {}
          };
          resolve(credenciais);
        } else {
          reject(new Error('Credenciais do usuário não encontradas'));
        }
      })
      .catch((error) => {
        console.error('Erro ao buscar credenciais:', error);
        reject(error);
      });
  });
}

/**
 * Exibe alertas/notificações para o usuário
 * @param {string} mensagem - A mensagem a ser exibida
 * @param {string} tipo - Tipo do alerta ('sucesso', 'erro', 'info', 'aviso')
 */
function exibirAlerta(mensagem, tipo = 'info') {
  // Se SweetAlert2 estiver disponível
  if (typeof Swal !== 'undefined') {
    const icones = {
      'sucesso': 'success',
      'erro': 'error',
      'info': 'info',
      'aviso': 'warning'
    };

    const titulos = {
      'sucesso': 'Sucesso!',
      'erro': 'Erro!',
      'info': 'Informação',
      'aviso': 'Atenção!'
    };

    Swal.fire({
      title: titulos[tipo] || 'Notificação',
      text: mensagem,
      icon: icones[tipo] || 'info',
      timer: tipo === 'sucesso' ? 3000 : 5000,
      timerProgressBar: true,
      showConfirmButton: tipo === 'erro'
    });
  } else {
    // Fallback para alert padrão
    alert(`${tipo.toUpperCase()}: ${mensagem}`);
  }
}

/**
 * Carrega empresas do usuário autenticado do Firestore
 */
function carregarEmpresasDoUsuario() {
  const user = firebase.auth().currentUser;
  if (!user) {
    console.error('Usuário não autenticado');
    return;
  }

  const empresasGrid = document.getElementById('empresasGrid');
  if (!empresasGrid) {
    console.error('Elemento empresasGrid não encontrado');
    return;
  }

  // Mostrar loading
  empresasGrid.innerHTML = '<div class="text-center"><div class="spinner-border" role="status"><span class="sr-only">Carregando...</span></div></div>';

  // Buscar empresas na subcoleção do usuário
  const empresasRef = db.collection('usuarios').doc(user.uid).collection('empresas');

  empresasRef.get()
    .then((snapshot) => {
      const empresas = [];
      snapshot.forEach((doc) => {
        const dadosEmpresa = doc.data();
        dadosEmpresa.id = doc.id; // Adiciona o ID do documento
        empresas.push(dadosEmpresa);
      });

      // Renderizar empresas
      renderizarEmpresas(empresas);

      // Atualizar contador se existir
      const contador = document.getElementById('contadorEmpresas');
      if (contador) {
        contador.textContent = `${empresas.length} empresa(s) encontrada(s)`;
      }
    })
    .catch((error) => {
      console.error('Erro ao carregar empresas:', error);
      empresasGrid.innerHTML = '<div class="alert alert-danger">Erro ao carregar empresas. Tente novamente.</div>';
    });
}

/**
 * Carrega empresas para a tabela de cadastro
 */
/**
 * Carrega as empresas do usuário, exibe na tabela de cadastro e atualiza o contador total.
 */
function carregarEmpresasTabela() {
  const user = firebase.auth().currentUser;
  if (!user) return;

  const tabelaBody = document.getElementById('tabelaEmpresasBody');
  const totalEmpresasEl = document.getElementById('totalEmpresas'); // Elemento do contador

  if (!tabelaBody) return;

  // Animação de carregamento
  tabelaBody.innerHTML = `
        <tr>
            <td colspan="5" class="text-center text-muted">
                <div class="spinner-border spinner-border-sm me-2" role="status"></div>
                Carregando empresas...
            </td>
        </tr>
    `;

  const empresasRef = db.collection('usuarios').doc(user.uid).collection('empresas');

  empresasRef.orderBy('nome').get()
    .then((snapshot) => {
      if (snapshot.empty) {
        tabelaBody.innerHTML = `
                    <tr>
                        <td colspan="5" class="text-center text-muted">
                            Nenhuma empresa cadastrada.
                        </td>
                    </tr>
                `;
        if (totalEmpresasEl) totalEmpresasEl.textContent = '0';
        return;
      }

      let empresasArray = [];
      snapshot.forEach((doc) => {
        const empresa = doc.data();
        empresa.id = doc.id; // Adiciona o ID do documento para as ações
        empresasArray.push(empresa);
      });

      // Chama a função separada para renderizar a tabela
      renderizarTabelaEmpresas(empresasArray);

      // Atualiza o contador com o número TOTAL de empresas
      if (totalEmpresasEl) {
        totalEmpresasEl.textContent = empresasArray.length;
      }
    })
    .catch((error) => {
      console.error('Erro ao carregar empresas para a tabela:', error);
      tabelaBody.innerHTML = `
                <tr>
                    <td colspan="5" class="text-center text-danger">
                        Erro ao carregar empresas.
                    </td>
                </tr>
            `;
    });
}

/**
 * Renderiza as linhas da tabela de empresas com as colunas e layout corretos.
 * @param {Array} empresas - A lista de empresas a ser exibida.
 */
function renderizarTabelaEmpresas(empresas) {
  const tabelaBody = document.getElementById('tabelaEmpresasBody');
  if (!tabelaBody) return;

  tabelaBody.innerHTML = ''; // Limpa a tabela

  empresas.forEach((empresa) => {
    const row = document.createElement('tr');
    const statusAtivo = empresa.status !== 'inativa'; // Verifica se a empresa está ativa

    row.innerHTML = `
            <td class="truncate-text" title="${empresa.nome || ''}">${empresa.nome || 'N/A'}</td>
            <td>${empresa.cnpjFormatado || empresa.cnpj || 'N/A'}</td>
            <td>
                <span class="badge ${statusAtivo ? 'bg-success' : 'bg-secondary'}">
                    ${statusAtivo ? 'Ativa' : 'Inativa'}
                </span>
            </td>
            <td>
                <button class="btn btn-sm btn-outline-primary" 
                        onclick="editarEmpresa('${empresa.id}')"
                        title="Editar empresa">
                    <i class="fas fa-edit"></i>
                </button>
            </td>
        `;
    tabelaBody.appendChild(row);
  });
}

// Também vou corrigir a função editarEmpresa para garantir que carregue o status corretamente
function editarEmpresa(empresaId) {
  const user = firebase.auth().currentUser;
  if (!user) return;

  const empresaRef = db.collection('usuarios').doc(user.uid).collection('empresas').doc(empresaId);

  empresaRef.get().then(doc => {
    if (doc.exists) {
      const empresa = doc.data();

      // Preenche o modal com os dados da empresa
      document.getElementById('editEmpresaId').value = doc.id;
      document.getElementById('editNome').value = empresa.nome || '';
      document.getElementById('editCnpj').value = empresa.cnpjFormatado || empresa.cnpj || '';
      document.getElementById('editIE').value = empresa.ie || '';

      // Preenche o campo de status - importante para mostrar o status atual
      document.getElementById('editStatus').value = empresa.status || 'ativa';

      // Abrir o modal
      const modal = new bootstrap.Modal(document.getElementById('editarEmpresaModal'));
      modal.show();
    }
  }).catch(error => {
    console.error('Erro ao carregar dados da empresa:', error);
    exibirAlerta('Erro ao carregar dados da empresa', 'erro');
  });
}

// Listener para o botão de salvar edição (mantendo a funcionalidade existente)
document.getElementById('salvarEdicaoBtn').addEventListener('click', async function () {
  const user = firebase.auth().currentUser;
  if (!user) {
    exibirAlerta('Faça login para editar empresas', 'erro');
    return;
  }

  const empresaId = document.getElementById('editEmpresaId').value;
  const novoNome = document.getElementById('editNome').value.trim();
  const novaIE = document.getElementById('editIE').value.trim();
  const novoStatus = document.getElementById('editStatus').value;

  if (!novoNome) {
    exibirAlerta('Nome da empresa é obrigatório', 'erro');
    return;
  }

  try {
    const empresaRef = db.collection('usuarios').doc(user.uid).collection('empresas').doc(empresaId);

    await empresaRef.update({
      nome: novoNome,
      ie: novaIE,
      status: novoStatus,
      dataAtualizacao: firebase.firestore.FieldValue.serverTimestamp()
    });

    exibirAlerta('Empresa atualizada com sucesso!', 'sucesso');
    const modal = bootstrap.Modal.getInstance(document.getElementById('editarEmpresaModal'));
    modal.hide();

    // Recarrega as listas para refletir as mudanças
    carregarEmpresasTabela();

    // Se estiver em uma rota que mostra empresas no grid, também recarrega
    const rotasQueCarregamEmpresas = ['nfse-mensal', 'nfse-anual', 'nf55', 'nfce', 'cte', 'ecacPJPF', 'Municipal', 'Sefaz', 'FGTS'];
    const routeAtual = window.location.hash.substring(1) || 'dashboard';

    if (rotasQueCarregamEmpresas.includes(routeAtual)) {
      carregarEmpresasDoUsuario();
    }

    // Atualiza o contador do dashboard se necessário
    atualizarContadorDashboard();

  } catch (error) {
    console.error('Erro ao atualizar empresa:', error);
    exibirAlerta('Erro ao atualizar empresa: ' + error.message, 'erro');
  }
});

// Função auxiliar para atualizar contador do dashboard
function atualizarContadorDashboard() {
  const contadorElemento = document.getElementById('total-empresas-ativas');
  if (contadorElemento) {
    getTotalEmpresasAtivas().then(total => {
      contadorElemento.textContent = total;
    });
  }
}



/**
 * Confirma e exclui uma empresa
 * @param {string} empresaId - ID da empresa
 * @param {string} nomeEmpresa - Nome da empresa
 */
function excluirEmpresaConfirmacao(empresaId, nomeEmpresa) {
  if (typeof Swal !== 'undefined') {
    Swal.fire({
      title: 'Confirmar exclusão',
      text: `Deseja realmente excluir a empresa "${nomeEmpresa}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sim, excluir!',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        excluirEmpresa(empresaId, nomeEmpresa);
      }
    });
  } else {
    if (confirm(`Deseja realmente excluir a empresa "${nomeEmpresa}"?`)) {
      excluirEmpresa(empresaId, nomeEmpresa);
    }
  }
}

/**
 * Exclui uma empresa do Firestore
 * @param {string} empresaId - ID da empresa
 * @param {string} nomeEmpresa - Nome da empresa
 */
function excluirEmpresa(empresaId, nomeEmpresa) {
  const user = firebase.auth().currentUser;
  if (!user) return;

  db.collection('usuarios').doc(user.uid).collection('empresas').doc(empresaId).delete()
    .then(() => {
      exibirAlerta(`Empresa "${nomeEmpresa}" excluída com sucesso!`, 'sucesso');
      carregarEmpresasTabela(); // Recarregar a tabela
    })
    .catch((error) => {
      console.error('Erro ao excluir empresa:', error);
      exibirAlerta(`Erro ao excluir a empresa: ${error.message}`, 'erro');
    });
}

// Atualizar a função de carregamento de empresas baseada na rota
document.addEventListener('contentLoaded', function (e) {
  const route = e.detail.route;

  // Carregar empresas se estiver em uma rota que precisa delas
  const rotasQueCarregamEmpresas = ['nfse-mensal', 'nfse-anual', 'nf55', 'nfce', 'cte', 'ecacPJPF', 'Municipal', 'Sefaz', 'FGTS'];

  if (rotasQueCarregamEmpresas.includes(route)) {
    // Aguardar um pouco para garantir que o DOM foi renderizado
    setTimeout(() => {
      carregarEmpresasDoUsuario();
    }, 100);
  }

  if (route === 'cadastroEMp') {
    setTimeout(() => {
      carregarEmpresasTabela();
    }, 100);
  }
});

// Adicionar listener global para busca de empresas
document.addEventListener('input', function (e) {
  if (e.target.classList.contains('busca-empresa')) {
    const termoBusca = e.target.value;
    executarBuscaEmpresas(termoBusca);
  }
});