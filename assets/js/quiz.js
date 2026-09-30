/**
 * Quiz por trilha (Júnior/Pleno/Sênior), ligado à autoavaliação.
 * Renderiza em <div data-track-quiz data-track="backend|frontend|devops|dados|mobile">.
 * Todo texto gerado sai nos dois idiomas (<span data-lang="pt|en">), o CSS do i18n esconde o inativo.
 * Resultado salvo em localStorage 'dg-quiz-<trilha>'; marca itens em 'dg-assess-<trilha>'.
 */
(function () {
  'use strict';
  var host = document.querySelector('[data-track-quiz]');
  if (!host) return;
  var track = host.getAttribute('data-track');

  var LEVELS = [['junior', 'Júnior', 'Junior'], ['pleno', 'Pleno', 'Mid-level'], ['senior', 'Sênior', 'Senior']];
  var ASSESS_ITEMS = 5; // itens por nível na autoavaliação (ver main.js)

  // Títulos dos artigos (link "revise este artigo")
  var ART = {
    backend: {
      'apis-rest.html': ['APIs REST: o que torna uma API RESTful', 'REST APIs: what makes an API RESTful'],
      'como-a-web-funciona.html': ['Como a web funciona: HTTP, request e response', 'How the web works: HTTP, request and response'],
      'sql-essencial.html': ['SQL essencial: CRUD, JOIN e transações', 'Essential SQL: CRUD, JOIN and transactions'],
      'autenticacao-autorizacao.html': ['Autenticação vs Autorização: sessions, JWT e OAuth', 'Authentication vs Authorization: sessions, JWT and OAuth'],
      'problema-n-mais-1.html': ['O problema N+1: como o ORM te trai', 'The N+1 problem: how the ORM betrays you'],
      'cache-backend.html': ['Cache no back-end: quando usar e como invalidar', 'Backend caching: when to use it and how to invalidate'],
      'escalabilidade.html': ['Escalabilidade: vertical, horizontal e load balancing', 'Scalability: vertical, horizontal and load balancing'],
      'teorema-cap.html': ['Teorema CAP e consistência eventual', 'CAP theorem and eventual consistency'],
      'resiliencia.html': ['Resiliência: idempotência, retries e circuit breaker', 'Resilience: idempotency, retries and circuit breaker'],
      'filas-mensageria.html': ['Filas e mensageria: processamento assíncrono e desacoplamento', 'Queues and messaging: asynchronous processing and decoupling']
    },
    frontend: {
      'html-semantico.html': ['HTML semântico e acessibilidade', 'Semantic HTML and accessibility'],
      'css-box-model-layout.html': ['CSS sem medo: box model, flexbox e grid', 'CSS without fear: box model, flexbox and grid'],
      'javascript-essencial.html': ['JavaScript essencial: tipos, escopo e o DOM', 'Essential JavaScript: types, scope and the DOM'],
      'event-loop.html': ['O event loop: como o JavaScript faz async sem travar', 'The event loop: how JavaScript does async without freezing'],
      'estado-componentes.html': ['Estado em front-end: props, state e quando subir o estado', 'State in front-end: props, state and when to lift it up'],
      'render-performance.html': ['Renderização e performance: reflow, repaint e o caminho crítico', 'Rendering and performance: reflow, repaint and the critical path'],
      'web-performance-core-vitals.html': ['Web performance: Core Web Vitals, lazy loading e bundle', 'Web performance: Core Web Vitals, lazy loading and bundle size'],
      'seguranca-frontend.html': ['Segurança no front-end: XSS, CSRF e CORS sem mistério', 'Front-end security: XSS, CSRF and CORS demystified']
    },
    devops: {
      'linux-terminal.html': ['Linux e terminal: o mínimo que todo DevOps domina', 'Linux and the terminal: the bare minimum every DevOps engineer masters'],
      'git-fluxos.html': ['Git além do commit: branches, merge e fluxos de trabalho', 'Git beyond the commit: branches, merge, and workflows'],
      'ci-cd-basico.html': ['CI/CD na prática: do commit ao deploy automático', 'CI/CD in practice: from commit to automatic deploy'],
      'containers-docker.html': ['Containers e Docker', 'Containers and Docker'],
      'infra-como-codigo.html': ['Infraestrutura como código: Terraform', 'Infrastructure as code: Terraform'],
      'observabilidade.html': ['Observabilidade: logs, métricas e traces', 'Observability: logs, metrics, and traces'],
      'kubernetes.html': ['Kubernetes sem pânico: pods, deployments e autoscaling', 'Kubernetes without panic: pods, deployments, and autoscaling'],
      'arquitetura-cloud.html': ['Arquitetura na nuvem: alta disponibilidade', 'Cloud architecture: high availability'],
      'seguranca-devsecops.html': ['DevSecOps: segredos, least privilege e shift-left', 'DevSecOps: secrets, least privilege, and shift-left']
    },
    dados: {
      'modelagem-relacional.html': ['Modelagem relacional: tabelas, chaves e relacionamentos', 'Relational modeling: tables, keys and relationships'],
      'consultas-sql.html': ['SQL além do básico: agregações, GROUP BY e subqueries', 'SQL beyond the basics: aggregations, GROUP BY and subqueries'],
      'normalizacao.html': ['Normalização: 1FN, 2FN e 3FN sem decorar', 'Normalization: 1NF, 2NF and 3NF without memorizing'],
      'indices-performance.html': ['Índices e performance: por que sua query está lenta', 'Indexes and performance: why your query is slow'],
      'modelagem-dimensional.html': ['Modelagem dimensional: fato, dimensão e o data warehouse', 'Dimensional modeling: fact, dimension and the data warehouse'],
      'etl-pipelines.html': ['ETL e pipelines de dados: do raw ao analítico', 'ETL and data pipelines: from raw to analytics'],
      'particionamento-sharding.html': ['Particionamento e sharding: escalar o banco de dados', 'Partitioning and sharding: scaling the database'],
      'streaming-dados.html': ['Dados em streaming: batch vs tempo real', 'Streaming data: batch vs real time'],
      'nosql.html': ['NoSQL: documento, chave-valor, coluna e grafo', 'NoSQL: document, key-value, column and graph']
    },
    mobile: {
      'ciclo-de-vida-app.html': ['Ciclo de vida de um app: estados, telas e o básico', 'App lifecycle: states, screens and the basics'],
      'layout-responsivo-mobile.html': ['Layout que se adapta: densidade, safe areas e telas diferentes', 'Layouts that adapt: density, safe areas and different screens'],
      'navegacao-mobile.html': ['Navegação em apps: stack, tabs e deep links', 'Navigation in apps: stack, tabs and deep links'],
      'offline-sync.html': ['Offline-first e sincronização', 'Offline-first and sync'],
      'performance-mobile.html': ['Performance mobile: jank, listas e bateria', 'Mobile performance: jank, lists and battery usage'],
      'arquitetura-mobile.html': ['Arquitetura mobile: MVVM, camadas e testabilidade', 'Mobile architecture: MVVM, layers and testability'],
      'push-notificacoes.html': ['Push notifications: como funcionam de ponta a ponta', 'Push notifications: how they work end to end'],
      'publicacao-lojas.html': ['Publicação nas lojas: build, assinatura, review e versionamento', 'Publishing to the stores: build, signing, review and versioning']
    }
  };

  /* Perguntas: q = [pt, en], o = alternativas [[pt, en] x4], a = índice correto, e = explicação [pt, en], l = artigo.
     O texto pode conter HTML simples (<code>); caracteres especiais já vêm escapados. */
  var Q = {
    backend: {
      junior: [
        { q: ['Um cliente cria um recurso com sucesso via <code>POST /pedidos</code>. Qual status code é o mais adequado?', 'A client successfully creates a resource via <code>POST /orders</code>. Which status code fits best?'],
          o: [['200 OK', '200 OK'], ['201 Created', '201 Created'], ['204 No Content', '204 No Content'], ['302 Found', '302 Found']], a: 1,
          e: ['201 Created indica que um recurso novo foi criado (idealmente com o header <code>Location</code> apontando para ele). 200 é sucesso genérico; 204 é sucesso sem corpo.', '201 Created says a new resource was created (ideally with a <code>Location</code> header pointing to it). 200 is generic success; 204 is success with no body.'],
          l: 'apis-rest.html' },
        { q: ['O que significa dizer que o HTTP é <em>stateless</em>?', 'What does it mean that HTTP is <em>stateless</em>?'],
          o: [['Que o servidor não pode usar banco de dados', 'That the server cannot use a database'], ['Que cookies são proibidos', 'That cookies are forbidden'], ['Que cada requisição é independente e precisa carregar tudo que o servidor precisa para atendê-la', 'That each request is independent and must carry everything the server needs to handle it'], ['Que a conexão TCP é fechada após cada resposta', 'That the TCP connection is closed after every response']], a: 2,
          e: ['O protocolo não guarda memória entre requisições: o contexto (ex.: identidade) viaja em cada uma, via cookie ou token. Por isso sessões e tokens existem.', 'The protocol keeps no memory between requests: context (e.g. identity) travels in each one, via a cookie or token. That is why sessions and tokens exist.'],
          l: 'como-a-web-funciona.html' },
        { q: ['Você quer listar <strong>todos</strong> os clientes, inclusive os que nunca fizeram pedido. Qual JOIN usar entre <code>clientes</code> e <code>pedidos</code>?', 'You want to list <strong>all</strong> customers, including those who never placed an order. Which JOIN between <code>customers</code> and <code>orders</code>?'],
          o: [['<code>INNER JOIN</code>', '<code>INNER JOIN</code>'], ['<code>clientes LEFT JOIN pedidos</code>', '<code>customers LEFT JOIN orders</code>'], ['<code>CROSS JOIN</code>', '<code>CROSS JOIN</code>'], ['Nenhum, só com subquery', 'None, only with a subquery']], a: 1,
          e: ['O LEFT JOIN mantém todas as linhas da tabela da esquerda; quem não tem pedido aparece com as colunas de pedidos em NULL. O INNER JOIN só traz quem tem correspondência.', 'LEFT JOIN keeps every row from the left table; customers with no order show up with NULL order columns. INNER JOIN only returns rows that match.'],
          l: 'sql-essencial.html' },
        { q: ['Numa transferência bancária, o débito funcionou e o crédito falhou. Qual propriedade ACID garante que o débito seja desfeito?', 'In a bank transfer, the debit succeeded and the credit failed. Which ACID property guarantees the debit is rolled back?'],
          o: [['Atomicidade', 'Atomicity'], ['Consistência', 'Consistency'], ['Isolamento', 'Isolation'], ['Durabilidade', 'Durability']], a: 0,
          e: ['Atomicidade é o "tudo ou nada": ou todas as operações da transação são aplicadas, ou nenhuma (rollback).', 'Atomicity is "all or nothing": either every operation in the transaction is applied, or none is (rollback).'],
          l: 'sql-essencial.html' }
      ],
      pleno: [
        { q: ['Um usuário autenticado tenta acessar uma rota só de administradores. Qual status code a API deve devolver?', 'An authenticated user tries to access an admin-only route. Which status code should the API return?'],
          o: [['401 Unauthorized', '401 Unauthorized'], ['403 Forbidden', '403 Forbidden'], ['400 Bad Request', '400 Bad Request'], ['500 Internal Server Error', '500 Internal Server Error']], a: 1,
          e: ['401 significa "não sei quem você é" (falha de autenticação). 403 significa "sei quem você é, mas você não pode" (falha de autorização).', '401 means "I don\'t know who you are" (authentication failure). 403 means "I know who you are, but you can\'t" (authorization failure).'],
          l: 'autenticacao-autorizacao.html' },
        { q: ['Sobre o payload de um JWT assinado, é correto afirmar:', 'About the payload of a signed JWT, which is correct?'],
          o: [['É criptografado; dá para guardar senhas nele', 'It is encrypted; you can store passwords in it'], ['É só codificado em Base64URL: qualquer um lê; a assinatura garante apenas que não foi alterado', 'It is only Base64URL-encoded: anyone can read it; the signature only guarantees it was not tampered with'], ['A assinatura impede que o token expire', 'The signature prevents the token from expiring'], ['O servidor precisa guardar cada token emitido para validá-lo', 'The server must store every issued token to validate it']], a: 1,
          e: ['Base64 não é criptografia. Nunca coloque dados sensíveis no payload; a assinatura só prova integridade e origem, e a validação é feita sem consultar estado no servidor.', 'Base64 is not encryption. Never put sensitive data in the payload; the signature only proves integrity and origin, and validation needs no server-side state.'],
          l: 'autenticacao-autorizacao.html' },
        { q: ['Você lista 50 pedidos e, para cada um, o ORM carrega o cliente com lazy loading. Quantas queries vão ao banco?', 'You list 50 orders and, for each one, the ORM lazy-loads the customer. How many queries hit the database?'],
          o: [['1', '1'], ['2', '2'], ['50', '50'], ['51', '51']], a: 3,
          e: ['É o N+1: 1 query para os pedidos + 50 para os clientes. A correção é eager loading (JOIN ou <code>IN (...)</code>), caindo para 1 ou 2 queries.', 'That is N+1: 1 query for the orders + 50 for the customers. The fix is eager loading (JOIN or <code>IN (...)</code>), bringing it down to 1 or 2 queries.'],
          l: 'problema-n-mais-1.html' },
        { q: ['No padrão <em>cache-aside</em>, o que acontece num cache miss?', 'In the <em>cache-aside</em> pattern, what happens on a cache miss?'],
          o: [['O banco escreve no cache automaticamente', 'The database writes to the cache automatically'], ['O próprio cache busca no banco sozinho', 'The cache fetches from the database by itself'], ['A aplicação lê do banco, grava o valor no cache e o devolve', 'The application reads from the database, writes the value to the cache and returns it'], ['A requisição falha até o TTL expirar', 'The request fails until the TTL expires']], a: 2,
          e: ['No cache-aside quem orquestra é a aplicação: tenta o cache, no miss vai ao banco e popula o cache. Quando o cache busca sozinho, o padrão é <em>read-through</em>.', 'In cache-aside the application orchestrates: it tries the cache, on a miss it goes to the database and fills the cache. When the cache fetches by itself, that is <em>read-through</em>.'],
          l: 'cache-backend.html' }
      ],
      senior: [
        { q: ['Por que guardar a sessão do usuário na memória de cada servidor atrapalha a escala horizontal?', 'Why does keeping the user session in each server\'s memory hurt horizontal scaling?'],
          o: [['Porque memória RAM é mais lenta que disco', 'Because RAM is slower than disk'], ['Porque o load balancer pode mandar a próxima requisição para outra instância, que não conhece aquela sessão', 'Because the load balancer may send the next request to another instance that doesn\'t know that session'], ['Porque sessões só funcionam com HTTP/2', 'Because sessions only work with HTTP/2'], ['Não atrapalha, é a prática recomendada', 'It doesn\'t; it is the recommended practice']], a: 1,
          e: ['Serviços stateless permitem que qualquer instância atenda qualquer requisição. Leve o estado para fora (Redis, banco, token) em vez de depender de sticky sessions.', 'Stateless services let any instance serve any request. Move state out (Redis, database, token) instead of relying on sticky sessions.'],
          l: 'escalabilidade.html' },
        { q: ['Durante uma partição de rede, o que um sistema que escolheu <strong>CP</strong> faz?', 'During a network partition, what does a system that chose <strong>CP</strong> do?'],
          o: [['Continua respondendo tudo, mesmo com dados possivelmente desatualizados', 'Keeps answering everything, even with possibly stale data'], ['Recusa ou dá erro em parte das requisições para não devolver dados inconsistentes', 'Rejects or errors on some requests so it never returns inconsistent data'], ['Ignora a partição, que não acontece em redes modernas', 'Ignores the partition, which doesn\'t happen on modern networks'], ['Garante C, A e P ao mesmo tempo', 'Guarantees C, A and P at the same time']], a: 1,
          e: ['Partições são inevitáveis, então a escolha real é entre consistência e disponibilidade durante a partição. CP sacrifica disponibilidade; AP responde e aceita consistência eventual.', 'Partitions are inevitable, so the real choice is consistency vs availability during the partition. CP gives up availability; AP keeps answering and accepts eventual consistency.'],
          l: 'teorema-cap.html' },
        { q: ['Por que adicionar <em>jitter</em> (aleatoriedade) ao exponential backoff dos retries?', 'Why add <em>jitter</em> (randomness) to exponential backoff retries?'],
          o: [['Para os retries acontecerem mais rápido', 'So retries happen faster'], ['Para evitar que muitos clientes tentem de novo no mesmo instante e derrubem o serviço que está se recuperando', 'To stop many clients retrying at the same instant and knocking over a recovering service'], ['Para tornar a operação idempotente', 'To make the operation idempotent'], ['Para dispensar o timeout', 'To remove the need for a timeout']], a: 1,
          e: ['Sem jitter, os clientes que falharam juntos repetem juntos, em ondas sincronizadas (thundering herd). A aleatoriedade espalha a carga.', 'Without jitter, clients that failed together retry together in synchronized waves (thundering herd). Randomness spreads the load.'],
          l: 'resiliencia.html' },
        { q: ['Uma fila entrega mensagens <em>at-least-once</em>. O que o consumidor precisa ser para não causar efeitos duplicados (ex.: cobrar duas vezes)?', 'A queue delivers messages <em>at-least-once</em>. What must the consumer be to avoid duplicate side effects (e.g. charging twice)?'],
          o: [['Idempotente: processar a mesma mensagem duas vezes tem o mesmo efeito que uma', 'Idempotent: processing the same message twice has the same effect as once'], ['Síncrono', 'Synchronous'], ['Stateless e sem banco', 'Stateless and database-free'], ['Mais rápido que o produtor', 'Faster than the producer']], a: 0,
          e: ['At-least-once significa que reentregas vão acontecer. Use uma chave de idempotência (ex.: id da mensagem registrado como processado) para ignorar duplicatas.', 'At-least-once means redeliveries will happen. Use an idempotency key (e.g. the message id recorded as processed) to skip duplicates.'],
          l: 'filas-mensageria.html' }
      ]
    },

    frontend: {
      junior: [
        { q: ['Qual elemento é o mais adequado para uma ação como "Abrir menu"?', 'Which element best fits an action like "Open menu"?'],
          o: [['<code>&lt;div onclick="..."&gt;</code>', '<code>&lt;div onclick="..."&gt;</code>'], ['<code>&lt;button type="button"&gt;</code>', '<code>&lt;button type="button"&gt;</code>'], ['<code>&lt;span class="btn"&gt;</code>', '<code>&lt;span class="btn"&gt;</code>'], ['<code>&lt;a href="#"&gt;</code>', '<code>&lt;a href="#"&gt;</code>']], a: 1,
          e: ['O <code>&lt;button&gt;</code> já vem focável, é ativado com Enter/Espaço e é anunciado como botão pelo leitor de tela. Links são para navegar; div/span exigem recriar tudo isso à mão.', '<code>&lt;button&gt;</code> is focusable out of the box, activates with Enter/Space and is announced as a button by screen readers. Links are for navigation; div/span force you to rebuild all of that by hand.'],
          l: 'html-semantico.html' },
        { q: ['Com <code>box-sizing: border-box</code>, um elemento tem <code>width: 200px</code>, <code>padding: 20px</code> e <code>border: 1px</code>. Qual a largura total renderizada?', 'With <code>box-sizing: border-box</code>, an element has <code>width: 200px</code>, <code>padding: 20px</code> and <code>border: 1px</code>. What is the total rendered width?'],
          o: [['200px', '200px'], ['240px', '240px'], ['242px', '242px'], ['222px', '222px']], a: 0,
          e: ['No border-box, padding e borda ficam dentro da largura declarada. No content-box (padrão) seriam 200 + 40 + 2 = 242px.', 'With border-box, padding and border fit inside the declared width. With content-box (the default) it would be 200 + 40 + 2 = 242px.'],
          l: 'css-box-model-layout.html' },
        { q: ['Qual o resultado de <code>0 == \'\'</code> e de <code>0 === \'\'</code>, respectivamente?', 'What do <code>0 == \'\'</code> and <code>0 === \'\'</code> evaluate to, respectively?'],
          o: [['<code>true</code> e <code>false</code>', '<code>true</code> and <code>false</code>'], ['<code>false</code> e <code>false</code>', '<code>false</code> and <code>false</code>'], ['<code>true</code> e <code>true</code>', '<code>true</code> and <code>true</code>'], ['<code>false</code> e <code>true</code>', '<code>false</code> and <code>true</code>']], a: 0,
          e: ['O <code>==</code> faz coerção de tipo (a string vazia vira 0); o <code>===</code> compara valor e tipo sem converter. Prefira <code>===</code>.', '<code>==</code> coerces types (the empty string becomes 0); <code>===</code> compares value and type without converting. Prefer <code>===</code>.'],
          l: 'javascript-essencial.html' },
        { q: ['O que este código imprime? <code>for (var i = 0; i &lt; 3; i++) setTimeout(() =&gt; console.log(i));</code>', 'What does this code print? <code>for (var i = 0; i &lt; 3; i++) setTimeout(() =&gt; console.log(i));</code>'],
          o: [['0 1 2', '0 1 2'], ['3 3 3', '3 3 3'], ['undefined três vezes', 'undefined three times'], ['2 2 2', '2 2 2']], a: 1,
          e: ['<code>var</code> tem escopo de função: as três closures compartilham o mesmo <code>i</code>, que já vale 3 quando os timeouts rodam. Com <code>let</code>, cada iteração tem seu próprio <code>i</code> e sai 0 1 2.', '<code>var</code> is function-scoped: all three closures share the same <code>i</code>, which is already 3 when the timeouts run. With <code>let</code>, each iteration gets its own <code>i</code> and you get 0 1 2.'],
          l: 'javascript-essencial.html' }
      ],
      pleno: [
        { q: ['Em que ordem sai o log? <code>console.log(\'A\'); setTimeout(() =&gt; console.log(\'B\'), 0); Promise.resolve().then(() =&gt; console.log(\'C\')); console.log(\'D\');</code>', 'In what order is it logged? <code>console.log(\'A\'); setTimeout(() =&gt; console.log(\'B\'), 0); Promise.resolve().then(() =&gt; console.log(\'C\')); console.log(\'D\');</code>'],
          o: [['A B C D', 'A B C D'], ['A D B C', 'A D B C'], ['A D C B', 'A D C B'], ['A C D B', 'A C D B']], a: 2,
          e: ['Primeiro roda o código síncrono (A, D). Depois a fila de microtasks (Promise → C) é esvaziada antes da próxima macrotask (setTimeout → B).', 'Synchronous code runs first (A, D). Then the microtask queue (Promise → C) is drained before the next macrotask (setTimeout → B).'],
          l: 'event-loop.html' },
        { q: ['Dois componentes irmãos precisam do mesmo dado, e um deles o altera. Qual a abordagem recomendada?', 'Two sibling components need the same data, and one of them changes it. What is the recommended approach?'],
          o: [['Duplicar o estado nos dois e sincronizar com efeitos', 'Duplicate the state in both and sync them with effects'], ['Subir o estado para o ancestral comum mais próximo e passar valor e callback via props', 'Lift the state up to the closest common parent and pass value and callback via props'], ['Guardar em variável global do <code>window</code>', 'Store it in a global <code>window</code> variable'], ['Um irmão acessa o estado do outro por ref', 'One sibling reads the other\'s state through a ref']], a: 1,
          e: ['É o <em>lifting state up</em>: uma única fonte da verdade no pai, fluxo de dados unidirecional (dados descem por props, eventos sobem por callbacks).', 'That is <em>lifting state up</em>: a single source of truth in the parent, unidirectional data flow (data goes down via props, events go up via callbacks).'],
          l: 'estado-componentes.html' },
        { q: ['Você tem no estado uma <code>lista</code> e um <code>filtro</code>. Onde deve ficar a lista filtrada?', 'You have a <code>list</code> and a <code>filter</code> in state. Where should the filtered list live?'],
          o: [['Num terceiro estado, atualizado sempre que lista ou filtro mudam', 'In a third piece of state, updated whenever list or filter change'], ['Calculada durante a renderização a partir de lista e filtro (estado derivado)', 'Computed during render from list and filter (derived state)'], ['No localStorage', 'In localStorage'], ['Num estado global obrigatoriamente', 'Necessarily in global state']], a: 1,
          e: ['O que pode ser calculado a partir de outro estado não deve ser estado: guardar cópias abre espaço para dessincronização. Se o cálculo for caro, memoize.', 'Anything computable from other state shouldn\'t be state: storing copies invites them to drift out of sync. If the computation is expensive, memoize it.'],
          l: 'estado-componentes.html' },
        { q: ['Qual destas mudanças costuma disparar <strong>só repaint</strong>, sem reflow?', 'Which of these changes usually triggers <strong>only a repaint</strong>, without reflow?'],
          o: [['Alterar <code>width</code>', 'Changing <code>width</code>'], ['Alterar <code>font-size</code>', 'Changing <code>font-size</code>'], ['Alterar <code>background-color</code>', 'Changing <code>background-color</code>'], ['Inserir um elemento no DOM', 'Inserting an element into the DOM']], a: 2,
          e: ['Cor muda a aparência, não a geometria, então o navegador só repinta. Tamanho, fonte e mudanças no DOM exigem recalcular o layout (reflow), que é mais caro.', 'Color changes appearance, not geometry, so the browser just repaints. Size, font and DOM changes require recalculating layout (reflow), which is more expensive.'],
          l: 'render-performance.html' }
      ],
      senior: [
        { q: ['Imagens sem <code>width</code>/<code>height</code> (ou <code>aspect-ratio</code>) empurram o conteúdo quando carregam. Qual Core Web Vital piora?', 'Images without <code>width</code>/<code>height</code> (or <code>aspect-ratio</code>) push content around when they load. Which Core Web Vital gets worse?'],
          o: [['LCP', 'LCP'], ['CLS', 'CLS'], ['INP', 'INP'], ['TTFB', 'TTFB']], a: 1,
          e: ['CLS mede a instabilidade visual (deslocamentos inesperados de layout). Reservar o espaço da imagem de antemão evita o salto.', 'CLS measures visual instability (unexpected layout shifts). Reserving the image\'s space up front prevents the jump.'],
          l: 'web-performance-core-vitals.html' },
        { q: ['O que o INP mede?', 'What does INP measure?'],
          o: [['O tempo até o maior elemento visível aparecer', 'Time until the largest visible element appears'], ['A latência entre uma interação do usuário e o próximo frame pintado', 'The latency between a user interaction and the next painted frame'], ['O tempo de resposta do servidor', 'Server response time'], ['O tamanho total do bundle JS', 'Total JS bundle size']], a: 1,
          e: ['INP (Interaction to Next Paint) mede responsividade. Tarefas longas na main thread o pioram; quebre-as, adie trabalho e carregue menos JS.', 'INP (Interaction to Next Paint) measures responsiveness. Long tasks on the main thread hurt it; split them, defer work and ship less JS.'],
          l: 'web-performance-core-vitals.html' },
        { q: ['Sobre CORS, qual afirmação está correta?', 'About CORS, which statement is correct?'],
          o: [['Protege sua API contra qualquer requisição maliciosa, inclusive via curl', 'It protects your API from any malicious request, including via curl'], ['É uma regra do navegador que relaxa a same-origin policy: o servidor diz, por headers, quais origens podem ler a resposta', 'It is a browser rule that relaxes the same-origin policy: the server says, via headers, which origins may read the response'], ['É configurado no código do front-end', 'It is configured in the front-end code'], ['Impede ataques de XSS', 'It prevents XSS attacks']], a: 1,
          e: ['CORS é aplicado pelo navegador e configurado no servidor (<code>Access-Control-Allow-Origin</code>). Não é autenticação nem firewall: clientes fora do navegador o ignoram.', 'CORS is enforced by the browser and configured on the server (<code>Access-Control-Allow-Origin</code>). It is not authentication or a firewall: non-browser clients ignore it.'],
          l: 'seguranca-frontend.html' },
        { q: ['Qual a forma mais segura de exibir no DOM um comentário digitado pelo usuário?', 'What is the safest way to display a user-typed comment in the DOM?'],
          o: [['<code>el.innerHTML = comentario</code>', '<code>el.innerHTML = comment</code>'], ['<code>el.textContent = comentario</code>', '<code>el.textContent = comment</code>'], ['<code>document.write(comentario)</code>', '<code>document.write(comment)</code>'], ['Remover <code>&lt;script&gt;</code> com regex e usar innerHTML', 'Strip <code>&lt;script&gt;</code> with a regex and use innerHTML']], a: 1,
          e: ['<code>textContent</code> trata tudo como texto, sem interpretar HTML, o que evita XSS. Regex não sanitiza (há <code>onerror</code>, <code>javascript:</code>...); se precisar de HTML, use um sanitizador testado.', '<code>textContent</code> treats everything as text without parsing HTML, which prevents XSS. Regexes don\'t sanitize (there\'s <code>onerror</code>, <code>javascript:</code>...); if you need HTML, use a proven sanitizer.'],
          l: 'seguranca-frontend.html' }
      ]
    },

    devops: {
      junior: [
        { q: ['O que <code>chmod 754 deploy.sh</code> define?', 'What does <code>chmod 754 deploy.sh</code> set?'],
          o: [['Dono: rwx, grupo: r-x, outros: r--', 'Owner: rwx, group: r-x, others: r--'], ['Dono: rwx, grupo: rw-, outros: r--', 'Owner: rwx, group: rw-, others: r--'], ['Dono: r-x, grupo: rwx, outros: r--', 'Owner: r-x, group: rwx, others: r--'], ['Todos com leitura e execução', 'Everyone gets read and execute']], a: 0,
          e: ['Cada dígito soma r=4, w=2, x=1, na ordem dono/grupo/outros: 7 = rwx, 5 = r-x, 4 = r--.', 'Each digit adds r=4, w=2, x=1, in owner/group/others order: 7 = rwx, 5 = r-x, 4 = r--.'],
          l: 'linux-terminal.html' },
        { q: ['Em <code>cat app.log | grep ERROR | wc -l</code>, o que o <code>|</code> faz?', 'In <code>cat app.log | grep ERROR | wc -l</code>, what does <code>|</code> do?'],
          o: [['Roda os comandos em paralelo, sem ligação entre eles', 'Runs the commands in parallel, unconnected'], ['Envia a saída padrão de um comando como entrada do próximo', 'Sends one command\'s standard output as the next one\'s input'], ['Salva a saída num arquivo', 'Saves the output to a file'], ['Executa o próximo só se o anterior falhar', 'Runs the next one only if the previous fails']], a: 1,
          e: ['O pipe conecta stdout → stdin, compondo ferramentas pequenas. Salvar em arquivo é <code>&gt;</code>; "só se falhar" é <code>||</code>.', 'The pipe connects stdout → stdin, composing small tools. Saving to a file is <code>&gt;</code>; "only on failure" is <code>||</code>.'],
          l: 'linux-terminal.html' },
        { q: ['Qual a diferença principal entre <code>git merge</code> e <code>git rebase</code>?', 'What is the main difference between <code>git merge</code> and <code>git rebase</code>?'],
          o: [['Merge apaga a branch de origem; rebase não', 'Merge deletes the source branch; rebase doesn\'t'], ['Merge preserva o histórico e cria um commit de merge; rebase reescreve seus commits por cima da outra branch, deixando o histórico linear', 'Merge preserves history and creates a merge commit; rebase rewrites your commits on top of the other branch for a linear history'], ['Rebase só funciona em repositório local sem remoto', 'Rebase only works in local repos without a remote'], ['Não há diferença, são sinônimos', 'There is no difference, they are synonyms']], a: 1,
          e: ['Como o rebase reescreve commits (novos hashes), evite rebase em branches compartilhadas que outras pessoas já baixaram.', 'Because rebase rewrites commits (new hashes), avoid rebasing shared branches that others have already pulled.'],
          l: 'git-fluxos.html' },
        { q: ['Qual a diferença entre Continuous Delivery e Continuous Deployment?', 'What is the difference between Continuous Delivery and Continuous Deployment?'],
          o: [['São a mesma coisa', 'They are the same thing'], ['Delivery deixa tudo pronto para produção, mas o deploy tem aprovação manual; Deployment leva a produção automaticamente toda mudança que passa no pipeline', 'Delivery keeps everything ready for production but the deploy needs manual approval; Deployment ships every change that passes the pipeline to production automatically'], ['Delivery roda testes; Deployment não', 'Delivery runs tests; Deployment doesn\'t'], ['Deployment é só para containers', 'Deployment is only for containers']], a: 1,
          e: ['Ambos partem de CI (integrar e testar a cada commit). A diferença é o último passo: botão humano (Delivery) ou automático (Deployment).', 'Both build on CI (integrate and test on every commit). The difference is the last step: a human button (Delivery) or automatic (Deployment).'],
          l: 'ci-cd-basico.html' }
      ],
      pleno: [
        { q: ['Por que num Dockerfile de Node se copia o <code>package.json</code> e roda <code>npm install</code> <strong>antes</strong> de <code>COPY . .</code>?', 'Why does a Node Dockerfile copy <code>package.json</code> and run <code>npm install</code> <strong>before</strong> <code>COPY . .</code>?'],
          o: [['É exigido pela sintaxe do Dockerfile', 'The Dockerfile syntax requires it'], ['Para aproveitar o cache de camadas: as dependências só são reinstaladas quando o manifesto muda', 'To leverage layer caching: dependencies are only reinstalled when the manifest changes'], ['Para a imagem ficar sem o código-fonte', 'So the image ends up without the source code'], ['Para rodar os testes antes do build', 'To run tests before the build']], a: 1,
          e: ['Cada instrução gera uma camada; se nada mudou até ela, o Docker reaproveita o cache. Mudar só o código invalida apenas as camadas depois do <code>COPY . .</code>.', 'Each instruction produces a layer; if nothing changed up to it, Docker reuses the cache. Changing only code invalidates just the layers after <code>COPY . .</code>.'],
          l: 'containers-docker.html' },
        { q: ['Qual a diferença essencial entre um container e uma máquina virtual?', 'What is the essential difference between a container and a virtual machine?'],
          o: [['Containers compartilham o kernel do host; VMs rodam um sistema operacional completo sobre um hypervisor', 'Containers share the host kernel; VMs run a full operating system on top of a hypervisor'], ['Containers são sempre mais seguros que VMs', 'Containers are always more secure than VMs'], ['VMs não podem rodar Linux', 'VMs cannot run Linux'], ['Containers precisam de um hypervisor próprio por aplicação', 'Containers need a dedicated hypervisor per application']], a: 0,
          e: ['Por compartilhar o kernel, o container sobe em segundos e é leve; a VM isola mais, porém é mais pesada.', 'Because it shares the kernel, a container starts in seconds and is lightweight; a VM isolates more but is heavier.'],
          l: 'containers-docker.html' },
        { q: ['O que o <code>terraform plan</code> faz?', 'What does <code>terraform plan</code> do?'],
          o: [['Cria os recursos na nuvem', 'Creates the cloud resources'], ['Mostra o que vai ser criado, alterado ou destruído, comparando código e state, sem mudar nada', 'Shows what will be created, changed or destroyed by comparing code and state, without changing anything'], ['Apaga o state file', 'Deletes the state file'], ['Formata os arquivos <code>.tf</code>', 'Formats the <code>.tf</code> files']], a: 1,
          e: ['O fluxo é plan → revisão → apply. O plan é o "diff" da infraestrutura e costuma ser revisado no pull request.', 'The flow is plan → review → apply. The plan is the infrastructure "diff" and is usually reviewed in the pull request.'],
          l: 'infra-como-codigo.html' },
        { q: ['Uma requisição ficou lenta e passa por 8 serviços. Qual pilar da observabilidade mostra em qual serviço está o gargalo?', 'A request got slow and goes through 8 services. Which observability pillar shows which service is the bottleneck?'],
          o: [['Logs', 'Logs'], ['Métricas', 'Metrics'], ['Traces', 'Traces'], ['Dashboards de CPU', 'CPU dashboards']], a: 2,
          e: ['O trace segue uma requisição de ponta a ponta com spans por serviço e seus tempos. Métricas dizem "quanto/quando"; logs dizem "o que aconteceu aqui".', 'A trace follows one request end to end, with a span per service and its timing. Metrics tell "how much/when"; logs tell "what happened here".'],
          l: 'observabilidade.html' }
      ],
      senior: [
        { q: ['Um pod de um Deployment com <code>replicas: 3</code> morre. O que acontece?', 'A pod from a Deployment with <code>replicas: 3</code> dies. What happens?'],
          o: [['Nada, até alguém rodar <code>kubectl apply</code> de novo', 'Nothing, until someone runs <code>kubectl apply</code> again'], ['O controlador percebe a diferença entre o real (2) e o desejado (3) e cria um novo pod', 'The controller notices the gap between actual (2) and desired (3) and creates a new pod'], ['O Service passa a ter 2 réplicas como novo desejado', 'The Service makes 2 replicas the new desired state'], ['O nó inteiro é reiniciado', 'The whole node is restarted']], a: 1,
          e: ['Kubernetes funciona por reconciliação: um laço contínuo leva o estado real ao estado declarado.', 'Kubernetes works by reconciliation: a continuous loop drives actual state toward declared state.'],
          l: 'kubernetes.html' },
        { q: ['Por que usar um Service em vez de chamar os pods pelo IP?', 'Why use a Service instead of calling pods by IP?'],
          o: [['Pods são efêmeros e mudam de IP; o Service dá um endereço estável e balanceia entre os pods vivos', 'Pods are ephemeral and change IPs; the Service gives a stable address and load-balances across live pods'], ['O Service deixa os pods mais rápidos', 'The Service makes pods faster'], ['Pods não têm IP', 'Pods have no IP'], ['O Service substitui o Deployment', 'The Service replaces the Deployment']], a: 0,
          e: ['Pods nascem e morrem (deploys, falhas, autoscaling). O Service seleciona pods por labels e abstrai essa rotatividade.', 'Pods come and go (deploys, failures, autoscaling). The Service selects pods by labels and hides that churn.'],
          l: 'kubernetes.html' },
        { q: ['Sua aplicação roda em 2 instâncias, ambas na mesma zona de disponibilidade. Qual o risco?', 'Your app runs on 2 instances, both in the same availability zone. What is the risk?'],
          o: [['Nenhum, 2 instâncias já é alta disponibilidade', 'None, 2 instances is already high availability'], ['Uma falha da AZ derruba as duas: a zona vira ponto único de falha', 'An AZ failure takes both down: the zone becomes a single point of failure'], ['Custo dobrado sem benefício algum', 'Double cost with no benefit at all'], ['Latência maior entre as instâncias', 'Higher latency between the instances']], a: 1,
          e: ['Redundância só protege contra falhas que não atingem as cópias ao mesmo tempo. Distribua as instâncias (e o banco) em múltiplas AZs atrás de um load balancer.', 'Redundancy only protects against failures that don\'t hit all copies at once. Spread instances (and the database) across multiple AZs behind a load balancer.'],
          l: 'arquitetura-cloud.html' },
        { q: ['Um token de API foi commitado e removido no commit seguinte. Qual a ação correta?', 'An API token was committed and removed in the next commit. What is the right action?'],
          o: [['Nada, já foi removido', 'Nothing, it was already removed'], ['Tornar o repositório privado', 'Make the repository private'], ['Revogar/rotacionar o token imediatamente e passar a lê-lo de um cofre de segredos', 'Revoke/rotate the token immediately and start reading it from a secrets vault'], ['Fazer <code>git revert</code> do commit', 'Run <code>git revert</code> on the commit']], a: 2,
          e: ['O segredo continua no histórico do Git (e em clones). Considere-o vazado: rotacione, e previna com scanners de segredo no pipeline (shift-left).', 'The secret stays in Git history (and in clones). Treat it as leaked: rotate it, and prevent it with secret scanners in the pipeline (shift-left).'],
          l: 'seguranca-devsecops.html' }
      ]
    },

    dados: {
      junior: [
        { q: ['O que uma chave estrangeira garante?', 'What does a foreign key guarantee?'],
          o: [['Que a coluna nunca se repete', 'That the column never repeats'], ['Integridade referencial: o valor precisa existir na chave primária da tabela referenciada', 'Referential integrity: the value must exist in the referenced table\'s primary key'], ['Que a consulta fica mais rápida', 'That the query gets faster'], ['Que a coluna é criptografada', 'That the column is encrypted']], a: 1,
          e: ['A FK impede, por exemplo, um pedido apontando para um cliente inexistente. Unicidade é papel da PK ou de <code>UNIQUE</code>.', 'An FK prevents, for example, an order pointing to a non-existent customer. Uniqueness is the job of the PK or <code>UNIQUE</code>.'],
          l: 'modelagem-relacional.html' },
        { q: ['Um aluno faz vários cursos e um curso tem vários alunos. Como modelar?', 'A student takes many courses and a course has many students. How do you model it?'],
          o: [['Uma FK <code>curso_id</code> na tabela de alunos', 'A <code>course_id</code> FK on the students table'], ['Uma coluna com a lista de ids de cursos separados por vírgula', 'A column holding a comma-separated list of course ids'], ['Uma tabela de junção (ex.: <code>matriculas</code>) com FKs para aluno e curso', 'A junction table (e.g. <code>enrollments</code>) with FKs to student and course'], ['Juntar alunos e cursos numa tabela só', 'Merge students and courses into a single table']], a: 2,
          e: ['Relacionamento N:N se resolve com uma tabela intermediária, que ainda pode guardar atributos da relação (data da matrícula, nota).', 'An N:N relationship is solved with an intermediate table, which can also hold attributes of the relationship (enrollment date, grade).'],
          l: 'modelagem-relacional.html' },
        { q: ['Para mostrar só as categorias com mais de 10 produtos, onde entra a condição <code>COUNT(*) &gt; 10</code>?', 'To show only categories with more than 10 products, where does <code>COUNT(*) &gt; 10</code> go?'],
          o: [['<code>WHERE</code>', '<code>WHERE</code>'], ['<code>HAVING</code>', '<code>HAVING</code>'], ['<code>ORDER BY</code>', '<code>ORDER BY</code>'], ['<code>SELECT</code>', '<code>SELECT</code>']], a: 1,
          e: ['WHERE filtra linhas antes do agrupamento; HAVING filtra grupos depois do GROUP BY, por isso aceita agregações.', 'WHERE filters rows before grouping; HAVING filters groups after GROUP BY, which is why it accepts aggregates.'],
          l: 'consultas-sql.html' },
        { q: ['Uma coluna <code>telefones</code> guarda "11 9999-0000, 11 9888-1111". Qual forma normal é violada?', 'A <code>phones</code> column stores "11 9999-0000, 11 9888-1111". Which normal form is violated?'],
          o: [['1FN', '1NF'], ['2FN', '2NF'], ['3FN', '3NF'], ['Nenhuma', 'None']], a: 0,
          e: ['A 1FN exige valores atômicos: um valor por célula. Solução: uma tabela de telefones com FK para a pessoa.', '1NF requires atomic values: one value per cell. Fix: a phones table with an FK to the person.'],
          l: 'normalizacao.html' }
      ],
      pleno: [
        { q: ['Existe um índice composto em <code>(cliente_id, data)</code>. Qual consulta <strong>não</strong> aproveita bem esse índice?', 'There is a composite index on <code>(customer_id, date)</code>. Which query does <strong>not</strong> use that index well?'],
          o: [['<code>WHERE cliente_id = 7</code>', '<code>WHERE customer_id = 7</code>'], ['<code>WHERE cliente_id = 7 AND data &gt;= \'2026-01-01\'</code>', '<code>WHERE customer_id = 7 AND date &gt;= \'2026-01-01\'</code>'], ['<code>WHERE data = \'2026-01-01\'</code>', '<code>WHERE date = \'2026-01-01\'</code>'], ['<code>WHERE cliente_id IN (1, 2)</code>', '<code>WHERE customer_id IN (1, 2)</code>']], a: 2,
          e: ['O índice composto é ordenado pela primeira coluna e depois pela segunda (prefixo mais à esquerda). Filtrar só pela segunda é como procurar por sobrenome numa lista ordenada por nome.', 'A composite index is sorted by the first column, then the second (leftmost prefix). Filtering only on the second is like looking up by last name in a list sorted by first name.'],
          l: 'indices-performance.html' },
        { q: ['Qual o custo de criar muitos índices numa tabela?', 'What is the cost of creating many indexes on a table?'],
          o: [['Nenhum, índice só ajuda', 'None, indexes only help'], ['Escritas (INSERT/UPDATE/DELETE) ficam mais lentas e o armazenamento cresce, pois cada índice precisa ser mantido', 'Writes (INSERT/UPDATE/DELETE) get slower and storage grows, since every index must be maintained'], ['As leituras ficam mais lentas', 'Reads get slower'], ['O banco deixa de aceitar JOINs', 'The database stops accepting JOINs']], a: 1,
          e: ['Índice é uma estrutura extra (em geral B-tree) atualizada a cada escrita. Crie os que suas consultas realmente usam, e confirme com <code>EXPLAIN</code>.', 'An index is an extra structure (usually a B-tree) updated on every write. Create the ones your queries actually use, and confirm with <code>EXPLAIN</code>.'],
          l: 'indices-performance.html' },
        { q: ['Num star schema de vendas, o que fica na tabela fato?', 'In a sales star schema, what goes into the fact table?'],
          o: [['Nome do cliente, cidade e categoria do produto', 'Customer name, city and product category'], ['Medidas numéricas (valor, quantidade) e chaves para as dimensões, num grão definido', 'Numeric measures (amount, quantity) and keys to the dimensions, at a defined grain'], ['Só as chaves primárias do sistema OLTP', 'Only the OLTP system\'s primary keys'], ['Os logs de acesso do warehouse', 'The warehouse access logs']], a: 1,
          e: ['Fato registra o evento mensurável; dimensões dão o contexto descritivo (quem, o quê, onde, quando). Definir o grão (ex.: uma linha por item vendido) vem primeiro.', 'The fact records the measurable event; dimensions provide descriptive context (who, what, where, when). Defining the grain (e.g. one row per item sold) comes first.'],
          l: 'modelagem-dimensional.html' },
        { q: ['O que torna um job de ETL diário idempotente?', 'What makes a daily ETL job idempotent?'],
          o: [['Rodar sempre no mesmo horário', 'Always running at the same time'], ['Reexecutar para o mesmo dia produzir o mesmo resultado, sem duplicar (ex.: sobrescrever a partição do dia ou fazer MERGE/upsert)', 'Re-running for the same day produces the same result without duplicates (e.g. overwrite the day\'s partition or MERGE/upsert)'], ['Fazer sempre <code>INSERT</code> append do lote', 'Always appending the batch with <code>INSERT</code>'], ['Usar ELT em vez de ETL', 'Using ELT instead of ETL']], a: 1,
          e: ['Jobs falham e são reprocessados. Um append cego duplica dados na reexecução; sobrescrever ou fazer upsert por chave torna o reprocessamento seguro.', 'Jobs fail and get re-run. A blind append duplicates data on re-run; overwriting or upserting by key makes reprocessing safe.'],
          l: 'etl-pipelines.html' }
      ],
      senior: [
        { q: ['Você fragmenta (sharding) uma tabela de eventos pela <strong>data do evento</strong>. Qual o problema?', 'You shard an events table by <strong>event date</strong>. What is the problem?'],
          o: [['Consultas por data ficam impossíveis', 'Queries by date become impossible'], ['Todas as escritas de agora caem no mesmo shard (hotspot), enquanto os outros ficam ociosos', 'All current writes land on the same shard (hotspot) while the others sit idle'], ['Os dados ficam duplicados em todos os shards', 'Data gets duplicated on every shard'], ['Nenhum, data é a chave ideal', 'None, date is the ideal key']], a: 1,
          e: ['Uma boa chave de partição distribui a carga de forma uniforme e combina com os padrões de acesso (ex.: id do usuário, ou hash). Chaves monotônicas concentram a escrita.', 'A good partition key spreads load evenly and matches access patterns (e.g. user id, or a hash). Monotonic keys concentrate writes.'],
          l: 'particionamento-sharding.html' },
        { q: ['No Kafka, qual é a garantia de ordem das mensagens?', 'In Kafka, what ordering guarantee do messages have?'],
          o: [['Ordem global em todo o tópico', 'Global order across the whole topic'], ['Ordem apenas dentro de uma partição; mensagens com a mesma chave vão para a mesma partição', 'Order only within a partition; messages with the same key go to the same partition'], ['Nenhuma ordem', 'No order at all'], ['Ordem por consumer group', 'Order per consumer group']], a: 1,
          e: ['Para manter a ordem dos eventos de um mesmo pedido, use o <code>pedido_id</code> como chave: todos caem na mesma partição, que é um log append-only ordenado.', 'To keep events of the same order in sequence, use <code>order_id</code> as the key: they all land on the same partition, which is an ordered append-only log.'],
          l: 'streaming-dados.html' },
        { q: ['Com semântica <em>at-least-once</em>, o consumidor processa um evento e cai antes de confirmar o offset. O que acontece?', 'With <em>at-least-once</em> semantics, the consumer processes an event and crashes before committing the offset. What happens?'],
          o: [['O evento é perdido', 'The event is lost'], ['O evento é reentregue e processado de novo, então o processamento precisa ser idempotente', 'The event is redelivered and processed again, so processing must be idempotent'], ['O broker garante exactly-once automaticamente', 'The broker guarantees exactly-once automatically'], ['O tópico é bloqueado até intervenção manual', 'The topic is locked until manual intervention']], a: 1,
          e: ['At-least-once troca perda por duplicata. Exactly-once "de verdade" exige transações ou deduplicação por chave no destino.', 'At-least-once trades loss for duplicates. Real "exactly-once" requires transactions or key-based deduplication at the sink.'],
          l: 'streaming-dados.html' },
        { q: ['Recomendações do tipo "amigos de amigos que compraram X" pedem qual tipo de banco NoSQL?', 'Recommendations like "friends of friends who bought X" call for which kind of NoSQL database?'],
          o: [['Chave-valor', 'Key-value'], ['Documento', 'Document'], ['Colunar (wide-column)', 'Wide-column'], ['Grafo', 'Graph']], a: 3,
          e: ['Bancos de grafo tratam relacionamentos como cidadãos de primeira classe: percorrer várias arestas é barato, enquanto em SQL isso vira uma cadeia de JOINs.', 'Graph databases treat relationships as first-class: traversing many edges is cheap, while in SQL it becomes a chain of JOINs.'],
          l: 'nosql.html' }
      ]
    },

    mobile: {
      junior: [
        { q: ['O usuário recebe uma ligação e o app vai para segundo plano. O que ele deve fazer?', 'The user gets a phone call and the app goes to the background. What should it do?'],
          o: [['Nada; o sistema garante que ele continuará vivo', 'Nothing; the OS guarantees it stays alive'], ['Pausar o que não faz sentido em background e salvar o estado, pois o sistema pode encerrar o processo', 'Pause what makes no sense in the background and save state, since the OS may kill the process'], ['Fechar o app com <code>exit()</code>', 'Close the app with <code>exit()</code>'], ['Continuar tocando vídeo e usando GPS normalmente', 'Keep playing video and using GPS as usual']], a: 1,
          e: ['Em background o app pode ser suspenso ou morto a qualquer momento para liberar memória. Salvar rascunhos e pausar trabalho evita perda de dados e desperdício de bateria.', 'In the background the app may be suspended or killed at any time to free memory. Saving drafts and pausing work avoids data loss and battery waste.'],
          l: 'ciclo-de-vida-app.html' },
        { q: ['No Android, ao girar a tela o texto digitado num formulário some. Por quê?', 'On Android, rotating the screen wipes the text typed into a form. Why?'],
          o: [['Bug do sistema operacional', 'An OS bug'], ['A tela é recriada na rotação e o estado não foi salvo/restaurado (ex.: <code>onSaveInstanceState</code>, ViewModel)', 'The screen is recreated on rotation and the state wasn\'t saved/restored (e.g. <code>onSaveInstanceState</code>, ViewModel)'], ['O teclado apaga o campo ao fechar', 'The keyboard clears the field when it closes'], ['Falta de permissão de armazenamento', 'Missing storage permission']], a: 1,
          e: ['Mudança de configuração destrói e recria a Activity por padrão. O estado de tela precisa sobreviver a isso.', 'A configuration change destroys and recreates the Activity by default. Screen state has to survive that.'],
          l: 'ciclo-de-vida-app.html' },
        { q: ['Por que medir tamanhos em dp (Android) ou pt (iOS) em vez de pixels físicos?', 'Why size things in dp (Android) or pt (iOS) instead of physical pixels?'],
          o: [['Porque o app fica mais leve', 'Because the app gets lighter'], ['Porque são unidades lógicas que escalam com a densidade da tela, mantendo o mesmo tamanho físico aproximado', 'Because they are logical units that scale with screen density, keeping roughly the same physical size'], ['Porque pixels não existem em telas OLED', 'Because pixels don\'t exist on OLED screens'], ['Porque as lojas exigem na review', 'Because the stores require it in review']], a: 1,
          e: ['Com pixels fixos, um botão fica enorme numa tela de baixa densidade e minúsculo numa de alta. Unidades lógicas resolvem isso.', 'With fixed pixels, a button is huge on a low-density screen and tiny on a high-density one. Logical units fix that.'],
          l: 'layout-responsivo-mobile.html' },
        { q: ['O que é um deep link?', 'What is a deep link?'],
          o: [['Um link que abre o app direto numa tela ou conteúdo específico', 'A link that opens the app straight into a specific screen or content'], ['Um link para a página do app na loja', 'A link to the app\'s store page'], ['Um atalho para a tela inicial do celular', 'A shortcut on the phone\'s home screen'], ['A pilha de telas do app', 'The app\'s screen stack']], a: 0,
          e: ['Deep links (e universal/app links, que usam URLs https verificadas) levam o usuário ao ponto certo, e o app precisa montar uma pilha de navegação coerente para o "voltar".', 'Deep links (and universal/app links, which use verified https URLs) take the user to the right spot, and the app must build a sensible navigation stack for "back".'],
          l: 'navegacao-mobile.html' }
      ],
      pleno: [
        { q: ['Num app offline-first, o usuário salva uma edição sem rede. O que acontece?', 'In an offline-first app, the user saves an edit with no network. What happens?'],
          o: [['Aparece um erro e a edição é descartada', 'An error is shown and the edit is discarded'], ['A edição é gravada localmente, a UI atualiza e a operação entra numa fila para sincronizar quando a rede voltar', 'The edit is written locally, the UI updates and the operation joins a queue to sync when the network returns'], ['O app espera a rede voltar com um spinner', 'The app waits for the network with a spinner'], ['O app envia por SMS', 'The app sends it via SMS']], a: 1,
          e: ['Offline-first lê e escreve primeiro no banco local; a rede é uma otimização. A fila de operações pendentes é enviada depois, de forma idempotente.', 'Offline-first reads and writes to the local database first; the network is an optimization. The pending operation queue is sent later, idempotently.'],
          l: 'offline-sync.html' },
        { q: ['Qual o risco de resolver conflitos de sincronização com <em>last-write-wins</em>?', 'What is the risk of resolving sync conflicts with <em>last-write-wins</em>?'],
          o: [['Nenhum, é sempre a melhor estratégia', 'None, it is always the best strategy'], ['Descartar silenciosamente a edição de outro dispositivo (perda de dados)', 'Silently discarding another device\'s edit (data loss)'], ['Travar o banco local', 'Locking the local database'], ['Exigir internet o tempo todo', 'Requiring internet all the time']], a: 1,
          e: ['LWW é simples, mas a edição "perdedora" some. Dependendo do dado, vale fazer merge por campo ou pedir para o usuário escolher.', 'LWW is simple, but the "losing" edit disappears. Depending on the data, merge per field or let the user choose.'],
          l: 'offline-sync.html' },
        { q: ['Para rodar a 60 fps, quanto tempo cada frame tem para ser produzido?', 'To run at 60 fps, how much time does each frame have?'],
          o: [['~1 ms', '~1 ms'], ['~16 ms', '~16 ms'], ['~60 ms', '~60 ms'], ['~100 ms', '~100 ms']], a: 1,
          e: ['1000 ms / 60 ≈ 16,7 ms. Trabalho pesado na main/UI thread estoura esse orçamento e gera jank; mova-o para outra thread.', '1000 ms / 60 ≈ 16.7 ms. Heavy work on the main/UI thread blows that budget and causes jank; move it to another thread.'],
          l: 'performance-mobile.html' },
        { q: ['Por que usar RecyclerView / FlatList / LazyColumn para uma lista com milhares de itens?', 'Why use RecyclerView / FlatList / LazyColumn for a list with thousands of items?'],
          o: [['Porque ordenam os itens automaticamente', 'Because they sort items automatically'], ['Porque criam só as views visíveis e as reciclam na rolagem, economizando memória e CPU', 'Because they only create the visible views and recycle them while scrolling, saving memory and CPU'], ['Porque baixam os dados em segundo plano', 'Because they download data in the background'], ['Porque são obrigatórios nas lojas', 'Because the stores require them']], a: 1,
          e: ['Renderizar todos os itens de uma vez estoura memória e trava a rolagem. Virtualização mantém o custo proporcional ao que está na tela.', 'Rendering every item at once blows memory and stalls scrolling. Virtualization keeps the cost proportional to what is on screen.'],
          l: 'performance-mobile.html' }
      ],
      senior: [
        { q: ['Em MVVM, o que torna o ViewModel fácil de testar?', 'In MVVM, what makes the ViewModel easy to test?'],
          o: [['Ele desenha a UI diretamente', 'It draws the UI directly'], ['Não depende de views do framework e recebe dependências (ex.: repositório) injetadas, que podem ser trocadas por fakes', 'It doesn\'t depend on framework views and receives injected dependencies (e.g. a repository) that can be swapped for fakes'], ['Ele acessa o banco diretamente, sem camadas', 'It accesses the database directly, with no layers'], ['Ele é um singleton global', 'It is a global singleton']], a: 1,
          e: ['Separar UI da lógica e injetar dependências permite testar o ViewModel com testes de unidade rápidos, sem emulador.', 'Separating UI from logic and injecting dependencies lets you test the ViewModel with fast unit tests, no emulator needed.'],
          l: 'arquitetura-mobile.html' },
        { q: ['Para enviar um push a um aparelho específico, do que o back-end precisa?', 'To send a push to a specific device, what does the back end need?'],
          o: [['Do número de telefone do usuário', 'The user\'s phone number'], ['Do token do dispositivo, que o app obtém do APNs/FCM e registra no back-end; o back-end envia ao APNs/FCM, que entrega', 'The device token, which the app gets from APNs/FCM and registers with the back end; the back end sends to APNs/FCM, which delivers'], ['De uma conexão aberta direto com o celular', 'An open direct connection to the phone'], ['Do IMEI do aparelho', 'The device\'s IMEI']], a: 1,
          e: ['O servidor nunca fala direto com o aparelho: APNs (Apple) e FCM (Google) são os intermediários. Tokens mudam, então o app deve atualizá-los, e a entrega não é garantida.', 'The server never talks to the device directly: APNs (Apple) and FCM (Google) are the middlemen. Tokens change, so the app must refresh them, and delivery isn\'t guaranteed.'],
          l: 'push-notificacoes.html' },
        { q: ['Qual a diferença entre nome da versão (ex.: 1.4.0) e número de build (versionCode / CFBundleVersion)?', 'What is the difference between the version name (e.g. 1.4.0) and the build number (versionCode / CFBundleVersion)?'],
          o: [['São a mesma coisa', 'They are the same thing'], ['O nome é o que o usuário vê; o número de build é interno e precisa aumentar a cada envio para a loja', 'The name is what users see; the build number is internal and must increase with every store upload'], ['O número de build é opcional', 'The build number is optional'], ['O nome precisa ser sempre um inteiro', 'The name must always be an integer']], a: 1,
          e: ['As lojas usam o número de build para ordenar e aceitar uploads; você pode ter vários builds do mesmo 1.4.0 durante o review.', 'The stores use the build number to order and accept uploads; you can have several builds of the same 1.4.0 during review.'],
          l: 'publicacao-lojas.html' },
        { q: ['Você vai mudar o formato de uma resposta da API usada pelo app. Por que não basta lançar o app atualizado junto?', 'You are changing the format of an API response the app uses. Why isn\'t shipping an updated app at the same time enough?'],
          o: [['Porque a loja demora a aprovar texto novo', 'Because the store takes a while to approve new copy'], ['Porque muitos usuários continuam em versões antigas por muito tempo, então a API precisa ser retrocompatível ou versionada', 'Because many users stay on old versions for a long time, so the API must be backward compatible or versioned'], ['Porque apps não podem consumir JSON', 'Because apps can\'t consume JSON'], ['Basta sim, todos atualizam no mesmo dia', 'It is enough; everyone updates the same day']], a: 1,
          e: ['Diferente da web, você não controla quando o usuário atualiza. Mantenha contratos antigos, versione a API e use rollout gradual e, se preciso, atualização forçada.', 'Unlike the web, you don\'t control when users update. Keep old contracts, version the API, and use gradual rollout and, if needed, forced updates.'],
          l: 'publicacao-lojas.html' }
      ]
    }
  };

  var data = Q[track];
  if (!data) return;
  var arts = ART[track] || {};
  var KEY = 'dg-quiz-' + track;
  var ASSESS_KEY = 'dg-assess-' + track;
  var uid = 'tq-' + track;

  function L(pt, en) { return '<span data-lang="pt">' + pt + '</span><span data-lang="en">' + (en == null ? pt : en) + '</span>'; }
  function lvName(key) { for (var i = 0; i < LEVELS.length; i++) if (LEVELS[i][0] === key) return L(LEVELS[i][1], LEVELS[i][2]); return key; }
  function artLink(file) {
    var t = arts[file] || [file, file];
    return '<a href="' + file + '">' + L(t[0], t[1]) + '</a>';
  }
  function shuffle(a) {
    for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  }
  function load(k) { try { return JSON.parse(localStorage.getItem(k) || '{}') || {}; } catch (e) { return {}; } }
  function save(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }

  var body = host.querySelector('.track-quiz-body') || host;
  var state = null; // { list: [{lv, i, q}], pos, answers: [] }

  /* ---------- Tela inicial ---------- */
  function renderStart() {
    var saved = load(KEY);
    var html = '<form class="tq-start" novalidate>' +
      '<fieldset class="tq-levels"><legend>' + L('Escolha o nível', 'Choose a level') + '</legend>' +
      '<label class="tq-chip"><input type="radio" name="' + uid + '-lv" value="all" checked> <span>' + L('Todos (12 perguntas)', 'All (12 questions)') + '</span></label>';
    LEVELS.forEach(function (lv) {
      var s = saved[lv[0]];
      var badge = s ? ' <span class="tq-badge' + (s.score === s.total ? ' is-full' : '') + '">' + s.score + '/' + s.total + '</span>' : '';
      html += '<label class="tq-chip"><input type="radio" name="' + uid + '-lv" value="' + lv[0] + '"> <span>' + L(lv[1], lv[2]) + ' ' + L('(4 perguntas)', '(4 questions)') + badge + '</span></label>';
    });
    html += '</fieldset>';
    if (Object.keys(saved).length) {
      html += '<p class="tq-last">' + L('Último resultado salvo neste navegador:', 'Last result saved in this browser:') + ' ' +
        LEVELS.filter(function (lv) { return saved[lv[0]]; }).map(function (lv) {
          return lvName(lv[0]) + ' ' + saved[lv[0]].score + '/' + saved[lv[0]].total;
        }).join(' · ') + '</p>';
    }
    html += '<button type="submit" class="tq-btn tq-primary"><i class="bx bx-play" aria-hidden="true"></i> ' + L('Começar quiz', 'Start quiz') + '</button></form>';
    body.innerHTML = html;
    body.querySelector('form').addEventListener('submit', function (ev) {
      ev.preventDefault();
      var sel = body.querySelector('input[name="' + uid + '-lv"]:checked');
      start(sel ? sel.value : 'all');
    });
  }

  function start(level) {
    var list = [];
    LEVELS.forEach(function (lv) {
      if (level !== 'all' && level !== lv[0]) return;
      (data[lv[0]] || []).forEach(function (q, i) { list.push({ lv: lv[0], i: i, q: q }); });
    });
    state = { list: list, pos: 0, answers: [] };
    renderQuestion(true);
  }

  /* ---------- Pergunta ---------- */
  function renderQuestion(focus) {
    var item = state.list[state.pos];
    var q = item.q;
    var name = uid + '-q' + state.pos;
    var n = state.pos + 1, total = state.list.length;
    var html = '<div class="tq-progress" aria-hidden="true"><span style="width:' + Math.round((state.pos / total) * 100) + '%"></span></div>' +
      '<form class="tq-question" novalidate>' +
      '<fieldset><legend tabindex="-1">' +
      '<span class="tq-meta">' + L('Pergunta', 'Question') + ' ' + n + '/' + total + ' · ' + lvName(item.lv) + '</span>' +
      '<span class="tq-q">' + L(q.q[0], q.q[1]) + '</span></legend>' +
      '<div class="tq-options">';
    // embaralha a ordem de exibição (o value do radio mantém o índice original)
    shuffle(q.o.map(function (_, k) { return k; })).forEach(function (k) {
      var opt = q.o[k];
      html += '<label class="tq-option"><input type="radio" name="' + name + '" value="' + k + '"> <span>' + L(opt[0], opt[1]) + '</span></label>';
    });
    html += '</div></fieldset>' +
      '<div class="tq-feedback" role="status" aria-live="polite"></div>' +
      '<div class="tq-actions">' +
      '<button type="submit" class="tq-btn tq-primary tq-answer">' + L('Responder', 'Check answer') + '</button>' +
      '<button type="button" class="tq-btn tq-primary tq-next" hidden>' + (n < total ? L('Próxima pergunta', 'Next question') : L('Ver resultado', 'See results')) + ' <i class="bx bx-right-arrow-alt" aria-hidden="true"></i></button>' +
      '<button type="button" class="tq-btn tq-link tq-cancel">' + L('Sair do quiz', 'Quit quiz') + '</button>' +
      '</div></form>';
    body.innerHTML = html;
    var form = body.querySelector('form');
    var fb = body.querySelector('.tq-feedback');
    var nextBtn = body.querySelector('.tq-next');
    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var sel = form.querySelector('input[name="' + name + '"]:checked');
      if (!sel) {
        fb.className = 'tq-feedback is-warn';
        fb.innerHTML = L('Escolha uma alternativa antes de responder.', 'Pick an option before checking.');
        var first = form.querySelector('input[type="radio"]');
        if (first) first.focus();
        return;
      }
      var chosen = +sel.value, ok = chosen === q.a;
      state.answers[state.pos] = ok;
      [].forEach.call(form.querySelectorAll('input[type="radio"]'), function (r) {
        r.disabled = true;
        var lab = r.closest('.tq-option');
        if (+r.value === q.a) lab.classList.add('is-correct');
        else if (r === sel) lab.classList.add('is-wrong');
      });
      fb.className = 'tq-feedback ' + (ok ? 'is-ok' : 'is-bad');
      fb.innerHTML = '<p class="tq-verdict">' + (ok ? '<i class="bx bx-check-circle" aria-hidden="true"></i> ' + L('Correto!', 'Correct!')
        : '<i class="bx bx-x-circle" aria-hidden="true"></i> ' + L('Não foi dessa vez.', 'Not quite.') + ' ' + L('Resposta certa:', 'Right answer:') + ' ' + L(q.o[q.a][0], q.o[q.a][1])) + '</p>' +
        '<p>' + L(q.e[0], q.e[1]) + '</p>' +
        '<p class="tq-more"><i class="bx bx-book-open" aria-hidden="true"></i> ' + L('Saiba mais:', 'Learn more:') + ' ' + artLink(q.l) + '</p>';
      body.querySelector('.tq-answer').hidden = true;
      nextBtn.hidden = false;
      nextBtn.focus();
    });
    nextBtn.addEventListener('click', function () {
      if (state.pos < state.list.length - 1) { state.pos++; renderQuestion(true); }
      else renderResults();
    });
    body.querySelector('.tq-cancel').addEventListener('click', function () { state = null; renderStart(); focusTop(); });
    if (focus) { var lg = body.querySelector('legend'); if (lg) lg.focus({ preventScroll: false }); }
  }

  function focusTop() { var el = body.querySelector('legend, h4, button'); if (el) { if (!el.hasAttribute('tabindex') && el.tagName !== 'BUTTON') el.setAttribute('tabindex', '-1'); el.focus(); } }

  /* ---------- Resultado ---------- */
  function renderResults() {
    var saved = load(KEY);
    var per = {};
    state.list.forEach(function (it, idx) {
      var r = per[it.lv] || (per[it.lv] = { score: 0, total: 0, wrong: [] });
      r.total++;
      if (state.answers[idx]) r.score++; else r.wrong.push(it.i);
    });
    var totalOk = 0, totalQ = 0;
    var html = '<div class="tq-results"><h4 tabindex="-1">' + L('Resultado', 'Results') + '</h4><div class="tq-result-grid">';
    LEVELS.forEach(function (lv) {
      var r = per[lv[0]];
      if (!r) return;
      totalOk += r.score; totalQ += r.total;
      saved[lv[0]] = { score: r.score, total: r.total, wrong: r.wrong, date: new Date().toISOString().slice(0, 10) };
      var full = r.score === r.total;
      html += '<div class="tq-result lvl-' + lv[0] + (full ? ' is-full' : '') + '">' +
        '<h5>' + lvName(lv[0]) + '</h5>' +
        '<p class="tq-score">' + L('Você acertou', 'You got') + ' <strong>' + r.score + '/' + r.total + '</strong>' + L('', ' right') + '</p>';
      if (r.wrong.length) {
        var files = [];
        r.wrong.forEach(function (i) { var f = data[lv[0]][i].l; if (files.indexOf(f) < 0) files.push(f); });
        html += '<p class="tq-review-title">' + L('Revise estes artigos:', 'Review these articles:') + '</p><ul class="tq-review">' +
          files.map(function (f) { return '<li>' + artLink(f) + '</li>'; }).join('') + '</ul>';
      } else {
        html += '<p class="tq-perfect">' + L('Gabaritou! Que tal registrar isso na autoavaliação?', 'Perfect score! Want to record it in the self-assessment?') + '</p>' +
          '<button type="button" class="tq-btn tq-primary tq-mark" data-level="' + lv[0] + '"><i class="bx bx-list-check" aria-hidden="true"></i> ' +
          L('Marcar ' + lv[1] + ' na autoavaliação', 'Mark ' + lv[2] + ' in the self-assessment') + '</button>' +
          '<p class="tq-mark-status" role="status" aria-live="polite"></p>';
      }
      html += '</div>';
    });
    html += '</div>';
    if (totalQ > 4) html += '<p class="tq-total">' + L('Total', 'Total') + ': <strong>' + totalOk + '/' + totalQ + '</strong></p>';
    html += '<div class="tq-actions"><button type="button" class="tq-btn tq-restart"><i class="bx bx-refresh" aria-hidden="true"></i> ' + L('Refazer o quiz', 'Retake the quiz') + '</button></div></div>';
    save(KEY, saved);
    body.innerHTML = html;
    [].forEach.call(body.querySelectorAll('.tq-mark'), function (btn) {
      btn.addEventListener('click', function () { markAssess(btn); });
    });
    body.querySelector('.tq-restart').addEventListener('click', function () { state = null; renderStart(); focusTop(); });
    body.querySelector('.tq-results h4').focus();
  }

  function markAssess(btn) {
    var lv = btn.getAttribute('data-level');
    var assessed = load(ASSESS_KEY);
    var n = 0;
    for (var i = 0; i < ASSESS_ITEMS; i++) {
      var id = track + '-' + lv + '-' + i;
      var cb = document.getElementById(id);
      if (cb) {
        if (!cb.checked) { cb.checked = true; cb.dispatchEvent(new Event('change', { bubbles: true })); n++; }
      } else if (!assessed[id]) { assessed[id] = 1; n++; }
    }
    // fallback caso a checklist não esteja na tela (o 'change' já salva quando está)
    if (!document.getElementById(track + '-' + lv + '-0')) save(ASSESS_KEY, assessed);
    btn.disabled = true;
    var st = btn.parentNode.querySelector('.tq-mark-status');
    if (st) {
      var names = LEVELS.filter(function (l) { return l[0] === lv; })[0];
      st.innerHTML = '<i class="bx bx-check" aria-hidden="true"></i> ' +
        L('Itens de ' + names[1] + ' marcados na autoavaliação' + (n ? '' : ' (já estavam)') + '.',
          names[2] + ' items marked in the self-assessment' + (n ? '' : ' (already were)') + '.');
    }
  }

  renderStart();
})();
