export type FeeRefundPolicy = "First payout" | "Third payout" | "Fourth payout" | "Never";
export type CycleStatus = "Active" | "Completed" | "Abandoned";
export type PhaseType = "1st Step" | "2nd Step" | "Funded Hedge";
export type PhaseStatus = "Pass" | "Fail" | "Active" | "Not Started";

export interface Provider {
  id: string;
  name: string;
  fee_refund_policy: FeeRefundPolicy;
  notes: string;
}

export interface Client {
  id: string;
  name: string;
  notes: string;
}

export interface Cycle {
  id: string;
  cycle_id: number;
  cycle_name: string;
  client_id: string;
  provider_id: string;
  account_size: number;
  challenge_fee: number;
  start_date: string;
  end_date: string;
  cycle_status: CycleStatus;
  notes: string;
}

export interface Phase {
  id: string;
  cycle_id: string;
  phase_type: PhaseType;
  order: number;
  start_date: string;
  end_date: string;
  status: PhaseStatus;
  real_deposit: number;
  bonus_used: number;
  broker_pl_phase: number;
  bonus_lost_phase: number;
  trades_executed: number;
  recovery_rate_set: number;
  recovery_rate_real: number;
  notes: string;
}

export interface Payout {
  id: string;
  cycle_id: string;
  payout_number: number;
  amount: number;
  date: string;
  includes_fee_refund: boolean;
  fee_refund_amount: number;
  notes: string;
}

// Computed types
export interface CycleWithCalculations extends Cycle {
  phases: Phase[];
  payouts: Payout[];
  client?: Client;
  provider?: Provider;
  total_real_broker_losses: number;
  total_bonus_lost: number;
  total_bonus_used: number;
  total_payouts_received: number;
  total_fee_refunds: number;
  fee_refunded: boolean;
  break_even_reached: boolean;
  payout_at_break_even: number | null;
  cycle_pl: number;
  duration_days: number | null;
  distance_to_break_even: number;
}
