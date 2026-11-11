import type { Transition } from "@acme/domain";
import type { ReportRepository, StatusHistoryRepository } from "../ports";

/**
 * Enregistre le nouvel état ET la ligne d'historique : chaque changement
 * de statut apparaît dans l'historique. (MongoDB sans transaction : on écrit
 * l'historique d'abord — mieux vaut une trace sans effet qu'un effet sans trace.)
 */
export async function persistTransition(
  deps: { reports: ReportRepository; history: StatusHistoryRepository },
  { report, change }: Transition,
): Promise<void> {
  await deps.history.add(change);
  await deps.reports.save(report);
}
