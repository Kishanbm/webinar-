'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import { Mark, mergeAttributes, Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';
import { Bold, Italic, Heading2, List, ListOrdered, ImageIcon, LinkIcon, Code, Edit2, Trash2, Check, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useCallback, useState, useEffect, useRef } from 'react';

// Custom extension to highlight text selection when the editor is blurred but user is using the link menus
const BlurredSelectionHighlight = Extension.create({
  name: 'blurredSelectionHighlight',
  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('blurredSelectionHighlight'),
        props: {
          decorations(state) {
            const { selection } = state;
            if (!selection || selection.empty) {
              return DecorationSet.empty;
            }
            
            if (typeof document !== 'undefined') {
              const activeEl = document.activeElement;
              const isBubbleMenuFocused = activeEl && activeEl.closest('.bubble-menu');
              const isToolbarModalFocused = activeEl && activeEl.closest('.toolbar-link-modal');
              
              if (isBubbleMenuFocused || isToolbarModalFocused) {
                return DecorationSet.create(state.doc, [
                  Decoration.inline(selection.from, selection.to, {
                    class: 'blurred-selection-highlight',
                  }),
                ]);
              }
            }
            return DecorationSet.empty;
          },
        },
      }),
    ];
  },
});

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
      class: { default: null },
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
  BlurredSelectionHighlight,
];

interface TipTapEditorProps {
  content: string;
  onChange: (content: string) => void;
}

