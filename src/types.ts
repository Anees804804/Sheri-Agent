export interface FormalComplaint {
  subject: string;
  body: string;
}

export interface LegalAnalysis {
  category: string;
  legal_guidance_urdu: string;
  formal_complaint: FormalComplaint;
  suggested_authority: string;
  next_steps: string[];
}

export type ClassificationType = 
  | 'telecom'
  | 'banking'
  | 'electricity'
  | 'theft'
  | 'fraud'
  | 'online_shopping'
  | 'harassment'
  | 'general';
