import { useState, useCallback } from "react"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../ui/tabs/tabs.jsx"
import "../ui/tabs/tabs.css"

function CopyIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

export function CodeBlock({ code, language, className }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }, [code])

  return (
    <div className={`pg-code-block${className ? ` ${className}` : ""}`}>
      <button
        type="button"
        className="pg-code-copy"
        onClick={handleCopy}
        aria-label={copied ? "Copied" : "Copy code"}
      >
        {copied ? <CheckIcon /> : <CopyIcon />}
      </button>
      <pre className="pg-code-pre">
        <code data-language={language}>{code}</code>
      </pre>
    </div>
  )
}

export function ComponentPreview({ children, code, className }) {
  return (
    <div className={`pg-preview${className ? ` ${className}` : ""}`}>
      <Tabs defaultValue="preview">
        <div className="pg-preview-toolbar">
          <TabsList>
            <TabsTrigger value="preview">Preview</TabsTrigger>
            <TabsTrigger value="code">Code</TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="preview" className="pg-preview-panel">
          <div className="pg-preview-content">
            {children}
          </div>
        </TabsContent>
        <TabsContent value="code" className="pg-preview-code">
          <CodeBlock code={code} language="jsx" />
        </TabsContent>
      </Tabs>
    </div>
  )
}
