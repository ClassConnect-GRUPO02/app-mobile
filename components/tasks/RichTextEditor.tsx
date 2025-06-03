import React from "react"
import { useState, useRef } from "react"
import { View, StyleSheet } from "react-native"
import { WebView } from "react-native-webview"
import { Text, Button } from "react-native-paper"

interface RichTextEditorProps {
  initialValue?: string
  onValueChange: (value: string) => void
  placeholder?: string
  height?: number
  label?: string
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  initialValue = "",
  onValueChange,
  placeholder = "Escribe aquí...",
  height = 300,
  label,
}) => {
  const [editorReady, setEditorReady] = useState(false)
  const webViewRef = useRef<WebView>(null)
  const [content, setContent] = useState(initialValue)

  // HTML content for the rich text editor
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          margin: 0;
          padding: 8px;
          color: #333;
        }
        #editor {
          min-height: ${height - 40}px;
          outline: none;
          padding: 8px;
          border: 1px solid #e0e0e0;
          border-radius: 4px;
          font-size: 16px;
          line-height: 1.5;
        }
        .toolbar {
          display: flex;
          flex-wrap: wrap;
          padding: 4px;
          background-color: #f5f5f5;
          border: 1px solid #e0e0e0;
          border-radius: 4px;
          margin-bottom: 8px;
        }
        .toolbar button {
          margin: 2px;
          padding: 4px 8px;
          background-color: #fff;
          border: 1px solid #ddd;
          border-radius: 4px;
          cursor: pointer;
        }
        .toolbar button:hover {
          background-color: #f0f0f0;
        }
        [contenteditable=true]:empty:before {
          content: attr(placeholder);
          color: #aaa;
          font-style: italic;
        }
      </style>
    </head>
    <body>
      <div class="toolbar">
        <button onclick="document.execCommand('bold')"><b>B</b></button>
        <button onclick="document.execCommand('italic')"><i>I</i></button>
        <button onclick="document.execCommand('underline')"><u>U</u></button>
        <button onclick="document.execCommand('insertOrderedList')">1.</button>
        <button onclick="document.execCommand('insertUnorderedList')">•</button>
      </div>
      <div id="editor" contenteditable="true" placeholder="${placeholder}">${initialValue}</div>
      <script>
        const editor = document.getElementById('editor');
        
        // Send initial content and ready status
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'ready',
          content: editor.innerHTML
        }));
        
        // Listen for content changes
        editor.addEventListener('input', function() {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'content',
            content: editor.innerHTML
          }));
        });
        
        // Set initial content if provided
        if ('${initialValue}') {
          editor.innerHTML = '${initialValue.replace(/'/g, "\\'")}';
        }
      </script>
    </body>
    </html>
  `

  const handleMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data)

      if (data.type === "ready") {
        setEditorReady(true)
        setContent(data.content)
        onValueChange(data.content)
      } else if (data.type === "content") {
        setContent(data.content)
        onValueChange(data.content)
      }
    } catch (error) {
      console.error("Error parsing WebView message:", error)
    }
  }

  const injectContent = (html: string) => {
    if (webViewRef.current) {
      const script = `
        (function() {
          document.getElementById('editor').innerHTML = ${JSON.stringify(html)};
          true;
        })();
      `
      webViewRef.current.injectJavaScript(script)
    }
  }

  const handleClear = () => {
    injectContent("")
    setContent("")
    onValueChange("")
  }

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <WebView
        ref={webViewRef}
        originWhitelist={["*"]}
        source={{ html: htmlContent }}
        onMessage={handleMessage}
        style={[styles.webView, { height }]}
        scrollEnabled={true}
        javaScriptEnabled={true}
        domStorageEnabled={true}
      />
      <View style={styles.buttonContainer}>
        <Button mode="text" onPress={handleClear} disabled={!editorReady || !content}>
          Limpiar
        </Button>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    fontWeight: "500",
  },
  webView: {
    backgroundColor: "#f9f9f9",
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 8,
  },
})
