-- CreateTable
CREATE TABLE "Administradora" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nome" TEXT NOT NULL,
    "cnpj" TEXT NOT NULL,
    "telefone" TEXT,
    "email" TEXT,
    "contatoPrincipal" TEXT,
    "enderecoLogradouro" TEXT,
    "enderecoNumero" TEXT,
    "enderecoComplemento" TEXT,
    "enderecoBairro" TEXT,
    "enderecoCidade" TEXT,
    "enderecoUf" TEXT,
    "enderecoCep" TEXT,
    "regrasOperacionaisJson" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Plano" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "administradoraId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "tipoBem" TEXT NOT NULL,
    "valorCreditoCentavos" INTEGER,
    "regrasComissaoJson" TEXT,
    "regrasRecebimentoJson" TEXT,
    "regrasEstornoJson" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Plano_administradoraId_fkey" FOREIGN KEY ("administradoraId") REFERENCES "Administradora" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Venda" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "administradoraId" TEXT NOT NULL,
    "planoId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'RASCUNHO',
    "titulo" TEXT NOT NULL,
    "descricao" TEXT,
    "valorCentavos" INTEGER,
    "dataVenda" DATETIME,
    "observacoes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Venda_administradoraId_fkey" FOREIGN KEY ("administradoraId") REFERENCES "Administradora" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Venda_planoId_fkey" FOREIGN KEY ("planoId") REFERENCES "Plano" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Administradora_cnpj_key" ON "Administradora"("cnpj");