export default function TipTapEditor({ content, onChange }: TipTapEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkText, setLinkText] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [styleAsButton, setStyleAsButton] = useState(false);

  // Bubble Menu Link State
  const [bubbleLinkUrl, setBubbleLinkUrl] = useState('');
  const [isEditingBubbleLink, setIsEditingBubbleLink] = useState(false);
  const [bubbleMenuPos, setBubbleMenuPos] = useState<{ top: number; left: number } | null>(null);

  const editor = useEditor({
    extensions,
    content,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  // Keep bubbleLinkUrl synced with selected link href
  useEffect(() => {
    if (!editor) return;
    if (editor.isActive('link')) {
      setBubbleLinkUrl(editor.getAttributes('link').href || '');
    }
  }, [editor?.state.selection]);

  // Positioning the custom floating bubble menu above selected text
  useEffect(() => {
    if (!editor) return;

    const updateBubbleMenu = () => {
      const { selection } = editor.state;
      
      // If nothing is selected and cursor is not on a link, hide menu
      if (selection.empty && !editor.isActive('link')) {
        setBubbleMenuPos(null);
        setIsEditingBubbleLink(false);
        return;
      }

      // Small delay to ensure DOM selection has updated
      setTimeout(() => {
        const domSelection = window.getSelection();
        if (!domSelection || domSelection.rangeCount === 0 || !containerRef.current) {
          setBubbleMenuPos(null);
          return;
        }

        try {
          const range = domSelection.getRangeAt(0);
          let rect = range.getBoundingClientRect();

          // Hide if the selection area is empty/invisible AND we are not on a link
          if (rect.width === 0 && rect.height === 0 && !editor.isActive('link')) {
            setBubbleMenuPos(null);
            return;
          }

          // If we are on a link and selection is collapsed (cursor), target the link DOM element itself
          if (editor.isActive('link') && (rect.width === 0 || selection.empty)) {
            let node: Node | null = domSelection.anchorNode;
            while (node && node !== containerRef.current) {
              if (node.nodeName === 'A') {
                rect = (node as Element).getBoundingClientRect();
                break;
              }
              node = node.parentNode;
            }
          }

          const containerRect = containerRef.current.getBoundingClientRect();

          // Position the bubble menu above the selection, relative to the container
          const top = rect.top - containerRect.top - 48;
          const left = rect.left - containerRect.left + rect.width / 2;

          setBubbleMenuPos({ top, left });
        } catch (e) {
          // Range error fallback
          setBubbleMenuPos(null);
        }
      }, 20);
    };

    editor.on('selectionUpdate', updateBubbleMenu);
    editor.on('focus', updateBubbleMenu);
    
    // Hide bubble menu on blur, unless focus shifts to the bubble menu inputs or modal
    const handleBlur = () => {
      setTimeout(() => {
        const activeEl = document.activeElement;
        if (!activeEl?.closest('.bubble-menu') && !activeEl?.closest('.toolbar-link-modal')) {
          setBubbleMenuPos(null);
        }
      }, 200);
    };
    editor.on('blur', handleBlur);

    return () => {
      editor.off('selectionUpdate', updateBubbleMenu);
      editor.off('focus', updateBubbleMenu);
      editor.off('blur', handleBlur);
    };
  }, [editor]);

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

  // Insert Custom Link or Button Link from the top toolbar
  const handleInsertToolbarLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editor || !linkUrl) return;

    let targetUrl = linkUrl;
    // Add protocol prefix if missing
    if (!/^https?:\/\//i.test(targetUrl)) {
      targetUrl = 'https://' + targetUrl;
    }

    const textToInsert = linkText || targetUrl;

    if (styleAsButton) {
      editor
        .chain()
        .focus()
        .insertContent(
          `<a href="${targetUrl}" class="blog-button" target="_blank">${textToInsert}</a>`
        )
        .run();
    } else {
      editor
        .chain()
        .focus()
        .insertContent(
          `<a href="${targetUrl}" target="_blank">${textToInsert}</a>`
        )
        .run();
    }

    // Reset fields
    setLinkText('');
    setLinkUrl('');
    setStyleAsButton(false);
    setShowLinkModal(false);
  };

  // Set link inside the bubble menu (inline formatting)
  const applyInlineBubbleLink = () => {
    if (!editor || !bubbleLinkUrl) return;
    
    let targetUrl = bubbleLinkUrl;
    if (!/^https?:\/\//i.test(targetUrl)) {
      targetUrl = 'https://' + targetUrl;
    }

    editor
      .chain()
      .focus()
      .extendMarkRange('link')
      .setLink({ href: targetUrl })
      .run();
    setIsEditingBubbleLink(false);
  };

  // Remove link inside the bubble menu (unlink)
  const removeInlineBubbleLink = () => {
    if (!editor) return;
    editor
      .chain()
      .focus()
      .extendMarkRange('link')
      .unsetLink()
      .run();
    setIsEditingBubbleLink(false);
    setBubbleLinkUrl('');
  };

  if (!editor) return null;

  return (
    <div ref={containerRef} style={{ display: 'flex', flexDirection: 'column', position: 'relative' }}>
      
      {/* ── CUSTOM FLOATING BUBBLE MENU ── */}
      {bubbleMenuPos && (
        <div 
          className="bubble-menu"
          style={{
            position: 'absolute',
            top: `${bubbleMenuPos.top}px`,
            left: `${bubbleMenuPos.left}px`,
            transform: 'translateX(-50%)',
            zIndex: 90,
          }}
        >
          {isEditingBubbleLink ? (
            /* Inline Link input inside the bubble menu */
            <div className="bubble-menu-input-container">
              <input
                type="text"
                placeholder="Paste or type link..."
                value={bubbleLinkUrl}
                onChange={(e) => setBubbleLinkUrl(e.target.value)}
                className="bubble-menu-input"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') applyInlineBubbleLink();
                  if (e.key === 'Escape') setIsEditingBubbleLink(false);
                }}
              />
              <button type="button" onClick={applyInlineBubbleLink} className="toolbar-btn" style={{ color: '#10b981' }}>
                <Check size={16} />
              </button>
              <button type="button" onClick={() => setIsEditingBubbleLink(false)} className="toolbar-btn" style={{ color: '#ef4444' }}>
                <X size={16} />
              </button>
            </div>
          ) : editor.isActive('link') ? (
            /* Current Link Viewer */
            <div className="bubble-menu-link-view">
              <a href={editor.getAttributes('link').href} target="_blank" rel="noopener noreferrer">
                {editor.getAttributes('link').href}
              </a>
              <div className="bubble-divider"></div>
              <button
                type="button"
                onClick={() => {
                  setBubbleLinkUrl(editor.getAttributes('link').href || '');
                  setIsEditingBubbleLink(true);
                }}
                className="toolbar-btn"
                title="Edit Link"
              >
                <Edit2 size={14} />
              </button>
              <button
                type="button"
                onClick={removeInlineBubbleLink}
                className="toolbar-btn"
                title="Unlink"
                style={{ color: '#ef4444' }}
              >
                <Trash2 size={14} />
              </button>
            </div>
          ) : (
            /* Basic Formatting Bubble Menu */
            <>
              <button type="button" onClick={() => editor.chain().focus().toggleBold().run()} className={`toolbar-btn ${editor.isActive('bold') ? 'is-active' : ''}`}>
                <Bold size={16} />
              </button>
              <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()} className={`toolbar-btn ${editor.isActive('italic') ? 'is-active' : ''}`}>
                <Italic size={16} />
              </button>
              <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={`toolbar-btn ${editor.isActive('heading', { level: 2 }) ? 'is-active' : ''}`}>
                <Heading2 size={16} />
              </button>
              <div className="bubble-divider"></div>
              <button
                type="button"
                onClick={() => {
                  setBubbleLinkUrl('');
                  setIsEditingBubbleLink(true);
                }}
                className="toolbar-btn"
                title="Add Link"
              >
                <LinkIcon size={16} />
              </button>
            </>
          )}
        </div>
      )}

      {/* ── TOP EDITOR TOOLBAR ── */}
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
        
        <button type="button" onClick={uploadImage} className="toolbar-btn" title="Insert Image">
          <ImageIcon size={18} />
        </button>
        <button
          type="button"
          onClick={() => {
            const selectedText = editor.state.doc.textBetween(editor.state.selection.from, editor.state.selection.to);
            setLinkText(selectedText);
            setShowLinkModal(!showLinkModal);
          }}
          className={`toolbar-btn ${showLinkModal ? 'is-active' : ''}`}
          title="Insert Link/Button"
        >
          <LinkIcon size={18} />
        </button>
      </div>
      
      {/* ── TOP TOOLBAR LINK/BUTTON INSERTION MODAL ── */}
      {showLinkModal && (
        <div 
          className="toolbar-link-modal"
          style={{
            padding: '20px',
            borderBottom: '1px solid var(--border-color)',
            background: 'white',
            borderLeft: '1px solid var(--border-color)',
            borderRight: '1px solid var(--border-color)',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px'
          }}
        >
          <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: 'var(--primary-color)' }}>
            Insert Link or Button
          </h4>
          
          <form onSubmit={handleInsertToolbarLink} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 120px 80px', gap: '12px', alignItems: 'end' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontSize: '12px' }}>Link Text (optional)</label>
              <input
                type="text"
                value={linkText}
                onChange={e => setLinkText(e.target.value)}
                placeholder="e.g. Join Now"
                className="form-input"
                style={{ padding: '6px 12px', minHeight: '34px' }}
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontSize: '12px' }}>Link URL</label>
              <input 
                type="text" 
                value={linkUrl} 
                onChange={e => setLinkUrl(e.target.value)} 
                placeholder="e.g. navigationtrading.com" 
                className="form-input" 
                style={{ padding: '6px 12px', minHeight: '34px' }}
                required
                autoFocus
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label className="form-label" style={{ fontSize: '12px', marginBottom: 0 }}>Style as Button</label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', cursor: 'pointer', height: '34px' }}>
                <input
                  type="checkbox"
                  checked={styleAsButton}
                  onChange={e => setStyleAsButton(e.target.checked)}
                  style={{ width: '16px', height: '16px' }}
                />
                Yes
              </label>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button 
                type="submit"
                className="btn-primary" 
                style={{ padding: '6px 16px', fontSize: '13px', minHeight: '34px', width: '100%', justifyContent: 'center' }}
              >
                Insert
              </button>
            </div>
          </form>
        </div>
      )}
      
      <EditorContent editor={editor} />
    </div>
  );
}
