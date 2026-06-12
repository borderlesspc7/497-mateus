"use client";

import {
  addDoc,
  collection,
  onSnapshot,
  orderBy,
  query,
  type Unsubscribe,
} from "firebase/firestore";
import { ensureFirebaseAuth, getClientFirestore } from "@/lib/firebase/client";
import {
  COLLECTIONS,
  VENDA_SUBCOLLECTIONS,
  nowIso,
  type HistoricoAtendimentoUniversalDoc,
} from "@/lib/firestore/types";
import type {
  HistoricoAtendimentoUniversalRow,
  TipoRegistroAtendimento,
} from "@/lib/types/domain";

async function getDb() {
  await ensureFirebaseAuth();
  const db = getClientFirestore();
  if (!db) throw new Error("Firestore indisponível.");
  return db;
}

export function subscribeHistoricoAtendimentoUniversal(
  vendaId: string,
  onChange: (items: HistoricoAtendimentoUniversalRow[]) => void,
  onError?: (error: Error) => void,
): Unsubscribe {
  let unsubscribe: Unsubscribe = () => {};

  void ensureFirebaseAuth()
    .then(() => {
      const db = getClientFirestore();
      if (!db) throw new Error("Firestore indisponível.");
      const q = query(
        collection(
          db,
          COLLECTIONS.vendas,
          vendaId,
          VENDA_SUBCOLLECTIONS.historico_atendimento,
        ),
        orderBy("dataRegistro", "desc"),
      );
      unsubscribe = onSnapshot(
        q,
        (snap) => {
          const items = snap.docs.map((item) => {
            const data = item.data() as HistoricoAtendimentoUniversalDoc;
            return {
              id: item.id,
              dataRegistro: data.dataRegistro,
              tipoRegistro: data.tipoRegistro,
              observacao: data.observacao,
            };
          });
          onChange(items);
        },
        (error) => onError?.(error),
      );
    })
    .catch((error: unknown) => {
      onError?.(error instanceof Error ? error : new Error("Falha ao carregar histórico."));
    });

  return () => unsubscribe();
}

export async function addHistoricoAtendimentoUniversal(
  vendaId: string,
  numeroContrato: string,
  tipoRegistro: TipoRegistroAtendimento,
  observacao: string,
): Promise<void> {
  const trimmed = observacao.trim();
  if (!trimmed) throw new Error("Informe a observação do registro.");
  const contrato = numeroContrato.trim();
  if (!contrato) throw new Error("Informe o número do contrato.");

  const db = await getDb();
  const docData: HistoricoAtendimentoUniversalDoc = {
    numeroContrato: contrato,
    dataRegistro: nowIso(),
    tipoRegistro,
    observacao: trimmed,
  };
  await addDoc(
    collection(
      db,
      COLLECTIONS.vendas,
      vendaId,
      VENDA_SUBCOLLECTIONS.historico_atendimento,
    ),
    docData,
  );
}
