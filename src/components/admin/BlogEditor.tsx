'use client'

import { useRef, useEffect, useCallback } from 'react'
import {
    Heading1, Heading2, Heading3, Pilcrow,
    Bold, Italic, Underline, List, ListOrdered,
    Quote, Link2, ImagePlus, Minus,
} from 'lucide-react'

interface BlogEditorProps {
    value: string
    onChange: (html: string) => void
}

export default function BlogEditor({ value, onChange }: BlogEditorProps) {
    const editorRef = useRef<HTMLDivElement>(null)
    const isInternalChange = useRef(false)

    // Sync external value into editor only when it's not an internal change
    useEffect(() => {
        if (editorRef.current && !isInternalChange.current) {
            if (editorRef.current.innerHTML !== value) {
                editorRef.current.innerHTML = value
            }
        }
        isInternalChange.current = false
    }, [value])

    const handleInput = useCallback(() => {
        if (editorRef.current) {
            isInternalChange.current = true
            onChange(editorRef.current.innerHTML)
        }
    }, [onChange])

    const exec = (command: string, val?: string) => {
        editorRef.current?.focus()
        document.execCommand(command, false, val)
        handleInput()
    }

    const insertHeading = (level: 'H1' | 'H2' | 'H3') => {
        editorRef.current?.focus()
        document.execCommand('formatBlock', false, level)
        handleInput()
    }

    const insertLink = () => {
        const url = prompt('Enter URL:')
        if (url) exec('createLink', url)
    }

    const insertImage = () => {
        const url = prompt('Enter image URL:')
        if (url) exec('insertImage', url)
    }

    const insertHR = () => {
        exec('insertHTML', '<hr/>')
    }

    const tools = [
        { icon: Heading1, label: 'Heading 1', action: () => insertHeading('H1'), group: 'block' },
        { icon: Heading2, label: 'Heading 2', action: () => insertHeading('H2'), group: 'block' },
        { icon: Heading3, label: 'Heading 3', action: () => insertHeading('H3'), group: 'block' },
        { icon: Pilcrow, label: 'Paragraph', action: () => { editorRef.current?.focus(); document.execCommand('formatBlock', false, 'P'); handleInput() }, group: 'block' },
        { icon: Bold, label: 'Bold', action: () => exec('bold'), group: 'inline' },
        { icon: Italic, label: 'Italic', action: () => exec('italic'), group: 'inline' },
        { icon: Underline, label: 'Underline', action: () => exec('underline'), group: 'inline' },
        { icon: List, label: 'Bullet List', action: () => exec('insertUnorderedList'), group: 'list' },
        { icon: ListOrdered, label: 'Numbered List', action: () => exec('insertOrderedList'), group: 'list' },
        { icon: Quote, label: 'Blockquote', action: () => { editorRef.current?.focus(); document.execCommand('formatBlock', false, 'BLOCKQUOTE'); handleInput() }, group: 'list' },
        { icon: Minus, label: 'Divider', action: insertHR, group: 'insert' },
        { icon: Link2, label: 'Insert Link', action: insertLink, group: 'insert' },
        { icon: ImagePlus, label: 'Insert Image', action: insertImage, group: 'insert' },
    ]

    // Group tools by their group for visual separator
    const groups = ['block', 'inline', 'list', 'insert']
    const groupedTools = groups.map(g => tools.filter(t => t.group === g))

    return (
        <div style={{ border: '1px solid #e5e7eb', borderRadius: '0.75rem', overflow: 'hidden', backgroundColor: '#fff' }}>
            {/* Toolbar */}
            <div style={{
                display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '2px',
                padding: '8px 10px',
                borderBottom: '1px solid #e5e7eb',
                backgroundColor: '#f9fafb',
            }}>
                {groupedTools.map((group, gi) => (
                    <div key={gi} style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                        {gi > 0 && (
                            <div style={{
                                width: '1px', height: '24px',
                                backgroundColor: '#d1d5db',
                                margin: '0 6px',
                            }} />
                        )}
                        {group.map((tool) => (
                            <button
                                key={tool.label}
                                type="button"
                                title={tool.label}
                                onClick={tool.action}
                                style={{
                                    width: '34px', height: '34px',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    background: 'none', border: '1px solid transparent',
                                    borderRadius: '6px', cursor: 'pointer',
                                    color: '#374151', transition: 'all 0.15s',
                                }}
                                onMouseEnter={e => {
                                    e.currentTarget.style.backgroundColor = '#e5e7eb'
                                    e.currentTarget.style.borderColor = '#d1d5db'
                                }}
                                onMouseLeave={e => {
                                    e.currentTarget.style.backgroundColor = 'transparent'
                                    e.currentTarget.style.borderColor = 'transparent'
                                }}
                            >
                                <tool.icon size={16} strokeWidth={2} />
                            </button>
                        ))}
                    </div>
                ))}
            </div>

            {/* Editor Area */}
            <div
                ref={editorRef}
                contentEditable
                suppressContentEditableWarning
                onInput={handleInput}
                onBlur={handleInput}
                style={{
                    minHeight: '400px',
                    maxHeight: '700px',
                    overflowY: 'auto',
                    padding: '20px 24px',
                    fontSize: '0.9375rem',
                    lineHeight: 1.8,
                    color: '#1f2937',
                    outline: 'none',
                    fontFamily: 'inherit',
                }}
                data-placeholder="Start writing your blog post..."
            />

            {/* Placeholder CSS + Editor typography */}
            <style>{`
                [data-placeholder]:empty::before {
                    content: attr(data-placeholder);
                    color: #9ca3af;
                    pointer-events: none;
                }
                [contenteditable] h1 { font-size: 1.75rem; font-weight: 700; margin: 1.25rem 0 0.75rem; color: #111827; line-height: 1.3; }
                [contenteditable] h2 { font-size: 1.375rem; font-weight: 600; margin: 1.1rem 0 0.6rem; color: #1f2937; line-height: 1.35; }
                [contenteditable] h3 { font-size: 1.125rem; font-weight: 600; margin: 1rem 0 0.5rem; color: #374151; line-height: 1.4; }
                [contenteditable] p { margin: 0.5rem 0; }
                [contenteditable] ul, [contenteditable] ol { padding-left: 1.5rem; margin: 0.5rem 0; }
                [contenteditable] li { margin: 0.25rem 0; }
                [contenteditable] blockquote {
                    border-left: 3px solid #BFA270;
                    padding: 0.5rem 1rem;
                    margin: 0.75rem 0;
                    background-color: #faf8f5;
                    color: #4b5563;
                    font-style: italic;
                }
                [contenteditable] a { color: #183C38; text-decoration: underline; }
                [contenteditable] img { max-width: 100%; height: auto; border-radius: 8px; margin: 0.75rem 0; }
                [contenteditable] hr { border: none; border-top: 1px solid #e5e7eb; margin: 1.5rem 0; }
            `}</style>
        </div>
    )
}
