"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Card } from "@/components/ui/card";

interface Post {
    id: string;
    title: string;
    summary: string;
    label: string;
    author: string;
    published: string;
    url: string;
    image: string;
    tags?: string[];
}

interface Blog8Props {
    heading?: string;
    description?: string;
    posts?: Post[];
}

const Blog8 = ({
    heading = "Blog Posts",
    description = "Discover the latest insights and tutorials about modern web development, UI design, and component-driven architecture.",
    posts = [],
}: Blog8Props) => {
    return (
        <section className="pt-32 pb-20" style={{ backgroundColor: 'var(--light-grey, #F6F6F5)' }}>
            <div className="flex flex-col items-center gap-16 max-w-[1600px] mx-auto px-[clamp(1.5rem,4vw,4rem)]">
                {heading && (
                    <div className="text-center">
                        <h2
                            className="mx-auto mb-4 text-pretty text-2xl font-semibold md:text-3xl lg:max-w-3xl"
                            style={{
                                fontFamily: 'var(--font-heading)',
                                color: '#1a1a1a'
                            }}
                        >
                            {heading}
                        </h2>
                        <p
                            className="mx-auto max-w-2xl text-base md:text-lg"
                            style={{ color: '#555555' }}
                        >
                            {description}
                        </p>
                    </div>
                )}

                <div className="grid gap-y-10 sm:grid-cols-12 sm:gap-y-12 md:gap-y-16 lg:gap-y-20 w-full">
                    {posts.map((post) => (
                        <Card
                            key={post.id}
                            className="order-last border-0 bg-transparent shadow-none sm:order-first sm:col-span-12 lg:col-span-10 lg:col-start-2"
                        >
                            <div className="grid gap-y-6 sm:grid-cols-10 sm:gap-x-5 sm:gap-y-0 md:items-center md:gap-x-8 lg:gap-x-12">
                                <div className="sm:col-span-5">
                                    <div className="mb-4 md:mb-6">
                                        <div
                                            className="flex flex-wrap gap-3 text-xs uppercase tracking-wider md:gap-5 lg:gap-6"
                                            style={{ color: 'var(--gold, #BFA270)' }}
                                        >
                                            {post.tags?.map((tag) => <span key={tag}>{tag}</span>)}
                                        </div>
                                    </div>
                                    <h3
                                        className="text-xl font-semibold md:text-2xl lg:text-3xl"
                                        style={{ color: '#1a1a1a' }}
                                    >
                                        <Link
                                            href={post.url}
                                            className="hover:underline hover:text-[var(--dark-turquoise)]"
                                        >
                                            {post.title}
                                        </Link>
                                    </h3>
                                    <p
                                        className="mt-4 md:mt-5 leading-relaxed"
                                        style={{ color: '#555555' }}
                                    >
                                        {post.summary}
                                    </p>
                                    <div
                                        className="mt-6 flex items-center space-x-4 text-sm md:mt-8"
                                        style={{ color: '#777777' }}
                                    >
                                        <span>{post.author}</span>
                                        <span>•</span>
                                        <span>{post.published}</span>
                                    </div>
                                    <div className="mt-6 flex items-center space-x-2 md:mt-8">
                                        <Link
                                            href={post.url}
                                            className="inline-flex items-center font-semibold hover:underline md:text-base transition-all"
                                            style={{ color: 'var(--dark-turquoise, #183C38)' }}
                                        >
                                            <span>Read more</span>
                                            <ArrowRight className="ml-2 size-4 transition-transform" />
                                        </Link>
                                    </div>
                                </div>
                                <div className="order-first sm:order-last sm:col-span-5">
                                    <Link href={post.url} className="block">
                                        <div className="aspect-[16/9] overflow-clip rounded-lg border border-gray-200 bg-white">
                                            <Image
                                                src={post.image}
                                                alt={post.title}
                                                width={640}
                                                height={360}
                                                className="h-full w-full object-cover transition-opacity duration-200 hover:opacity-70"
                                            />
                                        </div>
                                    </Link>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            </div>
        </section>
    );
};

export { Blog8 };
