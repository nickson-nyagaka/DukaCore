'use client'

import React, { useRef, useCallback } from 'react'

interface RichTextEditorProps {
  value: string
  onChange: (content: string) => void
  placeholder?: string
}

export default function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null)

  const execCmd = useCallback((command: string, val?: string) => {
    document.execCommand(command, false, val)
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML)
    }
  }, [onChange])

  const handleInput = useCallback(() => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML)
    }
  }, [onChange])

  const handlePaste = useCallback((e: React.ClipboardEvent<HTMLDivElement>) => {
    // Allow rich paste (tables, formatting) but strip dangerous attributes
    e.preventDefault()
    const html = e.clipboardData.getData('text/html')
    const text = e.clipboardData.getData('text/plain')
    if (html) {
      // Sanitize: strip script tags and event handlers only
      const clean = html
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
        .replace(/\son\w+="[^"]*"/gi, '')
        .replace(/\son\w+='[^']*'/gi, '')
      document.execCommand('insertHTML', false, clean)
    } else {
      document.execCommand('insertText', false, text)
    }
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML)
    }
  }, [onChange])

  const toolbarBtn = (label: string, cmd: string, val?: string, title?: string) => (
    <button
      type="button"
      title={title || label}
      onMouseDown={(e) => { e.preventDefault(); execCmd(cmd, val) }}
      className="px-2 py-1 text-sm rounded hover:bg-primary/20 hover:text-primary transition-colors font-medium"
    >
      {label}
    </button>
  )

  return (
    <div className="rich-text-editor-wrapper border border-border rounded-lg overflow-hidden bg-background">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-0.5 p-2 border-b border-border bg-muted/30 items-center">
        {toolbarBtn('B', 'bold', undefined, 'Bold')}
        {toolbarBtn('I', 'italic', undefined, 'Italic')}
        {toolbarBtn('U', 'underline', undefined, 'Underline')}
        {toolbarBtn('S̶', 'strikeThrough', undefined, 'Strikethrough')}
        <span className="w-px h-5 bg-border mx-1" />
        {toolbarBtn('H1', 'formatBlock', 'h1', 'Heading 1')}
        {toolbarBtn('H2', 'formatBlock', 'h2', 'Heading 2')}
        {toolbarBtn('H3', 'formatBlock', 'h3', 'Heading 3')}
        <span className="w-px h-5 bg-border mx-1" />
        {toolbarBtn('OL', 'insertOrderedList', undefined, 'Ordered List')}
        {toolbarBtn('UL', 'insertUnorderedList', undefined, 'Bullet List')}
        <span className="w-px h-5 bg-border mx-1" />
        <button
          type="button"
          title="Insert Link"
          onMouseDown={(e) => {
            e.preventDefault()
            const url = prompt('Enter URL:')
            if (url) execCmd('createLink', url)
          }}
          className="px-2 py-1 text-sm rounded hover:bg-primary/20 hover:text-primary transition-colors"
        >
          🔗
        </button>
        {toolbarBtn('✕', 'removeFormat', undefined, 'Clear Formatting')}
      </div>

      {/* Editable area */}
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        onPaste={handlePaste}
        dangerouslySetInnerHTML={{ __html: value }}
        className="dynamic-content min-h-[200px] p-4 outline-none text-sm"
        style={{ lineHeight: '1.6' }}
        data-placeholder={placeholder || 'Write description...'}
      />

      <style>{`
        [contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: var(--muted);
          pointer-events: none;
        }
        .dynamic-content table { border-collapse: collapse; width: 100%; margin: 0.5rem 0; }
        .dynamic-content td, .dynamic-content th { border: 1px solid var(--border); padding: 6px 10px; }
        .dynamic-content th { background: var(--muted); font-weight: 600; }
      `}</style>
    </div>
  )
}

