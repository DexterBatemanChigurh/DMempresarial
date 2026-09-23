/**
 * Interface de envio de e-mail (docs/03, parte 22-23). O provedor é decisão aberta (seção 34);
 * hoje só existe o adaptador de log, que nunca envia nada de verdade — mesmo desenho do
 * `StoragePort` (interface primeiro, adaptador local/nulo antes de escolher provedor externo).
 */
export type EmailMessage = {
  to: string;
  subject: string;
  text: string;
};

export type EmailPort = {
  /** Lança se não conseguir enviar — quem chama decide o que fazer (ex.: deixar `notified_at`
   * nulo para o cron tentar de novo). */
  send(message: EmailMessage): Promise<void>;
};
