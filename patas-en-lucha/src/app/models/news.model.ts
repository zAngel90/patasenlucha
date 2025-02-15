export interface News {
    id?: number;
    title: string;
    content: string;
    user_id?: number;
    creator_name?: string;
    created_at?: Date;
    updated_at?: Date;
    status?: 'draft' | 'published';
    image_urls?: string[];
} 