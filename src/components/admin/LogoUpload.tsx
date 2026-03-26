import { useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Upload, X, Loader2 } from 'lucide-react'

interface LogoUploadProps {
  currentUrl: string | null
  clientId: string
  onUploaded: (url: string) => void
}

export function LogoUpload({ currentUrl, clientId, onUploaded }: LogoUploadProps) {
  const [uploading, setUploading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 2 * 1024 * 1024) {
      alert('El archivo es muy grande. Máximo 2MB.')
      return
    }

    const allowedTypes = ['image/png', 'image/jpeg', 'image/svg+xml']
    if (!allowedTypes.includes(file.type)) {
      alert('Formato no soportado. Usa PNG, JPG o SVG.')
      return
    }

    setUploading(true)
    const ext = file.name.split('.').pop()
    const path = `${clientId}/logo.${ext}`

    const { error } = await supabase.storage
      .from('client-logos')
      .upload(path, file, { upsert: true })

    if (error) {
      alert('Error subiendo logo: ' + error.message)
      setUploading(false)
      return
    }

    const { data: { publicUrl } } = supabase.storage
      .from('client-logos')
      .getPublicUrl(path)

    // Update client record
    await supabase.from('clients').update({ logo_url: publicUrl }).eq('id', clientId)
    onUploaded(publicUrl)
    setUploading(false)
  }

  return (
    <div className="flex items-center gap-4">
      {currentUrl ? (
        <div className="relative">
          <img src={currentUrl} alt="Logo" className="h-16 w-16 rounded-lg object-cover border" />
          <button
            onClick={() => onUploaded('')}
            className="absolute -top-1 -right-1 h-5 w-5 bg-destructive text-white rounded-full flex items-center justify-center"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      ) : (
        <div className="h-16 w-16 rounded-lg border-2 border-dashed border-border flex items-center justify-center text-muted-foreground">
          <Upload className="h-5 w-5" />
        </div>
      )}
      <div>
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/svg+xml"
          onChange={handleUpload}
          className="hidden"
        />
        <Button
          variant="outline"
          size="sm"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
          {currentUrl ? 'Cambiar logo' : 'Subir logo'}
        </Button>
        <p className="text-xs text-muted-foreground mt-1">PNG, JPG o SVG. Max 2MB</p>
      </div>
    </div>
  )
}
