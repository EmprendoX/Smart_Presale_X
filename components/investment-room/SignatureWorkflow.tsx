"use client";

import { useMemo, useState } from "react";
import { ProjectDocument } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

const providers = [
  {
    id: "docusign",
    label: "DocuSign",
    description: "Envío masivo, plantillas y gestión de sobres con cumplimiento global.",
    cta: "https://demo.docusign.net/Signing/?env=demo"
  },
  {
    id: "hellosign",
    label: "Dropbox Sign",
    description: "Experiencias embebidas y seguimiento granular con recordatorios automáticos.",
    cta: "https://sign.dropbox.com/request-signature"
  }
] as const;

export type SignatureWorkflowProps = {
  documents: ProjectDocument[];
  projectName: string;
};

type Status = "idle" | "sending" | "sent" | "signed";

type StateMap = Record<string, Status>;

const statusLabel: Record<Status, string> = {
  idle: "Sin enviar",
  sending: "Enviando...",
  sent: "Enviado",
  signed: "Firmado"
};

const statusColor: Record<Status, "neutral" | "yellow" | "green"> = {
  idle: "neutral",
  sending: "yellow",
  sent: "yellow",
  signed: "green"
};

export function SignatureWorkflow({ documents, projectName }: SignatureWorkflowProps) {
  const [provider, setProvider] = useState<typeof providers[number]["id"]>(providers[0].id);
  const [statuses, setStatuses] = useState<StateMap>(() => {
    const initial: StateMap = {};
    documents.forEach(doc => { initial[doc.id] = "idle"; });
    return initial;
  });

  const completed = useMemo(
    () => Object.values(statuses).filter(status => status === "signed").length,
    [statuses]
  );

  const handleSend = (docId: string) => {
    setStatuses(prev => ({ ...prev, [docId]: "sending" }));
    setTimeout(() => {
      setStatuses(prev => ({ ...prev, [docId]: "sent" }));
    }, 600);
  };

  const handleMarkSigned = (docId: string) => {
    setStatuses(prev => ({ ...prev, [docId]: "signed" }));
  };

  const currentProvider = providers.find(item => item.id === provider) ?? providers[0];

  return (
    <div className="space-y-4">
      <header className="space-y-1">
        <h3 className="text-lg font-semibold">Flujos de firma digital</h3>
        <p className="text-sm text-neutral-600">
          Conecta {currentProvider.label} para enviar documentación crítica del proyecto {projectName} y conservar trazabilidad auditada.
        </p>
      </header>

      <div className="flex flex-wrap gap-2">
        {providers.map(item => (
          <Button
            key={item.id}
            variant={item.id === provider ? "primary" : "secondary"}
            size="sm"
            onClick={() => setProvider(item.id)}
          >
            {item.label}
          </Button>
        ))}
      </div>

      <div className="rounded-lg border p-4 bg-neutral-50">
        <div className="flex flex-col gap-2 text-sm text-neutral-700">
          <p>{currentProvider.description}</p>
          <a
            href={currentProvider.cta}
            target="_blank"
            rel="noreferrer"
            className="text-brand text-xs hover:underline"
          >
            Ir al panel de {currentProvider.label}
          </a>
        </div>
      </div>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold text-neutral-700">Documentos listos</h4>
          <Badge color={completed === documents.length && documents.length > 0 ? "green" : "neutral"}>
            {completed}/{documents.length} firmados
          </Badge>
        </div>

        <div className="space-y-2">
          {documents.map(doc => {
            const status = statuses[doc.id] ?? "idle";
            return (
              <div key={doc.id} className="flex flex-col gap-2 rounded-md border p-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="text-sm font-medium">{doc.title}</div>
                  <div className="text-xs text-neutral-500">{doc.fileName}</div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge color={statusColor[status]}>{statusLabel[status]}</Badge>
                  {status === "idle" && (
                    <Button size="sm" onClick={() => handleSend(doc.id)}>
                      Enviar a {currentProvider.label}
                    </Button>
                  )}
                  {status === "sent" && (
                    <Button variant="secondary" size="sm" onClick={() => handleMarkSigned(doc.id)}>
                      Marcar como firmado
                    </Button>
                  )}
                  {status === "signed" && (
                    <span className="text-xs text-neutral-500">Completado</span>
                  )}
                  {status === "sending" && (
                    <span className="text-xs text-neutral-500">Sincronizando...</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
