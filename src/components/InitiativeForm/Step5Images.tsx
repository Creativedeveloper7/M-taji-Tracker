import { useState } from 'react'
import { useFormContext } from 'react-hook-form'
import { Initiative } from '../../types'

const Step5Images = () => {
  const {
    watch,
    setValue,
  } = useFormContext<Partial<Initiative>>()

  const [imagePreviews, setImagePreviews] = useState<Array<{ url: string; file: File }>>([])
  const [imageCaptions, setImageCaptions] = useState<Record<number, string>>({})

  const referenceImages = watch('reference_images') || []

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    const newPreviews: Array<{ url: string; file: File }> = []
    const newImages: string[] = []

    Array.from(files).forEach((file) => {
      if (file.size > 5 * 1024 * 1024) {
        alert(`Image ${file.name} is too large. Maximum size is 5MB.`)
        return
      }

      if (!['image/jpeg', 'image/jpg', 'image/png'].includes(file.type)) {
        alert(`Image ${file.name} must be JPG, JPEG, or PNG.`)
        return
      }

      const reader = new FileReader()
      reader.onload = (event) => {
        const url = event.target?.result as string
        newPreviews.push({ url, file })
        newImages.push(url)

        if (newPreviews.length === Array.from(files).length) {
          setImagePreviews([...imagePreviews, ...newPreviews])
          setValue('reference_images', [...referenceImages, ...newImages])
        }
      }
      reader.readAsDataURL(file)
    })
  }

  const removeImage = (index: number) => {
    const newPreviews = imagePreviews.filter((_, i) => i !== index)
    const newImages = referenceImages.filter((_, i) => i !== index)
    setImagePreviews(newPreviews)
    setValue('reference_images', newImages)
    const newCaptions = { ...imageCaptions }
    delete newCaptions[index]
    setImageCaptions(newCaptions)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()

    const files = e.dataTransfer.files
    if (files.length > 0) {
      const input = document.createElement('input')
      input.type = 'file'
      input.multiple = true
      input.accept = 'image/jpeg,image/jpg,image/png'
      input.files = files
      input.onchange = (event) => {
        handleImageUpload(event as any)
      }
      handleImageUpload({ target: { files } } as any)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-heading font-bold text-mtaji-primary mb-2">Project Images</h3>
        <p className="text-gray-600 text-sm">Upload 3-5 reference images of the current site (max 5MB each)</p>
      </div>

      {imagePreviews.length < 5 && (
        <div
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-mtaji-accent transition-all duration-300 cursor-pointer"
        >
          <input
            type="file"
            accept="image/jpeg,image/jpg,image/png"
            multiple
            onChange={handleImageUpload}
            className="hidden"
            id="image-upload"
            disabled={imagePreviews.length >= 5}
          />
          <label htmlFor="image-upload" className="cursor-pointer">
            <div className="space-y-2">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                stroke="currentColor"
                fill="none"
                viewBox="0 0 48 48"
              >
                <path
                  d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <p className="text-sm text-gray-600">
                <span className="font-semibold text-mtaji-accent">Click to upload</span> or drag and drop
              </p>
              <p className="text-xs text-gray-500">PNG, JPG, JPEG up to 5MB each</p>
            </div>
          </label>
        </div>
      )}

      {imagePreviews.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {imagePreviews.map((preview, index) => (
            <div key={index} className="relative group">
              <div className="aspect-square rounded-xl overflow-hidden border-2 border-gray-200">
                <img
                  src={preview.url}
                  alt={`Preview ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </div>
              <button
                type="button"
                onClick={() => removeImage(index)}
                className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <input
                type="text"
                placeholder="Caption (optional)"
                value={imageCaptions[index] || ''}
                onChange={(e) => setImageCaptions({ ...imageCaptions, [index]: e.target.value })}
                className="mt-2 w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-mtaji-accent"
              />
            </div>
          ))}
        </div>
      )}

      {imagePreviews.length >= 3 && imagePreviews.length < 5 && (
        <p className="text-sm text-mtaji-primary font-medium">
          ✓ Minimum requirement met. You can add up to 2 more images.
        </p>
      )}

      {imagePreviews.length < 3 && (
        <p className="text-sm text-red-500">At least 3 images are required</p>
      )}
    </div>
  )
}

export default Step5Images

