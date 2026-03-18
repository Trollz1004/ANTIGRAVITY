export interface VolunteerImpactResponse {
  total_opportunities: number;
  total_signups: number;
  total_hours_committed: number;
  unique_organizations: number;
  unique_volunteers: number;
  category_breakdown: Record<string, number>;
  top_organizations: Array<{
    name: string;
    signups: number;
    hours: number;
  }>;
  local_opportunities: number;
}
