'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import { Mark, mergeAttributes } from '@tiptap/core';
import { Bold, Italic, Heading2, List, ListOrdered, ImageIcon, LinkIcon, Code } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useCallback, useState } from 'react';

// Custom Minimal Link Mark to bypass the official extension's crashing bugs
const CustomLink = Mark.create({
  name: 'link',
  priority: 1000,
  keepOnSplit: false,
  inclusive: false,
  addAttributes() {
    return {
      href: { default: null },
      target: { default: '_blank' },
    }
  },
  parseHTML() {
    return [{ tag: 'a[href]' }]
  },
  renderHTML({ HTMLAttributes }) {
    return ['a', mergeAttributes(HTMLAttributes), 0]
  },
  addCommands() {
    return {
      setLink: (attributes) => ({ commands }) => {
        return commands.setMark(this.name, attributes)
      },
      unsetLink: () => ({ commands }) => {
        return commands.unsetMark(this.name)
      },
    }
  },
});

const extensions = [
  StarterKit,
  Image,
  CustomLink,
];

interface TipTapEditorProps {
  content: string;
  onChange: (content: string) => void;
}

export default function TipTapEditor({ content, onChange }: TipTapEditorProps) {
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');

  const editor = useEditor({
    extensions,
    content,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  const uploadImage = useCallback(async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `blog-images/${fileName}`;

        // Upload to Supabase Storage
        const { error: uploadError } = await supabase.storage
          .from('images') // Assumes a public bucket named 'images'
          .upload(filePath, file);

        if (uploadError) {
          throw uploadError;
        }

        const { data } = supabase.storage.from('images').getPublicUrl(filePath);
        
        editor?.chain().focus().setImage({ src: data.publicUrl }).run();
      } catch (error) {
        console.error('Error uploading image:', error);
        alert('Error uploading image. Make sure you have a public bucket named "images".');
      }
    };
    input.click();
  }, [editor]);

  if (!editor) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <div className="editor-toolbar">
        <button type="button" onClick={() => editor.chain().focus().toggleBold().run()} className={`toolbar-btn ${editor.isActive('bold') ? 'is-active' : ''}`}>
          <Bold size={18} />
        </button>
        <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()} className={`toolbar-btn ${editor.isActive('italic') ? 'is-active' : ''}`}>
          <Italic size={18} />
        </button>
        <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={`toolbar-btn ${editor.isActive('heading', { level: 2 }) ? 'is-active' : ''}`}>
          <Heading2 size={18} />
        </button>
        <button type="button" onClick={() => editor.chain().focus().toggleBulletList().run()} className={`toolbar-btn ${editor.isActive('bulletList') ? 'is-active' : ''}`}>
          <List size={18} />
        </button>
        <button type="button" onClick={() => editor.chain().focus().toggleOrderedList().run()} className={`toolbar-btn ${editor.isActive('orderedList') ? 'is-active' : ''}`}>
          <ListOrdered size={18} />
        </button>
        <button type="button" onClick={() => editor.chain().focus().toggleCodeBlock().run()} className={`toolbar-btn ${editor.isActive('codeBlock') ? 'is-active' : ''}`}>
          <Code size={18} />
        </button>
        
        <div style={{ width: '1px', background: 'var(--border-color)', margin: '0 8px' }}></div>
        
        <button type="button" onClick={uploadImage} className="toolbar-btn">
          <ImageIcon size={18} />
        </button>
        <button type="button" onClick={() => setShowLinkInput(!showLinkInput)} className={`toolbar-btn ${editor.isActive('link') ? 'is-active' : ''}`}>
          <LinkIcon size={18} />
        </button>
      </div>
      
      {/* Inline Link Input UI */}
      {showLinkInput && (
        <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-main)', display: 'flex', gap: '8px', alignItems: 'center' }}>
          <input 
            type="url" 
            value={linkUrl} 
            onChange={e => setLinkUrl(e.target.value)} 
            placeholder="https://example.com" 
            className="form-input" 
            style={{ padding: '6px 12px', minHeight: '32px', flex: 1 }}
            autoFocus
          />
          <button 
            type="button" 
            onClick={() => {
              if (linkUrl) {
                editor.chain().focus().setLink({ href: linkUrl }).run();
              } else {
                editor.chain().focus().unsetLink().run();
              }
              setShowLinkInput(false);
              setLinkUrl('');
            }} 
            className="btn-primary" 
            style={{ padding: '6px 16px', fontSize: '13px' }}
          >
            Apply Link
          </button>
        </div>
      )}
      
      <EditorContent editor={editor} />
    </div>
  );
}
