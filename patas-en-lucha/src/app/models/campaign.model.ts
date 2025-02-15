export type CampaignStatus = 'pending' | 'approved' | 'rejected';

export interface Campaign {
  id?: number;
  title: string;
  description: string;
  goal_amount: number;
  current_amount: number;
  amount_raised?: number;
  image_urls?: string[];  
  user_id?: number;
  creator_name?: string;
  status: CampaignStatus;
  created_at?: Date;
  updated_at?: Date;
  end_date?: string;
  category?: string;
  medical_proof?: string;
  proof_type?: string;
  proof_description?: string;
  medical_proof_verified?: boolean;
}
