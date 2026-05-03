// src/components/seo/JsonLd.tsx
import React from 'react';

type Props = { data: unknown | null };

export default function JsonLd({ data }: Props) {
  if (data == null) return null;
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
