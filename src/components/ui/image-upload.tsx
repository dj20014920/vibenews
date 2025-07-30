import { useState, useRef } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/integrations/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ImageUploadProps {
  bucket: 'avatars' | 'post-images' | 'news-images'
  onUploadComplete?: (url: string) => void
  onUploadError?: (error: string) => void
  maxSize?: number // in MB
  className?: string
  accept?: string
  placeholder?: string
}

export function ImageUpload({
  bucket,
  onUploadComplete,
  onUploadError,
  maxSize = 10,
  className,
  accept = 'image/*',
  placeholder = '이미지를 선택하거나 드래그하세요'
}: ImageUploadProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)

  const validateFile = (file: File): string | null => {
    // File size check
    if (file.size > maxSize * 1024 * 1024) {
      return `파일 크기는 ${maxSize}MB 이하여야 합니다.`
    }

    // File type check
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (!allowedTypes.includes(file.type)) {
      return '지원되지 않는 파일 형식입니다. (JPEG, PNG, WebP, GIF만 허용)'
    }

    // Security: Check file name
    const fileName = file.name.toLowerCase()
    const dangerousExtensions = ['.exe', '.js', '.php', '.html', '.htm']
    if (dangerousExtensions.some(ext => fileName.endsWith(ext))) {
      return '보안상 허용되지 않는 파일입니다.'
    }

    return null
  }

  const generateSecureFileName = (originalName: string): string => {
    const timestamp = Date.now()
    const randomString = Math.random().toString(36).substring(2, 15)
    const extension = originalName.split('.').pop()?.toLowerCase()
    
    // Sanitize filename
    const baseName = originalName
      .replace(/[^a-zA-Z0-9.-]/g, '_')
      .replace(/_{2,}/g, '_')
      .substring(0, 50)
    
    return `${timestamp}_${randomString}_${baseName}.${extension}`
  }

  const uploadFile = async (file: File) => {
    if (!user) {
      const error = '로그인이 필요합니다.'
      onUploadError?.(error)
      toast({
        title: '업로드 실패',
        description: error,
        variant: 'destructive',
      })
      return
    }

    const validationError = validateFile(file)
    if (validationError) {
      onUploadError?.(validationError)
      toast({
        title: '업로드 실패',
        description: validationError,
        variant: 'destructive',
      })
      return
    }

    setUploading(true)

    try {
      const fileName = generateSecureFileName(file.name)
      const filePath = `${user.id}/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) {
        throw uploadError
      }

      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath)

      setPreview(publicUrl)
      onUploadComplete?.(publicUrl)
      
      toast({
        title: '업로드 성공',
        description: '이미지가 성공적으로 업로드되었습니다.',
      })
    } catch (error: any) {
      const errorMessage = error.message || '업로드 중 오류가 발생했습니다.'
      onUploadError?.(errorMessage)
      toast({
        title: '업로드 실패',
        description: errorMessage,
        variant: 'destructive',
      })
    } finally {
      setUploading(false)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      uploadFile(file)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    
    const file = e.dataTransfer.files[0]
    if (file) {
      uploadFile(file)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
  }

  const clearPreview = () => {
    setPreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className={cn('w-full', className)}>
      <div
        className={cn(
          'relative border-2 border-dashed rounded-xl p-6 transition-all duration-200',
          dragOver
            ? 'border-primary bg-primary/5'
            : 'border-border hover:border-primary/50',
          uploading && 'pointer-events-none opacity-50'
        )}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          onChange={handleFileSelect}
          className="hidden"
          disabled={uploading}
        />

        {preview ? (
          <div className="space-y-4">
            <div className="relative group">
              <img
                src={preview}
                alt="미리보기"
                className="w-full h-48 object-cover rounded-lg"
              />
              <Button
                variant="destructive"
                size="sm"
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={clearPreview}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-sm text-muted-foreground text-center">
              이미지가 업로드되었습니다
            </p>
          </div>
        ) : (
          <div className="text-center space-y-4">
            {uploading ? (
              <>
                <Loader2 className="h-12 w-12 mx-auto text-primary animate-spin" />
                <p className="text-sm text-muted-foreground">업로드 중...</p>
              </>
            ) : (
              <>
                <div className="flex justify-center">
                  <div className="p-3 rounded-full bg-primary/10">
                    <ImageIcon className="h-8 w-8 text-primary" />
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium">{placeholder}</p>
                  <p className="text-xs text-muted-foreground">
                    최대 {maxSize}MB, JPEG/PNG/WebP/GIF 형식
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="mx-auto"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  파일 선택
                </Button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}