import React from 'react';
import { createClient } from '@/lib/supabase/server';
import { fetchPublishedBlogs, mapDbBlogToPost } from '@/lib/blog-utils';
import BlogPageClient from './BlogPageClient';

export const dynamic = 'force-dynamic';

export default async function BlogPage() {
    const supabase = await createClient();
    const dbBlogs = await fetchPublishedBlogs(supabase);
    const allPosts = dbBlogs.map(mapDbBlogToPost);

    const latestPosts = allPosts.slice(0, 5);
    const remainingPosts = allPosts.slice(5);

    return <BlogPageClient latestPosts={latestPosts} remainingPosts={remainingPosts} />;
}
