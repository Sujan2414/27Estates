import { SupabaseClient } from '@supabase/supabase-js';
import { BlogPost } from './blog-data';

export interface DbBlog {
    id: string;
    slug: string;
    title: string;
    excerpt: string | null;
    content: string;
    author: string;
    author_image: string | null;
    cover_image: string | null;
    tags: string[];
    reading_time: string | null;
    published_at: string | null;
    created_at: string;
    updated_at: string;
}

function formatDate(dateStr: string): string {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function mapDbBlogToPost(dbBlog: DbBlog): BlogPost {
    const image = dbBlog.cover_image || '';
    return {
        id: dbBlog.id,
        slug: dbBlog.slug,
        title: dbBlog.title,
        excerpt: dbBlog.excerpt || '',
        content: dbBlog.content,
        author: dbBlog.author,
        heroImage: image,
        thumbnailImage: image,
        contentImages: [],
        category: dbBlog.tags?.[0] || 'General',
        date: formatDate(dbBlog.published_at || dbBlog.created_at),
        readTime: dbBlog.reading_time || '5 min read',
        tags: dbBlog.tags || [],
        relatedSlugs: [],
    };
}

export async function fetchPublishedBlogs(
    supabase: SupabaseClient,
    limit?: number
): Promise<DbBlog[]> {
    let query = supabase
        .from('blogs')
        .select('*')
        .not('published_at', 'is', null)
        .order('published_at', { ascending: false });

    if (limit) {
        query = query.limit(limit);
    }

    const { data, error } = await query;
    if (error) {
        console.error('Error fetching blogs:', error);
        return [];
    }
    return (data as DbBlog[]) || [];
}

export async function fetchBlogBySlug(
    supabase: SupabaseClient,
    slug: string
): Promise<DbBlog | null> {
    const { data, error } = await supabase
        .from('blogs')
        .select('*')
        .eq('slug', slug)
        .single();

    if (error || !data) return null;
    return data as DbBlog;
}

export async function fetchRelatedPosts(
    supabase: SupabaseClient,
    currentSlug: string,
    tags: string[],
    limit: number = 3
): Promise<BlogPost[]> {
    const { data, error } = await supabase
        .from('blogs')
        .select('*')
        .not('published_at', 'is', null)
        .neq('slug', currentSlug)
        .overlaps('tags', tags)
        .order('published_at', { ascending: false })
        .limit(limit);

    if (error || !data) return [];
    return (data as DbBlog[]).map(mapDbBlogToPost);
}
