'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import Underline from '@tiptap/extension-underline'
import TextAlign from '@tiptap/extension-text-align'
import { TextStyle } from '@tiptap/extension-text-style'
import Color from '@tiptap/extension-color'
import Placeholder from '@tiptap/extension-placeholder'
import { useEffect, useCallback } from 'react'
import {
    Bold, Italic, Underline as UnderlineIcon, Link as LinkIcon,
    List, ListOrdered, AlignLeft, AlignCenter, AlignRight,
    Heading1, Heading2, Minus, Undo, Redo, Type,
} from 'lucide-react'

const VARIABLES = [
    '{{name}}', '{{email}}', '{{phone}}',
    '{{property_name}}', '{{property_price}}', '{{property_location}}',
    '{{visit_date}}', '{{visit_time}}', '{{agent_name}}',
]

interface Props {
    value: string          // inner content HTML (not full branded HTML)
    onChange: (html: string) => void
}

function ToolbarButton({
    onClick, active = false, title, children,
}: { onClick: () => void; active?: boolean; title: string; children: React.ReactNode }) {
    return (
        <button
            type="button"
            onMouseDown={e => { e.preventDefault(); onClick() }}
            title={title}
            style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                width: '30px', height: '30px', borderRadius: '5px', border: 'none',
                cursor: 'pointer', flexShrink: 0,
                background: active ? '#183C38' : 'transparent',
                color: active ? '#fff' : '#444',
                transition: 'background 0.15s',
            }}
        >
            {children}
        </button>
    )
}

function Divider() {
    return <div style={{ width: '1px', height: '20px', background: '#ddd', margin: '0 4px', flexShrink: 0 }} />
}

