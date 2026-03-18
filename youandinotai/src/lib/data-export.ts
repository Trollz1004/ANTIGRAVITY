/**
 * Helper to download privacy-compliant data exports.
 */

export interface ExportData {
  user_id: string;
  email: string;
  display_name: string;
  message_count: number;
  match_count: number;
  signup_count: number;
  exported_at: string;
  version: string;
}

/**
 * Downloads a JSON blob to the user's machine.
 */
export function downloadExport(data: ExportData, filename?: string) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  
  const dateStr = new Date().toISOString().split('T')[0];
  link.href = url;
  link.download = filename || `youandinotai-export-${dateStr}.json`;
  
  document.body.appendChild(link);
  link.click();
  
  // Cleanup
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Formats the raw backend status for the UI.
 */
export function formatExportStatus(status: string): string {
  switch (status) {
    case 'export_queued':
      return 'Request submitted. Preparing your archive...';
    case 'export_ready':
      return 'Your data export is ready for download.';
    default:
      return 'No active export requests.';
  }
}