export default function RichEmailEditor({ value, onChange }: Props) {
    const editor = useEditor({
        extensions: [
            StarterKit,
            Underline,
            Link.configure({ openOnClick: false }),
            TextAlign.configure({ types: ['heading', 'paragraph'] }),
            TextStyle,
            Color,
            Placeholder.configure({ placeholder: 'Write your email content here…' }),
        ],
        content: value || '',
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML())
        },
        editorProps: {
            attributes: {
                style: 'min-height:260px;padding:16px;outline:none;font-size:15px;line-height:1.7;color:#222;',
            },
        },
    })

    // Sync external value changes (e.g. switching templates)
    useEffect(() => {
        if (editor && value !== editor.getHTML()) {
            editor.commands.setContent(value || '', { emitUpdate: false })
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [value])

    const setLink = useCallback(() => {
        if (!editor) return
        const prev = editor.getAttributes('link').href || ''
        const url = window.prompt('URL', prev)
        if (url === null) return
        if (url === '') { editor.chain().focus().unsetLink().run(); return }
        editor.chain().focus().setLink({ href: url }).run()
    }, [editor])

    const insertVariable = useCallback((v: string) => {
        editor?.chain().focus().insertContent(v).run()
    }, [editor])

    if (!editor) return null

    return (
        <div style={{ border: '1px solid #dde1e7', borderRadius: '8px', overflow: 'hidden', background: '#fff' }}>
            {/* Toolbar */}
            <div style={{
                display: 'flex', flexWrap: 'wrap', gap: '2px', alignItems: 'center',
                padding: '8px 10px', borderBottom: '1px solid #dde1e7', background: '#f8f9fa',
            }}>
                {/* Undo / Redo */}
                <ToolbarButton title="Undo" onClick={() => editor.chain().focus().undo().run()}>
                    <Undo size={14} />
                </ToolbarButton>
                <ToolbarButton title="Redo" onClick={() => editor.chain().focus().redo().run()}>
                    <Redo size={14} />
                </ToolbarButton>
                <Divider />

                {/* Headings */}
                <ToolbarButton title="Heading 1" active={editor.isActive('heading', { level: 1 })}
                    onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}>
                    <Heading1 size={14} />
                </ToolbarButton>
                <ToolbarButton title="Heading 2" active={editor.isActive('heading', { level: 2 })}
                    onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
                    <Heading2 size={14} />
                </ToolbarButton>
                <ToolbarButton title="Normal text" active={editor.isActive('paragraph')}
                    onClick={() => editor.chain().focus().setParagraph().run()}>
                    <Type size={14} />
                </ToolbarButton>
                <Divider />

                {/* Format */}
                <ToolbarButton title="Bold" active={editor.isActive('bold')}
                    onClick={() => editor.chain().focus().toggleBold().run()}>
                    <Bold size={14} />
                </ToolbarButton>
                <ToolbarButton title="Italic" active={editor.isActive('italic')}
                    onClick={() => editor.chain().focus().toggleItalic().run()}>
                    <Italic size={14} />
                </ToolbarButton>
                <ToolbarButton title="Underline" active={editor.isActive('underline')}
                    onClick={() => editor.chain().focus().toggleUnderline().run()}>
                    <UnderlineIcon size={14} />
                </ToolbarButton>
                <Divider />

                {/* Lists */}
                <ToolbarButton title="Bullet list" active={editor.isActive('bulletList')}
                    onClick={() => editor.chain().focus().toggleBulletList().run()}>
                    <List size={14} />
                </ToolbarButton>
                <ToolbarButton title="Numbered list" active={editor.isActive('orderedList')}
                    onClick={() => editor.chain().focus().toggleOrderedList().run()}>
                    <ListOrdered size={14} />
                </ToolbarButton>
                <Divider />

                {/* Alignment */}
                <ToolbarButton title="Align left" active={editor.isActive({ textAlign: 'left' })}
                    onClick={() => editor.chain().focus().setTextAlign('left').run()}>
                    <AlignLeft size={14} />
                </ToolbarButton>
                <ToolbarButton title="Align center" active={editor.isActive({ textAlign: 'center' })}
                    onClick={() => editor.chain().focus().setTextAlign('center').run()}>
                    <AlignCenter size={14} />
                </ToolbarButton>
                <ToolbarButton title="Align right" active={editor.isActive({ textAlign: 'right' })}
                    onClick={() => editor.chain().focus().setTextAlign('right').run()}>
                    <AlignRight size={14} />
                </ToolbarButton>
                <Divider />

                {/* Link */}
                <ToolbarButton title="Link" active={editor.isActive('link')} onClick={setLink}>
                    <LinkIcon size={14} />
                </ToolbarButton>

                {/* Divider line */}
                <ToolbarButton title="Horizontal rule"
                    onClick={() => editor.chain().focus().setHorizontalRule().run()}>
                    <Minus size={14} />
                </ToolbarButton>
                <Divider />

                {/* Color */}
                <label title="Text colour" style={{ display: 'inline-flex', alignItems: 'center', cursor: 'pointer', position: 'relative' }}>
                    <span style={{
                        width: '30px', height: '30px', borderRadius: '5px', border: '1px solid #ddd',
                        background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '13px', fontWeight: 700, color: editor.getAttributes('textStyle').color || '#444',
                    }}>A</span>
                    <input type="color" defaultValue="#183C38"
                        onChange={e => editor.chain().focus().setColor(e.target.value).run()}
                        style={{ position: 'absolute', opacity: 0, width: '30px', height: '30px', cursor: 'pointer' }} />
                </label>
                <Divider />

                {/* Insert variable */}
                <select
                    defaultValue=""
                    onChange={e => { if (e.target.value) { insertVariable(e.target.value); e.target.value = '' } }}
                    style={{
                        fontSize: '12px', padding: '3px 6px', border: '1px solid #ddd',
                        borderRadius: '5px', background: '#fff', color: '#444', cursor: 'pointer', height: '30px',
                    }}
                    title="Insert variable"
                >
                    <option value="">Insert variable…</option>
                    {VARIABLES.map(v => <option key={v} value={v}>{v}</option>)}
                </select>
            </div>

            {/* Editor area */}
            <EditorContent editor={editor} />

            <style>{`
                .ProseMirror p.is-editor-empty:first-child::before {
                    content: attr(data-placeholder);
                    float: left;
                    color: #adb5bd;
                    pointer-events: none;
                    height: 0;
                }
                .ProseMirror a { color: #183C38; text-decoration: underline; }
                .ProseMirror ul { list-style: disc; padding-left: 1.5em; }
                .ProseMirror ol { list-style: decimal; padding-left: 1.5em; }
                .ProseMirror h1 { font-size: 1.6em; font-weight: 700; margin: 0.5em 0; }
                .ProseMirror h2 { font-size: 1.3em; font-weight: 600; margin: 0.5em 0; }
                .ProseMirror hr { border: none; border-top: 1px solid #eee; margin: 1em 0; }
                .ProseMirror blockquote { border-left: 3px solid #183C38; padding-left: 1em; color: #555; }
            `}</style>
        </div>
    )
}
